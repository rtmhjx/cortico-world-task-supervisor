import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { EventEnvelope, ToolCallContext, ToolOutcome, WorldHost } from 'cortico/core/types.ts';
import type { ActionReceipt, ActionRequest, Conversation, ConversationBackend } from '../conversation-control/src/contract.ts';
import { ConversationControlWorld } from '../cortico-world-conversation-control/src/world.ts';
import { conversationControlDefaults, resolveConversationControlConfig } from '../cortico-world-conversation-control/src/config.ts';

const root = join(fixtureScratch, 'conversation-world-tests'); mkdirSync(root, { recursive: true });
const operator = '12345678', secondOperator = '23456789';
function fixture() {
  const dir = mkdtempSync(join(root, 'run-')); let now = Date.parse('2026-10-07T08:00:00Z');
  const events: EventEnvelope[] = [], requests: ActionRequest[] = [];
  const receipts = new Map<string, ActionReceipt>();
  const conversations: Conversation[] = Array.from({ length: 7 }, (_, i) => ({ framework: i % 2 ? 'codex' : 'dsh', id: randomUUID(), title: `任务 ${i + 1}`,
    workspace: join(dir, 'project'), summary: `记忆项目 ${i + 1}`, lastActivityAt: new Date(now).toISOString(), status: 'idle', revision: `revision-${i}`,
    capabilities: ['pause', 'continue', 'check', 'send'], source: 'isolated-fixture' }));
  let failExecute = false, failAfterPush = false, blockObservation = false;
  let release: (() => void) | undefined;
  const backend: ConversationBackend = {
    list: async input => conversations.filter(c => !input.frameworks || input.frameworks.includes(c.framework)),
    get: async (framework, id) => { const target = conversations.find(c => c.framework === framework && c.id === id); assert.ok(target); return target; },
    execute: async request => { requests.push(structuredClone(request)); if (failExecute) throw new Error('transport failed after submission');
      const receipt: ActionReceipt = { operationId: request.operationId, framework: request.framework, targetId: request.targetId, status: 'accepted', at: new Date(now).toISOString(), requestId: `native-${request.operationId}` };
      receipts.set(receipt.operationId, receipt); return receipt; },
    observe: async id => { if (blockObservation) await new Promise<void>(resolve => { release = resolve; }); const receipt = receipts.get(id); assert.ok(receipt); return receipt; },
  };
  const cfg = { ...conversationControlDefaults(), enabled: true, operatorIds: JSON.stringify([operator, secondOperator]), pollIntervalMs: 60000 };
  const host = { store: {
    get: (cursor: number) => events.find(e => e.cursor === cursor),
    // Match native EventStore.range: filtered cursor order, limit takes the tail.
    range: (query: { source?: string; limit?: number }) => {
      const rows=events.filter(e=>query.source===undefined||e.source===query.source);
      return query.limit===undefined?rows:rows.slice(-query.limit);
    },
    // Native EventStore.grep scans in cursor order and stops after the first limit hits.
    grep: (query: { source: string; keyword: string; limit?: number }) => events.filter(e => e.source === query.source && e.text.toLowerCase().includes(query.keyword.toLowerCase()))
      .slice(0, query.limit).map(e => ({ hitCursor: e.cursor, events: [e] })),
  }, pushEvent: async (event: Omit<EventEnvelope, 'cursor'>) => { const saved = { ...event, cursor: events.length + 1 }; events.push(saved);
    if (failAfterPush) { failAfterPush = false; throw new Error('event saved; return transport interrupted'); } return saved; } } as unknown as WorldHost;
  const world = () => new ConversationControlWorld({ cfg, dataDir: dir, secret: async () => undefined, backend, clock: () => now });
  const human = (text: string, userId = operator, conversation: { kind: string; id: string } = { kind: 'private', id: userId }) => {
    const messageId = 1000 + events.length + 1;
    const event: EventEnvelope = { cursor: events.length + 1, type: 'qq.message', source: 'qq', origin: 'external', ts: new Date(now).toISOString(), text: `#${messageId} ${text}`, senderKey: userId, meta: { user_id: userId, conv: conversation, message_id: messageId } };
    events.push(event); return event.cursor;
  };
  const call = async (w: ConversationControlWorld, name: string, args: Record<string, unknown>, context: ToolCallContext = {} as ToolCallContext) =>
    w.tools().find(tool => tool.name === `conversationcontrol_${name}`)!.handler(args, context);
  const success = async (w: ConversationControlWorld, name: string, args: Record<string, unknown>) => {
    const result = await call(w, name, args); assert.equal(typeof result, 'string', JSON.stringify(result)); return JSON.parse(result as string);
  };
  const prepare = async (w: ConversationControlWorld) => {
    const originEventCursor = human('在记忆模块那个会话检查项目现状');
    const set = await success(w, 'find', { originEventCursor, query: '记忆' });
    await success(w, 'select', { originEventCursor, candidateSetId: set.id, index: 1 });
    const draft = await success(w, 'draft', { originEventCursor, action: 'check' });
    return { originEventCursor, set, draft };
  };
  return { dir, cfg, events, conversations, requests, receipts, world, host, human, call, success, prepare,
    advance: (ms: number) => { now += ms; }, executeFails: () => { failExecute = true; }, pushFailsAfterSave: () => { failAfterPush = true; },
    blockObservation: () => { blockObservation = true; }, releaseObservation: () => { blockObservation = false; release?.(); }, observationBlocked: () => !!release };
}

