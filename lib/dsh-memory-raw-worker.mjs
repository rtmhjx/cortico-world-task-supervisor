// vendor/cortico-world-dsh-memory/src/raw-worker.ts
import { parentPort, workerData } from "node:worker_threads";

// vendor/task-reporting/src/policy.ts
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
var EXCLUSIONS_ENV = "CORTICO_TASK_SUPERVISOR_EXCLUSIONS";
var DEFAULT_PRIVATE_ROOT = join(homedir(), ".task-supervisor", "private");
var nativeGatewayExclusions;
var validRoots = (value) => Array.isArray(value) && value.length <= 100 && value.every((path) => typeof path === "string" && isAbsolute(path) && path.trim() && !/[\x00-\x1f]/.test(path));
var fold = (path) => process.platform === "win32" ? path.toLowerCase() : path;
function containsPath(root, child) {
  const part = relative(fold(resolve(root)), fold(resolve(child)));
  return part === "" || !isAbsolute(part) && part !== ".." && !part.startsWith(`..${sep}`);
}
function canonicalPolicyPath(path) {
  if (!isAbsolute(path) || /[\x00-\x1f]/.test(path)) throw new Error("Exclusions require valid absolute paths.");
  let existing = resolve(path);
  const tail = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) throw new Error("Exclusion path has no existing ancestor.");
    tail.unshift(basename(existing));
    existing = parent;
  }
  return join(realpathSync.native(existing), ...tail);
}
function excludedRoots(extra = []) {
  const raw = process.env[EXCLUSIONS_ENV];
  let configured = [];
  if (raw !== void 0 && raw !== "") {
    try {
      configured = JSON.parse(raw);
    } catch {
      throw new Error(`${EXCLUSIONS_ENV} must be a JSON array.`);
    }
  }
  if (!validRoots(configured) || !validRoots([...extra])) throw new Error("Task supervisor exclusions must be absolute path arrays.");
  return [...new Set([DEFAULT_PRIVATE_ROOT, ...configured, ...nativeGatewayExclusions ?? [], ...extra].map((path) => resolve(path)))];
}
function isExcludedPath(path, extra = [], ancestors = false) {
  const lexical = resolve(path), actual = canonicalPolicyPath(path);
  return excludedRoots(extra).some((root) => {
    const realRoot = canonicalPolicyPath(root);
    return containsPath(root, lexical) || containsPath(realRoot, actual) || ancestors && (containsPath(lexical, root) || containsPath(actual, realRoot));
  });
}

// vendor/cortico-world-dsh-memory/src/raw.ts
import { closeSync, existsSync as existsSync3, fstatSync, fsyncSync, mkdirSync, openSync, readFileSync, readSync as readSync2, readdirSync, realpathSync as realpathSync3, renameSync, statSync as statSync2, unlinkSync, writeFileSync } from "node:fs";
import { createHash as createHash2, randomUUID } from "node:crypto";
import { homedir as homedir2 } from "node:os";
import { basename as basename3, dirname as dirname3, isAbsolute as isAbsolute3, join as join3, relative as relative3, resolve as resolve3, sep as sep3 } from "node:path";

// vendor/cortico-world-dsh-memory/src/zstd.ts
import { constants, createZstdDecompress, zstdDecompressSync } from "node:zlib";
import { readSync } from "node:fs";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
var ZSTD_MAGIC = 4247762216;
function inspectZstdFrameAt(fd, size, start) {
  let offset = start;
  const read = (count) => {
    if (offset + count > size) return null;
    const buffer = Buffer.alloc(count);
    if (readSync(fd, buffer, 0, count, offset) !== count) return null;
    offset += count;
    return buffer;
  };
  const magic = read(4);
  if (!magic) return null;
  if (magic.readUInt32LE(0) !== ZSTD_MAGIC) throw new Error(`\u4E0D\u662F\u5408\u6CD5\u7684 zstd \u5E27\uFF1A\u5B57\u8282 ${start} \u5904\u9B54\u6570\u4E0D\u5BF9`);
  const descriptorBytes = read(1);
  if (!descriptorBytes) return null;
  const descriptor = descriptorBytes[0];
  if ((descriptor & 24) !== 0) throw new Error(`zstd \u5E27\u5934\u4FDD\u7559\u4F4D\u65E0\u6548\uFF1A\u5B57\u8282 ${start + 4}`);
  const flag = descriptor >>> 6;
  const single = (descriptor & 32) !== 0;
  const dictionaryFlag = descriptor & 3;
  const headerBytes = (single ? 0 : 1) + (dictionaryFlag === 3 ? 4 : dictionaryFlag) + (flag === 0 ? single ? 1 : 0 : 1 << flag);
  if (!read(headerBytes)) return null;
  for (; ; ) {
    const block = read(3);
    if (!block) return null;
    const bits = block.readUIntLE(0, 3);
    const kind = bits >>> 1 & 3;
    if (kind === 3) throw new Error(`zstd \u5757\u7C7B\u578B\u4FDD\u7559\u503C\uFF1A\u5B57\u8282 ${offset - 3}`);
    const payload = kind === 1 ? 1 : bits >>> 3;
    if (offset + payload > size) return null;
    offset += payload;
    if ((bits & 1) !== 0) break;
  }
  if ((descriptor & 4) !== 0 && !read(4)) return null;
  return { start, end: offset };
}
async function* decodeZstdFrameChunks(fd, frame, onInput) {
  async function* compressedChunks() {
    let position = frame.start;
    while (position < frame.end) {
      const chunk = Buffer.alloc(Math.min(32 * 1024, frame.end - position));
      const bytes = readSync(fd, chunk, 0, chunk.length, position);
      if (bytes !== chunk.length) throw new Error(`zstd \u6E90\u5E27\u88AB\u622A\u77ED\uFF1A\u5B57\u8282 ${position}`);
      position += bytes;
      const data = chunk.subarray(0, bytes);
      onInput?.(data);
      yield data;
    }
  }
  const input = Readable.from(compressedChunks(), { objectMode: false, highWaterMark: 32 * 1024 });
  const decoder = createZstdDecompress({ chunkSize: 32 * 1024, params: { [constants.ZSTD_d_windowLogMax]: 26 } });
  const onError = (error) => {
    decoder.destroy(error);
  };
  input.on("error", onError);
  input.pipe(decoder);
  try {
    for await (const chunk of decoder) yield chunk;
  } finally {
    input.unpipe(decoder);
    input.destroy();
    decoder.destroy();
    await Promise.allSettled([finished(input, { cleanup: true }), finished(decoder, { cleanup: true })]);
    input.removeListener("error", onError);
  }
}

