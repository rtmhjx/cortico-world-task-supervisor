import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** The checkout is optional for builds, required for SDK-source integration tests. */
export const sdkRoot = process.env.CORTICO_DIR || process.env.CORTICO_SOURCE_ROOT || process.env.CORTICO_SOURCE ? resolve(process.env.CORTICO_DIR || process.env.CORTICO_SOURCE_ROOT || process.env.CORTICO_SOURCE) : undefined;
export const dependencyManifest = process.env.CORTICO_TOOLCHAIN_ROOT
  ? join(resolve(process.env.CORTICO_TOOLCHAIN_ROOT), 'package.json')
  : join(packageRoot, 'package.json');
export const dependencyRequire = createRequire(dependencyManifest);
const localRequire = createRequire(join(packageRoot, 'package.json'));
export function dependency(name) {
  try { return dependencyRequire(name); }
  catch (error) { throw new Error(`Install declared development dependencies or set CORTICO_TOOLCHAIN_ROOT to an existing toolchain checkout (${name}).`, { cause: error }); }
}
export function dependencyPath(name) {
  if ((name === 'yaml' || name.startsWith('yaml/')) && process.env.CORTICO_YAML_ROOT) return createRequire(join(resolve(process.env.CORTICO_YAML_ROOT), 'package.json')).resolve(name);
  try { return dependencyRequire.resolve(name); } catch { return localRequire.resolve(name); }
}
/** Dependency locations vary between npm and pnpm; published module labels do not. */
export function portableOutputs(files, bundledDependencies = []) {
  const roots = bundledDependencies.map(name => [name, realpathSync(dirname(dependencyPath(`${name}/package.json`)))]);
  return files.map(file => {
    let contents = Buffer.from(file.contents);
    if (file.path.endsWith('.map')) {
      const map = JSON.parse(contents.toString('utf8'));
      map.sources = map.sources.map(source => {
        for (const [name] of roots) {
          const marker = `/node_modules/${name}/`, at = source.replaceAll('\\', '/').lastIndexOf(marker);
          if (at !== -1) return `third-party/${name}/${source.slice(at + marker.length)}`;
          if (source.startsWith(`node_modules/${name}/`)) return `third-party/${name}/${source.slice(`node_modules/${name}/`.length)}`;
        }
        return source;
      });
      contents = Buffer.from(JSON.stringify(map, null, 2) + '\n');
    } else {
      let text = contents.toString('utf8');
      for (const [name, root] of roots) {
        const prefix = relative(packageRoot, root).replaceAll('\\', '/');
        const asciiPrefix = prefix.replace(/[^\x20-\x7e]/g, value => `\\u${value.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`);
        text = text.replaceAll(prefix, `third-party/${name}`).replaceAll(asciiPrefix, `third-party/${name}`);
      }
      contents = Buffer.from(text);
    }
    return { ...file, contents };
  });
}
