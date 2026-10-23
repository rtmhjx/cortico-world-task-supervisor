import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdirSync,mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from'ws';
import type{EventEnvelope,WorldHost,ToolCallContext}from'cortico/core/types.ts';
import type{WorldContext}from'cortico/world.ts';
import{TaskSupervisorWorld}from'../src/world.ts';
import{taskSupervisorDefaults,type TaskSupervisorConfig}from'../src/config.ts';
import{nativeCommand,oneBotCommand,privateMessage}from'../src/command-listener.ts';
import{DEFAULT_PRIVATE_ROOT}from'../vendor/task-reporting/src/policy.ts';

const owner='12345678',account='87654321';
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(predicate:()=>boolean){for(let i=0;i<200;i++){if(predicate())return;await delay(20);}assert.fail('Fixture condition timed out.');}
function hostFixture(){const events:EventEnvelope[]=[];let failOnce=false;
  const host={store:{latestCursor:()=>events.length,get:(cursor:number)=>events.find(event=>event.cursor===cursor),
    range:(q:{source?:string;fromCursor?:number;toCursor?:number})=>events.filter(event=>(!q.source||event.source===q.source)&&event.cursor>=(q.fromCursor??0)&&event.cursor<=(q.toCursor??Infinity)),
    grep:(q:{source?:string;keyword:string})=>events.filter(event=>(!q.source||event.source===q.source)&&event.text.includes(q.keyword)).map(event=>({hitCursor:event.cursor,events:[event]}))},
    pushEvent:async(input:Omit<EventEnvelope,'cursor'>)=>{const event={...input,cursor:events.length+1};events.push(event);if(failOnce&&event.source==='qq'){failOnce=false;throw new Error('Committed fixture before failed return.');}return event;}}as unknown as WorldHost;
  return{host,events,failAfterSave:()=>{failOnce=true;}};
}
test('only an original owner private prefix is a command; nickname, quoted and nested text never grant authority',()=>{
  const native={kind:'friend_message',selfUin:Number(account),senderUin:Number(owner),nativeId:1,time:1800000000,elements:[{type:'text',text:'#@ do work'}]};
  assert.ok(nativeCommand(native,account,owner));assert.ok(nativeCommand({...native,elements:[{type:'text',text:'#'},{type:'text',text:'@'}]},account,owner));
  for(const patch of[{kind:'group_message'},{kind:'temp_message'},{senderUin:11111111},{selfUin:11111111},{elements:[{type:'reply',text:'#@'},{type:'text',text:'#@'}]},
    {elements:[{type:'forward',elements:[{type:'text',text:'#@'}]}]},{elements:[{type:'record',text:'#@'}]},
    {elements:[{type:'text',text:' #@'}]},{elements:[{type:'text',text:'mention #@'}]},{senderNick:'#@',elements:[{type:'text',text:'hello'}]}])assert.equal(nativeCommand({...native,...patch},account,owner),undefined);
  const onebot={post_type:'message',message_type:'private',self_id:Number(account),user_id:Number(owner),message_id:-7,time:1800000000,message:[{type:'text',data:{text:'#@'}}]};
  assert.ok(oneBotCommand(onebot,account,owner));assert.equal(oneBotCommand({...onebot,sub_type:'group'},account,owner),undefined);
  const quoted=privateMessage({...native,elements:[{type:'reply',text:'确认'},{type:'text',text:'actual own text'}]},account,owner,true)!;
  assert.equal(quoted.command,false);assert.equal(quoted.text,'[reply]actual own text');
});

