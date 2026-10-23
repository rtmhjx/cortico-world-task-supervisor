/** Shared task reporting state, authorized QQ commands and durable source outboxes. */
import { excludedRoots, isExcludedPath } from './policy.ts';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export interface ReportingEvent {
  cursor: number; type: string; source: string; origin: string; ts: string; text: string;
  senderKey?: string; meta?: Record<string, unknown>;
}
export interface ReportingStoreReader {
  latestCursor(): number;
  range(query: { fromCursor?: number; toCursor?: number; source?: string }): ReportingEvent[];
}
export interface GateTransition {
  epoch: number; enabled: boolean; eventCursor: number; messageId: string; at: string;
}
export interface QueuedNotification {
  source: string; id: string; payload: Record<string, unknown>; queuedAt: string;
}
export interface ReportingGateOptions {
  stateFile: string; operatorId: string; clock?: () => number; maxCommandAgeMs?: number; deniedRoots?: readonly string[];
}
interface GateRow {
  identity: string; enabled: number; epoch: number; initialized: number; command_cursor: number;
  created_at: string; last_toggle_at: string | null;
}
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const inside = (child: string, root: string): boolean => {
  const part = relative(root.toLowerCase(), child.toLowerCase());
  return part === '' || (!isAbsolute(part) && part !== '..' && !part.startsWith(`..${sep}`));
};
function statePath(file: string, deniedRoots: readonly string[]): string {
  if (!isAbsolute(file)) throw new Error('Task reporting stateFile must be absolute.');
  const absolute = resolve(file);
  let parent = dirname(absolute); const suffix = [relative(parent, absolute)];
  for (;;) {
    try { parent = realpathSync(parent); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const next = dirname(parent); if (next === parent) throw error;
      suffix.unshift(relative(next, parent)); parent = next;
    }
  }
  let actual = join(parent, ...suffix);
  if (actual.toLowerCase() !== absolute.toLowerCase()) throw new Error('Task reporting state file cannot be a filesystem alias.');
  try {
    const info = lstatSync(absolute);
    actual = realpathSync(absolute);
    if (info.isSymbolicLink() || actual.toLowerCase() !== absolute.toLowerCase()) throw new Error('Task reporting state file cannot be a filesystem alias.');
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  if (isExcludedPath(absolute, deniedRoots) || isExcludedPath(actual, deniedRoots)) throw new Error('Task reporting state cannot use a protected directory.');
  return actual;
}
function numberId(value: unknown): string | undefined {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value !== 0 ? String(value) : undefined;
  if (typeof value !== 'string' || !/^-?[1-9]\d{0,15}$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed !== 0 ? String(parsed) : undefined;
}
/** Display text never grants command authority; the QQ World marks original text segments. */
export function reportingCommand(event: ReportingEvent, operatorId: string, now: number, maxAgeMs = 300000): string | undefined {
  if (event.source !== 'qq' || event.type !== 'qq.message' || event.origin !== 'external' || !Number.isSafeInteger(event.cursor) || event.cursor < 1) return undefined;
  const meta = event.meta, conv = meta?.conv as Record<string, unknown> | undefined;
  if (!meta || typeof conv !== 'object' || conv === null || Array.isArray(conv) || conv.kind !== 'private'
    || numberId(meta.user_id) !== operatorId || numberId(conv.id) !== operatorId || event.senderKey !== operatorId
    || meta.self === true || meta.role === 'assistant' || meta.role === 'system') return undefined;
  const command = meta.taskReportingCommand as Record<string, unknown> | undefined;
  if (!command || typeof command !== 'object' || Array.isArray(command) || command.version !== 1 || command.token !== '#@'
    || Object.keys(command).some(key => key !== 'version' && key !== 'token')) return undefined;
  const at = Date.parse(event.ts);
  if (!Number.isFinite(at) || at > now + 5000 || now - at > maxAgeMs) return undefined;
  return numberId(meta.message_id);
}
function cleanString(value: string): string {
  return value
    .replace(/(["']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|authorization|password|passwd|secret|cookie)["']?\s*[:=]\s*)(["'])(?:\\.|(?!\2)[\s\S])*\2/gi, '$1$2[REDACTED]$2')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/(\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|authorization|password|passwd|secret|cookie)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/\b(?:sk-|ghp_|github_pat_|AIza)[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, '[REDACTED]');
}
function cleanPayload(value: unknown, depth = 0): unknown {
  if (depth > 24) throw new Error('Task reporting payload exceeds the nesting limit.');
  if (typeof value === 'string') return cleanString(value);
  if (Array.isArray(value)) return value.map(item => cleanPayload(item, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    /^(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|authorization|password|passwd|secret|cookie)$/i.test(key) ? '[REDACTED]' : cleanPayload(item, depth + 1)]));
  if (value === null || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === undefined) return null;
  throw new Error('Task reporting payload must be JSON data.');
}
function key(value: string, label: string): void {
  if (typeof value !== 'string' || !value || value.length > 256 || /[\x00-\x1f\x7f]/.test(value)) throw new Error(`Invalid task reporting ${label}.`);
}
function limitValue(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > 1000) throw new Error('Task reporting limit must be 1–1000.');
}

