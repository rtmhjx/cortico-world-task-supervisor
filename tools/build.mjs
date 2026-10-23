/** Build the one API 6 World plus its separate native DSH plugin and worker. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { dependency, dependencyPath, packageRoot, portableOutputs } from './toolchain.mjs';
import { bundleBanner, bundledLicenseNotices } from './license-notices.mjs';
const { build, version } = dependency('esbuild');
const verify = process.argv.includes('--verify');
const result = await build({ absWorkingDir: packageRoot, entryPoints: [join(packageRoot, 'src/index.ts')],
  outfile: join(packageRoot, 'lib/index.js'), bundle: true, platform: 'node', format: 'esm', target: 'node24',
  packages: 'external', sourcemap: true, legalComments: 'eof', write: false, logLevel: 'warning' });
const outputs = [...portableOutputs(result.outputFiles).map(file => ({ path: file.path, contents: Buffer.from(file.contents) })),
  { path: join(packageRoot, 'lib/ENV_PROMPT.md'), contents: readFileSync(join(packageRoot, 'src/ENV_PROMPT.md')) }];
if (existsSync(join(packageRoot, 'src/installer.ts'))) {
  const installer = await build({ absWorkingDir: packageRoot, entryPoints: [join(packageRoot, 'src/installer.ts')], outfile: join(packageRoot, 'lib/install-gateway.mjs'),
    bundle: true, platform: 'node', format: 'esm', target: 'node24', packages: 'bundle', external: ['cortico/*', 'ws'],
    alias: { yaml: dependencyPath('yaml') }, sourcemap: true, legalComments: 'eof', write: false, logLevel: 'warning',
    banner: { js: bundleBanner(['yaml'], '__installerCreateRequire') } });
  outputs.push(...portableOutputs(installer.outputFiles, ['yaml']).map(file => ({ path: file.path, contents: Buffer.from(file.contents) })));
}
outputs.push({ path: join(packageRoot, 'THIRD-PARTY-LICENSES.txt'), contents: Buffer.from(bundledLicenseNotices(['ws', ...(existsSync(join(packageRoot, 'src/installer.ts')) ? ['yaml'] : [])])) });
for (const output of outputs) {
  if (verify) {
    if (!existsSync(output.path) || !readFileSync(output.path).equals(output.contents)) throw new Error(`Rebuild differs: ${relative(packageRoot, output.path)}`);
  } else { mkdirSync(dirname(output.path), { recursive: true }); writeFileSync(output.path, output.contents); }
}
const child = spawnSync(process.execPath, [join(packageRoot, 'tools/build-vendor.mjs'), ...(verify ? ['--verify'] : [])], { cwd: packageRoot, stdio: 'inherit' });
if (child.error || child.status !== 0) throw child.error ?? new Error('Vendor/worker build failed.');
console.log(JSON.stringify({ built: 'tasksupervisor', verified: verify, esbuild: version, outputs: outputs.map(file => relative(packageRoot, file.path).replaceAll('\\', '/')) }));
