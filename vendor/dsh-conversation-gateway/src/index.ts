import { configureNativeGatewayExclusions, excludedRoots, isExcludedPath } from '../../task-reporting/src/policy.ts';
/** Existing conversations are delegated separately from bridge-owned task sessions. */
import { isAbsolute, join } from 'node:path';
import { ConversationGateway } from '../../conversation-control/src/gateway.ts';
import { GatewayServer } from '../../conversation-control/src/server.ts';
import { DshConversationAdapter } from '../../conversation-control/src/dsh.ts';
import { DshProgressFeed, type DshProgressContext } from '../../conversation-control/src/dsh-progress.ts';
import { CodexConversationAdapter, type CodexConversationOptions } from '../../conversation-control/src/codex.ts';
import { type ConversationAdapter } from '../../conversation-control/src/contract.ts';
import { allowedDelegationRoot, canonical, within, PROTECTED_ROOT } from '../../conversation-control/src/paths.ts';

export const name = 'conversation-gateway';
export const inject = ['credentials'];
export interface GatewayPluginOptions {
  enabled?: boolean; port?: number; stateDir: string; tokenRef: string;
  dshRoots?: string[]; codexRoots?: string[]; codexEndpoint?: string; codexTokenRef?: string;
  /** Independent read-only observation scope; it grants no conversation control. */
  observeRoots?: string[]; progressIntervalMs?: number;
  excludedRoots?: string[];
  codexDesktopIpc?: CodexConversationOptions['desktopIpc'];
  maxSteps?: number; maxRequests?: number; maxDurationMs?: number; pollIntervalMs?: number;
}
interface PluginContext extends DshProgressContext {
  get(name: string): unknown;
  effect(effect: () => () => Promise<void>, name?: string): () => Promise<void>;
}
export async function apply(ctx: PluginContext, input: GatewayPluginOptions): Promise<void> {
  const options = { enabled: false, port: 3092, dshRoots: [], codexRoots: [], observeRoots: [], excludedRoots: [], progressIntervalMs: 30000, codexEndpoint: '', maxSteps: 12, maxRequests: 16, maxDurationMs: 300000, pollIntervalMs: 2000, ...input };
  if (typeof options.enabled !== 'boolean' || !isAbsolute(options.stateDir) || !/^[A-Z][A-Z0-9_]*$/.test(options.tokenRef) || !Number.isSafeInteger(options.port) || options.port < 1024 || options.port > 65535 || !Number.isSafeInteger(options.pollIntervalMs) || options.pollIntervalMs < 1000 || options.pollIntervalMs > 60000) throw new Error('Invalid conversation gateway configuration.');
  for (const [key, value] of Object.entries({ maxSteps: options.maxSteps, maxRequests: options.maxRequests, maxDurationMs: options.maxDurationMs })) if (!Number.isSafeInteger(value) || value < 1 || value > (key === 'maxDurationMs' ? 300000 : key === 'maxSteps' ? 12 : 16)) throw new Error('Execution budget must not exceed 12 steps / 16 requests / 300000 ms.');
  configureNativeGatewayExclusions(options.excludedRoots);
  const roots = [...options.dshRoots, ...options.codexRoots];
  if (!roots.length || roots.some(root => typeof root !== 'string') || !(await Promise.all(roots.map(root => allowedDelegationRoot(root)))).every(Boolean)) throw new Error('Explicit delegated project roots required.');
  if (!Array.isArray(options.observeRoots) || options.observeRoots.some(root => typeof root !== 'string' || !isAbsolute(root)) || !(await Promise.all(options.observeRoots.map(root => allowedDelegationRoot(root)))).every(Boolean)) throw new Error('Explicit observation roots must be absolute and outside the protected archive.');
  if ((options.codexEndpoint || options.codexDesktopIpc) && !options.codexRoots.length) throw new Error('Codex transport requires explicit project roots.');
  if (options.codexTokenRef && !/^[A-Z][A-Z0-9_]*$/.test(options.codexTokenRef)) throw new Error('Invalid Codex credential reference.');
  const stateDir = await canonical(options.stateDir);
  if (isExcludedPath(stateDir) || roots.some(root => within(stateDir, root))) throw new Error('Gateway state must be outside delegated project roots and the protected archive.');
  const adapters: ConversationAdapter[] = [];
  if (options.dshRoots.length) adapters.push(new DshConversationAdapter(ctx, { roots: options.dshRoots, budget: { maxSteps: options.maxSteps, maxRequests: options.maxRequests, maxDurationMs: options.maxDurationMs } }));
  if (options.codexRoots.length) adapters.push(new CodexConversationAdapter({ endpoint: options.codexEndpoint || undefined, desktopIpc: options.codexDesktopIpc, allowedRoots: options.codexRoots, maxDurationMs: options.maxDurationMs, bearerToken: options.codexTokenRef ? async () => { const credentials = ctx.get('credentials') as { resolve(ref: string): Promise<{ value: string } | undefined> } | undefined; return (await credentials?.resolve(options.codexTokenRef!))?.value; } : undefined }));
  // A process ID pins the live peer for verification; it does not change the delegation scope.
  const { desktopProcessId: _pid, ...desktopIdentity } = options.codexDesktopIpc ?? {};
  const gateway = new ConversationGateway({ adapters, stateFile: join(stateDir, 'gateway.sqlite'), enabled: options.enabled, maxDurationMs: options.maxDurationMs, identity: { dshRoots: options.dshRoots, codexRoots: options.codexRoots, excludedRoots: excludedRoots(), codexEndpoint: options.codexEndpoint, codexDesktopIpc: options.codexDesktopIpc ? desktopIdentity : null, tokenRef: options.tokenRef, codexTokenRef: options.codexTokenRef ?? '', budget: [options.maxSteps, options.maxRequests, options.maxDurationMs] } });
  let progress: DshProgressFeed | undefined;
  try { if (options.observeRoots.length) progress = new DshProgressFeed({ stateFile: join(stateDir, 'progress.sqlite'), roots: options.observeRoots, intervalMs: options.progressIntervalMs }); }
  catch (error) { await gateway.dispose(); throw error; }
  const server = new GatewayServer(gateway, async () => {
    const credentials = ctx.get('credentials') as { resolve(ref: string): Promise<{ value: string } | undefined> } | undefined;
    return (await credentials?.resolve(options.tokenRef))?.value;
  }, options.port, progress);
  let scan: Promise<void> | undefined, timer: ReturnType<typeof setInterval> | undefined, stopped = false, removeEffect: (() => Promise<void>) | undefined;
  const dispose = async () => { if (stopped) return; stopped = true; if (timer) clearInterval(timer); const results = await Promise.allSettled([server.stop(), ...(scan ? [scan] : [])]); try { await progress?.stop(); await gateway.dispose(); } catch (error) { results.push({ status: 'rejected', reason: error }); } const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected'); if (failed.length) throw new AggregateError(failed.map(result => result.reason), 'Gateway shutdown cleanup failed.'); };
  try {
    removeEffect = ctx.effect(() => dispose, 'conversation-gateway.cleanup'); progress?.start(ctx); await server.start();
    timer = setInterval(() => {
      if (scan || stopped) return;
      const health = gateway.health(), operations = health.operations as Array<{ operationId: string; status: string }>;
      scan = (async () => { await progress?.flush(); for (const operation of operations) if (['accepted', 'running', 'waiting_user'].includes(operation.status)) { try { await gateway.observe(operation.operationId); } catch { /* Keep the same operation for observation; never submit again. */ } } })().finally(() => { scan = undefined; });
    }, options.pollIntervalMs); timer.unref();
  } catch (error) { try { await removeEffect?.(); await dispose(); } catch (cleanup) { throw new AggregateError([error, cleanup], 'Conversation gateway activation and cleanup failed.'); } throw error; }
}
