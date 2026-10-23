import assert from'node:assert/strict';
import test from'node:test';
import{spawnSync}from'node:child_process';
import{existsSync,mkdirSync,mkdtempSync,writeFileSync}from'node:fs';
import{tmpdir}from'node:os';
import{join}from'node:path';
import{launcherText}from'../src/world.ts';
test('the real platform launcher verifies PATH Node and runs a harmless installer fixture with spaces in its path',()=>{
  const root=mkdtempSync(join(tmpdir(),'task-supervisor-launcher-')),directory=join(root,'合成 with spaces');mkdirSync(directory);
  const marker=join(root,'executed.txt'),script=join(directory,'install-gateway.mjs'),windows=process.platform==='win32',launcher=join(root,windows?'install.cmd':'install.sh');
  writeFileSync(script,`import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'fixture ran');\n`);
  writeFileSync(launcher,launcherText(script,windows));
  const result=windows?spawnSync(process.env.ComSpec??'C:\\Windows\\System32\\cmd.exe',['/d','/c',launcher],{input:'\r\n',encoding:'utf8',timeout:10000}):spawnSync('/bin/sh',[launcher],{encoding:'utf8',timeout:10000});
  assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);assert.equal(existsSync(marker),true);
});
