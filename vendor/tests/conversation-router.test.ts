import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import { excludedRoots } from '../task-reporting/src/policy.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ConversationRouter } from '../conversation-control/src/router.ts';
import { ConversationGateway } from '../conversation-control/src/gateway.ts';
import { RouteError, type Conversation, type ConversationBackend, type ActionRequest, type ActionReceipt, type ConversationAdapter } from '../conversation-control/src/contract.ts';

const now = Date.parse('2026-10-07T12:00:00Z');
const scratch = join(fixtureScratch, 'conversation-router-tests'); mkdirSync(scratch, { recursive: true });
const conversation: Conversation = { framework: 'dsh', id: 'chat-memory', title: '记忆模块', workspace: fixtureWorkspace, lastActivityAt: new Date(now).toISOString(), summary: '检查记忆模块的交接状态', status: 'idle', revision: 'r1', capabilities: ['continue', 'check', 'send', 'pause'], source: 'native-test-fixture' };
function backend() {
  const requests: ActionRequest[] = []; let latest: ActionReceipt;
  const api: ConversationBackend = {
    async list() { return [conversation, { ...conversation, framework: 'codex', id: 'bridge-codex', title: '桥接项目' }]; },
    async get() { return conversation; },
    async execute(request) { requests.push(request); return latest = { operationId: request.operationId, framework: request.framework, targetId: request.targetId, action: request.action, status: 'accepted', at: new Date(now).toISOString(), requestId: request.operationId }; },
    async observe() { return { ...latest, status: 'completed', answer: '现状检查完成；挂载尚未进行。' }; },
  }; return { api, requests };
}
function event(cursor: number, text: string, userId = '123456', group?: string) { return { cursor, type: 'qq.message', source: 'qq', origin: 'external', ts: new Date(now).toISOString(), text, senderKey: userId, meta: { user_id: userId, conv: { kind: group ? 'group' : 'private', id: group ?? userId } } }; }
function setup(api: ConversationBackend = backend().api) { const file = join(mkdtempSync(join(scratch, 'run-')), 'control.sqlite'); const options = { backend: api, stateFile: file, operatorIds: ['123456', '789012'], eventTtlMs: 60000, selectionTtlMs: 120000, clock: () => now }; return { router: new ConversationRouter(options), file, options }; }
const code = (name: string) => (error: unknown) => error instanceof RouteError && error.code === name;

test('空候选报告真实授权范围并区分后端不可用，不泄漏凭证或假称全盘不存在', async () => {
  const adapter: ConversationAdapter = { framework: 'dsh', async list() { return []; }, async get() { throw Error('not used'); }, async execute() { throw Error('not used'); }, async observe() { throw Error('not used'); } };
  const gateway = new ConversationGateway({ adapters: [adapter], stateFile: join(mkdtempSync(join(scratch, 'scope-')), 'gateway.sqlite'), enabled: false,
    identity: { dshRoots: [fixtureRoot], codexRoots: [], tokenRef: 'PRIVATE_TOKEN_REFERENCE', secret: 'NEVER_SERIALIZE' } });
  const { router } = setup(gateway);
  try {
    const found = await router.find(router.authorize(event(1, '找可缇')), { query: '可缇', frameworks: ['dsh'] });
    assert.equal(found.emptyReason, 'NO_MATCH_WITHIN_DELEGATED_SCOPE');
    assert.deepEqual(found.searchScope, { roots: { dsh: [fixtureRoot], codex: [] }, excludedRoots: excludedRoots(), matchMode: 'literal-substring' });
    assert.deepEqual(found.candidates, []); assert.doesNotMatch(JSON.stringify(found), /PRIVATE_TOKEN_REFERENCE|NEVER_SERIALIZE/);
    const partial = await router.find(router.authorize(event(2, '再找')), { query: '可缇', frameworks: ['dsh','codex'] });
    assert.equal(partial.emptyReason, 'NO_MATCH_IN_AVAILABLE_FRAMEWORKS'); assert.equal(partial.unavailableFrameworks?.codex, 'FRAMEWORK_UNAVAILABLE');
    assert.deepEqual(router.snapshot().operations, []);
  } finally { await router.close(); await gateway.dispose(); }
});