test('one World receives canonical owner chat, enforces original draft/confirm, reports once and sends only to the enabled owner',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'task-supervisor-owner-')),project=join(dir,'project'),sessions=join(dir,'sessions');mkdirSync(project);mkdirSync(sessions);
  const wsServer=new WebSocket.Server({host:'127.0.0.1',port:0});await once(wsServer,'listening');
  const sent:Record<string,unknown>[]=[],operations:Record<string,unknown>[]=[];let peer:WebSocket|undefined,status='accepted',now=Date.parse('2026-10-24T01:00:00Z');
  wsServer.on('connection',socket=>{peer=socket;socket.on('message',buffer=>{const request=JSON.parse(buffer.toString());if(request.action!=='get_login_info')sent.push(request);socket.send(JSON.stringify({status:'ok',retcode:0,echo:request.echo,data:request.action==='get_login_info'?{user_id:Number(account)}:{message_id:900+sent.length}}));});});
  const target={framework:'dsh',id:'fixture-session',title:'Fixture project',workspace:project,lastActivityAt:new Date(now).toISOString(),summary:'Fixture metadata only',status:'idle',revision:'fixture-revision',capabilities:['check','continue','pause','send'],source:'fixture-native'};
  const gateway=createServer(async(req,res)=>{assert.equal(req.headers.authorization,'Bearer synthetic-gateway-credential');res.setHeader('content-type','application/json');
    const path=new URL(req.url!,'http://127.0.0.1');let result:unknown;
    if(path.pathname==='/v1/health')result={accepting:true,frameworks:['dsh'],searchScope:{roots:{dsh:[project],codex:[]},excludedRoots:[DEFAULT_PRIVATE_ROOT]},progress:{enabled:false}};
    else if(path.pathname==='/v1/conversations')result=[target];
    else if(path.pathname==='/v1/conversations/dsh/fixture-session')result=target;
    else if(path.pathname==='/v1/operations'&&req.method==='POST'){let text='';for await(const chunk of req)text+=chunk;const request=JSON.parse(text);operations.push(request);result={...request,status,at:new Date(now).toISOString()};}
    else if(path.pathname.startsWith('/v1/operations/')){const operation=operations.at(-1)!;result={...operation,status,turnId:'fixture-owned-turn',at:new Date(now).toISOString(),...(status==='completed'?{answer:'Fixture finished'}:{})};}
    else{res.statusCode=404;result={code:'NOT_FOUND',message:'Fixture route missing'};}res.end(JSON.stringify(result));});
  gateway.listen(0,'127.0.0.1');await once(gateway,'listening');
  const f=hostFixture(),cfg={...taskSupervisorDefaults(),enabled:true,ownerQQ:owner,commandTransport:'onebot-v11',qqEndpoint:`ws://127.0.0.1:${(wsServer.address()as{port:number}).port}`,qqAccountId:account,
    gatewayEndpoint:`http://127.0.0.1:${(gateway.address()as{port:number}).port}`,dshEnabled:true,dshWorkspaceRoots:JSON.stringify([project]),dshSessionsDir:sessions,
    conversationOptions:JSON.stringify({pollIntervalMs:100,desktopProgressEnabled:false})};
  const values:Record<string,string>={[cfg.gatewayTokenSecret]:'synthetic-gateway-credential'};
  const context={cfg,dataDir:join(dir,'state'),secret:(key:string)=>values[key]??'',persist:()=>{},storeSecret:()=>{},restart:async()=>{}}as unknown as WorldContext<TaskSupervisorConfig>;
  let world=new TaskSupervisorWorld({context,clock:()=>now});
  const invoke=async(name:string,args:Record<string,unknown>)=>{const result=await world.tools().find(tool=>tool.name===name)!.handler(args,{}as ToolCallContext);return typeof result==='string'?JSON.parse(result):result;};
  const message=(id:number,text:string,patch:Record<string,unknown>={})=>{peer!.send(JSON.stringify({post_type:'message',message_type:'private',self_id:Number(account),user_id:Number(owner),message_id:id,time:now/1000,message:[{type:'text',data:{text}}],...patch}));};
  try{
    await world.start(f.host);await until(()=>!!peer);
    now+=1000;
    message(1,'ordinary while OFF');await delay(80);assert.equal(f.events.filter(event=>event.source==='qq').length,0);
    const disabled=await invoke('tasksupervisor_qq_send',{text:'must not send'});assert.equal(disabled.failed,true);assert.equal(sent.length,0);
    f.failAfterSave();message(2,'#@检查这个项目');await until(()=>f.events.some(event=>event.meta?.message_id===2));
    // Reconnect/restart after append succeeded but the transport caller did not receive its cursor.
    await world.stop();peer=undefined;world=new TaskSupervisorWorld({context,clock:()=>now});await world.start(f.host);await until(()=>!!peer);
    message(2,'#@检查这个项目');await until(()=>f.events.filter(event=>event.meta?.message_id===2).length===1);
    const find=await invoke('tasksupervisor_conversation_find',{originMessageId:2,query:'Fixture'});assert.ok(Array.isArray(find.candidates),JSON.stringify(find));assert.equal(find.candidates.length,1);
    await invoke('tasksupervisor_conversation_select',{originMessageId:2,candidateSetId:find.id,index:1});
    const draft=await invoke('tasksupervisor_conversation_draft',{originMessageId:2,action:'check'});assert.ok(draft.id);assert.equal(operations.length,0);
    now+=1000;message(20,'#@');await until(()=>f.events.some(event=>event.meta?.message_id===20));
    now+=1000;message(21,'#@ 确认');await until(()=>f.events.some(event=>event.meta?.message_id===21));
    const switchCannotConfirm=await invoke('tasksupervisor_conversation_confirm',{originMessageId:21,draftId:draft.id});assert.equal(switchCannotConfirm.failed,true);assert.match(switchCannotConfirm.text,/CONFIRMATION_REQUIRED/);assert.equal(operations.length,0);
    now+=1000;message(3,'确认');await until(()=>f.events.some(event=>event.meta?.message_id===3));
    const receipt=await invoke('tasksupervisor_conversation_confirm',{originMessageId:3,draftId:draft.id});assert.equal(receipt.status,'accepted');assert.equal(operations.length,1);
    status='completed';now+=1000;await until(()=>f.events.some(event=>event.type==='conversationcontrol.result'));
    assert.equal(f.events.filter(event=>event.type==='conversationcontrol.result').length,1);
    assert.equal((await invoke('tasksupervisor_qq_send',{text:'Fixture task finished'})).ok,true);assert.equal(sent.length,1);
    assert.equal((sent[0].params as{user_id:number}).user_id,Number(owner));assert.equal(sent[0].action,'send_private_msg');
    assert.equal((await invoke('tasksupervisor_qq_send',{text:'no arbitrary destination',user_id:11111111})).failed,true);assert.equal(sent.length,1);
    now+=1000;message(4,'#@');await until(()=>f.events.some(event=>event.meta?.message_id===4));
    assert.equal((await invoke('tasksupervisor_qq_send',{text:'must remain local'})).failed,true);assert.equal(sent.length,1);
    assert.equal((await invoke('tasksupervisor_conversation_find',{originMessageId:4,query:''})).failed,true);
    message(5,'off normal control text');message(6,'#@',{message_type:'group',group_id:Number(owner)});await delay(100);
    assert.equal(f.events.some(event=>event.meta?.message_id===5||event.meta?.message_id===6),false);
    assert.equal(f.events.filter(event=>event.meta?.message_id===2).length,1);assert.equal(f.events.filter(event=>event.type==='conversationcontrol.result').length,1);
    assert.equal(operations.length,1);
  }finally{await world.stop();for(const socket of wsServer.clients)socket.terminate();await new Promise<void>(resolve=>wsServer.close(()=>resolve()));await new Promise<void>(resolve=>gateway.close(()=>resolve()));}
});
