/** Ported native-bridge fixture; uses no SnowLuma installation, profile or private SDK fork. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startNativeBridge, messageKey } from './bridge.mjs';
import { CommandListener } from '../../src/command-listener.ts';
import { ReportingGate } from '../task-reporting/src/gate.ts';

const token = 'synthetic-native-helper-token-for-tests-only';
const accountId = '10001', owner = '12345678';
const sortedConversations = entries => [...entries].sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, timeout = 4000) { const end = Date.now() + timeout; while (!check()) { if (Date.now() > end) throw new Error('Synthetic native helper condition timed out'); await pause(10); } }
function fixtureBridge() {
  const listeners = new Set(), named = new Map(), sends = []; let fail = false, seq = 100;
  return {
    empty: false, receiveHealthy: true, sends,
    identity: { uin: accountId, nickname: 'Synthetic account', findGroup: id => ({ groupName: `Group ${id}` }), findGroupMember: () => ({ card: 'Synthetic' }) },
    events: { onAny(cb) { listeners.add(cb); return () => listeners.delete(cb); }, on(kind, cb) { named.set(kind, cb); return () => named.delete(kind); } },
    async emit(event) { await named.get(event.kind)?.(event); for (const cb of listeners) await cb(event); },
    setFail(value) { fail = value; }, resolveUserUid: async id => `synthetic_${id}`,
    apis: {
      message: Object.fromEntries(['sendPrivate', 'sendGroup'].map(method => [method, async (id, elements) => { sends.push({ method, id, elements }); if (fail) throw new Error('Synthetic ambiguous send'); return { sequence: ++seq, random: seq + 1000, timestamp: 1800000000 + seq }; }])),
      contacts: { fetchGroupDetail: async id => ({ groupName: `Group ${id}` }) },
      forward: { fetch: async id => [{ messageType: 'private', userUin: 20001, nickname: 'Synthetic peer', time: 1800000000, elements: [{ type: 'text', text: id }] }] },
      extras: { translatePttToText: async () => 'Synthetic transcript' },
    },
  };
}
async function fixture(t, { offline = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'public-native-helper-test-')), bridge = fixtureBridge();
  const sessions = new Map(offline ? [] : [[accountId, { bridge }]]), starts = [], closes = [];
  const manager = { sessions, getSession: id => sessions.get(id), addSessionStartedListener: cb => starts.push(cb), addSessionClosedListener: cb => closes.push(cb) };
  const config = { token, accountId, port: 0, allowedConversations: [{ kind: 'private', id: 20001, label: 'Preserve existing metadata' }, { kind: 'group', id: 30001 }] };
  const configFile = join(dir, 'synthetic-helper.json'); writeFileSync(configFile, JSON.stringify(config), { mode: 0o600 });
  const server = await startNativeBridge({ manager, config, configFile, databaseFile: join(dir, 'synthetic.sqlite'), resolveImageUrl: async () => 'https://example.invalid/synthetic-image', log: { error() {} } });
  const base = `http://127.0.0.1:${server.server.address().port}/native/v1`, cleanup = [];
  const call = async (operation, input = {}, requestId = 'synthetic-request-0001') => {
    const response = await fetch(`${base}/call`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ operation, input, requestId }) });
    return { status: response.status, body: await response.json() };
  };
  t.after(async () => { for (const dispose of cleanup.reverse()) await dispose(); await server.close(); });
  return { dir, bridge, manager, starts, server, base, call, configFile, cleanup };
}
const message = (seq, extra = {}) => ({ kind: 'friend_message', selfUin: 10001, senderUin: 20001, senderNick: 'Synthetic peer', msgSeq: seq, msgId: 1000 + seq, time: 1800000000 + seq, elements: [{ type: 'text', text: `Synthetic message ${seq}` }], ...extra });

test('native helper authenticates loopback RPC, rejects browser origins and does not expose OneBot actions', async t => {
  const f = await fixture(t);
  assert.equal((await fetch(`${f.base}/status`)).status, 401);
  assert.equal((await fetch(`${f.base}/status`, { headers: { authorization: `Bearer ${token}`, origin: 'http://localhost' } })).status, 401);
  const status = await fetch(`${f.base}/status`, { headers: { authorization: `Bearer ${token}` } }).then(response => response.json());
  assert.equal(status.protocol, 'snowluma-native/v1'); assert.equal(status.connected, true); assert.ok(status.capabilities.includes('subscription.add'));
  assert.equal((await f.call('send_private_msg', { user_id: 20001 })).body.error.code, 'UNSUPPORTED_OPERATION');
});
test('subscription.add merges persistently, is idempotent and never removes another consumer roster', async t => {
  const f = await fixture(t), initial = await f.call('subscription.read');
  assert.deepEqual(initial.body.result.conversations, [{ kind: 'private', id: 20001 }, { kind: 'group', id: 30001 }]);
  await Promise.all([f.call('subscription.add', { conversations: [{ kind: 'private', id: Number(owner) }] }), f.call('subscription.add', { conversations: [{ kind: 'group', id: 30002 }] })]);
  const again = await f.call('subscription.add', { conversations: [{ kind: 'private', id: Number(owner) }, { kind: 'private', id: Number(owner) }] });
  assert.equal(again.body.result.count, 4);
  assert.deepEqual(sortedConversations(again.body.result.conversations), sortedConversations([{ kind: 'private', id: 20001 }, { kind: 'group', id: 30001 }, { kind: 'private', id: Number(owner) }, { kind: 'group', id: 30002 }]));
  const saved = JSON.parse(readFileSync(f.configFile, 'utf8'));
  assert.equal(saved.allowedConversations[0].label, 'Preserve existing metadata'); assert.equal(saved.allowedConversations.length, 2); assert.equal(saved.additionalConversations.length, 2);
  assert.equal((await f.call('subscription.add', { conversations: [{ kind: 'private', id: '12345678' }] })).body.error.code, 'INVALID_SUBSCRIPTION');
  assert.equal((await f.call('subscription.add', { conversations: Array.from({ length: 1001 }, (_, id) => ({ kind: 'private', id: id + 1 })) })).body.error.code, 'INVALID_SUBSCRIPTION');
  assert.equal((await f.call('subscription.read')).body.result.count, 4);
  await f.call('subscription.remove', { conversations: [{ kind: 'private', id: 20001 }, { kind: 'group', id: 30002 }] });
  const afterRemove = (await f.call('subscription.read')).body.result;
  assert.equal(afterRemove.count, 3); assert.ok(afterRemove.baseConversations.some(entry => entry.id === 20001));
  assert.deepEqual(afterRemove.additionalConversations, [{ kind: 'private', id: Number(owner) }]);
});
test('read/add remain available while the account is offline and replace remains an explicit legacy operation', async t => {
  const f = await fixture(t, { offline: true });
  assert.equal((await f.call('subscription.add', { conversations: [{ kind: 'private', id: Number(owner) }] })).body.result.count, 3);
  assert.equal((await f.call('identity.read')).body.error.code, 'ACCOUNT_OFFLINE');
  const replaced = await f.call('subscription.replace', { conversations: [{ kind: 'private', id: Number(owner) }] });
  assert.equal(replaced.body.result.count, 1); assert.equal((await f.call('subscription.read')).body.result.count, 1);
});
test('native message identities, scoped quotes and unknown sends preserve exactly-once attempt semantics', async t => {
  const f = await fixture(t), incoming = message(1); await f.bridge.emit(incoming); await f.bridge.emit(incoming);
  const read = await f.call('message.read', { messageId: messageKey(incoming) }); assert.equal(read.body.result.nativeId, messageKey(incoming));
  assert.ok(Number.isSafeInteger(messageKey(incoming)) && messageKey(incoming) > 0x100000000);
  const input = { conversation: { kind: 'private', id: 20001 }, elements: [{ type: 'text', text: 'Synthetic reply' }], replyTo: messageKey(incoming) };
  const first = await f.call('message.send', input, 'synthetic-send-once'); const repeated = await f.call('message.send', input, 'synthetic-send-once');
  assert.deepEqual(first, repeated); assert.equal(f.bridge.sends.length, 1); assert.equal(f.bridge.sends[0].elements[0].replySeq, 1);
  assert.equal((await f.call('message.send', { ...input, conversation: { kind: 'group', id: 30001 } }, 'synthetic-wrong-quote')).body.error.code, 'QUOTE_TARGET_MISMATCH');
  f.bridge.setFail(true);
  const unknown = { ...input, replyTo: undefined };
  assert.equal((await f.call('message.send', unknown, 'synthetic-unknown-send')).body.error.code, 'SEND_OUTCOME_UNKNOWN');
  assert.equal((await f.call('message.send', unknown, 'synthetic-unknown-send')).body.error.code, 'SEND_OUTCOME_UNKNOWN'); assert.equal(f.bridge.sends.length, 2);
  assert.equal((await f.call('message.send', { ...unknown, conversation: { kind: 'private', id: 99999 } }, 'synthetic-denied-send')).status, 403);
});
test('real helper plus real raw listener adds only the owner and accepts only the original private switch', async t => {
  const f = await fixture(t), events = []; let now = Math.floor(Date.now() / 1000) * 1000 + 2000;
  const host = { store: {
    latestCursor: () => events.length, get: cursor => events.find(event => event.cursor === cursor),
    range: query => events.filter(event => (!query.source || event.source === query.source) && event.cursor >= (query.fromCursor ?? 1) && event.cursor <= (query.toCursor ?? Infinity)),
    grep: query => events.filter(event => (!query.source || event.source === query.source) && event.text.includes(query.keyword)).map(event => ({ hitCursor: event.cursor, events: [event] })),
  }, pushEvent: async event => { const saved = { ...event, cursor: events.length + 1 }; events.push(saved); return saved; } };
  const gate = new ReportingGate({ stateFile: join(f.dir, 'gate.sqlite'), operatorId: owner, clock: () => now }); gate.syncCommands(host.store);
  const channel = new CommandListener({ transport: 'snowluma-native', endpoint: f.base, accountId, operatorId: owner, token: () => token,
    cursorFile: join(f.dir, 'channel.json'), host, clock: () => now, isEnabled: () => gate.enabled(), onCommand: () => gate.syncCommands(host.store) });
  f.cleanup.push(() => gate.close(), () => channel.stop()); channel.start(); await until(() => channel.status().status === 'ready');
  now += 1000; // The listener arms at the next second so pre-start, second-grain replay cannot toggle.
  const subscribed = (await f.call('subscription.read')).body.result.conversations;
  assert.deepEqual(subscribed, [{ kind: 'private', id: 20001 }, { kind: 'group', id: 30001 }, { kind: 'private', id: Number(owner) }]);
  await f.bridge.emit(message(1, { time: now / 1000, elements: [{ type: 'text', text: '#@' }] })); await pause(30); assert.equal(gate.enabled(), false); assert.equal(events.length, 0);
  const ownerMessage = message(2, { senderUin: Number(owner), time: now / 1000, elements: [{ type: 'text', text: '#' }, { type: 'text', text: '@ remote work' }] });
  await f.bridge.emit(ownerMessage); await until(() => gate.enabled()); assert.equal(gate.snapshot().epoch, 1);
  await f.bridge.emit(ownerMessage); await pause(30); assert.equal(gate.snapshot().epoch, 1);
  await f.bridge.emit(message(3, { kind: 'group_message', groupId: 30001, senderUin: Number(owner), time: now / 1000, elements: [{ type: 'text', text: '#@' }] }));
  await f.bridge.emit(message(4, { senderUin: Number(owner), time: now / 1000, elements: [{ type: 'reply' }, { type: 'text', text: '#@' }] })); await pause(30); assert.equal(gate.enabled(), true);
  await f.call('subscription.replace', { conversations: [{ kind: 'group', id: 30001 }] });
  const retained = (await f.call('subscription.read')).body.result;
  assert.deepEqual(retained.baseConversations, [{ kind: 'group', id: 30001 }]); assert.deepEqual(retained.additionalConversations, [{ kind: 'private', id: Number(owner) }]);
  await f.bridge.emit(message(5, { senderUin: Number(owner), time: now / 1000, elements: [{ type: 'text', text: '#@' }] })); await until(() => !gate.enabled());
  assert.equal(gate.snapshot().epoch, 2); assert.equal(f.bridge.sends.length, 0);
  assert.deepEqual((await f.call('subscription.read')).body.result.conversations, [{ kind: 'group', id: 30001 }, { kind: 'private', id: Number(owner) }]);
});
