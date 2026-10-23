import { randomUUID } from 'node:crypto';
import { RouteError, standardPrompt, terminal, type Action, type ActionReceipt, type Conversation, type ConversationBackend, type Framework } from './contract.ts';
import { StateStore, digest } from './store.ts';
import type { DiscoveryScope } from './contract.ts';

export interface Actor { key: string; userId: string; recipient: string; eventCursor: number; text: string; eventAt: number }
export interface CandidateSet { id: string; expiresAt: number; candidates: Conversation[]; unavailableFrameworks?: Record<string, string>; discoveryWarnings?: Record<string, string[]>; searchScope?: DiscoveryScope; emptyReason?: 'NO_MATCH_WITHIN_DELEGATED_SCOPE' | 'NO_MATCH_IN_AVAILABLE_FRAMEWORKS' }
export interface Selection { target: Conversation; expiresAt: number }
export interface Draft { id: string; target: Conversation; action: Action; prompt?: string; expiresAt: number }
interface StoredDraft extends Draft { actorKey: string; recipient: string; eventCursor: number }
interface Operation { actorKey: string; recipient: string; target: Conversation; phase: 'sending' | 'observing' | 'terminal'; receipt: ActionReceipt; reportSequence?: number }
export interface Report { id: string; recipient: string; receipt: ActionReceipt; target: Conversation }
export const isOrdinaryReceipt = (receipt: ActionReceipt): boolean => ['accepted', 'running'].includes(receipt.status)
  && (!receipt.errorCode || receipt.errorCode === 'BACKGROUND_JOBS_ACTIVE');
const receiptProgressSignature = (receipt: ActionReceipt): string => digest([receipt.status, receipt.turnId ?? '', receipt.errorCode ?? '',
  isOrdinaryReceipt(receipt) ? receipt.answer ?? '' : '']);
