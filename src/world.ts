import { createHash,randomBytes,randomUUID } from 'node:crypto';
import { copyFile,mkdir,mkdtemp,stat,writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WorldContext } from 'cortico/world.ts';
import type { ToolDef, ToolOutcome, World, WorldHost, WorldWebUiDecl } from 'cortico/core/types.ts';
import { ConversationControlWorld } from '../vendor/cortico-world-conversation-control/src/world.ts';
import { conversationControlDefaults, type ConversationControlConfigSection } from '../vendor/cortico-world-conversation-control/src/config.ts';
import { CodexBridgeWorld } from '../vendor/cortico-world-codex-bridge/src/world.ts';
import { codexBridgeDefaults, type CodexBridgeConfigSection } from '../vendor/cortico-world-codex-bridge/src/config.ts';
import { DshMemoryWorld } from '../vendor/cortico-world-dsh-memory/src/world.ts';
import { dshMemoryDefaults, type DshMemoryConfigSection } from '../vendor/cortico-world-dsh-memory/src/config.ts';
import { guardedDshMemoryWorld } from '../vendor/cortico-world-dsh-memory/src/guarded-world.ts';
import { ReportingGate } from '../vendor/task-reporting/src/gate.ts';
import { DEFAULT_PRIVATE_ROOT,canonicalPolicyPath,excludedRoots, isExcludedPath } from '../vendor/task-reporting/src/policy.ts';
import { GatewayClient } from '../vendor/conversation-control/src/client.ts';
import { CommandListener } from './command-listener.ts';
import { ScopedGateway } from './scoped-gateway.ts';
import { selectScopeDirectory } from './scope-registry.ts';
import { PACKAGE_VERSION, type SetupRequest, type SetupSnapshot, type ComponentStatus, type ConnectionChecks } from './backend-contract.ts';
import { configFromForm, loopbackEndpoint, optionSchemas, options, paths, resolveConfig, setupForm, TASK_SUPERVISOR_CONFIG_GROUP, type TaskSupervisorConfig } from './config.ts';

interface Component { key: 'conversation'|'codex'|'memory'; world: World & { status?: () => unknown }; state: ComponentStatus; running: boolean;probe?:()=>Promise<unknown>;connection?:()=>ComponentStatus }
interface Options { context: WorldContext<TaskSupervisorConfig>; clock?: () => number }
export function scopeFingerprint(cfg:TaskSupervisorConfig):string{
  const canonical=(path:string)=>{const value=canonicalPolicyPath(path);return process.platform==='win32'?value.toLowerCase():value;};
  const roots=(value:string)=>paths(value,'scope roots').map(canonical).sort();
  const memory=options('memory',cfg.memoryOptions),codex=options('codex',cfg.codexOptions);
  const memoryScope=Object.fromEntries(['sourceMode','dbFile','allowedProjects','includeGlobal','levels','writeEnabled','writeLevels','rawEnabled','rawDir','rawBuckets'].map(key=>[key,memory[key]]));
  const payload={version:1,owner:cfg.ownerQQ,qq:[cfg.commandTransport,cfg.qqEndpoint,cfg.qqAccountId],gateway:[cfg.gatewayEndpoint,cfg.gatewayTokenSecret],
    dsh:{enabled:cfg.dshEnabled,roots:roots(cfg.dshWorkspaceRoots),sessions:cfg.dshSessionsDir?canonical(cfg.dshSessionsDir):'',memory:memoryScope},
    codex:{enabled:cfg.codexEnabled,roots:roots(cfg.codexWorkspaceRoots),sessions:cfg.codexSessionsDir?canonical(cfg.codexSessionsDir):'',includeSubagents:codex.includeSubagents,files:codex.workspaceFileRoots},
    filesEnabled:cfg.workspaceFilesEnabled,exclusions:excludedRoots(paths(cfg.excludedRoots,'excludedRoots')).map(canonical).sort()};
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0,24);
}
const renamed = (name: string): string => name.replace(/^conversationcontrol_/, 'tasksupervisor_conversation_').replace(/^codexbridge_/, 'tasksupervisor_codex_').replace(/^dshmemory_/, 'tasksupervisor_memory_');
function parameterDocs(value: unknown, key = 'input'): unknown {
  if (Array.isArray(value)) return value.map(item => parameterDocs(item,key));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([name,item]) => [name,
    name === 'description' && typeof item === 'string' && /[\u3400-\u9fff]/.test(item) ? `Input: ${key}. See the Task Supervisor environment instructions.` : parameterDocs(item,name)]));
}
export function toolDeclaration(tool: ToolDef): ToolDef {
  const name = renamed(tool.name);
  return { ...tool, name, description: `Task Supervisor ${name.replace(/^tasksupervisor_/, '').replaceAll('_',' ')}. Reads and controls are unavailable while remote supervision is OFF. Preserve source IDs, cursors, scope and native approvals.`,
    parameters: parameterDocs(tool.parameters) as ToolDef['parameters'] };
}
export const statusTool: ToolDef = { name: 'tasksupervisor_status', description: 'Read the remote-supervision switch and component availability only. Does not expose task content or change the switch.',
  tags: ['read'], parameters: { type: 'object', properties: {}, additionalProperties: false }, handler: async () => '' };
