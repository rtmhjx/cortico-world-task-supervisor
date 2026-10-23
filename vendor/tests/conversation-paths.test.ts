import { fixtureRoot, fixtureWorkspace, fixtureProtected, fixtureProtectedRecords, fixtureProtectedParent, fixtureScratch, toolchainRequire } from './fixture-paths.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rmdir, symlink, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { allowedDelegationRoot, allowedWorkspace } from '../conversation-control/src/paths.ts';

test('whole-drive delegation allows ordinary project workspaces but denies archive and ancestor workspaces', async () => {
  assert.equal(await allowedDelegationRoot(fixtureRoot),true);
  assert.equal(await allowedDelegationRoot(fixtureProtectedParent),true);
  assert.equal(await allowedDelegationRoot(fixtureProtected),false);
  assert.equal(await allowedDelegationRoot('relative-root'),false);
  assert.equal(await allowedWorkspace(fixtureWorkspace, [fixtureRoot]), true);
  assert.equal(await allowedWorkspace(`${fixtureRoot}/ordinary-conversation-fixture`, [fixtureRoot]), true);
  for (const path of [fixtureProtected, `${fixtureProtected}/child`, fixtureRoot, fixtureProtectedParent, `${fixtureRoot}-outside`]) {
    assert.equal(await allowedWorkspace(path, [fixtureRoot]), false, path);
  }
});

test('whole-drive delegation refuses workspace junction aliases even to another permitted F-drive project', async t => {
  const scratch=join(fixtureScratch);await mkdir(scratch,{recursive:true});const base=await mkdtemp(join(scratch,'path-delegation-'));
  const actual=join(base,'actual'),alias=join(base,'alias'),crossDrive=join(base,'cross-drive'),outside=`${fixtureRoot}-outside`;await mkdir(actual);await mkdir(outside);await symlink(actual,alias,'junction');await symlink(outside,crossDrive,'junction');
  t.after(async()=>{await unlink(alias);await unlink(crossDrive);await rmdir(actual);await rmdir(base);await rmdir(outside);});
  assert.equal(await allowedWorkspace(actual,[fixtureRoot]),true);
  assert.equal(await allowedWorkspace(alias,[fixtureRoot]),false);
  assert.equal(await allowedDelegationRoot(alias),false);
  assert.equal(await allowedWorkspace(crossDrive,[fixtureRoot]),false);
  assert.equal(await allowedDelegationRoot(crossDrive),false);
});
