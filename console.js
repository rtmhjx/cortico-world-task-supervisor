const COPY = {
  zh: {
    title: '任务托管', eyebrow: 'TASK SUPERVISOR', intro: '把 DSH 与 Codex 接到 Coo，离开电脑后通过 QQ 接手。',
    steps: ['连接服务', '选择范围', '功能设置', '检查与应用'], stepNotes: ['主人与连接', '工作区与会话', '完整可选功能', '验证、保存与接入'],
    nativeRequirement: 'SnowLuma 原生连接需要本包附带的 native add-on；仅安装 SnowLuma 主程序还不能连接。', duplicateOwner: '请勿让另一个 QQ World 同时监听这位主人的私聊，以免形成重复通道。',
    loading: '正在读取配置…', retry: '重新读取', off: '本地待命', on: '正在汇报', offNote: '重要任务通知会先留在本地；通过 QQ 开启后才向 Coo 投递。', onNote: '仅汇报任务完成、失败或需要你处理的问题。', queue: '积压通知', owner: '主人 QQ 号', ownerHint: '只有这个号码的私聊可以用 #@ 切换汇报。群聊与其他账号无效。',
    toggleHint: '在你与她的 QQ 私聊中，把 #@ 放在消息开头，或单独发送 #@：开启并补发积压；再次发送则关闭。',
    transport: 'QQ 接入方式', native: 'SnowLuma 原生直连', trusted: '已有 QQ World（可信私聊事件）', onebot: 'OneBot v11（兼容已有部署）', qqEndpoint: 'QQ 连接地址', qqAccount: '机器人 QQ 号', qqAccountHint: '登录 SnowLuma 的账号，不是主人 QQ 号。', qqToken: 'QQ 连接凭证', tokenHint: '留空保留已有凭证；保存后不回显。', configured: '已保存', unconfigured: '尚未保存',
    gateway: 'DSH 控制网关地址', gatewayHint: '填 DSH 宿主提供的控制网关地址。Coo 中的 World 需要与宿主插件配合。', gatewayToken: 'DSH 网关凭证', connectionsNote: '凭证保存在本机。检查连接只进行读取，不发送 QQ 消息，也不执行任务。',
    dshEnabled: '接入 DSH', codexEnabled: '接入 Codex', roots: '允许访问的工作区', rootsHint: '每行一个目录。只有明确列出的范围会提供给 Coo。', dshSessions: 'DSH 会话目录', codexSessions: 'Codex 会话目录', sessionsHint: '用于发现任务及读取历史；保留默认值可使用本机标准目录。', excluded: '始终排除的目录', excludedHint: '每行一个目录；会话、检索与文件访问都应遵守这些边界。', files: '允许读取工作区文件', filesHint: '默认关闭。开启后仍受允许目录、排除目录与汇报开关限制。', fileRoots: 'Codex 文件读取子目录', fileRootsHint: '开启 Codex 文件读取时必填。每行一个项目目录，必须在上面允许的 Codex 工作区内；不能选择整盘或用户主目录。', fileRootsRequired: '请先在“选择范围”中填写 Codex 文件读取子目录。', choose: '选择目录', addPath: '添加目录',
    optionsNote: '这些设置覆盖会话控制、Codex 与 DSH 记忆能力。一般只需完成前两步。', command: 'QQ 私聊', conversation: '会话与审批', codex: 'Codex 读取', memory: 'DSH 记忆', noOptions: '此组件没有额外设置。', optional: '可选', addItem: '添加一项', remove: '移除', statusSetup: '等待配置', statusStarting: '正在启动', statusOffline: '连接离线',
    checkTitle: '先验证连接，再保存应用', checkNote: '检查使用当前表单；修改后需要重新检查。保存会把设置写入这个 World。', check: '检查连接', checkRunning: '正在检查…', checksNone: '尚未检查当前配置。', checksPassed: '当前配置检查完成。', checksFailed: '有连接需要处理，请查看下面的结果。', checkStale: '配置已修改，请重新检查。', save: '保存并应用', saving: '正在保存…', restart: '保存后重启此 World', restartHint: '只重载这个扩展，让新连接与范围生效。', saved: '配置已保存。', savedRestart: '配置已保存，已请求重启此 World。', warnings: '需要留意', components: '组件状态',
    gatewayTitle: '把 DSH 宿主也接上', gatewayNote: '生成安装器，下载后在这台电脑上运行。安装器会让你选择 DSH_HOME 和配置档，并在实际应用前请你确认。', generate: '生成 DSH 一键安装器', generating: '正在生成…', download: '下载安装器', downloadLegacy: '下载接入说明', gatewayPrepared: '安装器已准备；尚未安装到 DSH。', gatewayLegacyPrepared: '接入说明已生成；尚未安装到 DSH。', gatewaySteps: '接下来在 DSH 中完成', generatedNote: '启动器不含凭证；它依赖这台电脑上的私密安装包，请在本机运行。', kitDirectory: '本机安装包', runCommand: '也可以在本机命令行运行', privateKit: '凭证只由本机安装包保存，不会出现在下载的启动器中。运行后仍需完成 DSH 的启动与连接检查。', legacyKit: '这份文件是旧式接入说明。请使用提供一键安装器的版本重新生成，无需手动填写 JSON。',
    back: '上一步', next: '下一步', fieldError: '请检查表单：', invalidOwner: '主人 QQ 号应为有效的数字账号。', invalidNumber: '请输入有效数字：', statusUnknown: '未报告', statusOk: '正常', statusError: '异常', statusSkipped: '已跳过', statusStopped: '未启动', version: '扩展版本', savedLabel: '保存状态', unsaved: '有未保存的修改', clean: '已读取本机配置', failed: '操作失败，请重试。', noGateway: '尚未生成接入文件。', optionalCredentials: '进阶模式：需要另一个兼容的 QQ World 提供可信私聊事件与回复能力。凭证由该插件管理。', nativePrivateChannel: '此 World 自带任务私聊通道：通过底层 QQ 服务接收主人的指令，并在汇报开启后回复任务结果。',
  },
  en: {
    nativeRequirement: 'SnowLuma native connections require the native add-on included in this package. Installing SnowLuma itself does not provide this API.', duplicateOwner: 'Do not let another QQ World also listen to private messages from the same owner; duplicate listeners create two channels.',
    title: 'Task supervisor', eyebrow: 'TASK SUPERVISOR', intro: 'Connect DSH and Codex to Coo, then take over through QQ when away.',
    steps: ['Connect', 'Choose scope', 'Features', 'Check & apply'], stepNotes: ['Owner and services', 'Workspaces and sessions', 'All optional features', 'Validate, save and connect'],
    loading: 'Reading configuration…', retry: 'Read again', off: 'Local standby', on: 'Reporting enabled', offNote: 'Important task notices stay local until you enable reporting.', onNote: 'Only completion, failure and issues that need your attention are reported.', queue: 'Queued notices', owner: 'Owner QQ number', ownerHint: 'Only private messages from this account can toggle reporting with #@. Groups and other accounts cannot.',
    toggleHint: 'In your private QQ chat, start a message with #@, or send #@ alone, to enable reporting and release the queue. Send it again to turn reporting off.',
    transport: 'QQ connection', native: 'SnowLuma native connection', trusted: 'Existing QQ World (trusted private events)', onebot: 'OneBot v11 (existing deployments)', qqEndpoint: 'QQ service address', qqAccount: 'Bot QQ number', qqAccountHint: 'The account signed in to SnowLuma, rather than the owner account.', qqToken: 'QQ connection credential', tokenHint: 'Leave blank to keep the stored credential. Saved values are never returned.', configured: 'Stored', unconfigured: 'Not stored',
    gateway: 'DSH control gateway address', gatewayHint: 'Use the control gateway exposed by the DSH host. This World works together with the host plugin.', gatewayToken: 'DSH gateway credential', connectionsNote: 'Credentials stay on this machine. Connection checks only read: they do not send QQ messages or execute tasks.',
    dshEnabled: 'Connect DSH', codexEnabled: 'Connect Codex', roots: 'Allowed workspaces', rootsHint: 'One directory per line. Only the scope you list is available to Coo.', dshSessions: 'DSH session directory', codexSessions: 'Codex session directory', sessionsHint: 'Used to discover tasks and read history. Keep the default to use the standard local location.', excluded: 'Always excluded directories', excludedHint: 'One directory per line. Sessions, searches and file access must respect these boundaries.', files: 'Allow workspace file reads', filesHint: 'Off by default. Reads still respect the allowed scope, exclusions and reporting mode.', fileRoots: 'Codex project file directories', fileRootsHint: 'Required for Codex file reads. One project directory per line, inside an allowed Codex workspace above. Whole drives and home directories are not accepted.', fileRootsRequired: 'Choose the Codex project file directories under Choose scope first.', choose: 'Choose directory', addPath: 'Add directory',
    optionsNote: 'These controls cover conversation operations, Codex and DSH memory. Most installations only need the first two steps.', command: 'QQ private chat', conversation: 'Conversations & approvals', codex: 'Codex reads', memory: 'DSH memory', noOptions: 'No additional settings for this component.', optional: 'Optional', addItem: 'Add item', remove: 'Remove', statusSetup: 'Setup required', statusStarting: 'Starting', statusOffline: 'Offline',
    checkTitle: 'Check connections, then save', checkNote: 'Checks use this form. Run them again after making changes. Saving writes settings to this World.', check: 'Check connections', checkRunning: 'Checking…', checksNone: 'This configuration has not been checked.', checksPassed: 'The current configuration has been checked.', checksFailed: 'Some connections need attention. See the results below.', checkStale: 'Configuration changed. Check again.', save: 'Save & apply', saving: 'Saving…', restart: 'Restart this World after saving', restartHint: 'Reload only this extension to apply the new connections and scope.', saved: 'Configuration saved.', savedRestart: 'Configuration saved; a World restart was requested.', warnings: 'Notes', components: 'Component status',
    gatewayTitle: 'Connect the DSH host too', gatewayNote: 'Generate the installer, download it and run it on this computer. It asks you to choose DSH_HOME and a profile, then confirm before applying changes.', generate: 'Generate DSH installer', generating: 'Generating…', download: 'Download installer', downloadLegacy: 'Download connection notes', gatewayPrepared: 'Installer prepared. It has not been installed in DSH.', gatewayLegacyPrepared: 'Connection notes prepared. They have not been installed in DSH.', gatewaySteps: 'Finish these steps in DSH', generatedNote: 'The launcher contains no credential and depends on the private kit on this computer. Run it locally.', kitDirectory: 'Local installation kit', runCommand: 'Or run locally in a command line', privateKit: 'The credential stays in the private local kit, outside the downloaded launcher. Finish starting DSH and checking its connection afterwards.', legacyKit: 'This is an older connection specification. Generate it again with a version that provides the installer; no manual JSON editing is needed.',
    back: 'Back', next: 'Next', fieldError: 'Check the form: ', invalidOwner: 'Enter a valid numeric QQ account for the owner.', invalidNumber: 'Enter a valid number: ', statusUnknown: 'Not reported', statusOk: 'Ready', statusError: 'Error', statusSkipped: 'Skipped', statusStopped: 'Stopped', version: 'Extension version', savedLabel: 'Configuration', unsaved: 'Unsaved changes', clean: 'Local configuration loaded', failed: 'The operation failed. Try again.', noGateway: 'No connection file has been generated.', optionalCredentials: 'Advanced: a compatible QQ World must supply trusted private events and replies. That plugin manages its credentials.', nativePrivateChannel: 'This World includes the task private-chat channel: it receives owner commands through the underlying QQ service and replies with results while reporting is enabled.',
  },
};

