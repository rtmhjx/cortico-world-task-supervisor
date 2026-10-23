import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { EventEnvelope, ToolCallContext, WorldHost } from 'cortico/core/types.ts';
import { ConversationRouter } from '../conversation-control/src/router.ts';
import { ConversationGateway } from '../conversation-control/src/gateway.ts';
import { GatewayServer } from '../conversation-control/src/server.ts';
import { GatewayClient } from '../conversation-control/src/client.ts';
import { RouteError, type ActionReceipt, type ActionRequest, type Conversation, type ConversationAdapter, type ConversationBackend } from '../conversation-control/src/contract.ts';
import { ConversationControlWorld } from '../cortico-world-conversation-control/src/world.ts';
import { conversationControlDefaults } from '../cortico-world-conversation-control/src/config.ts';

const root = join(fixtureScratch, 'conversation-premount'); mkdirSync(root, { recursive: true });
const token = 'keyless-premount-fixture-1234567890';
const user = '123456';
const timestamp = Date.parse('2026-10-07T12:00:00Z');
function deferred<T = void>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
async function bounded<T>(promise: Promise<T>, ms = 2500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('isolated fixture deadline exceeded')), ms); })]); }
  finally { if (timer) clearTimeout(timer); }
}
const target: Conversation = { framework: 'dsh', id: 'premount-native-chat', title: '记忆项目', workspace: fixtureWorkspace, lastActivityAt: new Date(timestamp).toISOString(),
  summary: '', status: 'idle', revision: 'stable-native-revision', capabilities: ['continue', 'check', 'pause'], source: 'keyless-premount-native-fixture' };
const event = (cursor: number, text: string, at = timestamp, kind = 'private', id = user) => ({ cursor, type: 'qq.message', source: 'qq', origin: 'external', ts: new Date(at).toISOString(), text,
  senderKey: user, meta: { user_id: user, conv: { kind, id } } });
const code = (expected: string) => (error: unknown) => error instanceof RouteError && error.code === expected;

test('premount: Router receipt write-lock after real HTTP admission reconciles the same ID after restart without a second prompt', { timeout: 8000 }, async () => {
  const dir = mkdtempSync(join(root, 'router-lock-')), routerFile = join(dir, 'router.sqlite');
  let prompts = 0, lock: DatabaseSync | undefined, receipt: ActionReceipt | undefined;
  const adapter: ConversationAdapter = { framework: 'dsh', async list() { return [target]; }, async get() { return target; },
    async execute(request) { prompts++; return receipt = { operationId: request.operationId, framework: request.framework, targetId: request.targetId, action: request.action,
      requestId: `conversation:${request.operationId}`, status: 'accepted', at: new Date(timestamp).toISOString() }; },
    async observe(saved) { assert.equal(saved.requestId, receipt!.requestId); return { ...saved, status: 'completed', answer: '原生只读检查结果' }; } };
  const gateway = new ConversationGateway({ adapters: [adapter], stateFile: join(dir, 'gateway.sqlite'), identity: 'keyless-premount', enabled: true });
  const server = new GatewayServer(gateway, async () => token, 0); await server.start();
  const client = new GatewayClient(`http://127.0.0.1:${server.address()}`, async () => token, 3000);
  const backend: ConversationBackend = { list: input => client.list(input), get: (framework, id) => client.get(framework, id), observe: id => client.observe(id),
    async execute(request, signal) { const saved = await client.execute(request, signal); lock = new DatabaseSync(routerFile); lock.exec('BEGIN IMMEDIATE'); return saved; } };
  const options = { backend, stateFile: routerFile, operatorIds: [user], eventTtlMs: 60000, selectionTtlMs: 60000, clock: () => timestamp, backendIdentity: 'same-keyless-gateway' };
  let router: ConversationRouter | undefined;
  try {
    router = new ConversationRouter(options); const actor = router.authorize(event(1, '找记忆项目')); const set = await router.find(actor, { query: '记忆' });
    await router.select(actor, { candidateSetId: set.id, index: 1 }); const draft = await router.draft(router.authorize(event(2, '检查现状')), { action: 'check' });
    const failedCommit = await router.confirm(router.authorize(event(3, '确认')), draft.id);
    assert.equal(failedCommit.errorCode, 'RECEIPT_COMMIT_FAILED'); assert.equal(failedCommit.status, 'unknown'); assert.equal(router.snapshot().degraded, true); assert.equal(prompts, 1);
    assert.equal((await client.list({ query: '记忆', limit: 5 }))[0].id, target.id);
    lock!.exec('ROLLBACK'); lock!.close(); lock = undefined; await router.close(); router = undefined;
    router = new ConversationRouter(options); assert.equal(router.snapshot().operations instanceof Array, true);
    const restored = await router.status(router.authorize(event(4, '检查回执')), draft.id);
    assert.equal(restored.operationId, draft.id); assert.equal(restored.status, 'completed'); assert.equal(restored.requestId, receipt!.requestId); assert.equal(prompts, 1);
    assert.equal((await router.confirm(router.authorize(event(5, '确认')), draft.id)).operationId, draft.id); assert.equal(prompts, 1);
  } finally {
    if (lock) { lock.exec('ROLLBACK'); lock.close(); }
    await router?.close(); await server.stop(); await gateway.dispose();
  }
});

