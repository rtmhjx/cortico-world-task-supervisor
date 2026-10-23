import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Socket } from 'node:net';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { join } from 'node:path';
import { once } from 'node:events';
import {createRequire, syncBuiltinESMExports} from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { CodexConversationAdapter, CodexDesktopIpcRpc, CODEX_DESKTOP_PROTOCOL_VERSION, codexUntrustedDesktopInput } from '../conversation-control/src/codex.ts';
import { RouteError, type ActionReceipt, type ActionRequest } from '../conversation-control/src/contract.ts';

const ROOT = fixtureWorkspace, ID = '11111111-1111-4111-8111-111111111111', OTHER = '22222222-2222-4222-8222-222222222222';

test('reviewed 26.1007 desktop keeps scoped native snapshot contract', {skip:process.platform!=='win32'}, async t => {
  const f = await fixture(t, [ROOT], '26.1007.2314.0');
  const result = await f.adapter.get(ID);
  assert.equal(result.id, ID); assert.equal(result.status, 'idle');
  assert.equal(f.native.received.some(wire => /start-turn|interrupt-turn|load-complete-history/.test(wire.method)), false);
});
type Obj = Record<string, any>;
class DesktopFixture {
  state: Obj = { id: ID, cwd: ROOT, updatedAt: Date.now(), threadRuntimeStatus: { type: 'idle', activeFlags: [] }, turns: [], requests: [] };
  received: Obj[] = [];
  sockets = new Set<Socket>();
  failAfterStart = false;
  rejectBusy = false;
  completeInsteadOfInterrupt = false;
  server = createServer(socket => {
    this.sockets.add(socket); socket.once('close', () => this.sockets.delete(socket)); let buffer = Buffer.alloc(0);
    socket.on('data', chunk => { buffer = Buffer.concat([buffer, chunk]); while (buffer.length >= 4) {
      const size = buffer.readUInt32LE(0); if (buffer.length < size + 4) return;
      const wire = JSON.parse(buffer.subarray(4, size + 4).toString()); buffer = buffer.subarray(size + 4);
      this.received.push(wire);
      if (wire.type === 'request') {
        const reply = (result: Obj) => this.send(socket, { type: 'response', requestId: wire.requestId, method: wire.method, resultType: 'success', handledByClientId: 'native-owner', result });
        if (wire.method === 'initialize') { assert.equal(wire.params.clientType, 'cortico-conversation-control-external'); reply({ clientId: 'external-client' }); }
        else if (wire.method === 'thread-owner-discovery') { assert.equal(wire.params.conversationId, ID); reply({ supportsUntrustedAppInput: true }); }
        else if (wire.method === 'thread-follower-start-turn') {
          assert.equal(wire.version, 2); assert.equal(wire.targetClientId, 'native-owner'); assert.equal(wire.hostId, undefined);
          const start = wire.params.turnStart;
          assert.deepEqual(Object.keys(start.request).sort(), ['input', 'threadId']);
          assert.deepEqual(Object.keys(start.context).sort(), ['inheritThreadSettings', 'responseItems']);
          assert.equal(start.context.inheritThreadSettings, true);
          const input = start.request.input[0], element = input.text_elements[0];
          assert.equal(input.text, 'An MCP app initiated this message. Read the untrusted_input tool output.');
          assert.equal(element.byteRange.start, 0); assert.equal(element.byteRange.end, Buffer.byteLength(input.text));
          const untrusted = JSON.parse(element.placeholder.slice('codex-untrusted-app-input:'.length));
          assert.deepEqual(Object.keys(untrusted).sort(), ['message', 'version']); assert.equal(untrusted.message.source, 'mcp_app');
          assert.equal(start.context.responseItems[0].name, 'untrusted_input');
          assert.equal(start.context.responseItems[0].call_id, start.context.responseItems[1].call_id);
          assert.equal(JSON.parse(start.context.responseItems[1].output[0].text).text, untrusted.message.text);
          // Native desktop itself checks idle before AND after preparation. The fixture models rejection.
          if (this.rejectBusy) { this.send(socket, { type: 'response', requestId: wire.requestId, resultType: 'error', error: { message: 'App context must wait until the current turn finishes' } }); continue; }
          const turn = { turnId: 'native-own-turn', status: 'inProgress', items: [] };
          this.state.turns.push(turn); this.state.threadRuntimeStatus = { type: 'active', activeFlags: [] }; this.state.updatedAt++;
          if (this.failAfterStart) { socket.destroy(); continue; }
          reply({ result: { turn: { id: turn.turnId, status: turn.status, items: [] } } });
        } else if (wire.method === 'thread-follower-interrupt-turn') {
          assert.equal(wire.version, 4); assert.equal(wire.params.mode, 'descendant-cleanup'); assert.equal(wire.targetClientId, 'native-owner');
          const exact = this.state.turns.find((turn: Obj) => turn.turnId === wire.params.expectedTurnId && turn.status === 'inProgress');
          if (exact && this.completeInsteadOfInterrupt) { exact.status = 'completed'; exact.items = [{ type: 'agentMessage', phase: 'final_answer', text: 'completed during interrupt race' }]; this.state.threadRuntimeStatus = { type: 'idle' };
            this.send(socket, { type: 'response', requestId: wire.requestId, resultType: 'error', error: { message: 'Native turn is no longer active' } }); continue; }
          if (exact) { exact.status = 'interrupted'; this.state.threadRuntimeStatus = { type: 'idle', activeFlags: [] }; }
          reply({ ok: true, interruptedTurnId: exact?.turnId ?? null });
        } else assert.fail(`Forbidden desktop request ${wire.method}`);
      } else if (wire.type === 'broadcast' && wire.method === 'thread-stream-following-changed') {
        assert.deepEqual(wire.targetClientIds, ['native-owner']); assert.equal(wire.params.conversationId, ID);
        if (wire.params.following) {
          // A different chat and a wrong owner's snapshot must never be used.
          this.snapshot(socket, { ...this.state, id: OTHER }, OTHER, 'native-owner');
          this.snapshot(socket, { ...this.state, cwd: fixtureProtected }, ID, 'intruder');
          this.snapshot(socket, this.state, ID, 'native-owner');
        }
      } else assert.fail('Unexpected fixture traffic');
    } });
  });
  send(socket: Socket, wire: Obj): void { const body = Buffer.from(JSON.stringify(wire)); const frame = Buffer.alloc(body.length + 4); frame.writeUInt32LE(body.length); body.copy(frame, 4); socket.write(frame); }
  snapshot(socket: Socket, state: Obj, id: string, owner: string): void { this.send(socket, { type: 'broadcast', method: 'thread-stream-state-changed', sourceClientId: owner, version: 11, targetClientIds: ['external-client'], params: { hostId: 'local', conversationId: id, change: { type: 'snapshot', revision: 9, conversationState: state } } }); }
}
async function fixture(t: test.TestContext, allowedRoots: string[] = [ROOT], protocolVersion = CODEX_DESKTOP_PROTOCOL_VERSION): Promise<{ native: DesktopFixture; adapter: CodexConversationAdapter; rpc: CodexDesktopIpcRpc; database: string }> {
  const base = join(fixtureScratch); await mkdir(base, { recursive: true }); const folder = await mkdtemp(join(base, 'codex-ipc-test-'));
  const database = join(folder, 'state_5.sqlite'), db = new DatabaseSync(database);
  db.exec("CREATE TABLE threads(id TEXT PRIMARY KEY,cwd TEXT,name TEXT,preview TEXT,updated_at INTEGER,updated_at_ms INTEGER,archived INTEGER,source TEXT DEFAULT 'vscode',thread_source TEXT DEFAULT 'user',agent_path TEXT DEFAULT NULL)");
  db.prepare('INSERT INTO threads(id,cwd,name,preview,updated_at,updated_at_ms,archived) VALUES(?,?,?,?,?,?,0)').run(ID, (process.platform === 'win32' ? '\\\\?\\' + fixtureWorkspace : fixtureWorkspace), '真实线程名', '桥接测试摘要', 1, Date.now());
  db.prepare('INSERT INTO threads(id,cwd,name,preview,updated_at,updated_at_ms,archived) VALUES(?,?,?,?,?,?,0)').run(OTHER, fixtureProtected, 'protected', 'private content must not be selected', 2, Date.now()); db.close();
  const native = new DesktopFixture(), path = `\\\\.\\pipe\\cortico-fixture-${randomUUID()}`;
  native.server.listen(path); await once(native.server, 'listening');
  const rpc = new CodexDesktopIpcRpc({ pipePath: path, stateDbPath: database, protocolVersion, desktopProcessId: 1, allowedRoots, requestTimeoutMs: 1000, verifyRuntime: async () => {} });
  const adapter = new CodexConversationAdapter({ rpc, allowedRoots });
  t.after(async () => { await adapter.dispose(); for (const socket of native.sockets) socket.destroy(); await new Promise<void>(resolve => native.server.close(() => resolve())); await unlink(database); await rmdir(folder); });
  return { native, adapter, rpc, database };
}
async function request(adapter: CodexConversationAdapter, operationId: string, action: ActionRequest['action'] = 'send'): Promise<ActionRequest> {
  return { operationId, framework: 'codex', targetId: ID, action, prompt: '检查桥接契约。', expectedRevision: (await adapter.get(ID)).revision };
}

