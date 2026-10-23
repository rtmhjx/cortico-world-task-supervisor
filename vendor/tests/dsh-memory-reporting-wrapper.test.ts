import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {guardedDshMemoryWorld} from '../cortico-world-dsh-memory/src/guarded-world.ts';
import type {EventEnvelope,World,WorldHost,ToolCallContext} from 'cortico/core/types.ts';
import type { LegacyConsoleDecl } from '../task-reporting/src/legacy-console.ts';
const scratch=join(fixtureScratch,'memory-wrapper');mkdirSync(scratch,{recursive:true});
const operator='12345678';
function fixture(configured=true) {
  const root=mkdtempSync(join(scratch,'run-'));
  const events:EventEnvelope[]=[];
  const store={latestCursor:()=>events.length,range:(q:any)=>events.filter(e=>e.cursor>=(q.fromCursor??1)&&e.cursor<=(q.toCursor??events.length)&&(!q.source||q.source===e.source))};
  const host={store} as WorldHost;
  let reads=0,writes=0,started=false,stopped=false,hook=0,release:(value:string)=>void=()=>{};
  const toolCtx={token:'same-context'} as unknown as ToolCallContext;
  const inner:World&{label:string;extra():string;console():LegacyConsoleDecl}={
    id:'dshmemory',label:'original receiver',
    envPromptVars(){return {label:this.label};},
    tools(){return [
      {name:'dshmemory_read',description:'read',parameters:{},tags:['read'],async handler(_args,context){assert.equal(context,toolCtx);reads++;return 'private fixture body';}},
      {name:'dshmemory_remember',description:'write',parameters:{},tags:['write'],async handler(){writes++;return 'queued';}},
      {name:'dshmemory_wait',description:'wait',parameters:{},tags:['read'],async handler(){reads++;return new Promise<string>(r=>{release=r;});}},
    ];},
    console(){return {label:this.label,lamps:[],panels:[{id:'status',title:'status',getMethods:['snapshot']}],invoke:async()=>({humanStatus:'visible'})};},
    async start(received){assert.equal(received,host);started=true;},async stop(){stopped=true;},
    onHandoffEnded(){assert.equal(this,inner);hook++;},onTurnEnded(){assert.equal(this,inner);hook++;},
    outputTap(){assert.equal(this,inner);return undefined;},
    onEventsSettled(){assert.equal(this,inner);hook++;},onRunPhase(){assert.equal(this,inner);hook++;},
    shutdownVerification(){assert.equal(this,inner);return [];},extra(){return this.label;},
  };
  const wrap=()=>guardedDshMemoryWorld(inner,{dataDir:root,operatorId:configured?operator:'',stateFile:join(root,'gate.sqlite'),watchTrigger:'record'});
  const command=()=>{const e:EventEnvelope={cursor:events.length+1,type:'qq.message',source:'qq',origin:'external',ts:new Date().toISOString(),text:'display wrapper',senderKey:operator,meta:{user_id:Number(operator),message_id:events.length+1,conv:{kind:'private',id:Number(operator)},taskReportingCommand:{version:1,token:'#@'}}};events.push(e);};
  return {wrap,host,inner,command,toolCtx,root,counts:()=>({reads,writes,started,stopped,hook}),release:(text:string)=>release(text)};
}

test('closed gate rejects read and write tools without invoking the original handlers',async()=>{
  const f=fixture(),world=f.wrap();await world.start(f.host);
  try {for(const name of ['dshmemory_read','dshmemory_remember']) {const result=await world.tools().find(t=>t.name===name)!.handler({},f.toolCtx);assert.equal(typeof result,'object');assert.equal((result as any).failed,true);assert.match((result as any).text,/TASK_REPORTING_DISABLED/);}assert.deepEqual(f.counts(),{reads:0,writes:0,started:true,stopped:false,hook:0});}
  finally {await world.stop();}
});

test('fresh private command enables tools; another command disables them across wrapper restart',async()=>{
  const f=fixture();let world=f.wrap();await world.start(f.host);
  f.command();assert.equal(await world.tools()[0].handler({},f.toolCtx),'private fixture body');
  assert.equal(await world.tools()[1].handler({},f.toolCtx),'queued');await world.stop();
  world=f.wrap();await world.start(f.host);
  try {assert.equal(await world.tools()[0].handler({},f.toolCtx),'private fixture body');f.command();const denied=await world.tools()[0].handler({},f.toolCtx);assert.equal((denied as any).failed,true);assert.deepEqual({reads:f.counts().reads,writes:f.counts().writes},{reads:2,writes:1});}
  finally {await world.stop();}
});

test('an in-flight read result is withheld after the operator closes the gate',async()=>{
  const f=fixture(),world=f.wrap();await world.start(f.host);f.command();
  try {const pending=world.tools()[2].handler({},f.toolCtx);f.command();f.release('late private body');const result=await pending;assert.equal((result as any).failed,true);assert.ok(!JSON.stringify(result).includes('late private body'));}
  finally {await world.stop();}
});

test('console, environment, optional hooks and extra capabilities keep their original receiver',async()=>{
  const f=fixture(),world=f.wrap();await world.start(f.host);
  try {assert.deepEqual(await world.envPromptVars(),{label:'original receiver'});const console=world.console!();assert.equal(console.label,'original receiver');assert.deepEqual(await console.invoke!('status','snapshot',[]),{humanStatus:'visible'});world.onHandoffEnded!();world.onTurnEnded!();world.onEventsSettled!([],'delivered');world.onRunPhase!({state:'idle',running:[],enteredAt:new Date().toISOString()});world.outputTap!();assert.deepEqual(world.shutdownVerification!('zh'),[]);assert.equal((world as any).extra(),'original receiver');assert.equal(f.counts().hook,4);}
  finally {await world.stop();assert.equal(f.counts().stopped,true);}
});

test('unconfigured deployments retain original tools and automatic notification configuration',async()=>{
  const f=fixture(false),world=guardedDshMemoryWorld(f.inner,{dataDir:f.root,watchTrigger:'flush'});await world.start(f.host);
  try {assert.equal(await world.tools()[0].handler({},f.toolCtx),'private fixture body');assert.equal(await world.tools()[1].handler({},f.toolCtx),'queued');}
  finally {await world.stop();}
});

test('configured gate refuses automatic memory-body pushes instead of fabricating a host cursor',async()=>{
  const f=fixture(),world=guardedDshMemoryWorld(f.inner,{dataDir:f.root,operatorId:operator,watchTrigger:'flush'});
  await assert.rejects(world.start(f.host),/watchTrigger=record/);assert.equal(f.counts().started,false);
});
