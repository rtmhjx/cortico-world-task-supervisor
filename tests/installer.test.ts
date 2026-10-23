import assert from'node:assert/strict';
import test from'node:test';
import {createRequire,syncBuiltinESMExports}from'node:module';
import {mkdir,mkdtemp,readFile,readdir,writeFile}from'node:fs/promises';
import {join}from'node:path';
import {tmpdir}from'node:os';
import {parse}from'yaml';
import {installGateway}from'../src/installer.ts';

async function fixture(){const root=await mkdtemp(join(tmpdir(),'task-supervisor-install-')),home=join(root,'dsh'),profileDir=join(home,'profiles','desktop'),kit=join(root,'kit'),project=join(root,'project');
  await Promise.all([mkdir(profileDir,{recursive:true}),mkdir(kit),mkdir(project)]);
  const patchFile=join(profileDir,'cordis.patch.yml'),credentialsFile=join(home,'.credentials.yaml');
  const patch='# preserve patch comment\n- insert:\n    - id: keep-me\n      name: fixture-plugin\n      config:\n        value: unchanged\n',credentials='# preserve credential comment\nversion: 1\nrefs:\n  EXISTING_FIXTURE_REF: synthetic-preserved-value\nrecords:\n  fixture-entry:\n    unknown-nested-record: [alpha, beta]\n';
  await writeFile(patchFile,patch);await writeFile(credentialsFile,credentials);
  await writeFile(join(kit,'gateway.mjs'),'export const fixtureOnly = true;\n');
  await writeFile(join(kit,'.gateway-token'),'synthetic-new-credential-with-more-than-thirty-two-characters\n');
  await writeFile(join(kit,'setup.json'),JSON.stringify({version:1,options:{enabled:true,port:3092,stateDir:join(root,'gateway-state'),tokenRef:'CORTICO_FIXTURE_GATEWAY_TOKEN',dshRoots:[project],codexRoots:[],observeRoots:[project],excludedRoots:[]}}));
  return{home,profileDir,kit,patchFile,credentialsFile,patch,credentials};
}
test('installer preserves unrelated YAML/plugin/credential data, uses managed refs, backs up originals and updates without a second gateway',async()=>{
  const f=await fixture(),result=await installGateway({kitDir:f.kit,dshHome:f.home,profileDir:f.profileDir});
  assert.equal(result.installed,true);assert.equal(result.restartRequired,true);assert.equal(result.backups.length,2);
  const patchText=await readFile(f.patchFile,'utf8'),credentialText=await readFile(f.credentialsFile,'utf8');
  assert.match(patchText,/preserve patch comment/);assert.match(credentialText,/preserve credential comment/);
  const patches=parse(patchText),credentials=parse(credentialText);assert.deepEqual(patches[0].insert[0],{id:'keep-me',name:'fixture-plugin',config:{value:'unchanged'}});
  assert.equal(patches.length,2);assert.equal(patches[1].insert[0].id,'conversation-gateway');assert.match(patches[1].insert[0].name,/^file:/);
  assert.equal(credentials.refs.EXISTING_FIXTURE_REF,'synthetic-preserved-value');assert.equal(credentials.refs.CORTICO_FIXTURE_GATEWAY_TOKEN,'synthetic-new-credential-with-more-than-thirty-two-characters');
  assert.deepEqual(credentials.records,{'fixture-entry':{'unknown-nested-record':['alpha','beta']}});
  assert.equal(await readFile(result.pluginFile,'utf8'),'export const fixtureOnly = true;\n');
  await assert.rejects(()=>installGateway({kitDir:f.kit,dshHome:f.home,profileDir:f.profileDir}),/explicit update/);
  assert.equal(await readFile(f.patchFile,'utf8'),patchText);assert.equal(await readFile(f.credentialsFile,'utf8'),credentialText);
  await installGateway({kitDir:f.kit,dshHome:f.home,profileDir:f.profileDir,updateExisting:true});
  assert.equal(parse(await readFile(f.patchFile,'utf8')).flatMap((entry:any)=>entry.insert??[]).filter((plugin:any)=>plugin.id==='conversation-gateway').length,1);
  assert.ok(!(await readdir(f.profileDir)).some(name=>name.endsWith('.lock')));
});
test('installer does not clear a competing writer lock and rejects outside profiles before writes',async()=>{
  const f=await fixture();await writeFile(f.credentialsFile+'.lock','12345\n');
  await assert.rejects(()=>installGateway({kitDir:f.kit,dshHome:f.home,profileDir:f.profileDir,lockTimeoutMs:0}),/writer lock/);
  assert.equal(await readFile(f.credentialsFile+'.lock','utf8'),'12345\n');assert.equal(await readFile(f.patchFile,'utf8'),f.patch);assert.equal(await readFile(f.credentialsFile,'utf8'),f.credentials);
  await assert.rejects(()=>installGateway({kitDir:f.kit,dshHome:f.home,profileDir:f.kit}),/inside DSH_HOME/);
});
test('installer rolls already committed files back after a later atomic commit failure',async()=>{
  const f=await fixture(),fs=createRequire(import.meta.url)('node:fs/promises')as typeof import('node:fs/promises');
  const original=fs.rename;let failed=false;
  fs.rename=async(from,to)=>{if(String(to)===f.patchFile&&!failed){failed=true;throw new Error('Synthetic final commit failure.');}return original(from,to);};syncBuiltinESMExports();
  try{await assert.rejects(()=>installGateway({kitDir:f.kit,dshHome:f.home,profileDir:f.profileDir}),/Synthetic final commit failure/);}
  finally{fs.rename=original;syncBuiltinESMExports();}
  assert.equal(failed,true);assert.equal(await readFile(f.patchFile,'utf8'),f.patch);assert.equal(await readFile(f.credentialsFile,'utf8'),f.credentials);
  const pluginDir=join(f.home,'plugins','task-supervisor-gateway');assert.equal((await readdir(pluginDir)).filter(name=>name==='gateway.mjs').length,0);
});
