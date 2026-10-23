import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import type { EventEnvelope, PushOptions, ToolCallContext, WorldHost } from 'cortico/core/types.ts';
import type { ActionReceipt, Conversation, ConversationBackend, ReceiptStatus } from '../conversation-control/src/contract.ts';
import { ConversationControlWorld } from '../cortico-world-conversation-control/src/world.ts';
import { conversationControlDefaults } from '../cortico-world-conversation-control/src/config.ts';

const root = join(fixtureScratch, 'conversation-notification-tests'); mkdirSync(root, { recursive: true });
const operator = '12345678';
function fixture(progressIntervalMs = 0) {
  const dir = mkdtempSync(join(root, 'run-'));
  let now = Date.parse('2026-10-07T08:00:00Z'), failAfterSave = false;
  const events: EventEnvelope[] = [], pushes: { event: EventEnvelope; opts?: PushOptions }[] = [];
  const receipts = new Map<string, ActionReceipt>();
  const targets: Conversation[] = ['dsh', 'codex'].map((framework, index) => ({ framework: framework as 'dsh' | 'codex',
    id: `target-${index}`, title: `Task ${index}`, workspace: join(dir, `project-${index}`), summary: 'Fixture task',
    lastActivityAt: new Date(now).toISOString(), status: 'idle', revision: `revision-${index}`,
    capabilities: ['pause', 'continue', 'check', 'send'], source: 'isolated-receipt-fixture' }));
  const backend: ConversationBackend = {
    list: async () => targets,
    get: async (framework, id) => { const target = targets.find(item => item.framework === framework && item.id === id); assert.ok(target); return target; },
    execute: async request => {
      const receipt: ActionReceipt = { operationId: request.operationId, framework: request.framework, targetId: request.targetId,
        action: request.action, status: 'accepted', at: new Date(now).toISOString() };
      receipts.set(request.operationId, receipt); return receipt;
    },
    observe: async id => { const receipt = receipts.get(id); assert.ok(receipt); return receipt; },
  };
  const host = { store: {
    get: (cursor: number) => events.find(event => event.cursor === cursor),
    grep: (query: { source: string; keyword: string }) => events.filter(event => event.source === query.source && event.text.includes(query.keyword))
      .map(event => ({ hitCursor: event.cursor, events: [event] })),
  }, pushEvent: async (input: Omit<EventEnvelope, 'cursor'>, opts?: PushOptions) => {
    const saved: EventEnvelope = { ...input, cursor: events.length + 1 }; events.push(saved); pushes.push({ event: saved, opts });
    if (failAfterSave) { failAfterSave = false; throw new Error('Core event committed before transport return failed'); }
    return saved;
  } } as unknown as WorldHost;
  const create = () => new ConversationControlWorld({ cfg: { ...conversationControlDefaults(), enabled: true,
    operatorIds: JSON.stringify([operator]), pollIntervalMs: 60000, progressIntervalMs }, dataDir: dir, secret: async () => undefined, backend, clock: () => now });
  const human = (text: string): number => {
    const cursor = events.length + 1;
    events.push({ cursor, type: 'qq.message', source: 'qq', origin: 'external', ts: new Date(now).toISOString(), text,
      senderKey: operator, meta: { user_id: operator, conv: { kind: 'private', id: operator } } });
    return cursor;
  };
  const call = async (world: ConversationControlWorld, name: string, args: Record<string, unknown>) => {
    const result = await world.tools().find(tool => tool.name === `conversationcontrol_${name}`)!.handler(args, {} as ToolCallContext);
    assert.equal(typeof result, 'string', JSON.stringify(result)); return JSON.parse(result as string);
  };
  const begin = async (world: ConversationControlWorld, index = 1): Promise<string> => {
    const originEventCursor = human('检查这个项目');
    const found = await call(world, 'find', { originEventCursor, query: '' });
    await call(world, 'select', { originEventCursor, candidateSetId: found.id, index });
    const draft = await call(world, 'draft', { originEventCursor, action: 'check' });
    const result = await call(world, 'confirm', { originEventCursor: human('确认'), draftId: draft.id });
    assert.equal(result.status, 'accepted'); return draft.id;
  };
  const update = (id: string, status: ReceiptStatus, extra: Partial<ActionReceipt> = {}) => {
    now += 1000; const previous = receipts.get(id); assert.ok(previous);
    receipts.set(id, { ...previous, status, at: new Date(now).toISOString(), ...extra });
  };
  return { dir, host, create, begin, update, pushes, receipts, backend, advance: (ms: number) => { now += ms; }, failAfterSave: () => { failAfterSave = true; } };
}