test('Desktop IPC refuses unimplemented versions and ambiguous transport configuration', {skip:process.platform!=='win32'}, () => {
  assert.throws(() => new CodexDesktopIpcRpc({ pipePath: '\\\\.\\pipe\\codex-ipc', stateDbPath: 'unused', protocolVersion: 'future-version', desktopProcessId: 1, allowedRoots: [ROOT] }), (error: unknown) => error instanceof RouteError && error.code === 'CODEX_DESKTOP_VERSION_UNSUPPORTED');
  assert.throws(() => new CodexConversationAdapter({ allowedRoots: [ROOT], endpoint: 'ws://127.0.0.1:9000', desktopIpc: { pipePath: '\\\\.\\pipe\\codex-ipc', stateDbPath: 'unused', protocolVersion: CODEX_DESKTOP_PROTOCOL_VERSION, desktopProcessId: 1 } }), (error: unknown) => error instanceof RouteError && error.code === 'CODEX_TRANSPORT_CONFLICT');
  const input = codexUntrustedDesktopInput('外部文字', 'native-call'); assert.equal((input.responseItems[0] as Obj).call_id, (input.responseItems[1] as Obj).call_id);
});

test('Desktop runtime path query uses bounded exact-PID Get-Process and retains executable/version identity', {skip:process.platform!=='win32'}, async t => {
  const childProcess=createRequire(import.meta.url)('node:child_process'),original=childProcess.execFile;
  const observed:Array<{file:string,args:string[],options:Obj}>=[];let path='C:\\Program Files\\WindowsApps\\OpenAI.Codex_26.930.3930.0_x64__2p2nqsd0c76g0\\app\\Codex.exe',failure:Error|undefined;
  childProcess.execFile=(file:string,args:string[],options:Obj,callback:(error:Error|null,stdout:string)=>void)=>{observed.push({file,args,options});queueMicrotask(()=>callback(failure??null,path));};syncBuiltinESMExports();
  t.after(()=>{childProcess.execFile=original;syncBuiltinESMExports();});
  const rpc=new CodexDesktopIpcRpc({pipePath:'\\\\.\\pipe\\codex-ipc',stateDbPath:'unused',protocolVersion:CODEX_DESKTOP_PROTOCOL_VERSION,desktopProcessId:690508,allowedRoots:[ROOT],requestTimeoutMs:1000});
  const verification=rpc as unknown as {verifyRuntime():Promise<void>};
  await verification.verifyRuntime();
  assert.equal(observed.length,1);assert.equal(observed[0].file,'powershell.exe');
  assert.deepEqual(observed[0].args,['-NoProfile','-NonInteractive','-Command','Get-Process -Id 690508 -ErrorAction Stop | Select-Object -ExpandProperty Path']);
  assert.equal(observed[0].options.windowsHide,true);assert.equal(observed[0].options.timeout,1000);assert.equal(observed[0].options.maxBuffer,4096);
  for(const wrong of ['',path.replace('26.930.3930.0','26.930.9999.0'),path.replace('Codex.exe','unrelated.exe')]){path=wrong;await assert.rejects(verification.verifyRuntime(),(error:unknown)=>error instanceof RouteError&&error.code==='CODEX_DESKTOP_RUNTIME_CHANGED');}
  failure=Object.assign(Error('fixture access denied or timeout'),{code:'EACCES'});await assert.rejects(verification.verifyRuntime(),{code:'CODEX_DESKTOP_RUNTIME_CHANGED'});
  rpc.dispose();
});