export interface DeferredReports {
  framework: Framework;
  targetId: string;
  operationId: string;
  source: string;
  count: number;
  counts: { accepted: number; running: number };
  firstAt: string;
  lastAt: string;
  lastReportId: string;
}
export interface ReportNotification { report: Report; reason: string; deferred?: DeferredReports }
interface Notifications {
  deferred: Record<string, DeferredReports>;
  pending: Record<string, ReportNotification>;
  saved: Record<string, { hostCursor: number; at: string }>;
  progress?: Record<string, Report>;
  lastProgressAt?: Record<string, number>;
}
interface State { sets: Record<string, CandidateSet & { actorKey: string }>; selections: Record<string, Selection>; drafts: Record<string, StoredDraft>; consumed: Record<string, string>; operations: Record<string, Operation>; reports: Record<string, Report>; notifications?: Notifications; progressFeed?: { feedId: string; cursor: number; baselineAt: string } }
export interface RouterOptions { backend: ConversationBackend; stateFile: string; operatorIds: string[]; eventTtlMs: number; selectionTtlMs: number; clock?: () => number; backendIdentity?: unknown; assertControl?: () => void }
interface InputEvent { cursor: number; type: string; source: string; origin: string; ts: string; text: string; senderKey?: string; meta?: Record<string, unknown> }
const numericId = (value: unknown): string => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? String(value) : typeof value === 'string' && /^[1-9]\d{4,19}$/.test(value) ? value : '';
const intent: Record<Action, RegExp> = { pause: /暂停|停止|中断|pause|stop|interrupt/i, continue: /继续|恢复|resume|continue/i, check: /检查|查看.{0,8}(状态|现状)|check|inspect/i, send: /发送|输入|下达|执行|send/i };
const deniedIntent = /(?:不要|别|勿|不能|不允许|don't|do not).{0,8}(?:暂停|停止|中断|继续|恢复|检查|发送|输入|执行|pause|stop|continue|send)/i;
const isConfirmation = (text: string): boolean => !/[?？]|吗|是否|如果|不要|别|取消|不同意|不确认|不执行|拒绝|don't|do not/i.test(text)
  && /(?:^|[，,。.!！\s])(?:我确认|确认执行|确认|同意执行|执行吧|就这个|confirm|proceed)(?=$|[，,。.!！\s])/i.test(text.trim());

/** Persona chooses relevance; this owner binds identities, snapshots and side effects. */
export class ConversationRouter {
  private store: StateStore<State>;
  private clock: () => number;
  private authorized = new WeakSet<Actor>();
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private options: RouterOptions) {
    this.clock = options.clock ?? Date.now;
    if (!options.operatorIds.length || options.operatorIds.some(id => !numericId(id))) throw new RouteError('INVALID_CONFIG', 'Explicit numeric QQ operator IDs required.');
    if (!Number.isSafeInteger(options.eventTtlMs) || options.eventTtlMs < 1000 || !Number.isSafeInteger(options.selectionTtlMs) || options.selectionTtlMs < 1000) throw new RouteError('INVALID_CONFIG', 'Invalid event or selection TTL.');
    this.store = new StateStore(options.stateFile, { component: 'conversationcontrol', operators: [...options.operatorIds].sort(), backend: options.backendIdentity ?? null, schema: 1 }, { sets: {}, selections: {}, drafts: {}, consumed: {}, operations: {}, reports: {} });
    const interrupted = Object.values(this.store.read().operations).filter(op => op.phase === 'sending');
    if (interrupted.length) this.store.update(state => {
      for (const op of Object.values(state.operations)) if (op.phase === 'sending') {
        op.phase = 'terminal'; op.receipt = { ...op.receipt, status: 'unknown', at: this.iso(), errorCode: 'RESTART_DURING_SUBMISSION', detail: 'Submission outcome is unknown. Preserve this operation ID; do not resubmit.' }; this.report(state, op);
      }
    });
  }
  authorize(event: InputEvent | undefined): Actor {
    if (!event || event.source !== 'qq' || event.type !== 'qq.message' || event.origin !== 'external' || !Number.isSafeInteger(event.cursor) || event.cursor < 1) throw new RouteError('UNTRUSTED_ORIGIN', 'A stored incoming QQ human event is required.');
    const userId = numericId(event.meta?.user_id), sender = numericId(event.senderKey), conv = event.meta?.conv as { kind?: unknown; id?: unknown } | undefined;
    const convId = numericId(conv?.id), at = Date.parse(event.ts), now = this.clock();
    if (!userId || sender !== userId || !this.options.operatorIds.includes(userId) || !convId || !['private', 'group'].includes(String(conv?.kind)) || (conv?.kind === 'private' && convId !== userId)) throw new RouteError('OPERATOR_DENIED', 'Event identity is not an authorized QQ operator.');
    if (!Number.isFinite(at) || at > now + 5000 || now - at > this.options.eventTtlMs || typeof event.text !== 'string' || !event.text.trim() || event.text.length > 16000) throw new RouteError('EVENT_EXPIRED', 'Incoming event is stale or malformed.');
    const recipient = `${conv!.kind}:${convId}`, actor: Actor = { key: digest([userId, recipient]), userId, recipient, eventCursor: event.cursor, text: event.text, eventAt: at };
    this.authorized.add(actor); return actor;
  }
  private actor(actor: Actor): void {
    if (!this.authorized.has(actor) || this.clock() - actor.eventAt > this.options.eventTtlMs) throw new RouteError('EVENT_EXPIRED', 'Authorize a fresh stored human event for this call.');
  }
  private serial<T>(fn: () => Promise<T>): Promise<T> { const pending = this.queue.then(fn, fn); this.queue = pending.catch(() => undefined); return pending; }
  private iso(): string { return new Date(this.clock()).toISOString(); }
  private prune(state: State): void {
    const now = this.clock();
    for (const [id, set] of Object.entries(state.sets)) if (set.expiresAt < now) delete state.sets[id];
    for (const [id, draft] of Object.entries(state.drafts)) if (draft.expiresAt < now) delete state.drafts[id];
    for (const [id, selection] of Object.entries(state.selections)) if (selection.expiresAt < now) delete state.selections[id];
  }
  async find(actor: Actor, input: { query: string; frameworks?: Framework[]; limit?: number }): Promise<CandidateSet> {
    this.actor(actor);
    if (typeof input.query !== 'string' || input.query.length > 500) throw new RouteError('INVALID_QUERY', 'Supply a short project/topic query, or an empty query for recent activity.');
    const candidates = await this.options.backend.list({ query: input.query, frameworks: input.frameworks, limit: Math.max(1, Math.min(5, input.limit ?? 5)) });
    let unavailableFrameworks: Record<string, string> | undefined;
    let searchScope: DiscoveryScope | undefined;
    let discoveryWarnings: Record<string, string[]> | undefined;
    const requested = input.frameworks ?? ['dsh', 'codex'];
    try {
      const diagnostics = await this.options.backend.diagnostics?.();
      if (diagnostics?.discoveryErrors) unavailableFrameworks = Object.fromEntries(Object.entries(diagnostics.discoveryErrors as Record<string, string>).filter(([framework]) => requested.includes(framework as Framework)));
      if (diagnostics?.discoveryWarnings) discoveryWarnings = Object.fromEntries(Object.entries(diagnostics.discoveryWarnings as Record<string, string[]>).filter(([framework]) => requested.includes(framework as Framework)));
      if (diagnostics?.searchScope) searchScope = structuredClone(diagnostics.searchScope) as DiscoveryScope;
    } catch { /* Discovery results remain usable; diagnostics failure conveys no command authority. */ }
    return this.serial(async () => {
      this.actor(actor); const unavailable = unavailableFrameworks && Object.keys(unavailableFrameworks).length;
      const set: CandidateSet = { id: randomUUID(), expiresAt: this.clock() + this.options.selectionTtlMs, candidates: candidates.slice(0, 5), ...(unavailable ? { unavailableFrameworks } : {}), ...(discoveryWarnings && Object.keys(discoveryWarnings).length ? { discoveryWarnings } : {}), ...(searchScope ? { searchScope } : {}), ...(!candidates.length ? { emptyReason: unavailable ? 'NO_MATCH_IN_AVAILABLE_FRAMEWORKS' as const : 'NO_MATCH_WITHIN_DELEGATED_SCOPE' as const } : {}) };
      this.store.update(state => { this.prune(state); if (Object.keys(state.sets).length >= 100) throw new RouteError('CAPACITY', 'Too many active candidate sets.'); state.sets[set.id] = { ...set, actorKey: actor.key }; });
      return set;
    });
  }
  async select(actor: Actor, input: { candidateSetId: string; index: number }): Promise<Selection> {
    return this.serial(async () => {
      this.actor(actor); const set = this.store.read().sets[input.candidateSetId];
      if (!set || set.actorKey !== actor.key || set.expiresAt < this.clock()) throw new RouteError('CANDIDATES_EXPIRED', 'Find fresh candidates in this QQ conversation.');
      if (!Number.isSafeInteger(input.index) || !set.candidates[input.index - 1]) throw new RouteError('INVALID_SELECTION', 'Choose a displayed candidate by its one-based index.');
      const selection = { target: set.candidates[input.index - 1], expiresAt: this.clock() + this.options.selectionTtlMs };
      this.store.update(state => { state.selections[actor.key] = selection; }); return selection;
    });
  }
  selected(actor: Actor): Selection | undefined { this.actor(actor); const selection = this.store.read().selections[actor.key]; return selection && selection.expiresAt >= this.clock() ? selection : undefined; }
  async draft(actor: Actor, input: { action: Action; prompt?: string }): Promise<Draft> {
    return this.serial(async () => {
      this.actor(actor); const selection = this.selected(actor);
      if (!selection) throw new RouteError('NO_SELECTION', 'Select a conversation first.');
      if (!Object.hasOwn(intent, input.action) || !intent[input.action].test(actor.text) || deniedIntent.test(actor.text)) throw new RouteError('HUMAN_INTENT_REQUIRED', 'The current human message must request this action.');
      let prompt = standardPrompt(input.action);
      if (input.action === 'send') {
        if (typeof input.prompt !== 'string' || !input.prompt.trim() || input.prompt.length > 8000 || !actor.text.includes(input.prompt)) throw new RouteError('PROMPT_NOT_FROM_HUMAN', 'Custom text must occur verbatim in the current human message.');
        prompt = input.prompt;
      } else if (input.prompt !== undefined) throw new RouteError('INVALID_PROMPT', 'Use the fixed continue/check command or choose send for custom text.');
      const target = await this.options.backend.get(selection.target.framework, selection.target.id);
      if (!target.capabilities.includes(input.action)) throw new RouteError('CAPABILITY_UNAVAILABLE', 'This conversation cannot perform that action through the configured backend.');
      const draft: StoredDraft = { id: randomUUID(), actorKey: actor.key, recipient: actor.recipient, eventCursor: actor.eventCursor, target, action: input.action, ...(prompt ? { prompt } : {}), expiresAt: this.clock() + this.options.selectionTtlMs };
      this.store.update(state => { this.prune(state); if (Object.keys(state.drafts).length >= 100) throw new RouteError('CAPACITY', 'Too many active drafts.'); state.drafts[draft.id] = draft; });
      const { actorKey: _, recipient: __, eventCursor: ___, ...publicDraft } = draft; return publicDraft;
    });
  }
  async confirm(actor: Actor, draftId: string, signal?: AbortSignal): Promise<ActionReceipt> {
    return this.serial(async () => {
      this.actor(actor); const state = this.store.read(), draft = state.drafts[draftId];
      if (signal?.aborted) throw new RouteError('ABORTED', 'Confirmation cancelled before durable submission intent.');
      if (!draft || draft.actorKey !== actor.key || draft.recipient !== actor.recipient) throw new RouteError('DRAFT_NOT_FOUND', 'No draft belongs to this requester and conversation.');
      const existing = state.operations[draftId]; if (existing) return existing.receipt;
      if (draft.expiresAt < this.clock() || actor.eventCursor <= draft.eventCursor || !isConfirmation(actor.text)) throw new RouteError('CONFIRMATION_REQUIRED', 'A newer human event confirming the displayed target and action is required.');
      const selected = this.selected(actor)?.target;
      if (!selected || selected.framework !== draft.target.framework || selected.id !== draft.target.id) throw new RouteError('SELECTION_CHANGED', 'The selected conversation changed; show a new draft.');
      const eventKey = `${actor.key}:${actor.eventCursor}`;
      if (state.consumed[eventKey]) throw new RouteError('EVENT_ALREADY_USED', 'This human confirmation already authorized another operation.');
      if (Object.values(state.operations).some(op => (!terminal(op.receipt.status) || op.receipt.status === 'unknown') && op.target.framework === draft.target.framework && op.target.id === draft.target.id && (draft.action !== 'pause' || op.receipt.status === 'unknown' || op.receipt.action === 'pause'))) throw new RouteError('TARGET_BUSY', 'An existing or uncertain operation still owns this conversation. Reconcile it before another command.');
      if (Object.keys(state.operations).length >= 10000) throw new RouteError('CAPACITY', 'Operation retention limit reached; retain and review the ledger.');
      this.options.assertControl?.();
      const receipt: ActionReceipt = { operationId: draft.id, framework: draft.target.framework, targetId: draft.target.id, action: draft.action, status: 'unknown', at: this.iso(), detail: 'Durable intent recorded; submission has not been observed.' };
      // Both reservation and event consumption commit before native control.
      this.store.update(next => { next.consumed[eventKey] = draft.id; next.operations[draft.id] = { actorKey: actor.key, recipient: actor.recipient, target: draft.target, phase: 'sending', receipt }; }, { kind: 'operation.confirmed', data: { operationId: draft.id, framework: draft.target.framework, targetId: draft.target.id, action: draft.action, userId: actor.userId, recipient: actor.recipient, confirmationEventCursor: actor.eventCursor } });
      let result: ActionReceipt;
      try { result = await this.options.backend.execute({ operationId: draft.id, framework: draft.target.framework, targetId: draft.target.id, action: draft.action, prompt: draft.prompt, expectedRevision: draft.target.revision }, signal); }
      catch (error) {
        const rejected = error instanceof RouteError && ['ADMISSION_PAUSED', 'ABORTED', 'TARGET_CHANGED', 'CAPABILITY_UNAVAILABLE', 'TARGET_BUSY', 'CAPACITY', 'INVALID_REQUEST', 'ID_CONFLICT'].includes(error.code);
        result = { ...receipt, at: this.iso(), status: rejected ? 'blocked' : 'unknown', errorCode: error instanceof RouteError ? error.code : 'SUBMISSION_UNKNOWN', detail: rejected ? 'Gateway rejected the operation before native submission.' : 'No receipt was observed. Preserve this operation ID; do not resubmit.' };
      }
      try { this.validateReceipt(receipt, result); }
      catch { result = { ...receipt, at: this.iso(), status: 'unknown', errorCode: 'RECEIPT_IDENTITY_MISMATCH' }; }
      result = { ...result, action: draft.action };
      try { this.saveReceipt(draft.id, result); }
      catch { return { ...receipt, at: this.iso(), status: 'unknown', errorCode: 'RECEIPT_COMMIT_FAILED', detail: 'Native submission may have occurred. Persistence is degraded; no new command will be submitted.' }; }
      return result;
    });
  }
  private validateReceipt(expected: ActionReceipt, actual: ActionReceipt): void {
    if (expected.operationId !== actual.operationId || expected.framework !== actual.framework || expected.targetId !== actual.targetId) throw new RouteError('RECEIPT_IDENTITY_MISMATCH', 'Backend receipt identity differs from the durable command.');
  }
  private report(state: State, op: Operation): void {
    // Poll timestamps are not progress. Public answer changes are, even while
    // the native turn remains running. Important boundary IDs stay compatible.
    const id = digest([op.receipt.operationId, op.receipt.status, op.receipt.turnId ?? '', op.receipt.errorCode ?? '',
      ...(isOrdinaryReceipt(op.receipt) ? [op.receipt.answer ?? ''] : []), ...(op.reportSequence === undefined ? [] : [op.reportSequence])]);
    state.reports[id] ??= { id, recipient: op.recipient, receipt: op.receipt, target: op.target };
  }
  private saveReceipt(id: string, receipt: ActionReceipt): void {
    const { answer: _, ...audit } = receipt;
    this.store.update(state => {
      const op = state.operations[id], changed = receiptProgressSignature(op.receipt) !== receiptProgressSignature(receipt);
      op.receipt = receipt; op.phase = terminal(receipt.status) ? 'terminal' : 'observing';
      if (changed) { op.reportSequence = (op.reportSequence ?? 0) + 1; this.report(state, op); }
    }, { kind: 'operation.receipt', data: audit });
  }
  async status(actor: Actor, operationId: string): Promise<ActionReceipt> {
    return this.serial(async () => {
      this.actor(actor); const op = this.store.read().operations[operationId];
      if (!op || op.actorKey !== actor.key || op.recipient !== actor.recipient) throw new RouteError('OPERATION_NOT_FOUND', 'No operation belongs to this requester.');
      if (op.receipt.status === 'unknown' && !this.store.degraded) {
        try { const observed = await this.options.backend.observe(operationId); this.validateReceipt(op.receipt, observed); this.saveReceipt(operationId, observed); return observed; }
        catch { /* Keep the original uncertain operation, never submit another prompt. */ }
      }
      return op.receipt;
    });
  }
  async pollPending(): Promise<void> {
    return this.serial(async () => {
      if (this.store.degraded) return;
      for (const [id, op] of Object.entries(this.store.read().operations)) {
        if (op.phase !== 'observing') continue;
        try {
          const receipt = await this.options.backend.observe(id); this.validateReceipt(op.receipt, receipt);
          const { at: _newAt, ...next } = receipt, { at: _oldAt, ...previous } = op.receipt;
          if (digest(next) !== digest(previous)) this.saveReceipt(id, receipt);
        } catch (error) { if (this.store.degraded) throw error; /* Read failures keep the same operation for the next observation. */ }
      }
    });
  }
  pendingReports(): Report[] {
    const state = this.store.read();
    return Object.values(state.reports).sort((a, b) => Number(!!state.notifications?.pending[b.id]) - Number(!!state.notifications?.pending[a.id]));
  }
  notificationPrepared(id: string): boolean { return !!this.store.read().notifications?.pending[id]; }
  suppressOrdinaryReport(id: string): void {
    const report = this.store.read().reports[id];
    if (!report || !isOrdinaryReceipt(report.receipt)) return;
    this.store.update(state => {
      delete state.reports[id];
      if (state.notifications) {
        delete state.notifications.pending[id];
        if (state.notifications.progress?.[this.lane(report)]?.id === id) delete state.notifications.progress[this.lane(report)];
      }
    }, { kind: 'report.record_only', data: { deliveryId: id } });
  }
  progressFeedCheckpoint(): { feedId: string; cursor: number; baselineAt: string } | undefined { return this.store.read().progressFeed; }
  ownsDshBoundary(sessionId: string, turnId: string | null, status: string): boolean {
    if (turnId === null) return false;
    return Object.values(this.store.read().operations).some(operation => {
      const receipt = operation.receipt;
      return receipt.framework === 'dsh' && receipt.targetId === sessionId && receipt.turnId === turnId
        && (receipt.status === status || (status === 'interrupted' && receipt.status === 'paused')
          || (status === 'completed' && receipt.status === 'running' && receipt.errorCode === 'BACKGROUND_JOBS_ACTIVE'));
    });
  }
  bindProgressFeed(feedId: string, baselineAt: string): void {
    const current = this.store.read().progressFeed;
    if (current && current.feedId !== feedId) throw new RouteError('PROGRESS_FEED_IDENTITY_CHANGED', 'Progress feed changed; retain its saved cursor and reconcile the source before replay.');
    if (!current) this.store.update(state => { state.progressFeed = { feedId, cursor: 0, baselineAt }; }, { kind: 'progress.feed_bound', data: { feedId, baselineAt } });
  }
  acknowledgeProgressFeed(feedId: string, cursor: number, hostCursor: number): void {
    this.store.update(state => {
      if (!state.progressFeed || state.progressFeed.feedId !== feedId || cursor <= state.progressFeed.cursor) throw new RouteError('PROGRESS_FEED_CURSOR', 'Invalid progress acknowledgement.');
      state.progressFeed.cursor = cursor;
    }, { kind: 'progress.event_saved', data: { feedId, cursor, hostCursor } });
  }
  recordProgressFeed(feedId: string, cursor: number, outcome: 'queued' | 'suppressed', deliveryId: string): void {
    this.store.update(state => {
      if (!state.progressFeed || state.progressFeed.feedId !== feedId || cursor <= state.progressFeed.cursor) throw new RouteError('PROGRESS_FEED_CURSOR', 'Invalid progress source acknowledgement.');
      state.progressFeed.cursor = cursor;
    }, { kind: `progress.${outcome}`, data: { feedId, cursor, deliveryId } });
  }
  acknowledgeReport(id: string): void { this.store.update(state => { delete state.reports[id]; }, { kind: 'report.event_saved', data: { deliveryId: id } }); }
  private notifications(state: State): Notifications {
    return state.notifications ??= { deferred: {}, pending: {}, saved: {} };
  }
  private lane(report: Report): string { return digest([report.target.framework, report.target.id, report.receipt.operationId]); }
  /** Coalesce actual native changes durably until the next progress boundary. */
  deferReport(id: string): void {
    const report = this.store.read().reports[id];
    if (!report) return;
    const receipt = report.receipt;
    if (!isOrdinaryReceipt(receipt)) throw new RouteError('IMPORTANT_REPORT', 'This receipt requires a notification boundary.');
    this.store.update(state => {
      const notifications = this.notifications(state), key = this.lane(report);
      if (notifications.saved[id] || notifications.progress?.[key]?.id === id) { delete state.reports[id]; return; }
      const summary = notifications.deferred[key] ??= { framework: report.target.framework, targetId: report.target.id,
        operationId: receipt.operationId, source: report.target.source, count: 0, counts: { accepted: 0, running: 0 },
        firstAt: receipt.at, lastAt: receipt.at, lastReportId: id };
      summary.count++; summary.counts[receipt.status as 'accepted' | 'running']++;
      summary.lastAt = receipt.at; summary.lastReportId = id;
      (notifications.progress ??= {})[key] = report;
      delete state.reports[id];
    }, { kind: 'report.deferred', data: { deliveryId: id, framework: report.target.framework, targetId: report.target.id,
      operationId: receipt.operationId, source: report.target.source, status: receipt.status, at: receipt.at, recordedAt: this.iso() } });
  }
  readyProgressReports(intervalMs: number): Report[] {
    if (!intervalMs) return [];
    const state = this.store.read(), n = state.notifications;
    return Object.values(n?.progress ?? {}).filter(report => {
      const key = this.lane(report), last = n?.lastProgressAt?.[key];
      return !Object.values(n?.pending ?? {}).some(item => this.lane(item.report) === key)
        && (last === undefined || this.clock() - last >= intervalMs);
    });
  }
  /** Freeze the accumulated lane before Core delivery; a retry uses this same report and summary. */
  prepareNotification(id: string): ReportNotification | undefined {
    const state = this.store.read(), report = state.reports[id] ?? Object.values(state.notifications?.progress ?? {}).find(item => item.id === id);
    if (!report) return undefined;
    if (state.notifications?.saved[id]) {
      this.store.update(next => { delete next.reports[id]; }, { kind: 'report.notification_coalesced', data: { deliveryId: id } });
      return undefined;
    }
    const pending = state.notifications?.pending[id];
    if (pending) return pending;
    let notification!: ReportNotification;
    this.store.update(next => {
      const notifications = this.notifications(next), key = this.lane(report), deferred = notifications.deferred[key];
      notification = { report, reason: report.receipt.errorCode ?? report.receipt.status, ...(deferred ? { deferred } : {}) };
      notifications.pending[id] = notification;
      next.reports[id] = report;
      delete notifications.deferred[key];
      if (notifications.progress) delete notifications.progress[key];
    }, { kind: 'report.notification_prepared', data: { deliveryId: id, framework: report.target.framework, targetId: report.target.id,
      operationId: report.receipt.operationId, status: report.receipt.status, errorCode: report.receipt.errorCode ?? null,
      turnId: report.receipt.turnId ?? null, deferredCount: state.notifications?.deferred[this.lane(report)]?.count ?? 0 } });
    return structuredClone(notification);
  }
  /** Saved means Core archived the event, rather than that the model or recipient processed it. */
  acknowledgeNotification(id: string, hostCursor: number): void {
    this.store.update(state => {
      const notifications = this.notifications(state);
      const report = notifications.pending[id]?.report;
      if (report) (notifications.lastProgressAt ??= {})[this.lane(report)] = this.clock();
      notifications.saved[id] = { hostCursor, at: this.iso() };
      delete notifications.pending[id]; delete state.reports[id];
    }, { kind: 'report.event_saved', data: { deliveryId: id, hostCursor } });
  }
  deferredSummary(): { count: number; operations: number } {
    const notifications = this.store.read().notifications;
    if (!notifications) return { count: 0, operations: 0 };
    const summaries = [...Object.values(notifications.deferred), ...Object.values(notifications.pending).flatMap(item => item.deferred ? [item.deferred] : [])];
    return { count: summaries.reduce((sum, item) => sum + item.count, 0), operations: new Set(summaries.map(item => digest([item.framework, item.targetId, item.operationId]))).size };
  }
  snapshot(): Record<string, unknown> {
    const state = this.store.read(); return { degraded: this.store.degraded, candidateSets: Object.keys(state.sets).length, selections: Object.keys(state.selections).length, drafts: Object.keys(state.drafts).length, operations: Object.values(state.operations).map(op => ({ operationId: op.receipt.operationId, framework: op.receipt.framework, targetId: op.receipt.targetId, status: op.receipt.status, errorCode: op.receipt.errorCode })), pendingReports: Object.keys(state.reports).length, deferredReports: this.deferredSummary(), pendingNotifications: Object.keys(state.notifications?.pending ?? {}).length, progressFeed: state.progressFeed ?? null };
  }
  async close(): Promise<void> { await this.queue; this.store.close(); }
}