test('ordinary receipts do not wake Core and completion emits one summary with classified counts', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    f.update(id, 'running', { turnId: 'turn-1' }); await world.pollOnce();
    f.update(id, 'running'); await world.pollOnce(); await world.pollOnce();
    assert.equal(f.pushes.length, 0); assert.equal(world.status().deferredCount, 2);
    assert.equal(world.status().pendingReports, 0);
    f.update(id, 'completed', { answer: 'Fixture result' }); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].opts?.trigger, 'flush');
    assert.equal(f.pushes[0].event.meta?.deferredCount, 2); assert.equal(f.pushes[0].event.meta?.status, 'completed');
    assert.equal(f.pushes[0].event.meta?.turnId, 'turn-1'); assert.equal(f.pushes[0].event.meta?.reason, 'completed');
    const payload = JSON.parse(f.pushes[0].event.text.split('\n').at(-1)!);
    assert.deepEqual(payload.deferred.counts, { accepted: 1, running: 1 });
    assert.equal(payload.deferred.source, 'isolated-receipt-fixture');
    assert.equal(payload.deferred.operationId, id); assert.ok(payload.deferred.firstAt < payload.deferred.lastAt);
    assert.equal(world.status().deferredCount, 0); await world.pollOnce(); assert.equal(f.pushes.length, 1);
  } finally { await world.stop(); }
});

test('ordinary answer changes and timestamp polls stay local until a human-action boundary', async () => {
  const f = fixture(30000), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    assert.equal(f.pushes.length, 0);
    f.update(id, 'running', { turnId: 'real-turn', answer: 'First actual public progress' }); await world.pollOnce();
    f.update(id, 'running', { answer: 'x'.repeat(5000) + 'latest actual progress' }); await world.pollOnce();
    assert.equal(f.pushes.length, 0);
    for (let index = 0; index < 10; index++) { f.update(id, 'running'); f.advance(30000); await world.pollOnce(); }
    assert.equal(f.pushes.length, 0);
    f.update(id, 'waiting_user', { errorCode: 'DSH_WAITING_USER' }); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].opts?.trigger, 'flush');
    assert.equal(f.pushes[0].event.meta?.status, 'waiting_user');
  } finally { await world.stop(); }
});

test('ordinary receipts survive restart and only terminal boundary flushes their summary', async () => {
  const f = fixture(30000), first = f.create(); await first.start(f.host); await first.pollOnce();
  const id = await f.begin(first); await first.pollOnce();
  f.update(id, 'running', { turnId: 'restart-turn', answer: 'Actual progress' }); await first.pollOnce(); await first.stop();
  const second = f.create(); await second.start(f.host); await second.pollOnce();
  try {
    assert.equal(f.pushes.length, 0); f.advance(30000); await second.pollOnce(); assert.equal(f.pushes.length, 0);
    f.update(id, 'running', { answer: 'Newer actual progress' }); await second.pollOnce();
    f.update(id, 'completed', { answer: 'Finished' }); await second.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].opts?.trigger, 'flush'); assert.equal(f.pushes[0].event.meta?.deferredCount, 3);
    f.advance(60000); await second.pollOnce(); assert.equal(f.pushes.length, 1);
  } finally { await second.stop(); }
});

test('saved completion with interrupted acknowledgement deduplicates across restart', async () => {
  const f = fixture(30000), first = f.create(); await first.start(f.host); await first.pollOnce();
  const id = await f.begin(first); f.update(id, 'completed'); f.failAfterSave(); await first.pollOnce();
  assert.equal(first.status().currentError, 'POLL_FAILURE'); assert.equal(f.pushes.length, 1); await first.stop();
  const second = f.create(); await second.start(f.host); await second.pollOnce();
  try { assert.equal(f.pushes.length, 1); assert.equal(second.status().recovered, 1); assert.equal(second.status().deferredCount, 0); }
  finally { await second.stop(); }
});

test('the same waiting boundary after actual resumed work is a new event, while detail-only observations are not', async () => {
  const f = fixture(1000), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    f.update(id, 'running', { turnId: 'same-turn', answer: 'Same visible work' }); await world.pollOnce();
    f.update(id, 'waiting_user', { errorCode: 'DSH_WAITING_USER' }); await world.pollOnce();
    const before = f.pushes.length;
    f.update(id, 'waiting_user', { detail: 'Another timestamp-only inspection' }); await world.pollOnce(); assert.equal(f.pushes.length, before);
    f.update(id, 'running', { errorCode: undefined }); await world.pollOnce(); assert.equal(f.pushes.length, before);
    f.update(id, 'waiting_user', { errorCode: 'DSH_WAITING_USER' }); await world.pollOnce(); assert.equal(f.pushes.length, before + 1);
    assert.notEqual(f.pushes.at(-1)!.event.meta?.deliveryId, f.pushes.at(-2)!.event.meta?.deliveryId);
  } finally { await world.stop(); }
});