export const qqSendTool:ToolDef={name:'tasksupervisor_qq_send',description:'Send a plain text report only to the configured owner private QQ chat while supervision is ON. No recipient or group can be supplied. A transport failure may have sent the message: never automatically retry an uncertain send.',tags:['write'],
  parameters:{type:'object',additionalProperties:false,properties:{text:{type:'string',minLength:1,maxLength:6000,description:'Plain text for the configured owner only.'}},required:['text']},handler:async()=>''};
export function launcherText(script:string,windows:boolean):string{
  return windows?'@echo off\r\nchcp 65001 >nul\r\nwhere node >nul 2>&1\r\nif errorlevel 1 (echo Install Node.js 24 or newer and run this launcher again. & pause & exit /b 1)\r\nnode -e "process.exit(Number(process.versions.node.split(\'.\')[0]) >= 24 ? 0 : 1)"\r\nif errorlevel 1 (echo Node.js 24 or newer is required. & pause & exit /b 1)\r\nnode "'+script.replaceAll('%','%%')+'"\r\npause\r\n':'#!/bin/sh\ncommand -v node >/dev/null 2>&1 || { echo "Install Node.js 24 or newer first."; exit 1; }\nnode -e "process.exit(Number(process.versions.node.split(\'.\')[0]) >= 24 ? 0 : 1)" || { echo "Node.js 24 or newer is required."; exit 1; }\nexec node \''+script.replaceAll("'","'\\''")+'\'\n';
}

