import assert from'node:assert/strict';
import test from'node:test';
import {once}from'node:events';
import {createServer}from'node:http';
import {existsSync,mkdirSync,mkdtempSync,readdirSync}from'node:fs';
import {tmpdir}from'node:os';
import {join}from'node:path';
import type{EventEnvelope,WorldHost,ToolCallContext}from'cortico/core/types.ts';
import type{WorldContext}from'cortico/world.ts';
import{TaskSupervisorWorld,scopeFingerprint}from'../src/world.ts';
import{taskSupervisorDefaults,type TaskSupervisorConfig}from'../src/config.ts';
import{ReportingGate}from'../vendor/task-reporting/src/gate.ts';
import{DEFAULT_PRIVATE_ROOT}from'../vendor/task-reporting/src/policy.ts';
import{ScopedGateway,assertGatewayScope}from'../src/scoped-gateway.ts';
const owner='12345678',now=Date.parse('2026-10-24T01:00:00Z');
function fixture(){const dir=mkdtempSync(join(tmpdir(),'task-supervisor-scope-')),a=join(dir,'a'),b=join(dir,'b'),sessions=join(dir,'sessions');for(const path of[a,b,sessions])mkdirSync(path);
  const events:EventEnvelope[]=[],host={store:{latestCursor:()=>events.length,get:(id:number)=>events.find(e=>e.cursor===id),range:(q:any)=>events.filter(e=>(!q.source||e.source===q.source)&&e.cursor>=(q.fromCursor??0)&&e.cursor<=(q.toCursor??Infinity)),grep:(q:any)=>events.filter(e=>(!q.source||e.source===q.source)&&e.text.includes(q.keyword)).map(e=>({hitCursor:e.cursor,events:[e]}))},pushEvent:async(input:Omit<EventEnvelope,'cursor'>)=>{const e={...input,cursor:events.length+1};events.push(e);return e;}}as unknown as WorldHost;
  const cfg={...taskSupervisorDefaults(),enabled:true,ownerQQ:owner,commandTransport:'trusted-meta',codexEnabled:true,codexWorkspaceRoots:JSON.stringify([a,b]),codexSessionsDir:sessions,codexOptions:JSON.stringify({watchIntervalSeconds:0})};
  const context=(input:TaskSupervisorConfig)=>({cfg:input,dataDir:join(dir,'state'),secret:()=>'',persist:()=>{},storeSecret:()=>{},restart:async()=>{}}as unknown as WorldContext<TaskSupervisorConfig>);
  const call=async(world:TaskSupervisorWorld,name:string,args:Record<string,unknown>={})=>{const result=await world.tools().find(t=>t.name===name)!.handler(args,{}as ToolCallContext);return typeof result==='string'?JSON.parse(result):result;};
  const open=()=>host.pushEvent({source:'qq',type:'qq.message',origin:'external',senderKey:owner,ts:new Date(now).toISOString(),text:'#1 [private] owner: #@',meta:{message_id:1,user_id:owner,conv:{kind:'private',id:owner},taskReportingCommand:{version:1,token:'#@'}}});
  return{dir,a,b,sessions,host,cfg,context,call,open};
}
test('Codex-only works without a fake DSH root or gateway, and shrinking scope starts a separate OFF queue while retaining old state',async()=>{
  const f=fixture(),world=new TaskSupervisorWorld({context:f.context(f.cfg),clock:()=>now});await world.start(f.host);
  const scopes=join(f.dir,'state','tasksupervisor','scopes'),oldDir=join(scopes,readdirSync(scopes)[0]),file=join(oldDir,'reporting','gate.sqlite'),inspector=new ReportingGate({stateFile:file,operatorId:owner,clock:()=>now});
  try{
    assert.equal((await f.call(world,'tasksupervisor_codex_list')).failed,true);await f.open();
    const list=await f.call(world,'tasksupervisor_codex_list');assert.deepEqual(list.threads,[]);
    const setup=await world.webUi().invoke!('setup','getSetup',[])as any;
    assert.equal(setup.components.conversation.status,'setup-required');assert.equal(setup.components.codex.status,'ready');assert.equal(setup.components.memory.status,'disabled');
    assert.equal(setup.secrets.gatewayTokenConfigured,false);assert.equal(inspector.enabled(),true);
    inspector.enqueue('fixture-source','outside-new-scope',{workspace:f.b,text:'Synthetic old wider-scope report'});
  }finally{await world.stop();}
  const smaller={...f.cfg,codexWorkspaceRoots:JSON.stringify([f.a])},second=new TaskSupervisorWorld({context:f.context(smaller),clock:()=>now});await second.start(f.host);
  try{
    const setup=await second.webUi().invoke!('setup','getSetup',[])as any;
    assert.equal(setup.gate.enabled,false);assert.equal(setup.gate.pendingCount,0);
    assert.equal((await f.call(second,'tasksupervisor_codex_list')).failed,true);
    assert.ok(existsSync(file));assert.equal(inspector.snapshot().pendingCount,1);
    assert.notEqual(scopeFingerprint(smaller),scopeFingerprint(f.cfg));
    assert.notEqual(scopeFingerprint({...smaller,ownerQQ:'11111111'}),scopeFingerprint(smaller));
    assert.notEqual(scopeFingerprint({...smaller,excludedRoots:JSON.stringify([join(f.a,'private')])}),scopeFingerprint(smaller));
    assert.equal(scopeFingerprint({...f.cfg,codexWorkspaceRoots:JSON.stringify([f.b,f.a])}),scopeFingerprint(f.cfg));
  }finally{await second.stop();}
  const backToOriginal=new TaskSupervisorWorld({context:f.context(f.cfg),clock:()=>now});await backToOriginal.start(f.host);
  try{const setup=await backToOriginal.webUi().invoke!('setup','getSetup',[])as any;
    assert.equal(setup.gate.enabled,false);assert.equal(setup.gate.pendingCount,0);assert.equal(readdirSync(scopes).length,3);
    assert.equal(inspector.enabled(),true);assert.equal(inspector.snapshot().pendingCount,1);assert.ok(existsSync(file));
  }finally{await backToOriginal.stop();inspector.close();}
});
test('scope handshake rejects wider control roots, missing exclusions and unverified observation roots',()=>{
  const f=fixture(),denied=join(f.a,'private'),scope={roots:{dsh:[f.a],codex:[]},denied:[denied]};
  const health={searchScope:{roots:{dsh:[f.a],codex:[]},excludedRoots:[denied]},progress:{enabled:true,roots:[f.a]}};
  assert.doesNotThrow(()=>assertGatewayScope(health,scope,true));
  assert.throws(()=>assertGatewayScope({...health,searchScope:{roots:{dsh:[f.dir],codex:[]},excludedRoots:[denied]}},scope),/exceed/);
  assert.throws(()=>assertGatewayScope({...health,searchScope:{roots:{dsh:[f.a],codex:[]},excludedRoots:[]}},scope),/exclusions/);
  assert.throws(()=>assertGatewayScope({...health,progress:{enabled:true}},scope,true),/progress roots/);
});
test('saving a different scope without restart immediately revokes old tools and records the scope transition',async()=>{
  const f=fixture(),world=new TaskSupervisorWorld({context:f.context(f.cfg),clock:()=>now});await world.start(f.host);await f.open();
  assert.deepEqual((await f.call(world,'tasksupervisor_codex_list')).threads,[]);
  const before=await world.webUi().invoke!('setup','getSetup',[])as any;
  const result=await world.webUi().invoke!('setup','applySetup',[{form:{...before.form,codexWorkspaceRoots:[f.a]},restart:false}])as any;
  assert.equal(result.saved,true);assert.equal(result.restartRequested,false);
  const after=await world.webUi().invoke!('setup','getSetup',[])as any;
  assert.equal(after.gate,null);assert.equal(after.pendingRestart,true);assert.equal(after.components.codex.status,'disabled');
  assert.equal((await f.call(world,'tasksupervisor_codex_list')).failed,true);await world.stop();
  // Even if the intermediate narrower scope never started, reverting cannot recover old ON state.
  const restored=new TaskSupervisorWorld({context:f.context(f.cfg),clock:()=>now});await restored.start(f.host);
  try{assert.equal((await f.call(restored,'tasksupervisor_status')).reporting.enabled,false);}finally{await restored.stop();}
});
test('an observed operation cannot return a receipt whose actual current target is outside scope',async()=>{
  const f=fixture(),server=createServer((req,res)=>{res.setHeader('content-type','application/json');
    if(req.url==='/v1/health')res.end(JSON.stringify({searchScope:{roots:{dsh:[f.a],codex:[]},excludedRoots:[DEFAULT_PRIVATE_ROOT]}}));
    else if(req.url==='/v1/operations/fixture-operation')res.end(JSON.stringify({operationId:'fixture-operation',framework:'dsh',targetId:'fixture-target',status:'completed',at:new Date(now).toISOString(),answer:'This out-of-scope answer must not reach the caller.'}));
    else res.end(JSON.stringify({framework:'dsh',id:'fixture-target',workspace:f.b}));});server.listen(0,'127.0.0.1');await once(server,'listening');
  try{const gateway=new ScopedGateway(`http://127.0.0.1:${(server.address()as{port:number}).port}`,()=> 'synthetic-fixture-credential',{roots:{dsh:[f.a],codex:[]},denied:[DEFAULT_PRIVATE_ROOT]});
    await assert.rejects(()=>gateway.observe('fixture-operation'),/outside this World/);
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