test('premount: HTTP disconnect during the awaited target read prevents durable intent and native submission', { timeout: 6000 }, async () => {
  const entered = deferred(), released = deferred(), aborted = deferred(); let prompts = 0;
  const dir = mkdtempSync(join(root, 'http-read-abort-'));
  const adapter: ConversationAdapter = { framework: 'dsh', async list() { return [target]; },
    async get(_id, signal) { entered.resolve(); signal!.addEventListener('abort', () => aborted.resolve(), { once: true }); await released.promise; return target; },
    async execute(request) { prompts++; return { operationId: request.operationId, framework: request.framework, targetId: request.targetId, status: 'completed', at: new Date(timestamp).toISOString() }; },
    async observe(receipt) { return receipt; } };
  const gateway = new ConversationGateway({ adapters: [adapter], stateFile: join(dir, 'gateway.sqlite'), identity: 'keyless-abort', enabled: true });
  const server = new GatewayServer(gateway, async () => token, 0); await server.start(); const client = new GatewayClient(`http://127.0.0.1:${server.address()}`, async () => token, 3000);
  try {
    const controller = new AbortController(); const attempt = client.execute({ operationId: 'premount-get-interrupted', framework: 'dsh', targetId: target.id, action: 'check', prompt: '检查现状', expectedRevision: target.revision }, controller.signal).then(() => 'unexpected-success', () => 'aborted');
    await bounded(entered.promise); controller.abort(); assert.equal(await bounded(attempt), 'aborted'); await bounded(aborted.promise);
    released.resolve(); await server.stop(); assert.equal(prompts, 0); assert.deepEqual(gateway.health().operations, []);
  } finally { released.resolve(); await server.stop(); await gateway.dispose(); }
});

test('premount: one authorized QQ account cannot reuse candidate or selection state across two groups and private chat; TTL expires independently of fresh messages', { timeout: 4000 }, async () => {
  let now = timestamp, prompts = 0; const dir = mkdtempSync(join(root, 'qq-scope-'));
  const backend: ConversationBackend = { async list() { return [target]; }, async get() { return target; }, async execute(request) { prompts++; return { operationId: request.operationId, framework: request.framework, targetId: request.targetId, status: 'completed', at: new Date(now).toISOString() }; }, async observe() { throw new Error('no operation'); } };
  const router = new ConversationRouter({ backend, stateFile: join(dir, 'router.sqlite'), operatorIds: [user], eventTtlMs: 5000, selectionTtlMs: 1000, clock: () => now });
  try {
    const actor = router.authorize(event(1, '查项目', now, 'group', '333444')); const set = await router.find(actor, { query: '项目' }); await router.select(actor, { candidateSetId: set.id, index: 1 });
    const otherGroup = router.authorize(event(2, '第一个', now, 'group', '555666')); const privateActor = router.authorize(event(3, '第一个', now));
    await assert.rejects(router.select(otherGroup, { candidateSetId: set.id, index: 1 }), code('CANDIDATES_EXPIRED'));
    await assert.rejects(router.select(privateActor, { candidateSetId: set.id, index: 1 }), code('CANDIDATES_EXPIRED'));
    assert.equal(router.selected(otherGroup), undefined); assert.equal(router.selected(privateActor), undefined);
    assert.throws(() => router.authorize(event(4, '确认', now, 'private', '789012')), code('OPERATOR_DENIED'));
    const draft = await router.draft(router.authorize(event(5, '检查项目', now, 'group', '333444')), { action: 'check' });
    now += 1001; const fresh = router.authorize(event(6, '确认', now, 'group', '333444'));
    await assert.rejects(router.confirm(fresh, draft.id), code('CONFIRMATION_REQUIRED')); assert.equal(router.selected(fresh), undefined);
    await assert.rejects(router.select(fresh, { candidateSetId: set.id, index: 1 }), code('CANDIDATES_EXPIRED')); assert.equal(prompts, 0);
  } finally { await router.close(); }
});

