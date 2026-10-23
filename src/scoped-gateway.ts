/** The UI scope is enforced against the separately installed gateway, rather than merely displayed. */
import { GatewayClient } from '../vendor/conversation-control/src/client.ts';
import { RouteError, type ActionRequest, type Conversation, type Framework } from '../vendor/conversation-control/src/contract.ts';
import { canonicalPolicyPath, containsPath } from '../vendor/task-reporting/src/policy.ts';
interface Scope { roots: Record<Framework,string[]>; denied: string[] }
export function permittedWorkspace(workspace:string,framework:Framework,scope:Scope):boolean {
  if(typeof workspace!=='string'||!workspace)return false;
  const path=canonicalPolicyPath(workspace);
  return scope.roots[framework].some(root=>containsPath(canonicalPolicyPath(root),path))
    &&!scope.denied.some(root=>containsPath(canonicalPolicyPath(root),path));
}
export function assertGatewayScope(health:Record<string,unknown>,scope:Scope,progress=false):void {
  const exposed=health.searchScope as {roots?:Record<Framework,unknown>;excludedRoots?:unknown}|undefined;
  if(!exposed?.roots||!Array.isArray(exposed.excludedRoots))throw new RouteError('GATEWAY_SCOPE_UNVERIFIED','Gateway did not expose its authorization scope.');
  for(const framework of ['dsh','codex']as const){
    const roots=exposed.roots[framework];
    if(!Array.isArray(roots)||roots.some(root=>typeof root!=='string'||!permittedWorkspace(root,framework,scope)))throw new RouteError('GATEWAY_SCOPE_MISMATCH','Gateway project roots exceed this World configuration.');
  }
  const exclusions=exposed.excludedRoots as unknown[];
  for(const deny of scope.denied){
    const needed=Object.values(scope.roots).flat().some(root=>containsPath(canonicalPolicyPath(root),canonicalPolicyPath(deny)));
    if(needed&&!exclusions.some(root=>typeof root==='string'&&containsPath(canonicalPolicyPath(root),canonicalPolicyPath(deny))))throw new RouteError('GATEWAY_EXCLUSIONS_MISMATCH','Gateway does not enforce the configured project exclusions.');
  }
  if(progress){
    const feed=health.progress as {enabled?:boolean;roots?:unknown}|undefined;
    if(!feed?.enabled||!Array.isArray(feed.roots)||feed.roots.some(root=>typeof root!=='string'||!permittedWorkspace(root,'dsh',scope)))throw new RouteError('GATEWAY_PROGRESS_SCOPE_UNVERIFIED','Gateway progress roots are unavailable or exceed this World configuration.');
  }
}
export class ScopedGateway extends GatewayClient {
  private connection:{status:'starting'|'ready'|'offline'|'error';error?:string}={status:'starting'};
  constructor(endpoint:string,secret:()=>string|Promise<string>,private scope:Scope,timeout=10000){super(endpoint,secret,timeout);}
  connectionStatus(){return{...this.connection};}
  private async checked(progress=false){try{const health=await super.diagnostics();assertGatewayScope(health,this.scope,progress);this.connection={status:'ready'};return health;}
    catch(error){const code=error instanceof RouteError?error.code:'GATEWAY_CONNECTION_UNAVAILABLE';this.connection={status:/SCOPE|EXCLUSION|INVALID/.test(code)?'error':'offline',error:code};throw error;}}
  override async diagnostics(){return this.checked();}
  override async list(input:Parameters<GatewayClient['list']>[0]){await this.checked();return(await super.list(input)).filter(item=>permittedWorkspace(item.workspace,item.framework,this.scope));}
  override async get(framework:Framework,id:string,signal?:AbortSignal){await this.checked();const item=await super.get(framework,id,signal);this.target(item);return item;}
  private target(item:Conversation){if(!permittedWorkspace(item.workspace,item.framework,this.scope))throw new RouteError('SCOPE_DENIED','The native conversation is outside this World project roots.');}
  override async execute(request:ActionRequest,signal?:AbortSignal){await this.get(request.framework,request.targetId,signal);return super.execute(request,signal);}
  override async observe(id:string,signal?:AbortSignal){await this.checked();const receipt=await super.observe(id,signal);await this.get(receipt.framework,receipt.targetId,signal);return receipt;}
  override async progress(after:number,limit=50,signal?:AbortSignal){await this.checked(true);const page=await super.progress(after,limit,signal);
    if(page.events.some(item=>!permittedWorkspace(item.workspace,'dsh',this.scope)))throw new RouteError('GATEWAY_PROGRESS_SCOPE_MISMATCH','A progress item is outside the current roots; preserve the cursor for review.');
    return page;}
}
