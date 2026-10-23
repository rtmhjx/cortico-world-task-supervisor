import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { GatewayServer } from '../conversation-control/src/server.ts';
import { GatewayClient } from '../conversation-control/src/client.ts';
import { ConversationGateway } from '../conversation-control/src/gateway.ts';
import { DshProgressFeed } from '../conversation-control/src/dsh-progress.ts';
import { type ConversationAdapter, type Conversation } from '../conversation-control/src/contract.ts';
const token = 'isolated-fixture-token-1234567890';
const scratch = join(fixtureScratch, 'conversation-http-tests'); mkdirSync(scratch, { recursive: true });

test('native progress route requires authentication, denies browser origin and preserves source cursors', async () => {
  const dir = mkdtempSync(join(scratch, 'progress-')), workspace = join(dir, 'workspace'); mkdirSync(workspace);
  const feed = new DshProgressFeed({ stateFile: join(dir, 'progress.sqlite'), roots: [workspace] });
  let callback: any;
  feed.start({ on: (_name, cb) => { callback = cb; return () => {}; } });
  callback({ header: { id: 'http-progress-session', cwd: workspace } }, { seq: 1, time: Date.now(), type: 'turn/start', data: { turn: 1 } });
  const gateway = new ConversationGateway({ adapters: [], stateFile: join(dir, 'gateway.sqlite'), identity: 'progress-http-fixture', enabled: false });
  const server = new GatewayServer(gateway, async () => token, 0, feed); await server.start();
  const endpoint = `http://127.0.0.1:${server.address()}`;
  try {
    assert.equal((await fetch(`${endpoint}/v1/dsh-progress`)).status, 401);
    assert.equal((await fetch(`${endpoint}/v1/dsh-progress`, { headers: { Authorization: `Bearer ${token}`, Origin: 'http://localhost' } })).status, 403);
    const client = new GatewayClient(endpoint, async () => token), page = await client.progress(0);
    assert.equal(page.events.length, 1); assert.equal(page.events[0].sessionId, 'http-progress-session');
    assert.equal((await client.progress(page.nextCursor)).events.length, 0);
    await assert.rejects(client.progress(-1), (error: any) => error.code === 'INVALID_ARGUMENT');
  } finally { await server.stop(); await feed.stop(); await gateway.dispose(); }
});
test('真实loopback HTTP认证、Origin拒绝、暂停受理和端口释放', async () => {
  const target: Conversation = { framework: 'dsh', id: 'fixture-chat', title: '项目检查', workspace: fixtureWorkspace, lastActivityAt: new Date().toISOString(), summary: '', revision: '1', status: 'idle', capabilities: ['check'], source: 'fixture' };
  let prompts = 0;
  const adapter: ConversationAdapter = { framework: 'dsh', async list() { return [target]; }, async get() { return target; }, async execute(r) { prompts++; return { operationId: r.operationId, framework: r.framework, targetId: r.targetId, status: 'accepted', at: new Date().toISOString() }; }, async observe(receipt) { return receipt; } };
  const gateway = new ConversationGateway({ adapters: [adapter], stateFile: join(mkdtempSync(join(scratch, 'run-')), 'gateway.sqlite'), identity: 'fixture', enabled: false });
  const server = new GatewayServer(gateway, async () => token, 0); await server.start(); const endpoint = `http://127.0.0.1:${server.address()}`;
  try {
    assert.equal((await fetch(`${endpoint}/v1/health`)).status, 401);
    assert.equal((await fetch(`${endpoint}/v1/health`, { headers: { Authorization: `Bearer ${token}`, Origin: 'http://localhost' } })).status, 403);
    const client = new GatewayClient(endpoint, async () => token);
    assert.equal((await client.list({ query: '项目', limit: 5 }))[0].title, target.title);
    await assert.rejects(client.execute({ operationId: 'operation-http-fixture', framework: 'dsh', targetId: target.id, action: 'check', prompt: '检查', expectedRevision: '1' }), (error: unknown) => (error as { code: string }).code === 'ADMISSION_PAUSED');
    assert.equal(prompts, 0);
    const forbidden = await fetch(`${endpoint}/v1/operations`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'fake' }) }); assert.equal(forbidden.status, 409);
  } finally { await server.stop(); await gateway.dispose(); }
  await assert.rejects(fetch(`${endpoint}/v1/health`));
});

test('HTTP客户端断开后，尚在gateway队列中的命令不进入原生prompt', async () => {
  const target: Conversation = { framework: 'dsh', id: 'queue-fixture', title: null, workspace: fixtureWorkspace, lastActivityAt: new Date().toISOString(), summary: '', revision: '1', status: 'idle', capabilities: ['continue'], source: 'fixture' };
  let release: () => void = () => {}, started: () => void = () => {}; const start = new Promise<void>(resolve => { started = resolve; }), blocked = new Promise<void>(resolve => { release = resolve; });
  const calls: string[] = [];
  const adapter: ConversationAdapter = { framework: 'dsh', async list() { return [target]; }, async get() { return target; }, async observe(receipt) { return receipt; }, async execute(r) { calls.push(r.operationId); started(); await blocked; return { operationId: r.operationId, framework: r.framework, targetId: r.targetId, status: 'completed', at: new Date().toISOString() }; } };
  const gateway = new ConversationGateway({ adapters: [adapter], stateFile: join(mkdtempSync(join(scratch, 'abort-')), 'gateway.sqlite'), identity: 'fixture', enabled: true });
  const server = new GatewayServer(gateway, async () => token, 0); await server.start(); const client = new GatewayClient(`http://127.0.0.1:${server.address()}`, async () => token);
  const request = { framework: 'dsh' as const, targetId: target.id, action: 'continue' as const, prompt: '继续', expectedRevision: '1' };
  try {
    const first = client.execute({ ...request, operationId: 'first-queue-operation' }); await start;
    const controller = new AbortController(); const second = client.execute({ ...request, operationId: 'second-queue-operation' }, controller.signal).then(() => 'unexpected-success', () => 'aborted');
    await new Promise(resolve => setTimeout(resolve, 40)); controller.abort(); assert.equal(await second, 'aborted');
    await new Promise(resolve => setTimeout(resolve, 20)); release(); await first;
    await new Promise(resolve => setTimeout(resolve, 40)); assert.deepEqual(calls, ['first-queue-operation']);
  } finally { release(); await server.stop(); await gateway.dispose(); }
});
