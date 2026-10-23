import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { DshConversationAdapter } from '../conversation-control/src/dsh.ts';

function fixture(cached = true) {
  const headers = Array.from({length:80}, (_,i)=>({id:`session-${i}`,cwd:fixtureWorkspace,createdAt:1000+i}));
  headers.push({id:'protected',cwd:fixtureProtected,createdAt:9999});
  const observed:string[]=[], projected:string[]=[];
  const title=(id:string)=>id==='session-1'?'出包主线':'普通记录';
  const services: Record<string, unknown> = {
    agents:{get:()=>undefined},
    sessionQuery:{listSessions:async()=>headers.map(header=>({header})),observeSession:async(id:string)=>{
      observed.push(id);const header=headers.find(header=>header.id===id)!;
      return {header,events:[{seq:0,time:header.createdAt,type:'session/title',data:{title:title(id)}}],[Symbol.dispose](){}};
    }},
    ...(cached?{sessionProjectionCache:{cachedSnapshot:(header:typeof headers[number])=>{
      projected.push(header.id);assert.notEqual(header.id,'protected');
      return {values:{title:title(header.id),sessionListMetadata:{lastPromptAt:header.createdAt}}};
    }}}:{})
  };
  const adapter=new DshConversationAdapter({get:(name:string)=>services[name]},{roots:[fixtureRoot]});
  return {adapter,observed,projected};
}
test('broad discovery filters cached titles before loading native logs and never reads excluded title/body',async()=>{
 const f=fixture();const result=await f.adapter.list({query:'出包',limit:5});
 assert.deepEqual(result.map(x=>x.id),['session-1']);assert.deepEqual(f.observed,[]);assert.equal(f.projected.length,80);
 assert.equal(result[0].stateVerification,'deferred');assert.deepEqual(result[0].capabilities,[]);
 await assert.rejects(f.adapter.get('protected'),{code:'WORKSPACE_DENIED'});assert.deepEqual(f.observed,[]);
 const target=await f.adapter.get('session-1');assert.equal(target.stateVerification,undefined);assert.deepEqual(f.observed,['session-1']);
});
test('recent discovery snapshots only requested candidate count',async()=>{
 const f=fixture();const result=await f.adapter.list({query:'',limit:5});
 assert.equal(result.length,5);assert.equal(f.observed.length,0);assert.equal(result[0].id,'session-79');
});
test('missing title caches never trigger an unbounded historical log scan',async()=>{
 const f=fixture(false);const result=await f.adapter.list({query:'出包',limit:5});
 assert.deepEqual(result,[]);assert.equal(f.observed.length,0);assert.deepEqual(f.adapter.discoveryWarnings,[{id:'',code:'TITLE_METADATA_UNAVAILABLE'}]);
});
