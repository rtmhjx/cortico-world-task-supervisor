import { isExcludedPath } from '../../task-reporting/src/policy.ts';
import BundledWebSocket from 'ws';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { connect, type Socket as NativeSocket } from 'node:net';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { RouteError, standardPrompt, type ActionReceipt, type ActionRequest, type Conversation, type ConversationAdapter } from './contract.ts';
import { allowedDelegationRoot, allowedWorkspace, canonical, within, PROTECTED_ROOT } from './paths.ts';

/** Only an already configured, shared app-server is supported. Never spawn a second server. */
export interface CodexRpcMessage { method: string; params?: unknown; id?: string | number }
export interface CodexRpcClient {
  request(method: string, params: Record<string, unknown>, signal?: AbortSignal): Promise<unknown>;
  notify(method: string, params: Record<string, unknown>): Promise<void> | void;
  subscribe(listener: (message: CodexRpcMessage) => void): () => void;
  dispose(): Promise<void> | void;
}
export interface CodexConversationOptions {
  endpoint?: string;
  /** Explicitly opt into the version-pinned, existing desktop coordination pipe. */
  desktopIpc?: CodexDesktopIpcOptions;
  allowedRoots: string[];
  /** Injection is intended for protocol tests or a host-owned transport to that same backend. */
  rpc?: CodexRpcClient;
  maxDurationMs?: number;
  requestTimeoutMs?: number;
  bearerToken?: () => string | undefined | Promise<string | undefined>;
  runtimePackage?: string;
}
type Obj = Record<string, unknown>;
const obj = (value: unknown): Obj => value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : {};
const str = (value: unknown): string => typeof value === 'string' ? value : '';
const now = (): string => new Date().toISOString();
const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const CODEX_ORDINARY_SOURCE_KINDS = ['cli', 'vscode', 'appServer', 'unknown'] as const;
const turns = (thread: Obj): Obj[] => Array.isArray(thread.turns) ? thread.turns.map(obj) : [];
const active = (thread: Obj): Obj | undefined => turns(thread).slice().reverse().find(turn => turn.status === 'inProgress');
const nativeStatus = (thread: Obj): string => str(obj(thread.status).type);
const flags = (thread: Obj): string[] => Array.isArray(obj(thread.status).activeFlags) ? obj(thread.status).activeFlags as string[] : [];
const publicReply = (turn: Obj): string => (Array.isArray(turn.items) ? turn.items : [])
  .map(obj).filter(item => item.type === 'agentMessage' && (item.phase === 'final_answer' || item.phase === undefined || item.phase === null))
  .map(item => str(item.text)).filter(Boolean).join('\n\n').slice(-24_000);

/** DNS names are rejected so a hostname cannot be rebound off-loopback. */
export function validateCodexEndpoint(endpoint: string): string {
  let url: URL;
  try { url = new URL(endpoint); } catch { throw new RouteError('CODEX_ENDPOINT_INVALID', 'Invalid Codex app-server endpoint'); }
  if (!['ws:', 'wss:'].includes(url.protocol) || !['127.0.0.1', '[::1]'].includes(url.hostname)
    || !url.port || url.username || url.password || url.search || url.hash) {
    throw new RouteError('CODEX_ENDPOINT_INVALID', 'Codex endpoint must be an explicit numeric loopback WebSocket port');
  }
  return url.toString();
}

class RpcServerError extends Error {
  constructor(readonly rpcCode: number, message: string) { super(message); this.name = 'RpcServerError'; }
}
interface Socket {
  on(event: string, listener: (...args: any[]) => void): void;
  send(data: string, callback?: (error?: Error) => void): void;
  close(): void;
  terminate(): void;
}
interface Pending { resolve(value: unknown): void; reject(reason: Error): void; cleanup(): void }

/** One connection, no reconnection and no automatic request retries, including overload responses. */
export class CodexWebSocketRpc implements CodexRpcClient {
  private socket?: Socket;
  private connecting?: Promise<void>;
  private failure?: Error;
  private closed = false;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly listeners = new Set<(message: CodexRpcMessage) => void>();
  constructor(private readonly options: Pick<CodexConversationOptions, 'endpoint' | 'requestTimeoutMs' | 'bearerToken' | 'runtimePackage'>) {
    validateCodexEndpoint(options.endpoint ?? '');
  }
  subscribe(listener: (message: CodexRpcMessage) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private emit(message: CodexRpcMessage): void {
    for (const listener of this.listeners) {
      // A consumer must not crash the WebSocket event handler.
      try { listener(message); } catch { /* Consumers own their diagnostics. */ }
    }
  }
  private fail(error: Error): void {
    if (this.failure) return;
    this.failure = error;
    for (const pending of this.pending.values()) { pending.cleanup(); pending.reject(error); }
    this.pending.clear();
    this.emit({ method: '$transport/closed' });
  }
  private async connect(): Promise<void> {
    if (this.closed) throw new RouteError('CODEX_DISPOSED', 'Codex transport has been disposed');
    if (this.failure) throw this.failure;
    if (!this.connecting) this.connecting = (async () => {
      const token = await this.options.bearerToken?.();
      const Ws = (this.options.runtimePackage ? createRequire(this.options.runtimePackage)('ws') : BundledWebSocket) as new (endpoint: string, options: Obj) => Socket;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { const error = new RouteError('CODEX_CONNECT_TIMEOUT', 'Codex transport did not connect'); this.fail(error); this.socket?.terminate(); reject(error); }, this.options.requestTimeoutMs ?? 15_000);
        timeout.unref();
        try {
          this.socket = new Ws(this.options.endpoint!, { maxPayload: 8 * 1024 * 1024, handshakeTimeout: this.options.requestTimeoutMs ?? 15_000,
            headers: token ? { Authorization: `Bearer ${token}` } : {} });
          this.socket.on('open', () => { clearTimeout(timeout); resolve(); });
          this.socket.on('error', (error: Error) => { clearTimeout(timeout); this.fail(new RouteError('CODEX_TRANSPORT_LOST', 'Codex transport failed')); reject(error); });
          this.socket.on('close', () => { clearTimeout(timeout); const error = new RouteError('CODEX_TRANSPORT_LOST', 'Codex transport closed'); this.fail(error); reject(error); });
          this.socket.on('message', (data: { toString(): string }) => this.receive(data.toString()));
        } catch (error) { clearTimeout(timeout); reject(error); }
      });
    })();
    await this.connecting;
  }
  private receive(text: string): void {
    let wire: Obj;
    try { wire = obj(JSON.parse(text)); } catch { this.fail(new RouteError('CODEX_PROTOCOL_INVALID', 'Codex sent invalid JSON')); this.socket?.terminate(); return; }
    if (typeof wire.method === 'string') {
      this.emit({ method: wire.method, params: wire.params, ...(typeof wire.id === 'string' || typeof wire.id === 'number' ? { id: wire.id } : {}) });
      // Server-initiated approvals/user-input requests deliberately receive no automated decision.
      return;
    }
    if (typeof wire.id !== 'number') return;
    const pending = this.pending.get(wire.id);
    if (!pending) return;
    this.pending.delete(wire.id); pending.cleanup();
    if (wire.error) { const error = obj(wire.error); pending.reject(new RpcServerError(Number(error.code), str(error.message))); }
    else if ('result' in wire) pending.resolve(wire.result);
    else pending.reject(new RouteError('CODEX_PROTOCOL_INVALID', 'Codex response has no result'));
  }
  async request(method: string, params: Obj, signal?: AbortSignal): Promise<unknown> {
    await this.connect();
    signal?.throwIfAborted();
    if (this.failure) throw this.failure;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const abort = () => { this.pending.delete(id); cleanup(); reject(new RouteError('CODEX_REQUEST_ABORTED', 'Codex request aborted; outcome may be unknown')); };
      const timeout = setTimeout(() => { this.pending.delete(id); cleanup(); reject(new RouteError('CODEX_REQUEST_TIMEOUT', 'Codex request timed out; outcome may be unknown')); }, this.options.requestTimeoutMs ?? 15_000);
      timeout.unref();
      const cleanup = () => { clearTimeout(timeout); signal?.removeEventListener('abort', abort); };
      this.pending.set(id, { resolve, reject, cleanup });
      signal?.addEventListener('abort', abort, { once: true });
      this.socket!.send(JSON.stringify({ id, method, params }), error => { if (error) { this.pending.delete(id); cleanup(); reject(new RouteError('CODEX_TRANSPORT_LOST', 'Codex send failed; outcome may be unknown')); } });
    });
  }
  async notify(method: string, params: Obj): Promise<void> { await this.connect(); if (this.failure) throw this.failure; this.socket!.send(JSON.stringify({ method, params })); }
  dispose(): void { this.closed = true; this.socket?.close(); this.fail(new RouteError('CODEX_DISPOSED', 'Codex transport disposed')); }
}