test('a raw command mirror cannot authorize controls or make its canonical QQ message ambiguous', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host);
  try {
    const cursor = f.human('查询项目'), canonical = f.events.find(event => event.cursor === cursor)!;
    const mirror: EventEnvelope = { ...canonical, cursor: f.events.length + 1, text: `#${canonical.meta!.message_id} #@`, meta: { ...canonical.meta, taskSupervisorRawCommand: { adapter: 'fixture', version: 1 } } };
    f.events.push(mirror);
    assert.equal((await f.success(w, 'find', { originMessageId: canonical.meta!.message_id, query: '' })).candidates.length, 5);
    const rejected = await f.call(w, 'find', { originEventCursor: mirror.cursor, query: '' }) as ToolOutcome;
    assert.equal(rejected.failed, true); assert.match(rejected.text, /ORIGIN_NOT_FOUND/);
    assert.equal(f.requests.length, 0);
  } finally { await w.stop(); }
});

test('candidate selection is retained across human events without executing a task', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host);
  try {
    const cursor = f.human('记忆模块的会话有哪些');
    const set = await f.success(w, 'find', { originEventCursor: cursor, query: '记忆' }); assert.equal(set.candidates.length, 5);
    const recent = await f.success(w, 'find', { originEventCursor: cursor, query: '' }); assert.equal(recent.candidates.length, 5);
    const next = f.human('第三个'); const selected = await f.success(w, 'select', { originEventCursor: next, candidateSetId: set.id, index: 3 });
    assert.equal(selected.target.id, f.conversations[2].id);
    const read = await f.success(w, 'selected', { originEventCursor: f.human('刚才那个') }); assert.equal(read.target.id, selected.target.id); assert.equal(f.requests.length, 0);
  } finally { await w.stop(); }
});

test('tools reject fabricated identity, nonhuman events, stale origins and another operator selection', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host);
  try {
    const { set, originEventCursor } = await f.prepare(w);
    const fabricated = await f.call(w, 'selected', { originEventCursor, userId: operator }) as ToolOutcome; assert.equal(fabricated.failed, true); assert.match(fabricated.text, /INVALID_ARGUMENT/);
    const other = await f.call(w, 'select', { originEventCursor: f.human('第三个', secondOperator), candidateSetId: set.id, index: 3 }) as ToolOutcome;
    assert.equal(other.failed, true); assert.match(other.text, /CANDIDATES_EXPIRED/);
    const fake = f.human('确认执行'); f.events.find(e => e.cursor === fake)!.source = 'codexbridge';
    const untrusted = await f.call(w, 'selected', { originEventCursor: fake }) as ToolOutcome; assert.match(untrusted.text, /UNTRUSTED_ORIGIN/);
    f.advance(f.cfg.eventTtlMs + 1); const expired = await f.call(w, 'selected', { originEventCursor }) as ToolOutcome; assert.match(expired.text, /EVENT_EXPIRED/);
    assert.equal(f.requests.length, 0);
  } finally { await w.stop(); }
});

