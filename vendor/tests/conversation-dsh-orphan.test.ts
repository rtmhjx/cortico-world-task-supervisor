import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
/** A live idle Agent and missing exact turn/end are an unknown native outcome. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { DshConversationAdapter, type DshContext } from '../conversation-control/src/dsh.ts';
import type { ActionReceipt } from '../conversation-control/src/contract.ts';

interface NativeEvent { seq:number; time:number; type:string; data:Record<string,any> }
const missing = 'NATIVE_TURN_END_MISSING';
function fixture(cancelEnd?: 'completed' | 'aborted', attached = true) {
  const base=join(fixtureScratch, 'conversation-orphan');mkdirSync(base,{recursive:true});
  const cwd=mkdtempSync(join(base,'case-')),id='orphan-native-session',rpc='conversation:orphan-operation';
  let now=1791377345000,prompts=0,cancels=0,resolves=0,hooks=0;
  const events:NativeEvent[]=[
    {seq:79,time:1791377344380,type:'turn/start',data:{turn:4}},
    {seq:80,time:1791377344381,type:'agent/inbox/spliced',data:{target:'next-turn',start:0,removedCount:0,inserted:[]}},
    {seq:81,time:1791377344416,type:'step/start',data:{turn:4,step:1}},
    {seq:82,time:1791377344419,type:'user/message',data:{id:'native-rpc',source:{kind:'user',rpcId:rpc}}},
    {seq:83,time:1791377344480,type:'assistant/attempt',data:{turn:4,step:1}},
    {seq:84,time:1791377344482,type:'step/end',data:{turn:4,step:1}},
  ];
  const tools={guard(){return()=>{};}};
  const agent={id,status:'idle',session:{header:{id,cwd,createdAt:now-1000},snapshotEvents:()=>events},inbox:{nextTurn:[],nextStep:[]},
    ctx:{get:(name:string)=>name==='tools'?tools:undefined,on(){hooks++;return()=>{};}}};
  const controller={resolveAgent:async()=>{resolves++;return {agent};},prompt:async()=>{prompts++;return {accepted:true as const};},
    cancel:()=>{cancels++;agent.status='idle';events.push({seq:85,time:now++,type:'control/message',data:{action:'pause'}});
      if(cancelEnd) events.push({seq:86,time:now++,type:'turn/end',data:{turn:4,reason:{kind:cancelEnd}}});return {accepted:true as const};}};
  const query={listSessions:async()=>[{header:agent.session.header}],observeSession:async()=>({header:agent.session.header,events:[...events],[Symbol.dispose](){}})};
  const ctx={get:(name:string)=>({agents:{get:(target:string)=>attached&&target===id?agent:undefined},sessionController:controller,sessionQuery:query,
    agentLoop:{create(){}},tools,jobs:{list:()=>[]}} as Record<string,unknown>)[name]} as DshContext;
  const adapter=new DshConversationAdapter(ctx,{roots:[cwd],now:()=>now});
  const receipt:ActionReceipt={operationId:'orphan-operation',framework:'dsh',targetId:id,action:'send',status:'accepted',requestId:rpc,
    turnId:'4',at:new Date(now).toISOString(),deadlineAt:new Date(now+300000).toISOString()};
  return {adapter,agent,events,receipt,id,append:(type:string,data:Record<string,any>)=>events.push({seq:(events.at(-1)?.seq??0)+1,time:now++,type,data}),
    advance:()=>{now+=300001;},get counters(){return {prompts,cancels,resolves,hooks};}};
}

test('native seq79 start through seq84 step/end with idle Agent is unknown and exposes no control capabilities',async()=>{
  const f=fixture();try{const target=await f.adapter.get(f.id);assert.equal(target.status,'unknown');assert.deepEqual(target.capabilities,[]);
    const listed=await f.adapter.list({query:'',limit:5});assert.equal(listed[0].status,'unknown');assert.deepEqual(listed[0].capabilities,[]);
  }finally{f.adapter.dispose();}
});

test('original send ID reads missing end as unknown repeatedly without restoring gates, prompting or cancelling',async()=>{
  const f=fixture();try{const result=await f.adapter.observe(f.receipt);assert.equal(result.status,'unknown');assert.equal(result.errorCode,missing);
    assert.equal(result.requestId,f.receipt.requestId);assert.equal(result.turnId,'4');f.agent.status='running';f.advance();
    const again=await f.adapter.observe(result);assert.equal(again.status,'unknown');assert.equal(again.errorCode,missing);
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0,hooks:0});
  }finally{f.adapter.dispose();}
});

test('original pause receipt cannot keep a synthetic paused status when native control message has no turn/end',async()=>{
  const f=fixture();try{f.append('control/message',{action:'pause'});const {requestId,deadlineAt,...receipt}=f.receipt;
    const result=await f.adapter.observe({...receipt,action:'pause',status:'paused'});assert.equal(result.status,'unknown');assert.equal(result.errorCode,missing);
    assert.equal(result.operationId,receipt.operationId);assert.equal(result.turnId,'4');assert.equal(f.counters.cancels,0);
  }finally{f.adapter.dispose();}
});

test('all new actions are refused on the orphan target before prompt, resolution or cancellation',async()=>{
  const f=fixture();try{const target=await f.adapter.get(f.id);
    for(const action of ['continue','check','send','pause'] as const) await assert.rejects(()=>f.adapter.execute({framework:'dsh',operationId:'new-'+action,
      targetId:f.id,action,prompt:action==='send'?'fixture':undefined,expectedRevision:target.revision}),{code:missing});
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0,hooks:0});
  }finally{f.adapter.dispose();}
});

test('pause may issue one native cancellation but idle transition without exact end is unknown, never paused',async()=>{
  const f=fixture();try{f.agent.status='running';const target=await f.adapter.get(f.id);
    const receipt=await f.adapter.execute({framework:'dsh',operationId:'pause-race',targetId:f.id,action:'pause',expectedRevision:target.revision});
    assert.equal(receipt.status,'unknown');assert.equal(receipt.errorCode,missing);assert.equal(receipt.turnId,'4');assert.equal(f.counters.cancels,1);
    const again=await f.adapter.observe(receipt);assert.equal(again.status,'unknown');assert.equal(again.errorCode,missing);assert.equal(f.counters.cancels,1);
  }finally{f.adapter.dispose();}
});

test('pause acknowledgement plus exact natural completion cannot fabricate an aborted turn',async()=>{
  const f=fixture('completed');try{f.agent.status='running';const target=await f.adapter.get(f.id);
    const receipt=await f.adapter.execute({framework:'dsh',operationId:'pause-completed-race',targetId:f.id,action:'pause',expectedRevision:target.revision});
    assert.equal(receipt.status,'unknown');assert.equal(receipt.errorCode,'NATIVE_CANCEL_NOT_CONFIRMED');assert.equal(receipt.turnId,'4');assert.equal(f.counters.cancels,1);
    const observed=await f.adapter.observe(receipt);assert.equal(observed.status,'unknown');assert.notEqual(observed.status,'paused');assert.equal(f.counters.cancels,1);
  }finally{f.adapter.dispose();}
});

test('late exact native terminal event reconciles the same ID and clears the missing-end marker',async()=>{
  const f=fixture();try{f.append('turn/end',{turn:4,reason:{kind:'completed'}});
    const result=await f.adapter.observe({...f.receipt,status:'unknown',errorCode:missing,detail:'previous observation'});
    assert.equal(result.status,'completed');assert.equal(result.errorCode,undefined);assert.equal(result.detail,undefined);assert.equal(result.operationId,f.receipt.operationId);
    const g=fixture();try{g.append('turn/end',{turn:4,reason:{kind:'aborted'}});const {requestId,deadlineAt,...pause}=g.receipt;
      const paused=await g.adapter.observe({...pause,action:'pause',status:'unknown',errorCode:missing,detail:'previous observation'});
      assert.equal(paused.status,'paused');assert.equal(paused.errorCode,undefined);assert.equal(paused.detail,undefined);assert.equal(g.counters.cancels,0);
    }finally{g.adapter.dispose();}
  }finally{f.adapter.dispose();}
});

test('an earlier exact completed turn stays completed even when the latest live idle turn has an orphan',async()=>{
  const f=fixture();try{f.events.unshift({seq:76,time:1791377344300,type:'turn/start',data:{turn:3}},
    {seq:77,time:1791377344301,type:'user/message',data:{source:{kind:'user',rpcId:'conversation:prior-operation'}}},
    {seq:78,time:1791377344302,type:'turn/end',data:{turn:3,reason:{kind:'completed'}}});
    const result=await f.adapter.observe({...f.receipt,operationId:'prior-operation',requestId:'conversation:prior-operation',turnId:'3'});
    assert.equal(result.status,'completed');assert.equal(result.turnId,'3');assert.equal(result.errorCode,undefined);
  }finally{f.adapter.dispose();}
});

test('a genuinely running live Agent with this open turn is not mislabeled as an orphan',async()=>{
  const f=fixture();try{f.agent.status='running';assert.equal((await f.adapter.get(f.id)).status,'running');
    const result=await f.adapter.observe(f.receipt);assert.equal(result.status,'running');assert.equal(result.errorCode,undefined);
  }finally{f.adapter.dispose();}
});

test('cold metadata with exact unmatched turn/start cannot prove running or expose action capabilities',async()=>{
  const f=fixture(undefined,false);try{const target=await f.adapter.get(f.id);assert.equal(target.status,'unknown');assert.deepEqual(target.capabilities,[]);
  }finally{f.adapter.dispose();}
});

test('cold original send ID stays unknown without native resolution and late exact end reconciles read-only',async()=>{
  const f=fixture(undefined,false);try{const missingEnd=await f.adapter.observe(f.receipt);assert.equal(missingEnd.status,'unknown');assert.equal(missingEnd.errorCode,missing);
    assert.equal(missingEnd.requestId,f.receipt.requestId);assert.equal(missingEnd.turnId,'4');
    f.append('turn/end',{turn:4,reason:{kind:'completed'}});const result=await f.adapter.observe(missingEnd);
    assert.equal(result.status,'completed');assert.equal(result.errorCode,undefined);assert.equal(result.operationId,f.receipt.operationId);
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0,hooks:0});
  }finally{f.adapter.dispose();}
});

test('cold original pause ID cannot infer paused or running from missing attached Agent',async()=>{
  const f=fixture(undefined,false);try{const {requestId,deadlineAt,...pause}=f.receipt;
    const result=await f.adapter.observe({...pause,action:'pause',status:'accepted'});assert.equal(result.status,'unknown');assert.equal(result.errorCode,missing);
    assert.equal(result.turnId,'4');assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0,hooks:0});
  }finally{f.adapter.dispose();}
});

test('cold orphan refuses every new action without loading or resuming the native session',async()=>{
  const f=fixture(undefined,false);try{const target=await f.adapter.get(f.id);
    for(const action of ['continue','check','send','pause'] as const)await assert.rejects(()=>f.adapter.execute({framework:'dsh',operationId:'cold-new-'+action,
      targetId:f.id,action,prompt:action==='send'?'fixture':undefined,expectedRevision:target.revision}),{code:missing});
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0,hooks:0});
  }finally{f.adapter.dispose();}
});

/** Native public Engine delegates to its real compiled SessionObservationReader.
 * The reader is intentionally not exported; no copied/patched implementation is used.
 * Bare native dependencies resolve from the existing CLI package, not an install in this fixture. */