test('Desktop runtime process-query failure stays stopped without automatic reconnect or native traffic', {skip:process.platform!=='win32'}, async t => {
  const childProcess=createRequire(import.meta.url)('node:child_process'),original=childProcess.execFile,failure=Object.assign(Error('fixture timeout'),{code:'ETIMEDOUT'});let queries=0;
  childProcess.execFile=(_file:string,_args:string[],_options:Obj,callback:(error:Error)=>void)=>{queries++;queueMicrotask(()=>callback(failure));};syncBuiltinESMExports();
  t.after(()=>{childProcess.execFile=original;syncBuiltinESMExports();});
  const rpc=new CodexDesktopIpcRpc({pipePath:'\\\\.\\pipe\\codex-ipc',stateDbPath:'unused',protocolVersion:CODEX_DESKTOP_PROTOCOL_VERSION,desktopProcessId:690508,allowedRoots:[ROOT],requestTimeoutMs:1000});
  await assert.rejects(rpc.request('initialize',{}),{code:'CODEX_DESKTOP_RUNTIME_CHANGED'});await assert.rejects(rpc.request('initialize',{}),{code:'CODEX_DESKTOP_RUNTIME_CHANGED'});assert.equal(queries,1);rpc.dispose();
});

test('Desktop real pipe uses truthful handshake, exact authorized metadata and scoped follower snapshot', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t);
  const candidates = await adapter.list({ query: '', limit: 5 }); assert.equal(candidates.length, 1); assert.equal(candidates[0].title, '真实线程名'); assert.equal(candidates[0].summary, '桥接测试摘要');
  assert.equal((await adapter.get(ID)).status, 'idle');
  await assert.rejects(adapter.get(OTHER), (error: unknown) => error instanceof RouteError && error.code === 'WORKSPACE_DENIED');
  assert.equal(native.received.filter(wire => wire.method === 'initialize').length, 1);
  assert.equal(native.received.some(wire => /load-complete-history|approval|settings|resume|start-turn|interrupt-turn/.test(wire.method)), false);
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(native.received.filter(wire => wire.method === 'thread-stream-following-changed' && wire.params.following).length, native.received.filter(wire => wire.method === 'thread-stream-following-changed' && !wire.params.following).length);
});

