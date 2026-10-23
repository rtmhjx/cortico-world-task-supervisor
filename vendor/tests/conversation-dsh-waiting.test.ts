import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
/** Only explicit native interaction metadata may produce waiting_user. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { DshConversationAdapter, type DshContext } from '../conversation-control/src/dsh.ts';

interface NativeEvent {seq:number;time:number;type:string;data:Record<string,any>}
function fixture(){
  const base=join(fixtureScratch, 'conversation-waiting');mkdirSync(base,{recursive:true});const cwd=mkdtempSync(join(base,'case-')),id='waiting-native-session';
  let now=100000,cancels=0;const events:NativeEvent[]=[],nextTurn:any[]=[],nextStep:any[]=[],jobs:{status:string}[]=[];
  const listeners=new Map<string,((...args:any[])=>unknown)[]>(),guards:((...args:any[])=>unknown)[]=[];
  const append=(type:string,data:Record<string,any>)=>events.push({seq:events.length,time:now++,type,data});
  const tools={guard(fn:(...args:any[])=>unknown){guards.push(fn);return()=>{guards.splice(guards.indexOf(fn),1);};}};
  const agent={id,status:'idle',session:{header:{id,cwd,createdAt:now},snapshotEvents:()=>events},inbox:{nextTurn,nextStep},ctx:{get:(name:string)=>name==='tools'?tools:undefined,
    on(name:string,callback:(...args:any[])=>unknown,options?:Record<string,unknown>){const list=listeners.get(name)??[];options?.prepend?list.unshift(callback):list.push(callback);listeners.set(name,list);return()=>{list.splice(list.indexOf(callback),1);};}}};
  const waterfall=async(name:string,payload:any,terminal:()=>Promise<any>):Promise<any>=>{const list=listeners.get(name)??[];const run=async(offset:number):Promise<any>=>offset<list.length?list[offset](payload,()=>run(offset+1)):terminal();return run(0);};
  const controller={resolveAgent:async()=>({agent}),prompt:async(request:any)=>{const message={id:'rpc-message',source:{kind:'user',rpcId:request.requestId}};append('agent/inbox/spliced',{target:'next-turn',start:nextTurn.length,inserted:[message]});nextTurn.push(message);return {accepted:true as const};},cancel:()=>{cancels++;return {accepted:true as const};}};
  const query={listSessions:async()=>[{header:agent.session.header}],observeSession:async()=>({header:agent.session.header,events:[...events],[Symbol.dispose](){}})};
  const services:Record<string,unknown>={sessionController:controller,sessionQuery:query,tools,agents:{get:(target:string)=>target===id?agent:undefined},agentLoop:{create(){}},jobs:{list:(target:unknown)=>{assert.equal(target,agent);return jobs;}}};
  const adapter=new DshConversationAdapter({get:(name:string)=>services[name]} as DshContext,{roots:[cwd],now:()=>now});
  const submit=async()=>adapter.execute({framework:'dsh',operationId:'wait-operation',targetId:id,action:'continue',expectedRevision:(await adapter.get(id)).revision});
  const claim=async(turn=1)=>{agent.status='running';append('turn/start',{turn});const message=nextTurn.shift();append('agent/inbox/spliced',{target:'next-turn',start:0,removedCount:1,inserted:[]});await waterfall('agent/pre-step',{agent,turn,step:1,messages:[message]},async()=>({kind:'enter',messages:[message]}));append('step/start',{turn,step:1});append('user/message',message);};
  return {adapter,agent,append,submit,claim,waterfall,jobs,services,get cancels(){return cancels;},advance:(ms:number)=>{now+=ms;}};
}
function deferred<T>(){let resolve!:(value:T)=>void,reject!:(reason:unknown)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}

test('unmatched approval IDs in the exact open RPC turn wait; matched decision returns running without a decision side effect',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();f.append('approval/asked',{id:'approval-a'});f.append('approval/asked',{id:'approval-b'});
    let current=await f.adapter.observe(receipt);assert.equal(current.status,'waiting_user');assert.equal(current.errorCode,'DSH_WAITING_USER');assert.equal(current.turnId,'1');assert.equal(f.cancels,0);
    f.append('approval/decided',{id:'approval-a',outcome:'allowed-once'});current=await f.adapter.observe(current);assert.equal(current.status,'waiting_user');
    f.append('approval/decided',{id:'approval-b',outcome:'rejected'});current=await f.adapter.observe(current);assert.equal(current.status,'running');assert.equal(current.errorCode,undefined);assert.equal(f.cancels,0);
  }finally{f.adapter.dispose();}
});

test('old-turn approvals, question-mark text and unidentified approval events do not invent waiting_user',async()=>{
  const f=fixture();try{
    f.append('turn/start',{turn:0});f.append('approval/asked',{id:'old-approval'});f.append('turn/end',{turn:0,reason:{kind:'completed'}});
    const receipt=await f.submit();await f.claim();f.append('assistant/message',{turn:1,message:{content:[{type:'text',text:'A question?'}]}});f.append('approval/asked',{});
    assert.equal((await f.adapter.observe(receipt)).status,'running');
    f.append('turn/end',{turn:1,reason:{kind:'error'}});f.agent.status='idle';assert.equal((await f.adapter.observe(receipt)).status,'failed');
  }finally{f.adapter.dispose();}
});

test('public user-question waterfall observes lifetime and forwards the original answer without reading questions',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();const response=deferred<object>();
    const payload={agent:f.agent,get questions():never{throw new Error('Question body must not be read by observer');}};
    const pending=f.waterfall('user-questions/request',payload,()=>response.promise);
    const waiting=await f.adapter.observe(receipt);assert.equal(waiting.status,'waiting_user');assert.equal(f.cancels,0);
    const humanAnswer={selected:'human-fixture'};response.resolve(humanAnswer);assert.equal(await pending,humanAnswer);
    const resumed=await f.adapter.observe(waiting);assert.equal(resumed.status,'running');assert.equal(resumed.errorCode,undefined);
  }finally{f.adapter.dispose();}
});

test('rejected question requests clear pending counters and preserve the exact rejection',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();const response=deferred<unknown>(),failure=new Error('native question cancellation');
    const pending=f.waterfall('user-questions/request',{agent:f.agent},()=>response.promise);const rejected=assert.rejects(pending,error=>error===failure);
    assert.equal((await f.adapter.observe(receipt)).status,'waiting_user');response.reject(failure);await rejected;assert.equal((await f.adapter.observe(receipt)).status,'running');
  }finally{f.adapter.dispose();}
});

test('another agent or an unattributed user-question request cannot mark this RPC waiting',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();const other=deferred<unknown>(),unattributed=deferred<unknown>();
    const first=f.waterfall('user-questions/request',{agent:{id:'another-session'}},()=>other.promise),second=f.waterfall('user-questions/request',{},()=>unattributed.promise);
    assert.equal((await f.adapter.observe(receipt)).status,'running');other.resolve(null);unattributed.resolve(null);await Promise.all([first,second]);
  }finally{f.adapter.dispose();}
});

test('an in-flight question from a replaced live runtime is not attributed to the replacement Agent',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();const response=deferred<unknown>(),pending=f.waterfall('user-questions/request',{agent:f.agent},()=>response.promise);
    assert.equal((await f.adapter.observe(receipt)).status,'waiting_user');
    const replacement={...f.agent};f.services.agents={get:()=>replacement};assert.equal((await f.adapter.observe(receipt)).status,'running');
    f.advance(300001);await f.adapter.observe(receipt);assert.equal(f.cancels,0,'an expired fence cannot interrupt a replacement runtime');response.resolve(null);await pending;
  }finally{f.adapter.dispose();}
});

test('stored receipts restore approval detection through metadata; native deadline never cancels a pending human decision',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();f.append('approval/asked',{id:'recover-approval'});f.adapter.dispose();
    const restored=new DshConversationAdapter({get:(name:string)=>f.services[name]} as DshContext,{roots:[f.agent.session.header.cwd],now:()=>Date.parse(receipt.deadlineAt!)+1});
    try{const result=await restored.observe(receipt);assert.equal(result.status,'waiting_user');assert.equal(result.errorCode,'BUDGET_EXCEEDED');assert.equal(f.cancels,0);}finally{restored.dispose();}
  }finally{f.adapter.dispose();}
});

test('deadline does not interrupt an explicitly pending user question; ended turns do not remain waiting',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();const response=deferred<unknown>(),pending=f.waterfall('user-questions/request',{agent:f.agent},()=>response.promise);
    f.advance(300001);const result=await f.adapter.observe(receipt);assert.equal(result.status,'waiting_user');assert.equal(result.errorCode,'BUDGET_EXCEEDED');assert.equal(f.cancels,0);
    f.append('turn/end',{turn:1,reason:{kind:'blocked'}});f.agent.status='idle';assert.equal((await f.adapter.observe(result)).status,'blocked');response.resolve(null);await pending;
  }finally{f.adapter.dispose();}
});

test('completed turn remains running while native jobs run/stop; failed and unknown endings never become completed',async()=>{
  const f=fixture();try{
    const receipt=await f.submit();await f.claim();f.append('turn/end',{turn:1,reason:{kind:'completed'}});f.agent.status='idle';f.jobs.push({status:'running'});
    let result=await f.adapter.observe(receipt);assert.equal(result.status,'running');assert.equal(result.errorCode,'BACKGROUND_JOBS_ACTIVE');
    f.jobs[0].status='stopping';assert.equal((await f.adapter.observe(result)).status,'running');f.jobs[0].status='finished';result=await f.adapter.observe(result);assert.equal(result.status,'completed');assert.equal(result.errorCode,undefined);
  }finally{f.adapter.dispose();}
  for(const kind of ['error','unrecognized']){const other=fixture();try{const receipt=await other.submit();await other.claim();other.append('turn/end',{turn:1,reason:{kind}});other.agent.status='idle';other.jobs.push({status:'running'});assert.equal((await other.adapter.observe(receipt)).status,kind==='error'?'failed':'unknown');}finally{other.adapter.dispose();}}
});