test('候选和选择跨轮次保存，按操作者与QQ会话隔离，返回受理和完成不同状态', async () => {
  const mock = backend(), { router, options } = setup(mock.api);
  try {
    const actor = router.authorize(event(1, '查记忆相关项目')), found = await router.find(actor, { query: '记忆' });
    assert.equal(found.candidates.length, 2);
    await router.select(actor, { candidateSetId: found.id, index: 1 });
    assert.equal(router.selected(router.authorize(event(2, '继续')))!.target.id, 'chat-memory');
    assert.equal(router.selected(router.authorize(event(3, '继续', '789012'))), undefined);
    assert.equal(router.selected(router.authorize(event(4, '继续', '123456', '333444'))), undefined);
    await assert.rejects(router.select(router.authorize(event(5, '第二个', '789012')), { candidateSetId: found.id, index: 2 }), code('CANDIDATES_EXPIRED'));
    await router.close();
    const restored = new ConversationRouter(options);
    try {
      const draft = await restored.draft(restored.authorize(event(6, '检查项目现状')), { action: 'check' });
      await assert.rejects(restored.confirm(restored.authorize(event(6, '确认')), draft.id), code('CONFIRMATION_REQUIRED'));
      await assert.rejects(restored.confirm(restored.authorize(event(7, '可以执行吗？')), draft.id), code('CONFIRMATION_REQUIRED'));
      const receipt = await restored.confirm(restored.authorize(event(7, '确认')), draft.id);
      assert.equal(receipt.status, 'accepted'); assert.equal(mock.requests.length, 1);
      assert.equal((await restored.confirm(restored.authorize(event(7, '确认')), draft.id)).operationId, receipt.operationId);
      assert.equal(mock.requests.length, 1);
      await restored.pollPending();
      assert.equal((await restored.status(restored.authorize(event(8, '查看状态')), receipt.operationId)).status, 'completed');
      assert.equal(restored.pendingReports().at(-1)!.recipient, 'private:123456');
    } finally { await restored.close(); }
  } finally { await router.close(); }
});

test('不接受伪造身份、外部任务指令、过期消息或模型自行编写的自定义命令', async () => {
  const { router } = setup();
  try {
    assert.throws(() => router.authorize({ ...event(1, '确认'), source: 'codexbridge' }), code('UNTRUSTED_ORIGIN'));
    assert.throws(() => router.authorize({ ...event(1, '确认'), origin: 'internal' }), code('UNTRUSTED_ORIGIN'));
    assert.throws(() => router.authorize({ ...event(1, '确认'), senderKey: '999999' }), code('OPERATOR_DENIED'));
    assert.throws(() => router.authorize({ ...event(1, '确认'), ts: new Date(now - 60001).toISOString() }), code('EVENT_EXPIRED'));
    const actor = router.authorize(event(2, '查记忆项目')), found = await router.find(actor, { query: '记忆' }); await router.select(actor, { candidateSetId: found.id, index: 1 });
    await assert.rejects(router.draft(router.authorize(event(3, '不要继续')), { action: 'continue' }), code('HUMAN_INTENT_REQUIRED'));
    await assert.rejects(router.draft(router.authorize(event(4, '输入检查现状')), { action: 'send', prompt: '删除数据库' }), code('PROMPT_NOT_FROM_HUMAN'));
  } finally { await router.close(); }
});

test('未知提交结果锁住原目标，重启不重新提交', async () => {
  const mock = backend(); mock.api.execute = async request => { mock.requests.push(request); throw new Error('Disconnected after prompt'); };
  const { router, options } = setup(mock.api);
  const actor = router.authorize(event(1, '查项目')), set = await router.find(actor, { query: '项目' }); await router.select(actor, { candidateSetId: set.id, index: 1 });
  const draft = await router.draft(router.authorize(event(2, '继续')), { action: 'continue' });
  assert.equal((await router.confirm(router.authorize(event(3, '确认')), draft.id)).status, 'unknown'); await router.close();
  const restarted = new ConversationRouter(options);
  try {
    assert.equal((await restarted.status(restarted.authorize(event(4, '查看状态')), draft.id)).status, 'unknown');
    const next = await restarted.draft(restarted.authorize(event(5, '继续')), { action: 'continue' });
    await assert.rejects(restarted.confirm(restarted.authorize(event(6, '确认')), next.id), code('TARGET_BUSY')); assert.equal(mock.requests.length, 1);
  } finally { await restarted.close(); }
});

test('确认事件只能授权一项命令，改变选择后旧草稿失效', async () => {
  const mock = backend(); mock.api.execute = async r => { mock.requests.push(r); return { operationId: r.operationId, framework: r.framework, targetId: r.targetId, status: 'completed', at: new Date(now).toISOString() }; };
  const { router } = setup(mock.api);
  try {
    const actor = router.authorize(event(1, '找记忆')), set = await router.find(actor, { query: '记忆' }); await router.select(actor, { candidateSetId: set.id, index: 1 });
    const a = await router.draft(router.authorize(event(2, '检查')), { action: 'check' }), b = await router.draft(router.authorize(event(2, '检查')), { action: 'check' });
    await router.confirm(router.authorize(event(3, '确认')), a.id);
    await assert.rejects(router.confirm(router.authorize(event(3, '确认')), b.id), code('EVENT_ALREADY_USED'));
    await router.select(router.authorize(event(4, '第二个')), { candidateSetId: set.id, index: 2 });
    await assert.rejects(router.confirm(router.authorize(event(5, '确认')), b.id), code('SELECTION_CHANGED'));
  } finally { await router.close(); }
});

