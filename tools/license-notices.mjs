import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { dependencyPath, packageRoot } from './toolchain.mjs';
export function bundledLicenseNotices(names) {
  return names.map(name => {
    const root = dirname(dependencyPath(`${name}/package.json`));
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    return `${name} ${pkg.version}\n${readFileSync(join(root, 'LICENSE'), 'utf8').trim()}\n`;
  }).join('\n');
}
/** A relocated installer/gateway remains a complete licensed single-file program. */
export function bundleBanner(names, requireAlias) {
  const own = readFileSync(join(packageRoot, 'vendor/task-reporting/LICENSE'), 'utf8').trim();
  const notice = `${own}\n\nBundled dependencies:\n\n${bundledLicenseNotices(names)}`.replaceAll('*/', '* /');
  return `/*!\n${notice}\n*/\nimport { createRequire as ${requireAlias} } from 'node:module'; const require = ${requireAlias}(import.meta.url);`;
}
