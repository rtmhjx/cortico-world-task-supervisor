import { dirname, join } from 'node:path';
import { dependency, dependencyPath, packageRoot, sdkRoot } from './toolchain.mjs';
if (!sdkRoot) throw new Error('Set CORTICO_DIR (or CORTICO_SOURCE_ROOT) to the supported Cortico source checkout.');
const ts = dependency('typescript');
const configFile = ts.readConfigFile(join(packageRoot, 'tsconfig.vendor.json'), ts.sys.readFile);
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
if (process.argv.includes('--all')) configFile.config.include.push('src/**/*.ts', 'tests/**/*.ts');
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, packageRoot, {
  paths: { 'cortico/*': [join(sdkRoot, 'src', '*').replaceAll('\\', '/')], ws: [join(dirname(dependencyPath('@types/ws/package.json')), 'index.d.ts')],
    ...(process.argv.includes('--all') ? { yaml: [join(dirname(dependencyPath('yaml/package.json')), 'dist/index.d.ts')] } : {}) },
  typeRoots: [join(dirname(dependencyPath('@types/node/package.json')), '..')],
});
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => packageRoot, getCanonicalFileName: path => path, getNewLine: () => '\n' }));
  process.exitCode = 1;
} else console.log(`Vendor typecheck passed (${parsed.fileNames.length} source and fixture files).`);