test('回执落库失败降级关闭受理，不抛未处理异常，原生prompt只提交一次', async () => {
  let nativePrompts = 0, lock: DatabaseSync | undefined;
  const file = join(mkdtempSync(join(scratch, 'lock-')), 'gateway.sqlite');
  const adapter: ConversationAdapter = { framework: 'dsh', async list() { return [conversation]; }, async get() { return conversation; }, async observe(receipt) { return receipt; }, async execute(r) { nativePrompts++; lock = new DatabaseSync(file); lock.exec('BEGIN IMMEDIATE'); return { operationId: r.operationId, framework: r.framework, targetId: r.targetId, status: 'accepted', at: new Date(now).toISOString() }; } };
  const options = { adapters: [adapter], stateFile: file, enabled: true, identity: { roots: [conversation.workspace] } }, gateway = new ConversationGateway(options);
  const request: ActionRequest = { operationId: 'operation-lock-fixture', framework: 'dsh', targetId: conversation.id, action: 'continue', prompt: '继续', expectedRevision: 'r1' };
  const receipt = await gateway.execute(request);
  assert.equal(receipt.status, 'unknown'); assert.equal(receipt.errorCode, 'RECEIPT_COMMIT_FAILED'); assert.equal(gateway.health().accepting, false); assert.equal(nativePrompts, 1);
  assert.equal((await gateway.execute(request)).status, 'unknown');
  lock!.exec('ROLLBACK'); lock!.close(); await gateway.dispose();
  const restored = new ConversationGateway(options);
  try { assert.equal((await restored.execute(request)).errorCode, 'RESTART_DURING_SUBMISSION'); assert.equal(nativePrompts, 1); await assert.rejects(restored.execute({ ...request, operationId: 'another-operation-fixture' }), code('TARGET_BUSY')); }
  finally { await restored.dispose(); }
});

test('状态库单owner及授权身份改变拒绝加载，不自动换库', async () => {
  const { router, options } = setup();
  assert.throws(() => new ConversationRouter(options), code('STATE_IN_USE'));
  await router.close(); assert.throws(() => new ConversationRouter({ ...options, operatorIds: ['123456'] }), code('STATE_IDENTITY_CHANGED'));
  assert.throws(() => new ConversationRouter({ ...options, backendIdentity: 'another-backend' }), code('STATE_IDENTITY_CHANGED'));
});

test('已由本World启动的任务仍能发暂停，排队确认被中止则不提交', async () => {
  const mock = backend(), { router } = setup(mock.api);
  try {
    const actor = router.authorize(event(1, '找项目')), set = await router.find(actor, { query: '项目' }); await router.select(actor, { candidateSetId: set.id, index: 1 });
    const run = await router.draft(router.authorize(event(2, '继续')), { action: 'continue' }); await router.confirm(router.authorize(event(3, '确认')), run.id);
    const pause = await router.draft(router.authorize(event(4, '暂停')), { action: 'pause' });
    const aborted = new AbortController(); aborted.abort();
    await assert.rejects(router.confirm(router.authorize(event(5, '确认')), pause.id, aborted.signal), code('ABORTED')); assert.equal(mock.requests.length, 1);
    await router.confirm(router.authorize(event(6, '确认')), pause.id); assert.equal(mock.requests.length, 2); assert.equal(mock.requests[1].action, 'pause');
  } finally { await router.close(); }
});

test('缺少一个框架不会伪装成两个框架均已搜索', async () => {
  const mock = backend(); mock.api.diagnostics = async () => ({ discoveryErrors: { codex: 'CODEX_DISABLED' } });
  const { router } = setup(mock.api);
  try { assert.deepEqual((await router.find(router.authorize(event(1, '找项目')), { query: '项目' })).unavailableFrameworks, { codex: 'CODEX_DISABLED' }); }
  finally { await router.close(); }
});

test('DSH-only find excludes an older unrelated Codex failure and warning', async () => {
  const mock = backend(); mock.api.diagnostics = async () => ({ discoveryErrors: { codex: 'CODEX_DESKTOP_RUNTIME_CHANGED' }, discoveryWarnings: { codex: ['OLD'], dsh: ['DISCOVERY_SNAPSHOT_LIMIT'] } });
  const { router } = setup(mock.api);
  try {
    const found = await router.find(router.authorize(event(1, '找项目')), { query: '项目', frameworks: ['dsh'] });
    assert.equal(found.unavailableFrameworks, undefined);
    assert.deepEqual(found.discoveryWarnings, { dsh: ['DISCOVERY_SNAPSHOT_LIMIT'] });
  } finally { await router.close(); }
});
