/** Synthetic local fixtures only; no installed profile or session is consulted. */
import { mkdirSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export const fixtureRoot = mkdtempSync(join(tmpdir(), 'task-supervisor-fixture-'));
export const fixtureWorkspace = join(fixtureRoot, 'projects', 'example');
export const fixtureProtectedParent = join(fixtureRoot, 'protected');
export const fixtureProtected = join(fixtureProtectedParent, 'private-backups');
export const fixtureProtectedRecords = join(fixtureProtectedParent, 'private-records');
export const fixtureScratch = join(fixtureRoot, 'scratch');
for (const path of [fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureScratch]) mkdirSync(path, { recursive: true });
process.env.CORTICO_TASK_SUPERVISOR_EXCLUSIONS = JSON.stringify([fixtureProtected, fixtureProtectedRecords]);
export const toolchainRequire = createRequire(process.env.CORTICO_TOOLCHAIN_PACKAGE ?? new URL('../../package.json', import.meta.url));
