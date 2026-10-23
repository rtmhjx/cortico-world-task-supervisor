import { excludedRoots, isExcludedPath } from '../../task-reporting/src/policy.ts';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { allowedWorkspace, PROTECTED_ROOT, within } from './paths.ts';
import { RouteError, standardPrompt, type ActionReceipt, type ActionRequest, type Conversation, type ConversationAdapter } from './contract.ts';

/** Structural views of public Host APIs; no bridge-owned permission or model APIs. */
export interface DshContext { get(name: string): unknown }
interface Message { id?: string; source?: { kind?: string; rpcId?: string }; content?: { type: string; text?: string }[] }
interface Event { seq: number; time: number; type: string; data: Record<string, any> }
interface Header { id: string; cwd?: string; createdAt?: number; parentSession?: string; origin?: string; [key: string]: unknown }
interface Agent {
  id: string; status: string;
  session: { header: Header; snapshotEvents(): readonly Event[] };
  inbox: { nextTurn: readonly Message[]; nextStep: readonly Message[] };
  ctx: DshContext & { on(name: string, callback: (...args: any[]) => unknown, options?: Record<string, unknown>): () => void };
}
interface Controller {
  resolveAgent(id: string): Promise<{ agent: Agent } | { error: unknown }>;
  prompt(request: { requestId: string; sessionId: string; mode: 'queue'; content: { type: 'text'; text: string }[] }, signal: AbortSignal): Promise<{ accepted: true }>;
  cancel(request: { sessionId: string }): { accepted: true };
}
interface Query {
  listSessions(signal?: AbortSignal): Promise<{ header: Header }[]>;
  observeSession(id: string, options: { signal?: AbortSignal; projectionMode: 'none' }): Promise<{ header: Header; events: readonly Event[]; [Symbol.dispose](): void }>;
}
interface ToolExecution { agent?: Agent; name: string; arguments?: unknown }
interface Tools { guard(check: (execution: ToolExecution) => string | undefined): () => void }
interface Snapshot { header: Header; events: readonly Event[]; agent?: Agent; queue: readonly Message[]; status: Conversation['status']; revision: string; missingEndTurn?: number }
interface Budget { maxSteps: number; maxRequests: number; maxDurationMs: number }
interface Fence { rpcId: string; agent: Agent; turn?: number; start: number; requests: number; steps: number; pendingQuestions: number; closed: boolean; blocked?: string; cancellationRequested?: boolean; release: (() => void)[] }
export interface DshConversationOptions { roots: string[]; now?: () => number; budget?: Partial<Budget> }