test('premount: waiting_user remains observed through World restart; outbox keeps original recipient and never approves or resubmits', { timeout: 6000 }, async () => {
  const dir = mkdtempSync(join(root, 'waiting-world-')); let now = timestamp, prompts = 0, observations = 0; let receipt: ActionReceipt;
  const events: EventEnvelope[] = []; const human = (text: string) => { const row = event(events.length + 1, text, now); events.push(row as EventEnvelope); return row.cursor; };
  const backend: ConversationBackend = { async list() { return [target]; }, async get() { return target; },
    async execute(request) { prompts++; return receipt = { operationId: request.operationId, framework: request.framework, targetId: request.targetId, action: request.action, status: 'accepted', at: new Date(now).toISOString(), turnId: 'native-turn-approval', requestId: `conversation:${request.operationId}` }; },
    async observe(id) { observations++; assert.equal(id, receipt.operationId); return { ...receipt, at: new Date(now).toISOString() }; } };
  const host = { store: { get: (cursor: number) => events.find(row => row.cursor === cursor), grep: (query: { source: string; keyword: string }) => events.filter(row => row.source === query.source && row.text.includes(query.keyword)).map(row => ({ hitCursor: row.cursor, events: [row] })) },
    pushEvent: async (row: Omit<EventEnvelope, 'cursor'>) => { const saved = { ...row, cursor: events.length + 1 }; events.push(saved); return saved; } } as unknown as WorldHost;
  const cfg = { ...conversationControlDefaults(), enabled: true, operatorIds: JSON.stringify([user]), pollIntervalMs: 60000 };
  const create = () => new ConversationControlWorld({ cfg, dataDir: dir, secret: async () => undefined, backend, clock: () => now });
  const call = async (world: ConversationControlWorld, name: string, args: Record<string, unknown>) => { const result = await world.tools().find(tool => tool.name === `conversationcontrol_${name}`)!.handler(args, {} as ToolCallContext); assert.equal(typeof result, 'string', JSON.stringify(result)); return JSON.parse(result as string); };
  let world: ConversationControlWorld | undefined;
  try {
    world = create(); await world.start(host); await world.pollOnce(); const cursor = human('找记忆模块并检查'); const set = await call(world, 'find', { originEventCursor: cursor, query: '记忆' });
    await call(world, 'select', { originEventCursor: cursor, candidateSetId: set.id, index: 1 }); const draft = await call(world, 'draft', { originEventCursor: cursor, action: 'check' });
    await call(world, 'confirm', { originEventCursor: human('确认'), draftId: draft.id });
    receipt = { ...receipt!, status: 'waiting_user', errorCode: 'NATIVE_APPROVAL_PENDING', detail: 'native-call-fixture needs an actual human decision' }; await world.pollOnce();
    assert.equal((await call(world, 'status', { originEventCursor: human('查询'), operationId: draft.id })).status, 'waiting_user');
    const before = events.filter(row => row.source === world!.id).length; await world.stop(); world = undefined;
    world = create(); await world.start(host); await world.pollOnce(); now += 20; await world.pollOnce();
    assert.equal(events.filter(row => row.source === world!.id).length, before); assert.ok(observations >= 3); assert.equal(prompts, 1);
    receipt = { ...receipt!, status: 'completed', answer: '实际原生结果（脚本夹具）', errorCode: undefined }; await world.pollOnce();
    const updates = events.filter(row => row.source === world!.id); assert.ok(updates.every(row => row.meta?.recipient === `private:${user}`));
    assert.equal(updates.filter(row => row.text.includes('"status":"waiting_user"')).length, 1); assert.equal(updates.filter(row => row.text.includes('"status":"completed"')).length, 1);
    assert.equal((await call(world, 'status', { originEventCursor: human('查询'), operationId: draft.id })).status, 'completed'); assert.equal(prompts, 1);
  } finally { await world?.stop(); }
});
