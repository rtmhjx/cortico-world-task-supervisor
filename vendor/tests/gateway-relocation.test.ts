import { fixtureRoot, fixtureWorkspace } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { GatewayClient } from '../conversation-control/src/client.ts';

test('relocated native Gateway is self-contained and enforces configured exclusions in discovery and progress', { timeout: 15000 }, async t => {
  const isolated = mkdtempSync(join(fixtureRoot, 'isolated-gateway-'));
  const bundle = new URL('../dsh-conversation-gateway/lib/index.js', import.meta.url);
  const relocated = join(isolated, 'gateway.mjs'); copyFileSync(bundle, relocated);
  assert.doesNotMatch(readFileSync(relocated, 'utf8'), /\bfrom\s*["'](?:ws|cortico\/)/);
  const native = await import(pathToFileURL(relocated).href);
  assert.equal(native.name, 'conversation-gateway');
  const reserved = createServer(); await new Promise<void>(resolve => reserved.listen(0, '127.0.0.1', resolve));
  const port = (reserved.address() as { port: number }).port; await new Promise<void>(resolve => reserved.close(() => resolve()));
  const denied = join(fixtureWorkspace, 'excluded-project'), allowed = join(fixtureWorkspace, 'ordinary-project'); mkdirSync(denied); mkdirSync(allowed);
  const observed: string[] = [], headers = [{ id: 'native-denied', cwd: denied }, { id: 'native-allowed', cwd: allowed }];
  const callbacks = new Map<string, (...args: any[]) => void>(); const disposers: Array<() => Promise<void>> = [];
  const syntheticToken = 'synthetic-test-gateway-credential-only';
  const ctx = {
    get(name: string): unknown {
      if (name === 'credentials') return { resolve: async () => ({ value: syntheticToken }) };
      if (name === 'agents') return { get: () => undefined };
      if (name === 'sessionQuery') return {
        listSessions: async () => headers.map(header => ({ header })),
        observeSession: async (id: string) => { observed.push(id); return { header: headers.find(header => header.id === id)!, events: [], [Symbol.dispose]() {} }; },
      };
      return undefined;
    },
    on(name: string, callback: (...args: any[]) => void) { callbacks.set(name, callback); return () => { callbacks.delete(name); }; },
    effect(factory: () => () => Promise<void>) { const dispose = factory(); disposers.push(dispose); return dispose; },
  };
  await native.apply(ctx, { enabled: false, port, stateDir: join(isolated, 'state'), tokenRef: 'SYNTHETIC_GATEWAY_TOKEN', dshRoots: [fixtureWorkspace], observeRoots: [fixtureWorkspace], excludedRoots: [denied] });
  t.after(async () => { for (const dispose of disposers.reverse()) await dispose(); });
  const client = new GatewayClient(`http://127.0.0.1:${port}`, () => syntheticToken);
  const health: any = await client.diagnostics();
  assert.ok(health.searchScope.excludedRoots.includes(denied));
  assert.deepEqual(health.progress.roots, [fixtureWorkspace]);
  assert.ok(health.progress.excludedRoots.includes(denied));
  const candidates = await client.list({ query: '', limit: 5 });
  assert.deepEqual(candidates.map(item => item.id), ['native-allowed'], JSON.stringify({ diagnostics: await client.diagnostics(), observed }));
  assert.deepEqual(observed, []);
  await client.get('dsh', 'native-allowed');
  await assert.rejects(client.get('dsh', 'native-denied'), /WORKSPACE_DENIED|workspace|outside/i);
  assert.deepEqual(observed, ['native-allowed']);
  const emit = callbacks.get('session/event')!;
  const time = Date.now() + 10;
  for (const header of headers) {
    emit({ header }, { seq: 0, type: 'turn/start', time, data: { turn: 1 } });
    emit({ header }, { seq: 1, type: 'turn/end', time: time + 1, data: { turn: 1, reason: { kind: 'completed' } } });
  }
  const progress = await client.progress(0);
  assert.equal(progress.events.length, 2);
  assert.ok(progress.events.every(event => event.sessionId === 'native-allowed'));
  await assert.rejects(native.apply(ctx, { port, stateDir: join(isolated, 'other-state'), tokenRef: 'SYNTHETIC_GATEWAY_TOKEN', dshRoots: [fixtureWorkspace], excludedRoots: [] }), /policy changed/);
  for (const dispose of disposers) await dispose();
  const freshUrl = pathToFileURL(relocated); freshUrl.search = 'policy-reload=1';
  const fresh = await import(freshUrl.href);
  await assert.rejects(fresh.apply(ctx, { enabled: false, port, stateDir: join(isolated, 'state'), tokenRef: 'SYNTHETIC_GATEWAY_TOKEN', dshRoots: [fixtureWorkspace], observeRoots: [fixtureWorkspace], excludedRoots: [] }), /identity|preserve|belongs/i);
});
