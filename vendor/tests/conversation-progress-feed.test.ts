import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { DshProgressFeed, progressWorkspaceAllowed, type DshProgressNativeEvent } from '../conversation-control/src/dsh-progress.ts';

const root = join(fixtureScratch, 'progress-feed-tests');
mkdirSync(root, { recursive: true });
function fixture() {
  const dir = mkdtempSync(join(root, 'run-')), workspace = join(dir, 'project');
  mkdirSync(workspace);
  let now = Date.now(), listener: ((session: any, event: DshProgressNativeEvent) => void) | undefined;
  const file = join(dir, 'progress.sqlite');
  const create = () => {
    const feed = new DshProgressFeed({ stateFile: file, roots: [workspace], now: () => now, intervalMs: 30000 });
    feed.start({ on: (_name, callback) => { listener = callback; return () => { listener = undefined; }; } });
    return feed;
  };
  const emit = (seq: number, type: string, data: Record<string, any>, extra: Partial<DshProgressNativeEvent> = {}, header: any = {}) =>
    listener!({ header: { id: 'fixture-session', cwd: workspace, ...header } }, { seq, time: now, type, data, ...extra });
  return { create, emit, advance: (ms: number) => { now += ms; }, workspace, file };
}

test('current native append facts deliver public progress and terminal counts without private content', async () => {
  const f = fixture(), feed = f.create();
  try {
    f.emit(1, 'turn/start', { turn: 1 });
    f.emit(2, 'assistant/message', { turn: 1, message: { content: [{ type: 'thinking', text: 'private thoughts' }, { type: 'text', text: 'Progress token=fixture-sensitive-value' }] } }, { surfaceOp: 'append' });
    f.emit(3, 'tool/call', { turn: 1, arguments: 'private arguments' }, { surfaceOp: 'append' });
    f.emit(4, 'tool/result', { turn: 1, result: 'private tool result' }, { surfaceOp: 'append' });
    f.emit(5, 'turn/end', { turn: 1, reason: { kind: 'completed' } });
    const batch = await feed.read(0);
    assert.deepEqual(batch.events.map(e => e.type), ['started', 'completed']);
    assert.equal(batch.events[1].toolCalls, 1); assert.equal(batch.events[1].toolResults, 1);
    assert.match(batch.events[1].summary, /Progress token=\[REDACTED\]/);
    const serialized = JSON.stringify(batch);
    for (const forbidden of ['private thoughts', 'private arguments', 'private tool result', 'fixture-sensitive-value']) assert.ok(!serialized.includes(forbidden));
  } finally { await feed.stop(); }
});

test('actual pending progress flushes after the interval; time and duplicates add no events', async () => {
  const f = fixture(), feed = f.create();
  try {
    f.emit(1, 'turn/start', { turn: 3 });
    f.emit(2, 'assistant/message', { turn: 3, message: { content: [{ type: 'text', text: 'First progress' }] } }, { surfaceOp: 'append' });
    assert.equal((await feed.read(0)).events.length, 1);
    f.advance(30000);
    const batch = await feed.read(0); assert.equal(batch.events.length, 2); assert.equal(batch.events[1].summary, 'First progress');
    f.emit(2, 'assistant/message', { turn: 3, message: { content: [{ type: 'text', text: 'First progress' }] } }, { surfaceOp: 'append' });
    f.advance(90000); assert.equal((await feed.read(batch.nextCursor)).events.length, 0);
  } finally { await feed.stop(); }
});

test('replacement context and cold synthetic closers do not invent execution facts', async () => {
  const f = fixture(), feed = f.create();
  try {
    f.emit(1, 'turn/end', { turn: 1, reason: { kind: 'completed' } });
    f.emit(2, 'assistant/message', { turn: 1, message: { content: [{ type: 'text', text: 'historical replacement' }] } }, { surfaceOp: { op: 'replace', startSeq: 0, endSeq: 1 } });
    f.emit(3, 'turn/start', { turn: 2 });
    f.emit(4, 'turn/end', { turn: 2, reason: { kind: 'interrupted' } });
    const batch = await feed.read(0); assert.deepEqual(batch.events.map(e => e.type), ['started']);
  } finally { await feed.stop(); }
});

test('persisted feed identity, pending work and exact source cursor survive restart', async () => {
  const f = fixture(), first = f.create();
  f.emit(1, 'turn/start', { turn: 1 });
  f.emit(2, 'assistant/message', { turn: 1, message: { content: [{ type: 'text', text: 'Pending across reload' }] } }, { surfaceOp: 'append' });
  const before = await first.read(0); await first.stop();
  const second = f.create();
  try {
    f.emit(1, 'turn/start', { turn: 1 }); f.advance(30000);
    const after = await second.read(before.nextCursor);
    assert.equal(after.feedId, before.feedId); assert.equal(after.events.length, 1); assert.equal(after.events[0].seq, 2);
    assert.equal(after.events[0].summary, 'Pending across reload');
    assert.equal((await second.read(after.nextCursor)).events.length, 0);
  } finally { await second.stop(); }
});

test('approval boundaries flush immediately and native aborted turns remain interrupted', async () => {
  const f = fixture(), feed = f.create();
  try {
    f.emit(1, 'turn/start', { turn: 2 });
    f.emit(2, 'approval/asked', { turn: 2, id: 'approval' });
    f.emit(3, 'approval/decided', { turn: 2, id: 'approval' });
    f.emit(4, 'turn/end', { turn: 2, reason: { kind: 'aborted' } });
    const batch = await feed.read(0);
    assert.deepEqual(batch.events.map(e => e.type), ['started', 'waiting_user', 'running', 'interrupted']);
  } finally { await feed.stop(); }
});

test('authorization and baseline reject outside, subagent and historical events', async () => {
  const f = fixture(), feed = f.create();
  try {
    f.emit(1, 'turn/start', { turn: 1 }, {}, { cwd: join(f.workspace, '..') });
    f.emit(2, 'turn/start', { turn: 1 }, {}, { parentSession: 'owner' });
    f.emit(3, 'turn/start', { turn: 1 }, { time: 0 });
    assert.equal((await feed.read(0)).events.length, 0);
    assert.equal(await progressWorkspaceAllowed(fixtureProtected, [fixtureRoot]), false);
    assert.equal(await progressWorkspaceAllowed(fixtureProtectedRecords, [fixtureRoot]), false);
    assert.equal(await progressWorkspaceAllowed(fixtureProtectedParent, [fixtureRoot]), false);
    await assert.rejects(feed.read(1), /cursor exceeds/);
    await assert.rejects(feed.read(-1), /nonnegative/);
  } finally { await feed.stop(); }
});
