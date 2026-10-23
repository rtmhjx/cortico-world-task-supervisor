/** Reproducible bundles for the separate DSH host plugin and the memory worker. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { dependency, dependencyPath, packageRoot, portableOutputs } from './toolchain.mjs';
import { bundleBanner } from './license-notices.mjs';
const { build, version } = dependency('esbuild');
const verify = process.argv.includes('--verify');
const gatewayOnly = process.argv.includes('--gateway-only');
const vendor = join(packageRoot, 'vendor');
const gateway = join(vendor, 'dsh-conversation-gateway');
const entries = [{ input: join(gateway, 'src/index.ts'), output: join(gateway, 'lib/index.js') }];
if (!gatewayOnly) entries.push({ input: join(vendor, 'cortico-world-dsh-memory/src/raw-worker.ts'), output: join(packageRoot, 'lib/dsh-memory-raw-worker.mjs') });
const outputs = [];
for (const entry of entries) {
  const isGateway = entry.input === join(gateway, 'src/index.ts');
  const result = await build({ absWorkingDir: packageRoot, entryPoints: [entry.input], outfile: entry.output,
    bundle: true, platform: 'node', format: 'esm', target: 'node24', packages: isGateway ? 'bundle' : 'external', sourcemap: true,
    ...(isGateway ? { alias: { ws: dependencyPath('ws') }, external: ['bufferutil', 'utf-8-validate'],
      banner: { js: bundleBanner(['ws'], '__gatewayCreateRequire') } } : {}),
    legalComments: 'eof', write: false, logLevel: 'warning' });
  for (const output of portableOutputs(result.outputFiles, isGateway ? ['ws'] : [])) {
    if (verify) {
      if (!existsSync(output.path) || !readFileSync(output.path).equals(Buffer.from(output.contents))) throw new Error(`Rebuild differs: ${relative(packageRoot, output.path)}`);
    } else { mkdirSync(dirname(output.path), { recursive: true }); writeFileSync(output.path, output.contents); }
    outputs.push({ path: relative(packageRoot, output.path).replaceAll('\\', '/'), sha256: createHash('sha256').update(output.contents).digest('hex') });
  }
}
if (!verify) writeFileSync(join(gateway, 'README.md'), '# Separate DSH host gateway\n\nThis is a DSH host plugin. It must run inside the real DSH process; the Cortico aggregate cannot emulate the native host lifecycle APIs. Install this package in DSH and configure explicit project/observation roots, a loopback port, stateDir outside delegated projects and a managed credential reference. Resolve the credential through the DSH credential provider; never put a token in an environment file.\n\nBuild from the aggregate root with `node tools/build-vendor.mjs --gateway-only`. The optional Codex WebSocket transport is bundled, including its license; no separate ws installation is required. Desktop IPC is a version-pinned Windows transport and requires explicit user configuration. Set excludedRoots in the gateway plugin configuration to the setup form exclusion array. Its actual path guards, native observer, health and persisted identity share this policy. The optional administrator environment CORTICO_TASK_SUPERVISOR_EXCLUSIONS can add further exclusions. No local paths or credentials are included here.\n');
console.log(JSON.stringify({ verified: verify, esbuild: version, outputs }));