async function preparedFixture(finalKind?: 'completed' | 'aborted') {
  const nativeRequire = createRequire(join(process.env.DSH_SOURCE_ROOT!, 'apps/cli/package.json'));
  const nativeImport = (name:string) => import(pathToFileURL(nativeRequire.resolve(name)).href);
  const [{ Context }, { default: SessionStore, SessionId, SESSION_FORMAT_VERSION }, { SessionQueryEngine }, { createUserMessage }] = await Promise.all([
    nativeImport('@deepseek-ai/cordis'), nativeImport('@deepseek-ai/dsh-session'),
    nativeImport('@deepseek-ai/dsh-session-query'), nativeImport('@deepseek-ai/dsh-llm')]);
  const base=join(fixtureScratch, 'conversation-native-prepared');mkdirSync(base,{recursive:true});
  const cwd=mkdtempSync(join(base,'case-')),id=SessionId('native-prepared-session'),rpc='conversation:native-prepared-operation';
  const header={version:SESSION_FORMAT_VERSION,id,createdAt:1,isSeeded:false,cwd};
  const events:NativeEvent[]=[
    {seq:0,time:1,type:'turn/start',data:{turn:1}},
    {seq:1,time:2,type:'user/message',data:createUserMessage({content:[{type:'text',text:'isolated fixture'}],source:{kind:'user',rpcId:rpc}}),surfaceOp:'append'} as NativeEvent,
    {seq:2,time:3,type:'step/start',data:{turn:1,step:1}},
    {seq:3,time:4,type:'step/end',data:{turn:1,step:1}},
  ];
  let revision=0,prompts=0,cancels=0,resolves=0;
  if(finalKind)events.push({seq:4,time:5,type:'turn/end',data:{turn:1,reason:{kind:finalKind}}});
  const nativeCtx=new Context();await nativeCtx.plugin(SessionStore);
  nativeCtx.provide('sessionPersistence',{
    async list(){return [{header:structuredClone(header)}];},
    async stat(){return {header:structuredClone(header),revision:'fixture-'+revision};},
    async open(_id:string,access:string){assert.equal(_id,id);assert.equal(access,'read');return {
      id,header:structuredClone(header),inheritedEventCount:0,access,
      async read(){return {eventState:'detached',events:structuredClone(events)};},
      async close(){},async append(){throw Error('Fixture forbids persistence writes');},async flush(){throw Error('Fixture forbids persistence writes');},
      [Symbol.asyncDispose]:async()=>{},};},});
  class FixtureEngine extends SessionQueryEngine {}
  await nativeCtx.plugin(FixtureEngine);
  const query=nativeCtx.get('sessionQuery');
  const tools={guard(){return()=>{};}};
  const controller={async resolveAgent(){resolves++;throw Error('Fixture forbids resolve');},async prompt(){prompts++;throw Error('Fixture forbids prompt');},cancel(){cancels++;throw Error('Fixture forbids cancel');}};
  const ctx={get:(name:string)=>({agents:{get:()=>undefined},sessionController:controller,sessionQuery:query,agentLoop:{create(){}},tools,jobs:{list:()=>[]}} as Record<string,unknown>)[name]} as DshContext;
  const adapter=new DshConversationAdapter(ctx,{roots:[cwd],now:()=>100});
  const receipt:ActionReceipt={operationId:'native-prepared-operation',framework:'dsh',targetId:id,action:'send',status:'accepted',requestId:rpc,turnId:'1',at:new Date(100).toISOString(),deadlineAt:new Date(300100).toISOString()};
  return {id,events,adapter,receipt,query,nativeCtx,
    appendEnd(kind:'completed'|'aborted'){events.push({seq:events.length,time:6,type:'turn/end',data:{turn:1,reason:{kind}}});revision++;},
    get counters(){return {prompts,cancels,resolves};},async dispose(){adapter.dispose();await nativeCtx.fiber.dispose();}};
}

