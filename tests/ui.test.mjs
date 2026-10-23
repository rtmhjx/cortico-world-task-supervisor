import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { makeSetupPayload, mountSetup, parseDirectoryLines, redactUiMessage, selectLanguage } from '../console.js';

const { JSDOM } = createRequire(process.env.CORTICO_TOOLCHAIN_PACKAGE || new URL('../package.json', import.meta.url))('jsdom');

function fixture() {
  return {
    version: 1, packageVersion: '0.1.0-preview.1',
    form: {
      ownerQQ: '12345678', commandTransport: 'snowluma-native', qqEndpoint: 'http://127.0.0.1:39001',
      qqAccountId: '23456789', qqTokenSecret: 'FIXTURE_QQ_TOKEN', gatewayEndpoint: 'http://127.0.0.1:39002', gatewayTokenSecret: 'FIXTURE_GATEWAY_TOKEN',
      dshEnabled: true, codexEnabled: true, dshWorkspaceRoots: ['/fixture/dsh'], codexWorkspaceRoots: ['/fixture/codex'], excludedRoots: ['/fixture/private'],
      dshSessionsDir: '/fixture/dsh-sessions', codexSessionsDir: '/fixture/codex-sessions', workspaceFilesEnabled: false,
      conversationOptions: { maxBatchEvents: 20 }, codexOptions: { watchPollSec: 60, workspaceFileRoots: '[]' }, memoryOptions: { rawEnabled: false, allowedProjects: ['fixture'] },
    },
    secrets: { qqTokenConfigured: true, gatewayTokenConfigured: true },
    gate: { enabled: false, epoch: 0, pendingCount: 3 },
    components: { command: { status: 'ready' }, conversation: { status: 'ready' }, codex: { status: 'ready' }, memory: { status: 'ready' } },
    optionSchemas: {
      conversation: { properties: { 'worlds.conversationcontrol.maxBatchEvents': { type: 'integer', minimum: 1, title: 'Batch limit' } } },
      codex: { properties: { watchPollSec: { type: 'integer', minimum: 2, title: 'Poll interval' } } },
      memory: { properties: { rawEnabled: { type: 'boolean', title: 'Original session text' }, allowedProjects: { type: 'array', items: { type: 'string' }, title: 'Projects' } } },
    }, warnings: [], steps: [],
  };
}

