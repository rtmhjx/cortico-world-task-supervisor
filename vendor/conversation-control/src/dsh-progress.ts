import { excludedRoots } from '../../task-reporting/src/policy.ts';
/** Observe newly appended native facts without loading or controlling sessions. */
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { canonical, within } from './paths.ts';
import { RouteError } from './contract.ts';
import type { DshProgressBatch, DshProgressEvent, DshProgressSource } from './progress-contract.ts';

interface Header { id: string; cwd?: string; parentSession?: string; origin?: string }
export interface DshProgressNativeEvent { seq: number; time: number; type: string; data: Record<string, any>; surfaceOp?: unknown }
export interface DshProgressContext {
  on(name: string, callback: (session: { header: Header }, event: DshProgressNativeEvent) => void, options?: Record<string, unknown>): () => void;
}
interface SessionState {
  lastSeq: number; workspace: string; turnId: string | null; type: DshProgressEvent['type'];
  summary: string; toolCalls: number; toolResults: number; approvals: string[];
  publishedAt: number; pending: Omit<DshProgressEvent, 'cursor' | 'eventId'> | null;
}
const observedTypes = new Set(['turn/start', 'turn/end', 'assistant/message', 'tool/call', 'tool/result', 'approval/asked', 'approval/decided']);
const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Root metadata is checked again for each event, including junction targets. */
export async function progressWorkspaceAllowed(workspace: string, roots: string[]): Promise<boolean> {
  if (!isAbsolute(workspace) || !roots.length) return false;
  const path = resolve(workspace);
  for (const denied of excludedRoots()) if (within(path, resolve(denied)) || within(resolve(denied), path)) return false;
  try {
    const actual = await canonical(path);
    if (actual.toLowerCase() !== path.toLowerCase()) return false;
    for (const denied of excludedRoots()) { const forbidden = await canonical(denied); if (within(actual, forbidden) || within(forbidden, actual)) return false; }
    for (const root of roots) {
      if (!isAbsolute(root)) continue;
      const expected = resolve(root), actualRoot = await canonical(expected);
      if (expected.toLowerCase() !== actualRoot.toLowerCase()) continue;
      if (within(actual, actualRoot)) return true;
    }
  } catch { /* Unverifiable metadata does not authorize observation. */ }
  return false;
}
function scrub(value: string): string {
  return value.replace(/(["']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|authorization|password|passwd|secret|cookie)["']?\s*[:=]\s*)(["'])(?:\\.|(?!\2)[\s\S])*\2/gi, '$1$2[REDACTED]$2')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/((?:api[_-]?key|access[_-]?token|token|authorization|password|passwd|secret|cookie)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/\b(?:sk-|ghp_|github_pat_|AIza)[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, '[REDACTED]')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
}
function publicText(event: DshProgressNativeEvent): string {
  const blocks = event.data.message?.content;
  if (!Array.isArray(blocks)) return '';
  return scrub(blocks.filter(block => block?.type === 'text' && typeof block.text === 'string').map(block => block.text).join('\n')).slice(0, 800);
}

export class DshProgressFeed implements DshProgressSource {
  private readonly db: DatabaseSync;
  private readonly owner = randomUUID();
  private readonly feedId: string;
  private readonly baselineAt: string;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private queued: Promise<void> = Promise.resolve();
  private off?: () => void;
  private closed = false;
  private error: string | null = null;
  constructor(private readonly options: { stateFile: string; roots: string[]; now?: () => number; intervalMs?: number }) {
    this.now = options.now ?? Date.now; this.intervalMs = options.intervalMs ?? 30000;
    if (!isAbsolute(options.stateFile) || !options.roots.length || options.roots.some(root => !isAbsolute(root)) || !Number.isSafeInteger(this.intervalMs) || this.intervalMs < 1000 || this.intervalMs > 3600000) throw new RouteError('INVALID_CONFIG', 'Invalid native progress observation configuration.');
    mkdirSync(dirname(options.stateFile), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(options.stateFile);
    try {
      this.db.exec('PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA trusted_schema=OFF; CREATE TABLE IF NOT EXISTS meta(id INTEGER PRIMARY KEY CHECK(id=1),identity TEXT NOT NULL,feed_id TEXT NOT NULL,baseline_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS owner(id INTEGER PRIMARY KEY CHECK(id=1),pid INTEGER NOT NULL,token TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS events(cursor INTEGER PRIMARY KEY AUTOINCREMENT,event_id TEXT UNIQUE NOT NULL,value TEXT NOT NULL);');
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const previous = this.db.prepare('SELECT pid FROM owner WHERE id=1').get();
        if (previous) { let alive = true; try { process.kill(Number(previous.pid), 0); } catch (error) { alive = (error as NodeJS.ErrnoException).code !== 'ESRCH'; } if (alive) throw new RouteError('STATE_IN_USE', 'Native progress feed has a live owner.'); }
        const identity = hash({ version: 2, excludedRoots: excludedRoots().sort(), roots: options.roots.map(root => resolve(root).toLowerCase()).sort() });
        const existing = this.db.prepare('SELECT * FROM meta WHERE id=1').get();
        if (existing && existing.identity !== identity) throw new RouteError('STATE_IDENTITY_CHANGED', 'Preserve the previous progress feed; observation scope changed.');
        this.feedId = existing ? String(existing.feed_id) : randomUUID();
        this.baselineAt = existing ? String(existing.baseline_at) : new Date(this.now()).toISOString();
        if (!existing) this.db.prepare('INSERT INTO meta VALUES(1,?,?,?)').run(identity, this.feedId, this.baselineAt);
        this.db.prepare('INSERT INTO owner VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET pid=excluded.pid,token=excluded.token').run(process.pid, this.owner);
        this.db.exec('COMMIT');
      } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    } catch (error) { this.db.close(); throw error; }
  }
  start(ctx: DshProgressContext): void {
    if (this.off || this.closed) throw new RouteError('INVALID_STATE', 'Progress observer cannot be started twice.');
    this.off = ctx.on('session/event', (session, event) => {
      // Message-producing facts carry append markers in current DSH. A
      // replacement edits the context surface and is not new execution work.
      if (!observedTypes.has(event.type) || (event.surfaceOp !== undefined && event.surfaceOp !== 'append')) return;
      // SessionQuery may synthesize this boundary when opening a cold log.
      if (event.type === 'turn/end' && event.data.reason?.kind === 'interrupted') return;
      const header = { ...session.header };
      this.enqueue(() => this.capture(header, event));
    }, { global: true });
  }
  private enqueue(action: () => Promise<void> | void): void {
    if (this.closed) return;
    this.queued = this.queued.then(action).catch(error => { this.error = error instanceof RouteError ? error.code : 'PROGRESS_OBSERVATION_FAILED'; });
  }
  private transact(action: () => void): void {
    this.db.exec('BEGIN IMMEDIATE');
    try { action(); this.db.exec('COMMIT'); } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  private publish(state: SessionState): void {
    if (!state.pending) return;
    const event = state.pending, eventId = hash([this.feedId, event.sessionId, event.seq, event.type]);
    this.db.prepare('INSERT OR IGNORE INTO events(event_id,value) VALUES(?,?)').run(eventId, JSON.stringify(event));
    state.pending = null; state.publishedAt = this.now();
  }
  private save(id: string, state: SessionState): void { this.db.prepare('INSERT INTO sessions VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(id, JSON.stringify(state)); }
  private async capture(header: Header, event: DshProgressNativeEvent): Promise<void> {
    if (!header.id || header.id.length > 200 || header.parentSession || header.origin === 'subagent' || !header.cwd || !Number.isSafeInteger(event.seq) || event.seq < 0 || !Number.isFinite(event.time) || event.time < Date.parse(this.baselineAt)) return;
    if (!await progressWorkspaceAllowed(header.cwd, this.options.roots)) return;
    const row = this.db.prepare('SELECT value FROM sessions WHERE id=?').get(header.id);
    let state: SessionState | undefined = row ? JSON.parse(String(row.value)) : undefined;
    if (state && (event.seq <= state.lastSeq || header.cwd !== state.workspace)) return;
    if (!state && event.type === 'turn/end') return; // A cold-read synthetic closer has no observed live turn.
    const eventTurn = Number.isSafeInteger(event.data.turn) ? String(event.data.turn) : null;
    if (!state || (eventTurn !== null && eventTurn !== state.turnId)) {
      state = { lastSeq: -1, workspace: header.cwd, turnId: eventTurn, type: 'running', summary: '', toolCalls: 0, toolResults: 0, approvals: [], publishedAt: 0, pending: null };
    }
    let changed = false, important = false;
    if (event.type === 'turn/start') { state.type = 'started'; state.summary = '原生回合已开始。'; changed = important = true; }
    else if (event.type === 'assistant/message') { const summary = publicText(event); if (summary && summary !== state.summary) { state.summary = summary; changed = true; } if (!state.approvals.length) state.type = 'running'; }
    else if (event.type === 'tool/call') { state.toolCalls++; state.type = state.approvals.length ? 'waiting_user' : 'running'; changed = true; }
    else if (event.type === 'tool/result') { state.toolResults++; state.type = state.approvals.length ? 'waiting_user' : 'running'; changed = true; }
    else if (event.type === 'approval/asked' && typeof event.data.id === 'string') { if (!state.approvals.includes(event.data.id)) { state.approvals.push(event.data.id); state.type = 'waiting_user'; changed = important = true; } }
    else if (event.type === 'approval/decided' && typeof event.data.id === 'string') { const index = state.approvals.indexOf(event.data.id); if (index >= 0) { state.approvals.splice(index, 1); state.type = state.approvals.length ? 'waiting_user' : 'running'; changed = important = true; } }
    else if (event.type === 'turn/end') {
      const reason = event.data.reason?.kind;
      state.type = reason === 'completed' ? 'completed' : reason === 'error' || reason === 'max-tokens' ? 'failed' : reason === 'blocked' ? 'waiting_user' : 'interrupted';
      if (reason !== 'completed') state.summary = `${state.summary ? state.summary + '\n' : ''}原生回合结束原因：${/^[a-z-]{1,40}$/.test(reason) ? reason : 'unknown'}。`.slice(0, 900);
      state.approvals = []; changed = important = true;
    }
    state.lastSeq = event.seq;
    if (changed) state.pending = { sessionId: header.id, workspace: header.cwd, turnId: state.turnId, seq: event.seq, type: state.type, at: new Date(event.time).toISOString(), summary: state.summary, toolCalls: state.toolCalls, toolResults: state.toolResults, source: 'dsh-native-session-event' };
    this.transact(() => { if (changed && (important || this.now() - state!.publishedAt >= this.intervalMs)) this.publish(state!); this.save(header.id, state!); });
    this.error = null;
  }
  async flush(): Promise<void> {
    this.enqueue(async () => {
      const rows = this.db.prepare('SELECT id,value FROM sessions').all();
      for (const row of rows) {
        const state: SessionState = JSON.parse(String(row.value));
        if (!state.pending || this.now() - state.publishedAt < this.intervalMs || !await progressWorkspaceAllowed(state.workspace, this.options.roots)) continue;
        this.transact(() => { this.publish(state); this.save(String(row.id), state); });
      }
    });
    await this.queued;
  }
  async read(after: number, limit = 50): Promise<DshProgressBatch> {
    if (!Number.isSafeInteger(after) || after < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new RouteError('INVALID_ARGUMENT', 'Progress requires a nonnegative cursor and a limit of 1–100.');
    await this.flush();
    if (this.error) throw new RouteError(this.error, 'Native progress observation is degraded.');
    const latestCursor = Number(this.db.prepare('SELECT COALESCE(MAX(cursor),0) AS value FROM events').get()!.value);
    if (after > latestCursor) throw new RouteError('PROGRESS_CURSOR_AHEAD', 'Progress cursor exceeds this feed. Verify feed identity before resetting it.');
    const rows = this.db.prepare('SELECT cursor,event_id,value FROM events WHERE cursor>? ORDER BY cursor LIMIT ?').all(after, limit);
    const events = rows.map(row => ({ ...JSON.parse(String(row.value)), cursor: Number(row.cursor), eventId: String(row.event_id) })) as DshProgressEvent[];
    return { feedId: this.feedId, baselineAt: this.baselineAt, events, nextCursor: events.at(-1)?.cursor ?? after, latestCursor };
  }
  status(): Record<string, unknown> { return { enabled: true, roots: [...this.options.roots], excludedRoots: excludedRoots(), feedId: this.feedId, baselineAt: this.baselineAt, running: !!this.off && !this.closed, error: this.error, latestCursor: Number(this.db.prepare('SELECT COALESCE(MAX(cursor),0) AS value FROM events').get()!.value) }; }
  async stop(): Promise<void> {
    if (this.closed) return;
    this.off?.(); this.off = undefined; await this.queued; this.closed = true;
    try { this.db.prepare('DELETE FROM owner WHERE id=1 AND token=?').run(this.owner); } finally { this.db.close(); }
  }
}
