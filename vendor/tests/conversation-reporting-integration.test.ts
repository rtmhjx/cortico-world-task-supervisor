import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { JsonlEventStore } from 'cortico/core/event-store.ts';
import type { EventEnvelope, PushOptions, ToolCallContext, WorldHost } from 'cortico/core/types.ts';
import type { ConversationBackend } from '../conversation-control/src/contract.ts';
import type { DshProgressBatch, DshProgressEvent } from '../conversation-control/src/progress-contract.ts';
import { ConversationControlWorld } from '../cortico-world-conversation-control/src/world.ts';
import { conversationControlDefaults } from '../cortico-world-conversation-control/src/config.ts';
import { ReportingGate } from '../task-reporting/src/gate.ts';

const operator = '12345678';
const root = join(fixtureScratch, 'reporting-integration-tests'); mkdirSync(root, { recursive: true });
function fixture() {
  const dir = mkdtempSync(join(root, 'run-')), gateFile = join(dir, 'task-reporting', 'gate.sqlite');
  const store = new JsonlEventStore({ dataDir: dir, run: 'r-fixture' });
  let now = Date.parse('2026-10-24T01:00:00Z'), failSavedTask = false, afterTaskSave: (() => void) | undefined;
  const pushes: { event: EventEnvelope; options?: PushOptions }[] = [];
  const calls = { list: 0, get: 0, execute: 0, observe: 0, progress: 0 };
  const feed: DshProgressEvent[] = ['started', 'running', 'completed', 'waiting_user'].map((type, index) => ({
    cursor: index + 1, eventId: `native-${index + 1}`, sessionId: index === 3 ? 'fixture-approval-task' : 'fixture-completed-task',
    workspace: join(dir, 'project'), turnId: '1', seq: index + 10, type: type as DshProgressEvent['type'], at: new Date(now).toISOString(),
    summary: type === 'completed' ? 'Fixture work finished' : type === 'waiting_user' ? 'Fixture approval required' : 'Fixture ordinary activity',
    toolCalls: 1, toolResults: 1, source: 'dsh-native-session-event',
  }));
  const backend: ConversationBackend & { progress(after: number): Promise<DshProgressBatch> } = {
    list: async () => { calls.list++; return []; },
    get: async () => { calls.get++; throw new Error('Unexpected fixture control'); },
    execute: async () => { calls.execute++; throw new Error('Unexpected fixture submission'); },
    observe: async () => { calls.observe++; throw new Error('Unexpected fixture observation'); },
    progress: async after => { calls.progress++; return { feedId: 'fixture-native-feed', baselineAt: new Date(now).toISOString(), events: feed.filter(e => e.cursor > after), nextCursor: feed.at(-1)!.cursor, latestCursor: feed.at(-1)!.cursor }; },
  };
  const host = { store, pushEvent: async (event: Omit<EventEnvelope, 'cursor'>, options?: PushOptions) => {
    const saved = store.append(event); pushes.push({ event: saved, options });
    if (event.type === 'conversationcontrol.progress' && afterTaskSave) { const action = afterTaskSave; afterTaskSave = undefined; action(); }
    if (failSavedTask && event.type === 'conversationcontrol.progress') { failSavedTask = false; throw new Error('Host event saved before reply failed'); }
    return saved;
  } } as unknown as WorldHost;
  const create = () => new ConversationControlWorld({ cfg: { ...conversationControlDefaults(), enabled: true,
    operatorIds: JSON.stringify([operator]), reportingOperatorId: operator, reportingStateFile: gateFile, pollIntervalMs: 60000,
  }, dataDir: dir, secret: async () => undefined, backend, clock: () => now });
  const command = (messageId: number, metaPatch: Record<string, unknown> = {}, senderKey = operator) => store.append({
    type: 'qq.message', source: 'qq', origin: 'external', ts: new Date(now).toISOString(), senderKey,
    text: `#${messageId} [私聊 fixture] Owner(${operator}): #@`,
    meta: { message_id: messageId, user_id: Number(operator), conv: { kind: 'private', id: Number(operator) }, taskReportingCommand: { version: 1, token: '#@' }, ...metaPatch },
  });
  const gate = () => new ReportingGate({ stateFile: gateFile, operatorId: operator, clock: () => now });
  const invoke = async (world: ConversationControlWorld, originCursor: number) => {
    const result = await world.tools().find(t => t.name === 'conversationcontrol_find')!.handler({ originEventCursor: originCursor, query: '' }, {} as ToolCallContext);
    return typeof result === 'string' ? JSON.parse(result) : result;
  };
  const tasks = () => pushes.filter(p => p.event.type === 'conversationcontrol.progress');
  const modes = () => pushes.filter(p => p.event.type === 'conversationcontrol.mode');
  return { dir, store, host, create, command, gate, invoke, tasks, modes, calls, pushes,
    advance: (ms: number) => { now += ms; }, failAfterTaskSave: () => { failSavedTask = true; }, afterNextTaskSave: (action: () => void) => { afterTaskSave = action; } };
}

