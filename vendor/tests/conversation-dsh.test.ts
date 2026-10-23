import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DshConversationAdapter, type DshContext } from '../conversation-control/src/dsh.ts';
import { RouteError, type Action, type ActionReceipt } from '../conversation-control/src/contract.ts';

const base = join(fixtureScratch, 'conversation-dsh-tests');
mkdirSync(base, { recursive: true });
interface NativeEvent { seq: number; time: number; type: string; data: Record<string, any> }
interface NativeMessage { id: string; source: { kind: string; rpcId?: string }; content?: { type: string; text: string }[] }
function fixture(options: { cold?: boolean; loop?: boolean; nativeFailure?: boolean } = {}) {
  const cwd = mkdtempSync(join(base, 'native-')), id = 'existing-browser-session';
  let now = 100000, attached = !options.cold;
  const events: NativeEvent[] = [], nextTurn: NativeMessage[] = [], nextStep: NativeMessage[] = [], calls: string[] = [];
  const listeners = new Map<string, ((...args: any[]) => unknown)[]>();
  const guards: ((execution: any) => string | undefined)[] = [];
  const append = (type: string, data: Record<string, any>): void => { events.push({ seq: events.length, time: now++, type, data }); };
  const tools = { guard(fn: (execution: any) => string | undefined) { guards.push(fn); return () => { guards.splice(guards.indexOf(fn), 1); }; } };
  const agent = { id, status: 'idle', options: { provider: 'original-provider', model: 'original-model' }, permission: 'ask-original',
    session: { header: { id, cwd, createdAt: now, agentPreset: 'original-preset' }, snapshotEvents: () => events },
    inbox: { nextTurn, nextStep }, ctx: { get: (name: string) => name === 'tools' ? tools : undefined,
      on(name: string, callback: (...args: any[]) => unknown, opts?: Record<string, unknown>) {
        const list = listeners.get(name) ?? []; opts?.prepend ? list.unshift(callback) : list.push(callback); listeners.set(name, list);
        return () => { list.splice(list.indexOf(callback), 1); };
      } } };
  append('session/title', { title: '真实浏览器项目标题', source: { kind: 'user' } });
  const controller = {
    async resolveAgent(target: string) {
      assert.equal(this, controller); assert.equal(target, id); calls.push('resolve');
      if (!attached) { attached = true; append('session/end-seed', {}); }
      return { agent };
    },
    async prompt(request: any) {
      assert.equal(this, controller); calls.push('prompt');
      assert.deepEqual(Object.keys(request).sort(), ['content', 'mode', 'requestId', 'sessionId']);
      assert.equal(request.sessionId, id); assert.equal(request.mode, 'queue');
      if (options.nativeFailure) throw new Error('transport failed after uncertain native admission');
      const message = { id: 'rpc-message', source: { kind: 'user', rpcId: request.requestId }, content: request.content };
      append('agent/inbox/spliced', { target: 'next-turn', start: nextTurn.length, inserted: [message] }); nextTurn.push(message);
      return { accepted: true as const };
    },
    cancel(request: any) { assert.equal(this, controller); assert.equal(request.sessionId, id); calls.push('cancel'); },
  };
  const query = {
    async listSessions() { calls.push('list'); return [{ header: agent.session.header }]; },
    async observeSession(target: string) { assert.equal(target, id); calls.push('observe'); return { header: agent.session.header, events: [...events], [Symbol.dispose]() { calls.push('release'); } }; },
  };
  const metadata = { cachedSnapshot: () => ({ values: { title: events.filter(event => event.type === 'session/title').at(-1)?.data.title, sessionListMetadata: { lastPromptAt: now } } }) };
  const services: Record<string, unknown> = { sessionController: controller, sessionQuery: query, sessionProjectionCache: metadata, sessionProjections: metadata, tools, agents: { get: (target: string) => attached && target === id ? agent : undefined }, ...(options.loop === false ? {} : { agentLoop: { create() { throw new Error('must not create or bare-resume'); } } }) };
  const ctx: DshContext = new Proxy({ get: (name: string) => services[name] }, { get(target, key, receiver) { if (!(key in target)) throw new Error('Native service properties require injection.'); return Reflect.get(target, key, receiver); } });
  const adapter = new DshConversationAdapter(ctx, { roots: [cwd], now: () => now });
  const command = async (action: Action, operationId = `op-${action}`): Promise<ActionReceipt> => adapter.execute({ operationId, framework: 'dsh', targetId: id, action, prompt: action === 'send' ? '一条消息' : undefined, expectedRevision: (await adapter.get(id)).revision });
  const waterfall = async (name: string, payload: any, terminal: () => Promise<any>): Promise<any> => {
    const list = listeners.get(name) ?? [];
    const run = async (offset: number): Promise<any> => offset < list.length ? list[offset](payload, () => run(offset + 1)) : terminal();
    return run(0);
  };
  const start = (turn = 1): void => { agent.status = 'running'; append('turn/start', { turn }); };
  const step = async (turn: number, number: number): Promise<'enter' | 'reject'> => {
    const steering = nextStep.splice(0), queued = number === 1 ? nextTurn.splice(0, 1) : [];
    if (steering.length) append('agent/inbox/spliced', { target: 'next-step', start: 0, removedCount: steering.length, inserted: [] });
    if (queued.length) append('agent/inbox/spliced', { target: 'next-turn', start: 0, removedCount: queued.length, inserted: [] });
    const messages = [...steering, ...queued];
    const decision = await waterfall('agent/pre-step', { agent, turn, step: number, messages }, async () => ({ kind: 'enter', messages }));
    if (decision.kind === 'reject') return 'reject';
    append('step/start', { turn, step: number });
    await waterfall('agent/request', { agent, turn, step: number }, async () => ({ provider: agent.options.provider, model: agent.options.model }));
    for (const message of decision.messages) append('user/message', message);
    return 'enter';
  };
  return { adapter, agent, controller, services, events, calls, nextTurn, nextStep, append, command, waterfall, start, step, guards, ctx, cwd, id, advance: (milliseconds: number) => { now += milliseconds; }, now: () => now };
}
const hasCode = (code: string) => (error: unknown): boolean => error instanceof RouteError && error.code === code;