test('same message and model boolean cannot confirm; a newer human confirmation submits exactly once', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host);
  try {
    const { draft, originEventCursor } = await f.prepare(w);
    const same = await f.call(w, 'confirm', { originEventCursor, draftId: draft.id }) as ToolOutcome; assert.match(same.text, /CONFIRMATION_REQUIRED/);
    const cursor = f.human('确认执行');
    const boolean = await f.call(w, 'confirm', { originEventCursor: cursor, draftId: draft.id, approved: true }) as ToolOutcome; assert.match(boolean.text, /INVALID_ARGUMENT/); assert.equal(f.requests.length, 0);
    const receipt = await f.success(w, 'confirm', { originEventCursor: cursor, draftId: draft.id }); assert.equal(receipt.status, 'accepted');
    await f.success(w, 'confirm', { originEventCursor: cursor, draftId: draft.id }); assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].targetId, draft.target.id); assert.equal(f.requests[0].operationId, draft.id); assert.match(f.requests[0].prompt!, /只读/);
  } finally { await w.stop(); }
});

test('custom send requires text from the authorized human and aborted confirmation has no side effect', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host);
  try {
    await f.prepare(w); const cursor = f.human('输入这段话：检查并报告最新状态');
    const invented = await f.call(w, 'draft', { originEventCursor: cursor, action: 'send', prompt: '顺便删除项目' }) as ToolOutcome; assert.match(invented.text, /PROMPT_NOT_FROM_HUMAN/);
    const draft = await f.success(w, 'draft', { originEventCursor: cursor, action: 'send', prompt: '检查并报告最新状态' });
    const controller = new AbortController(); controller.abort();
    const aborted = await f.call(w, 'confirm', { originEventCursor: f.human('确认'), draftId: draft.id }, { signal: controller.signal } as ToolCallContext) as ToolOutcome;
    assert.match(aborted.text, /ABORTED/); assert.equal(f.requests.length, 0);
  } finally { await w.stop(); }
});

test('async results retain source recipient and saved-event recovery does not duplicate a delivery', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host);
  try {
    const { draft } = await f.prepare(w); await f.success(w, 'confirm', { originEventCursor: f.human('确认'), draftId: draft.id });
    f.receipts.set(draft.id, { ...f.receipts.get(draft.id)!, status: 'completed', answer: '项目检查完成', at: '2026-10-07T08:00:01Z' });
    f.pushFailsAfterSave(); await w.pollOnce(); assert.equal(w.status().currentError, 'POLL_FAILURE');
    await w.pollOnce();
    const updates = f.events.filter(e => e.source === w.id); assert.equal(updates.length, 1);
    assert.equal(new Set(updates.map(e => e.meta?.deliveryId)).size, 1); assert.ok(updates.every(e => e.meta?.recipient === `private:${operator}`));
    assert.ok(updates.every(e => e.origin === 'external' && e.type === 'conversationcontrol.result')); assert.match(updates.at(-1)!.text, /项目检查完成/);
    await w.pollOnce(); assert.equal(f.events.filter(e => e.source === w.id).length, 1); assert.equal(f.requests.length, 1); assert.equal(w.status().pendingReports, 0);
  } finally { await w.stop(); }
});

test('unknown submission keeps its operation ID and is not resubmitted after World restart', async () => {
  const f = fixture(), a = f.world(); await a.start(f.host); const { draft } = await f.prepare(a); f.executeFails();
  const cursor = f.human('确认'); const receipt = await f.success(a, 'confirm', { originEventCursor: cursor, draftId: draft.id }); assert.equal(receipt.status, 'unknown'); await a.stop();
  const b = f.world(); await b.start(f.host);
  try {
    await b.pollOnce(); const status = await f.success(b, 'status', { originEventCursor: f.human('查询'), operationId: draft.id }); assert.equal(status.status, 'unknown'); assert.equal(f.requests.length, 1);
    assert.equal(f.events.filter(e => e.type === 'conversationcontrol.result').length, 1);
    const wrong = await f.call(b, 'status', { originEventCursor: f.human('查询', secondOperator), operationId: draft.id }) as ToolOutcome; assert.match(wrong.text, /OPERATION_NOT_FOUND/);
  } finally { await b.stop(); }
});