test('closed supervision advances native cursor and queues only important facts; owner opens and drains without ordinary steps', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  const inspector = f.gate();
  try {
    assert.equal(world.status().currentError, null); assert.equal(f.tasks().length, 0);
    assert.equal((world.status().router as any).progressFeed.cursor, 4);
    assert.equal(inspector.enabled(), false); assert.equal(inspector.snapshot().pendingCount, 2);
    assert.ok(f.calls.progress > 0);
    f.command(101); await world.pollOnce();
    assert.equal(inspector.enabled(), true); assert.equal(f.modes().length, 1);
    assert.deepEqual(f.tasks().map(p => p.event.meta!.status), ['completed', 'waiting_user']);
    for (const pushed of f.tasks()) {
      assert.equal(pushed.options?.trigger, 'flush'); assert.equal(pushed.event.meta!.recipient, `private:${operator}`);
      assert.ok(!pushed.event.text.includes('Fixture ordinary activity'));
    }
    assert.equal(inspector.snapshot().pendingCount, 0);
    f.command(101); await world.pollOnce();
    assert.equal(inspector.enabled(), true); assert.equal(f.modes().length, 1); assert.equal(f.tasks().length, 2);
    f.command(102); await world.pollOnce(); assert.equal(inspector.enabled(), false); assert.equal(f.modes().length, 2);
    assert.equal(f.tasks().length, 2);
  } finally { inspector.close(); await world.stop(); }
});

test('Codex connection may sync the command first without consuming the durable mode notification', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  const codexConnection = f.gate();
  try {
    f.command(201); const transition = codexConnection.syncCommands(f.store);
    assert.equal(transition.length, 1); assert.equal(codexConnection.pendingTransitions().length, 1);
    await world.pollOnce();
    assert.equal(f.modes().length, 1); assert.equal(codexConnection.pendingTransitions().length, 0);
    assert.equal(f.tasks().length, 2);
  } finally { codexConnection.close(); await world.stop(); }
});

test('a fresh close command stops tools before the next poll and never calls the backend', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    const initial = f.command(301, { taskReportingCommand: undefined });
    const disabled = await f.invoke(world, initial.cursor); assert.equal(disabled.failed, true); assert.match(disabled.text, /^REPORTING_DISABLED:/); assert.equal(f.calls.list, 0);
    const opened = f.command(302); await world.pollOnce();
    const found = await f.invoke(world, opened.cursor); assert.ok(Array.isArray(found.candidates)); assert.equal(f.calls.list, 1);
    const closed = f.command(303); // The World timer has not processed this event.
    const rejected = await f.invoke(world, closed.cursor);
    assert.equal(rejected.failed, true); assert.match(rejected.text, /^REPORTING_DISABLED:/); assert.equal(f.calls.list, 1); assert.equal(f.calls.get, 0); assert.equal(f.calls.execute, 0);
    await world.pollOnce(); assert.equal(f.modes().at(-1)!.event.meta!.enabled, false);
  } finally { await world.stop(); }
});