test('desktop feed delivers native progress without recipient and preserves its cursor and marker across restart', async () => {
  const f = fixture();
  const event = { cursor: 1, eventId: 'event-1', sessionId: 'session-manual', workspace: fixtureWorkspace, turnId: '1', seq: 12,
    type: 'completed' as const, at: '2026-10-07T08:00:00Z', summary: 'Read-only fixture progress', toolCalls: 1, toolResults: 1, source: 'dsh-native-session-event' as const };
  let fail = false, feedId = 'feed-1';
  Object.assign(f.backend, { progress: async (after: number) => {
    if (fail) throw new Error('Offline');
    return { feedId, events: after < 1 ? [event] : [], nextCursor: 1, latestCursor: 1, baselineAt: '2026-10-07T07:59:00Z' };
  } });
  f.failAfterSave(); const first = f.create(); await first.start(f.host); await first.pollOnce();
  assert.equal(f.pushes.length, 1); assert.equal(first.status().currentError, 'POLL_FAILURE'); await first.stop();
  const second = f.create(); await second.start(f.host); await second.pollOnce();
  try {
    assert.equal(f.pushes.length, 1); assert.equal(second.status().recovered, 1);
    const saved = f.pushes[0]; assert.equal(saved.event.type, 'conversationcontrol.progress'); assert.equal(saved.event.meta?.recipient, undefined);
    assert.equal(saved.event.meta?.sourceCursor, 1); assert.match(saved.event.text, /不得猜测或自动发送 QQ/);
    fail = true; await second.pollOnce(); assert.equal(second.status().currentError, 'POLL_FAILURE');
    fail = false; feedId = 'feed-replaced'; await second.pollOnce(); assert.equal(second.status().currentError, 'PROGRESS_FEED_IDENTITY_CHANGED');
    assert.equal(f.pushes.length, 1);
  } finally { await second.stop(); }
});

test('parallel conversation summaries retain only their own deferred receipts', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const a = await f.begin(world, 1), b = await f.begin(world, 2); await world.pollOnce();
    f.update(a, 'running', { turnId: 'a-1' }); f.update(b, 'running', { turnId: 'b-1' }); await world.pollOnce();
    assert.equal(world.status().deferredCount, 4); assert.equal(world.status().deferredOperations, 2);
    f.update(a, 'completed'); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].event.meta?.operationId, a); assert.equal(f.pushes[0].event.meta?.deferredCount, 2);
    assert.equal(world.status().deferredCount, 2); assert.equal(world.status().deferredOperations, 1);
    f.update(b, 'completed'); await world.pollOnce();
    assert.equal(f.pushes.length, 2); assert.equal(f.pushes[1].event.meta?.operationId, b); assert.equal(f.pushes[1].event.meta?.framework, 'codex');
    assert.equal(f.pushes[1].event.meta?.deferredCount, 2); assert.equal(world.status().deferredCount, 0);
  } finally { await world.stop(); }
});

test('one owned DSH turn boundary is reported once across operation and native feed channels', async () => {
  const f = fixture(), world = f.create();
  let boundary: any;
  Object.assign(f.backend, { progress: async (after: number) => ({ feedId: 'owned-feed', baselineAt: '2026-10-07T07:59:00Z',
    events: boundary && after < 1 ? [boundary] : [], nextCursor: boundary ? 1 : 0, latestCursor: boundary ? 1 : 0 }) });
  await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    f.update(id, 'completed', { turnId: 'owned-turn', answer: 'One finished turn' });
    boundary = { cursor: 1, eventId: 'owned-event', sessionId: 'target-0', workspace: fixtureWorkspace, turnId: 'owned-turn', seq: 12,
      type: 'completed', at: '2026-10-07T08:00:00Z', summary: 'One finished turn', toolCalls: 0, toolResults: 0, source: 'dsh-native-session-event' };
    await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].event.type, 'conversationcontrol.result');
    assert.equal(f.pushes[0].event.meta?.operationId, id);
    await world.pollOnce(); assert.equal(f.pushes.length, 1);
  } finally { await world.stop(); }
});