test('public tool and outbox text redact credential-shaped values before JSON encoding', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host);
  try {
    const { draft } = await f.prepare(w); await f.success(w, 'confirm', { originEventCursor: f.human('确认'), draftId: draft.id });
    const answer = '{"api_key":"isolated-private-example"}\ntoken=isolated-token-example';
    f.receipts.set(draft.id, { ...f.receipts.get(draft.id)!, status: 'completed', answer }); await w.pollOnce();
    const status = await f.success(w, 'status', { originEventCursor: f.human('查询'), operationId: draft.id });
    assert.doesNotMatch(status.answer, /isolated-private-example|isolated-token-example/); assert.match(status.answer, /REDACTED/);
    for (const event of f.events.filter(e => e.source === w.id)) assert.doesNotMatch(event.text, /isolated-private-example|isolated-token-example/);
  } finally { await w.stop(); }
});

test('stop waits for an in-flight observation and releases the state owner', async () => {
  const f = fixture(), w = f.world(); await w.start(f.host); const { draft } = await f.prepare(w);
  await f.success(w, 'confirm', { originEventCursor: f.human('确认'), draftId: draft.id }); f.blockObservation(); const poll = w.pollOnce();
  for (let i = 0; i < 30 && !f.observationBlocked(); i++) await new Promise(resolve => setImmediate(resolve)); assert.equal(f.observationBlocked(), true);
  let stopped = false; const stopping = w.stop().then(() => { stopped = true; }); await new Promise(resolve => setImmediate(resolve)); assert.equal(stopped, false);
  f.releaseObservation(); await poll; await stopping; assert.equal(stopped, true);
  const next = f.world(); await next.start(f.host); await next.stop(); assert.equal(f.requests.length, 1);
});

test('World config is disabled by default and rejects remote gateway or nonnumeric operator IDs', () => {
  const cfg = conversationControlDefaults(); assert.equal(cfg.enabled, false);
  assert.throws(() => resolveConversationControlConfig({ ...cfg, endpoint: 'http://example.test:3092' }), /loopback/);
  assert.throws(() => resolveConversationControlConfig({ ...cfg, operatorIds: '["nickname"]' }), /QQ number/);
  assert.throws(() => resolveConversationControlConfig({ ...cfg, stateDir: 'relative' }), /state directory/);
});