test('list/get read genuine native title, activity, status and revision without inventing a summary or activating a cold agent', async () => {
  const f = fixture({ cold: true });
  const before = await f.adapter.get(f.id), list = await f.adapter.list({ query: '真实浏览器', limit: 10 });
  assert.equal(before.title, '真实浏览器项目标题'); assert.equal(before.summary, ''); assert.equal(before.workspace, f.cwd);
  assert.equal(before.lastActivityAt, new Date(f.events[0].time).toISOString());
  assert.equal(before.status, 'idle'); assert.equal(list.length, 1); assert.equal(list[0].id, f.id);
  assert.ok(before.capabilities.includes('continue')); assert.ok(!f.calls.includes('resolve')); assert.ok(!f.calls.includes('prompt'));
  f.append('session/title', { title: '人工更改的标题' }); assert.notEqual((await f.adapter.get(f.id)).revision, before.revision);
});

test('one public prompt preserves native model, permission, preset and workspace; public controller resolves a cold session', async () => {
  const f = fixture({ cold: true }), original = structuredClone({ options: f.agent.options, permission: f.agent.permission, header: f.agent.session.header });
  const receipt = await f.command('continue');
  assert.equal(receipt.status, 'accepted'); assert.equal(receipt.requestId, 'conversation:op-continue'); assert.equal(receipt.action, 'continue'); assert.ok(receipt.deadlineAt);
  assert.deepEqual(f.calls.filter(call => ['resolve', 'prompt'].includes(call)), ['resolve', 'prompt']);
  assert.deepEqual({ options: f.agent.options, permission: f.agent.permission, header: f.agent.session.header }, original);
  await f.adapter.observe(receipt); assert.equal(f.calls.filter(call => call === 'prompt').length, 1);
});

test('busy or queued native sessions refuse a command before public prompt and never mutate pending humans', async () => {
  const busy = fixture(); busy.start(); await assert.rejects(busy.command('send'), hasCode('BUSY')); assert.ok(!busy.calls.includes('prompt'));
  const queued = fixture(); queued.nextTurn.push({ id: 'human', source: { kind: 'user' } });
  await assert.rejects(queued.command('continue'), hasCode('PENDING_INPUT')); assert.equal(queued.nextTurn[0].id, 'human'); assert.ok(!queued.calls.includes('prompt'));
});

