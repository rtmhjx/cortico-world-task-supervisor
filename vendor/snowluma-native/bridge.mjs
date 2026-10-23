import { createServer } from 'node:http';
import { timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import { mkdirSync, openSync, closeSync, fsyncSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const MESSAGE_KINDS = new Set(['group_message', 'friend_message', 'temp_message']);
const EVENT_KINDS = new Set([...MESSAGE_KINDS, 'group_recall', 'group_member_join', 'group_member_leave', 'group_poke', 'group_msg_emoji_like']);
const encode = (value) => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? String(item) : item instanceof Map ? [...item.values()] : item);
const fault = (code, message, status = 400) => Object.assign(new Error(message), { code, status });
const positive = (value) => Number.isSafeInteger(value) && value > 0;
function validConversations(entries) {
  if (!Array.isArray(entries) || entries.length > 1000 || entries.some(entry => !entry || typeof entry !== 'object' || Array.isArray(entry) || !['group', 'private'].includes(entry.kind) || !positive(entry.id))) throw fault('INVALID_SUBSCRIPTION', 'Invalid conversations');
  return entries;
}
function unionConversations(base, additional) {
  const union = new Map();
  for (const entry of [...base, ...additional]) if (!union.has(`${entry.kind}:${entry.id}`)) union.set(`${entry.kind}:${entry.id}`, entry);
  if (union.size > 1000) throw fault('INVALID_SUBSCRIPTION', 'Combined conversation allowlist exceeds its limit');
  return [...union.values()];
}

export function conversation(event) {
  if (event.kind.startsWith('group_')) return { kind: 'group', id: event.groupId };
  return { kind: 'private', id: event.senderUin === Number(event.selfUin) ? (event.peerUin ?? event.targetUin) : event.senderUin };
}

function fullMessageKey(event) {
  const peer = conversation(event);
  return `sln:${event.selfUin}:${peer.kind}:${peer.id}:${event.senderUin}:${event.msgSeq}:${event.msgId ?? event.time}`;
}

export function messageKey(event) {
  // Preserve the safe-integer identity contract of downstream authorization Worlds.
  // OneBot's signed 32-bit ids cannot overlap this native namespace.
  return 0x100000000 + Number.parseInt(createHash('sha256').update(fullMessageKey(event)).digest('hex').slice(0, 13), 16);
}

export function retiredProtocolView(manager) {
  return {
    getInstances: () => [...manager.sessions].map(([uin, { bridge }]) => ({
      uin, nickname: bridge.identity.nickname, subscribeDebugEvents: () => () => {}, observeActions: () => () => {},
    })), getInstance: () => null,
    getConnectionStatuses: () => [...manager.sessions].map(([uin, { bridge }]) => ({
      uin, nickname: bridge.identity.nickname, connected: !bridge.empty,
      receiveHealthy: bridge.receiveHealthy, adapters: [], protocol: 'snowluma-native/v1',
    })),
    reloadConfig: async () => { throw fault('PROTOCOL_RETIRED', 'OneBot is retired; use SnowLuma native transport', 410); },
    reloadGlobalSettings() {}, async dispose() {},
  };
}

export async function startNativeBridge({ manager, config, configFile, databaseFile, resolveImageUrl, log = console }) {
  config ??= JSON.parse(readFileSync(configFile, 'utf8'));
  if (typeof config.token !== 'string' || config.token.length < 32 || !positive(Number(config.accountId)) || !Array.isArray(config.allowedConversations)) throw new Error('Native bridge account/token/allowlist configuration is invalid');
  validConversations(config.allowedConversations);
  config = { ...config, additionalConversations: validConversations(config.additionalConversations ?? []) };
  unionConversations(config.allowedConversations, config.additionalConversations);
  const accountId = String(config.accountId);
  mkdirSync(dirname(databaseFile), { recursive: true });
  const db = new DatabaseSync(databaseFile);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS events(cursor INTEGER PRIMARY KEY AUTOINCREMENT, event_key TEXT UNIQUE NOT NULL, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, peer_kind TEXT, peer_id INTEGER, sender INTEGER, sequence INTEGER, body TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_peer ON messages(peer_kind,peer_id,sender,sequence);
    CREATE TABLE IF NOT EXISTS outgoing(id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, state TEXT NOT NULL, result TEXT);
  `);
  const streams = new Set();
  const subscriptions = new Map();
  let closing = false;
  let eventChain = Promise.resolve();
  const current = () => manager.getSession(accountId)?.bridge;
  const status = () => {
    const bridge = current();
    return { protocol: 'snowluma-native/v1', capabilities: ['subscription.read', 'subscription.add', 'subscription.remove', 'subscription.replace'], accountId, connected: !!bridge && !bridge.empty && bridge.receiveHealthy,
      nickname: bridge?.identity.nickname ?? '', cursor: Number(db.prepare('SELECT COALESCE(MAX(cursor),0) AS n FROM events').get().n) };
  };
  const frame = (res, value) => {
    if (res.destroyed) return;
    if (res.writableLength > 4 * 1024 * 1024) { res.destroy(); return; }
    res.write(`data: ${encode(value)}\n\n`);
  };
  const broadcast = (value) => { for (const stream of streams) frame(stream, value); };
  function remember(event) {
    if (!MESSAGE_KINDS.has(event.kind)) return event;
    const peer = conversation(event);
    if (!positive(peer.id) || !positive(event.senderUin) || !positive(event.msgSeq)) throw fault('INVALID_MESSAGE_ID', 'Native message has no stable conversation/sequence');
    const value = { ...event, nativeId: messageKey(event), nativeKey: fullMessageKey(event) };
    const previous = db.prepare('SELECT body FROM messages WHERE id=?').get(String(value.nativeId));
    if (previous && JSON.parse(previous.body).nativeKey !== value.nativeKey) throw fault('MESSAGE_ID_COLLISION', 'Native message identity collision; event was not accepted', 409);
    db.prepare('INSERT OR REPLACE INTO messages VALUES(?,?,?,?,?,?)').run(String(value.nativeId), peer.kind, peer.id, event.senderUin, event.msgSeq, encode(value));
    return value;
  }
  function lookup(id) {
    const row = db.prepare('SELECT body FROM messages WHERE id=?').get(String(id));
    if (!row) throw fault('MESSAGE_NOT_FOUND', 'Message is not in the native message store', 404);
    return JSON.parse(row.body);
  }
  async function decorate(event, bridge) {
    const copy = { ...event, elements: event.elements ? await Promise.all(event.elements.map(async (element) => {
      const out = { ...element };
      if (element.type === 'image' && resolveImageUrl) {
        try { out.imageUrl = await resolveImageUrl(bridge, element, event.kind.startsWith('group_')); }
        catch { out.imageUrl = element.imageUrl ?? ''; }
      }
      if (['record', 'video'].includes(element.type) && element.mediaNode) {
        const group = event.kind.startsWith('group_');
        try {
          out.url = group
            ? await bridge.apis.groupFile[element.type === 'record' ? 'getPttUrl' : 'getVideoUrl'](event.groupId, element.mediaNode)
            : await bridge.apis.groupFile[element.type === 'record' ? 'getPrivatePttUrl' : 'getPrivateVideoUrl'](element.mediaNode);
        } catch { out.url = element.url ?? ''; }
      }
      if (element.type === 'reply') {
        const peer = conversation(event);
        const rows = db.prepare('SELECT id FROM messages WHERE peer_kind=? AND peer_id=? AND sender=? AND sequence=? LIMIT 2')
          .all(peer.kind, peer.id, Number(element.replySenderUin ?? 0), Number(element.replySeq ?? 0));
        if (rows.length === 1) out.nativeReplyId = rows[0].id;
      }
      return out;
    })) : undefined };
    if (['group_recall', 'group_msg_emoji_like'].includes(event.kind)) {
      const rows = db.prepare('SELECT id FROM messages WHERE peer_kind=? AND peer_id=? AND sequence=? LIMIT 2').all('group', event.groupId, event.msgSeq);
      if (rows.length === 1) copy.nativeMessageId = rows[0].id;
    }
    return remember(copy);
  }
  async function accept(event, bridge) {
    if (closing || String(event.selfUin) !== accountId || !EVENT_KINDS.has(event.kind)) return;
    const peer = conversation(event);
    const allowed = unionConversations(config.allowedConversations, config.additionalConversations);
    if (allowed && !allowed.some((entry) => entry.kind === peer.kind && entry.id === peer.id)) return;
    const body = await decorate(event, bridge);
    const key = MESSAGE_KINDS.has(body.kind) ? body.nativeKey : createHash('sha256').update(encode(body)).digest('hex');
    const result = db.prepare('INSERT OR IGNORE INTO events(event_key,body) VALUES(?,?)').run(key, encode(body));
    if (result.changes) broadcast({ type: 'bridge.event', cursor: Number(result.lastInsertRowid), event: body });
  }
  function attach(uin, bridge) {
    if (closing || String(uin) !== accountId || subscriptions.has(bridge)) return;
    const off = bridge.events.onAny((event) => {
      eventChain = eventChain.then(() => accept(event, bridge)).catch((error) => log.error(`native event failed: ${error.message}`));
      return eventChain;
    });
    subscriptions.set(bridge, off);
    broadcast({ type: 'bridge.status', ...status() });
  }
  manager.addSessionStartedListener(attach);
  manager.addSessionClosedListener((uin, bridge) => {
    subscriptions.get(bridge)?.(); subscriptions.delete(bridge);
    if (String(uin) === accountId) broadcast({ type: 'bridge.status', ...status() });
  });
  for (const [uin, session] of manager.sessions) attach(uin, session.bridge);

  function ensureAllowed(peer) {
    if (!peer || !['group', 'private'].includes(peer.kind) || !positive(peer.id)) throw fault('INVALID_TARGET', 'Invalid conversation');
    if (!unionConversations(config.allowedConversations, config.additionalConversations).some((entry) => entry.kind === peer.kind && entry.id === peer.id)) throw fault('TARGET_DENIED', 'Conversation is outside the native bridge allowlist', 403);
  }
  async function call(operation, input, requestId) {
    const plain = entries => entries.map(({ kind, id }) => ({ kind, id }));
    const subscription = () => ({ count: unionConversations(config.allowedConversations, config.additionalConversations).length,
      conversations: plain(unionConversations(config.allowedConversations, config.additionalConversations)),
      baseConversations: plain(config.allowedConversations), additionalConversations: plain(config.additionalConversations) });
    if (operation === 'subscription.read') return subscription();
    if (['subscription.add', 'subscription.remove', 'subscription.replace'].includes(operation)) {
      const entries = validConversations(input.conversations).map(({ kind, id }) => ({ kind, id }));
      const merged = new Map();
      if (operation !== 'subscription.replace') for (const entry of config.additionalConversations) if (!merged.has(`${entry.kind}:${entry.id}`)) merged.set(`${entry.kind}:${entry.id}`, entry);
      for (const entry of entries) if (!merged.has(`${entry.kind}:${entry.id}`)) merged.set(`${entry.kind}:${entry.id}`, entry);
      if (operation === 'subscription.remove') for (const entry of entries) merged.delete(`${entry.kind}:${entry.id}`);
      const next = operation === 'subscription.replace' ? { ...config, allowedConversations: [...merged.values()] } : { ...config, additionalConversations: [...merged.values()] };
      unionConversations(next.allowedConversations, next.additionalConversations);
      if (configFile) {
        const temporary = `${configFile}.${randomUUID()}.tmp`;
        let descriptor, created = false;
        try {
          descriptor = openSync(temporary, 'wx', 0o600); created = true; writeFileSync(descriptor, encode(next) + '\n'); fsyncSync(descriptor); closeSync(descriptor); descriptor = undefined;
          renameSync(temporary, configFile);
        } catch (error) {
          if (descriptor !== undefined) closeSync(descriptor);
          if (created) try { unlinkSync(temporary); } catch {}
          throw error;
        }
      }
      config = next;
      return subscription();
    }
    const bridge = current();
    if (!bridge || bridge.empty || !bridge.receiveHealthy) throw fault('ACCOUNT_OFFLINE', 'QQ account is offline', 503);
    switch (operation) {
      case 'identity.read': {
        const groups = [];
        for (const id of Array.isArray(input.groups) ? input.groups.slice(0, 100) : []) {
          ensureAllowed({ kind: 'group', id });
          const group = bridge.identity.findGroup(id) ?? await bridge.apis.contacts.fetchGroupDetail(id);
          const member = bridge.identity.findGroupMember(id, Number(accountId));
          groups.push({ id, name: group?.groupName ?? String(id), card: member?.card || member?.nickname || bridge.identity.nickname });
        }
        return { accountId, nickname: bridge.identity.nickname, groups };
      }
      case 'message.read': {
        const message = lookup(input.messageId); ensureAllowed(conversation(message)); return message;
      }
      case 'forward.read': {
        if (typeof input.resourceId !== 'string' || input.resourceId.length > 4096) throw fault('INVALID_RESOURCE', 'Invalid forward resource');
        const nodes = await bridge.apis.forward.fetch(input.resourceId);
        return Promise.all(nodes.map(async (node) => ({ ...node, elements: (await decorate({
          kind: node.messageType === 'group' ? 'group_forward' : 'private_forward', groupId: node.groupId, senderUin: node.userUin, elements: node.elements,
        }, bridge)).elements })));
      }
      case 'voice.transcribe': {
        const message = lookup(input.messageId); const peer = conversation(message); ensureAllowed(peer);
        const voice = message.elements.find((e) => e.type === 'record');
        if (!voice?.fileId || !voice.md5Hex || !message.msgId) throw fault('VOICE_METADATA_MISSING', 'Native voice metadata is incomplete');
        let off; let timer; let resolveText;
        const pending = new Promise((resolve) => { resolveText = resolve; });
        off = bridge.events.on('ptt_trans_result', (event) => { if (String(event.msgId) === String(message.msgId)) resolveText(event.text); });
        timer = setTimeout(() => resolveText(''), 20000);
        try {
          const inline = await bridge.apis.extras.translatePttToText({ isGroup: peer.kind === 'group', msgId: message.msgId,
            senderUin: message.senderUin, peerUin: peer.kind === 'group' ? peer.id : Number(accountId),
            uuid: voice.fileId, md5Hex: voice.md5Hex, duration: voice.duration ?? 0, size: voice.fileSize ?? 0, format: voice.voiceFormat ?? 0 });
          const text = inline || await pending;
          if (!text) throw fault('VOICE_TIMEOUT', 'Native transcription returned no text', 504);
          return { text };
        } finally { clearTimeout(timer); off(); }
      }
      case 'message.send': {
        ensureAllowed(input.conversation);
        if (typeof requestId !== 'string' || !/^[\w-]{8,100}$/.test(requestId)) throw fault('INVALID_REQUEST', 'A unique request id is required');
        if (!Array.isArray(input.elements) || !input.elements.length || input.elements.length > 256) throw fault('INVALID_ELEMENTS', 'Invalid message elements');
        const fingerprint = createHash('sha256').update(encode(input)).digest('hex');
        const existing = db.prepare('SELECT * FROM outgoing WHERE id=?').get(requestId);
        if (existing) {
          if (existing.fingerprint !== fingerprint) throw fault('REQUEST_CONFLICT', 'Request id was reused with different content', 409);
          if (existing.state === 'completed') return JSON.parse(existing.result);
          throw fault('SEND_OUTCOME_UNKNOWN', 'This request was already attempted; do not automatically resend', 409);
        }
        const elements = [];
        if (input.replyTo) {
          const quoted = lookup(input.replyTo);
          const peer = conversation(quoted);
          if (peer.kind !== input.conversation.kind || peer.id !== input.conversation.id) throw fault('QUOTE_TARGET_MISMATCH', 'Quoted message belongs to a different conversation');
          elements.push({ type: 'reply', replySeq: quoted.msgSeq, replySenderUin: quoted.senderUin, replyTime: quoted.time, replyRandom: quoted.msgId ?? 0 });
        }
        for (const e of input.elements) {
          if (!e || !['text', 'at', 'face', 'image', 'record'].includes(e.type)) throw fault('UNSUPPORTED_ELEMENT', 'Unsupported outgoing element');
          if (e.type === 'text') {
            if (typeof e.text !== 'string') throw fault('INVALID_ELEMENT', 'Invalid text');
            elements.push({ type: 'text', text: e.text });
          } else if (e.type === 'at') {
            if (!positive(e.targetUin)) throw fault('INVALID_ELEMENT', 'Invalid mention');
            elements.push({ type: 'at', targetUin: e.targetUin, uid: await bridge.resolveUserUid(e.targetUin, input.conversation.kind === 'group' ? input.conversation.id : undefined) });
          } else if (e.type === 'face') {
            if (!Number.isSafeInteger(e.faceId) || e.faceId < 0) throw fault('INVALID_ELEMENT', 'Invalid face');
            elements.push({ type: 'face', faceId: e.faceId });
          } else {
            if (typeof e.url !== 'string' || !/^base64:\/\/[A-Za-z0-9+/=]+$/.test(e.url)) throw fault('INVALID_MEDIA', 'Native sends accept inline media only');
            elements.push({ type: e.type, url: e.url });
          }
        }
        db.prepare('INSERT INTO outgoing VALUES(?,?,?,NULL)').run(requestId, fingerprint, 'pending');
        try {
          const peer = input.conversation;
          const receipt = await (peer.kind === 'group' ? bridge.apis.message.sendGroup(peer.id, elements) : bridge.apis.message.sendPrivate(peer.id, elements));
          if (!positive(receipt.sequence)) throw fault('SEND_OUTCOME_UNKNOWN', 'QQ returned no authoritative message sequence', 502);
          const saved = remember({ kind: peer.kind === 'group' ? 'group_message' : 'friend_message', selfUin: Number(accountId), senderUin: Number(accountId), targetUin: peer.id,
            peerUin: peer.id, groupId: peer.kind === 'group' ? peer.id : undefined, msgSeq: receipt.sequence, msgId: receipt.random, time: receipt.timestamp, elements });
          const result = { messageId: saved.nativeId, sequence: receipt.sequence, timestamp: receipt.timestamp };
          db.prepare("UPDATE outgoing SET state='completed',result=? WHERE id=?").run(encode(result), requestId);
          return result;
        } catch (error) {
          db.prepare("UPDATE outgoing SET state='unknown' WHERE id=?").run(requestId);
          throw fault('SEND_OUTCOME_UNKNOWN', 'Send failed or its outcome is unknown; do not automatically resend', 502);
        }
      }
      default: throw fault('UNSUPPORTED_OPERATION', `Unsupported native operation: ${operation}`, 404);
    }
  }
  const auth = Buffer.from(config.token);
  const server = createServer(async (req, res) => {
    const json = (statusCode, value) => { res.writeHead(statusCode, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(encode(value)); };
    try {
      const supplied = Buffer.from(String(req.headers.authorization ?? '').replace(/^Bearer /, ''));
      if (req.headers.origin || supplied.length !== auth.length || !timingSafeEqual(supplied, auth)) return json(401, { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'GET' && url.pathname === '/native/v1/status') return json(200, status());
      if (req.method === 'GET' && url.pathname === '/native/v1/events') {
        const cursor = Number(url.searchParams.get('after') ?? 0);
        if (!Number.isSafeInteger(cursor) || cursor < 0) throw fault('INVALID_CURSOR', 'Invalid event cursor');
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        res.flushHeaders();
        frame(res, { type: 'bridge.status', ...status() });
        for (const row of db.prepare('SELECT cursor,body FROM events WHERE cursor>? ORDER BY cursor').iterate(cursor)) frame(res, { type: 'bridge.event', cursor: row.cursor, event: JSON.parse(row.body) });
        streams.add(res);
        req.on('close', () => streams.delete(res));
        return;
      }
      if (req.method === 'POST' && url.pathname === '/native/v1/call') {
        let bytes = 0; const chunks = [];
        for await (const chunk of req) { bytes += chunk.length; if (bytes > 32 * 1024 * 1024) throw fault('BODY_TOO_LARGE', 'Request body is too large', 413); chunks.push(chunk); }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw fault('INVALID_JSON', 'Invalid JSON body'); }
        if (!body || typeof body !== 'object') throw fault('INVALID_REQUEST', 'Expected a request object');
        if (typeof body.operation !== 'string' || !body.input || typeof body.input !== 'object') throw fault('INVALID_REQUEST', 'Expected native operation and input');
        return json(200, { result: await call(body.operation, body.input, body.requestId) });
      }
      return json(404, { error: { code: 'NOT_FOUND', message: 'Native endpoint not found' } });
    } catch (error) {
      if (!res.headersSent) json(error.status ?? 500, { error: { code: error.code ?? 'NATIVE_ERROR', message: error.message } });
      else res.destroy();
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(config.port ?? 5101, '127.0.0.1', resolve); });
  const heartbeat = setInterval(() => broadcast({ type: 'bridge.status', ...status() }), 5000);
  heartbeat.unref();
  return { server, status, async close() {
    closing = true; clearInterval(heartbeat);
    for (const off of subscriptions.values()) off();
    for (const res of streams) res.end();
    await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });
    await eventChain; db.close();
  } };
}