async function harness({ snapshot = fixture(), invoke, language = 'en' } = {}) {
  const dom = new JSDOM('<!doctype html><div id="mount"></div>', { url: 'http://127.0.0.1/' });
  const root = dom.window.document.getElementById('mount');
  const controller = new dom.window.AbortController();
  const calls = [];
  const intervals = [];
  const owned = [];
  let guard;
  const ctx = {
    root, language, signal: controller.signal,
    invoke: async (method, args) => {
      calls.push({ method, args: structuredClone(args) });
      if (invoke) {
        const result = await invoke(method, args);
        if (result !== undefined) return result;
      }
      if (method === 'getSetup') return structuredClone(snapshot);
      if (method === 'checkConnections') return { ok: true, checks: [{ id: 'gateway', status: 'ok', message: 'Fixture gateway reached.' }] };
      if (method === 'applySetup') return { ok: true, saved: true, restartRequested: true, warnings: [] };
      if (method === 'gatewayInstall') return { filename: 'fixture-gateway.json', content: '{}', warning: 'Fixture file.', steps: ['Install the host plugin.'] };
      throw new Error(`Unexpected method ${method}`);
    },
    interval(fn) { intervals.push(fn); return { dispose() {} }; },
    timeout(fn) { fn(); return { dispose() {} }; },
    own(resource) { owned.push(resource); return resource; },
    guardLeave(fn) { guard = fn; return { dispose() {} }; },
    pickPath: async () => '/fixture/chosen', ui: {},
  };
  const resource = await mountSetup(ctx);
  const click = (text) => {
    const button = [...root.querySelectorAll('button')].find((node) => node.textContent.trim() === text);
    assert.ok(button, `Button exists: ${text}`);
    button.click();
  };
  const step = (index) => root.querySelectorAll('.ts-step')[index].click();
  const input = (selector, value) => {
    const node = root.querySelector(selector);
    assert.ok(node, `Input exists: ${selector}`);
    if (node.type === 'checkbox') node.checked = value;
    else node.value = value;
    node.dispatchEvent(new dom.window.Event(node.type === 'checkbox' || node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  return { root, snapshot, calls, intervals, ctx, click, step, input, settle, guard: () => guard?.(), close() { controller.abort(); resource?.dispose(); owned.forEach((item) => item.dispose()); dom.window.close(); } };
}

test('setup payload keeps secrets write-only and normalizes directory lists', () => {
  const form = fixture().form;
  form.ownerQQ = ' 12345678 ';
  form.dshWorkspaceRoots = '/fixture/a\n/fixture/a\n\n /fixture/b ';
  form.restartAfterSave = false;
  const payload = makeSetupPayload(form, { qqToken: '', gatewayToken: 'fixture-secret' }, false);
  assert.equal(payload.form.ownerQQ, '12345678');
  assert.deepEqual(payload.form.dshWorkspaceRoots, ['/fixture/a', '/fixture/b']);
  assert.deepEqual(payload.secrets, { gatewayToken: 'fixture-secret' });
  assert.equal(payload.restart, false);
  assert.ok(!('restartAfterSave' in payload.form));
  assert.throws(() => makeSetupPayload({ ...form, ownerQQ: 'group:any' }), /numeric QQ/);
  assert.throws(() => makeSetupPayload({ ...form, workspaceFilesEnabled: true }), /project file directories/);
  assert.deepEqual(parseDirectoryLines('a\r\na\nb'), ['a', 'b']);
  assert.equal(selectLanguage('zh-Hant'), 'zh');
  assert.equal(selectLanguage('fr'), 'en');
  assert.equal(redactUiMessage('fixture-secret ?token=other', { gatewayToken: 'fixture-secret' }), '[redacted] ?token=[redacted]');
});

test('OFF shows the local queue and exposes no web switch or task contents', async () => {
  const h = await harness();
  try {
    assert.match(h.root.textContent, /Local standby/);
    assert.match(h.root.querySelector('.ts-queue').textContent, /3/);
    assert.match(h.root.textContent, /#@/);
    assert.equal(h.root.querySelectorAll('input[type=password]').length, 2);
    assert.ok([...h.root.querySelectorAll('input[type=password]')].every((input) => input.value === ''));
    assert.deepEqual(h.calls.map((call) => call.method), ['getSetup']);
    assert.equal(h.root.querySelector('button[data-toggle]'), null);
    assert.equal(h.root.querySelector('script'), null);
  } finally { h.close(); }
});

for (const [language, requirementText, duplicateText] of [
  ['en', 'SnowLuma native connections require the native add-on included in this package.', 'Do not let another QQ World also listen to private messages from the same owner'],
  ['zh', 'SnowLuma 原生连接需要本包附带的 native add-on', '请勿让另一个 QQ World 同时监听这位主人的私聊'],
]) {
  test(`${language} QQ setup visibly explains native requirements and changes notes with the transport`, async () => {
    const h = await harness({ language });
    try {
      const notes = h.root.querySelector('.ts-transport-notes');
      const native = notes.querySelector('.ts-native-requirement');
      const duplicate = notes.querySelector('.ts-duplicate-owner');
      const visibleNotes = () => [...notes.children].filter(node => !node.hidden).map(node => node.textContent).join(' ');
      assert.equal(native.hidden, false);
      assert.equal(duplicate.hidden, false);
      assert.ok(visibleNotes().includes(requirementText));
      assert.ok(visibleNotes().includes(duplicateText));

      h.input('[data-field=commandTransport]', 'onebot-v11');
      assert.equal(native.hidden, true);
      assert.ok(!visibleNotes().includes(requirementText));
      assert.equal(duplicate.hidden, false);
      assert.ok(visibleNotes().includes(duplicateText));

      h.input('[data-field=commandTransport]', 'trusted-meta');
      assert.equal(native.hidden, true);
      assert.equal(duplicate.hidden, true);
      assert.equal(visibleNotes(), '');

      h.input('[data-field=commandTransport]', 'snowluma-native');
      assert.ok(visibleNotes().includes(requirementText));
      assert.ok(visibleNotes().includes(duplicateText));
      assert.equal(notes.querySelectorAll('.ts-native-requirement').length, 1);
      assert.deepEqual(h.calls.map(call => call.method), ['getSetup']);
    } finally { h.close(); }
  });
}

test('directory picker and typed advanced fields save through the host API', async () => {
  const h = await harness();
  try {
    h.step(1);
    h.click('Add directory');
    await h.settle();
    assert.match(h.root.querySelector('[data-field=dshWorkspaceRoots]').value, /\/fixture\/chosen/);
    h.input('[data-field=codexFileRoots]', '/fixture/codex/project');
    h.step(2);
    h.input('[data-option="conversationOptions.maxBatchEvents"]', '45');
    h.input('[data-option="memoryOptions.rawEnabled"]', true);
    h.input('[data-option="memoryOptions.allowedProjects"]', 'first\nsecond');
    assert.equal(h.root.querySelector('textarea[data-option="memoryOptions"]'), null);
    assert.equal(h.guard(), 'Unsaved changes');
    h.step(3);
    h.click('Save & apply');
    await h.settle();
    const saved = h.calls.find((call) => call.method === 'applySetup').args[0];
    assert.deepEqual(saved.form.dshWorkspaceRoots, ['/fixture/dsh', '/fixture/chosen']);
    assert.equal(saved.form.conversationOptions.maxBatchEvents, 45);
    assert.equal(saved.form.codexOptions.workspaceFileRoots, '["/fixture/codex/project"]');
    assert.ok(!('codexFileRoots' in saved.form));
    assert.equal(saved.form.memoryOptions.rawEnabled, true);
    assert.deepEqual(saved.form.memoryOptions.allowedProjects, ['first', 'second']);
    assert.equal(saved.secrets, undefined);
    assert.equal(saved.restart, true);
    assert.match(h.root.textContent, /restart was requested/);
    assert.equal(h.guard(), null);
  } finally { h.close(); }
});

test('connection errors cannot echo newly supplied credentials', async () => {
  const h = await harness({ invoke(method) { if (method === 'checkConnections') throw new Error('Rejected fixture-ui-password ?token=unsafe'); } });
  try {
    h.input('[data-field=qqToken]', 'fixture-ui-password');
    h.step(3);
    h.click('Check connections');
    await h.settle();
    assert.match(h.root.querySelector('[role=alert]').textContent, /\[redacted\]/);
    assert.doesNotMatch(h.root.textContent, /fixture-ui-password|token=unsafe/);
    assert.equal(h.calls.some((call) => call.method === 'applySetup'), false);
  } finally { h.close(); }
});

test('DSH installer output states that the host remains to be installed', async () => {
  const h = await harness({ language: 'zh' });
  try {
    h.step(3);
    h.click('生成 DSH 一键安装器');
    await h.settle();
    assert.match(h.root.textContent, /尚未安装到 DSH/);
    assert.match(h.root.textContent, /旧式接入说明/);
    assert.match(h.root.textContent, /Install the host plugin/);
    assert.equal(h.calls.some((call) => call.method === 'applySetup'), false);
  } finally { h.close(); }
});

test('private installer kit downloads a credential-free launcher and remains uninstalled', async () => {
  const h = await harness({ invoke(method) {
    if (method === 'gatewayInstall') return {
      kind: 'local-private-install-kit', installed: false,
      filename: 'install-task-supervisor-gateway.cmd', content: '@node "/fixture/kit/install-gateway.mjs"\r\n',
      kitDirectory: '/fixture/kit', files: ['install-gateway.mjs', 'gateway.mjs', 'token.private'],
      runCommand: 'node "/fixture/kit/install-gateway.mjs"',
      warning: 'The launcher has no credential.', steps: ['Run the launcher locally.', 'Choose DSH_HOME and profile.', 'Confirm installation.'],
    };
  } });
  const originalCreate = URL.createObjectURL;
  let downloadedBlob;
  let downloadedName;
  URL.createObjectURL = (blob) => { downloadedBlob = blob; return 'blob:fixture-download'; };
  const anchorPrototype = h.root.ownerDocument.defaultView.HTMLAnchorElement.prototype;
  const originalClick = anchorPrototype.click;
  anchorPrototype.click = function () { downloadedName = this.download; };
  try {
    h.step(3);
    h.click('Generate DSH installer');
    await h.settle();
    assert.match(h.root.textContent, /It has not been installed in DSH/);
    assert.match(h.root.textContent, /Choose DSH_HOME and profile/);
    assert.match(h.root.textContent, /\/fixture\/kit/);
    assert.ok([...h.root.querySelectorAll('button')].some((node) => node.textContent === 'Download installer'));
    h.click('Download installer');
    assert.equal(downloadedName, 'install-task-supervisor-gateway.cmd');
    assert.equal(await downloadedBlob.text(), '@node "/fixture/kit/install-gateway.mjs"\r\n');
    assert.equal(downloadedBlob.type, 'text/plain;charset=utf-8');
    assert.equal(h.calls.some((call) => call.method === 'applySetup'), false);
    assert.equal(h.calls.some((call) => call.method === 'installGateway'), false);
    assert.doesNotMatch(h.root.textContent, /token\.private/);
  } finally { URL.createObjectURL = originalCreate; anchorPrototype.click = originalClick; h.close(); }
});

test('status polling keeps unsaved fields and never enables reporting', async () => {
  const h = await harness();
  try {
    h.input('[data-field=ownerQQ]', '34567890');
    h.snapshot.gate = { enabled: true, epoch: 1, pendingCount: 0 };
    await h.intervals[0]();
    await h.settle();
    assert.equal(h.root.querySelector('[data-field=ownerQQ]').value, '34567890');
    assert.match(h.root.querySelector('.ts-mode').textContent, /Reporting enabled/);
    assert.deepEqual(h.calls.map((call) => call.method), ['getSetup', 'getSetup']);
  } finally { h.close(); }
});