test('pause refuses every pending human/foreign queue occurrence and synchronously checks then cancels the running turn', async () => {
  const queued = fixture(); queued.start(); queued.nextStep.push({ id: 'foreign', source: { kind: 'user', rpcId: 'browser-human' } });
  await assert.rejects(queued.command('pause'), hasCode('PENDING_INPUT')); assert.ok(!queued.calls.includes('cancel'));
  const f = fixture(); f.start(7); const receipt = await f.command('pause');
  assert.equal(receipt.turnId, '7'); assert.equal(receipt.status, 'accepted'); assert.equal(f.calls.filter(call => call === 'cancel').length, 1);
  f.append('turn/end', { turn: 7, reason: { kind: 'aborted', reason: { kind: 'user' } } }); f.agent.status = 'idle';
  f.append('turn/start', { turn: 8 }); f.agent.status = 'running';
  assert.equal((await f.adapter.observe(receipt)).status, 'paused');
});

test('revision, project roots and absent loop budget capability fail closed before prompt', async () => {
  const f = fixture(), revision = (await f.adapter.get(f.id)).revision; f.append('session/title', { title: 'Changed after confirmation' });
  await assert.rejects(f.adapter.execute({ operationId: 'changed', framework: 'dsh', targetId: f.id, action: 'continue', expectedRevision: revision }), hasCode('REVISION_CHANGED'));
  const unavailable = fixture({ loop: false }); assert.deepEqual((await unavailable.adapter.get(unavailable.id)).capabilities, ['pause']);
  await assert.rejects(unavailable.command('continue'), hasCode('CAPABILITY_UNAVAILABLE'));
  const denied = new DshConversationAdapter(f.ctx, { roots: [join(f.cwd, 'another-project')] }); await assert.rejects(denied.get(f.id), hasCode('WORKSPACE_DENIED'));
  assert.ok(!f.calls.includes('prompt')); assert.ok(!unavailable.calls.includes('prompt'));
});

test('observe uses exact RPC turn, returns its actual result and cannot repost or resume', async () => {
  const f = fixture(), receipt = await f.command('send');
  f.start(4); await f.step(4, 1); f.append('assistant/message', { turn: 4, step: 1, message: { content: [{ type: 'text', text: '这次原生回合的实际结果' }] } });
  f.append('turn/end', { turn: 4, reason: { kind: 'completed' } }); f.agent.status = 'idle';
  f.start(5); f.append('user/message', { source: { kind: 'user', rpcId: 'different-browser-rpc' } }); f.append('assistant/message', { turn: 5, message: { content: [{ type: 'text', text: '不得混入' }] } });
  const calls = f.calls.filter(call => ['resolve', 'prompt'].includes(call));
  const observed = await f.adapter.observe(receipt); assert.equal(observed.status, 'completed'); assert.equal(observed.turnId, '4'); assert.equal(observed.answer, '这次原生回合的实际结果');
  assert.deepEqual(f.calls.filter(call => ['resolve', 'prompt'].includes(call)), calls);
});

test('owned RPC stops at native step/request budgets while later manual turns remain unchanged', async () => {
  const f = fixture();
  const adapter = new DshConversationAdapter(f.ctx, { roots: [f.cwd], now: f.now, budget: { maxSteps: 2, maxRequests: 3 } });
  const receipt = await adapter.execute({ operationId: 'bounded', framework: 'dsh', targetId: f.id, action: 'continue', expectedRevision: (await adapter.get(f.id)).revision });
  f.start(1); assert.equal(await f.step(1, 1), 'enter'); assert.equal(await f.step(1, 2), 'enter'); assert.equal(await f.step(1, 3), 'reject');
  f.append('turn/end', { turn: 1, reason: { kind: 'blocked' } }); f.agent.status = 'idle';
  const result = await adapter.observe(receipt); assert.equal(result.status, 'blocked'); assert.equal(result.errorCode, 'BUDGET_EXCEEDED');
  f.start(2); assert.equal(await f.step(2, 1), 'enter'); assert.equal(await f.step(2, 2), 'enter'); assert.equal(await f.step(2, 3), 'enter');
});

