import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { CodexConversationAdapter, CodexWebSocketRpc, validateCodexEndpoint, type CodexRpcClient, type CodexRpcMessage } from '../conversation-control/src/codex.ts';
import { RouteError, type ActionReceipt, type ActionRequest } from '../conversation-control/src/contract.ts';

const ROOT = fixtureWorkspace;
interface NativeTurn { id: string; status: string; items: Array<Record<string, unknown>>; error?: unknown }
interface NativeThread { id: string; name?: string | null; cwd: string; preview: string; updatedAt: number; status: { type: string; activeFlags?: string[] }; turns: NativeTurn[] }
const thread = (overrides: Partial<NativeThread> = {}): NativeThread => ({ id: 'thr_bridge', name: '审计接入方案', cwd: ROOT, preview: 'DSH 和 Cortico 桥接', updatedAt: 1791300000, status: { type: 'idle' }, turns: [], ...overrides });

class Protocol implements CodexRpcClient {
  requests: Array<{ method: string; params: Record<string, unknown> }> = [];
  notifications: CodexRpcMessage[] = [];
  listeners = new Set<(message: CodexRpcMessage) => void>();
  threads: NativeThread[];
  failAfterStart = false;
  before?: (method: string, params: Record<string, unknown>) => void;
  constructor(threads: NativeThread[] = [thread()]) { this.threads = threads; }
  subscribe(listener: (message: CodexRpcMessage) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(message: CodexRpcMessage): void { for (const listener of this.listeners) listener(message); }
  notify(method: string, params: Record<string, unknown>): void { this.notifications.push({ method, params }); }
  dispose(): void { this.listeners.clear(); }
  async request(method: string, params: Record<string, unknown>): Promise<unknown> {
    this.requests.push({ method, params: structuredClone(params) });
    this.before?.(method, params);
    if (method === 'initialize') return { userAgent: 'local-test', platformFamily: 'windows', platformOs: 'windows' };
    if (method === 'thread/list') return { data: this.threads.map(value => { const { turns: _, ...summary } = value; return summary; }), nextCursor: null };
    const target = this.threads.find(value => value.id === params.threadId);
    if (!target) throw new Error('unknown test thread');
    if (method === 'thread/read') {
      const value = structuredClone(target);
      return { thread: params.includeTurns ? value : { ...value, turns: [] } };
    }
    if (method === 'thread/resume') { target.status = { type: 'idle' }; return { thread: structuredClone(target) }; }
    if (method === 'turn/start') {
      const turn: NativeTurn = { id: `turn_${this.requests.filter(request => request.method === 'turn/start').length}`, status: 'inProgress', items: [] };
      target.status = { type: 'active', activeFlags: [] }; target.updatedAt++; target.turns.push(turn);
      if (this.failAfterStart) throw new RouteError('CODEX_TRANSPORT_LOST', 'native turn started before transport loss');
      return { turn: structuredClone(turn) };
    }
    if (method === 'turn/interrupt') {
      const exact = target.turns.find(value => value.id === params.turnId);
      if (!exact || exact.status !== 'inProgress') throw new Error('turn is no longer active');
      exact.status = 'interrupted'; target.status = { type: 'idle' }; target.updatedAt++;
      return {};
    }
    throw new Error(`Unsupported test RPC ${method}`);
  }
}

const action = async (adapter: CodexConversationAdapter, operationId: string, kind: ActionRequest['action'] = 'continue', extra: Partial<ActionRequest> = {}): Promise<ActionRequest> => ({
  operationId, framework: 'codex', targetId: 'thr_bridge', action: kind, expectedRevision: (await adapter.get('thr_bridge')).revision, ...extra,
});
const adapterFor = (t: test.TestContext, rpc: Protocol, maxDurationMs = 300_000): CodexConversationAdapter => {
  const adapter = new CodexConversationAdapter({ rpc, allowedRoots: [ROOT], maxDurationMs });
  t.after(() => adapter.dispose()); return adapter;
};

test('Codex disabled without endpoint; rejects non-loopback, DNS, implicit ports and credentials', async () => {
  const adapter = new CodexConversationAdapter({ allowedRoots: [ROOT] });
  await assert.rejects(adapter.list({ query: '', limit: 5 }), (error: unknown) => error instanceof RouteError && error.code === 'CODEX_DISABLED');
  for (const endpoint of ['ws://example.com:9000', 'ws://localhost:9000', 'ws://127.0.0.1', 'https://127.0.0.1:9000', 'ws://user:secret@127.0.0.1:9000', 'ws://127.0.0.1:9000?token=secret']) assert.throws(() => validateCodexEndpoint(endpoint));
  assert.equal(validateCodexEndpoint('ws://127.0.0.1:9000'), 'ws://127.0.0.1:9000/');
  assert.equal(validateCodexEndpoint('wss://[::1]:9000'), 'wss://[::1]:9000/');
});

test('Codex list uses true name nullable, preview and activity, with initialization once', async t => {
  const rpc = new Protocol([thread(), thread({ id: 'thr_unnamed', name: null, preview: '记忆模块' }), thread({ id: 'thr_denied', cwd: fixtureProtected, preview: 'DO NOT READ' })]);
  const adapter = adapterFor(t, rpc);
  const result = await adapter.list({ query: '', limit: 5 });
  assert.equal(result.length, 2); assert.equal(result[0].title, '审计接入方案'); assert.equal(result[1].title, null);
  assert.equal(result[1].summary, '记忆模块'); assert.equal(result[0].source, 'Codex shared app-server API');
  await adapter.get('thr_bridge');
  assert.equal(rpc.requests.filter(request => request.method === 'initialize').length, 1);
  assert.equal(rpc.notifications.filter(message => message.method === 'initialized').length, 1);
  const params = rpc.requests.find(request => request.method === 'thread/list')!.params;
  assert.equal(params.useStateDbOnly, true); assert.equal(params.sortKey, 'updated_at');
  assert.deepEqual(params.sourceKinds, ['cli', 'vscode', 'appServer', 'unknown']);
  assert.equal(rpc.requests.filter(request => request.method === 'thread/resume').length, 0);
});

test('Codex get checks delegated workspace before requesting full turns', async t => {
  const rpc = new Protocol([thread({ cwd: fixtureProtected })]);
  const adapter = adapterFor(t, rpc);
  await assert.rejects(adapter.get('thr_bridge'), (error: unknown) => error instanceof RouteError && error.code === 'WORKSPACE_DENIED');
  assert.equal(rpc.requests.some(request => request.method === 'thread/read' && request.params.includeTurns === true), false);
});

test('Codex cold resume retains native permission/configuration; prompt submits once, exact turn result only', async t => {
  const rpc = new Protocol([thread({ status: { type: 'notLoaded' }, turns: [{ id: 'turn_old', status: 'completed', items: [{ type: 'agentMessage', text: 'old answer' }] }] })]);
  const adapter = adapterFor(t, rpc);
  const request = await action(adapter, 'op_once', 'send', { prompt: '检查桥接契约。' });
  const [first, second] = await Promise.all([adapter.execute(request), adapter.execute(request)]);
  assert.equal(first.turnId, second.turnId); assert.equal(first.status, 'running'); assert.equal(first.action, 'send');
  assert.ok(first.deadlineAt); assert.equal(first.answer, undefined);
  assert.deepEqual(rpc.requests.find(value => value.method === 'thread/resume')!.params, { threadId: 'thr_bridge' });
  assert.deepEqual(rpc.requests.find(value => value.method === 'turn/start')!.params, { threadId: 'thr_bridge', input: [{ type: 'text', text: '检查桥接契约。' }] });
  assert.equal(rpc.requests.filter(value => value.method === 'turn/start').length, 1);
  rpc.threads[0].turns.push({ id: 'turn_unrelated', status: 'completed', items: [{ type: 'agentMessage', text: 'unrelated result' }] });
  const exact = rpc.threads[0].turns.find(turn => turn.id === first.turnId)!;
  exact.status = 'completed'; exact.items = [{ type: 'reasoning', text: 'private' }, { type: 'agentMessage', phase: 'commentary', text: 'progress' }, { type: 'agentMessage', phase: 'final_answer', text: 'bridge checked' }];
  rpc.threads[0].status = { type: 'idle' };
  const result = await adapter.observe(first);
  assert.equal(result.status, 'completed'); assert.equal(result.answer, 'bridge checked');
  assert.equal(rpc.requests.filter(value => value.method === 'turn/start').length, 1);
  await assert.rejects(adapter.execute({ ...request, prompt: 'different input' }), (error: unknown) => error instanceof RouteError && error.code === 'OPERATION_CONFLICT');
});

test('Codex pause interrupts only exact active native turn and waits for interrupted evidence', async t => {
  const rpc = new Protocol([thread({ status: { type: 'active' }, turns: [{ id: 'turn_human', status: 'inProgress', items: [] }] })]);
  const adapter = adapterFor(t, rpc);
  const receipt = await adapter.execute(await action(adapter, 'op_pause', 'pause'));
  assert.equal(receipt.status, 'accepted'); assert.equal(receipt.turnId, 'turn_human'); assert.equal(receipt.action, 'pause'); assert.equal(receipt.deadlineAt, undefined);
  assert.deepEqual(rpc.requests.find(request => request.method === 'turn/interrupt')!.params, { threadId: 'thr_bridge', turnId: 'turn_human' });
  assert.equal((await adapter.observe(receipt)).status, 'paused');
  assert.equal(rpc.requests.filter(request => request.method === 'turn/start').length, 0);
});

test('Codex busy conversations and changed revision never start or steer a prompt', async t => {
  const rpc = new Protocol([thread({ status: { type: 'active' }, turns: [{ id: 'turn_existing', status: 'inProgress', items: [] }] })]);
  const adapter = adapterFor(t, rpc);
  const busy = await adapter.execute(await action(adapter, 'op_busy'));
  assert.equal(busy.status, 'failed'); assert.equal(busy.errorCode, 'CONVERSATION_BUSY');
  rpc.threads[0].status = { type: 'idle' }; rpc.threads[0].turns[0].status = 'completed';
  const staleRequest = await action(adapter, 'op_stale'); rpc.threads[0].updatedAt++;
  const stale = await adapter.execute(staleRequest);
  assert.equal(stale.errorCode, 'STALE_SELECTION');
  assert.equal(rpc.requests.some(request => ['turn/start', 'turn/steer'].includes(request.method)), false);
});

test('Codex check inherits native permissions, marks instruction-only read intent, no sandbox overrides', async t => {
  const rpc = new Protocol(); const adapter = adapterFor(t, rpc);
  const receipt = await adapter.execute(await action(adapter, 'op_check', 'check'));
  assert.equal(receipt.action, 'check'); assert.match(receipt.detail!, /sandbox is not overridden/);
  const params = rpc.requests.find(value => value.method === 'turn/start')!.params;
  assert.deepEqual(Object.keys(params).sort(), ['input', 'threadId']);
  assert.match((params.input as Array<{ text: string }>)[0].text, /仅进行只读检查/);
});

test('Codex pending approval is waiting_user without an automated decision', async t => {
  const rpc = new Protocol(); const adapter = adapterFor(t, rpc);
  const receipt = await adapter.execute(await action(adapter, 'op_approval'));
  rpc.threads[0].status = { type: 'active', activeFlags: ['waitingOnApproval'] };
  rpc.emit({ id: 77, method: 'item/commandExecution/requestApproval', params: { threadId: 'thr_bridge', turnId: receipt.turnId, itemId: 'item_command' } });
  const waiting = await adapter.observe(receipt);
  assert.equal(waiting.status, 'waiting_user'); assert.equal(waiting.errorCode, 'CODEX_WAITING_USER');
  assert.equal(rpc.notifications.length, 1); assert.equal(rpc.requests.some(value => /approval|permission/i.test(value.method)), false);
});

test('Codex ambiguous transport loss after start is unknown and never submits again', async t => {
  const rpc = new Protocol(); const adapter = adapterFor(t, rpc); rpc.failAfterStart = true;
  const request = await action(adapter, 'op_lost');
  const result = await adapter.execute(request);
  assert.equal(result.status, 'unknown'); assert.equal(result.errorCode, 'CODEX_TRANSPORT_LOST');
  await adapter.execute(request); await adapter.observe(result);
  assert.equal(rpc.requests.filter(value => value.method === 'turn/start').length, 1);
});

test('Codex recovered deadline interrupts the persisted router-owned turn, never another human turn', async t => {
  const rpc = new Protocol([thread({ status: { type: 'active' }, turns: [{ id: 'turn_router', status: 'inProgress', items: [] }] })]);
  const adapter = adapterFor(t, rpc);
  const receipt: ActionReceipt = { operationId: 'op_recovered', framework: 'codex', targetId: 'thr_bridge', action: 'continue', status: 'running', at: new Date().toISOString(), turnId: 'turn_router', deadlineAt: new Date(Date.now() - 1000).toISOString() };
  await adapter.observe(receipt);
  assert.equal(rpc.requests.filter(value => value.method === 'turn/interrupt').length, 1);
  assert.equal((await adapter.observe(receipt)).status, 'paused');
  rpc.threads[0].status = { type: 'active' }; rpc.threads[0].turns.push({ id: 'turn_new_human', status: 'inProgress', items: [] });
  await adapter.observe({ ...receipt, operationId: 'op_old_missing', turnId: 'turn_not_active', status: 'running' });
  assert.equal(rpc.requests.filter(value => value.method === 'turn/interrupt').length, 1);
  await adapter.observe({ ...receipt, operationId: 'op_human_pause', action: 'pause', turnId: 'turn_new_human', status: 'running' });
  assert.equal(rpc.requests.filter(value => value.method === 'turn/interrupt').length, 1);
});

test('Codex waiting_user restart restores deadline and does not approve the native request', async t => {
  const rpc = new Protocol([thread({ status: { type: 'active', activeFlags: ['waitingOnApproval'] }, turns: [{ id: 'turn_waiting', status: 'inProgress', items: [] }] })]);
  const adapter = adapterFor(t, rpc);
  const receipt: ActionReceipt = { operationId: 'op_waiting_restart', framework: 'codex', targetId: 'thr_bridge', action: 'continue', status: 'waiting_user', at: new Date().toISOString(), turnId: 'turn_waiting', deadlineAt: new Date(Date.now() - 1000).toISOString() };
  await adapter.observe(receipt);
  assert.equal(rpc.requests.filter(value => value.method === 'turn/interrupt').length, 1);
  assert.deepEqual(rpc.requests.find(value => value.method === 'turn/interrupt')!.params, { threadId: 'thr_bridge', turnId: 'turn_waiting' });
  assert.equal((await adapter.observe(receipt)).status, 'paused');
  assert.equal(rpc.requests.some(value => /approval|permission/i.test(value.method)), false);
  assert.equal(rpc.notifications.length, 1);
});

test('Codex real local JSON-RPC WebSocket performs handshake, submits once and leaves server approvals undecided', async t => {
  const require = toolchainRequire;
  const { WebSocketServer } = require('ws');
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await once(server, 'listening');
  const native = new Protocol(); const incoming: Array<Record<string, unknown>> = [];
  let serverSocket: any;
  server.on('connection', (socket: any) => {
    serverSocket = socket;
    socket.on('message', async (data: { toString(): string }) => {
      const wire = JSON.parse(data.toString()) as { id?: number; method?: string; params: Record<string, unknown> };
      incoming.push(wire);
      if (wire.method === 'initialized') return;
      if (wire.id !== undefined && wire.method) {
        try { socket.send(JSON.stringify({ id: wire.id, result: await native.request(wire.method, wire.params) })); }
        catch { socket.send(JSON.stringify({ id: wire.id, error: { code: -32603, message: 'test native failure' } })); }
      }
    });
  });
  const port = server.address().port;
  const rpc = new CodexWebSocketRpc({ endpoint: `ws://127.0.0.1:${port}`, requestTimeoutMs: 2000 });
  const adapter = new CodexConversationAdapter({ rpc, allowedRoots: [ROOT] });
  t.after(async () => { await adapter.dispose(); for (const socket of server.clients) socket.terminate(); await new Promise<void>(resolve => server.close(() => resolve())); });
  const candidates = await adapter.list({ query: '桥接', limit: 5 }); assert.equal(candidates[0].title, '审计接入方案');
  const request = await action(adapter, 'op_wire', 'send', { prompt: '查看桥接状态。' });
  const receipt = await adapter.execute(request); await adapter.execute(request);
  serverSocket.send(JSON.stringify({ method: 'item/fileChange/requestApproval', id: 800, params: { threadId: 'thr_bridge', turnId: receipt.turnId, itemId: 'item_file' } }));
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal((await adapter.observe(receipt)).status, 'waiting_user');
  assert.equal(incoming.filter(value => value.method === 'initialize').length, 1);
  assert.equal(incoming.filter(value => value.method === 'initialized').length, 1);
  assert.equal(incoming.filter(value => value.method === 'turn/start').length, 1);
  assert.equal(incoming.some(value => value.id === 800), false);
  const exact = native.threads[0].turns.find(turn => turn.id === receipt.turnId)!; exact.status = 'completed'; exact.items = [{ type: 'agentMessage', phase: 'final_answer', text: 'native result' }]; native.threads[0].status = { type: 'idle' };
  serverSocket.send(JSON.stringify({ method: 'serverRequest/resolved', params: { threadId: 'thr_bridge', requestId: 800 } }));
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal((await adapter.observe(receipt)).answer, 'native result');
});