interface LocalOperation { fingerprint: string; promise: Promise<ActionReceipt>; receipt?: ActionReceipt }
interface OwnedTurn { operationId: string; targetId: string; turnId: string; deadline: number; timer?: ReturnType<typeof setTimeout>; expired: boolean; interruptFailed?: boolean }

export class CodexConversationAdapter implements ConversationAdapter {
  readonly framework = 'codex' as const;
  private readonly rpc?: CodexRpcClient;
  private initialized?: Promise<void>;
  private readonly operations = new Map<string, LocalOperation>();
  private readonly owned = new Map<string, OwnedTurn>();
  private readonly pendingServerRequests = new Map<string, string>();
  private readonly latestTurns = new Map<string, Obj>();
  private readonly unsubscribe?: () => void;
  private readonly maxDurationMs: number;
  private disposed = false;
  constructor(private readonly options: CodexConversationOptions) {
    this.maxDurationMs = options.maxDurationMs ?? 300_000;
    if (!Number.isInteger(this.maxDurationMs) || this.maxDurationMs < 1 || this.maxDurationMs > 300_000) throw new RouteError('CODEX_BUDGET_INVALID', 'Codex duration budget must be between 1 and 300000 ms');
    if (options.endpoint) validateCodexEndpoint(options.endpoint);
    if ([options.endpoint, options.desktopIpc, options.rpc].filter(Boolean).length > 1) throw new RouteError('CODEX_TRANSPORT_CONFLICT', 'Configure exactly one Codex transport');
    this.rpc = options.rpc ?? (options.desktopIpc ? new CodexDesktopIpcRpc({ ...options.desktopIpc, allowedRoots: options.allowedRoots, requestTimeoutMs: options.requestTimeoutMs }) : options.endpoint ? new CodexWebSocketRpc(options) : undefined);
    this.unsubscribe = this.rpc?.subscribe(message => this.onMessage(message));
  }
  private onMessage(message: CodexRpcMessage): void {
    const params = obj(message.params);
    const threadId = str(params.threadId), turn = obj(params.turn), turnId = str(params.turnId) || str(turn.id);
    if (message.method === '$transport/closed') {
      for (const entry of this.operations.values()) if (entry.receipt && ['accepted', 'running', 'waiting_user'].includes(entry.receipt.status)) {
        entry.receipt = { ...entry.receipt, status: 'unknown', at: now(), errorCode: 'CODEX_TRANSPORT_LOST', detail: 'Transport lost; do not resubmit this operation' };
      }
      return;
    }
    if (threadId && turnId && ['turn/started', 'turn/completed'].includes(message.method)) {
      this.latestTurns.set(`${threadId}:${turnId}`, turn);
      if (message.method === 'turn/completed') this.clearTimer(`${threadId}:${turnId}`);
    }
    if (message.id !== undefined && threadId && turnId) this.pendingServerRequests.set(`${typeof message.id}:${message.id}`, `${threadId}:${turnId}`);
    if (message.method === 'serverRequest/resolved' && (typeof params.requestId === 'string' || typeof params.requestId === 'number')) {
      // Re-read native activeFlags on observe; never decide an approval here.
      this.pendingServerRequests.delete(`${typeof params.requestId}:${params.requestId}`);
    }
  }
  private async ready(signal?: AbortSignal): Promise<CodexRpcClient> {
    if (this.disposed) throw new RouteError('CODEX_DISPOSED', 'Codex adapter disposed');
    if (!this.rpc) throw new RouteError('CODEX_DISABLED', 'No shared Codex app-server endpoint configured; live Codex control is disabled');
    if (!this.initialized) this.initialized = (async () => {
      await this.rpc!.request('initialize', { clientInfo: { name: 'cortico_conversation_control', title: 'Cortico Conversation Control', version: '0.1.0' } }, signal);
      await this.rpc!.notify('initialized', {});
    })();
    await this.initialized;
    return this.rpc;
  }
  private async validateThread(thread: Obj, id?: string): Promise<void> {
    if (!str(thread.id) || id && thread.id !== id) throw new RouteError('CODEX_THREAD_INVALID', 'Codex thread identity mismatch');
    if (!await allowedWorkspace(str(thread.cwd), this.options.allowedRoots)) throw new RouteError('WORKSPACE_DENIED', 'Codex conversation workspace is outside delegated roots');
  }
  private conversation(thread: Obj): Conversation {
    const status = nativeStatus(thread);
    const updated = typeof thread.updatedAt === 'number' ? new Date(thread.updatedAt * 1000).toISOString() : str(thread.updatedAt) || '1970-01-01T00:00:00.000Z';
    return { framework: 'codex', id: str(thread.id), title: typeof thread.name === 'string' ? thread.name : null,
      workspace: str(thread.cwd), lastActivityAt: updated, summary: str(thread.preview).slice(0, 1600),
      status: status === 'active' ? 'running' : ['idle', 'notLoaded'].includes(status) ? 'idle' : 'unknown',
      revision: hash([thread.id, thread.cwd, thread.name ?? null, thread.updatedAt ?? null, thread.status ?? null]),
      capabilities: ['pause', 'continue', 'check', 'send'], source: this.options.desktopIpc ? 'Codex existing desktop IPC (version pinned)' : 'Codex shared app-server API' };
  }
  async list(input: { query: string; limit: number; signal?: AbortSignal }): Promise<Conversation[]> {
    const rpc = await this.ready(input.signal);
    const limit = Math.max(1, Math.min(5, Math.floor(input.limit)));
    const query = input.query.trim().slice(0, 500).toLocaleLowerCase();
    const results: Conversation[] = [];
    let cursor: string | undefined;
    const seen = new Set<string>();
    for (let page = 0; page < 4 && results.length < limit; page++) {
      const response = obj(await rpc.request('thread/list', { ...(cursor ? { cursor } : {}), limit: 50, sortKey: 'updated_at', sortDirection: 'desc',
        archived: false, useStateDbOnly: true, sourceKinds: [...CODEX_ORDINARY_SOURCE_KINDS] }, input.signal));
      if (!Array.isArray(response.data)) throw new RouteError('CODEX_PROTOCOL_INVALID', 'Codex thread/list response has no data');
      for (const raw of response.data) {
        const thread = obj(raw);
        if (!str(thread.id) || !await allowedWorkspace(str(thread.cwd), this.options.allowedRoots)) continue;
        const value = this.conversation(thread);
        if (!query || `${value.title ?? ''}\n${value.summary}\n${value.workspace}`.toLocaleLowerCase().includes(query)) results.push(value);
        if (results.length >= limit) break;
      }
      cursor = str(response.nextCursor) || undefined;
      if (!cursor || seen.has(cursor)) break;
      seen.add(cursor);
    }
    return results;
  }
  private async read(id: string, signal?: AbortSignal): Promise<Obj> {
    if (!id || id.length > 200) throw new RouteError('CODEX_THREAD_INVALID', 'Invalid Codex thread id');
    const rpc = await this.ready(signal);
    // Authorize summary metadata before asking the backend to load any turn contents.
    const summary = obj(obj(await rpc.request('thread/read', { threadId: id, includeTurns: false }, signal)).thread);
    await this.validateThread(summary, id);
    const thread = obj(obj(await rpc.request('thread/read', { threadId: id, includeTurns: true }, signal)).thread);
    await this.validateThread(thread, id);
    return thread;
  }
  async get(id: string, signal?: AbortSignal): Promise<Conversation> { return this.conversation(await this.read(id, signal)); }
  private receipt(request: ActionRequest, fields: Partial<ActionReceipt>): ActionReceipt {
    return { operationId: request.operationId, framework: 'codex', targetId: request.targetId, action: request.action, status: 'failed', at: now(), ...fields };
  }
  async execute(request: ActionRequest, signal?: AbortSignal): Promise<ActionReceipt> {
    if (request.framework !== 'codex' || !request.operationId || request.operationId.length > 200) throw new RouteError('CODEX_REQUEST_INVALID', 'Invalid Codex operation identity');
    const fingerprint = hash(request);
    const prior = this.operations.get(request.operationId);
    if (prior) { if (prior.fingerprint !== fingerprint) throw new RouteError('OPERATION_CONFLICT', 'Operation id was used for different input'); return prior.receipt ?? prior.promise; }
    const entry: LocalOperation = { fingerprint, promise: Promise.resolve(this.receipt(request, {})) };
    this.operations.set(request.operationId, entry);
    entry.promise = this.executeOnce(request, signal).then(receipt => { entry.receipt = receipt; return receipt; });
    return entry.promise;
  }
  private async executeOnce(request: ActionRequest, signal?: AbortSignal): Promise<ActionReceipt> {
    let sideEffectIssued = false;
    try {
      const rpc = await this.ready(signal);
      let thread = await this.read(request.targetId, signal);
      if (this.conversation(thread).revision !== request.expectedRevision) throw new RouteError('STALE_SELECTION', 'Conversation changed after selection; refresh and choose again');
      const currentTurn = active(thread);
      if (request.action === 'pause') {
        if (nativeStatus(thread) === 'active' && !currentTurn) throw new RouteError('CODEX_ACTIVE_TURN_UNKNOWN', 'Active turn id is unavailable; cannot pause safely');
        if (!currentTurn) return this.receipt(request, { status: 'paused', detail: 'No active native turn; nothing was interrupted' });
        sideEffectIssued = true;
        await rpc.request('turn/interrupt', { threadId: request.targetId, turnId: str(currentTurn.id) }, signal);
        return this.receipt(request, { status: 'accepted', turnId: str(currentTurn.id), detail: 'Interrupt accepted; awaiting native interrupted status' });
      }
      if (currentTurn || nativeStatus(thread) === 'active') throw new RouteError('CONVERSATION_BUSY', 'Conversation has an active turn; no steering or queued prompt was sent');
      if (!['idle', 'notLoaded'].includes(nativeStatus(thread))) throw new RouteError('CODEX_STATUS_UNKNOWN', 'Cannot safely start a turn with unknown runtime status');
      const prompt = request.action === 'send' ? request.prompt : standardPrompt(request.action);
      if (!prompt?.trim() || prompt.length > 16_000) throw new RouteError('PROMPT_INVALID', 'Prompt must be nonempty and at most 16000 characters');
      if (nativeStatus(thread) === 'notLoaded') {
        // Omitted policy/model/cwd fields preserve the existing thread configuration.
        sideEffectIssued = true;
        await rpc.request('thread/resume', { threadId: request.targetId }, signal);
        thread = await this.read(request.targetId, signal);
        if (active(thread) || nativeStatus(thread) === 'active') throw new RouteError('CONVERSATION_BUSY', 'Conversation became busy during resume; prompt was not sent');
        if (!['idle', 'notLoaded'].includes(nativeStatus(thread))) throw new RouteError('CODEX_STATUS_UNKNOWN', 'Resumed native runtime is not idle; prompt was not sent');
      }
      // Re-read immediately before the submission. turn/start has no compare-and-swap field.
      const latest = await this.read(request.targetId, signal);
      if (nativeStatus(latest) === 'active' || active(latest)) throw new RouteError('CONVERSATION_BUSY', 'Conversation became busy; prompt was not sent');
      if (nativeStatus(latest) !== 'idle') throw new RouteError('CODEX_STATUS_UNKNOWN', 'Native runtime is not loaded and idle; prompt was not sent');
      if (this.conversation(latest).revision !== this.conversation(thread).revision) throw new RouteError('STALE_SELECTION', 'Conversation changed before submission; prompt was not sent');
      signal?.throwIfAborted();
      sideEffectIssued = true;
      const deadline = Date.now() + this.maxDurationMs;
      const response = obj(await rpc.request('turn/start', { threadId: request.targetId, input: [{ type: 'text', text: prompt }] }, signal));
      const turn = obj(response.turn), turnId = str(turn.id);
      if (!turnId) return this.receipt(request, { status: 'unknown', errorCode: 'CODEX_TURN_ID_MISSING', detail: 'Turn submission response lacks identity; do not resubmit' });
      const receipt = this.fromTurn(this.receipt(request, { status: 'accepted', turnId, deadlineAt: new Date(deadline).toISOString(),
        detail: request.action === 'check' ? 'Check uses a read-only instruction with inherited native permissions; sandbox is not overridden' : 'Native turn accepted; task completion has not been verified' }), turn);
      if (['accepted', 'running', 'waiting_user'].includes(receipt.status)) this.armBudget({ operationId: request.operationId, targetId: request.targetId, turnId, deadline, expired: false });
      return receipt;
    } catch (error) {
      const nativeError = error instanceof RpcServerError;
      const uncertain = sideEffectIssued && !nativeError && !(error instanceof RouteError && ['CONVERSATION_BUSY', 'WORKSPACE_DENIED', 'STALE_SELECTION', 'CODEX_DESKTOP_COLD_UNSUPPORTED'].includes(error.code));
      return this.receipt(request, { status: uncertain ? 'unknown' : 'failed',
        errorCode: error instanceof RouteError ? error.code : nativeError ? 'CODEX_RPC_REJECTED' : 'CODEX_FAILURE',
        detail: uncertain ? 'Native outcome may be unknown; inspect this operation and never resubmit it automatically' : 'Native request rejected or validation failed; no prompt retry' });
    }
  }
  private fromTurn(receipt: ActionReceipt, turn: Obj): ActionReceipt {
    const native = str(turn.status);
    const status = native === 'completed' ? 'completed' : native === 'interrupted' ? 'paused' : native === 'failed' ? 'failed' : native === 'inProgress' ? 'running' : 'unknown';
    const owned = this.owned.get(`${receipt.targetId}:${receipt.turnId}`);
    return { ...receipt, status, at: now(), ...(publicReply(turn) ? { answer: publicReply(turn) } : {}),
      ...(native === 'failed' ? { errorCode: 'CODEX_TURN_FAILED', detail: 'Native turn failed' } : {}),
      ...(owned?.expired ? { errorCode: 'CODEX_DURATION_EXCEEDED', detail: `Router duration budget reached; native turn status ${native || 'unknown'} was observed` } : {}) };
  }
  async observe(receipt: ActionReceipt, signal?: AbortSignal): Promise<ActionReceipt> {
    if (receipt.framework !== 'codex' || !receipt.targetId) throw new RouteError('CODEX_RECEIPT_INVALID', 'Invalid Codex receipt');
    const local = this.operations.get(receipt.operationId)?.receipt;
    if (local?.status === 'unknown') { if (!local.turnId) return local; receipt = local; }
    if (!receipt.turnId || ['completed', 'paused', 'failed'].includes(receipt.status)) return receipt;
    try {
      const thread = await this.read(receipt.targetId, signal);
      const exact = turns(thread).find(turn => turn.id === receipt.turnId) ?? this.latestTurns.get(`${receipt.targetId}:${receipt.turnId}`);
      if (!exact) return { ...receipt, status: 'unknown', at: now(), errorCode: 'CODEX_TURN_NOT_FOUND', detail: 'The exact submitted turn could not be found; do not resubmit' };
      let result = this.fromTurn(receipt, exact);
      // A known turn permits same-ID read-only reconciliation. Still-active evidence cannot
      // turn an ambiguous interrupt into a new automatic interrupt or prompt submission.
      if (receipt.status === 'unknown' && result.status === 'running') return { ...receipt, at: now(), detail: 'Exact native turn remains active; prior action is unconfirmed; no side effect retry' };
      // The gateway passes its persisted receipt. Ownership is action+exact turn+stored cutoff,
      // never inferred from an arbitrary active turn or a pause request against somebody else's work.
      const deadline = Date.parse(receipt.deadlineAt ?? '');
      const key = `${receipt.targetId}:${receipt.turnId}`;
      if (result.status === 'running' && ['continue', 'check', 'send'].includes(receipt.action ?? '') && Number.isFinite(deadline) && receipt.status !== 'unknown') {
        if (!this.owned.has(key)) this.armBudget({ operationId: receipt.operationId, targetId: receipt.targetId, turnId: receipt.turnId!, deadline, expired: false });
        if (deadline <= Date.now() && !this.owned.get(key)!.expired) await this.expire(this.owned.get(key)!);
        result = this.fromTurn(receipt, exact);
        if (this.owned.get(key)?.interruptFailed) result = { ...result, status: 'unknown', errorCode: 'CODEX_BUDGET_INTERRUPT_UNKNOWN', detail: 'Duration limit reached but exact-turn interruption could not be confirmed; no retry' };
      }
      if (result.status === 'running' && (flags(thread).some(flag => ['waitingOnApproval', 'waitingOnUserInput'].includes(flag)) || [...this.pendingServerRequests.values()].includes(`${receipt.targetId}:${receipt.turnId}`))) {
        result = { ...result, status: 'waiting_user', errorCode: 'CODEX_WAITING_USER', detail: 'Native approval or user input is pending; no automated decision was made' };
      }
      if (['completed', 'paused', 'failed', 'unknown'].includes(result.status)) this.clearTimer(`${receipt.targetId}:${receipt.turnId}`);
      const entry = this.operations.get(receipt.operationId); if (entry) entry.receipt = result;
      return result;
    } catch { return { ...receipt, status: 'unknown', at: now(), errorCode: 'CODEX_OBSERVE_UNAVAILABLE', detail: 'Read-only observation failed; do not resubmit' }; }
  }
  private armBudget(turn: OwnedTurn): void {
    const key = `${turn.targetId}:${turn.turnId}`;
    this.owned.set(key, turn);
    turn.timer = setTimeout(() => { void this.expire(turn).catch(() => { /* expire contains failures; no event-handler rejection */ }); }, Math.max(1, turn.deadline - Date.now()));
    turn.timer.unref();
  }
  private async expire(turn: OwnedTurn): Promise<void> {
    if (turn.expired) return;
    turn.expired = true;
    this.clearTimer(`${turn.targetId}:${turn.turnId}`);
    try {
      const thread = await this.read(turn.targetId);
      const current = active(thread);
      if (current?.id !== turn.turnId) { this.clearTimer(`${turn.targetId}:${turn.turnId}`); return; }
      await (await this.ready()).request('turn/interrupt', { threadId: turn.targetId, turnId: turn.turnId });
    } catch {
      turn.interruptFailed = true;
      const entry = this.operations.get(turn.operationId);
      if (entry?.receipt) entry.receipt = { ...entry.receipt, status: 'unknown', at: now(), errorCode: 'CODEX_BUDGET_INTERRUPT_UNKNOWN', detail: 'Duration limit reached but exact-turn interruption could not be confirmed; no retry' };
    }
  }
  private clearTimer(key: string): void { const owned = this.owned.get(key); if (owned?.timer) { clearTimeout(owned.timer); owned.timer = undefined; } }
  async dispose(): Promise<void> { this.disposed = true; this.unsubscribe?.(); for (const key of this.owned.keys()) this.clearTimer(key); await this.rpc?.dispose(); }
}