test('retry request budget suppresses native always retry and duration blocks new calls only on its RPC turn', async () => {
  const f = fixture(), adapter = new DshConversationAdapter(f.ctx, { roots: [f.cwd], now: f.now, budget: { maxRequests: 3, maxDurationMs: 1000 } });
  await adapter.execute({ operationId: 'retry-bounded', framework: 'dsh', targetId: f.id, action: 'send', prompt: 'fixture', expectedRevision: (await adapter.get(f.id)).revision });
  f.start(); await f.step(1, 1);
  const proposal = { agent: f.agent, turn: 1, step: 1 };
  assert.deepEqual(await f.waterfall('agent/request-error', proposal, async () => ({ kind: 'retry' })), { kind: 'retry' });
  await f.waterfall('agent/request', proposal, async () => ({})); await f.waterfall('agent/request', proposal, async () => ({}));
  assert.equal(await f.waterfall('agent/request-error', proposal, async () => ({ kind: 'retry' })), undefined);
  await assert.rejects(f.waterfall('agent/request', proposal, async () => ({})), hasCode('BUDGET_EXCEEDED'));
  const manual = { ...proposal, turn: 2 }; f.advance(2000);
  assert.deepEqual(await f.waterfall('agent/request', manual, async () => ({ model: 'unchanged' })), { model: 'unchanged' });
});

test('check tool guard denies mutation/shell/unknown tools without allowing or changing native approval; manual turn is not restricted', async () => {
  const f = fixture(); await f.command('check'); f.start(); await f.step(1, 1);
  assert.equal(f.agent.permission, 'ask-original'); assert.equal(f.guards.length, 1);
  assert.equal(f.guards[0]({ agent: f.agent, name: 'read', arguments: { file_path: 'note.txt' } }), undefined);
  for (const name of ['write', 'edit', 'bash', 'run_code', 'unknown']) assert.match(f.guards[0]({ agent: f.agent, name })!, /blocked/);
  f.append('turn/end', { turn: 1, reason: { kind: 'completed' } }); f.start(2);
  assert.equal(f.guards[0]({ agent: f.agent, name: 'write' }), undefined);
});

test('native uncertainty is not retried; missing exact RPC evidence stays unknown', async () => {
  const f = fixture({ nativeFailure: true }); await assert.rejects(f.command('send'), /transport failed/);
  assert.equal(f.calls.filter(call => call === 'prompt').length, 1);
  const receipt: ActionReceipt = { operationId: 'op-send', framework: 'dsh', targetId: f.id, action: 'send', requestId: 'conversation:op-send', status: 'unknown', at: new Date().toISOString() };
  assert.equal((await f.adapter.observe(receipt)).status, 'unknown'); assert.equal(f.calls.filter(call => call === 'prompt').length, 1);
});

test('a mixed first claim withdraws this RPC, preserves human input and applies neither RPC budget nor read-only guard to the human turn', async () => {
  const f = fixture(), adapter = new DshConversationAdapter(f.ctx, { roots: [f.cwd], now: f.now, budget: { maxSteps: 1, maxRequests: 1 } });
  const receipt = await adapter.execute({ operationId: 'mixed', framework: 'dsh', targetId: f.id, action: 'check', expectedRevision: (await adapter.get(f.id)).revision });
  const human = { id: 'manual-steering', source: { kind: 'user', rpcId: 'browser-manual' }, content: [{ type: 'text', text: '人工消息' }] };
  f.nextStep.push(human); f.append('agent/inbox/spliced', { target: 'next-step', start: 0, inserted: [human] }); f.start(1);
  assert.equal(await f.step(1, 1), 'enter');
  assert.equal(f.events.filter(event => event.type === 'user/message' && event.data.source?.rpcId === receipt.requestId).length, 0);
  assert.equal(f.events.filter(event => event.type === 'user/message' && event.data.source?.rpcId === 'browser-manual').length, 1);
  assert.equal(f.guards[0]({ agent: f.agent, name: 'write' }), undefined);
  assert.equal(await f.step(1, 2), 'enter'); assert.equal(await f.step(1, 3), 'enter');
  assert.equal((await adapter.observe(receipt)).status, 'blocked'); assert.equal((await adapter.observe(receipt)).errorCode, 'FOREIGN_INPUT');
});