const OPTION_LABELS_EN = {
  pollIntervalMs: 'Gateway polling interval (ms)', desktopProgressEnabled: 'Collect desktop DSH task boundaries',
  requestTimeoutMs: 'Gateway request timeout (ms)', eventTtlMs: 'Human message validity (ms)', selectionTtlMs: 'Target selection validity (ms)',
  includeSubagents: 'Include subagent tasks', workspaceFileRoots: 'Project file directories', workspaceMaxFileBytes: 'Maximum text file size (bytes)',
  watchIntervalSeconds: 'Polling interval (seconds)', watchMaxItems: 'Items per poll', maxReadBytes: 'Page read budget (bytes)', maxScanBytes: 'Polling scan budget (bytes)',
  notificationPolicy: 'Task notification policy', notifyPhases: 'Public message phases', notifyUserMessages: 'Include public user messages', notifyLifecycle: 'Include native lifecycle facts', eventContentChars: 'Event text limit (characters)',
  sourceMode: 'DSH source mode', healthCheckIntervalSeconds: 'Source health check interval (seconds)', writeMaxPerTick: 'Writes per batch', queueMaxPending: 'Maximum pending writes',
  rawSyncIntervalSeconds: 'Original session sync interval (seconds)', rawMaxSourceBytes: 'Maximum original session size (bytes)', dbFile: 'DSH memory database', allowedProjects: 'Allowed project names',
  includeGlobal: 'Include global memory layers', levels: 'Readable memory layers', watchMaxPerTick: 'Memory items per poll', watchContentChars: 'Memory preview limit (characters)',
  writeEnabled: 'Allow external memory writes', writeFlushSeconds: 'Write queue interval (seconds)', writeLevels: 'Writable memory layers', writeSourceLabel: 'External write source label',
  rawEnabled: 'Enable original session mirrors', rawDir: 'Local session mirror directory', rawBuckets: 'Allowed mirror buckets', rawMaxTurns: 'Maximum turns per mirrored session',
};
const OPTION_HINTS_EN = {
  sourceMode: 'Workspace mode stays within the selected project scope. Memory mode reads the configured DSH external memory database.',
  workspaceFileRoots: 'One project directory per line, inside an allowed Codex workspace. Whole drives and home directories are rejected.',
  notificationPolicy: 'Only native completion or issues requiring human attention are delivered. Ordinary steps remain local.',
  allowedProjects: 'Exact project names, separated by commas. These names belong to the external memory source.',
  levels: 'Readable layer names, separated by commas.', writeLevels: 'Writable layer names, separated by commas. Global soul and user layers cannot be written.',
  includeGlobal: 'Allow reads from global memory layers in memory mode. Off by default.',
  writeEnabled: 'Queue source-labelled external memory entries in memory mode. A queued entry is not yet a verified durable write.',
  rawEnabled: 'Import scrubbed original sessions into a local mirror. Source directories and workspace exclusions still apply.',
  rawBuckets: 'Bucket names separated by commas. Leave blank to use the configured source scope.',
  watchIntervalSeconds: 'Set to zero to disable background polling. Reads remain on demand while supervision is enabled.',
};

