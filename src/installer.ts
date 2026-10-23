/** Interactive external-DSH installer. Package import does not run or write anything. */
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, open, readFile, realpath, rename, stat, unlink } from 'node:fs/promises';
import { dirname,isAbsolute,join,relative,resolve,sep } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { isMap,isSeq,parseDocument,type Document } from 'yaml';

interface Kit { version:1; options:Record<string,unknown> }
export interface InstallOptions { kitDir:string; dshHome:string; profileDir:string; updateExisting?:boolean; lockTimeoutMs?:number }
export interface InstallResult { installed:true; patchFile:string; credentialsFile:string; pluginFile:string; backups:string[]; restartRequired:true }
const inside=(root:string,path:string)=>{const part=relative(process.platform==='win32'?root.toLowerCase():root,process.platform==='win32'?path.toLowerCase():path);return part===''||(!isAbsolute(part)&&part!=='..'&&!part.startsWith('..'+sep));};
async function maybe(path:string){try{return await readFile(path);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return undefined;throw error;}}
async function safePath(root:string,path:string):Promise<void>{
  let parent=resolve(path);const tail:string[]=[];
  for(;;){try{parent=await realpath(parent);break;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;const previous=dirname(parent);if(previous===parent)throw error;tail.unshift(relative(previous,parent));parent=previous;}}
  if(!inside(root,join(parent,...tail)))throw new Error('An installation target resolves outside the selected DSH home.');
}
async function lock(path:string,timeout:number):Promise<()=>Promise<void>>{
  const file=path+'.lock',started=Date.now(),identity=`${process.pid}\n`;
  for(;;){try{const handle=await open(file,'wx',0o600);await handle.writeFile(identity);await handle.close();
      return async()=>{if((await maybe(file))?.toString()===identity)await unlink(file);};
    }catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;if(Date.now()-started>=timeout)throw new Error('A DSH writer lock is held. Close the competing writer and run the installer again; no lock was removed.');await new Promise(resolve=>setTimeout(resolve,100));}}
}
async function atomic(path:string,value:Buffer|string){const temporary=path+'.tmp-'+randomUUID(),handle=await open(temporary,'wx',0o600);
  try{await handle.writeFile(value);await handle.sync();}finally{await handle.close();}
  try{await rename(temporary,path);}catch(error){await unlink(temporary).catch(()=>{});throw error;}}
