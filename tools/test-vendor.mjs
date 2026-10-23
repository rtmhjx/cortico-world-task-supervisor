/** Runs real code against synthetic state, with optional installed-native DSH coverage. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dependencyPath, dependencyManifest, packageRoot, sdkRoot } from './toolchain.mjs';
if (!sdkRoot) throw new Error('Set CORTICO_DIR (or CORTICO_SOURCE_ROOT) to the supported Cortico source checkout for EventStore integration tests.');
const temporary = mkdtempSync(join(tmpdir(), 'task-supervisor-tests-'));
const config = JSON.parse(readFileSync(join(packageRoot, 'tsconfig.vendor.json'), 'utf8'));
config.compilerOptions.paths = { 'cortico/*': [join(sdkRoot, 'src', '*').replaceAll('\\', '/')], ws: [dependencyPath('ws')] };
try { config.compilerOptions.paths.yaml = [dependencyPath('yaml')]; } catch { /* Native Gateway tests need no YAML parser. */ }
config.compilerOptions.typeRoots = [join(dirname(dependencyPath('@types/node/package.json')), '..')];
const tsconfig = join(temporary, 'tsconfig.json'); writeFileSync(tsconfig, JSON.stringify(config));
const selected = process.argv.slice(2);
const tests = ['vendor/tests', 'vendor/snowluma-native', 'tests'].flatMap(directory => existsSync(join(packageRoot, directory))
  ? readdirSync(join(packageRoot, directory)).filter(name => /\.test\.(?:ts|mjs)$/.test(name))
    .filter(name => !selected.length || selected.some(pattern => name.includes(pattern))).map(name => join(packageRoot, directory, name))
  : []);
if (!tests.length) throw new Error('No matching source tests.');
try {
  const result = spawnSync(process.execPath, ['--import', pathToFileURL(dependencyPath('tsx')).href, '--test', ...tests], {
    cwd: packageRoot, stdio: 'inherit', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig, CORTICO_TOOLCHAIN_PACKAGE: dependencyManifest },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally { unlinkSync(tsconfig); rmdirSync(temporary); }