test('Desktop whole-drive delegation excludes protected and ancestor records before reading name or preview', {skip:process.platform!=='win32'}, async t => {
  const {adapter,database}=await fixture(t,[fixtureRoot]),db=new DatabaseSync(database);
  db.prepare('INSERT INTO threads(id,cwd,name,preview,updated_at,updated_at_ms,archived) VALUES(?,?,?,?,?,?,0)').run(randomUUID(),fixtureProtectedParent,'ancestor must stay unread','ancestor private fixture',2,Date.now());db.close();
  const selections:Array<{sql:string;args:unknown[]}>=[],original=DatabaseSync.prototype.prepare;
  t.mock.method(DatabaseSync.prototype,'prepare',function(this:DatabaseSync,sql:string){
    const statement=original.call(this,sql);const all=statement.all.bind(statement),get=statement.get.bind(statement);
    statement.all=((...args:unknown[])=>{if(/^SELECT/i.test(sql))selections.push({sql,args});return all(...args as any[]);}) as typeof statement.all;
    statement.get=((...args:unknown[])=>{if(/^SELECT/i.test(sql))selections.push({sql,args});return get(...args as any[]);}) as typeof statement.get;
    return statement;
  });
  const candidates=await adapter.list({query:'',limit:5});assert.deepEqual(candidates.map(c=>c.id),[ID]);assert.equal(candidates[0].summary,'桥接测试摘要');
  const initial=selections.find(q=>/FROM threads/i.test(q.sql));assert.ok(initial);assert.match(initial.sql,/^SELECT id,cwd FROM threads/i);assert.doesNotMatch(initial.sql,/preview|name/i);
  const summaries=selections.filter(q=>/preview/i.test(q.sql));assert.equal(summaries.length,1);assert.ok(summaries[0].args.includes(ID));assert.equal(summaries.some(q=>q.args.includes(OTHER)),false);
});

