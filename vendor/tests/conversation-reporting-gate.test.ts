import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ReportingGate, reportingCommand, type ReportingEvent } from '../task-reporting/src/gate.ts';

const root = join(fixtureScratch, 'reporting-gate-tests'); mkdirSync(root, { recursive: true });
const operator = '12345678';
function fixture() {
  const dir = mkdtempSync(join(root, 'run-')); let now = Date.now();
  const events: ReportingEvent[] = [];
  const file = join(dir, 'gate.sqlite');
  const create = () => new ReportingGate({ stateFile: file, operatorId: operator, clock: () => now });
  const store = { latestCursor: () => events.length, range: ({ fromCursor = 1, toCursor = events.length, source }: any) => events.filter(e => e.cursor >= fromCursor && e.cursor <= toCursor && (!source || e.source === source)) };
  const message = (messageId: number, patch: Partial<ReportingEvent> = {}, metaPatch: Record<string, unknown> = {}) => {
    const e: ReportingEvent = { cursor: events.length + 1, type: 'qq.message', source: 'qq', origin: 'external', ts: new Date(now).toISOString(), senderKey: operator,
      text: '#123 [私聊 test] User(12345678): #@',
      ...patch, meta: { user_id: Number(operator), message_id: messageId, conv: { kind: 'private', id: Number(operator) }, taskReportingCommand: { version: 1, token: '#@' }, ...metaPatch } };
    events.push(e); return e;
  };
  return { file, create, store, message, advance: (ms: number) => { now += ms; }, now: () => now };
}

test('default off establishes a current baseline and both Worlds share durable toggles', () => {
  const f = fixture(); f.message(1);
  const a = f.create(), b = f.create();
  try {
    assert.equal(a.enabled(), false); assert.deepEqual(a.syncCommands(f.store), []); assert.equal(a.enabled(), false);
    f.message(2); const transitions = b.syncCommands(f.store);
    assert.equal(transitions.length, 1); assert.equal(transitions[0].enabled, true); assert.equal(a.enabled(), true);
    assert.equal(a.pendingTransitions().length, 1); a.ackTransition(1, 100);
    assert.equal(b.pendingTransitions().length, 0);
    f.message(3); a.syncCommands(f.store); assert.equal(b.enabled(), false);
    assert.equal(b.snapshot().epoch, 2);
  } finally { a.close(); b.close(); }
  const resumed = f.create(); try { assert.equal(resumed.enabled(), false); assert.equal(resumed.pendingTransitions()[0].epoch, 2); } finally { resumed.close(); }
});

test('QQ command authority requires the exact private sender and original-prefix metadata', () => {
  const f = fixture(), gate = f.create();
  try {
    gate.syncCommands(f.store);
    f.message(1, { source: 'conversationcontrol' });
    f.message(2, { origin: 'internal' });
    f.message(3, { senderKey: '11111111' });
    f.message(4, {}, { user_id: 11111111 });
    f.message(5, {}, { conv: { kind: 'group', id: Number(operator) } });
    f.message(6, {}, { conv: { kind: 'private', id: 11111111 } });
    f.message(7, {}, { taskReportingCommand: undefined });
    f.message(8, {}, { taskReportingCommand: { version: 1, token: '#@', source: 'quoted' } });
    f.message(9, {}, { self: true });
    f.message(10, {}, { role: 'assistant' });
    f.message(0);
    f.message(12, { ts: new Date(f.now() - 300001).toISOString() });
    f.message(13, { ts: new Date(f.now() + 5001).toISOString() });
    assert.deepEqual(gate.syncCommands(f.store), []); assert.equal(gate.enabled(), false);
    f.message(-123456789); assert.equal(gate.syncCommands(f.store)[0].enabled, true);
  } finally { gate.close(); }
});

test('same native QQ message redelivered at another cursor cannot toggle again after restart', () => {
  const f = fixture(), a = f.create(); a.syncCommands(f.store);
  f.message(100); a.syncCommands(f.store); a.close();
  const b = f.create();
  try { f.message(100); assert.deepEqual(b.syncCommands(f.store), []); assert.equal(b.enabled(), true); assert.equal(b.snapshot().epoch, 1); }
  finally { b.close(); }
});