const rpcOf = (message: Message): string | undefined => message.source?.kind === 'user' ? message.source.rpcId : undefined;
const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const abort = (signal?: AbortSignal): void => { signal?.throwIfAborted(); };
/** Metadata-only canonicalization for the synchronous native final tool guard. */
function canonicalSync(path: string): string {
  let current = resolve(path); const tail: string[] = [];
  for (;;) {
    try { return join(realpathSync(current), ...tail); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = dirname(current); if (parent === current) throw error;
      tail.unshift(relative(parent, current)); current = parent;
    }
  }
}
const normalize = (value: string): string => value.replace(/\\/g, '/').toLocaleLowerCase();
function forbiddenArguments(value: unknown): boolean {
  if (typeof value === 'string') return excludedRoots().some(root => normalize(value).includes(normalize(root)));
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => /sandbox|permission|approval|escalat/i.test(key) || forbiddenArguments(child));
}
function fileBoundary(agent: Agent, execution: ToolExecution, readOnly: boolean): string | undefined {
  if (forbiddenArguments(execution.arguments)) return 'Conversation tools cannot request permission escalation or access the protected archive.';
  if (readOnly && execution.name !== 'read') return 'Conversation status checks allow native read only; this tool is blocked.';
  if (!readOnly && !['read', 'write', 'edit', 'str_replace_editor'].includes(execution.name)) return undefined;
  const args = execution.arguments;
  if (!args || typeof args !== 'object' || Array.isArray(args)) return 'Native file tool arguments cannot be verified.';
  const path = (args as Record<string, unknown>).file_path ?? (args as Record<string, unknown>).path;
  if (typeof path !== 'string' || !path.trim() || path.includes('\0')) return 'Native file tool path cannot be verified.';
  try {
    const cwd = agent.session.header.cwd;
    if (!cwd || !isAbsolute(cwd)) return 'Native conversation workspace cannot be verified.';
    const candidate = isAbsolute(path) ? resolve(path) : resolve(cwd, path);
    if (isExcludedPath(candidate)) return 'The protected archive is not accessible to conversation commands.';
    const base = canonicalSync(cwd), target = canonicalSync(candidate);
    if (normalize(base) !== normalize(resolve(cwd))) return 'The native workspace alias changed; file execution is blocked.';
    if (isExcludedPath(base, [], true) || isExcludedPath(target)) return 'The protected archive is not accessible to conversation commands.';
    if (!within(target, base)) return 'Native file access is outside this conversation project workspace.';
  } catch { return 'Native file path metadata cannot be verified.'; }
  return undefined;
}
function last(events: readonly Event[], predicate: (event: Event) => boolean): Event | undefined {
  for (let index = events.length - 1; index >= 0; index--) if (predicate(events[index])) return events[index];
  return undefined;
}
function foldQueue(events: readonly Event[]): Message[] {
  const queues: Record<string, Message[]> = { 'next-turn': [], 'next-step': [] };
  for (const event of events) {
    if (event.type !== 'agent/inbox/spliced') continue;
    const { target, start, removedCount = 0, inserted } = event.data;
    const queue = queues[target];
    if (!queue || !Number.isSafeInteger(start) || start < 0 || start > queue.length || !Number.isSafeInteger(removedCount) || removedCount < 0 || start + removedCount > queue.length || !Array.isArray(inserted)) throw new RouteError('NATIVE_LOG_INVALID', 'Native inbox history cannot be verified.');
    queue.splice(start, removedCount, ...inserted);
  }
  return [...queues['next-turn'], ...queues['next-step']];
}
function turnFor(events: readonly Event[], rpcId: string): number | undefined {
  let turn: number | undefined;
  const queues: Record<string, Message[]> = { 'next-turn': [], 'next-step': [] };
  for (const event of events) {
    if (event.type === 'turn/start') turn = event.data.turn;
    if (event.type === 'turn/end') turn = undefined;
    if (event.type === 'user/message' && rpcOf(event.data as Message) === rpcId) return turn;
    if (event.type === 'agent/inbox/spliced') {
      const { target, start, removedCount = 0, inserted, outcome } = event.data;
      const queue = queues[target];
      if (!queue || !Array.isArray(inserted)) throw new RouteError('NATIVE_LOG_INVALID', 'Native inbox claim cannot be verified.');
      const removed = queue.splice(start, removedCount, ...inserted);
      // Native public edits/removals mark discarded messages canceled. A normal
      // removal during the open turn proves the exact claim even if request setup
      // fails before its user/message commit.
      if (outcome !== 'canceled' && turn !== undefined && removed.some(message => rpcOf(message) === rpcId)) return turn;
    }
  }
  return undefined;
}
function foreignInTurn(events: readonly Event[], turn: number, rpcId: string): boolean {
  let current: number | undefined;
  for (const event of events) {
    if (event.type === 'turn/start') current = event.data.turn;
    if (event.type === 'turn/end') current = undefined;
    if (current === turn && event.type === 'user/message' && event.data.source?.kind === 'user' && rpcOf(event.data as Message) !== rpcId) return true;
  }
  return false;
}
/** Approval audit events carry IDs, not a turn field; pair them within the exact open turn. */
function pendingApprovals(events: readonly Event[], turn: number): number {
  let current: number | undefined;
  const pending = new Set<string>();
  for (const event of events) {
    if (event.type === 'turn/start') { current = event.data.turn; pending.clear(); }
    else if (event.type === 'turn/end') { current = undefined; pending.clear(); }
    else if (current === turn && typeof event.data.id === 'string' && event.data.id.length > 0) {
      if (event.type === 'approval/asked') pending.add(event.data.id);
      else if (event.type === 'approval/decided') pending.delete(event.data.id);
    }
  }
  return current === turn ? pending.size : 0;
}
function cut(header: Header, events: readonly Event[], agent?: Agent): Snapshot {
  const queue = agent ? [...agent.inbox.nextTurn, ...agent.inbox.nextStep] : foldQueue(events);
  const lastEnd = last(events, event => event.type === 'turn/end');
  const open = last(events, event => event.type === 'turn/start');
  const openTurn = open !== undefined && (!lastEnd || open.seq > lastEnd.seq);
  // Cold SessionQuery balances an unfinished log with an in-memory interrupted end.
  // That viewing boundary cannot confirm native completion or cancellation.
  const missingEndTurn = !openTurn && lastEnd?.data.reason?.kind === 'interrupted' ? lastEnd.data.turn
    : (!agent || agent.status === 'idle') && openTurn ? open.data.turn : undefined;
  const running = agent?.status === 'running' || openTurn;
  const status: Conversation['status'] = missingEndTurn !== undefined ? 'unknown' : running ? 'running' : lastEnd?.data.reason?.kind === 'aborted' ? 'paused' : 'idle';
  const revision = `dsh:${hash({ header, seq: events.at(-1)?.seq ?? -1, status, queue })}`;
  return { header, events, agent, queue, status, revision, ...(missingEndTurn === undefined ? {} : { missingEndTurn }) };
}