test('native prepared reader balances an interrupted log without durable write; target remains unknown',{skip:!process.env.DSH_SOURCE_ROOT},async()=>{
  const f=await preparedFixture();try{const observed=await f.query.observeSession(f.id,{projectionMode:'none'});
    try{assert.equal(observed.source,'prepared');assert.equal(observed.events.at(-1).type,'turn/end');assert.equal(observed.events.at(-1).data.reason.kind,'interrupted');assert.equal(observed.projections,undefined);}
    finally{observed[Symbol.dispose]();}
    assert.equal(f.events.some(e=>e.type==='turn/end'),false);assert.equal(f.nativeCtx.sessions.get(f.id),undefined);
    const target=await f.adapter.get(f.id);assert.equal(target.status,'unknown');assert.deepEqual(target.capabilities,[]);
  }finally{await f.dispose();}
});

test('native prepared original send ID reports unconfirmed interrupted end explicitly without side effects',{skip:!process.env.DSH_SOURCE_ROOT},async()=>{
  const f=await preparedFixture();try{const result=await f.adapter.observe(f.receipt);
    assert.equal(result.status,'unknown');assert.equal(result.errorCode,missing);assert.equal(result.turnId,'1');assert.equal(result.requestId,f.receipt.requestId);
    assert.match(result.detail??'',/confirmed|recorded/i);assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0});
  }finally{await f.dispose();}
});