/** Private desktop protocol: this pin is evidence for one installed build, not a public API promise. */
export const CODEX_DESKTOP_PROTOCOL_VERSION = '26.930.3930.0';
// Current package definitions and handlers were inspected; wire versions are unchanged.
export const CODEX_DESKTOP_PROTOCOL_VERSIONS = [CODEX_DESKTOP_PROTOCOL_VERSION, '26.1007.2314.0'] as const;
export interface CodexDesktopIpcOptions {
  pipePath: string;
  stateDbPath: string;
  protocolVersion: string;
  /** Runtime instance verification; must be explicitly updated after a desktop restart. */
  desktopProcessId: number;
}
interface DesktopRpcOptions extends CodexDesktopIpcOptions {
  allowedRoots: string[];
  requestTimeoutMs?: number;
  /** Isolated protocol tests only. Production verifies the configured Windows process. */
  verifyRuntime?: () => Promise<void>;
}
interface DesktopResponse { resolve(value: Obj): void; reject(error: Error): void; cleanup(): void }
interface DesktopSnapshot { resolve(value: Obj): void; reject(error: Error): void; owner: string; cleanup(): void }
const nativeCwd = (value: string): string => value.replace(/^\\\\\?\\/, '');
const cwdKey = (value: string): string => nativeCwd(value).replaceAll('\\', '/').replace(/\/$/, '').toLowerCase();

