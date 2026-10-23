import { fixtureRoot } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

test('published memory worker runs from the built bundle without a TypeScript loader', { timeout: 15000 }, async () => {
  const file = new URL('../../lib/dsh-memory-raw-worker.mjs', import.meta.url);
  assert.ok(existsSync(file), 'Run node tools/build-vendor.mjs before the worker packaging check.');
  const sessionsDir = join(fixtureRoot, 'worker-sessions'), rawDir = join(fixtureRoot, 'worker-mirror'); mkdirSync(sessionsDir); mkdirSync(rawDir);
  const result = await new Promise<any>((resolve, reject) => {
    const worker = new Worker(file, { execArgv: [], workerData: { sessionsDir, rawDir, dbFile: join(fixtureRoot, 'unused.db'), buckets: [], maxTurns: 10 } });
    let received = false;
    worker.once('message', message => { received = true; resolve(message); });
    worker.once('error', reject);
    worker.once('exit', code => { if (!received) reject(new Error(`Built worker exited ${code} without a result.`)); });
  });
  assert.equal(result.ok, true, result.error);
  assert.equal(result.result.newTurns, 0);
  assert.equal(result.result.sessionsScanned, 0);
});