test('native prepared original pause ID cannot treat interrupted recovery end as confirmed pause',{skip:!process.env.DSH_SOURCE_ROOT},async()=>{
  const f=await preparedFixture();try{const {requestId,deadlineAt,...pause}=f.receipt;
    const result=await f.adapter.observe({...pause,action:'pause',status:'paused'});assert.equal(result.status,'unknown');assert.equal(result.errorCode,missing);assert.equal(result.turnId,'1');
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0});
  }finally{await f.dispose();}
});

test('native prepared target refuses all new actions before resolve prompt or cancel',{skip:!process.env.DSH_SOURCE_ROOT},async()=>{
  const f=await preparedFixture();try{const target=await f.adapter.get(f.id);
    for(const action of ['continue','check','send','pause'] as const)await assert.rejects(()=>f.adapter.execute({framework:'dsh',operationId:'prepared-new-'+action,targetId:f.id,action,
      prompt:action==='send'?'fixture':undefined,expectedRevision:target.revision}),{code:missing});
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0});
  }finally{await f.dispose();}
});

test('native prepared late exact completed end and revision reconcile original send ID read-only',{skip:!process.env.DSH_SOURCE_ROOT},async()=>{
  const f=await preparedFixture();try{const old=await f.adapter.observe(f.receipt);assert.equal(old.errorCode,missing);f.appendEnd('completed');
    const result=await f.adapter.observe(old);assert.equal(result.status,'completed');assert.equal(result.errorCode,undefined);assert.equal(result.detail,undefined);assert.equal(result.operationId,f.receipt.operationId);
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0});
  }finally{await f.dispose();}
});

test('native prepared late exact aborted end reconciles original pause ID read-only',{skip:!process.env.DSH_SOURCE_ROOT},async()=>{
  const f=await preparedFixture();try{const {requestId,deadlineAt,...pause}=f.receipt;const old=await f.adapter.observe({...pause,action:'pause',status:'accepted'});assert.equal(old.errorCode,missing);f.appendEnd('aborted');
    const result=await f.adapter.observe(old);assert.equal(result.status,'paused');assert.equal(result.errorCode,undefined);assert.equal(result.operationId,pause.operationId);
    assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0});
  }finally{await f.dispose();}
});

test('native prepared genuine durable completed and aborted end outcomes remain confirmed',{skip:!process.env.DSH_SOURCE_ROOT},async()=>{
  for(const kind of ['completed','aborted'] as const){const f=await preparedFixture(kind);try{
    const result=await f.adapter.observe(f.receipt);assert.equal(result.status,kind==='completed'?'completed':'paused');assert.equal(result.errorCode,undefined);
    assert.notEqual((await f.adapter.get(f.id)).status,'unknown');assert.deepEqual(f.counters,{prompts:0,cancels:0,resolves:0});
  }finally{await f.dispose();}}
});