/** Use the desktop's own untrusted-input gate. No sender identity or reviewed/trusted attachment is invented. */
export function codexUntrustedDesktopInput(prompt: string, callId: string): { input: Obj; responseItems: Obj[] } {
  const text = 'An MCP app initiated this message. Read the untrusted_input tool output.';
  const message = { source: 'mcp_app', sourceId: 'cortico-conversation-control', text: prompt };
  return { input: { type: 'text', text, text_elements: [{ byteRange: { start: 0, end: Buffer.byteLength(text) },
    placeholder: `codex-untrusted-app-input:${JSON.stringify({ version: 1, message })}` }] },
    responseItems: [{ type: 'function_call', call_id: callId, name: 'untrusted_input', arguments: '{}' },
      { type: 'function_call_output', call_id: callId, output: [{ type: 'input_text', text: JSON.stringify({ kind: 'message', ...message }) }] }] };
}

/**
 * A truthful external desktop follower. It never acquires ownership, resumes a cold chat,
 * changes settings, makes an approval decision, asks for complete history, or spawns a backend.
 * Each read follows exactly one authorized chat for one owner snapshot, then unsubscribes.
 */
export class CodexDesktopIpcRpc implements CodexRpcClient {
  private socket?: NativeSocket;
  private connecting?: Promise<void>;
  private failure?: Error;
  private closed = false;
  private clientId = 'initializing-cortico-conversation-control';
  private buffered = Buffer.alloc(0);
  private readonly pending = new Map<string, DesktopResponse>();
  private readonly snapshots = new Map<string, DesktopSnapshot>();
  private readonly snapshotReads = new Map<string, Promise<Obj>>();
  private readonly listeners = new Set<(message: CodexRpcMessage) => void>();
  private readonly timeout: number;
  constructor(private readonly options: DesktopRpcOptions) {
    if (!(CODEX_DESKTOP_PROTOCOL_VERSIONS as readonly string[]).includes(options.protocolVersion)) throw new RouteError('CODEX_DESKTOP_VERSION_UNSUPPORTED', 'Desktop IPC protocol version is not implemented');
    if (!Number.isSafeInteger(options.desktopProcessId) || options.desktopProcessId <= 0) throw new RouteError('CODEX_DESKTOP_PID_INVALID', 'Explicit desktop process id required');
    if (!options.verifyRuntime && options.pipePath !== '\\\\.\\pipe\\codex-ipc') throw new RouteError('CODEX_DESKTOP_PIPE_INVALID', 'Only the existing Codex desktop pipe is supported');
    if (!options.stateDbPath || !options.allowedRoots.length) throw new RouteError('CODEX_DESKTOP_CONFIG_INVALID', 'Explicit state database and delegated workspace roots required');
    this.timeout = options.requestTimeoutMs ?? 8000;
  }
  subscribe(listener: (message: CodexRpcMessage) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private emit(message: CodexRpcMessage): void { for (const listener of this.listeners) { try { listener(message); } catch { /* Consumer owns diagnostics. */ } } }
  private fail(error: Error): void {
    if (this.failure) return;
    this.failure = error;
    for (const value of this.pending.values()) { value.cleanup(); value.reject(error); } this.pending.clear();
    for (const value of this.snapshots.values()) { value.cleanup(); value.reject(error); } this.snapshots.clear();
    this.emit({ method: '$transport/closed' });
  }
  private async verifyRuntime(): Promise<void> {
    if (this.options.verifyRuntime) return this.options.verifyRuntime();
    if (process.platform !== 'win32') throw new RouteError('CODEX_DESKTOP_PLATFORM_UNSUPPORTED', 'This pinned desktop transport is Windows only');
    const executable = await new Promise<string>((resolve, reject) => {
      // Numeric PID only. No user text, credentials, paths or shell interpolation enter the command.
      // Query the pinned process directly: WMI/CIM startup can exhaust the same bounded IPC deadline.
      const command = `Get-Process -Id ${this.options.desktopProcessId} -ErrorAction Stop | Select-Object -ExpandProperty Path`;
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, timeout: this.timeout, maxBuffer: 4096 }, (error, stdout) => error ? reject(new RouteError('CODEX_DESKTOP_RUNTIME_CHANGED', 'Pinned desktop process is unavailable; verify the current desktop version and PID before reconfiguration.')) : resolve(stdout.trim()));
    });
    if (!executable.toLowerCase().includes(`\\openai.codex_${this.options.protocolVersion}_x64__`) || !/\\(?:codex|chatgpt)\.exe$/i.test(executable)) {
      throw new RouteError('CODEX_DESKTOP_RUNTIME_CHANGED', 'Configured desktop process no longer matches the pinned installation; explicit reconfiguration required');
    }
  }
  private async connect(): Promise<void> {
    if (this.closed) throw new RouteError('CODEX_DISPOSED', 'Desktop IPC disposed');
    if (this.failure) throw this.failure;
    if (!this.connecting) this.connecting = (async () => {
      await this.verifyRuntime();
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { this.socket?.destroy(); reject(new RouteError('CODEX_CONNECT_TIMEOUT', 'Desktop IPC connection timeout')); }, this.timeout); timer.unref();
        this.socket = connect(this.options.pipePath);
        this.socket.once('connect', () => { clearTimeout(timer); resolve(); });
        this.socket.on('data', chunk => this.receive(chunk));
        this.socket.on('error', () => { clearTimeout(timer); const error = new RouteError('CODEX_TRANSPORT_LOST', 'Desktop IPC connection failed'); this.fail(error); reject(error); });
        this.socket.on('close', () => { clearTimeout(timer); const error = new RouteError('CODEX_TRANSPORT_LOST', 'Desktop IPC disconnected'); this.fail(error); reject(error); });
      });
      const response = await this.wireRequest('initialize', { clientType: 'cortico-conversation-control-external' }, 0);
      if (!str(obj(response.result).clientId)) throw new RouteError('CODEX_PROTOCOL_INVALID', 'Desktop IPC handshake has no external client id');
      this.clientId = str(obj(response.result).clientId);
    })();
    await this.connecting;
  }
  private send(wire: Obj): void {
    if (this.failure) throw this.failure;
    const body = Buffer.from(JSON.stringify(wire));
    const frame = Buffer.alloc(body.length + 4); frame.writeUInt32LE(body.length); body.copy(frame, 4);
    this.socket!.write(frame);
  }
  private wireRequest(method: string, params: Obj, version: number, targetClientId?: string, signal?: AbortSignal): Promise<Obj> {
    signal?.throwIfAborted();
    const requestId = randomUUID();
    return new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };
      const abort = () => { this.pending.delete(requestId); cleanup(); reject(new RouteError('CODEX_REQUEST_ABORTED', 'Desktop request aborted; outcome may be unknown')); };
      const timer = setTimeout(() => { this.pending.delete(requestId); cleanup(); reject(new RouteError('CODEX_REQUEST_TIMEOUT', 'Desktop request timed out; outcome may be unknown')); }, this.timeout); timer.unref();
      this.pending.set(requestId, { resolve, reject, cleanup }); signal?.addEventListener('abort', abort, { once: true });
      try { this.send({ type: 'request', requestId, sourceClientId: this.clientId, version, method, params, ...(targetClientId ? { targetClientId } : {}), timeoutMs: this.timeout }); }
      catch (error) { this.pending.delete(requestId); cleanup(); reject(error); }
    });
  }
  private broadcastFollowing(id: string, following: boolean, owner: string): void {
    this.send({ type: 'broadcast', method: 'thread-stream-following-changed', sourceClientId: this.clientId, version: 1,
      targetClientIds: [owner], params: { hostId: 'local', conversationId: id, following } });
  }
  private receive(chunk: Buffer): void {
    this.buffered = Buffer.concat([this.buffered, chunk]);
    for (;;) {
      if (this.buffered.length < 4) return;
      const size = this.buffered.readUInt32LE(0);
      if (!size || size > 16 * 1024 * 1024) { this.fail(new RouteError('CODEX_PROTOCOL_INVALID', 'Desktop frame exceeds bounded snapshot size')); this.socket?.destroy(); return; }
      if (this.buffered.length < size + 4) return;
      let wire: Obj;
      try { wire = obj(JSON.parse(this.buffered.subarray(4, size + 4).toString())); } catch { this.fail(new RouteError('CODEX_PROTOCOL_INVALID', 'Invalid desktop frame')); this.socket?.destroy(); return; }
      this.buffered = this.buffered.subarray(size + 4);
      if (wire.type === 'response') {
        const requestId = str(wire.requestId), pending = this.pending.get(requestId);
        if (pending) { this.pending.delete(requestId); pending.cleanup(); wire.resultType === 'success' ? pending.resolve(wire) : pending.reject(new RpcServerError(-32000, str(obj(wire.error).message) || str(wire.error) || 'Desktop rejected request')); }
      } else if (wire.type === 'client-discovery-request') {
        // We are a follower, never a handler or owner of other people's conversations.
        this.send({ type: 'client-discovery-response', requestId: wire.requestId, response: { canHandle: false } });
      } else if (wire.type === 'broadcast' && wire.method === 'thread-stream-state-changed' && wire.version === 11) {
        const params = obj(wire.params), id = str(params.conversationId), pending = this.snapshots.get(id), change = obj(params.change);
        if (!pending || params.hostId !== 'local' || wire.sourceClientId !== pending.owner || !Array.isArray(wire.targetClientIds) || !wire.targetClientIds.includes(this.clientId) || change.type !== 'snapshot') continue;
        this.snapshots.delete(id); pending.cleanup();
        // Keep only the requested chat's minimal public projection. No snapshots or transcript blobs are retained.
        try { pending.resolve(this.projectSnapshot(id, obj(change.conversationState))); } catch (error) { pending.reject(error as Error); }
      }
    }
  }
  private async delegatedRoots(): Promise<string[]> {
    const roots: string[] = [];
    for (const root of this.options.allowedRoots) if (await allowedDelegationRoot(root)) roots.push(nativeCwd(root).replaceAll('\\', '/').replace(/\/$/, '').toLowerCase());
    if (!roots.length) throw new RouteError('WORKSPACE_DENIED', 'No usable delegated Codex workspace roots');
    return roots;
  }
  private async metadata(id?: string, offset = 0): Promise<{ data: Obj[]; pageSize: number }> {
    const roots = await this.delegatedRoots();
    const databasePath = await canonical(nativeCwd(this.options.stateDbPath));
    if (isExcludedPath(databasePath)) throw new RouteError('WORKSPACE_DENIED', 'Protected archive cannot be a state database');
    const expr = "replace(replace(lower(cwd),char(92),'/'),'//?/','')";
    const scope = roots.map(() => `(${expr}=? OR ${expr} LIKE ? ESCAPE '!')`).join(' OR ');
    const bindings: Array<string | number> = roots.flatMap(root => [root, `${root.replace(/[!%_]/g, value => `!${value}`)}/%`]);
    const db = new DatabaseSync(databasePath, { readOnly: true, allowExtension: false });
    try {
      db.exec('PRAGMA query_only=ON; PRAGMA busy_timeout=1500');
      const columns = new Set((db.prepare('PRAGMA table_info(threads)').all() as Obj[]).map(column => str(column.name)));
      if (['source', 'thread_source', 'agent_path'].some(column => !columns.has(column))) {
        throw new RouteError('CODEX_DESKTOP_SCHEMA_UNSUPPORTED', 'Pinned desktop metadata lacks ordinary conversation source classification');
      }
      // Apply the public thread/list ordinary source filter before LIMIT, and
      // use the same predicate for exact metadata reads. Hidden child agents
      // cannot become selectable merely by sharing a delegated workspace.
      const ordinary = `source IN (${CODEX_ORDINARY_SOURCE_KINDS.map(() => '?').join(',')}) AND thread_source='user' AND agent_path IS NULL`;
      const sql = `SELECT id,cwd FROM threads WHERE archived=0 AND (${scope}) AND ${ordinary}${id ? ' AND id=?' : ''} ORDER BY updated_at_ms DESC,updated_at DESC,id DESC LIMIT 50 OFFSET ?`;
      const values = db.prepare(sql).all(...bindings, ...CODEX_ORDINARY_SOURCE_KINDS, ...(id ? [id] : []), offset) as Obj[];
      const results: Obj[] = [];
      const summary = db.prepare(`SELECT id,cwd,name,preview,updated_at,updated_at_ms FROM threads WHERE archived=0 AND id=? AND cwd=? AND ${ordinary} LIMIT 1`);
      for (const candidate of values) {
        if (!str(candidate.id) || !await allowedWorkspace(nativeCwd(str(candidate.cwd)), this.options.allowedRoots)) continue;
        // Denied workspaces contribute only ID/path metadata, never a title or preview.
        // Pin cwd and ordinary classification again against metadata changes during validation.
        const value = summary.get(candidate.id as string, candidate.cwd as string, ...CODEX_ORDINARY_SOURCE_KINDS) as Obj | undefined;
        if (!value) continue;
        results.push({ id: value.id, cwd: nativeCwd(str(value.cwd)), name: value.name ?? null, preview: value.preview,
          updatedAt: typeof value.updated_at_ms === 'number' && value.updated_at_ms > 0 ? value.updated_at_ms / 1000 : value.updated_at, status: { type: 'unknown' }, turns: [] });
      }
      return { data: results, pageSize: values.length };
    } finally { db.close(); }
  }
  private async metadataOne(id: string): Promise<Obj> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new RouteError('CODEX_THREAD_INVALID', 'Desktop requires the exact chat UUID');
    const result = (await this.metadata(id)).data[0];
    if (!result) throw new RouteError('WORKSPACE_DENIED', 'Chat not found within delegated workspace metadata');
    return result;
  }
  private async owner(id: string, signal?: AbortSignal): Promise<string> {
    const response = await this.wireRequest('thread-owner-discovery', { hostId: 'local', conversationId: id }, 1, undefined, signal);
    const owner = str(response.handledByClientId);
    if (!owner || obj(response.result).supportsUntrustedAppInput !== true) throw new RouteError('CODEX_DESKTOP_OWNER_UNAVAILABLE', 'No desktop owner with the native untrusted input gate; do not acquire ownership or retry');
    return owner;
  }
  private snapshot(metadata: Obj, signal?: AbortSignal): Promise<Obj> {
    const id = str(metadata.id), prior = this.snapshotReads.get(id);
    const read = (prior ? prior.catch(() => undefined) : Promise.resolve()).then(() => { signal?.throwIfAborted(); return this.snapshotOnce(metadata, signal); });
    this.snapshotReads.set(id, read);
    void read.finally(() => { if (this.snapshotReads.get(id) === read) this.snapshotReads.delete(id); }).catch(() => {});
    return read;
  }
  private async snapshotOnce(metadata: Obj, signal?: AbortSignal): Promise<Obj> {
    const id = str(metadata.id), owner = await this.owner(id, signal);
    if (this.snapshots.has(id)) throw new RouteError('CODEX_DESKTOP_READ_BUSY', 'A snapshot read for this chat is already pending');
    const view = await new Promise<Obj>((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); try { this.broadcastFollowing(id, false, owner); } catch { /* Connection failure is already recorded. */ } };
      const abort = () => { this.snapshots.delete(id); cleanup(); reject(new RouteError('CODEX_REQUEST_ABORTED', 'Desktop snapshot read aborted')); };
      const timer = setTimeout(() => { this.snapshots.delete(id); cleanup(); reject(new RouteError('CODEX_DESKTOP_SNAPSHOT_UNAVAILABLE', 'Scoped owner snapshot did not arrive')); }, this.timeout); timer.unref();
      this.snapshots.set(id, { resolve, reject, owner, cleanup }); signal?.addEventListener('abort', abort, { once: true });
      try { this.broadcastFollowing(id, true, owner); } catch (error) { this.snapshots.delete(id); cleanup(); reject(error); }
    });
    if (!await allowedWorkspace(str(view.cwd), this.options.allowedRoots) || cwdKey(str(metadata.cwd)) !== cwdKey(str(view.cwd))) throw new RouteError('WORKSPACE_DENIED', 'Desktop snapshot workspace differs from authorized metadata');
    return { ...metadata, ...view, updatedAt: view.updatedAt ?? metadata.updatedAt };
  }
  private projectSnapshot(id: string, state: Obj): Obj {
    if (state.id !== id) throw new RouteError('CODEX_THREAD_INVALID', 'Desktop snapshot identity mismatch');
    const history = obj(state.turnHistory), canonical = obj(history.history), entities = obj(canonical.entitiesByKey);
    if (history.kind === 'canonical' && !Array.isArray(canonical.islands)) throw new RouteError('CODEX_PROTOCOL_INVALID', 'Canonical desktop history has no native island topology');
    const keys = (Array.isArray(canonical.islands) ? canonical.islands.map(obj) : []).flatMap(island => (Array.isArray(island.entries) ? island.entries.map(obj) : []).map(entry => str(entry.value))).filter(Boolean);
    const raw = history.kind === 'canonical' ? [...new Set(keys)].map(key => obj(entities[key])) : Array.isArray(state.turns) ? state.turns.map(obj) : [];
    const projected = raw.filter(turn => str(turn.turnId)).map(turn => ({ id: turn.turnId, status: turn.status, error: turn.error ? { message: str(obj(turn.error).message).slice(0, 2000) } : null,
      items: (Array.isArray(turn.items) ? turn.items.map(obj) : []).filter(item => item.type === 'agentMessage' && [undefined, null, 'final_answer'].includes(item.phase as string | null | undefined))
        .map(item => ({ type: 'agentMessage', phase: item.phase, text: str(item.text).slice(-24_000) })) }));
    const runtime = obj(state.threadRuntimeStatus), running = runtime.type === 'active' || projected.some(turn => turn.status === 'inProgress');
    const pending = (Array.isArray(state.requests) ? state.requests.map(obj) : []).filter(request => /requestApproval|requestUserInput|requestPermissions|elicitation/i.test(str(request.method)));
    const activeFlags = [...Array.isArray(runtime.activeFlags) ? runtime.activeFlags : [], ...(pending.length ? ['waitingOnApproval'] : [])];
    return { id, cwd: nativeCwd(str(state.cwd)), updatedAt: typeof state.updatedAt === 'number' ? state.updatedAt / 1000 : undefined,
      status: { type: running ? 'active' : runtime.type === 'notLoaded' ? 'notLoaded' : runtime.type === 'idle' ? 'idle' : 'unknown', activeFlags }, turns: projected };
  }
  async request(method: string, params: Obj, signal?: AbortSignal): Promise<unknown> {
    await this.connect(); signal?.throwIfAborted();
    if (method === 'initialize') return { userAgent: 'cortico-external-desktop-follower', protocolVersion: this.options.protocolVersion };
    if (method === 'thread/list') {
      const offset = Number(params.cursor ?? 0); if (!Number.isSafeInteger(offset) || offset < 0 || offset > 200) throw new RouteError('CODEX_CURSOR_INVALID', 'Invalid bounded metadata cursor');
      const { data, pageSize } = await this.metadata(undefined, offset); return { data, nextCursor: pageSize === 50 && offset < 150 ? String(offset + 50) : null };
    }
    const id = str(params.threadId), metadata = await this.metadataOne(id);
    if (method === 'thread/read') return { thread: params.includeTurns === true ? await this.snapshot(metadata, signal) : metadata };
    // Cold chats have no owner. The gateway may display them but cannot silently resume/acquire them.
    if (method === 'thread/resume') throw new RouteError('CODEX_DESKTOP_COLD_UNSUPPORTED', 'Open the existing chat in Codex before external control; no automated resume or ownership acquisition');
    if (method === 'turn/start') {
      const owner = await this.owner(id, signal), input = Array.isArray(params.input) ? params.input.map(obj) : [];
      if (input.length !== 1 || input[0].type !== 'text' || !str(input[0].text)) throw new RouteError('PROMPT_INVALID', 'Exactly one external text prompt required');
      const untrusted = codexUntrustedDesktopInput(str(input[0].text), randomUUID());
      const response = await this.wireRequest('thread-follower-start-turn', { conversationId: id, turnStart: {
        request: { threadId: id, input: [untrusted.input] }, context: { inheritThreadSettings: true, responseItems: untrusted.responseItems } } }, 2, owner, signal);
      return obj(obj(response.result).result);
    }
    if (method === 'turn/interrupt') {
      if (!str(params.turnId)) throw new RouteError('CODEX_TURN_ID_MISSING', 'Exact turn id required for desktop interrupt');
      const owner = await this.owner(id, signal);
      const response = await this.wireRequest('thread-follower-interrupt-turn', { conversationId: id, expectedTurnId: params.turnId, mode: 'descendant-cleanup' }, 4, owner, signal);
      if (obj(response.result).interruptedTurnId !== params.turnId) throw new RpcServerError(-32000, 'Requested native turn is no longer active');
      return {};
    }
    throw new RouteError('CODEX_DESKTOP_METHOD_DENIED', 'Desktop follower method is outside the control contract');
  }
  async notify(method: string, _params: Obj): Promise<void> { if (method !== 'initialized') throw new RouteError('CODEX_DESKTOP_METHOD_DENIED', 'No desktop IPC notifications are allowed'); await this.connect(); }
  dispose(): void { this.closed = true; this.fail(new RouteError('CODEX_DISPOSED', 'Desktop IPC disposed')); this.socket?.destroy(); }
}
