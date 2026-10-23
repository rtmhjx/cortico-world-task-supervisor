/** Portable, metadata-only exclusions shared by the aggregate and the separate DSH host. */
import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export const EXCLUSIONS_ENV = 'CORTICO_TASK_SUPERVISOR_EXCLUSIONS';
export const DEFAULT_PRIVATE_ROOT = join(homedir(), '.task-supervisor', 'private');
let nativeGatewayExclusions: readonly string[] | undefined;
const validRoots = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 100 && value.every(path => typeof path === 'string' && isAbsolute(path) && path.trim() && !/[\x00-\x1f]/.test(path));
const fold = (path: string): string => process.platform === 'win32' ? path.toLowerCase() : path;
export function containsPath(root: string, child: string): boolean {
  const part = relative(fold(resolve(root)), fold(resolve(child)));
  return part === '' || (!isAbsolute(part) && part !== '..' && !part.startsWith(`..${sep}`));
}
export function canonicalPolicyPath(path: string): string {
  if (!isAbsolute(path) || /[\x00-\x1f]/.test(path)) throw new Error('Exclusions require valid absolute paths.');
  let existing = resolve(path); const tail: string[] = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) throw new Error('Exclusion path has no existing ancestor.');
    tail.unshift(basename(existing)); existing = parent;
  }
  return join(realpathSync.native(existing), ...tail);
}
/** Set the same explicit exclusions in Cortico and DSH; no workstation paths ship in source. */
export function excludedRoots(extra: readonly string[] = []): string[] {
  const raw = process.env[EXCLUSIONS_ENV];
  let configured: unknown = [];
  if (raw !== undefined && raw !== '') {
    try { configured = JSON.parse(raw); } catch { throw new Error(`${EXCLUSIONS_ENV} must be a JSON array.`); }
  }
  if (!validRoots(configured) || !validRoots([...extra])) throw new Error('Task supervisor exclusions must be absolute path arrays.');
  return [...new Set([DEFAULT_PRIVATE_ROOT, ...configured, ...(nativeGatewayExclusions ?? []), ...extra].map(path => resolve(path)))];
}
/** The standalone native Gateway owns one immutable policy in its own compiled bundle. */
export function configureNativeGatewayExclusions(roots: readonly string[]): void {
  if (!validRoots([...roots])) throw new Error('Gateway excludedRoots must be an absolute path array.');
  const next = [...new Set(roots.map(path => resolve(path)))].sort();
  if (nativeGatewayExclusions && JSON.stringify(nativeGatewayExclusions) !== JSON.stringify(next)) throw new Error('Gateway exclusion policy changed; restart the native host and preserve its previous state.');
  nativeGatewayExclusions = Object.freeze(next);
}
/** Check both configured and canonical targets; ancestors are optional for whole-workspace access. */
export function isExcludedPath(path: string, extra: readonly string[] = [], ancestors = false): boolean {
  const lexical = resolve(path), actual = canonicalPolicyPath(path);
  return excludedRoots(extra).some(root => {
    const realRoot = canonicalPolicyPath(root);
    return containsPath(root, lexical) || containsPath(realRoot, actual) || ancestors && (containsPath(lexical, root) || containsPath(actual, realRoot));
  });
}
