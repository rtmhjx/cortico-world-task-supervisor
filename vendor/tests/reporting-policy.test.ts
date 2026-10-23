import { fixtureRoot, fixtureProtected, fixtureWorkspace } from './fixture-paths.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, symlinkSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { excludedRoots, isExcludedPath } from '../task-reporting/src/policy.ts';
import { ReportingGate } from '../task-reporting/src/gate.ts';

test('configured exclusions deny lexical and real targets while keeping an unrelated project available', t => {
  assert.ok(excludedRoots().includes(fixtureProtected));
  assert.equal(isExcludedPath(fixtureProtected), true);
  assert.equal(isExcludedPath(fixtureRoot, [], true), true);
  assert.equal(isExcludedPath(fixtureWorkspace), false);
  const alias = join(fixtureRoot, 'excluded-alias');
  try { symlinkSync(fixtureProtected, alias, 'junction'); }
  catch (error) { if (['EPERM', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) { t.skip('Symlink permission unavailable.'); return; } throw error; }
  t.after(() => unlinkSync(alias));
  assert.equal(isExcludedPath(alias), true);
});
test('reporting state cannot be placed in an explicit exclusion or a file alias', t => {
  assert.throws(() => new ReportingGate({ stateFile: join(fixtureProtected, 'gate.sqlite'), operatorId: '12345678' }), /protected/);
  const state = join(fixtureRoot, 'legitimate-gate.sqlite');
  const gate = new ReportingGate({ stateFile: state, operatorId: '12345678' }); gate.close();
  const alias = join(fixtureRoot, 'gate-alias.sqlite');
  try { symlinkSync(state, alias, 'file'); }
  catch (error) { if (['EPERM', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) { t.skip('File symlink permission unavailable.'); return; } throw error; }
  t.after(() => unlinkSync(alias));
  assert.throws(() => new ReportingGate({ stateFile: alias, operatorId: '12345678' }), /alias/);
});
test('a changed exclusion policy cannot silently reuse the same gate database', () => {
  const stateFile = join(fixtureRoot, 'policy-identity.sqlite'), extra = join(fixtureRoot, 'extra-private'); mkdirSync(extra);
  const first = new ReportingGate({ stateFile, operatorId: '12345678' }); first.close();
  assert.throws(() => new ReportingGate({ stateFile, operatorId: '12345678', deniedRoots: [extra] }), /identity changed/);
});