test('Desktop whole-drive pagination continues past a denied 50-record page without reading its previews', {skip:process.platform!=='win32'}, async t => {
  const {adapter,database}=await fixture(t,[fixtureRoot]),db=new DatabaseSync(database),insert=db.prepare('INSERT INTO threads(id,cwd,name,preview,updated_at,updated_at_ms,archived) VALUES(?,?,?,?,?,?,0)');
  for(let i=0;i<50;i++)insert.run(randomUUID(),fixtureProtected,'denied fixture','not read',2,Date.now()+10000+i);db.close();
  const candidates=await adapter.list({query:'',limit:5});assert.deepEqual(candidates.map(c=>c.id),[ID]);
});

test('Desktop metadata excludes anonymous subagents and other nonordinary sources from list and exact get without any native prompt', {skip:process.platform!=='win32'}, async t => {
  const {native,adapter,rpc,database}=await fixture(t),db=new DatabaseSync(database),child=randomUUID(),nonordinary:string[]=[];
  const insert=db.prepare('INSERT INTO threads(id,cwd,name,preview,updated_at,updated_at_ms,archived,source,thread_source,agent_path) VALUES(?,?,?,?,?,?,0,?,?,?)');
  const updated=Date.now()+10000;
  insert.run(child,ROOT,null,'hidden child fixture',1,updated,JSON.stringify({subagent:{parent_thread_id:ID}}),'subagent','/root/hidden_child');
  for(const [source,threadSource,agentPath] of [['subagent','user',null],['vscode','subagent',null],['vscode','user','/root/child'],['api','user',null]]){
    const id=randomUUID();nonordinary.push(id);insert.run(id,ROOT,null,'nonordinary fixture',1,updated,source,threadSource,agentPath);
  }
  const ordinary=[ID];
  for(const source of ['cli','appServer','unknown']){const id=randomUUID();ordinary.push(id);insert.run(id,ROOT,`ordinary ${source}`,'ordinary fixture',1,updated-1000,source,'user',null);}
  db.close();
  const candidates=await adapter.list({query:'',limit:5});assert.deepEqual(candidates.map(value=>value.id).sort(),ordinary.sort());
  await assert.rejects(adapter.get(child),(error:unknown)=>error instanceof RouteError&&error.code==='WORKSPACE_DENIED');
  for(const id of nonordinary)await assert.rejects(rpc.request('thread/read',{threadId:id,includeTurns:false}),(error:unknown)=>error instanceof RouteError&&error.code==='WORKSPACE_DENIED');
  assert.equal(native.received.some(wire=>/thread-owner-discovery|start-turn|interrupt-turn|thread-stream-following-changed/.test(wire.method)),false);
  assert.equal(native.received.filter(wire=>wire.method==='thread-follower-start-turn').length,0);
});

test('Desktop metadata missing pinned source classification columns fails closed before owner lookup or prompt', {skip:process.platform!=='win32'}, async t => {
  for(const column of ['source','thread_source','agent_path'])await t.test(column,async child=>{
    const {native,adapter,database}=await fixture(child),db=new DatabaseSync(database);db.exec(`ALTER TABLE threads DROP COLUMN ${column}`);db.close();
    const schemaError=(error:unknown)=>error instanceof RouteError&&error.code==='CODEX_DESKTOP_SCHEMA_UNSUPPORTED';
    await assert.rejects(adapter.list({query:'',limit:5}),schemaError);await assert.rejects(adapter.get(ID),schemaError);
    assert.equal(native.received.some(wire=>/thread-owner-discovery|start-turn|interrupt-turn|thread-stream-following-changed/.test(wire.method)),false);
  });
});

