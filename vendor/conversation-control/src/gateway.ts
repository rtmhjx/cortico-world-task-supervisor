import { excludedRoots } from '../../task-reporting/src/policy.ts';
import { RouteError, terminal, type ActionReceipt, type ActionRequest, type Conversation, type ConversationAdapter, type ConversationBackend, type Framework } from './contract.ts';
import { StateStore, digest } from './store.ts';
import { PROTECTED_ROOT } from './paths.ts';
import type { DiscoveryScope } from './contract.ts';

interface Operation { hash: string; request: ActionRequest; phase: 'sending' | 'observing' | 'terminal'; receipt: ActionReceipt }
interface State { operations: Record<string, Operation> }
export interface GatewayOptions { adapters: ConversationAdapter[]; stateFile: string; identity: unknown; enabled: boolean; clock?: () => number; maxDurationMs?: number }
export class ConversationGateway implements ConversationBackend {
  private store: StateStore<State>;
  private adapters = new Map<Framework, ConversationAdapter>();
  private queue: Promise<unknown> = Promise.resolve();
  private failures: Record<string, string> = {};
  constructor(private options: GatewayOptions) {
    for (const adapter of options.adapters) { if (this.adapters.has(adapter.framework)) throw new Error('Duplicate adapter.'); this.adapters.set(adapter.framework, adapter); }
    this.store = new StateStore(options.stateFile, { component: 'conversationgateway', schema: 1, delegation: options.identity }, { operations: {} });
    if (Object.values(this.store.read().operations).some(op => op.phase === 'sending')) this.store.update(state => {
      for (const op of Object.values(state.operations)) if (op.phase === 'sending') { op.phase = 'terminal'; op.receipt = { ...op.receipt, status: 'unknown', at: this.iso(), errorCode: 'RESTART_DURING_SUBMISSION', detail: 'Reconcile the original native request; no automatic resubmission.' }; }
    });
  }
  private iso(): string { return new Date((this.options.clock ?? Date.now)()).toISOString(); }
  private adapter(framework: Framework): ConversationAdapter { const adapter = this.adapters.get(framework); if (!adapter) throw new RouteError('FRAMEWORK_UNAVAILABLE', 'Framework is not configured.'); return adapter; }
  private serial<T>(fn: () => Promise<T>): Promise<T> { const task = this.queue.then(fn, fn); this.queue = task.catch(() => undefined); return task; }
  async list(input: { query: string; limit: number; frameworks?: Framework[]; signal?: AbortSignal }): Promise<Conversation[]> {
    if (typeof input.query !== 'string' || input.query.length > 500 || !Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 5) throw new RouteError('INVALID_QUERY', 'Query and limit are invalid.');
    const frameworks = input.frameworks ?? [...this.adapters.keys()];
    if (!frameworks.length || frameworks.some(framework => framework !== 'dsh' && framework !== 'codex')) throw new RouteError('INVALID_FRAMEWORK', 'Choose dsh or codex.');
    const results = await Promise.allSettled(frameworks.map(async framework => this.adapter(framework).list(input)));
    const candidates: Conversation[] = []; let success = 0;
    results.forEach((result, index) => { if (result.status === 'fulfilled') { success++; delete this.failures[frameworks[index]]; candidates.push(...result.value); } else this.failures[frameworks[index]] = result.reason instanceof RouteError ? result.reason.code : 'ADAPTER_UNAVAILABLE'; });
    if (!success) throw new RouteError('BACKENDS_UNAVAILABLE', 'No requested conversation backend is available.');
    return candidates.sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt)).slice(0, input.limit);
  }
  async get(framework: Framework, id: string, signal?: AbortSignal): Promise<Conversation> { return this.adapter(framework).get(id, signal); }
  execute(request: ActionRequest, signal?: AbortSignal): Promise<ActionReceipt> {
    return this.serial(async () => {
      this.validate(request); const previous = this.store.read().operations[request.operationId], hash = digest(request);
      if (previous) { if (previous.hash !== hash) throw new RouteError('ID_CONFLICT', 'Operation ID already belongs to another request.'); return previous.receipt; }
      if (!this.options.enabled || this.store.degraded) throw new RouteError('ADMISSION_PAUSED', 'Conversation control admission is paused.');
      if (signal?.aborted) throw new RouteError('ABORTED', 'Request cancelled before native submission.');
      const operations = Object.values(this.store.read().operations);
      if (operations.some(op => op.request.framework === request.framework && op.request.targetId === request.targetId && (!terminal(op.receipt.status) || op.receipt.status === 'unknown') && (request.action !== 'pause' || op.receipt.status === 'unknown' || op.request.action === 'pause'))) throw new RouteError('TARGET_BUSY', 'An unfinished or unknown operation owns this target.');
      if (operations.length >= 10000 || operations.filter(op => !terminal(op.receipt.status)).length >= 16) throw new RouteError('CAPACITY', 'Gateway operation limit reached.');
      const target = await this.adapter(request.framework).get(request.targetId, signal);
      if (target.revision !== request.expectedRevision) throw new RouteError('TARGET_CHANGED', 'Conversation changed after the preview; inspect and draft again.');
      if (!target.capabilities.includes(request.action)) throw new RouteError('CAPABILITY_UNAVAILABLE', 'Native action is unavailable.');
      if (signal?.aborted) throw new RouteError('ABORTED', 'Request cancelled before durable native submission intent.');
      const initial: ActionReceipt = { operationId: request.operationId, framework: request.framework, targetId: request.targetId, action: request.action, status: 'unknown', at: this.iso(), detail: 'Durable intent reserved before native call.', ...(request.framework === 'dsh' && request.action !== 'pause' ? { requestId: `conversation:${request.operationId}`, deadlineAt: new Date((this.options.clock ?? Date.now)() + (this.options.maxDurationMs ?? 300000)).toISOString() } : {}) };
      this.store.update(state => { state.operations[request.operationId] = { hash, request, phase: 'sending', receipt: initial }; }, { kind: 'operation.reserved', data: { operationId: request.operationId, framework: request.framework, targetId: request.targetId, action: request.action, requestId: initial.requestId, deadlineAt: initial.deadlineAt } });
      let receipt: ActionReceipt;
      try { receipt = await this.adapter(request.framework).execute(request, signal); }
      catch (error) { receipt = { ...initial, at: this.iso(), status: 'unknown', errorCode: error instanceof RouteError ? error.code : 'SUBMISSION_UNKNOWN', detail: 'Native outcome is uncertain. Preserve this ID; do not retry with another ID.' }; }
      if (receipt.operationId !== request.operationId || receipt.targetId !== request.targetId || receipt.framework !== request.framework) receipt = { ...initial, status: 'unknown', errorCode: 'RECEIPT_IDENTITY_MISMATCH', at: this.iso() };
      receipt = { ...initial, ...receipt, action: request.action };
      try { this.save(request.operationId, receipt); }
      catch { return { ...initial, at: this.iso(), errorCode: 'RECEIPT_COMMIT_FAILED', detail: 'Submission may have occurred. State is degraded and new admission is stopped.' }; }
      return receipt;
    });
  }
  private validate(request: ActionRequest): void {
    if (!request || !/^[a-zA-Z0-9_-]{8,100}$/.test(request.operationId) || !['dsh', 'codex'].includes(request.framework) || typeof request.targetId !== 'string' || !request.targetId || request.targetId.length > 200 || !['pause', 'continue', 'check', 'send'].includes(request.action) || typeof request.expectedRevision !== 'string' || !request.expectedRevision || request.expectedRevision.length > 512 || (request.prompt !== undefined && (typeof request.prompt !== 'string' || request.prompt.length > 8000))) throw new RouteError('INVALID_REQUEST', 'Invalid conversation operation.');
    if (request.action !== 'pause' && !request.prompt?.trim()) throw new RouteError('INVALID_REQUEST', 'A prompt is required for the selected action.');
    if (request.action === 'pause' && request.prompt !== undefined) throw new RouteError('INVALID_REQUEST', 'Pause does not submit a prompt.');
  }
  private save(id: string, receipt: ActionReceipt): void { const { answer: _, ...audit } = receipt; this.store.update(state => { const op = state.operations[id]; op.receipt = receipt; op.phase = terminal(receipt.status) ? 'terminal' : 'observing'; }, { kind: 'operation.receipt', data: audit }); }
  observe(operationId: string, signal?: AbortSignal): Promise<ActionReceipt> {
    return this.serial(async () => {
      const op = this.store.read().operations[operationId]; if (!op) throw new RouteError('OPERATION_NOT_FOUND', 'Operation ID is not present in this ledger.');
      if (this.store.degraded || (op.phase !== 'observing' && !(op.receipt.status === 'unknown' && (op.receipt.requestId || op.receipt.turnId)))) return op.receipt;
      const receipt = await this.adapter(op.request.framework).observe(op.receipt, signal);
      if (receipt.operationId !== op.receipt.operationId || receipt.framework !== op.receipt.framework || receipt.targetId !== op.receipt.targetId) throw new RouteError('RECEIPT_IDENTITY_MISMATCH', 'Observed receipt has another identity.');
      if (digest(receipt) !== digest(op.receipt)) this.save(operationId, receipt);
      return receipt;
    });
  }
  private searchScope(): DiscoveryScope {
    const config = this.options.identity && typeof this.options.identity === 'object' ? this.options.identity as Record<string, unknown> : {};
    const roots = (key: string): string[] => Array.isArray(config[key]) ? (config[key] as unknown[]).filter((value): value is string => typeof value === 'string') : [];
    return { roots: { dsh: roots('dshRoots'), codex: roots('codexRoots') }, excludedRoots: excludedRoots(), matchMode: 'literal-substring' };
  }
  private searchWarnings(): Record<string, string[]> {
    return Object.fromEntries([...this.adapters].flatMap(([framework, adapter]) => {
      const codes = [...new Set(adapter.discoveryWarnings?.map(warning => warning.code) ?? [])].slice(0, 10);
      return codes.length ? [[framework, codes]] : [];
    }));
  }
  health(): Record<string, unknown> { return { accepting: this.options.enabled && !this.store.degraded, degraded: this.store.degraded, frameworks: [...this.adapters.keys()], discoveryErrors: { ...this.failures }, discoveryWarnings: this.searchWarnings(), searchScope: this.searchScope(), operations: Object.values(this.store.read().operations).map(op => ({ operationId: op.receipt.operationId, framework: op.receipt.framework, targetId: op.receipt.targetId, status: op.receipt.status, errorCode: op.receipt.errorCode })) }; }
  async diagnostics(): Promise<Record<string, unknown>> { return { accepting: this.options.enabled && !this.store.degraded, degraded: this.store.degraded, frameworks: [...this.adapters.keys()], discoveryErrors: { ...this.failures }, discoveryWarnings: this.searchWarnings(), searchScope: this.searchScope() }; }
  async dispose(): Promise<void> { await this.queue; const results = await Promise.allSettled([...this.adapters.values()].map(adapter => adapter.dispose?.())); this.store.close(); const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected'); if (failed.length) throw new AggregateError(failed.map(r => r.reason), 'Conversation adapters did not all dispose.'); }
}