// vendor/cortico-world-dsh-memory/src/scope.ts
import { existsSync as existsSync2, realpathSync as realpathSync2, statSync } from "node:fs";
import { basename as basename2, dirname as dirname2, isAbsolute as isAbsolute2, join as join2, relative as relative2, resolve as resolve2, sep as sep2 } from "node:path";
import { createHash } from "node:crypto";
function protectedWorkspace(path) {
  return isExcludedPath(path);
}
function containsWorkspace(root, target) {
  const fold2 = (value) => process.platform === "win32" ? value.toLowerCase() : value;
  const delta = relative2(fold2(root), fold2(target));
  return delta === "" || !isAbsolute2(delta) && delta !== ".." && !delta.startsWith(".." + sep2);
}
function canonicalWorkspace(path) {
  if (!isAbsolute2(path) || /[\x00-\x1f]/.test(path)) throw new Error("\u5DE5\u4F5C\u533A\u8DEF\u5F84\u5FC5\u987B\u662F\u5408\u6CD5\u7EDD\u5BF9\u8DEF\u5F84\u3002");
  let current = resolve2(path);
  const suffix = [];
  while (!existsSync2(current)) {
    const parent = dirname2(current);
    if (parent === current) throw new Error("\u5DE5\u4F5C\u533A\u8DEF\u5F84\u6CA1\u6709\u6709\u6548\u7236\u76EE\u5F55\u3002");
    suffix.unshift(basename2(current));
    current = parent;
  }
  return join2(realpathSync2.native(current), ...suffix);
}
function bindWorkspaces(roots) {
  return roots.map((configured) => {
    if (protectedWorkspace(configured)) throw new Error("\u53D7\u4FDD\u62A4\u7684\u5BF9\u8BDD\u8BB0\u5F55\u6216\u5907\u4EFD\u76EE\u5F55\u4E0D\u80FD\u4F5C\u4E3A\u6388\u6743\u5DE5\u4F5C\u533A\u3002");
    if (!existsSync2(configured) || !statSync(configured).isDirectory()) throw new Error("\u6388\u6743\u5DE5\u4F5C\u533A\u6839\u76EE\u5F55\u4E0D\u5B58\u5728\u6216\u4E0D\u662F\u76EE\u5F55\u3002");
    const info = statSync(configured);
    const real = canonicalWorkspace(configured);
    if (protectedWorkspace(real)) throw new Error("\u6388\u6743\u5DE5\u4F5C\u533A\u7684\u771F\u5B9E\u76EE\u6807\u5C5E\u4E8E\u53D7\u4FDD\u62A4\u76EE\u5F55\u3002");
    return { configured: resolve2(configured), real, dev: info.dev, ino: info.ino, birthtimeMs: info.birthtimeMs };
  });
}
function checkWorkspaceBindings(bindings) {
  for (const item of bindings) {
    if (!existsSync2(item.configured)) throw new Error("\u6388\u6743\u5DE5\u4F5C\u533A\u6839\u76EE\u5F55\u5DF2\u6D88\u5931\uFF1B\u4FDD\u7559\u72B6\u6001\u5E76\u62D2\u7EDD\u8BFB\u53D6\u3002");
    const info = statSync(item.configured);
    if (!info.isDirectory() || canonicalWorkspace(item.configured) !== item.real || info.dev !== item.dev || info.ino !== item.ino || info.birthtimeMs !== item.birthtimeMs) throw new Error("\u6388\u6743\u5DE5\u4F5C\u533A\u6839\u76EE\u5F55\u5DF2\u66FF\u6362\u6216\u91CD\u5B9A\u5411\uFF1B\u4FDD\u7559\u72B6\u6001\u5E76\u62D2\u7EDD\u8BFB\u53D6\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u914D\u7F6E\u3002");
  }
}
function authorizedWorkspace(cwd, opts) {
  if (typeof cwd !== "string" || !isAbsolute2(cwd) || /[\x00-\x1f]/.test(cwd)) return null;
  const bindings = opts.workspaceBindings ?? bindWorkspaces(opts.allowedWorkspaces ?? []);
  checkWorkspaceBindings(bindings);
  const lexical = resolve2(cwd), real = canonicalWorkspace(cwd);
  for (const path of excludedRoots()) if (isAbsolute2(path)) {
    const protectedDir = canonicalWorkspace(path);
    if (containsWorkspace(resolve2(path), lexical) || containsWorkspace(protectedDir, real)) return null;
  }
  if (!bindings.some((root) => containsWorkspace(root.configured, lexical) && containsWorkspace(root.real, real))) return null;
  for (const path of opts.deniedWorkspaces ?? []) {
    if (containsWorkspace(resolve2(path), lexical) || containsWorkspace(canonicalWorkspace(path), real)) return null;
  }
  return real;
}
function workspaceScopeHash(opts) {
  return createHash("sha256").update(JSON.stringify({ roots: opts.workspaceBindings ?? bindWorkspaces(opts.allowedWorkspaces ?? []), denied: (opts.deniedWorkspaces ?? []).map((path) => ({ configured: resolve2(path), real: canonicalWorkspace(path) })) })).digest("hex");
}