test('Desktop start follows native untrusted gate, inherits permissions and submits once; exact final only', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t), command = await request(adapter, 'desktop-send');
  const receipt = await adapter.execute(command); await adapter.execute(command);
  assert.equal(receipt.status, 'running'); assert.equal(receipt.turnId, 'native-own-turn'); assert.ok(receipt.deadlineAt);
  assert.equal(native.received.filter(wire => wire.method === 'thread-follower-start-turn').length, 1);
  const exact = native.state.turns[0]; exact.status = 'completed'; exact.items = [{ type: 'reasoning', text: 'SECRET REASONING' }, { type: 'agentMessage', phase: 'commentary', text: 'private progress' }, { type: 'agentMessage', phase: 'final_answer', text: '公开本回合结果' }];
  native.state.turns.push({ turnId: 'another-turn', status: 'completed', items: [{ type: 'agentMessage', phase: 'final_answer', text: 'WRONG TURN' }] }); native.state.threadRuntimeStatus = { type: 'idle' };
  const done = await adapter.observe(receipt); assert.equal(done.status, 'completed'); assert.equal(done.answer, '公开本回合结果'); assert.doesNotMatch(JSON.stringify(done), /SECRET|private progress|WRONG/);
});

test('Desktop native gate rejects a competing start and no steering is attempted', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t), command = await request(adapter, 'desktop-busy'); native.rejectBusy = true;
  const result = await adapter.execute(command); assert.equal(result.status, 'failed'); assert.equal(result.errorCode, 'CODEX_RPC_REJECTED');
  await adapter.execute(command); assert.equal(native.received.filter(wire => wire.method === 'thread-follower-start-turn').length, 1);
  assert.equal(native.received.some(wire => /steer|approval|settings/.test(wire.method)), false);
});

test('Desktop pause is exact native turn only, with no goal or descendant expansion', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t); native.state.turns = [{ turnId: 'human-turn', status: 'inProgress', items: [] }]; native.state.threadRuntimeStatus = { type: 'active' };
  const receipt = await adapter.execute(await request(adapter, 'desktop-pause', 'pause')); assert.equal(receipt.status, 'accepted'); assert.equal(receipt.turnId, 'human-turn');
  assert.equal((await adapter.observe(receipt)).status, 'paused');
  const interrupt = native.received.find(wire => wire.method === 'thread-follower-interrupt-turn'); assert.ok(interrupt); assert.deepEqual(interrupt.params, { conversationId: ID, expectedTurnId: 'human-turn', mode: 'descendant-cleanup' });
  assert.equal(native.received.some(wire => /goal|settings|start-turn|approval/.test(wire.method)), false);
});

test('Desktop waiting_user restores persisted cutoff and never auto-approves', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t); native.state.turns = [{ turnId: 'waiting-turn', status: 'inProgress', items: [] }]; native.state.requests = [{ method: 'item/commandExecution/requestApproval' }]; native.state.threadRuntimeStatus = { type: 'active' };
  const receipt: ActionReceipt = { operationId: 'restored-desktop', framework: 'codex', targetId: ID, action: 'check', turnId: 'waiting-turn', status: 'waiting_user', deadlineAt: new Date(Date.now() + 60000).toISOString(), at: new Date().toISOString() };
  assert.equal((await adapter.observe(receipt)).status, 'waiting_user');
  assert.equal(native.received.some(wire => /approval|permissions|user-input/i.test(wire.method)), false);
  const result = await adapter.observe({ ...receipt, deadlineAt: new Date(Date.now() - 1000).toISOString() });
  // The already armed in-memory cutoff remains authoritative; exercise true restart restoration separately.
  assert.equal(result.status, 'waiting_user');
});

