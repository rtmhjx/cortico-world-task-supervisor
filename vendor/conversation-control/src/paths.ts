import { excludedRoots, DEFAULT_PRIVATE_ROOT, isExcludedPath } from '../../task-reporting/src/policy.ts';
import { realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export const PROTECTED_ROOT = DEFAULT_PRIVATE_ROOT;
const fold = (p: string) => process.platform === 'win32' ? p.toLowerCase() : p;
export const within = (child: string, root: string): boolean => {
  const r = relative(fold(root), fold(child));
  return r === '' || (!isAbsolute(r) && r !== '..' && !r.startsWith(`..${sep}`));
};
/** Metadata only; preserves missing suffixes and detects existing junctions. */
export async function canonical(path: string): Promise<string> {
  if (!isAbsolute(path)) throw new Error('Absolute workspace required.');
  let p = resolve(path); const tail: string[] = [];
  for (;;) {
    try { return join(await realpath(p), ...tail); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = dirname(p); if (parent === p) throw error;
      tail.unshift(relative(parent, p)); p = parent;
    }
  }
}
/** A delegation may contain the archive; each target still excludes it and its ancestors. */
export async function allowedDelegationRoot(root: string): Promise<boolean> {
  try { if (!isAbsolute(root) || isExcludedPath(root)) return false; const base = await canonical(root); return fold(base) === fold(resolve(root)) && !isExcludedPath(base); }
  catch { return false; }
}
/** A workspace containing an excluded directory cannot grant unrestricted native file access. */
export async function allowedWorkspace(path: string, roots: string[]): Promise<boolean> {
  try {
    if (!isAbsolute(path) || !roots.length || isExcludedPath(path, [], true)) return false;
    const child = await canonical(path);
    if (fold(child) !== fold(resolve(path)) || isExcludedPath(child, [], true)) return false;
    for (const root of roots) {
      if (!isAbsolute(root) || isExcludedPath(root)) continue;
      const base = await canonical(root);
      if (fold(base) !== fold(resolve(root)) || isExcludedPath(base)) continue;
      if (within(child, base)) return true;
    }
    return false;
  } catch { return false; }
}