test('a task event saved before failed return recovers by marker after World restart without a duplicate', async () => {
  const f = fixture(), first = f.create(); await first.start(f.host); await first.pollOnce();
  f.command(401); f.failAfterTaskSave(); await first.pollOnce();
  assert.equal(first.status().currentError, 'POLL_FAILURE'); assert.equal(f.tasks().length, 1); await first.stop();
  const second = f.create(); await second.start(f.host); await second.pollOnce();
  try {
    assert.equal(second.status().currentError, null); assert.equal(second.status().recovered, 1);
    assert.equal(f.tasks().length, 2); assert.equal(f.modes().length, 1);
    assert.deepEqual(f.tasks().map(p => p.event.meta!.status), ['completed', 'waiting_user']);
    const check = f.gate(); try { assert.equal(check.snapshot().pendingCount, 0); } finally { check.close(); }
    await second.pollOnce(); assert.equal(f.tasks().length, 2);
  } finally { await second.stop(); }
});

test('untrusted group, foreign sender and display-only command cannot open or release task backlog', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    f.command(501, { conv: { kind: 'group', id: Number(operator) } });
    f.command(502, { user_id: 87654321 }, '87654321');
    f.command(503, { taskReportingCommand: undefined });
    await world.pollOnce();
    assert.equal(f.tasks().length, 0); assert.equal(f.modes().length, 0);
    assert.equal((world.status().reporting as any).enabled, false); assert.equal((world.status().reporting as any).pendingCount, 2);
  } finally { await world.stop(); }
});

test('a close command arriving during backlog delivery stops the next queued task', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  try {
    f.command(601); f.afterNextTaskSave(() => { f.command(602); });
    await world.pollOnce();
    assert.equal(f.tasks().length, 1); assert.equal((world.status().reporting as any).enabled, false);
    assert.equal((world.status().reporting as any).pendingCount, 1);
    await world.pollOnce(); assert.equal(f.tasks().length, 1); assert.equal(f.modes().at(-1)!.event.meta!.enabled, false);
    f.command(603); await world.pollOnce();
    assert.equal(f.tasks().length, 2); assert.equal((world.status().reporting as any).pendingCount, 0);
  } finally { await world.stop(); }
});

test('a legacy queued operation uses the owner recipient in its body and metadata and retains the original destination as provenance', async () => {
  const f = fixture(), world = f.create(); await world.start(f.host); await world.pollOnce();
  const inspector = f.gate(), marker = '[conversationcontrol delivery:legacy-recipient-fixture]';
  try {
    inspector.enqueue('conversationcontrol', 'legacy-recipient-fixture', { marker, event: {
      type: 'conversationcontrol.result', source: 'conversationcontrol', origin: 'external', ts: '2026-10-24T01:00:00Z',
      text: marker + '\nFixture historical operation receipt.\n' + JSON.stringify({ recipient: 'group:87654321',
        target: { framework: 'dsh', id: 'fixture-old-target' }, receipt: { status: 'completed', operationId: 'fixture-old-operation' } }),
      meta: { recipient: 'group:87654321', sourceOccurredAt: '2026-10-24T01:00:00Z' },
    } });
    assert.equal(f.pushes.filter(p => p.event.type === 'conversationcontrol.result').length, 0);
    f.command(701); await world.pollOnce();
    const results = f.pushes.filter(p => p.event.type === 'conversationcontrol.result');
    assert.equal(results.length, 1); assert.equal(world.status().currentError, null);
    const saved = results[0].event;
    const body = JSON.parse(saved.text.split('\n').find(line => line.startsWith('{'))!);
    assert.equal(body.recipient, `private:${operator}`); assert.equal(saved.meta!.recipient, `private:${operator}`);
    assert.equal(body.originRecipient, 'group:87654321'); assert.equal(saved.meta!.originRecipient, 'group:87654321');
    assert.equal(body.receipt.operationId, 'fixture-old-operation'); assert.equal(body.target.id, 'fixture-old-target');
    await world.pollOnce(); assert.equal(f.pushes.filter(p => p.event.type === 'conversationcontrol.result').length, 1);
    assert.equal(inspector.snapshot().pendingCount, 0);
  } finally { inspector.close(); await world.stop(); }
});