/** Commands enter existing native sessions through SessionController without changing their configuration. */
export class DshConversationAdapter implements ConversationAdapter {
  readonly framework = 'dsh' as const;
  /** Per-session discovery races remain visible without hiding healthy project sessions. */
  readonly discoveryWarnings: { id: string; code: string }[] = [];
  private readonly now: () => number;
  private readonly budget: Budget;
  private readonly fences = new Map<string, Fence>();
  private closed = false;
  constructor(private readonly ctx: DshContext, private readonly options: DshConversationOptions) {
    this.now = options.now ?? Date.now;
    this.budget = { maxSteps: 12, maxRequests: 16, maxDurationMs: 300000, ...options.budget };
    for (const [name, value] of Object.entries(this.budget)) if (!Number.isSafeInteger(value) || value < 1) throw new RouteError('INVALID_BUDGET', `${name} must be a positive integer.`);
  }
  private service<T>(name: string, methods: string[]): T {
    const value = this.ctx.get(name) as Record<string, unknown> | undefined;
    if (!value || methods.some(method => typeof value[method] !== 'function')) throw new RouteError('CAPABILITY_UNAVAILABLE', `DSH public ${name} capability is unavailable.`);
    return value as T;
  }
  private live(id: string): Agent | undefined {
    return this.service<{ get(id: string): Agent | undefined }>('agents', ['get']).get(id);
  }
  private executable(agent?: Agent): boolean {
    if (this.closed) return false;
    try {
      this.service('sessionController', ['resolveAgent', 'prompt']);
      this.service('agentLoop', ['create']);
      this.service('tools', ['guard']);
      return !agent || (typeof agent.ctx?.on === 'function' && typeof agent.ctx?.get === 'function' && typeof (agent.ctx.get('tools') as Tools | undefined)?.guard === 'function');
    } catch { return false; }
  }
  private async snapshot(id: string, signal?: AbortSignal): Promise<Snapshot> {
    abort(signal);
    const query = this.service<Query>('sessionQuery', ['observeSession']);
    const header = (await query.listSessions(signal)).find(record => record.header.id === id)?.header;
    if (!header?.cwd || !await allowedWorkspace(header.cwd, this.options.roots)) throw new RouteError('WORKSPACE_DENIED', 'Conversation metadata is outside the explicit project roots.');
    const observation = await query.observeSession(id, { signal, projectionMode: 'none' });
    try {
      abort(signal);
      if (observation.header.id !== id) throw new RouteError('NATIVE_IDENTITY_MISMATCH', 'Native observation returned another session.');
      if (!observation.header.cwd || !await allowedWorkspace(observation.header.cwd, this.options.roots)) throw new RouteError('WORKSPACE_DENIED', 'Conversation workspace is outside the explicit project roots.');
      abort(signal);
      // Metadata checks have finished. An attached session now supplies one synchronous current cut.
      const agent = this.live(id);
      const result = agent ? cut(agent.session.header, agent.session.snapshotEvents(), agent) : cut(observation.header, observation.events);
      if (result.header.cwd !== observation.header.cwd) throw new RouteError('WORKSPACE_CHANGED', 'Conversation workspace changed during the read.');
      return result;
    } finally { observation[Symbol.dispose](); }
  }
  private conversation(snapshot: Snapshot): Conversation {
    const { header, events, agent, status, revision } = snapshot;
    const title = last(events, event => event.type === 'session/title' && typeof event.data.title === 'string')?.data.title ?? null;
    const lastActivity = events.reduce((latest, event) => Number.isFinite(event.time) ? Math.max(latest, event.time) : latest, Number(header.createdAt ?? 0));
    const ordinary = !header.parentSession && header.origin !== 'subagent';
    const capabilities: Conversation['capabilities'] = ordinary && status !== 'unknown' && this.executable(agent) ? ['continue', 'check', 'send'] : [];
    if (ordinary && status !== 'unknown' && agent && typeof (this.ctx.get('sessionController') as Controller | undefined)?.cancel === 'function' && snapshot.queue.length === 0) capabilities.unshift('pause');
    return { framework: 'dsh', id: header.id, title, workspace: header.cwd!, lastActivityAt: new Date(lastActivity).toISOString(), summary: '', status, revision, capabilities, source: 'dsh-native-session-query' };
  }
  async list(input: { query: string; limit: number; signal?: AbortSignal }): Promise<Conversation[]> {
    this.discoveryWarnings.length = 0;
    const records = await this.service<Query>('sessionQuery', ['listSessions']).listSessions(input.signal);
    const query = input.query.trim().toLocaleLowerCase();
    const limit = Math.max(0, Math.min(200, input.limit));
    const matches = (values: string[]): boolean => !query || values.some(value => value.toLocaleLowerCase().includes(query));
    const candidates: Conversation[] = [];
    const workspaces = new Map<string, Promise<boolean>>();
    const cache = this.ctx.get('sessionProjectionCache') as { cachedSnapshot?(header: Header, offset: number): any; cachedPredecessorTitle?(header: Header, offset: number): any } | undefined;
    const projections = this.ctx.get('sessionProjections') as { cachedSnapshot?(session: unknown): any } | undefined;
    const sessions = this.ctx.get('sessions') as { get?(id: string): unknown } | undefined;
    for (const record of records) {
      abort(input.signal);
      const header = record.header;
      // Authorize header paths before reading even cached title/preview metadata.
      if (!header.cwd || header.parentSession || header.origin === 'subagent') continue;
      let allowed = workspaces.get(header.cwd);
      if (!allowed) { allowed = allowedWorkspace(header.cwd, this.options.roots); workspaces.set(header.cwd, allowed); }
      if (!await allowed) continue;
      let values: Record<string, any> = {};
      try {
        const session = sessions?.get?.(header.id) ?? this.live(header.id)?.session;
        values = (session ? projections?.cachedSnapshot?.(session) : header.isSeeded ? undefined : cache?.cachedSnapshot?.(header, 0) ?? cache?.cachedPredecessorTitle?.(header, 0))?.values ?? {};
      } catch { /* A missing projection can only enter the bounded fallback below. */ }
      const titleKnown = typeof values.title === 'string';
      if (!matches([header.id, header.cwd, titleKnown ? values.title : ''])) {
        if (!titleKnown && !this.discoveryWarnings.length) this.discoveryWarnings.push({ id: '', code: 'TITLE_METADATA_UNAVAILABLE' });
        continue;
      }
      const updatedAt = Math.max(Number(header.createdAt ?? 0), Number(values.sessionListMetadata?.lastPromptAt ?? 0));
      candidates.push({ framework: 'dsh', id: header.id, title: titleKnown ? values.title : null, workspace: header.cwd,
        lastActivityAt: new Date(Number.isFinite(updatedAt) ? updatedAt : 0).toISOString(), summary: '', status: this.live(header.id)?.status === 'running' ? 'running' : 'unknown',
        revision: hash(['metadata', header.id, header.cwd, values.title ?? null, updatedAt]), capabilities: [], source: 'dsh-native-cached-metadata', stateVerification: 'deferred' });
    }
    // Even one real chat can take seconds to materialize. Defer all native logs to the selected target's draft/get.
    return candidates.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt) || a.id.localeCompare(b.id)).slice(0, limit);
  }
  async get(id: string, signal?: AbortSignal): Promise<Conversation> { return this.conversation(await this.snapshot(id, signal)); }
  private receipt(request: Pick<ActionRequest, 'operationId' | 'targetId' | 'action'>, status: ActionReceipt['status'], extra: Partial<ActionReceipt> = {}): ActionReceipt {
    return { operationId: request.operationId, framework: 'dsh', targetId: request.targetId, action: request.action, status, at: new Date(this.now()).toISOString(), ...extra };
  }
  private missingTurnEnd(receipt: ActionReceipt, at: string, turn: number): ActionReceipt {
    return { ...receipt, at, turnId: String(turn), status: 'unknown', errorCode: 'NATIVE_TURN_END_MISSING',
      detail: 'The exact native turn has no confirmed native turn/end. A cold interrupted end may be synthesized for read-only viewing and does not confirm completion or cancellation. Retain this operation identity for read-only reconciliation; no terminal outcome was inferred.' };
  }
  async execute(request: ActionRequest, signal?: AbortSignal): Promise<ActionReceipt> {
    if (request.framework !== 'dsh') throw new RouteError('FRAMEWORK_MISMATCH', 'Expected a DSH conversation.');
    if (this.closed) throw new RouteError('CAPABILITY_UNAVAILABLE', 'DSH conversation adapter is closed.');
    let snapshot = await this.snapshot(request.targetId, signal);
    if (snapshot.revision !== request.expectedRevision) throw new RouteError('REVISION_CHANGED', 'Conversation changed after target confirmation.');
    if (snapshot.header.parentSession || snapshot.header.origin === 'subagent') throw new RouteError('CAPABILITY_UNAVAILABLE', 'Subagent conversations require their native parent owner.');
    if (snapshot.status === 'unknown') throw new RouteError('NATIVE_TURN_END_MISSING', 'The native turn outcome is unknown; observe the original operation instead of submitting another command.');
    const controller = this.service<Controller>('sessionController', [request.action === 'pause' ? 'cancel' : 'prompt', ...(request.action === 'pause' ? [] : ['resolveAgent'])]);
    if (request.action === 'pause') {
      // No await from this final native check through cancel: keepInbox:true would strand pending human input.
      const agent = this.live(request.targetId);
      if (!agent) return this.receipt(request, 'paused', { detail: 'The native conversation is already inactive.' });
      snapshot = cut(agent.session.header, agent.session.snapshotEvents(), agent);
      if (snapshot.revision !== request.expectedRevision) throw new RouteError('REVISION_CHANGED', 'Conversation changed before cancellation.');
      if (snapshot.status === 'unknown') throw new RouteError('NATIVE_TURN_END_MISSING', 'The native turn outcome is unknown; cancellation was not repeated.');
      if (snapshot.queue.length) throw new RouteError('PENDING_INPUT', 'Native cancellation would strand pending input; pause was refused.');
      abort(signal);
      controller.cancel({ sessionId: request.targetId });
      const turn = last(snapshot.events, event => event.type === 'turn/start')?.data.turn;
      const after = cut(agent.session.header, agent.session.snapshotEvents(), agent);
      if (turn !== undefined && agent.status === 'idle') {
        const end = after.events.find(event => event.type === 'turn/end' && event.data.turn === turn);
        if (!end || end.data.reason?.kind === 'interrupted') return this.missingTurnEnd(this.receipt(request, 'unknown'), new Date(this.now()).toISOString(), turn);
        if (end.data.reason?.kind !== 'aborted') return this.receipt(request, 'unknown', { turnId: String(turn), errorCode: 'NATIVE_CANCEL_NOT_CONFIRMED',
          detail: 'The exact native turn ended without an aborted reason; the cancellation acknowledgement does not confirm an interruption.' });
      }
      return this.receipt(request, agent.status === 'running' ? 'accepted' : 'paused', { ...(turn === undefined ? {} : { turnId: String(turn) }), detail: 'Native cancellation requested; confirmation is read from the turn end.' });
    }
    const text = request.action === 'send' ? request.prompt?.trim() : standardPrompt(request.action);
    if (!text) throw new RouteError('EMPTY_PROMPT', 'A nonempty prompt is required.');
    if (!this.executable(snapshot.agent)) throw new RouteError('CAPABILITY_UNAVAILABLE', 'Per-RPC native budget gates are unavailable.');
    if (snapshot.status === 'running') throw new RouteError('BUSY', 'Conversation is already running; do not append a command to another turn.');
    if (snapshot.queue.length) throw new RouteError('PENDING_INPUT', 'Conversation has pending input; do not queue another command.');
    // Public resolution restores the persisted model selection and existing workspace/permission state.
    const found = await controller.resolveAgent(request.targetId);
    if ('error' in found) throw found.error;
    abort(signal);
    const agent = found.agent;
    if (this.live(request.targetId) !== agent || agent.session.header.cwd !== snapshot.header.cwd) throw new RouteError('NATIVE_IDENTITY_MISMATCH', 'Native agent identity changed during resolution.');
    const resolved = cut(agent.session.header, agent.session.snapshotEvents(), agent);
    if (snapshot.agent && resolved.revision !== snapshot.revision) throw new RouteError('REVISION_CHANGED', 'Conversation changed during native resolution.');
    if (!snapshot.agent && resolved.events.filter(event => event.seq > (snapshot.events.at(-1)?.seq ?? -1)).some(event => !['session/end-seed', 'request/header'].includes(event.type))) throw new RouteError('REVISION_CHANGED', 'Conversation received new activity during cold resolution.');
    snapshot = resolved;
    if (snapshot.status === 'unknown') throw new RouteError('NATIVE_TURN_END_MISSING', 'The native turn outcome became unknown during resolution; no prompt was submitted.');
    if (snapshot.status === 'running') throw new RouteError('BUSY', 'Conversation began running during resolution.');
    if (snapshot.queue.length) throw new RouteError('PENDING_INPUT', 'Pending native input appeared during resolution.');
    if (!this.executable(agent)) throw new RouteError('CAPABILITY_UNAVAILABLE', 'Attached native agent cannot enforce the RPC budget.');
    const rpcId = `conversation:${request.operationId}`;
    if (this.fences.has(rpcId) || snapshot.events.some(event => event.type === 'user/message' && rpcOf(event.data as Message) === rpcId)) throw new RouteError('ALREADY_SUBMITTED', 'This operation already has a native submission. Observe its receipt.');
    const deadlineAt = new Date(this.now() + this.budget.maxDurationMs).toISOString();
    this.bind(agent, rpcId, request.action === 'check');
    // The gateway commits intent before calling us, and invokes this exactly once. No retry here.
    await controller.prompt({ requestId: rpcId, sessionId: request.targetId, mode: 'queue', content: [{ type: 'text', text }] }, signal ?? new AbortController().signal);
    return this.receipt(request, 'accepted', { requestId: rpcId, deadlineAt });
  }
  private bind(agent: Agent, rpcId: string, readOnly: boolean, restoration?: { turn: number; deadline: number }): void {
    const fence: Fence = { rpcId, agent, start: this.now(), requests: 0, steps: 0, pendingQuestions: 0, closed: false, release: [] };
    this.fences.set(rpcId, fence);
    if (restoration) {
      fence.turn = restoration.turn;
      fence.start = restoration.deadline - this.budget.maxDurationMs;
      fence.steps = agent.session.snapshotEvents().filter(event => event.type === 'step/start' && event.data.turn === fence.turn).length;
      fence.requests = agent.session.snapshotEvents().filter(event => ['assistant/message', 'assistant/attempt'].includes(event.type) && event.data.turn === fence.turn).length;
      // An open step can have one unsettled request; count it conservatively.
      const lastStep = last(agent.session.snapshotEvents(), event => event.type === 'step/start' && event.data.turn === fence.turn);
      if (lastStep && !agent.session.snapshotEvents().some(event => event.type === 'step/end' && event.data.turn === fence.turn && event.data.step === lastStep.data.step)) fence.requests++;
    }
    const owns = (turn: number): boolean => fence.turn === turn;
    const exhausted = (): boolean => fence.closed || this.now() - fence.start >= this.budget.maxDurationMs || fence.requests >= this.budget.maxRequests;
    const position = (payload: { agent: Agent; turn: number }): boolean => payload.agent === agent && owns(payload.turn);
    const reject = (): void => { fence.blocked = fence.closed ? 'ADAPTER_CLOSED' : 'BUDGET_EXCEEDED'; };
    try {
      fence.release.push(agent.ctx.on('agent/pre-step', async (payload: { agent: Agent; turn: number; step: number; messages: Message[] }, next: () => Promise<{ kind: 'enter'; messages: Message[] } | { kind: 'reject' }>) => {
        if (payload.agent !== agent) return next();
        const containsRpc = payload.messages.some(message => rpcOf(message) === rpcId);
        const foreign = payload.messages.some(message => message.source?.kind === 'user' && rpcOf(message) !== rpcId);
        if (foreign && (containsRpc || owns(payload.turn))) {
          fence.blocked = 'FOREIGN_INPUT'; fence.turn = undefined; fence.closed = true;
          // Native claims precede this hook: preserve every human message, and
          // withdraw only this RPC from an initial mixed claim. No bridge budget
          // or read-only guard is applied to the human's ensuing native turn.
          const decision = await next();
          return decision.kind === 'enter' ? { ...decision, messages: decision.messages.filter(message => rpcOf(message) !== rpcId) } : decision;
        }
        if (fence.turn === undefined && containsRpc) {
          fence.turn = payload.turn;
        }
        if (!owns(payload.turn)) return next();
        if (exhausted() || fence.steps >= this.budget.maxSteps) {
          reject();
          return { kind: 'reject' };
        }
        fence.steps++;
        return next();
      }, { prepend: true }));
      fence.release.push(agent.ctx.on('agent/request', async (payload: { agent: Agent; turn: number }, next: () => Promise<unknown>) => {
        if (!position(payload)) return next();
        if (exhausted()) { reject(); throw new RouteError(fence.blocked!, 'This conversation RPC exhausted its native model-request budget.'); }
        fence.requests++;
        return next();
      }, { prepend: true }));
      fence.release.push(agent.ctx.on('agent/request-error', (payload: { agent: Agent; turn: number }, next: () => Promise<unknown>) => {
        if (!position(payload) || !exhausted()) return next();
        reject(); return Promise.resolve(undefined);
      }, { prepend: true }));
      // Public user-questions waterfall has no durable asked/answered session
      // event. Observe its lifetime without reading questions or choosing an answer.
      fence.release.push(agent.ctx.on('user-questions/request', async (request: { agent?: Agent }, next: () => Promise<unknown>) => {
        const events = agent.session.snapshotEvents(), current = last(events, event => event.type === 'turn/start')?.data.turn;
        if (request.agent !== agent || fence.turn === undefined || current !== fence.turn ||
          events.some(event => event.type === 'turn/end' && event.data.turn === current) || foreignInTurn(events, current, rpcId)) return next();
        fence.pendingQuestions++;
        try { return await next(); }
        finally { fence.pendingQuestions--; }
      }, { prepend: true }));
      fence.release.push((agent.ctx.get('tools') as Tools).guard(execution => {
        const current = last(agent.session.snapshotEvents(), event => event.type === 'turn/start');
        if (execution.agent !== agent || current?.data.turn !== fence.turn) return undefined;
        return fileBoundary(agent, execution, readOnly);
      }));
      const timer = setTimeout(() => { try { this.expire(agent, fence); } catch { /* Keep the native boundary gates fail-closed if a service disappears. */ } }, Math.max(1, fence.start + this.budget.maxDurationMs - this.now()));
      timer.unref(); fence.release.push(() => clearTimeout(timer));
    } catch (error) {
      fence.closed = true;
      for (const release of fence.release.reverse()) release();
      this.fences.delete(rpcId);
      throw new RouteError('CAPABILITY_UNAVAILABLE', `Native RPC fence registration failed: ${String(error)}`);
    }
  }
  /** Best-effort deadline cancellation. Pending or intervening humans forbid native keepInbox cancellation. */
  private expire(agent: Agent, fence: Fence): void {
    if (fence.agent !== agent || fence.turn === undefined || this.now() < fence.start + this.budget.maxDurationMs) return;
    const events = agent.session.snapshotEvents();
    const turn = last(events, event => event.type === 'turn/start')?.data.turn;
    if (turn !== fence.turn || agent.status !== 'running' || events.some(event => event.type === 'turn/end' && event.data.turn === turn)) return;
    if (foreignInTurn(events, turn, fence.rpcId)) { fence.blocked = 'FOREIGN_INPUT'; fence.turn = undefined; fence.closed = true; return; }
    fence.blocked = 'BUDGET_EXCEEDED';
    // The final registry/queue/turn checks and native cancellation have no await.
    if (fence.cancellationRequested || this.live(agent.id) !== agent || agent.inbox.nextTurn.length || agent.inbox.nextStep.length || fence.pendingQuestions > 0 || pendingApprovals(events, turn) > 0 || turnFor(events, fence.rpcId) !== turn) return;
    fence.cancellationRequested = true;
    try { this.service<Controller>('sessionController', ['cancel']).cancel({ sessionId: agent.id }); }
    catch { /* Request/step guards remain closed at the stored deadline. */ }
  }
  private activeJobs(agent?: Agent): number {
    if (!agent) return 0;
    const jobs = this.ctx.get('jobs') as { list?: (agent: Agent) => readonly { status: string }[] } | undefined;
    if (!jobs) return 0;
    if (typeof jobs.list !== 'function') throw new RouteError('CAPABILITY_UNAVAILABLE', 'Native background-job metadata is unavailable.');
    return jobs.list(agent).filter(job => job.status === 'running' || job.status === 'stopping').length;
  }
  async observe(receipt: ActionReceipt, signal?: AbortSignal): Promise<ActionReceipt> {
    if (receipt.framework !== 'dsh') throw new RouteError('FRAMEWORK_MISMATCH', 'Expected a DSH receipt.');
    const snapshot = await this.snapshot(receipt.targetId, signal);
    const at = new Date(this.now()).toISOString();
    if (!receipt.requestId && (!receipt.action || receipt.action === 'pause')) {
      const end = snapshot.events.find(event => event.type === 'turn/end' && String(event.data.turn) === receipt.turnId);
      const start = snapshot.events.find(event => event.type === 'turn/start' && String(event.data.turn) === receipt.turnId);
      if (end?.data.reason?.kind === 'interrupted') return this.missingTurnEnd(receipt, at, end.data.turn);
      if (!end && start && (!snapshot.agent || snapshot.agent.status === 'idle' || receipt.errorCode === 'NATIVE_TURN_END_MISSING')) return this.missingTurnEnd(receipt, at, start.data.turn);
      const baseReceipt = { ...receipt };
      if (end && baseReceipt.errorCode === 'NATIVE_TURN_END_MISSING') { delete baseReceipt.errorCode; delete baseReceipt.detail; }
      return { ...baseReceipt, at, status: end?.data.reason?.kind === 'aborted' ? 'paused' : end ? 'unknown' : receipt.status === 'paused' ? 'paused' : snapshot.status === 'running' ? 'running' : 'unknown' };
    }
    const rpcId = receipt.requestId ?? `conversation:${receipt.operationId}`;
    if (rpcId !== `conversation:${receipt.operationId}`) throw new RouteError('NATIVE_IDENTITY_MISMATCH', 'Receipt RPC identity does not match its operation.');
    let fence = this.fences.get(rpcId);
    const turn = turnFor(snapshot.events, rpcId);
    if (turn === undefined) {
      if (fence?.blocked) return { ...receipt, at, status: 'blocked', errorCode: fence.blocked };
      return { ...receipt, at, status: snapshot.queue.some(message => rpcOf(message) === rpcId) ? 'accepted' : 'unknown' };
    }
    const end = snapshot.events.find(event => event.type === 'turn/end' && event.data.turn === turn);
    if (end?.data.reason?.kind === 'interrupted') return this.missingTurnEnd({ ...receipt, requestId: rpcId }, at, turn);
    if (!end && (!snapshot.agent || snapshot.agent.status === 'idle' || receipt.errorCode === 'NATIVE_TURN_END_MISSING')) return this.missingTurnEnd({ ...receipt, requestId: rpcId }, at, turn);
    if (foreignInTurn(snapshot.events, turn, rpcId)) return { ...receipt, requestId: rpcId, at, turnId: String(turn), status: 'blocked', errorCode: 'FOREIGN_INPUT', detail: 'A human intervened in this turn; this operation no longer controls native execution.' };
    if (fence?.blocked === 'FOREIGN_INPUT') return { ...receipt, requestId: rpcId, at, turnId: String(turn), status: 'blocked', errorCode: fence.blocked, detail: 'A mixed native claim preserved human input and withdrew this RPC.' };
    if (!end && !fence && snapshot.agent && receipt.deadlineAt && Number.isFinite(Date.parse(receipt.deadlineAt))) {
      if (!this.executable(snapshot.agent)) return { ...receipt, at, status: 'unknown', errorCode: 'CAPABILITY_UNAVAILABLE', detail: 'The live RPC budget cannot be restored through public native gates.' };
      this.bind(snapshot.agent, rpcId, receipt.action === 'check', { turn, deadline: Date.parse(receipt.deadlineAt) });
      fence = this.fences.get(rpcId);
    }
    if (!end && !fence && snapshot.agent) return { ...receipt, requestId: rpcId, at, turnId: String(turn), status: 'unknown', errorCode: 'BUDGET_CONTEXT_MISSING', detail: 'A stored RPC deadline is required to restore this live operation; no new turn or deadline was created.' };
    if (!end && fence && snapshot.agent) this.expire(snapshot.agent, fence);
    const answer = snapshot.events.filter(event => event.type === 'assistant/message' && event.data.turn === turn).flatMap(event => (event.data.message?.content ?? []).filter((block: { type: string }) => block.type === 'text').map((block: { text: string }) => block.text)).join('\n');
    let status: ActionReceipt['status'] = 'running';
    const waitingUser = !end && !!snapshot.agent && (pendingApprovals(snapshot.events, turn) > 0 || (fence?.agent === snapshot.agent && fence.pendingQuestions > 0));
    if (waitingUser) status = 'waiting_user';
    if (end) {
      const kind = end.data.reason?.kind;
      if (!fence?.blocked && kind === 'completed' && this.activeJobs(snapshot.agent) > 0) return { ...receipt, requestId: rpcId, at, status: 'running', turnId: String(turn), ...(answer ? { answer } : {}), errorCode: 'BACKGROUND_JOBS_ACTIVE', detail: 'The exact native turn ended, but its live agent still has running or stopping background jobs; completion is not accepted.' };
      status = fence?.blocked || kind === 'blocked' ? 'blocked' : kind === 'completed' ? 'completed' : kind === 'aborted' ? 'paused' : kind === 'error' ? 'failed' : 'unknown';
      if (fence) { for (const release of fence.release.splice(0).reverse()) release(); }
    }
    const baseReceipt = { ...receipt };
    if (['DSH_WAITING_USER', 'BACKGROUND_JOBS_ACTIVE', 'NATIVE_TURN_END_MISSING'].includes(baseReceipt.errorCode ?? '')) { delete baseReceipt.errorCode; delete baseReceipt.detail; }
    return { ...baseReceipt, requestId: rpcId, at, status, turnId: String(turn), ...(answer ? { answer } : {}),
      ...(fence?.blocked ? { errorCode: fence.blocked, detail: 'Budget cutoff is enforced at native step/request boundaries; in-flight cancellation is attempted only with no pending or intervening human input.' } : waitingUser ? { errorCode: 'DSH_WAITING_USER', detail: 'An explicit native approval or user-question request is pending; no automated answer or decision was made.' } : {}) };
  }
  dispose(): void {
    this.closed = true;
    // Live callbacks remain fail-closed for this RPC only until native turn settlement.
    // Removing them during an active turn would let an admitted RPC lose its budget.
    for (const fence of this.fences.values()) fence.closed = true;
  }
}