export function selectLanguage(language) {
  return String(language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function parseDirectoryLines(value) {
  return [...new Set(String(value || '').split(/\r?\n/).map((part) => part.trim()).filter(Boolean))];
}

export function redactUiMessage(message, secrets = {}) {
  let text = String(message || '');
  for (const value of Object.values(secrets)) {
    if (typeof value === 'string' && value.length) text = text.split(value).join('[redacted]');
  }
  return text.replace(/([?&](?:access_token|token|api_key|key)=)[^&\s]+/gi, '$1[redacted]');
}

export function makeSetupPayload(form, secrets = {}, restart = true, language = 'en') {
  const copy = COPY[selectLanguage(language)];
  const ownerQQ = String(form.ownerQQ || '').trim();
  if (!/^[1-9]\d{4,15}$/.test(ownerQQ)) throw new Error(copy.invalidOwner);
  const next = structuredClone(form);
  delete next.restartAfterSave;
  next.ownerQQ = ownerQQ;
  for (const key of ['dshWorkspaceRoots', 'codexWorkspaceRoots', 'excludedRoots']) {
    next[key] = Array.isArray(next[key]) ? [...new Set(next[key].map(String).map((part) => part.trim()).filter(Boolean))] : parseDirectoryLines(next[key]);
  }
  for (const key of ['qqEndpoint', 'qqAccountId', 'gatewayEndpoint', 'dshSessionsDir', 'codexSessionsDir']) next[key] = String(next[key] || '').trim();
  if (next.codexEnabled && next.workspaceFilesEnabled) {
    let roots = next.codexOptions?.workspaceFileRoots;
    try { if (typeof roots === 'string') roots = JSON.parse(roots); } catch { throw new Error(copy.fileRootsRequired); }
    if (!Array.isArray(roots) || !roots.length) throw new Error(copy.fileRootsRequired);
  }
  const supplied = Object.fromEntries(Object.entries(secrets).filter(([, value]) => typeof value === 'string' && value.length));
  return { form: next, ...(Object.keys(supplied).length ? { secrets: supplied } : {}), restart: Boolean(restart) };
}

function schemaPath(key) {
  return key.replace(/^worlds\.[^.]+\./, '').split('.');
}

function atPath(object, path) {
  return path.reduce((value, key) => value?.[key], object);
}

function putPath(object, path, value) {
  let current = object;
  for (const key of path.slice(0, -1)) {
    if (!current[key] || typeof current[key] !== 'object') current[key] = {};
    current = current[key];
  }
  current[path.at(-1)] = value;
}

function labelText(value, language) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value[language] || value.en || value.zh || '';
  return '';
}

export async function mountSetup(ctx) {
  const document = ctx.root.ownerDocument;
  const language = selectLanguage(ctx.language);
  const t = COPY[language];
  const state = { setup: null, form: {}, step: 0, busy: false, dirty: false, checks: null, checkCurrent: false, generated: null, error: '', notice: '' };
  const credentials = { qqToken: '', gatewayToken: '' };
  const invalid = new Set();
  const actionButtons = [];
  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  const shell = element('section', 'task-supervisor');
  shell.lang = language === 'zh' ? 'zh-CN' : 'en';
  ctx.root.replaceChildren(shell);
  const header = element('header', 'ts-header');
  const heading = element('div');
  heading.append(element('div', 'ts-eyebrow', t.eyebrow), element('h1', '', t.title), element('p', 'ts-intro', t.intro));
  const mode = element('div', 'ts-mode');
  mode.setAttribute('aria-live', 'polite');
  header.append(heading, mode);
  const body = element('div', 'ts-layout');
  const navigation = element('nav', 'ts-steps');
  navigation.setAttribute('aria-label', t.title);
  const main = element('div', 'ts-main');
  const banners = element('div', 'ts-banners');
  const content = element('div', 'ts-content');
  const footer = element('footer', 'ts-footer');
  const savedState = element('span', 'ts-save-state');
  const pager = element('div', 'ts-pager');
  const back = button(t.back, () => showStep(Math.max(0, state.step - 1)), 'ts-button ts-quiet');
  const next = button(t.next, () => showStep(Math.min(3, state.step + 1)), 'ts-button ts-primary');
  pager.append(back, next);
  footer.append(savedState, pager);
  main.append(banners, content, footer);
  body.append(navigation, main);
  const help = element('aside', 'ts-switch-help');
  help.append(element('code', '', '#@'), element('p', '', t.toggleHint));
  shell.append(header, body, help);

  function listen(node, event, callback) {
    node.addEventListener(event, callback, { signal: ctx.signal });
  }

  function button(label, handler, className = 'ts-button') {
    const node = element('button', className, label);
    node.type = 'button';
    listen(node, 'click', handler);
    return node;
  }

  function action(label, handler, className) {
    const node = button(label, handler, className);
    actionButtons.push(node);
    node.disabled = state.busy;
    return node;
  }

  function changed() {
    state.dirty = true;
    state.checkCurrent = false;
    state.notice = '';
    refreshBanners();
    refreshFooter();
  }

  function errorMessage(error) {
    return redactUiMessage(error instanceof Error ? error.message : error || t.failed, credentials);
  }

  async function run(work) {
    if (state.busy || ctx.signal.aborted) return;
    state.busy = true;
    state.error = '';
    refreshBanners();
    for (const node of actionButtons) node.disabled = true;
    for (const node of content.querySelectorAll('input, textarea, select, button')) node.disabled = true;
    try { await work(); }
    catch (error) { if (!ctx.signal.aborted) state.error = errorMessage(error); }
    finally {
      state.busy = false;
      if (!ctx.signal.aborted) {
        for (const node of actionButtons) node.disabled = false;
        for (const node of content.querySelectorAll('input, textarea, select, button')) node.disabled = false;
        refreshBanners();
      }
    }
  }

  function refreshBanners() {
    banners.replaceChildren();
    if (state.error) {
      const note = element('div', 'ts-alert ts-error', state.error);
      note.setAttribute('role', 'alert');
      banners.append(note);
    }
    if (state.notice) {
      const note = element('div', 'ts-alert ts-success', state.notice);
      note.setAttribute('role', 'status');
      banners.append(note);
    }
    if (state.checks && !state.checkCurrent) banners.append(element('div', 'ts-alert', t.checkStale));
  }

  function refreshFooter() {
    savedState.textContent = state.dirty ? t.unsaved : t.clean;
    savedState.dataset.dirty = String(state.dirty);
    back.hidden = state.step === 0;
    next.hidden = state.step === 3;
  }

  function refreshMode() {
    const gate = state.setup?.gate;
    const enabled = gate?.enabled === true;
    mode.dataset.enabled = String(enabled);
    mode.replaceChildren(element('span', 'ts-mode-label', enabled ? t.on : t.off));
    const queue = element('div', 'ts-queue');
    queue.append(element('strong', '', String(gate?.pendingCount ?? 0)), element('span', '', t.queue));
    mode.append(queue, element('p', '', enabled ? t.onNote : t.offNote));
  }

  function section(title, note) {
    const box = element('section', 'ts-section');
    box.append(element('h2', '', title));
    if (note) box.append(element('p', 'ts-section-note', note));
    content.append(box);
    return box;
  }

  function field(parent, label, key, { hint = '', type = 'text', multiline = false, path = false, placeholder = '', getValue, setValue } = {}) {
    const row = element('div', 'ts-field');
    const id = `ts-${key.replace(/[^\w-]/g, '-')}`;
    const labelNode = element('label', 'ts-field-label', label);
    labelNode.htmlFor = id;
    const input = element(multiline ? 'textarea' : 'input', 'ts-input');
    input.id = id;
    input.name = key;
    input.dataset.field = key;
    if (!multiline) input.type = type;
    else input.rows = 3;
    input.placeholder = placeholder;
    if (type === 'password') {
      input.autocomplete = 'new-password';
      input.value = credentials[key] || '';
    } else {
      const value = getValue ? getValue() : state.form[key];
      input.value = Array.isArray(value) ? value.join('\n') : String(value ?? '');
    }
    const controls = element('div', 'ts-field-controls');
    controls.append(input);
    listen(input, 'input', () => {
      if (type === 'password') credentials[key] = input.value;
      else if (setValue) setValue(multiline ? parseDirectoryLines(input.value) : input.value);
      else state.form[key] = multiline ? parseDirectoryLines(input.value) : input.value;
      changed();
    });
    if (path) {
      const choose = button(multiline ? t.addPath : t.choose, () => run(async () => {
        const selected = await ctx.pickPath({ kind: 'directory', title: label, currentPath: multiline ? parseDirectoryLines(input.value).at(-1) || '' : input.value });
        if (!selected || ctx.signal.aborted) return;
        input.value = multiline ? [...new Set([...parseDirectoryLines(input.value), selected])].join('\n') : selected;
        if (setValue) setValue(multiline ? parseDirectoryLines(input.value) : input.value);
        else state.form[key] = multiline ? parseDirectoryLines(input.value) : input.value;
        changed();
      }), 'ts-button ts-path-button');
      controls.append(choose);
    }
    row.append(labelNode, controls);
    if (hint) {
      const hintNode = element('p', 'ts-hint', hint);
      hintNode.id = `${id}-hint`;
      input.setAttribute('aria-describedby', hintNode.id);
      row.append(hintNode);
    }
    parent.append(row);
    return input;
  }

  function checkbox(parent, label, key, hint = '') {
    const row = element('label', 'ts-check-field');
    const input = element('input');
    input.type = 'checkbox';
    input.dataset.field = key;
    input.checked = Boolean(state.form[key]);
    const text = element('span');
    text.append(element('strong', '', label));
    if (hint) text.append(element('small', '', hint));
    row.append(input, text);
    listen(input, 'change', () => { state.form[key] = input.checked; changed(); });
    parent.append(row);
    return input;
  }

  function connectionFields() {
    const ownerBox = section(t.steps[0], t.ownerHint);
    const owner = field(ownerBox, t.owner, 'ownerQQ', { placeholder: '12345678' });
    owner.inputMode = 'numeric';
    const qq = section('QQ', t.connectionsNote);
    const row = element('div', 'ts-field');
    const label = element('label', 'ts-field-label', t.transport);
    label.htmlFor = 'ts-commandTransport';
    const select = element('select', 'ts-input');
    select.id = 'ts-commandTransport';
    select.dataset.field = 'commandTransport';
    for (const [value, text] of [['snowluma-native', t.native], ['trusted-meta', t.trusted], ['onebot-v11', t.onebot]]) {
      const option = element('option', '', text);
      option.value = value;
      select.append(option);
    }
    select.value = state.form.commandTransport || 'snowluma-native';
    let transportHint;
    let endpoint;
    const connectionNotes = element('div', 'ts-transport-notes');
    const nativeRequirement = element('p', 'ts-hint ts-native-requirement', t.nativeRequirement);
    const duplicateOwner = element('p', 'ts-hint ts-duplicate-owner', t.duplicateOwner);
    connectionNotes.append(nativeRequirement, duplicateOwner);
    const updateConnectionHints = () => {
      if (transportHint) transportHint.textContent = select.value === 'trusted-meta' ? t.optionalCredentials : t.nativePrivateChannel;
      nativeRequirement.hidden = select.value !== 'snowluma-native';
      duplicateOwner.hidden = select.value === 'trusted-meta';
    };
    listen(select, 'change', () => {
      state.form.commandTransport = select.value;
      updateConnectionHints();
      if (endpoint) endpoint.placeholder = select.value === 'onebot-v11' ? 'ws://127.0.0.1:3001/' : 'http://127.0.0.1:3000/native/v1';
      changed();
    });
    row.append(label, select);
    qq.append(row, connectionNotes);
    endpoint = field(qq, t.qqEndpoint, 'qqEndpoint', { placeholder: select.value === 'onebot-v11' ? 'ws://127.0.0.1:3001/' : 'http://127.0.0.1:3000/native/v1' });
    const account = field(qq, t.qqAccount, 'qqAccountId', { hint: t.qqAccountHint });
    account.inputMode = 'numeric';
    const qqTokenLabel = `${t.qqToken} · ${state.setup?.secrets?.qqTokenConfigured ? t.configured : t.unconfigured}`;
    field(qq, qqTokenLabel, 'qqToken', { type: 'password', hint: t.tokenHint });
    transportHint = element('p', 'ts-hint');
    qq.append(transportHint);
    updateConnectionHints();
    const gateway = section(t.gateway, t.gatewayHint);
    field(gateway, t.gateway, 'gatewayEndpoint', { placeholder: 'http://127.0.0.1:3092' });
    const gatewayTokenLabel = `${t.gatewayToken} · ${state.setup?.secrets?.gatewayTokenConfigured ? t.configured : t.unconfigured}`;
    field(gateway, gatewayTokenLabel, 'gatewayToken', { type: 'password', hint: t.tokenHint });
  }

  function scopeFields() {
    for (const kind of ['dsh', 'codex']) {
      const box = section(kind === 'dsh' ? 'DSH' : 'Codex');
      checkbox(box, kind === 'dsh' ? t.dshEnabled : t.codexEnabled, `${kind}Enabled`);
      field(box, t.roots, `${kind}WorkspaceRoots`, { hint: t.rootsHint, multiline: true, path: true });
      field(box, kind === 'dsh' ? t.dshSessions : t.codexSessions, `${kind}SessionsDir`, { hint: t.sessionsHint, path: true });
    }
    const limits = section(t.excluded);
    field(limits, t.excluded, 'excludedRoots', { hint: t.excludedHint, multiline: true, path: true });
    checkbox(limits, t.files, 'workspaceFilesEnabled', t.filesHint);
    if (Object.hasOwn(state.form.codexOptions || {}, 'workspaceFileRoots')) {
      field(limits, t.fileRoots, 'codexFileRoots', {
        multiline: true, path: true, hint: t.fileRootsHint,
        getValue: () => {
          const value = state.form.codexOptions.workspaceFileRoots;
          if (Array.isArray(value)) return value;
          try { const paths = JSON.parse(value); return Array.isArray(paths) ? paths : []; } catch { return []; }
        },
        setValue: (value) => { state.form.codexOptions.workspaceFileRoots = JSON.stringify(value); },
      });
    }
  }

  function optionField(parent, key, schema, path, value) {
    const declaredTitle = labelText(schema?.title, language);
    const declaredDescription = labelText(schema?.description, language);
    const title = language === 'en' && /[\u3400-\u9fff]/.test(declaredTitle)
      ? OPTION_LABELS_EN[key] || key.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      : declaredTitle || OPTION_LABELS_EN[key] || key;
    const description = language === 'en' && /[\u3400-\u9fff]/.test(declaredDescription) ? OPTION_HINTS_EN[key] || '' : declaredDescription;
    if (Array.isArray(value) && (value.some((item) => item && typeof item === 'object') || schema?.items?.type === 'object')) {
      const group = element('fieldset', 'ts-option-group');
      group.append(element('legend', '', title));
      if (description) group.append(element('p', 'ts-hint', description));
      const items = element('div');
      const renderItems = () => {
        items.replaceChildren();
        const current = atPath(state.form, path) || [];
        for (const [index, item] of current.entries()) {
          optionField(items, `${index + 1}`, schema.items || {}, [...path, String(index)], item);
          items.append(button(t.remove, () => {
            putPath(state.form, path, current.filter((_, position) => position !== index));
            changed();
            renderItems();
          }, 'ts-button ts-quiet'));
        }
      };
      group.append(items, button(t.addItem, () => {
        const current = atPath(state.form, path) || [];
        const item = Object.fromEntries(Object.entries(schema?.items?.properties || {}).map(([name, declaration]) => [name, declaration.default ?? (declaration.type === 'boolean' ? false : declaration.type === 'number' || declaration.type === 'integer' ? 0 : '')]));
        putPath(state.form, path, [...current, item]);
        changed();
        renderItems();
      }));
      renderItems();
      parent.append(group);
      return;
    }
    if (schema?.properties || (value && typeof value === 'object' && !Array.isArray(value))) {
      const group = element('fieldset', 'ts-option-group');
      group.append(element('legend', '', title));
      if (description) group.append(element('p', 'ts-hint', description));
      const properties = schema?.properties || Object.fromEntries(Object.keys(value || {}).map((name) => [name, {}]));
      for (const [name, child] of Object.entries(properties)) optionField(group, name, child, [...path, name], value?.[name]);
      parent.append(group);
      return;
    }
    const row = element('div', 'ts-field');
    const id = `ts-option-${path.join('-')}`;
    const label = element('label', 'ts-field-label', title);
    label.htmlFor = id;
    let input;
    const enumValues = schema?.enum || (schema?.oneOf?.every((item) => 'const' in item) ? schema.oneOf.map((item) => item.const) : null);
    let stringArray = false;
    let encodedArray = false;
    if (typeof value === 'string' && /^\s*\[/.test(value)) {
      try { const parsed = JSON.parse(value); if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) { value = parsed; encodedArray = true; } } catch {}
    }
    if (enumValues) {
      input = element('select', 'ts-input');
      for (const [index, item] of enumValues.entries()) {
        const option = element('option', '', labelText(schema?.oneOf?.[index]?.title, language) || String(item));
        option.value = String(index);
        input.append(option);
      }
      input.value = String(Math.max(0, enumValues.findIndex((item) => item === value)));
    } else if (schema?.type === 'boolean' || typeof value === 'boolean') {
      input = element('input');
      input.type = 'checkbox';
      input.checked = Boolean(value);
      row.classList.add('ts-option-switch');
    } else if ((Array.isArray(value) && value.every((item) => ['string', 'number'].includes(typeof item))) || schema?.type === 'array') {
      input = element('textarea', 'ts-input');
      input.rows = 3;
      input.value = (Array.isArray(value) ? value : []).join('\n');
      stringArray = true;
    } else {
      input = element('input', 'ts-input');
      input.type = schema?.type === 'number' || schema?.type === 'integer' || typeof value === 'number' ? 'number' : 'text';
      input.value = String(value ?? schema?.default ?? '');
      if (input.type === 'number') {
        input.step = schema?.type === 'integer' ? '1' : 'any';
        if (schema?.minimum !== undefined) input.min = String(schema.minimum);
        if (schema?.maximum !== undefined) input.max = String(schema.maximum);
      }
    }
    input.id = id;
    input.dataset.option = path.join('.');
    const eventName = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
    listen(input, eventName, () => {
      let nextValue;
      if (enumValues) nextValue = enumValues[Number(input.value)];
      else if (input.type === 'checkbox') nextValue = input.checked;
      else if (stringArray) {
        const values = parseDirectoryLines(input.value);
        nextValue = encodedArray ? JSON.stringify(values) : schema?.items?.type === 'number' || schema?.items?.type === 'integer' ? values.map(Number) : values;
        if (Array.isArray(nextValue) && nextValue.some((item) => typeof item === 'number' && (!Number.isFinite(item) || schema?.items?.type === 'integer' && !Number.isInteger(item)))) invalid.add(path.join('.'));
        else invalid.delete(path.join('.'));
      } else if (input.type === 'number') {
        nextValue = Number(input.value);
        if (!input.value.trim() || !Number.isFinite(nextValue) || !input.checkValidity()) invalid.add(path.join('.'));
        else invalid.delete(path.join('.'));
      } else nextValue = input.value;
      putPath(state.form, path, nextValue);
      changed();
    });
    row.append(label);
    const picker = schema?.['x-path'];
    if (picker && ['file', 'directory'].includes(picker.kind) && input.tagName === 'INPUT' && input.type === 'text') {
      const controls = element('div', 'ts-field-controls');
      controls.append(input, button(t.choose, () => run(async () => {
        const selected = await ctx.pickPath({ ...picker, title, currentPath: input.value });
        if (!selected || ctx.signal.aborted) return;
        input.value = selected;
        putPath(state.form, path, selected);
        changed();
      }), 'ts-button ts-path-button'));
      row.append(controls);
    } else row.append(input);
    if (description) row.append(element('p', 'ts-hint', description));
    parent.append(row);
  }

  function optionFields() {
    section(t.steps[2], t.optionsNote);
    for (const kind of ['conversation', 'codex', 'memory']) {
      const box = section(t[kind]);
      const options = state.form[`${kind}Options`] ||= {};
      const schema = state.setup?.optionSchemas?.[kind];
      const properties = schema?.properties || Object.fromEntries(Object.keys(options).map((key) => [key, {}]));
      if (!Object.keys(properties).length) box.append(element('p', 'ts-hint', t.noOptions));
      for (const [key, declaration] of Object.entries(properties)) {
        const path = schemaPath(key);
        optionField(box, key, declaration, [`${kind}Options`, ...path], atPath(options, path));
      }
    }
  }

  function payload() {
    if (invalid.size) throw new Error(t.invalidNumber + [...invalid].join(', '));
    return makeSetupPayload(state.form, credentials, state.form.restartAfterSave !== false, language);
  }

  function statusText(value) {
    return ({ ok: t.statusOk, ready: t.statusOk, running: t.statusOk, error: t.statusError, failed: t.statusError, skipped: t.statusSkipped, stopped: t.statusStopped, disabled: t.statusStopped, 'setup-required': t.statusSetup, starting: t.statusStarting, offline: t.statusOffline })[value] || value || t.statusUnknown;
  }

  function checkFields() {
    const box = section(t.checkTitle, t.checkNote);
    box.append(action(t.check, () => run(async () => {
      const current = payload();
      state.checks = await ctx.invoke('checkConnections', [current]);
      state.checkCurrent = true;
      if (!ctx.signal.aborted) showStep(3);
    }), 'ts-button ts-secondary'));
    const checks = element('div', 'ts-checks');
    checks.setAttribute('aria-live', 'polite');
    checks.append(element('p', 'ts-section-note', !state.checks ? t.checksNone : state.checks.ok ? t.checksPassed : t.checksFailed));
    for (const check of state.checks?.checks || []) {
      const row = element('div', 'ts-result');
      row.dataset.status = check.status;
      row.append(element('span', 'ts-result-mark', statusText(check.status)), element('strong', '', String(check.id)), element('p', '', errorMessage(check.message)));
      checks.append(row);
    }
    box.append(checks);
    const components = element('dl', 'ts-component-list');
    for (const [name, component] of Object.entries(state.setup?.components || {})) {
      components.append(element('dt', '', t[name] || name), element('dd', '', statusText(component.status)));
      if (component.error) components.append(element('dd', 'ts-component-error', errorMessage(component.error)));
    }
    if (components.childElementCount) {
      box.append(element('h3', '', t.components), components);
    }
    const notes = [...(state.setup?.warnings || []), ...(state.setup?.steps || [])];
    if (notes.length) {
      box.append(element('h3', '', t.warnings));
      const list = element('ul', 'ts-notes');
      for (const note of notes) list.append(element('li', '', errorMessage(note)));
      box.append(list);
    }
    const saveBox = section(t.save);
    if (state.form.restartAfterSave === undefined) state.form.restartAfterSave = true;
    checkbox(saveBox, t.restart, 'restartAfterSave', t.restartHint);
    saveBox.append(action(t.save, () => run(async () => {
      const current = payload();
      const result = await ctx.invoke('applySetup', [current]);
      if (!result?.ok || !result?.saved) throw new Error(t.failed);
      credentials.qqToken = '';
      credentials.gatewayToken = '';
      state.dirty = false;
      state.notice = result.restartRequested ? t.savedRestart : t.saved;
      state.setup = { ...state.setup, secrets: { qqTokenConfigured: state.setup?.secrets?.qqTokenConfigured || Boolean(current.secrets?.qqToken), gatewayTokenConfigured: state.setup?.secrets?.gatewayTokenConfigured || Boolean(current.secrets?.gatewayToken) } };
      if (result.warnings?.length) state.notice += ` ${result.warnings.map(errorMessage).join(' ')}`;
      refreshFooter();
      refreshMode();
    }), 'ts-button ts-primary'));
    const gateway = section(t.gatewayTitle, t.gatewayNote);
    gateway.append(action(t.generate, () => run(async () => {
      state.generated = await ctx.invoke('gatewayInstall', [payload()]);
      if (!ctx.signal.aborted) showStep(3);
    }), 'ts-button ts-secondary'));
    if (state.generated) {
      const installer = state.generated.kind === 'local-private-install-kit' && /\.(?:cmd|sh)$/i.test(state.generated.filename || '');
      gateway.append(element('p', 'ts-alert', installer ? t.gatewayPrepared : t.gatewayLegacyPrepared));
      const download = button(installer ? t.download : t.downloadLegacy, () => {
        const blob = new Blob([state.generated.content], { type: installer ? 'text/plain;charset=utf-8' : 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = element('a');
        link.href = url;
        link.download = state.generated.filename || 'task-supervisor-dsh-gateway.json';
        gateway.append(link);
        link.click();
        link.remove();
        ctx.timeout(() => URL.revokeObjectURL(url), 1000);
        ctx.own({ dispose: () => URL.revokeObjectURL(url) });
      });
      gateway.append(download, element('p', 'ts-hint', state.generated.warning || t.generatedNote));
      if (installer) {
        gateway.append(element('p', 'ts-hint', t.privateKit));
        if (state.generated.kitDirectory) {
          gateway.append(element('h3', '', t.kitDirectory), element('code', 'ts-local-path', errorMessage(state.generated.kitDirectory)));
        }
        if (state.generated.runCommand) {
          gateway.append(element('h3', '', t.runCommand), element('code', 'ts-local-path', errorMessage(state.generated.runCommand)));
        }
      } else gateway.append(element('p', 'ts-hint', t.legacyKit));
      const list = element('ol', 'ts-notes');
      for (const step of state.generated.steps || []) list.append(element('li', '', errorMessage(step)));
      gateway.append(element('h3', '', t.gatewaySteps), list);
    } else gateway.append(element('p', 'ts-hint', t.noGateway));
  }

  function showStep(index) {
    state.step = index;
    content.replaceChildren();
    actionButtons.length = 0;
    for (const [i, node] of [...navigation.children].entries()) {
      node.dataset.active = String(index === i);
      if (index === i) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    }
    if (!state.setup) content.append(element('p', 'ts-loading', t.loading));
    else [connectionFields, scopeFields, optionFields, checkFields][index]();
    if (state.busy) for (const node of content.querySelectorAll('input, textarea, select, button')) node.disabled = true;
    refreshBanners();
    refreshFooter();
  }

  for (const [index, label] of t.steps.entries()) {
    const node = button('', () => showStep(index), 'ts-step');
    node.append(element('span', 'ts-step-index', String(index + 1).padStart(2, '0')));
    const text = element('span');
    text.append(element('strong', '', label), element('small', '', t.stepNotes[index]));
    node.append(text);
    navigation.append(node);
  }

  async function load(initial = false) {
    const result = await ctx.invoke('getSetup');
    if (ctx.signal.aborted) return;
    state.setup = result;
    if (initial) {
      state.form = structuredClone(result.form || {});
      state.dirty = false;
      showStep(state.step);
    }
    refreshMode();
  }

  showStep(0);
  refreshMode();
  try { await load(true); }
  catch (error) {
    if (!ctx.signal.aborted) {
      state.error = errorMessage(error);
      content.replaceChildren(action(t.retry, () => run(() => load(true))));
      refreshBanners();
    }
  }
  ctx.guardLeave?.(() => state.dirty ? t.unsaved : null);
  ctx.interval(() => { if (!state.busy) load(false).catch(() => {}); }, 4000);
  return { dispose() { credentials.qqToken = ''; credentials.gatewayToken = ''; } };
}

export default { panels: { setup: { mount: mountSetup } } };