/** Multiple Worlds share one committed gate; each source owns its stable delivery IDs. */
export class ReportingGate {
  private readonly db: DatabaseSync;
  private readonly clock: () => number;
  private readonly maxCommandAgeMs: number;
  private closed = false;
  constructor(private readonly options: ReportingGateOptions) {
    if (!/^[1-9]\d{4,19}$/.test(options.operatorId)) throw new Error('Task reporting requires one numeric QQ operator.');
    this.clock = options.clock ?? Date.now; this.maxCommandAgeMs = options.maxCommandAgeMs ?? 300000;
    if (!Number.isSafeInteger(this.maxCommandAgeMs) || this.maxCommandAgeMs < 1000 || this.maxCommandAgeMs > 3600000) throw new Error('Invalid task reporting command age.');
    const file = statePath(options.stateFile, options.deniedRoots ?? []);
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file);
    try {
      const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => String(row.name));
      const expected = ['reporting_gate', 'reporting_commands', 'reporting_outbox'];
      if (tables.length && (tables.length !== expected.length || expected.some(name => !tables.includes(name)))) throw new Error('Task reporting state is not a complete reporting database; preserve the existing file.');
      this.db.exec('PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA trusted_schema=OFF;');
      this.transaction(() => {
        this.db.exec('CREATE TABLE IF NOT EXISTS reporting_gate(id INTEGER PRIMARY KEY CHECK(id=1),identity TEXT NOT NULL,enabled INTEGER NOT NULL,epoch INTEGER NOT NULL,initialized INTEGER NOT NULL,command_cursor INTEGER NOT NULL,created_at TEXT NOT NULL,last_toggle_at TEXT); CREATE TABLE IF NOT EXISTS reporting_commands(message_id TEXT PRIMARY KEY,event_cursor INTEGER NOT NULL,epoch INTEGER UNIQUE NOT NULL,enabled INTEGER NOT NULL,at TEXT NOT NULL,host_cursor INTEGER); CREATE TABLE IF NOT EXISTS reporting_outbox(source TEXT NOT NULL,id TEXT NOT NULL,payload TEXT,queued_at TEXT NOT NULL,host_cursor INTEGER,acked_at TEXT,PRIMARY KEY(source,id));');
        const identity = digest({ schema: 2, operatorId: options.operatorId, exclusions: excludedRoots(options.deniedRoots).sort() });
        const existing = this.db.prepare('SELECT identity FROM reporting_gate WHERE id=1').get();
        if (existing && existing.identity !== identity) throw new Error('Task reporting identity changed; preserve the existing gate and outbox.');
        if (!existing) this.db.prepare('INSERT INTO reporting_gate VALUES(1,?,0,0,0,0,?,NULL)').run(identity, this.iso());
      });
    } catch (error) { this.db.close(); throw error; }
  }
  private iso(): string { return new Date(this.clock()).toISOString(); }
  private transaction<T>(action: () => T): T {
    if (this.closed) throw new Error('Task reporting gate is closed.');
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = action(); this.db.exec('COMMIT'); return result; }
    catch (error) { try { this.db.exec('ROLLBACK'); } catch {} throw error; }
  }
  private state(): GateRow { return this.db.prepare('SELECT * FROM reporting_gate WHERE id=1').get() as unknown as GateRow; }
  syncCommands(store: ReportingStoreReader): GateTransition[] {
    const latest = store.latestCursor();
    if (!Number.isSafeInteger(latest) || latest < 0) throw new Error('Invalid task reporting event-store cursor.');
    return this.transaction(() => {
      const state = this.state();
      if (!state.initialized) {
        this.db.prepare('UPDATE reporting_gate SET initialized=1,command_cursor=? WHERE id=1').run(latest);
        return [];
      }
      if (latest < state.command_cursor) throw new Error('Task reporting event-store cursor moved backwards; preserve its command checkpoint.');
      if (latest === state.command_cursor) return [];
      const transitions: GateTransition[] = [];
      while (state.command_cursor < latest) {
        // range() takes limits from the tail. A cursor window bounds memory
        // without dropping an earlier switch command from a busy interval.
        const stop = Math.min(latest, state.command_cursor + 4096);
        const events = store.range({ source: 'qq', fromCursor: state.command_cursor + 1, toCursor: stop });
        if (events.length > 4096) throw new Error('Task reporting command event range exceeds its cursor window.');
        events.sort((a, b) => a.cursor - b.cursor);
        let previous = state.command_cursor;
        for (const event of events) {
          if (!Number.isSafeInteger(event.cursor) || event.cursor <= previous || event.cursor > stop) throw new Error('Task reporting command event range is inconsistent.');
          previous = event.cursor;
          const messageId = reportingCommand(event, this.options.operatorId, this.clock(), this.maxCommandAgeMs);
          if (!messageId || this.db.prepare('SELECT 1 FROM reporting_commands WHERE message_id=?').get(messageId)) continue;
          state.epoch++; state.enabled = state.enabled ? 0 : 1;
          const at = this.iso();
          this.db.prepare('INSERT INTO reporting_commands VALUES(?,?,?,?,?,NULL)').run(messageId, event.cursor, state.epoch, state.enabled, at);
          transitions.push({ epoch: state.epoch, enabled: !!state.enabled, eventCursor: event.cursor, messageId, at });
          state.last_toggle_at = at;
        }
        state.command_cursor = stop;
      }
      this.db.prepare('UPDATE reporting_gate SET enabled=?,epoch=?,command_cursor=?,last_toggle_at=? WHERE id=1').run(state.enabled, state.epoch, latest, state.last_toggle_at);
      return transitions;
    });
  }
  enabled(): boolean { return !!this.state().enabled; }
  snapshot(): Record<string, unknown> {
    const state = this.state();
    const last = this.db.prepare('SELECT epoch,enabled,event_cursor,message_id,at FROM reporting_commands ORDER BY epoch DESC LIMIT 1').get();
    const pendingBySource = Object.fromEntries(this.db.prepare('SELECT source,count(*) AS total FROM reporting_outbox WHERE acked_at IS NULL GROUP BY source').all().map(row => [String(row.source), Number(row.total)]));
    return { enabled: !!state.enabled, epoch: state.epoch, initialized: !!state.initialized, operatorId: this.options.operatorId,
      commandCursor: state.command_cursor, createdAt: state.created_at, lastToggleAt: state.last_toggle_at,
      pendingCount: Object.values(pendingBySource).reduce((sum, count) => sum + count, 0), pendingBySource,
      lastTransition: last ? { epoch: Number(last.epoch), enabled: !!last.enabled, eventCursor: Number(last.event_cursor), messageId: String(last.message_id), at: String(last.at) } : null };
  }
  enqueue(source: string, id: string, payload: Record<string, unknown>): boolean {
    key(source, 'source'); key(id, 'delivery ID');
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Task reporting payload must be a JSON object.');
    const json = JSON.stringify(cleanPayload(payload));
    if (Buffer.byteLength(json) > 1024 * 1024) throw new Error('Task reporting payload exceeds 1 MiB; keep the original source intent.');
    return this.transaction(() => this.db.prepare('INSERT OR IGNORE INTO reporting_outbox(source,id,payload,queued_at) VALUES(?,?,?,?)').run(source, id, json, this.iso()).changes === 1);
  }
  pending(source: string, limit = 20): QueuedNotification[] {
    key(source, 'source'); limitValue(limit);
    if (!this.enabled()) return [];
    return this.db.prepare('SELECT source,id,payload,queued_at FROM reporting_outbox WHERE source=? AND acked_at IS NULL ORDER BY queued_at,rowid LIMIT ?').all(source, limit)
      .map(row => ({ source: String(row.source), id: String(row.id), payload: JSON.parse(String(row.payload)), queuedAt: String(row.queued_at) }));
  }
  ack(source: string, id: string, hostCursor: number): void {
    key(source, 'source'); key(id, 'delivery ID'); this.hostCursor(hostCursor);
    this.transaction(() => this.db.prepare('UPDATE reporting_outbox SET payload=NULL,host_cursor=?,acked_at=? WHERE source=? AND id=? AND acked_at IS NULL').run(hostCursor, this.iso(), source, id));
  }
  pendingTransitions(limit = 20): GateTransition[] {
    limitValue(limit);
    return this.db.prepare('SELECT epoch,enabled,event_cursor,message_id,at FROM reporting_commands WHERE host_cursor IS NULL ORDER BY epoch LIMIT ?').all(limit)
      .map(row => ({ epoch: Number(row.epoch), enabled: !!row.enabled, eventCursor: Number(row.event_cursor), messageId: String(row.message_id), at: String(row.at) }));
  }
  ackTransition(epoch: number, hostCursor: number): void {
    if (!Number.isSafeInteger(epoch) || epoch < 1) throw new Error('Invalid task reporting transition epoch.');
    this.hostCursor(hostCursor);
    this.transaction(() => this.db.prepare('UPDATE reporting_commands SET host_cursor=? WHERE epoch=? AND host_cursor IS NULL').run(hostCursor, epoch));
  }
  private hostCursor(cursor: number): void { if (!Number.isSafeInteger(cursor) || cursor < 1) throw new Error('Invalid task reporting host receipt.'); }
  close(): void { if (this.closed) return; this.closed = true; this.db.close(); }
}