test('off queues important source notifications; on drains each source in order and ack survives reload', () => {
  const f = fixture(), gate = f.create();
  gate.syncCommands(f.store);
  gate.enqueue('conversationcontrol', 'dsh-done', { type: 'completed', text: 'Native task ended' });
  gate.enqueue('codexbridge', 'codex-approval', { type: 'approval', text: 'Approval required' });
  assert.deepEqual(gate.pending('conversationcontrol'), []); assert.equal(gate.snapshot().pendingCount, 2);
  f.message(1); gate.syncCommands(f.store);
  assert.equal(gate.pending('conversationcontrol').length, 1); assert.equal(gate.pending('codexbridge').length, 1);
  assert.equal(gate.enqueue('conversationcontrol', 'dsh-done', { text: 'Duplicate new content' }), false);
  assert.equal(gate.pending('conversationcontrol')[0].payload.text, 'Native task ended');
  gate.ack('conversationcontrol', 'dsh-done', 9); gate.close();
  const resumed = f.create();
  try {
    assert.deepEqual(resumed.pending('conversationcontrol'), []); assert.equal(resumed.pending('codexbridge').length, 1);
    assert.equal(resumed.enqueue('conversationcontrol', 'dsh-done', { text: 'Acked duplicate' }), false);
    f.message(2); resumed.syncCommands(f.store); assert.equal(resumed.enabled(), false); assert.deepEqual(resumed.pending('codexbridge'), []);
    assert.equal(resumed.snapshot().pendingCount, 1);
  } finally { resumed.close(); }
});

test('outbox sanitizes secret-shaped data and snapshots never expose payload bodies', () => {
  const f = fixture(), gate = f.create();
  try {
    gate.syncCommands(f.store); gate.enqueue('codexbridge', 'source-1', { token: 'private-token', nested: { text: 'api_key=secret-value Bearer abcdefghijklmnopqrstuvwxyz' }, text: 'Safe public result' });
    const snapshot = JSON.stringify(gate.snapshot()); assert.ok(!snapshot.includes('Safe public result')); assert.ok(!snapshot.includes('private-token'));
    f.message(1); gate.syncCommands(f.store);
    const stored = JSON.stringify(gate.pending('codexbridge'));
    for (const value of ['private-token', 'secret-value', 'abcdefghijklmnopqrstuvwxyz']) assert.ok(!stored.includes(value));
    assert.match(stored, /REDACTED/);
    assert.throws(() => gate.enqueue('codexbridge', 'large', { text: 'x'.repeat(1024 * 1024 + 1) }), /exceeds 1 MiB/);
    assert.throws(() => gate.ack('codexbridge', 'source-1', 0), /Invalid.*receipt/);
  } finally { gate.close(); }
});

test('store rewind and changed operator cannot silently reset the durable authorization gate', () => {
  const f = fixture(), gate = f.create(); gate.syncCommands(f.store); f.message(1); gate.syncCommands(f.store);
  assert.throws(() => gate.syncCommands({ latestCursor: () => 0, range: () => [] }), /moved backwards/); gate.close();
  assert.throws(() => new ReportingGate({ stateFile: f.file, operatorId: '11111111' }), /identity changed/);
});

test('bounded cursor windows retain early and late commands across a large QQ interval', () => {
  const f = fixture(), gate = f.create();
  try {
    gate.syncCommands(f.store); f.message(1);
    for (let index = 2; index <= 10000; index++) f.message(index, {}, { taskReportingCommand: undefined });
    f.message(10001);
    const transitions = gate.syncCommands(f.store);
    assert.deepEqual(transitions.map(t => [t.eventCursor, t.enabled]), [[1, true], [10001, false]]);
    assert.equal(gate.snapshot().commandCursor, 10001);
    assert.deepEqual(gate.syncCommands(f.store), []);
  } finally { gate.close(); }
});

test('an unrelated SQLite file cannot become the reporting outbox', () => {
  const f = fixture(), db = new DatabaseSync(f.file);
  db.exec('CREATE TABLE retained_data(value TEXT); INSERT INTO retained_data VALUES(\'keep\');'); db.close();
  assert.throws(() => f.create(), /not a complete reporting database/);
  const check = new DatabaseSync(f.file, { readOnly: true });
  try {
    assert.equal(check.prepare('SELECT value FROM retained_data').get()!.value, 'keep');
    assert.equal(check.prepare("SELECT count(*) AS total FROM sqlite_master WHERE type='table' AND name LIKE 'reporting_%'").get()!.total, 0);
  } finally { check.close(); }
});