test('Desktop recovered expired cutoff interrupts own turn, and canonical view supplies exact public answer', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t); native.state.turns = [{ turnId: 'restored-turn', status: 'inProgress', items: [] }]; native.state.threadRuntimeStatus = { type: 'active', activeFlags: ['waitingOnApproval'] };
  const receipt: ActionReceipt = { operationId: 'expired-desktop', framework: 'codex', targetId: ID, action: 'continue', turnId: 'restored-turn', status: 'waiting_user', deadlineAt: new Date(Date.now() - 1000).toISOString(), at: new Date().toISOString() };
  await adapter.observe(receipt); assert.equal((await adapter.observe(receipt)).status, 'paused');
  assert.equal(native.received.filter(wire => wire.method === 'thread-follower-interrupt-turn').length, 1);
  native.state.turns = []; native.state.turnHistory = { kind: 'canonical', history: { islands: [{ entries: [{ value: 'turn:restored-turn' }] }], entitiesByKey: { 'turn:restored-turn': { turnId: 'restored-turn', status: 'completed', items: [{ type: 'agentMessage', phase: 'final_answer', text: 'canonical final' }, { type: 'reasoning', text: 'PRIVATE' }] } } } }; native.state.threadRuntimeStatus = { type: 'idle' };
  assert.equal((await adapter.observe({ ...receipt, deadlineAt: undefined })).answer, 'canonical final');
});

test('Desktop post-start disconnect stays unknown and never resubmits', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t), command = await request(adapter, 'desktop-unknown'); native.failAfterStart = true;
  const first = await adapter.execute(command); assert.equal(first.status, 'unknown'); await adapter.execute(command); await adapter.observe(first);
  assert.equal(native.received.filter(wire => wire.method === 'thread-follower-start-turn').length, 1); assert.equal(native.state.turns.length, 1);
});

test('Desktop canonical projection follows native topology and excludes orphan inProgress entities', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter, rpc } = await fixture(t);
  native.state.turnHistory = { kind: 'canonical', history: { islands: [{ entries: [{ value: 'newer' }, { value: 'older' }] }], entitiesByKey: {
    orphan: { turnId: 'orphan-inProgress', status: 'inProgress', items: [{ type: 'agentMessage', text: 'ORPHAN SECRET' }] },
    older: { turnId: 'ordered-second', status: 'completed', items: [] }, newer: { turnId: 'ordered-first', status: 'completed', items: [] },
  } } };
  const response = await rpc.request('thread/read', { threadId: ID, includeTurns: true }) as Obj;
  assert.deepEqual(response.thread.turns.map((turn: Obj) => turn.id), ['ordered-first', 'ordered-second']);
  assert.equal((await adapter.get(ID)).status, 'idle'); assert.doesNotMatch(JSON.stringify(response), /ORPHAN|orphan-inProgress/);
  delete native.state.turnHistory.history.islands;
  await assert.rejects(adapter.get(ID), (error: unknown) => error instanceof RouteError && error.code === 'CODEX_PROTOCOL_INVALID');
});

test('Desktop known-turn unknown permits terminal read-only reconcile after interrupt-completion race', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t), command = await request(adapter, 'desktop-completion-race');
  const receipt = await adapter.execute(command); native.completeInsteadOfInterrupt = true;
  const ambiguous = await adapter.observe({ ...receipt, deadlineAt: new Date(Date.now() - 1000).toISOString() }); assert.equal(ambiguous.status, 'unknown');
  const done = await adapter.observe(ambiguous); assert.equal(done.status, 'completed'); assert.equal(done.answer, 'completed during interrupt race');
  assert.equal(native.received.filter(wire => wire.method === 'thread-follower-start-turn').length, 1);
  assert.equal(native.received.filter(wire => wire.method === 'thread-follower-interrupt-turn').length, 1);
  assert.doesNotMatch(done.detail ?? '', /was interrupted/);
});

test('Desktop cold chat resume refusal is known failed and sends no resume or prompt', {skip:process.platform!=='win32'}, async t => {
  const { native, adapter } = await fixture(t); native.state.threadRuntimeStatus = { type: 'notLoaded' };
  const result = await adapter.execute(await request(adapter, 'desktop-cold-refusal'));
  assert.equal(result.status, 'failed'); assert.equal(result.errorCode, 'CODEX_DESKTOP_COLD_UNSUPPORTED'); assert.equal(result.turnId, undefined);
  assert.equal(native.received.some(wire => /resume|start-turn|interrupt-turn/.test(wire.method)), false);
});