// vendor/cortico-world-dsh-memory/src/raw.ts
var SCRUB_VERSION = 3;
var MAX_LINE_BYTES = 2 * 1024 * 1024;
var MAX_MIRROR_BYTES = 64 * 1024 * 1024;
var MAX_DECODED_BYTES = 64 * 1024 * 1024;
var MAX_READ_OUTPUT_BYTES = 4 * 1024 * 1024;
var hash = (value) => createHash2("sha256").update(value).digest("hex");
function scrubText(text) {
  return text.replace(/(["'`]?(?:api[_-]?key|apikey|access[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|token|secret|passwd|password)["'`]?[\s]*[:=＝][\s]*)(["'`])([^"'`\r\n]+)\2/gi, "$1$2<\u5DF2\u9690\u53BB>$2").replace(/\b(?:api[_-]?key|apikey|access[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|token|secret|passwd|password)[_\-:=＝\s]{1,3}[A-Za-z0-9_\-./+]{8,}/gi, (m) => `${m.split(/[:=＝\s]/)[0].split(/_(?=[A-Za-z0-9]{8,})/)[0]}=<\u5DF2\u9690\u53BB>`).replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-<\u5DF2\u9690\u53BB>").replace(/\b8ZZ[A-Za-z0-9]{16,}/g, "<token \u5DF2\u9690\u53BB>").replace(/Bearer\s+[A-Za-z0-9._~+/-]{8,}={0,2}/gi, "Bearer <\u5DF2\u9690\u53BB>").replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}/g, "<jwt \u5DF2\u9690\u53BB>").replace(/((?:[?&])(?:token|access_token|key)=)[^\s"'`&]+/gi, "$1<\u5DF2\u9690\u53BB>").replace(/[0-9a-f]{32,}/gi, "<\u957F\u5341\u516D\u8FDB\u5236\u5DF2\u9690\u53BB>");
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function plainContent(content) {
  if (!Array.isArray(content)) return "";
  return content.map(object).filter((c) => c?.type === "text" && typeof c.text === "string").map((c) => c.text).join("\n").trim();
}
function extractEvent(event, state, ordinal) {
  if (event.type === "turn/end" || event.type === "turn/abort") {
    state.active = false;
    return null;
  }
  if (event.type !== "user/message" && event.type !== "assistant/message") return null;
  const data = object(event.data);
  const message = event.type === "user/message" ? data : object(data?.message);
  if (event.type === "user/message") {
    if (object(data?.source)?.kind !== "user") return null;
    state.active = true;
  } else if (!state.active) return null;
  const text = plainContent(message?.content);
  if (!text) return null;
  const role = event.type === "user/message" ? "user" : "assistant";
  const source = Number.isSafeInteger(event.seq) ? `seq:${event.seq}` : typeof message?.id === "string" ? `id:${message.id}` : `line:${ordinal}`;
  return { ts: typeof event.time === "number" && Number.isFinite(event.time) ? event.time : 0, role, text, sourceId: `${role}:${source}` };
}
function decodeBucket(bucket) {
  return bucket.replace(/^--|--$/g, "").replace(/~([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function protectedPath(value) {
  return isExcludedPath(resolve3(value));
}
function protectedBucket(bucket) {
  const value = decodeBucket(bucket).toLowerCase();
  return excludedRoots().some((root) => value.includes(basename3(root).toLowerCase()));
}
function validateBucket(bucket) {
  if (!bucket || bucket !== bucket.trim() || bucket === "." || bucket === ".." || /[\\/:\x00-\x1f*?"<>|]/.test(bucket) || bucket.endsWith(".") || bucket.endsWith(" ")) throw new Error("bucket \u5FC5\u987B\u662F\u4E00\u4E2A\u5B89\u5168\u76EE\u5F55\u540D\uFF0C\u4E0D\u80FD\u542B\u8DEF\u5F84\u5206\u9694\u7B26\u6216\u76F8\u5BF9\u8DEF\u5F84\u3002");
  if (protectedBucket(bucket)) throw new Error("\u53D7\u4FDD\u62A4\u7684\u5BF9\u8BDD\u5907\u4EFD\u5DE5\u4F5C\u533A\u4E0D\u5141\u8BB8\u8BFB\u53D6\u3002");
  return bucket;
}
function contained(root, target) {
  const delta = relative3(root, target);
  return delta === "" || !isAbsolute3(delta) && delta !== ".." && !delta.startsWith(".." + sep3);
}
function canonical(path) {
  if (protectedPath(resolve3(path))) throw new Error("\u53D7\u4FDD\u62A4\u7684\u5BF9\u8BDD\u8BB0\u5F55\u6216\u5907\u4EFD\u8DEF\u5F84\u4E0D\u5141\u8BB8\u8BBF\u95EE\u3002");
  let current = resolve3(path);
  const suffix = [];
  while (!existsSync3(current)) {
    const parent = dirname3(current);
    if (parent === current) break;
    suffix.unshift(basename3(current));
    current = parent;
  }
  const result = join3(realpathSync3(current), ...suffix);
  if (protectedPath(result)) throw new Error("\u53D7\u4FDD\u62A4\u7684\u5BF9\u8BDD\u8BB0\u5F55\u6216\u5907\u4EFD\u8DEF\u5F84\u4E0D\u5141\u8BB8\u8BBF\u95EE\u3002");
  return result;
}
function checked(root, ...parts) {
  const base = canonical(root);
  const target = canonical(join3(root, ...parts));
  if (!contained(base, target)) throw new Error("\u539F\u6587\u8DEF\u5F84\u8D8A\u8FC7\u914D\u7F6E\u6839\u76EE\u5F55\uFF08\u542B\u7B26\u53F7\u94FE\u63A5\u6216 junction\uFF09\u3002");
  return target;
}
function allowed(bucket, scope) {
  return !scope?.length || scope.includes(bucket);
}
function enforceAllowed(bucket, scope) {
  validateBucket(bucket);
  if (!allowed(bucket, scope)) throw new Error(`bucket \u4E0D\u5728\u914D\u7F6E rawBuckets \u8303\u56F4\uFF1A${bucket}`);
}
function validateScope(scope) {
  for (const bucket of scope ?? []) validateBucket(bucket);
}
function positiveInt(value, label, max) {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error(`${label} \u5FC5\u987B\u662F 1 \u5230 ${max} \u7684\u6574\u6570\u3002`);
}
function resolveRawPaths(opts) {
  return { sessionsDir: opts.sessionsDir.trim() || join3(homedir2(), ".dsh", "sessions"), rawDir: opts.rawDir.trim() || join3(dirname3(opts.dbFile), "raw") };
}
function mirrorBuckets(rawDir, scope) {
  if (!existsSync3(rawDir)) return [];
  checked(rawDir);
  return readdirSync(rawDir, { withFileTypes: true }).filter((d) => !d.name.startsWith(".") && !protectedBucket(d.name) && (d.isDirectory() || d.isSymbolicLink())).map((d) => d.name).filter((b) => allowed(b, scope)).map((b) => {
    validateBucket(b);
    checked(rawDir, b);
    return b;
  }).sort();
}
function loadManifest(rawDir) {
  const file = checked(rawDir, ".manifest.json");
  if (!existsSync3(file)) return { version: 2, scrub: SCRUB_VERSION, legacy: mirrorBuckets(rawDir).length > 0, files: {}, buckets: {} };
  let value;
  try {
    value = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error("\u539F\u6587\u6E05\u5355 .manifest.json \u635F\u574F\uFF1B\u5DF2\u4FDD\u7559\u955C\u50CF\uFF0C\u62D2\u7EDD\u4ECE\u96F6\u91CD\u65B0\u5BFC\u5165\u3002");
  }
  const parsed = object(value);
  const files = object(parsed?.files);
  if (!parsed || parsed.version !== 1 && parsed.version !== 2 || !Number.isSafeInteger(parsed.scrub) || !files) throw new Error("\u539F\u6587\u6E05\u5355\u683C\u5F0F\u65E0\u6548\uFF1B\u62D2\u7EDD\u91CD\u65B0\u5BFC\u5165\u3002");
  for (const [key, entry] of Object.entries(files)) {
    const item = object(entry);
    if (!item || !Number.isSafeInteger(item.turns) || item.turns < 0) throw new Error(`\u539F\u6587\u6E05\u5355\u6E38\u6807\u65E0\u6548\uFF1A${key}`);
    if (item.cursor !== void 0) {
      const cursor = object(item.cursor);
      if (!cursor || !["frame", "line", "ordinal"].every((k) => Number.isSafeInteger(cursor[k]) && cursor[k] >= 0) || typeof cursor.active !== "boolean" || typeof cursor.identity !== "string" || cursor.frameHash !== void 0 && (typeof cursor.frameHash !== "string" || !/^[a-f0-9]{64}$/.test(cursor.frameHash))) throw new Error(`\u539F\u6587\u6E05\u5355\u6E90\u6E38\u6807\u65E0\u6548\uFF1A${key}`);
    }
  }
  if (parsed.updatedAt !== void 0 && (typeof parsed.updatedAt !== "string" || !Number.isFinite(Date.parse(parsed.updatedAt)))) throw new Error("\u539F\u6587\u6E05\u5355\u540C\u6B65\u65F6\u95F4\u65E0\u6548\u3002");
  if (parsed.sourceSessionsDir !== void 0 && typeof parsed.sourceSessionsDir !== "string") throw new Error("\u539F\u6587\u6E05\u5355\u6E90\u76EE\u5F55\u65E0\u6548\u3002");
  if (parsed.buckets !== void 0) {
    const counts = object(parsed.buckets);
    if (!counts) throw new Error("\u539F\u6587\u6E05\u5355\u8BA1\u6570\u65E0\u6548\u3002");
    for (const b of Object.values(counts)) {
      const days = object(object(b)?.days);
      if (!days || !Object.entries(days).every(([d, n]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isSafeInteger(n) && n >= 0)) throw new Error("\u539F\u6587\u6E05\u5355\u65E5\u671F\u8BA1\u6570\u65E0\u6548\u3002");
    }
  }
  return { ...parsed, files, legacy: parsed.legacy === true || parsed.version === 1 };
}
function saveManifest(rawDir, manifest) {
  const file = checked(rawDir, ".manifest.json");
  const temp = checked(rawDir, `.manifest-${randomUUID()}.tmp`);
  const fd = openSync(temp, "wx");
  try {
    writeFileSync(fd, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temp, file);
}
function* mirrorRows(file) {
  if (statSync2(file).size > MAX_MIRROR_BYTES) throw new Error("\u955C\u50CF\u6587\u4EF6\u8D85\u8FC7\u8BFB\u53D6\u9884\u7B97\uFF0864 MiB\uFF09\uFF1B\u9700\u8981\u5206\u7247\u540E\u518D\u8BBF\u95EE\u3002");
  const fd = openSync(file, "r");
  let pending = "";
  let lineNo = 0;
  const chunk = Buffer.alloc(64 * 1024);
  const decoder = new TextDecoder();
  try {
    let bytes;
    while ((bytes = readSync2(fd, chunk, 0, chunk.length, null)) > 0) {
      pending += decoder.decode(chunk.subarray(0, bytes), { stream: true });
      let at;
      while ((at = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, at);
        pending = pending.slice(at + 1);
        lineNo += 1;
        if (!line.trim()) continue;
        let value;
        try {
          value = JSON.parse(line);
        } catch {
          throw new Error(`\u955C\u50CF JSON \u635F\u574F\uFF1A${basename3(file)} \u7B2C ${lineNo} \u884C\u3002`);
        }
        const row = object(value);
        if (!row || !["ts", "win", "role", "text"].every((k) => typeof row[k] === "string")) throw new Error(`\u955C\u50CF\u8BB0\u5F55\u65E0\u6548\uFF1A${basename3(file)} \u7B2C ${lineNo} \u884C\u3002`);
        if (typeof row.sourceBucket === "string" && protectedBucket(row.sourceBucket)) continue;
        yield { row, line: lineNo };
      }
      if (Buffer.byteLength(pending) > MAX_LINE_BYTES) throw new Error("\u955C\u50CF\u5355\u6761\u6D88\u606F\u8D85\u8FC7\u8BFB\u53D6\u9884\u7B97\uFF082 MiB\uFF09\u3002");
    }
    pending += decoder.decode();
    if (pending.trim()) throw new Error(`\u955C\u50CF\u672B\u5C3E\u8BB0\u5F55\u672A\u5B8C\u6210\uFF1A${basename3(file)}\uFF1B\u4FDD\u7559\u539F\u6587\u4EF6\uFF0C\u62D2\u7EDD\u8FFD\u52A0\u3002`);
  } finally {
    closeSync(fd);
  }
}
function fingerprint(row) {
  return hash(JSON.stringify([row.ts, row.win, row.role, scrubText(row.text)]));
}
var SourceBudgetError = class extends Error {
  constructor() {
    super("DSH \u672C\u8F6E\u5E27\u6821\u9A8C\u6216\u65B0\u884C\u5904\u7406\u9884\u7B97\u5DF2\u7528\u5C3D\uFF1B\u5DF2\u4FDD\u5B58\u5B8C\u6574\u884C\u6E38\u6807\uFF0C\u4E0B\u6B21\u7EED\u626B\u3002");
  }
};
function frameError(file, frame, error) {
  const nodeError = error;
  return new Error(`DSH \u539F\u6587\u6D41\u89E3\u7801\u5931\u8D25\uFF1Afile=${file}; frameOffset=${frame.start}; compressedBytes=${frame.end - frame.start}; nodeCode=${nodeError.code ?? "unknown"}; nodeMessage=${scrubText(nodeError.message ?? String(error))}\uFF1B\u6E38\u6807\u672A\u63A8\u8FDB\u3002`);
}
function inspectFrame(fd, file, size, start) {
  if (start > size) throw new Error("DSH \u6E90\u4F1A\u8BDD\u88AB\u622A\u77ED\uFF1B\u4FDD\u7559\u540C\u6B65\u6E38\u6807\uFF0C\u4E0D\u91CD\u65B0\u5BFC\u5165\u3002");
  if (file.endsWith(".zstd")) {
    try {
      return inspectZstdFrameAt(fd, size, start);
    } catch (error) {
      throw frameError(file, { start, end: size }, error);
    }
  }
  let offset = start;
  while (offset < size) {
    const chunk = Buffer.alloc(Math.min(32 * 1024, size - offset));
    const bytes = readSync2(fd, chunk, 0, chunk.length, offset);
    const lf = chunk.subarray(0, bytes).indexOf(10);
    if (lf >= 0) return { start, end: offset + lf + 1 };
    offset += bytes;
    if (!bytes) return null;
    if (offset - start > MAX_LINE_BYTES) throw new Error("DSH \u5355\u6761\u4E8B\u4EF6\u8D85\u8FC7 2 MiB \u8BFB\u53D6\u9884\u7B97\u3002");
  }
  return null;
}
async function* frameChunks(fd, file, frame, onInput) {
  if (file.endsWith(".zstd")) {
    try {
      yield* decodeZstdFrameChunks(fd, frame, onInput);
    } catch (error) {
      throw frameError(file, frame, error);
    }
  } else {
    for (let at = frame.start; at < frame.end; ) {
      const chunk = Buffer.alloc(Math.min(32 * 1024, frame.end - at));
      const bytes = readSync2(fd, chunk, 0, chunk.length, at);
      if (bytes !== chunk.length) throw new Error("DSH \u6E90\u4F1A\u8BDD\u88AB\u622A\u77ED\u3002");
      at += bytes;
      onInput(chunk);
      yield chunk;
    }
  }
}
function assertSourceStable(fd, before) {
  const now = fstatSync(fd);
  if (now.ino !== before.ino || now.dev !== before.dev || now.size < before.size || now.size === before.size && (now.mtimeMs !== before.mtimeMs || now.ctimeMs !== before.ctimeMs)) {
    throw new Error("DSH \u6E90\u5E27\u5728\u6821\u9A8C/\u8BFB\u53D6\u4E4B\u95F4\u53D1\u751F\u6539\u5199\uFF1B\u4FDD\u7559\u5DF2\u63D0\u4EA4\u6E38\u6807\uFF0C\u62D2\u7EDD\u63D0\u4EA4\u672C\u8F6E\u6E05\u5355\u3002");
  }
}
async function validateFrame(fd, file, frame, budget) {
  const bytes = frame.end - frame.start;
  if (bytes > budget.limit) throw new Error(`DSH \u5355\u538B\u7F29\u5E27\u8D85\u8FC7\u5B8C\u6574\u6821\u9A8C\u9884\u7B97\uFF0C\u4E0D\u80FD\u8FFD\u8D76\uFF1Afile=${file}; frameOffset=${frame.start}; compressedBytes=${bytes}; validationBudget=${budget.limit}\u3002`);
  if (bytes > budget.remaining) throw new SourceBudgetError();
  const digest = createHash2("sha256");
  for await (const chunk of frameChunks(fd, file, frame, (input) => {
    digest.update(input);
    budget.scanned += input.length;
    budget.remaining -= input.length;
  })) budget.validationDecodedBytes += chunk.length;
  return digest.digest("hex");
}
async function sourceHeader(fd, file, size, budget) {
  const frame = inspectFrame(fd, file, size, 0);
  if (!frame) throw new Error("DSH \u4F1A\u8BDD\u5934\u5C1A\u672A\u5B8C\u6210\u3002");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let pending = "";
  for await (const chunk of frameChunks(fd, file, frame, (input) => {
    budget.headerReadBytes += input.length;
  })) {
    pending += decoder.decode(chunk, { stream: true });
    const lf = pending.indexOf("\n");
    if (lf >= 0) {
      let value;
      try {
        value = JSON.parse(pending.slice(0, lf));
      } catch {
        throw new Error("DSH \u4F1A\u8BDD\u5934\u635F\u574F\u3002");
      }
      const header = object(value);
      if (!header || header.type !== "session") throw new Error("DSH \u4F1A\u8BDD\u7F3A\u5C11 session \u5934\u3002");
      if (typeof header.cwd === "string" && protectedPath(header.cwd)) throw new Error("DSH \u4F1A\u8BDD\u5934\u5C5E\u4E8E\u53D7\u4FDD\u62A4\u5DE5\u4F5C\u533A\u3002");
      return header;
    }
    if (Buffer.byteLength(pending) > MAX_LINE_BYTES) throw new Error("DSH \u4F1A\u8BDD\u5934\u8D85\u8FC7 2 MiB \u8BFB\u53D6\u9884\u7B97\u3002");
  }
  throw new Error("DSH \u4F1A\u8BDD\u5934 JSONL \u4E0D\u5B8C\u6574\u3002");
}
async function* sourceLines(fd, file, frame, skip, budget) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let pending = "";
  let number = 0;
  for await (const chunk of frameChunks(fd, file, frame, (input) => {
    budget.processingReadBytes += input.length;
  })) {
    pending += decoder.decode(chunk, { stream: true });
    let lf;
    while ((lf = pending.indexOf("\n")) >= 0) {
      const text = pending.slice(0, lf);
      pending = pending.slice(lf + 1);
      number += 1;
      const bytes = Buffer.byteLength(text) + 1;
      if (bytes > MAX_LINE_BYTES) throw new Error(`DSH \u5355\u6761\u4E8B\u4EF6\u8D85\u8FC7 2 MiB \u8BFB\u53D6\u9884\u7B97\uFF1Afile=${file}; frameOffset=${frame.start}; line=${number}\u3002`);
      if (number <= skip) {
        budget.replayedDecodedBytes += bytes;
        continue;
      }
      if (budget.decoded + bytes > MAX_DECODED_BYTES) throw new SourceBudgetError();
      budget.decoded += bytes;
      yield { text, number };
    }
    if (Buffer.byteLength(pending) > MAX_LINE_BYTES) throw new Error(`DSH \u5355\u6761\u4E8B\u4EF6\u8D85\u8FC7 2 MiB \u8BFB\u53D6\u9884\u7B97\uFF1Afile=${file}; frameOffset=${frame.start}; line=${number + 1}\u3002`);
  }
  pending += decoder.decode();
  if (pending.length) throw new Error(`DSH \u5DF2\u5B8C\u6210\u5E27\u4E2D\u7684 JSONL \u5C3E\u884C\u4E0D\u5B8C\u6574\uFF1Afile=${file}; frameOffset=${frame.start}\u3002`);
  if (number < skip) throw new Error("DSH \u540C\u6B65\u884C\u6E38\u6807\u8D85\u8FC7\u6E90\u5E27\u3002");
}
function sessionFiles(sessionsDir, bucket) {
  const result = [];
  const visit = (rel, depth) => {
    if (depth > 8) throw new Error("DSH \u4F1A\u8BDD\u76EE\u5F55\u5D4C\u5957\u8D85\u8FC7\u9884\u7B97\u3002");
    const entries = readdirSync(checked(sessionsDir, bucket, rel), { withFileTypes: true });
    const generations = entries.filter((e) => e.isFile() && /^session(?:\.v\d+)?\.jsonl(?:\.zstd)?$/.test(e.name)).sort((a, b) => Number(/\.v(\d+)/.exec(b.name)?.[1] ?? 0) - Number(/\.v(\d+)/.exec(a.name)?.[1] ?? 0));
    if (generations[0]) {
      result.push(join3(rel, generations[0].name));
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) if (entry.isDirectory() || entry.isSymbolicLink()) visit(join3(rel, entry.name), depth + 1);
  };
  visit("", 0);
  return result;
}
async function syncRaw(opts) {
  positiveInt(opts.maxTurns, "maxTurns", 1e6);
  positiveInt(opts.maxSourceBytes ?? 64 * 1024 * 1024, "maxSourceBytes", 1024 * 1024 * 1024);
  validateScope(opts.buckets);
  validateScope(opts.allowedBuckets);
  for (const bucket of opts.buckets) enforceAllowed(bucket, opts.allowedBuckets);
  const { sessionsDir, rawDir } = resolveRawPaths(opts);
  if (!existsSync3(sessionsDir)) throw new Error(`\u4F1A\u8BDD\u76EE\u5F55\u4E0D\u5B58\u5728\uFF1A${sessionsDir}`);
  const sourceRoot = checked(sessionsDir);
  const mirrorRoot = checked(rawDir);
  if (contained(sourceRoot, mirrorRoot) || contained(mirrorRoot, sourceRoot)) throw new Error("\u539F\u6587\u955C\u50CF\u76EE\u5F55\u548C\u6E90\u4F1A\u8BDD\u76EE\u5F55\u5FC5\u987B\u5206\u79BB\u3002");
  const manifest = loadManifest(rawDir);
  const scrubMismatch = manifest.legacy === true || manifest.scrub !== SCRUB_VERSION;
  const scoped = opts.allowedWorkspaces !== void 0;
  const scopeHash = scoped ? workspaceScopeHash(opts) : void 0;
  if (manifest.workspaceScopeHash !== void 0 && manifest.workspaceScopeHash !== scopeHash) throw new Error("\u539F\u6587\u6388\u6743\u5DE5\u4F5C\u533A\u8303\u56F4\u53D1\u751F\u53D8\u5316\uFF1B\u4FDD\u7559\u955C\u50CF\u548C\u6E38\u6807\uFF0C\u62D2\u7EDD\u6DF7\u7528\u72B6\u6001\u3002");
  mkdirSync(mirrorRoot, { recursive: true });
  const lock = checked(rawDir, ".sync.lock");
  let lockFd;
  try {
    lockFd = openSync(lock, "wx");
    writeFileSync(lockFd, String(process.pid));
  } catch {
    throw new Error("\u539F\u6587\u540C\u6B65\u9501\u5DF2\u5360\u7528\uFF1B\u4FDD\u7559\u539F\u6E38\u6807\uFF0C\u8BF7\u786E\u8BA4\u6CA1\u6709\u53E6\u4E00\u4E2A\u540C\u6B65\u8FDB\u7A0B\u3002");
  }
  const perBucket = {};
  let sessionsScanned = 0;
  let newTurns = 0;
  let filesTouched = 0;
  let examined = 0;
  let capped = false;
  let budgetLimited = false;
  const budget = { limit: opts.maxSourceBytes ?? 64 * 1024 * 1024, remaining: opts.maxSourceBytes ?? 64 * 1024 * 1024, scanned: 0, decoded: 0, validationDecodedBytes: 0, processingReadBytes: 0, replayedDecodedBytes: 0, headerReadBytes: 0 };
  const sourceWarnings = [];
  const dedup = /* @__PURE__ */ new Map();
  try {
    const buckets = readdirSync(sourceRoot, { withFileTypes: true }).filter((d) => (d.isDirectory() || d.isSymbolicLink()) && !protectedBucket(d.name)).map((d) => d.name).filter((b) => allowed(b, opts.allowedBuckets) && allowed(b, opts.buckets)).sort();
    outer: for (const bucket of buckets) {
      validateBucket(bucket);
      checked(sessionsDir, bucket);
      for (const rel of sessionFiles(sessionsDir, bucket)) {
        if (examined >= opts.maxTurns) {
          capped = true;
          break outer;
        }
        const file = checked(sessionsDir, bucket, rel);
        const info = statSync2(file);
        const key = `${bucket}/${rel}`;
        const entry = manifest.files[key] ?? { turns: 0 };
        if (!scoped && entry.complete && entry.size === info.size && entry.mtimeMs === info.mtimeMs && entry.ctimeMs === info.ctimeMs) continue;
        if (entry.complete && entry.size !== void 0 && info.size <= entry.size && (entry.mtimeMs !== info.mtimeMs || entry.ctimeMs !== info.ctimeMs)) throw new Error("DSH \u5DF2\u5B8C\u6210\u6E90\u4F1A\u8BDD\u88AB\u622A\u77ED\u6216\u540C\u5927\u5C0F\u6539\u5199\uFF1B\u4FDD\u7559\u539F\u6587\u6E38\u6807\uFF0C\u62D2\u7EDD\u91CD\u7F6E\u3002");
        const fd = openSync(file, "r");
        const snapshot = fstatSync(fd);
        try {
          let header;
          try {
            header = await sourceHeader(fd, file, snapshot.size, budget);
          } catch (error) {
            if (!scoped) throw error;
            sourceWarnings.push("DSH \u5019\u9009\u4F1A\u8BDD\u5934\u4E0D\u53EF\u9A8C\u8BC1\uFF0C\u672A\u6536\u5F55\u4E14\u672A\u63A8\u8FDB\u6E38\u6807\u3002");
            continue;
          }
          if (header.origin === "subagent" || typeof header.delegationDepth === "number" && header.delegationDepth > 0) continue;
          let sourceCwd;
          if (scoped) {
            if (typeof header.cwd !== "string" || !isAbsolute3(header.cwd) || /[\x00-\x1f]/.test(header.cwd)) {
              sourceWarnings.push("DSH \u5019\u9009\u4F1A\u8BDD\u7F3A\u5C11\u5408\u6CD5\u7EDD\u5BF9 cwd\uFF0C\u672A\u6536\u5F55\u4E14\u672A\u63A8\u8FDB\u6E38\u6807\u3002");
              continue;
            }
            const authorized = authorizedWorkspace(header.cwd, opts);
            if (!authorized) continue;
            sourceCwd = resolve3(header.cwd);
            if (entry.sourceCwd !== void 0 && entry.sourceCwd !== sourceCwd) throw new Error("DSH \u4F1A\u8BDD\u5DE5\u4F5C\u533A\u5F52\u5C5E\u53D1\u751F\u53D8\u5316\uFF1B\u4FDD\u7559\u539F\u6E38\u6807\u3002");
            if (entry.cursor && entry.sourceCwd === void 0) throw new Error("\u65E7\u539F\u6587\u6E38\u6807\u6CA1\u6709\u5DF2\u9A8C\u8BC1\u5DE5\u4F5C\u533A\u5F52\u5C5E\uFF1B\u8BF7\u4F7F\u7528\u72EC\u7ACB workspace \u72B6\u6001\u76EE\u5F55\u3002");
            if (entry.complete && entry.size === info.size && entry.mtimeMs === info.mtimeMs && entry.ctimeMs === info.ctimeMs) continue;
          }
          const sessionId = typeof header.id === "string" ? header.id : rel.split(/[\\/]/)[0].replace(/^session-?/, "");
          const identity = hash(JSON.stringify(scoped ? [bucket, sessionId, header.createdAt ?? null, sourceCwd] : [bucket, sessionId, header.createdAt ?? null]));
          const cursor = entry.cursor ?? { frame: 0, line: 0, ordinal: 0, active: false, identity };
          if (cursor.identity !== identity) throw new Error("DSH \u4F1A\u8BDD\u8EAB\u4EFD\u53D1\u751F\u53D8\u5316\uFF1B\u4FDD\u7559\u540C\u6B65\u6E38\u6807\u3002");
          if (cursor.frame > snapshot.size) throw new Error("DSH \u6E90\u4F1A\u8BDD\u88AB\u622A\u77ED\uFF1B\u4FDD\u7559\u540C\u6B65\u6E38\u6807\uFF0C\u4E0D\u91CD\u65B0\u5BFC\u5165\u3002");
          const state = { active: cursor.active };
          let ordinal = cursor.ordinal;
          let next = { ...cursor };
          let budgetEnd = false;
          sessionsScanned += 1;
          try {
            for (let position = cursor.frame; position < snapshot.size; ) {
              const frame = inspectFrame(fd, file, snapshot.size, position);
              if (!frame) break;
              const frameHash = await validateFrame(fd, file, frame, budget);
              assertSourceStable(fd, snapshot);
              if (frame.start === cursor.frame && cursor.line > 0 && cursor.frameHash && cursor.frameHash !== frameHash) throw new Error("DSH \u672A\u5B8C\u6210\u6E90\u5E27\u7684\u538B\u7F29\u6307\u7EB9\u53D1\u751F\u53D8\u5316\uFF1B\u4FDD\u7559\u539F\u6E38\u6807\uFF0C\u62D2\u7EDD\u8DF3\u8FC7\u65E7\u524D\u7F00\u3002");
              const skip = frame.start === cursor.frame ? cursor.line : 0;
              for await (const sourceLine of sourceLines(fd, file, frame, skip, budget)) {
                const line = sourceLine.text;
                ordinal += 1;
                let event;
                try {
                  event = line.trim() ? JSON.parse(line) : null;
                } catch {
                  throw new Error(`DSH \u539F\u6587 JSON \u635F\u574F\uFF1A${bucket}/${basename3(rel)} \u7B2C ${ordinal} \u884C\u3002`);
                }
                const row = object(event);
                if (line.trim() && !row) throw new Error("DSH \u539F\u6587\u4E8B\u4EF6\u5FC5\u987B\u662F\u5BF9\u8C61\u3002");
                const turn = row ? extractEvent(row, state, ordinal) : null;
                next = { frame: frame.start, line: sourceLine.number, ordinal, active: state.active, identity, frameHash };
                if (!turn) continue;
                examined += 1;
                const day = new Date(turn.ts || 0).toISOString().slice(0, 10);
                mkdirSync(checked(rawDir, bucket), { recursive: true });
                const target = checked(rawDir, bucket, `${day}.jsonl`);
                let seen = dedup.get(target);
                if (!seen) {
                  dedup.clear();
                  seen = { ids: /* @__PURE__ */ new Set(), legacy: /* @__PURE__ */ new Set(), count: 0 };
                  if (existsSync3(target)) for (const { row: old } of mirrorRows(target)) {
                    if (old.itemId) seen.ids.add(old.itemId);
                    else seen.legacy.add(fingerprint(old));
                    seen.count += 1;
                  }
                  dedup.set(target, seen);
                }
                const itemId = hash(`${identity}/${turn.sourceId}`);
                const mirrorRow = { ts: new Date(turn.ts || 0).toISOString(), win: sessionId.slice(0, 8), role: turn.role, text: scrubText(turn.text), itemId, sourceBucket: bucket, ...sourceCwd ? { sourceCwd } : {} };
                if (!seen.ids.has(itemId) && !seen.legacy.has(fingerprint(mirrorRow))) {
                  const appendFd = openSync(target, "a");
                  try {
                    writeFileSync(appendFd, JSON.stringify(mirrorRow) + "\n", "utf8");
                    fsyncSync(appendFd);
                  } finally {
                    closeSync(appendFd);
                  }
                  seen.ids.add(itemId);
                  seen.count += 1;
                  newTurns += 1;
                  filesTouched += 1;
                  perBucket[bucket] = (perBucket[bucket] ?? 0) + 1;
                }
                manifest.buckets ??= {};
                manifest.buckets[bucket] ??= { days: {} };
                manifest.buckets[bucket].days[day] = seen.count;
                entry.turns += 1;
                if (examined >= opts.maxTurns) {
                  budgetEnd = true;
                  break;
                }
              }
              assertSourceStable(fd, snapshot);
              if (budgetEnd) break;
              next = { frame: frame.end, line: 0, ordinal, active: state.active, identity };
              position = frame.end;
            }
          } catch (error) {
            if (error instanceof SourceBudgetError) {
              sourceWarnings.push(error.message);
              budgetEnd = true;
              budgetLimited = true;
            } else throw error;
          }
          assertSourceStable(fd, snapshot);
          entry.cursor = next;
          if (sourceCwd) entry.sourceCwd = sourceCwd;
          entry.updatedAt = Date.now();
          entry.size = info.size;
          entry.mtimeMs = info.mtimeMs;
          entry.ctimeMs = info.ctimeMs;
          entry.complete = !budgetEnd;
          manifest.files[key] = entry;
          if (budgetEnd) {
            capped = true;
            break outer;
          }
        } finally {
          closeSync(fd);
        }
      }
    }
    manifest.version = 2;
    if (scopeHash) manifest.workspaceScopeHash = scopeHash;
    manifest.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    manifest.sourceSessionsDir = sourceRoot;
    saveManifest(rawDir, manifest);
    return { ok: true, sessionsScanned, newTurns, filesTouched, perBucket, rawDir, scrubMismatch, capped, budgetLimited, legacy: manifest.legacy === true, lastSyncAt: manifest.updatedAt, scannedBytes: budget.scanned, decodedBytes: budget.decoded, validationDecodedBytes: budget.validationDecodedBytes, processingReadBytes: budget.processingReadBytes, replayedDecodedBytes: budget.replayedDecodedBytes, headerReadBytes: budget.headerReadBytes, sourceWarnings };
  } finally {
    closeSync(lockFd);
    unlinkSync(lock);
  }
}
function dayFiles(rawDir, bucket) {
  return readdirSync(checked(rawDir, bucket)).filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)).map((f) => {
    checked(rawDir, bucket, f);
    return f;
  }).sort().reverse();
}
function scopedMirrorRow(row, opts) {
  return opts.allowedWorkspaces === void 0 || !!authorizedWorkspace(row.sourceCwd, opts);
}
function rawStats(rawDir, opts = {}) {
  validateScope(opts.allowedBuckets);
  checked(rawDir);
  const exists = existsSync3(rawDir);
  const manifest = loadManifest(rawDir);
  const source = opts.sessionsDir || manifest.sourceSessionsDir;
  const sourceUnavailable = source ? !existsSync3(checked(source)) : null;
  const buckets = [];
  let totalTurns = 0;
  for (const bucket of mirrorBuckets(rawDir, opts.allowedBuckets)) {
    const files = dayFiles(rawDir, bucket);
    let turns = 0;
    if (manifest.buckets?.[bucket] && !manifest.legacy && opts.allowedWorkspaces === void 0) turns = files.reduce((n, file) => n + (manifest.buckets[bucket].days[file.slice(0, -6)] ?? 0), 0);
    else for (const file of files) for (const { row } of mirrorRows(checked(rawDir, bucket, file))) if (scopedMirrorRow(row, opts) && (!row.sourceBucket || allowed(row.sourceBucket, opts.allowedBuckets))) turns += 1;
    buckets.push({ bucket, days: files.length, turns, latest: files[0]?.slice(0, -6) ?? "" });
    totalTurns += turns;
  }
  buckets.sort((a, b) => b.turns - a.turns || a.bucket.localeCompare(b.bucket));
  return { ok: true, rawDir, exists, buckets, totalTurns, lastSyncAt: manifest.updatedAt ?? null, scrubMismatch: manifest.legacy === true || manifest.scrub !== SCRUB_VERSION, legacy: manifest.legacy === true, sourceUnavailable };
}

// vendor/cortico-world-dsh-memory/src/raw-worker.ts
try {
  const opts = workerData;
  const result = await syncRaw(opts);
  const stats = rawStats(opts.rawDir, { ...opts, allowedBuckets: opts.allowedBuckets, sessionsDir: opts.sessionsDir });
  parentPort.postMessage({ ok: true, result, stats });
} catch (error) {
  parentPort.postMessage({ ok: false, error: scrubText(error instanceof Error ? error.message : String(error)) });
}
//# sourceMappingURL=dsh-memory-raw-worker.mjs.map
