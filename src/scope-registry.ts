/** Preserve same-scope restarts, but every actual scope change gets a fresh OFF generation. */
import{randomUUID}from'node:crypto';
import{mkdirSync}from'node:fs';
import{join,resolve}from'node:path';
import{DatabaseSync}from'node:sqlite';
import{canonicalPolicyPath,isExcludedPath}from'../vendor/task-reporting/src/policy.ts';
export function selectScopeDirectory(base:string,fingerprint:string,denied:readonly string[]):string{
  if(!/^[a-f0-9]{24}$/.test(fingerprint))throw new Error('Invalid scope fingerprint.');
  const actual=canonicalPolicyPath(base),fold=(value:string)=>process.platform==='win32'?value.toLowerCase():value;
  if(fold(actual)!==fold(resolve(base))||isExcludedPath(base,denied))throw new Error('Scope state cannot use a filesystem alias or excluded root.');
  mkdirSync(base,{recursive:true,mode:0o700});const db=new DatabaseSync(join(base,'scope-registry.sqlite'));
  try{
    const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row=>String(row.name));
    if(tables.length&&(tables.length!==1||tables[0]!=='scope_registry'))throw new Error('Scope registry is not a recognized metadata database; preserve it.');
    db.exec('PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;');
    try{
      db.exec('CREATE TABLE IF NOT EXISTS scope_registry(id INTEGER PRIMARY KEY CHECK(id=1), fingerprint TEXT NOT NULL, generation TEXT NOT NULL, revision INTEGER NOT NULL);');
      const old=db.prepare('SELECT * FROM scope_registry WHERE id=1').get();
      let generation:string;
      if(old?.fingerprint===fingerprint&&typeof old.generation==='string'&&/^[a-f0-9-]{36}$/.test(old.generation))generation=old.generation;
      else{generation=randomUUID();db.prepare('INSERT INTO scope_registry VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET fingerprint=excluded.fingerprint,generation=excluded.generation,revision=excluded.revision').run(fingerprint,generation,Number(old?.revision??0)+1);}
      db.exec('COMMIT;');return join(base,'scopes',`${fingerprint}-${generation}`);
    }catch(error){db.exec('ROLLBACK;');throw error;}
  }finally{db.close();}
}