test('visible QQ message ID resolves its persisted cursor; fresh confirmation executes once and consumes that cursor', async()=>{
  const f=fixture(),w=f.world();await w.start(f.host);
  try{
    const cursor=f.human('在记忆模块会话检查项目现状'),originMessageId=f.events.find(e=>e.cursor===cursor)!.meta!.message_id;
    const visibleLine=`#${originMessageId} 在记忆模块会话检查项目现状`;assert.equal(Number(/^#(-?\d+)/.exec(visibleLine)![1]),originMessageId);assert.notEqual(cursor,originMessageId);
    const set=await f.success(w,'find',{originMessageId,query:'记忆'});await f.success(w,'select',{originMessageId,candidateSetId:set.id,index:1});
    const draft=await f.success(w,'draft',{originMessageId,action:'check'});
    const reused=await f.call(w,'confirm',{originMessageId,draftId:draft.id}) as ToolOutcome;assert.match(reused.text,/CONFIRMATION_REQUIRED/);
    const confirmed=f.human('确认执行'),confirmMessageId=f.events.find(e=>e.cursor===confirmed)!.meta!.message_id;
    const receipt=await f.success(w,'confirm',{originMessageId:confirmMessageId,draftId:draft.id});await f.success(w,'confirm',{originMessageId:confirmMessageId,draftId:draft.id});assert.equal(f.requests.length,1);assert.equal(receipt.operationId,draft.id);
    f.receipts.set(draft.id,{...f.receipts.get(draft.id)!,status:'completed'});await w.pollOnce();
    const second=await f.success(w,'draft',{originMessageId,action:'check'});const consumed=await f.call(w,'confirm',{originMessageId:confirmMessageId,draftId:second.id}) as ToolOutcome;assert.match(consumed.text,/EVENT_ALREADY_USED/);assert.equal(f.requests.length,1);
    for(const tool of w.tools()){assert.ok((tool.parameters as any).properties.originMessageId);assert.equal((tool.parameters as any).properties.originEventCursor,undefined);assert.ok((tool.parameters as any).required.includes('originMessageId'));}
  }finally{await w.stop();}
});

test('message origin lookup rejects missing, zero, foreign, stale, duplicate and overloaded IDs without guessing',async()=>{
  const f=fixture(),w=f.world();await w.start(f.host);
  try{
    const cursor=f.human('查询'),id=f.events.find(e=>e.cursor===cursor)!.meta!.message_id;
    for(const args of [{},{originMessageId:0},{originMessageId:1.5},{originMessageId:Number.MAX_SAFE_INTEGER+1},{originMessageId:id,originEventCursor:cursor}])assert.match((await f.call(w,'find',{...args,query:''}) as ToolOutcome).text,/INVALID_ARGUMENT/);
    assert.match((await f.call(w,'find',{originMessageId:999999,query:''}) as ToolOutcome).text,/ORIGIN_NOT_FOUND/);
    assert.match((await f.call(w,'find',{originEventCursor:id,query:''}) as ToolOutcome).text,/ORIGIN_NOT_FOUND/); // No cursor-to-message-ID fallback.
    const negative=f.human('负数QQ消息查询'),negativeEvent=f.events.find(e=>e.cursor===negative)!;negativeEvent.meta!.message_id=-7123;negativeEvent.text='#-7123 负数QQ消息查询';assert.equal((await f.success(w,'find',{originMessageId:-7123,query:''})).candidates.length,5);
    const reference=f.human('只引用未捕获的编号 #7654321');assert.match((await f.call(w,'find',{originMessageId:7654321,query:''}) as ToolOutcome).text,/ORIGIN_NOT_FOUND/);assert.notEqual(f.events.find(e=>e.cursor===reference)!.meta!.message_id,7654321);
    const foreign=f.human('查询','87654321'),foreignId=f.events.find(e=>e.cursor===foreign)!.meta!.message_id;assert.match((await f.call(w,'find',{originMessageId:foreignId,query:''}) as ToolOutcome).text,/OPERATOR_DENIED/);
    const wrong=f.human('查询'),wrongEvent=f.events.find(e=>e.cursor===wrong)!;wrongEvent.source='codexbridge';assert.match((await f.call(w,'find',{originMessageId:wrongEvent.meta!.message_id,query:''}) as ToolOutcome).text,/ORIGIN_NOT_FOUND/);
    const nonhuman=f.human('查询'),nonhumanEvent=f.events.find(e=>e.cursor===nonhuman)!;nonhumanEvent.origin='internal';assert.match((await f.call(w,'find',{originMessageId:nonhumanEvent.meta!.message_id,query:''}) as ToolOutcome).text,/UNTRUSTED_ORIGIN/);
    f.advance(f.cfg.eventTtlMs+1);assert.match((await f.call(w,'find',{originMessageId:id,query:''}) as ToolOutcome).text,/ORIGIN_NOT_FOUND|EVENT_EXPIRED/);
    const one=f.human('查询'),oneId=f.events.find(e=>e.cursor===one)!.meta!.message_id;const duplicate=f.human('查询',secondOperator,{kind:'private',id:secondOperator}),duplicateEvent=f.events.find(e=>e.cursor===duplicate)!;duplicateEvent.meta!.message_id=oneId;duplicateEvent.text=`#${oneId} 查询`;assert.match((await f.call(w,'find',{originMessageId:oneId,query:''}) as ToolOutcome).text,/ORIGIN_AMBIGUOUS/);
    while(f.events.filter(e=>e.source==='qq'&&e.text.includes(`#${oneId}`)).length<=4096)f.human(`capacity reference #${oneId}`);assert.match((await f.call(w,'find',{originMessageId:oneId,query:''}) as ToolOutcome).text,/ORIGIN_LOOKUP_LIMIT/);assert.equal(f.requests.length,0);
  }finally{await w.stop();}
});

test('large unrelated QQ history does not block exact origin and mixed time offsets use real freshness',async()=>{
  const f=fixture(),w=f.world();await w.start(f.host);
  try{
    for(let i=0;i<4200;i++)f.human('unrelated historical fixture');
    const old=f.human('old duplicate'),oldEvent=f.events.find(e=>e.cursor===old)!;oldEvent.meta!.message_id=-3456;oldEvent.text='#-3456 old duplicate';
    f.advance(f.cfg.eventTtlMs+1);
    const fresh=f.human('新授权查询'),event=f.events.find(e=>e.cursor===fresh)!;event.meta!.message_id=-3456;event.text='#-3456 新授权查询';
    event.ts=new Date(Date.parse(event.ts)+8*60*60*1000).toISOString().replace('Z','+08:00');
    assert.equal((await f.success(w,'find',{originMessageId:-3456,query:''})).candidates.length,5);assert.equal(f.requests.length,0);
  }finally{await w.stop();}
});