test('native completion waits for an owned operation with active background jobs and later reports once', async () => {
  const f = fixture(), world = f.create();
  let boundary: any;
  Object.assign(f.backend, { progress: async (after: number) => ({ feedId: 'background-owned-feed', baselineAt: '2026-10-07T07:59:00Z',
    events: boundary && after < 1 ? [boundary] : [], nextCursor: boundary ? 1 : 0, latestCursor: boundary ? 1 : 0 }) });
  await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    f.update(id, 'running', { turnId: 'background-owned-turn', errorCode: 'BACKGROUND_JOBS_ACTIVE' });
    boundary = { cursor: 1, eventId: 'background-owned-event', sessionId: 'target-0', workspace: fixtureWorkspace, turnId: 'background-owned-turn', seq: 12,
      type: 'completed', at: '2026-10-07T08:00:00Z', summary: 'The turn ended but its background jobs remain active', toolCalls: 1, toolResults: 1, source: 'dsh-native-session-event' };
    await world.pollOnce();
    assert.equal(f.pushes.length, 0); assert.equal(world.status().deferredCount, 2);
    assert.equal((world.status().router as any).progressFeed.cursor, 1);
    await world.pollOnce(); assert.equal(f.pushes.length, 0);
    f.update(id, 'completed', { errorCode: undefined, answer: 'Background jobs finished' }); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].event.type, 'conversationcontrol.result');
    assert.equal(f.pushes[0].event.meta?.operationId, id); assert.equal(f.pushes[0].event.meta?.status, 'completed');
    assert.equal(f.pushes[0].event.meta?.deferredCount, 2);
    await world.pollOnce(); assert.equal(f.pushes.length, 1);
  } finally { await world.stop(); }
});

test('waiting for the user flushes immediately and repeated important signatures remain silent', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    f.update(id, 'waiting_user', { turnId: 'waiting-turn' }); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].opts?.trigger, 'flush');
    assert.equal(f.pushes[0].event.meta?.status, 'waiting_user'); assert.equal(f.pushes[0].event.meta?.deferredCount, 1);
    f.update(id, 'waiting_user', { detail: 'Still waiting for the same input' }); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(world.status().pendingReports, 0);
    f.update(id, 'waiting_user', { turnId: 'next-waiting-turn' }); await world.pollOnce();
    assert.equal(f.pushes.length, 2); assert.equal(f.pushes[1].event.meta?.deferredCount, 0);
  } finally { await world.stop(); }
});

test('an error code on a running receipt is an important boundary', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    f.update(id, 'running', { errorCode: 'QUOTA_EXHAUSTED' }); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].opts?.trigger, 'flush');
    assert.equal(f.pushes[0].event.meta?.errorCode, 'QUOTA_EXHAUSTED'); assert.equal(f.pushes[0].event.meta?.reason, 'QUOTA_EXHAUSTED');
    assert.equal(f.pushes[0].event.meta?.deferredCount, 1); assert.equal(world.status().deferredCount, 0);
  } finally { await world.stop(); }
});

test('active background jobs remain ordinary progress until completion', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const id = await f.begin(world); await world.pollOnce();
    f.update(id, 'running', { errorCode: 'BACKGROUND_JOBS_ACTIVE', turnId: 'background-turn' }); await world.pollOnce();
    assert.equal(f.pushes.length, 0); assert.equal(world.status().deferredCount, 2); assert.equal(world.status().pendingReports, 0);
    f.update(id, 'completed', { errorCode: undefined }); await world.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].event.meta?.deferredCount, 2);
    assert.equal(f.pushes[0].event.meta?.errorCode, null); assert.equal(f.pushes[0].event.meta?.status, 'completed');
  } finally { await world.stop(); }
});

test('deferred receipts survive World restart and enter the next important summary', async () => {
  const f = fixture(), first = f.create(); await first.start(f.host); await first.pollOnce();
  const id = await f.begin(first); await first.pollOnce(); f.update(id, 'running', { turnId: 'persistent-turn' }); await first.pollOnce();
  assert.equal(first.status().deferredCount, 2); assert.equal(f.pushes.length, 0); await first.stop();
  const restored = f.create(); await restored.start(f.host); await restored.pollOnce();
  try {
    assert.equal(restored.status().deferredCount, 2); assert.equal(f.pushes.length, 0);
    f.update(id, 'completed'); await restored.pollOnce();
    assert.equal(f.pushes.length, 1); assert.equal(f.pushes[0].event.meta?.deferredCount, 2);
    assert.equal(restored.status().deferredCount, 0);
  } finally { await restored.stop(); }
});

test('saved Core event with a failed return recovers its frozen summary without another insert', async () => {
  const f = fixture(), first = f.create(); await first.start(f.host); await first.pollOnce();
  const id = await f.begin(first); await first.pollOnce(); f.update(id, 'running', { turnId: 'recovery-turn' }); await first.pollOnce();
  f.update(id, 'completed'); f.failAfterSave(); await first.pollOnce();
  assert.equal(first.status().currentError, 'POLL_FAILURE'); assert.equal(first.status().deferredCount, 2);
  assert.equal(first.status().pendingReports, 1); assert.equal(f.pushes.length, 1); await first.stop();
  const restored = f.create(); await restored.start(f.host); await restored.pollOnce();
  try {
    assert.equal(f.pushes.length, 1); assert.equal(restored.status().recovered, 1);
    assert.equal(restored.status().deferredCount, 0); assert.equal(restored.status().pendingReports, 0);
    await restored.pollOnce(); assert.equal(f.pushes.length, 1);
  } finally { await restored.stop(); }
});
