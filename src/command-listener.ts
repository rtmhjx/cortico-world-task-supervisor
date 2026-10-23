/** Owner-only private QQ transport. Never replaces another client's shared subscriptions. */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';
import type { EventEnvelope, WorldHost } from 'cortico/core/types.ts';
import type { ComponentStatus } from './backend-contract.ts';
import { loopbackEndpoint } from './config.ts';

interface ListenerOptions {
  transport: 'snowluma-native' | 'onebot-v11'; endpoint: string; accountId: string; operatorId: string;
  token: () => string; cursorFile: string; host: WorldHost; clock?: () => number; onCommand?: () => void;
  isEnabled: () => boolean;
}
interface RawCommand { messageId: string; userId: string; at: string }
interface RawMessage extends RawCommand { text: string; command: boolean }
function numeric(value: unknown): string | undefined {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value !== 0 ? String(value) : undefined;
  if (typeof value !== 'string' || !/^-?[1-9]\d{0,15}$/.test(value) || !Number.isSafeInteger(Number(value))) return undefined;
  return value;
}
function prefix(segments: unknown, native: boolean): boolean {
  if (!native && typeof segments === 'string') return segments.startsWith('#@');
  if (!Array.isArray(segments) || !segments.length) return false;
  let text = '';
  for (const raw of segments) {
    if (!raw || typeof raw !== 'object' || raw.type !== 'text') break;
    const part = native ? raw.text : raw.data?.text;
    if (typeof part !== 'string') return false;
    text += part;
    if (text.length >= 2) return text.startsWith('#@');
  }
  return false;
}
/** This function only accepts a native authenticated transport payload, never rendered World text. */
export function nativeCommand(raw: Record<string, unknown>, account: string, owner: string): RawCommand | undefined {
  if (raw.kind !== 'friend_message' || numeric(raw.selfUin) !== account || numeric(raw.senderUin) !== owner || account === owner || !prefix(raw.elements, true)) return undefined;
  const messageId = numeric(raw.nativeId), seconds = raw.time;
  if (!messageId || typeof seconds !== 'number' || !Number.isFinite(seconds)) return undefined;
  const date = new Date(seconds * 1000); if (!Number.isFinite(date.getTime())) return undefined;
  return { messageId, userId: owner, at: date.toISOString() };
}
export function oneBotCommand(raw: Record<string, unknown>, account: string, owner: string): RawCommand | undefined {
  if (raw.post_type !== 'message' || raw.message_type !== 'private' || raw.sub_type === 'group'
    || numeric(raw.self_id) !== account || numeric(raw.user_id) !== owner || account === owner || !prefix(raw.message, false)) return undefined;
  const messageId = numeric(raw.message_id), seconds = raw.time;
  if (!messageId || typeof seconds !== 'number' || !Number.isFinite(seconds)) return undefined;
  const date = new Date(seconds * 1000); if (!Number.isFinite(date.getTime())) return undefined;
  return { messageId, userId: owner, at: date.toISOString() };
}
function body(segments:unknown,native:boolean):string {
  if(!native&&typeof segments==='string')return segments;
  if(!Array.isArray(segments))return '';
  return segments.map(raw=>{
    if(!raw||typeof raw!=='object')return '[unsupported]';
    if(raw.type==='text')return typeof(native?raw.text:raw.data?.text)==='string'?(native?raw.text:raw.data.text):'';
    return `[${String(raw.type).replace(/[^a-z0-9_-]/gi,'').slice(0,30)||'unsupported'}]`;
  }).join('');
}
export function privateMessage(raw:Record<string,unknown>,account:string,owner:string,native:boolean):RawMessage|undefined {
  if(native){if(raw.kind!=='friend_message'||numeric(raw.selfUin)!==account||numeric(raw.senderUin)!==owner||account===owner)return undefined;}
  else if(raw.post_type!=='message'||raw.message_type!=='private'||raw.sub_type==='group'||numeric(raw.self_id)!==account||numeric(raw.user_id)!==owner||account===owner)return undefined;
  const messageId=numeric(native?raw.nativeId:raw.message_id),seconds=raw.time;
  if(!messageId||typeof seconds!=='number'||!Number.isFinite(seconds))return undefined;
  const date=new Date(seconds*1000);if(!Number.isFinite(date.getTime()))return undefined;
  const segments=native?raw.elements:raw.message,text=body(segments,native);
  if(!text||text.length>32000)return undefined;
  return{messageId,userId:owner,at:date.toISOString(),text,command:prefix(segments,native)};
}
export function commandEvent(command: RawMessage, adapter: string,accountId:string): Omit<EventEnvelope, 'cursor'> {
  return { source: 'qq', type: 'qq.message', origin: 'external', ts: command.at, senderKey: command.userId,
    text: `#${command.messageId} [private] Owner(${command.userId}): ${command.text}`, meta: { message_id: Number(command.messageId), user_id: command.userId,
      conv: { kind: 'private', id: command.userId }, ...(command.command?{taskReportingCommand:{version:1,token:'#@'}}:{}),
      taskSupervisorChannel: { adapter, accountId, version: 1 } } };
}
interface Checkpoint { accountId: string; operatorId: string; endpoint: string; transport: string; cursor: number; armedAt: number }
export class CommandListener {
  private controller?: AbortController;
  private loop?: Promise<void>;
  private socket?: WebSocket;
  private checkpoint: Checkpoint;
  private readonly clock: () => number;
  private ledger?:DatabaseSync;
  private pendingApi=new Map<string,{resolve:(value:unknown)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
  private state: ComponentStatus = { status: 'disabled' };
  constructor(private options: ListenerOptions) {
    loopbackEndpoint(options.endpoint, options.transport === 'snowluma-native' ? 'native' : 'ws');
    if (!/^[1-9]\d{4,15}$/.test(options.accountId) || !/^[1-9]\d{4,15}$/.test(options.operatorId) || options.accountId === options.operatorId) throw new Error('QQ bot account and owner must be distinct numeric IDs.');
    this.clock = options.clock ?? Date.now;
    this.checkpoint = { accountId: options.accountId, operatorId: options.operatorId, endpoint: options.endpoint,
      transport: options.transport, cursor: 0, armedAt: (Math.floor(this.clock() / 1000)+1) * 1000 };
    if (existsSync(options.cursorFile)) {
      const saved = JSON.parse(readFileSync(options.cursorFile, 'utf8')) as Checkpoint;
      for (const key of ['accountId','operatorId','endpoint','transport'] as const) if (saved[key] !== this.checkpoint[key]) throw new Error('QQ command listener identity changed; preserve its old cursor file.');
      if (!Number.isSafeInteger(saved.cursor) || saved.cursor < 0 || !Number.isSafeInteger(saved.armedAt) || saved.armedAt < 0) throw new Error('Invalid QQ command cursor.');
      this.checkpoint = saved;
    }
  }
  status(): ComponentStatus { return { ...this.state, transport: this.options.transport, cursor: this.checkpoint.cursor,armed:this.clock()>=this.checkpoint.armedAt }; }
  start(): void {
    if (this.controller) throw new Error('QQ command listener is already started.');
    this.persist();this.ledger=new DatabaseSync(this.options.cursorFile+'.sqlite');
    this.ledger.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS qq_inbound(message_id TEXT PRIMARY KEY,payload TEXT,host_cursor INTEGER);');
    this.controller = new AbortController(); this.state = { status: 'starting' };
    this.loop = this.run(this.controller.signal);
  }
  async stop(): Promise<void> {
    this.controller?.abort(); this.socket?.close(); await this.loop;
    this.controller = undefined; this.loop = undefined; this.state = { status: 'disabled' };this.ledger?.close();this.ledger=undefined;
    for(const pending of this.pendingApi.values()){clearTimeout(pending.timer);pending.reject(new Error('QQ_CHANNEL_STOPPED'));}this.pendingApi.clear();
  }
  private persist(): void {
    mkdirSync(dirname(this.options.cursorFile), { recursive: true });
    const temporary = this.options.cursorFile + '.tmp';
    writeFileSync(temporary, JSON.stringify(this.checkpoint) + '\n', { mode: 0o600 }); renameSync(temporary, this.options.cursorFile);
  }
  private async save(command: RawMessage | undefined): Promise<void> {
    if (!command||!this.ledger) return;
    const known=this.ledger.prepare('SELECT host_cursor FROM qq_inbound WHERE message_id=?').get(command.messageId);
    if(known?.host_cursor)return;
    const at = Date.parse(command.at), now = this.clock();
    if (at < this.checkpoint.armedAt || at > now + 5000 || now - at > 300000) return;
    if(!known&&!command.command&&!this.options.isEnabled())return;
    const event=commandEvent(command,this.options.transport,this.options.accountId);
    this.ledger.prepare('INSERT OR IGNORE INTO qq_inbound(message_id,payload) VALUES(?,?)').run(command.messageId,JSON.stringify(event));
    await this.deliverPending(command.messageId);
  }
  private async deliverPending(id?:string):Promise<void>{
    if(!this.ledger)return;
    const rows=id?this.ledger.prepare('SELECT * FROM qq_inbound WHERE message_id=? AND host_cursor IS NULL').all(id):this.ledger.prepare('SELECT * FROM qq_inbound WHERE host_cursor IS NULL ORDER BY rowid').all();
    for(const row of rows){
      if(this.controller?.signal.aborted)break;
      const event=JSON.parse(String(row.payload))as Omit<EventEnvelope,'cursor'>;
      if(!event.meta?.taskReportingCommand&&!this.options.isEnabled())continue;
      const hits=this.options.host.store.grep({source:'qq',keyword:`#${row.message_id} `,context:0,limit:100});
      const existing=hits.map(hit=>this.options.host.store.get(hit.hitCursor)).find(hit=>hit?.type==='qq.message'&&String(hit.meta?.message_id)===row.message_id&&hit.senderKey===this.options.operatorId&&(hit.meta?.conv as{kind?:string;id?:unknown}|undefined)?.kind==='private'&&String((hit.meta?.conv as{id?:unknown})?.id)===this.options.operatorId);
      const saved=existing??await this.options.host.pushEvent(event,{trigger:'flush'});
      this.ledger.prepare('UPDATE qq_inbound SET host_cursor=?,payload=NULL WHERE message_id=?').run(saved.cursor,row.message_id);
      if(event.meta?.taskReportingCommand)this.options.onCommand?.();
    }
  }
  private async nativeFrame(frame: Record<string, unknown>): Promise<void> {
    if (frame.type === 'bridge.status') {
      if (frame.protocol !== 'snowluma-native/v1' || String(frame.accountId) !== this.options.accountId) throw new Error('NATIVE_IDENTITY_MISMATCH');
      if(frame.connected!==true){this.state={status:'offline'};return;}
      const result=await this.nativeCall('subscription.add',{conversations:[{kind:'private',id:Number(this.options.operatorId)}]});
      const conversations=result&&typeof result==='object'?(result as{conversations?:unknown}).conversations:undefined;
      const added=result&&typeof result==='object'?(result as{additionalConversations?:unknown}).additionalConversations:undefined;
      if(!Array.isArray(conversations)||!Array.isArray(added)||!conversations.some(item=>item?.kind==='private'&&numeric(item.id)===this.options.operatorId)||!added.some(item=>item?.kind==='private'&&numeric(item.id)===this.options.operatorId))throw new Error('SNOWLUMA_HELPER_UPGRADE_REQUIRED');
      this.state={status:'ready'};return;
    }
    if (this.state.status!=='ready'||frame.type !== 'bridge.event' || !frame.event || typeof frame.event !== 'object' || Array.isArray(frame.event)
      || !Number.isSafeInteger(frame.cursor) || Number(frame.cursor) <= this.checkpoint.cursor) return;
    const raw = frame.event as Record<string, unknown>;
    if (numeric(raw.selfUin) !== this.options.accountId) throw new Error('NATIVE_IDENTITY_MISMATCH');
    await this.save(privateMessage(raw, this.options.accountId, this.options.operatorId,true));
    this.checkpoint.cursor = Number(frame.cursor); this.persist();
  }
  private async stream(signal: AbortSignal): Promise<void> {
    const base = this.options.endpoint.replace(/\/$/, '');
    const response = await fetch(`${base}/events?after=${this.checkpoint.cursor}`, { redirect: 'error', signal,
      headers: { authorization: `Bearer ${this.options.token()}` } });
    if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('NATIVE_STREAM_UNAVAILABLE');
    const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); if (buffer.length > 32 * 1024 * 1024) throw new Error('NATIVE_FRAME_TOO_LARGE');
        let index: number;
        while ((index = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, index); buffer = buffer.slice(index + 2);
          const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
          if (data) await this.nativeFrame(JSON.parse(data));
        }
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    if (!signal.aborted) throw new Error('NATIVE_STREAM_ENDED');
  }
  private websocket(signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.options.endpoint, { maxPayload: 32 * 1024 * 1024,
        headers: this.options.token() ? { Authorization: `Bearer ${this.options.token()}` } : {} });
      this.socket = ws; let serial = Promise.resolve();
      const abort = () => { ws.close(); resolve(); };
      signal.addEventListener('abort', abort, { once: true });
      ws.on('open', () => {void this.oneBotCall('get_login_info',{}).then(identity=>{
        if(!identity||typeof identity!=='object'||numeric((identity as{user_id?:unknown}).user_id)!==this.options.accountId)throw new Error('QQ_ACCOUNT_MISMATCH');
        this.state={status:'ready'};
      }).catch(()=>{this.state={status:'error',error:'QQ_ACCOUNT_IDENTITY_UNVERIFIED'};ws.close();reject(new Error('QQ_ACCOUNT_IDENTITY_UNVERIFIED'));});});
      ws.on('message', data => {
        serial = serial.then(async () => {
          const event = JSON.parse(data.toString()) as Record<string, unknown>;
          const pending=typeof event.echo==='string'?this.pendingApi.get(event.echo):undefined;
          if(pending){clearTimeout(pending.timer);this.pendingApi.delete(String(event.echo));if(event.status==='ok'&&event.retcode===0)pending.resolve(event.data);else pending.reject(new Error('ONEBOT_SEND_REJECTED'));return;}
          if(this.state.status!=='ready')return;
          await this.save(privateMessage(event, this.options.accountId, this.options.operatorId,false));
        }).catch(() => { ws.close(); reject(new Error('ONEBOT_EVENT_REJECTED')); });
      });
      ws.on('error', () => reject(new Error('ONEBOT_CONNECTION_FAILED')));
      ws.on('close', () => { signal.removeEventListener('abort', abort); serial.then(() => signal.aborted ? resolve() : reject(new Error('ONEBOT_CONNECTION_CLOSED'))); });
    });
  }
  private async run(signal: AbortSignal): Promise<void> {
    let delay = 1000;
    while (!signal.aborted) {
      try {
        if (!this.options.token() && this.options.transport === 'snowluma-native') throw new Error('QQ_CREDENTIAL_UNAVAILABLE');
        await this.deliverPending();
        await (this.options.transport === 'snowluma-native' ? this.stream(signal) : this.websocket(signal)); delay = 1000;
      } catch(error) { if (!signal.aborted) this.state =error instanceof Error&&['SNOWLUMA_HELPER_UPGRADE_REQUIRED','NATIVE_IDENTITY_MISMATCH'].includes(error.message)?{status:'error',error:error.message}:{ status: 'offline', error: 'QQ_COMMAND_CONNECTION_UNAVAILABLE' }; }
      if (signal.aborted) break;
      await new Promise<void>(resolve => {
        const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
        const timer = setTimeout(finish, delay); signal.addEventListener('abort', finish, { once: true });
      });
      delay = Math.min(30000, delay * 2);
    }
  }
  private async nativeCall(operation:string,input:Record<string,unknown>):Promise<unknown>{
    if(!this.controller)throw new Error('QQ_CHANNEL_UNAVAILABLE');
    const response=await fetch(this.options.endpoint.replace(/\/$/,'')+'/call',{method:'POST',redirect:'error',signal:AbortSignal.any([this.controller.signal,AbortSignal.timeout(10000)]),headers:{authorization:`Bearer ${this.options.token()}`,'content-type':'application/json'},body:JSON.stringify({requestId:randomUUID(),operation,input})});
    if(!response.ok)throw new Error(operation==='subscription.add'?'SNOWLUMA_HELPER_UPGRADE_REQUIRED':'QQ_SEND_UNKNOWN');
    const value=await response.json()as{result?:unknown;error?:unknown};if(value.error)throw new Error(operation==='subscription.add'?'SNOWLUMA_HELPER_UPGRADE_REQUIRED':'QQ_SEND_REJECTED');return value.result;
  }
  private oneBotCall(action:string,params:Record<string,unknown>):Promise<unknown>{
    const ws=this.socket;if(!ws||ws.readyState!==WebSocket.OPEN)return Promise.reject(new Error('QQ_CHANNEL_UNAVAILABLE'));
    const echo=randomUUID();return new Promise<unknown>((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pendingApi.delete(echo);reject(new Error('QQ_SEND_UNKNOWN'));},10000);this.pendingApi.set(echo,{resolve,reject,timer});
      ws.send(JSON.stringify({action,params,echo}),error=>{if(error){clearTimeout(timer);this.pendingApi.delete(echo);reject(new Error('QQ_SEND_UNKNOWN'));}});
    });
  }
  async send(text:string):Promise<{messageId:string|number|null}>{
    if(!this.controller||this.controller.signal.aborted||this.state.status!=='ready')throw new Error('QQ_CHANNEL_UNAVAILABLE');
    if(typeof text!=='string'||!text.trim()||text.length>6000)throw new Error('Invalid owner message text.');
    let result:unknown;
    if(this.options.transport==='snowluma-native'){
      result=await this.nativeCall('message.send',{conversation:{kind:'private',id:Number(this.options.operatorId)},elements:[{type:'text',text}]});
    }else{
      result=await this.oneBotCall('send_private_msg',{user_id:Number(this.options.operatorId),message:[{type:'text',data:{text}}]});
    }
    const value=result&&typeof result==='object'?result as Record<string,unknown>:{};
    return{messageId:typeof value.messageId==='string'||typeof value.messageId==='number'?value.messageId:typeof value.message_id==='string'||typeof value.message_id==='number'?value.message_id:null};
  }
}