test('a later human steering claim exits RPC ownership without losing the human at a budget boundary', async () => {
  const f = fixture(), adapter = new DshConversationAdapter(f.ctx, { roots: [f.cwd], now: f.now, budget: { maxSteps: 1 } });
  const receipt = await adapter.execute({ operationId: 'later-human', framework: 'dsh', targetId: f.id, action: 'continue', expectedRevision: (await adapter.get(f.id)).revision });
  f.start(); await f.step(1, 1);
  const human = { id: 'human', source: { kind: 'user' }, content: [{ type: 'text', text: '人工继续' }] };
  f.nextStep.push(human); f.append('agent/inbox/spliced', { target: 'next-step', start: 0, inserted: [human] });
  assert.equal(await f.step(1, 2), 'enter'); assert.equal(await f.step(1, 3), 'enter');
  const observed = await adapter.observe(receipt); assert.equal(observed.status, 'blocked'); assert.equal(observed.errorCode, 'FOREIGN_INPUT');
  assert.ok(f.events.some(event => event.type === 'user/message' && event.data.id === 'human'));
});

test('observe restores a persisted exact RPC deadline and counts unsettled requests conservatively without resuming or submitting', async () => {
  const f = fixture(), receipt = await f.command('continue'); f.start(); await f.step(1, 1);
  f.append('assistant/attempt', { turn: 1, step: 1 }); f.append('assistant/attempt', { turn: 1, step: 1 });
  // Simulate remount: old Agent callbacks are absent; native state and gateway receipt remain.
  const freshAgent = { ...f.agent, ctx: { get: f.agent.ctx.get, on: f.agent.ctx.on } };
  f.services.agents = { get: () => freshAgent };
  const restarted = new DshConversationAdapter(f.ctx, { roots: [f.cwd], now: f.now, budget: { maxRequests: 3 } });
  const calls = f.calls.filter(call => ['resolve', 'prompt'].includes(call));
  assert.equal((await restarted.observe({ ...receipt, status: 'unknown' })).status, 'running');
  await assert.rejects(f.waterfall('agent/request', { agent: freshAgent, turn: 1, step: 1 }, async () => ({})), hasCode('BUDGET_EXCEEDED'));
  assert.deepEqual(f.calls.filter(call => ['resolve', 'prompt'].includes(call)), calls);
});

test('deadline observation safely cancels only its exact active RPC with an empty inbox; pending humans forbid cancellation', async () => {
  const f = fixture(), adapter = new DshConversationAdapter(f.ctx, { roots: [f.cwd], now: f.now, budget: { maxDurationMs: 1000 } });
  const receipt = await adapter.execute({ operationId: 'deadline', framework: 'dsh', targetId: f.id, action: 'continue', expectedRevision: (await adapter.get(f.id)).revision });
  f.start(); await f.step(1, 1); f.advance(2000); await adapter.observe(receipt);
  assert.equal(f.calls.filter(call => call === 'cancel').length, 1);
  const unsafe = fixture(), guarded = new DshConversationAdapter(unsafe.ctx, { roots: [unsafe.cwd], now: unsafe.now, budget: { maxDurationMs: 1000 } });
  const other = await guarded.execute({ operationId: 'pending-deadline', framework: 'dsh', targetId: unsafe.id, action: 'continue', expectedRevision: (await guarded.get(unsafe.id)).revision });
  unsafe.start(); await unsafe.step(1, 1); unsafe.nextTurn.push({ id: 'next-human', source: { kind: 'user' } }); unsafe.advance(2000);
  const observed = await guarded.observe(other); assert.equal(observed.status, 'running'); assert.equal(observed.errorCode, 'BUDGET_EXCEEDED');
  assert.equal(unsafe.calls.filter(call => call === 'cancel').length, 0); assert.equal(unsafe.nextTurn[0].id, 'next-human');
  await assert.rejects(unsafe.waterfall('agent/request', { agent: unsafe.agent, turn: 1, step: 1 }, async () => ({})), hasCode('BUDGET_EXCEEDED'));
});