export class TaskSupervisorWorld implements World {
  readonly id = 'tasksupervisor';
  private cfg: TaskSupervisorConfig;
  private components: Component[] = [];
  private host?: WorldHost;
  private gate?: ReportingGate;
  private listener?: CommandListener;
  private timer?: ReturnType<typeof setInterval>;
  private modeTask?: Promise<void>;
  private stopping = false;
  private readonly activeTools = new Set<Promise<unknown>>();
  private readonly clock: () => number;
  private dataDir: string;
  private readonly scopeRoot:string;
  private savedConfig?:TaskSupervisorConfig;
  constructor(private readonly opts: Options) {
    this.cfg = resolveConfig(opts.context.cfg); this.clock = opts.clock ?? Date.now;
    this.scopeRoot=this.cfg.stateDir || join(opts.context.dataDir, this.id);
    this.dataDir = join(this.scopeRoot,'scopes',scopeFingerprint(this.cfg));
    this.components = this.makeComponents();
  }
  private secret(name: string): string { return this.opts.context.secret(name) || ''; }
  private gateFile(): string { return join(this.dataDir, 'reporting', 'gate.sqlite'); }
  private makeComponents(): Component[] {
    const cfg = this.cfg, reportingDeniedRoots=paths(cfg.excludedRoots, 'excludedRoots'), deny = excludedRoots(reportingDeniedRoots);
    const common = { reportingOperatorId: cfg.ownerQQ, reportingStateFile: this.gateFile() };
    const parts: Component[] = [];
    if (cfg.dshEnabled || cfg.codexEnabled) {
      const conversation = { ...conversationControlDefaults(), ...options('conversation', cfg.conversationOptions), enabled: true,
        endpoint: cfg.gatewayEndpoint, tokenSecret: cfg.gatewayTokenSecret, operatorIds: JSON.stringify(cfg.ownerQQ ? [cfg.ownerQQ] : []), ...common,
        stateDir: join(this.dataDir,'conversation') } as ConversationControlConfigSection;
      if(!cfg.dshEnabled)conversation.desktopProgressEnabled=false;
      const backend=new ScopedGateway(cfg.gatewayEndpoint,()=>this.secret(cfg.gatewayTokenSecret),{roots:{dsh:cfg.dshEnabled?paths(cfg.dshWorkspaceRoots,'dshWorkspaceRoots'):[],codex:cfg.codexEnabled?paths(cfg.codexWorkspaceRoots,'codexWorkspaceRoots'):[]},denied:deny},conversation.requestTimeoutMs);
      parts.push({ key:'conversation', world:new ConversationControlWorld({ cfg:conversation, dataDir:this.dataDir,
        secret:async()=>this.secret(cfg.gatewayTokenSecret), clock:this.clock,backend,reportingDeniedRoots }), state:{status:'disabled'}, running:false,probe:()=>backend.diagnostics(),connection:()=>backend.connectionStatus() });
    }
    if (cfg.codexEnabled) {
      const codex = { ...codexBridgeDefaults(), ...options('codex',cfg.codexOptions), enabled:true, ...common,
        sessionsDir:cfg.codexSessionsDir, allowedWorkspaces:cfg.codexWorkspaceRoots, deniedWorkspaces:JSON.stringify(deny),
        workspaceFilesEnabled:cfg.workspaceFilesEnabled, stateDir:join(this.dataDir,'codex') } as CodexBridgeConfigSection;
      parts.push({ key:'codex', world:new CodexBridgeWorld({cfg:codex,dataDir:this.dataDir,clock:()=>new Date(this.clock()).toISOString(),reportingDeniedRoots}), state:{status:'disabled'},running:false });
    }
    if (cfg.dshEnabled) {
      const memory = { ...dshMemoryDefaults(), ...options('memory',cfg.memoryOptions), enabled:true,...common,
        workspaceRoots:cfg.dshWorkspaceRoots, workspaceDenied:JSON.stringify(deny), workspaceFilesEnabled:cfg.workspaceFilesEnabled,
        sessionsDir:cfg.dshSessionsDir, watchTrigger:'record',stateDir:join(this.dataDir,'memory') } as DshMemoryConfigSection;
      const world = guardedDshMemoryWorld(new DshMemoryWorld(memory,{dataDir:this.dataDir,clock:()=>new Date(this.clock()).toISOString()}),
        {dataDir:this.dataDir,operatorId:cfg.ownerQQ,stateFile:this.gateFile(),watchTrigger:'record',clock:this.clock,reportingDeniedRoots});
      parts.push({key:'memory',world,state:{status:'disabled'},running:false});
    }
    return parts;
  }
  envPromptVars(): Record<string,string> {
    return Object.assign({}, ...this.components.map(part=>part.world.envPromptVars?.()??{}),
      {'tasksupervisor.owner':this.cfg.ownerQQ,'tasksupervisor.mode':this.gate?.enabled()?'on':'off'});
  }
  tools(): ToolDef[] {
    return [{...statusTool,handler:async()=>JSON.stringify(this.modelStatus())},{...qqSendTool,handler:args=>{
      const task=this.sendOwner(args);this.activeTools.add(task);void task.finally(()=>this.activeTools.delete(task)).catch(()=>{});return task;
    }},...this.components.flatMap(part=>part.world.tools().map(original=>({
      ...toolDeclaration(original),handler:(args:Record<string,unknown>,ctx:Parameters<ToolDef['handler']>[1])=>{
        const run=async():Promise<string|ToolOutcome>=>{
          const active=this.components.find(item=>item.key===part.key),delegate=active?.world.tools().find(item=>item.name===original.name);
          if(this.stopping||!active?.running||!delegate||!this.gate||!this.host)return{failed:true,text:'TASK_SUPERVISOR_UNAVAILABLE: configure and start the requested component.'};
          this.gate.syncCommands(this.host.store);
          if(!this.gate.enabled())return{failed:true,text:'TASK_REPORTING_DISABLED: only the configured owner private QQ message starting with #@ can enable supervision.'};
          const epoch=this.gate.snapshot().epoch;
          let result:string|ToolOutcome;
          try{result=await delegate.handler.call(delegate,args,ctx);}catch{return{failed:true,text:'TASK_SUPERVISOR_TOOL_FAILED: no task body is included in this diagnostic.'};}
          this.gate.syncCommands(this.host.store);
          if(this.stopping||!this.gate.enabled()||this.gate.snapshot().epoch!==epoch)return{failed:true,text:'TASK_REPORTING_CHANGED: supervision changed; withhold this result. Already submitted operations may still run.'};
          return result;
        };
        const task=run();this.activeTools.add(task);void task.finally(()=>this.activeTools.delete(task)).catch(()=>{});return task;
      }
    })))];
  }
  private modelStatus() { this.gate&&this.host&&this.gate.syncCommands(this.host.store);return{reporting:this.gate?.snapshot()??null,components:Object.fromEntries(this.components.map(p=>[p.key,{status:p.state.status}]))}; }
  async start(host:WorldHost):Promise<void>{
    if(this.host)throw new Error('Task Supervisor is already started.');
    this.host=host;this.stopping=false;
    if(!this.cfg.ownerQQ)return;
    try{
      this.dataDir=selectScopeDirectory(this.scopeRoot,scopeFingerprint(this.cfg),paths(this.cfg.excludedRoots,'excludedRoots'));
      this.components=this.makeComponents();
      this.gate=new ReportingGate({stateFile:this.gateFile(),operatorId:this.cfg.ownerQQ,clock:this.clock,deniedRoots:paths(this.cfg.excludedRoots,'excludedRoots')});
      this.gate.syncCommands(host.store);
      for(const part of this.components){
        if(part.key==='conversation'&&!this.secret(this.cfg.gatewayTokenSecret)){part.state={status:'setup-required',error:'GATEWAY_CREDENTIAL_REQUIRED'};continue;}
        try{await part.world.start(host);part.running=true;part.state={status:'ready'};if(part.probe)try{await part.probe();}catch{part.state=part.connection?.()??{status:'offline',error:'GATEWAY_CONNECTION_UNAVAILABLE'};}}
        catch{await part.world.stop().catch(()=>{});part.state={status:'error',error:'COMPONENT_START_FAILED'};}
      }
      if(this.cfg.commandTransport!=='trusted-meta'&&this.cfg.qqEndpoint&&this.cfg.qqAccountId){
        this.listener=new CommandListener({transport:this.cfg.commandTransport as 'snowluma-native'|'onebot-v11',endpoint:this.cfg.qqEndpoint,
          accountId:this.cfg.qqAccountId,operatorId:this.cfg.ownerQQ,token:()=>this.secret(this.cfg.qqTokenSecret),cursorFile:join(this.dataDir,'commands','cursor.json'),host,clock:this.clock,
          isEnabled:()=>{if(this.stopping||!this.gate||!this.host)return false;this.gate.syncCommands(this.host.store);return this.gate.enabled();},
          onCommand:()=>{void this.syncMode();}});this.listener.start();
      }
      this.timer=setInterval(()=>{void this.syncMode();},1000);this.timer.unref();await this.syncMode();
    }catch(error){await this.stop();throw error;}
  }
  private async sendOwner(args:Record<string,unknown>):Promise<string|ToolOutcome>{
    if(this.stopping||!this.host||!this.gate)return{failed:true,text:'TASK_SUPERVISOR_UNAVAILABLE'};
    this.gate.syncCommands(this.host.store);
    if(!this.gate.enabled())return{failed:true,text:'TASK_REPORTING_DISABLED: owner QQ replies are disabled.'};
    if(!this.listener)return{failed:true,text:'QQ_TRANSPORT_REQUIRED: trusted-meta mode delegates replies to the existing QQ extension.'};
    if(Object.keys(args).some(key=>key!=='text')||typeof args.text!=='string'||!args.text.trim()||args.text.length>6000)return{failed:true,text:'INVALID_OWNER_MESSAGE: supply plain text only; recipient is fixed by configuration.'};
    const epoch=this.gate.snapshot().epoch;
    try{
      const receipt=await this.listener.send(args.text);
      this.gate.syncCommands(this.host.store);
      if(this.stopping||!this.gate.enabled()||this.gate.snapshot().epoch!==epoch)return{failed:true,text:JSON.stringify({code:'QQ_SEND_MODE_CHANGED',mayHaveSent:true,...receipt,instruction:'Do not automatically retry.'})};
      return JSON.stringify({ok:true,recipient:`private:${this.cfg.ownerQQ}`,...receipt});
    }catch{return{failed:true,text:JSON.stringify({code:'QQ_SEND_UNKNOWN',mayHaveSent:true,instruction:'Preserve the uncertainty; do not automatically retry.'})};}
  }
  private syncMode():Promise<void>{
    if(this.modeTask)return this.modeTask;
    this.modeTask=(async()=>{
      if(!this.gate||!this.host||this.stopping)return;
      this.gate.syncCommands(this.host.store);
      // The conversation adapter publishes transitions when mounted; a Codex-only/read-only setup still needs mode acknowledgements.
      if(this.components.some(p=>p.key==='conversation'&&p.running))return;
      for(const transition of this.gate.pendingTransitions()){
        if(this.stopping)break;
        const marker=`[tasksupervisor reporting-mode:${transition.epoch}]`;
        const found=this.host.store.grep({source:this.id,keyword:marker,context:0,limit:1});
        const saved=found.length?{cursor:found[0].hitCursor}:await this.host.pushEvent({source:this.id,type:'tasksupervisor.mode',origin:'external',ts:new Date(this.clock()).toISOString(),
          text:marker+`\nThe real owner private QQ command switched remote task supervision ${transition.enabled?'ON':'OFF'}. ${transition.enabled?'Deliver queued completion and human-action facts, then important live boundaries only.':'Retain task notifications locally. Do not read or control DSH/Codex through other routes.'} The switch never approves an action; preserve fresh-origin and draft/confirmation checks.`,
          meta:{enabled:transition.enabled,epoch:transition.epoch,recipient:`private:${this.cfg.ownerQQ}`,originEventCursor:transition.eventCursor}}, {trigger:'flush'});
        this.gate.ackTransition(transition.epoch,saved.cursor);
      }
    })().catch(()=>{}).finally(()=>{this.modeTask=undefined;});return this.modeTask;
  }
  async stop():Promise<void>{
    this.stopping=true;if(this.timer)clearInterval(this.timer);this.timer=undefined;
    await this.listener?.stop();this.listener=undefined;
    await Promise.allSettled([...this.activeTools,...(this.modeTask?[this.modeTask]:[])]);
    const results=await Promise.allSettled(this.components.filter(part=>part.running).map(part=>part.world.stop()));
    const errors=results.filter((result):result is PromiseRejectedResult=>result.status==='rejected').map(result=>result.reason);
    for(const part of this.components){part.running=false;part.state={status:'disabled'};}
    this.gate?.close();this.gate=undefined;this.host=undefined;
    if(errors.length)throw new AggregateError(errors,'Task Supervisor shutdown failed.');
  }
  webUi():WorldWebUiDecl{return{config:[TASK_SUPERVISOR_CONFIG_GROUP],panels:[{id:'setup',title:'Task Supervisor',description:'Configure QQ, scopes and gateway; inspect the shared OFF/ON state.',getMethods:['getSetup']}],
    promptDocs:[{key:'worlds.tasksupervisor.envPrompt',title:'Task Supervisor · Environment',description:'Tool scope, notification policy and native approval boundaries.',role:'envPrompt',path:fileURLToPath(new URL('./ENV_PROMPT.md',import.meta.url)),vars:[{name:'tasksupervisor.owner',description:'Owner QQ account.'},{name:'tasksupervisor.mode',description:'Remote supervision mode.'}]}],
    invoke:async(panel,method,args)=>{if(panel!=='setup')throw new Error('Unsupported panel.');const request=args[0] as SetupRequest|undefined;
      if(method==='getSetup')return this.getSetup();if(method==='checkConnections')return this.checkConnections(request);
      if(method==='applySetup')return this.applySetup(request);if(method==='gatewayInstall')return this.gatewayInstall(request);throw new Error('Unsupported method.');}};}
  private getSetup():SetupSnapshot{
    const statuses=Object.fromEntries(this.components.map(p=>{
      if(!p.running||!p.world.status)return[p.key,{...p.state}];
      const raw=p.world.status()as Record<string,unknown>,state:ComponentStatus={...p.state,...(p.connection?.()??{})};
      const code=typeof raw.currentError==='string'&&raw.currentError?(/^[A-Z][A-Z0-9_]{1,79}$/.test(raw.currentError)?raw.currentError:`${p.key.toUpperCase()}_POLL_FAILED`):undefined;
      const subErrors=raw.errors&&typeof raw.errors==='object'?Object.entries(raw.errors).filter(([,value])=>!!value).map(([key])=>key):[];
      if(code){state.status=/SCOPE|EXCLUSION|INVALID|IDENTITY/.test(code)?'error':'offline';state.error=code;}
      else if(subErrors.length){state.status='error';state.error='MEMORY_SUBCOMPONENT_FAILED';state.subcomponents=subErrors;}
      else if(state.status==='ready'&&(p.key==='conversation'||p.key==='codex'&&raw.watchIntervalSeconds!==0)&&!raw.lastPollAt)state.status='starting';
      const keys=['running','adapter','threads','lastPollAt','lastSuccessAt','lastCheckedAt','pushed','recovered','pushedEvents','pushedItems','polls','failures','deferredCount','deferredOperations','pendingReports','pendingDeliveries','behindThreads','totalDeferredItems','suppressedTerminalItems'];
      state.details=Object.fromEntries(keys.filter(key=>raw[key]!==undefined).map(key=>[key,raw[key]]));
      if(Array.isArray(raw.discoveryWarnings)&&raw.discoveryWarnings.length)state.warningCount=raw.discoveryWarnings.length;
      return[p.key,state];
    }));
    return{version:1,packageVersion:PACKAGE_VERSION,form:setupForm(this.savedConfig??this.cfg),secrets:{qqTokenConfigured:!!this.secret((this.savedConfig??this.cfg).qqTokenSecret),gatewayTokenConfigured:!!this.secret((this.savedConfig??this.cfg).gatewayTokenSecret)},
      gate:this.gate?.snapshot()??null,components:{command:{...(this.listener?.status()??{status:this.cfg.commandTransport==='trusted-meta'?'ready':'setup-required'}),channelMode:this.cfg.commandTransport==='trusted-meta'?'trusted-meta':'owned-private-channel'},conversation:{status:'disabled'},codex:{status:'disabled'},memory:{status:'disabled'},...statuses} as SetupSnapshot['components'],
      pendingRestart:!!this.savedConfig&&scopeFingerprint(this.savedConfig)!==scopeFingerprint(this.cfg),
      optionSchemas:optionSchemas(),warnings:[...(this.savedConfig&&scopeFingerprint(this.savedConfig)!==scopeFingerprint(this.cfg)?['Saved permission changes stopped the previous components immediately. Restart is required to activate the new OFF scope.']:[]),this.cfg.commandTransport==='trusted-meta'?'Advanced reuse mode needs an existing QQ extension providing trusted raw command metadata and owner replies.':'Raw transport includes the owner private chat channel and ON-only owner replies. Do not also monitor the same owner in another QQ World; this package never replaces SnowLuma shared subscriptions.','While OFF, ordinary owner chat is ignored; the original #@ command still toggles supervision. OFF cannot erase previously delivered content or cancel submitted native operations.','Changing owner, source permissions, roots or exclusions creates a separate fresh OFF scope and queue. Previous state directories are retained; previously submitted native tasks continue independently.'],
      steps:['Choose the owner private QQ account and a raw transport, or explicitly select advanced QQ-extension reuse.','Choose explicit DSH/Codex workspace roots and exclusions.','Save credentials in the World panel; install the generated gateway in the external DSH host when native control is required.','Check connections, save and apply. Wait one second, then send a new private #@ to enable; repeat to close.']};
  }
  private input(request?:SetupRequest){const cfg=request?configFromForm(request.form,this.cfg):this.cfg;
    for(const value of Object.values(request?.secrets??{}))if(value!==undefined&&value!==''&&(typeof value!=='string'||/\s/.test(value)||value.length>8192))throw new Error('Invalid secret value.');
    return{cfg,qqToken:request?.secrets?.qqToken||this.secret(cfg.qqTokenSecret),gatewayToken:request?.secrets?.gatewayToken||this.secret(cfg.gatewayTokenSecret)};}
  private async applySetup(request?:SetupRequest){if(!request)throw new Error('Setup form required.');const{cfg}=this.input(request);
    if(!cfg.ownerQQ)throw new Error('Owner QQ is required.');
    if(cfg.commandTransport!=='trusted-meta'&&(!cfg.qqEndpoint||!cfg.qqAccountId))throw new Error('QQ endpoint and bot account are required.');
    const changed=scopeFingerprint(cfg)!==scopeFingerprint(this.cfg);
    if(changed&&this.host)await this.stop();
    if(changed)selectScopeDirectory(this.scopeRoot,scopeFingerprint(cfg),paths(cfg.excludedRoots,'excludedRoots'));
    if(request.secrets?.qqToken)this.opts.context.storeSecret(cfg.qqTokenSecret,request.secrets.qqToken);
    if(request.secrets?.gatewayToken)this.opts.context.storeSecret(cfg.gatewayTokenSecret,request.secrets.gatewayToken);
    this.opts.context.persist(cfg);this.savedConfig=cfg;const restartRequested=request.restart!==false;
    if(restartRequested)await this.opts.context.restart();
    return{ok:true,saved:true,restartRequested,warnings:restartRequested?[]:[changed?'Permission changes were saved and previous components stopped. Restart to activate the new OFF scope.':'Configuration was saved; running components keep their previous configuration until this World is restarted.']};
  }
  private async checkConnections(request?:SetupRequest):Promise<ConnectionChecks>{
    const{cfg,qqToken,gatewayToken}=this.input(request),checks:ConnectionChecks['checks']=[];
    for(const[key,path]of[['dshSessions',cfg.dshEnabled?cfg.dshSessionsDir:''],['codexSessions',cfg.codexEnabled?cfg.codexSessionsDir:'']]as const){
      if(!path){checks.push({id:key,status:'skipped',message:'Source disabled.'});continue;}
      try{if(isExcludedPath(path,paths(cfg.excludedRoots,'excludedRoots')))throw new Error();const info=await stat(path);if(!info.isDirectory())throw new Error();checks.push({id:key,status:'ok',message:'Source directory exists; no conversation content was read.'});}
      catch{checks.push({id:key,status:'error',message:'Source directory is unavailable or excluded.'});}
    }
    if(gatewayToken){try{await new ScopedGateway(cfg.gatewayEndpoint,()=>gatewayToken,{roots:{dsh:cfg.dshEnabled?paths(cfg.dshWorkspaceRoots,'dshWorkspaceRoots'):[],codex:cfg.codexEnabled?paths(cfg.codexWorkspaceRoots,'codexWorkspaceRoots'):[]},denied:excludedRoots(paths(cfg.excludedRoots,'excludedRoots'))},3000).diagnostics();checks.push({id:'gateway',status:'ok',message:'Authenticated loopback gateway health and project scope checks succeeded.'});}
      catch{checks.push({id:'gateway',status:'error',message:'Gateway health failed; verify the external DSH plugin and credential.'});}}
    else checks.push({id:'gateway',status:'skipped',message:'Gateway credential not configured; read-only sources can still operate.'});
    if(cfg.commandTransport==='trusted-meta')checks.push({id:'qq',status:'skipped',message:'Requires a QQ extension producing trusted native taskReportingCommand metadata. Rendered text is never accepted.'});
    else if(!cfg.qqEndpoint||!cfg.qqAccountId)checks.push({id:'qq',status:'error',message:'QQ endpoint and bot account are required.'});
    else if(cfg.commandTransport==='snowluma-native'){
      try{loopbackEndpoint(cfg.qqEndpoint,'native');if(!qqToken)throw new Error();
        const response=await fetch(cfg.qqEndpoint.replace(/\/$/,'')+'/call',{method:'POST',redirect:'error',signal:AbortSignal.timeout(3000),headers:{authorization:`Bearer ${qqToken}`,'content-type':'application/json'},body:JSON.stringify({requestId:randomUUID(),operation:'identity.read',input:{groups:[]}})});
        if(!response.ok)throw new Error();const body=await response.json()as{result?:{accountId?:unknown}};if(String(body.result?.accountId)!==cfg.qqAccountId)throw new Error();
        const roster=await fetch(cfg.qqEndpoint.replace(/\/$/,'')+'/call',{method:'POST',redirect:'error',signal:AbortSignal.timeout(3000),headers:{authorization:`Bearer ${qqToken}`,'content-type':'application/json'},body:JSON.stringify({requestId:randomUUID(),operation:'subscription.read',input:{}})});
        if(!roster.ok)throw new Error();const subscriptions=await roster.json()as{result?:{additionalConversations?:unknown}};if(!Array.isArray(subscriptions.result?.additionalConversations))throw new Error();
        checks.push({id:'qq',status:'ok',message:'Authenticated SnowLuma identity and additive-subscription helper matched. This check did not change subscriptions.'});
      }catch{checks.push({id:'qq',status:'error',message:'SnowLuma identity/helper check failed. Verify endpoint, account and credential, and use the bundled helper with additive subscriptions.'});}
    }else checks.push({id:'qq',status:'skipped',message:'OneBot command frames are checked against configured self_id and the owner after connection; no QQ message is sent.'});
    return{ok:!checks.some(check=>check.status==='error'),checks};
  }
  private async gatewayInstall(request?:SetupRequest){const{cfg,gatewayToken}=this.input(request),port=Number(loopbackEndpoint(cfg.gatewayEndpoint,'gateway').port);
    if(!cfg.ownerQQ||!cfg.dshEnabled&&!cfg.codexEnabled)throw new Error('Choose an owner and at least one explicit project source before preparing an installer.');
    const token=gatewayToken||randomBytes(32).toString('base64url');
    if(token.length<32||/\s/.test(token))throw new Error('Gateway credential must contain at least 32 non-whitespace characters.');
    const kits=join(DEFAULT_PRIVATE_ROOT,'install-kits');await mkdir(kits,{recursive:true,mode:0o700});const kitDirectory=await mkdtemp(join(kits,'kit-'));
    const script=join(kitDirectory,'install-gateway.mjs'),files=['install-gateway.mjs','gateway.mjs','setup.json','.gateway-token'];
    await copyFile(fileURLToPath(new URL('../lib/install-gateway.mjs',import.meta.url)),script);
    await copyFile(fileURLToPath(new URL('../vendor/dsh-conversation-gateway/lib/index.js',import.meta.url)),join(kitDirectory,'gateway.mjs'));
    await writeFile(join(kitDirectory,'setup.json'),JSON.stringify({version:1,options:{enabled:true,port,stateDir:join(homedir(),'.task-supervisor','gateway'),tokenRef:cfg.gatewayTokenSecret,
      dshRoots:cfg.dshEnabled?paths(cfg.dshWorkspaceRoots,'dshWorkspaceRoots'):[],codexRoots:cfg.codexEnabled?paths(cfg.codexWorkspaceRoots,'codexWorkspaceRoots'):[],observeRoots:cfg.dshEnabled?paths(cfg.dshWorkspaceRoots,'dshWorkspaceRoots'):[],
      excludedRoots:paths(cfg.excludedRoots,'excludedRoots'),progressIntervalMs:30000,maxSteps:12,maxRequests:16,maxDurationMs:300000,pollIntervalMs:2000}},null,2),{mode:0o600});
    await writeFile(join(kitDirectory,'.gateway-token'),token+'\n',{mode:0o600});
    if(token!==this.secret(cfg.gatewayTokenSecret))this.opts.context.storeSecret(cfg.gatewayTokenSecret,token);
    const windows=process.platform==='win32',filename=windows?'install-task-supervisor-gateway.cmd':'install-task-supervisor-gateway.sh';
    const content=launcherText(script,windows);
    return{filename,content,installed:false,kind:'local-private-install-kit',kitDirectory,files,runCommand:`node "${script}"`,warning:'Installer prepared locally; not installed yet. The kit contains a private credential. Do not share it. DSH must load this native plugin; the Cortico World cannot replace that host.',
      steps:['Download and run this launcher once on the same computer. Keep the private kit in place until installation finishes.','Choose DSH_HOME and an existing profile such as desktop. The installer displays the exact YAML targets and asks for INSTALL.','The installer preserves other plugins and credentials, backs up existing files, uses native writer locks and writes the managed credential without showing it. Existing gateway definitions require an explicit update confirmation.','Restart the selected DSH host, then check authenticated connections here. The installer does not claim a running gateway.','Codex-only readers need no DSH gateway; native Codex control additionally needs an explicitly configured supported Codex transport.']};
  }
}
