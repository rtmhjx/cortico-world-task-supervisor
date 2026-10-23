import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { RouteError } from './contract.ts';

export const digest = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** One owner, FULL durable commits, no external side effect inside a transaction. */
export class StateStore<T> {
  private db: DatabaseSync;
  private value: T;
  private version = 0;
  private owner = randomUUID();
  private closed = false;
  degraded = false;
  constructor(readonly file: string, identity: unknown, initial: T) {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file);
    try {
      this.db.exec('PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA trusted_schema=OFF;');
      const version = Number(this.db.prepare('PRAGMA user_version').get()!.user_version);
      if (version !== 0 && version !== 1) throw new Error('Unsupported conversation state schema.');
      if (!version) {
        if (this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().length) throw new Error('Unversioned nonempty store.');
        this.db.exec('BEGIN IMMEDIATE; CREATE TABLE state(id INTEGER PRIMARY KEY CHECK(id=1),identity TEXT NOT NULL,version INTEGER NOT NULL,value TEXT NOT NULL); CREATE TABLE owner(id INTEGER PRIMARY KEY CHECK(id=1),pid INTEGER NOT NULL,token TEXT NOT NULL); CREATE TABLE audit(seq INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,kind TEXT NOT NULL,value TEXT NOT NULL); PRAGMA user_version=1; COMMIT;');
      }
      if (this.db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok') throw new Error('State integrity check failed.');
      if (!this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit'").get()) throw new Error('Conversation audit schema is missing; preserve this prior candidate store.');
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const previous = this.db.prepare('SELECT * FROM owner WHERE id=1').get();
        if (previous) {
          let alive = true;
          try { process.kill(Number(previous.pid), 0); } catch (e) { alive = (e as NodeJS.ErrnoException).code !== 'ESRCH'; }
          if (alive) throw new RouteError('STATE_IN_USE', 'Conversation state already has a live owner.');
        }
        const row = this.db.prepare('SELECT * FROM state WHERE id=1').get(), hash = digest(identity);
        if (row && row.identity !== hash) throw new RouteError('STATE_IDENTITY_CHANGED', 'Keep the previous state and configuration; state identity changed.');
        if (!row) this.db.prepare('INSERT INTO state VALUES(1,?,0,?)').run(hash, JSON.stringify(initial));
        this.value = row ? JSON.parse(String(row.value)) as T : structuredClone(initial);
        this.version = row ? Number(row.version) : 0;
        this.db.prepare('INSERT INTO owner VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET pid=excluded.pid,token=excluded.token').run(process.pid, this.owner);
        this.db.exec('COMMIT');
      } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    } catch (error) { this.db.close(); throw error; }
  }
  read(): T { return structuredClone(this.value); }
  update(mutate: (next: T) => void, event?: { kind: string; data: unknown }): void {
    if (this.closed || this.degraded) throw new RouteError('PERSISTENCE_UNAVAILABLE', 'State is unavailable; no new command will be submitted.');
    const next = structuredClone(this.value); mutate(next);
    try {
      this.db.exec('BEGIN IMMEDIATE');
      const changed = this.db.prepare('UPDATE state SET value=?,version=version+1 WHERE id=1 AND version=? AND EXISTS(SELECT 1 FROM owner WHERE id=1 AND token=?)').run(JSON.stringify(next), this.version, this.owner);
      if (changed.changes !== 1) throw new Error('State owner or version changed.');
      this.db.prepare('INSERT INTO audit(at,kind,value) VALUES(?,?,?)').run(new Date().toISOString(), event?.kind ?? 'state.commit', JSON.stringify(event?.data ?? { version: this.version + 1 }));
      this.db.exec('COMMIT');
      this.value = next; this.version++;
    } catch {
      try { this.db.exec('ROLLBACK'); } catch { /* BEGIN may itself have failed. No second persistence attempt. */ }
      this.degraded = true;
      process.stderr.write(JSON.stringify({ component: 'conversationcontrol', kind: 'persistence.degraded', at: new Date().toISOString(), file: this.file, code: 'PERSISTENCE_UNAVAILABLE', accepting: false }) + '\n');
      throw new RouteError('PERSISTENCE_UNAVAILABLE', 'Durable commit failed; no new command will be submitted.');
    }
  }
  close(): void {
    if (this.closed) return;
    this.closed = true;
    try { this.db.prepare('DELETE FROM owner WHERE id=1 AND token=?').run(this.owner); }
    finally { this.db.close(); }
  }
}