test('native claim evidence reconciles failure before user-message commit without claiming a public canceled removal', async () => {
  const f = fixture(), receipt = await f.command('continue'); f.start();
  f.nextTurn.splice(0); f.append('agent/inbox/spliced', { target: 'next-turn', start: 0, removedCount: 1, inserted: [] });
  f.append('turn/end', { turn: 1, reason: { kind: 'error' } }); f.agent.status = 'idle';
  assert.equal((await f.adapter.observe({ ...receipt, status: 'unknown' })).status, 'failed');
  const canceled = fixture(), removed = await canceled.command('send'); canceled.start(); canceled.nextTurn.splice(0);
  canceled.append('agent/inbox/spliced', { target: 'next-turn', start: 0, removedCount: 1, inserted: [], outcome: 'canceled' });
  canceled.append('turn/end', { turn: 1, reason: { kind: 'completed' } }); canceled.agent.status = 'idle';
  assert.equal((await canceled.adapter.observe(removed)).status, 'unknown');
});

test('check enforces its exact project path through synchronous canonical metadata, including protected paths and junction escapes', async () => {
  const f = fixture(); await f.command('check'); f.start(); await f.step(1, 1);
  const guard = f.guards[0], call = (args: unknown) => guard({ agent: f.agent, name: 'read', arguments: args });
  writeFileSync(join(f.cwd, 'note.txt'), 'fixture'); assert.equal(call({ file_path: 'note.txt' }), undefined);
  assert.match(call({ file_path: '../outside.txt' })!, /outside/);
  assert.match(call({ file_path: `${fixtureProtected}/never-read.txt` })!, /protected/);
  assert.match(call({ file_path: 'note.txt', sandbox_permissions: 'require_escalated' })!, /escalation/);
  assert.match(call({ unrecognized: 'note.txt' })!, /cannot be verified/);
  const outside = mkdtempSync(join(base, 'junction-target-')); writeFileSync(join(outside, 'outside.txt'), 'fixture-only');
  symlinkSync(outside, join(f.cwd, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.match(call({ file_path: 'escape/outside.txt' })!, /outside/);
});

test('continue/send retain native approvals while known file tools refuse project escapes, protected paths and elevation flags', async () => {
  const f = fixture(); await f.command('continue'); f.start(); await f.step(1, 1);
  assert.equal(f.guards[0]({ agent: f.agent, name: 'write', arguments: { file_path: 'note.txt', content: 'local' } }), undefined);
  assert.match(f.guards[0]({ agent: f.agent, name: 'write', arguments: { file_path: '../outside.txt' } })!, /outside/);
  assert.match(f.guards[0]({ agent: f.agent, name: 'bash', arguments: { command: 'example', permission: 'elevate' } })!, /escalation/);
  assert.match(f.guards[0]({ agent: f.agent, name: 'bash', arguments: { command: `${fixtureProtected}/x` } })!, /protected/);
  assert.equal(f.agent.permission, 'ask-original');
});

test('a long native history uses constant stack; metadata listing defers deleted or corrupt log detection to exact get', async () => {
  const f = fixture();
  for (let index = 0; index < 150000; index++) f.append('diagnostic', {});
  const conversation = await f.adapter.get(f.id); assert.equal(conversation.lastActivityAt, new Date(f.events.at(-1)!.time).toISOString());
  const query = f.services.sessionQuery as { listSessions(): Promise<unknown>; observeSession(id: string): Promise<unknown> };
  const original = query.observeSession;
  query.listSessions = async () => [{ header: f.agent.session.header }, { header: { ...f.agent.session.header, id: 'deleted' } }];
  query.observeSession = async id => { if (id === 'deleted') throw Object.assign(new Error('deleted'), { code: 'SESSION_QUERY_SESSION_NOT_FOUND' }); return original(id); };
  assert.equal((await f.adapter.list({ query: '', limit: 10 })).length, 2); assert.deepEqual(f.adapter.discoveryWarnings, []);
  await assert.rejects(f.adapter.get('deleted'), { code: 'SESSION_QUERY_SESSION_NOT_FOUND' });
  query.observeSession = async id => { if (id === 'deleted') throw Object.assign(new Error('invalid schema'), { code: 'SESSION_QUERY_INVALID_LOG' }); return original(id); };
  await assert.rejects(f.adapter.get('deleted'), /invalid schema/);
});