export async function installGateway(input:InstallOptions):Promise<InstallResult>{
  if(!isAbsolute(input.dshHome)||!isAbsolute(input.profileDir)||!isAbsolute(input.kitDir))throw new Error('Select absolute DSH home, profile and kit directories.');
  const home=await realpath(input.dshHome),profile=await realpath(input.profileDir),kit=await realpath(input.kitDir);
  if(!inside(join(home,'profiles'),profile)||profile===join(home,'profiles'))throw new Error('Select one existing profile inside DSH_HOME/profiles.');
  const payload=JSON.parse(await readFile(join(kit,'setup.json'),'utf8'))as Kit,token=(await readFile(join(kit,'.gateway-token'),'utf8')).trim();
  if(payload.version!==1||!payload.options||typeof payload.options!=='object'||Array.isArray(payload.options)||token.length<32||token.length>8192||/\s/.test(token))throw new Error('Invalid private installation kit.');
  const tokenRef=payload.options.tokenRef;if(typeof tokenRef!=='string'||!/^CORTICO_[A-Z0-9_]+$/.test(tokenRef))throw new Error('Invalid gateway credential reference.');
  if(payload.options.enabled!==true||!Number.isSafeInteger(payload.options.port)||Number(payload.options.port)<1024||Number(payload.options.port)>65535)throw new Error('Invalid loopback gateway options.');
  for(const field of ['dshRoots','codexRoots','observeRoots','excludedRoots']){const roots=payload.options[field];if(!Array.isArray(roots)||roots.some(root=>typeof root!=='string'||!isAbsolute(root)))throw new Error('Invalid project or exclusion roots in the kit.');}
  if(!(payload.options.dshRoots as unknown[]).length&&!(payload.options.codexRoots as unknown[]).length)throw new Error('Choose at least one project before installing.');
  const patchFile=join(profile,'cordis.patch.yml'),credentialsFile=join(home,'.credentials.yaml'),pluginDir=join(home,'plugins','task-supervisor-gateway'),pluginFile=join(pluginDir,'gateway.mjs');
  for(const path of [patchFile,credentialsFile,pluginFile])await safePath(home,path);
  await mkdir(pluginDir,{recursive:true});
  for(const path of [patchFile,credentialsFile,pluginFile])await safePath(home,path);
  const releases:Array<()=>Promise<void>>=[],originals=new Map<string,Buffer|undefined>(),written:string[]=[],backups:string[]=[];
  try{
    for(const path of [credentialsFile,patchFile,pluginFile].sort())releases.push(await lock(path,input.lockTimeoutMs??30000));
    for(const path of [credentialsFile,patchFile,pluginFile])originals.set(path,await maybe(path));
    const patch:Document=parseDocument(originals.get(patchFile)?.toString()??'[]\n'),credentials:Document=parseDocument(originals.get(credentialsFile)?.toString()??'version: 1\nrefs: {}\nrecords: {}\n');
    if(patch.contents===null)patch.contents=patch.createNode([]);
    if(credentials.contents===null||(isMap(credentials.contents)&&credentials.contents.items.length===0))credentials.contents=credentials.createNode({version:1,refs:{},records:{}});
    if(patch.errors.length||credentials.errors.length||!isSeq(patch.contents)||!isMap(credentials.contents))throw new Error('Existing DSH YAML is malformed or has an unsupported shape; no file was changed.');
    const credentialValue=credentials.toJS()as Record<string,unknown>;
    if(credentialValue.version!==1||Object.keys(credentialValue).some(key=>!['version','refs','records'].includes(key))
      ||credentialValue.refs!==undefined&&(!credentialValue.refs||typeof credentialValue.refs!=='object'||Array.isArray(credentialValue.refs)||Object.values(credentialValue.refs).some(value=>typeof value!=='string'))
      ||credentialValue.records!==undefined&&(!credentialValue.records||typeof credentialValue.records!=='object'||Array.isArray(credentialValue.records)))throw new Error('Unsupported managed credential schema; no file was changed.');
    if(credentialValue.refs===undefined)credentials.set('refs',credentials.createNode({}));
    const existing:ReturnType<typeof patch.createNode>[]=[];
    for(const entry of patch.contents.items){if(!isMap(entry))continue;const inserted=entry.get('insert',true);if(!isSeq(inserted))continue;for(const plugin of inserted.items)if(isMap(plugin)&&plugin.get('id')==='conversation-gateway')existing.push(plugin);}
    if(existing.length>1)throw new Error('Multiple conversation-gateway definitions already exist; review them before installing.');
    if(existing.length&&!input.updateExisting)throw new Error('A conversation-gateway definition exists. Choose the explicit update option; a second copy was not added.');
    const plugin={id:'conversation-gateway',name:pathToFileURL(pluginFile).href,config:payload.options};
    if(existing.length){const node=existing[0];if(!isMap(node))throw new Error('Unsupported gateway definition.');node.set('name',plugin.name);node.set('config',patch.createNode({...((node.get('config')as{toJSON?:()=>Record<string,unknown>})?.toJSON?.()??{}),...payload.options}));}
    else patch.contents.add(patch.createNode({insert:[plugin]}));
    const refs=credentials.get('refs',true);if(!isMap(refs))throw new Error('Unsupported credential refs map.');refs.set(tokenRef,token);
    const next=new Map<string,Buffer|string>([[pluginFile,await readFile(join(kit,'gateway.mjs'))],[credentialsFile,String(credentials)],[patchFile,String(patch)]]);
    const suffix='.task-supervisor-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8);
    for(const[path,old]of originals){if(old){const backup=path+suffix,handle=await open(backup,'wx',0o600);try{await handle.writeFile(old);await handle.sync();}finally{await handle.close();}backups.push(backup);}}
    for(const[path,value]of next){await atomic(path,value);written.push(path);}
    return{installed:true,patchFile,credentialsFile,pluginFile,backups,restartRequired:true};
  }catch(error){
    for(const path of written.reverse()){const old=originals.get(path);if(old)await atomic(path,old);else await unlink(path).catch(()=>{});}
    throw error;
  }finally{for(const release of releases.reverse())await release();}
}
async function main(){
  if(Number(process.versions.node.split('.')[0])<24){console.error('Node.js 24 or newer is required. Install Node.js and run this launcher again.');process.exitCode=1;return;}
  const readline=createInterface({input:process.stdin,output:process.stdout});
  try{
    const kitDir=dirname(fileURLToPath(import.meta.url));
    console.log('Task Supervisor external DSH gateway installer. No credential will be printed.');
    const dshHome=(await readline.question('DSH_HOME directory (contains profiles/): ')).trim().replace(/^"|"$/g,'');
    const profileName=(await readline.question('Existing profile name [desktop]: ')).trim()||'desktop';
    if(!/^[a-zA-Z0-9._-]+$/.test(profileName))throw new Error('Use an existing single profile directory name.');
    const profileDir=join(resolve(dshHome),'profiles',profileName);
    console.log(`Targets: ${join(profileDir,'cordis.patch.yml')} and ${join(resolve(dshHome),'.credentials.yaml')}. Existing files will be backed up.`);
    const update=(await readline.question('Update an existing conversation-gateway definition if present? [y/N]: ')).trim().toLowerCase()==='y';
    if((await readline.question('Install these files now? Type INSTALL: ')).trim()!=='INSTALL'){console.log('No changes made.');return;}
    const result=await installGateway({kitDir,dshHome:resolve(dshHome),profileDir,updateExisting:update});
    console.log('Gateway installed. Restart the selected DSH host, then use Check connections in Task Supervisor.');
    console.log(`Backups saved: ${result.backups.length}. The private kit contains a credential; keep it private or remove it after verified installation.`);
  }finally{readline.close();}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)main().catch(()=>{console.error('Installation failed. Existing configuration was preserved or restored; check the selected profile, writer locks and kit configuration. No credential is included in this diagnostic.');process.exitCode=1;});
