// The setup panel carries all supported host languages in this single asset.
export const UI_TRANSLATIONS = {
  "zh": {
    "copy": {
      "title": "任务托管",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "把 DSH 与 Codex 接到 Coo，离开电脑后通过 QQ 接手。",
      "steps": [
        "连接服务",
        "选择范围",
        "功能设置",
        "检查与应用"
      ],
      "stepNotes": [
        "主人与连接",
        "工作区与会话",
        "完整可选功能",
        "验证、保存与接入"
      ],
      "nativeRequirement": "SnowLuma 原生连接需要本包附带的 native add-on；仅安装 SnowLuma 主程序还不能连接。",
      "duplicateOwner": "请勿让另一个 QQ World 同时监听这位主人的私聊，以免形成重复通道。",
      "loading": "正在读取配置…",
      "retry": "重新读取",
      "off": "本地待命",
      "on": "正在汇报",
      "offNote": "重要任务通知会先留在本地；通过 QQ 开启后才向 Coo 投递。",
      "onNote": "仅汇报任务完成、失败或需要你处理的问题。",
      "queue": "积压通知",
      "owner": "主人 QQ 号",
      "ownerHint": "只有这个号码的私聊可以用 #@ 切换汇报。群聊与其他账号无效。",
      "toggleHint": "在你与她的 QQ 私聊中，把 #@ 放在消息开头，或单独发送 #@：开启并补发积压；再次发送则关闭。 汇报开关不会提交任务；每次原生操作仍需另行取得新的明确确认。",
      "transport": "QQ 接入方式",
      "native": "SnowLuma 原生直连",
      "trusted": "已有 QQ World（可信私聊事件）",
      "onebot": "OneBot v11（兼容已有部署）",
      "qqEndpoint": "QQ 连接地址",
      "qqAccount": "机器人 QQ 号",
      "qqAccountHint": "登录 SnowLuma 的账号，不是主人 QQ 号。",
      "qqToken": "QQ 连接凭证",
      "tokenHint": "留空保留已有凭证；保存后不回显。",
      "configured": "已保存",
      "unconfigured": "尚未保存",
      "gateway": "DSH 控制网关地址",
      "gatewayHint": "填 DSH 宿主提供的控制网关地址。Coo 中的 World 需要与宿主插件配合。",
      "gatewayToken": "DSH 网关凭证",
      "connectionsNote": "凭证保存在本机。检查连接只进行读取，不发送 QQ 消息，也不执行任务。",
      "dshEnabled": "接入 DSH",
      "codexEnabled": "接入 Codex",
      "roots": "允许访问的工作区",
      "rootsHint": "每行一个目录。只有明确列出的范围会提供给 Coo。",
      "dshSessions": "DSH 会话目录",
      "codexSessions": "Codex 会话目录",
      "sessionsHint": "用于发现任务及读取历史；保留默认值可使用本机标准目录。",
      "excluded": "始终排除的目录",
      "excludedHint": "每行一个目录；会话、检索与文件访问都应遵守这些边界。",
      "files": "允许读取工作区文件",
      "filesHint": "默认关闭。开启后仍受允许目录、排除目录与汇报开关限制。",
      "fileRoots": "Codex 文件读取子目录",
      "fileRootsHint": "开启 Codex 文件读取时必填。每行一个项目目录，必须在上面允许的 Codex 工作区内；不能选择整盘或用户主目录。",
      "fileRootsRequired": "请先在“选择范围”中填写 Codex 文件读取子目录。",
      "choose": "选择目录",
      "addPath": "添加目录",
      "optionsNote": "这些设置覆盖会话控制、Codex 与 DSH 记忆能力。一般只需完成前两步。",
      "command": "QQ 私聊",
      "conversation": "会话与审批",
      "codex": "Codex 读取",
      "memory": "DSH 记忆",
      "noOptions": "此组件没有额外设置。",
      "optional": "可选",
      "addItem": "添加一项",
      "remove": "移除",
      "statusSetup": "等待配置",
      "statusStarting": "正在启动",
      "statusOffline": "连接离线",
      "checkTitle": "先验证连接，再保存应用",
      "checkNote": "检查使用当前表单；修改后需要重新检查。保存会把设置写入这个 World。",
      "check": "检查连接",
      "checkRunning": "正在检查…",
      "checksNone": "尚未检查当前配置。",
      "checksPassed": "当前配置检查完成。",
      "checksFailed": "有连接需要处理，请查看下面的结果。",
      "checkStale": "配置已修改，请重新检查。",
      "save": "保存并应用",
      "saving": "正在保存…",
      "restart": "保存后重启此 World",
      "restartHint": "只重载这个扩展，让新连接与范围生效。",
      "saved": "配置已保存。",
      "savedRestart": "配置已保存，已请求重启此 World。",
      "warnings": "需要留意",
      "components": "组件状态",
      "gatewayTitle": "把 DSH 宿主也接上",
      "gatewayNote": "生成安装器，下载后在这台电脑上运行。安装器会让你选择 DSH_HOME 和配置档，并在实际应用前请你确认。",
      "generate": "生成 DSH 一键安装器",
      "generating": "正在生成…",
      "download": "下载安装器",
      "downloadLegacy": "下载接入说明",
      "gatewayPrepared": "安装器已准备；尚未安装到 DSH。",
      "gatewayLegacyPrepared": "接入说明已生成；尚未安装到 DSH。",
      "gatewaySteps": "接下来在 DSH 中完成",
      "generatedNote": "启动器不含凭证；它依赖这台电脑上的私密安装包，请在本机运行。",
      "kitDirectory": "本机安装包",
      "runCommand": "也可以在本机命令行运行",
      "privateKit": "凭证只由本机安装包保存，不会出现在下载的启动器中。运行后仍需完成 DSH 的启动与连接检查。",
      "legacyKit": "这份文件是旧式接入说明。请使用提供一键安装器的版本重新生成，无需手动填写 JSON。",
      "back": "上一步",
      "next": "下一步",
      "fieldError": "请检查表单：",
      "invalidOwner": "主人 QQ 号应为有效的数字账号。",
      "invalidNumber": "请输入有效数字：",
      "statusUnknown": "未报告",
      "statusOk": "正常",
      "statusError": "异常",
      "statusSkipped": "已跳过",
      "statusStopped": "未启动",
      "version": "扩展版本",
      "savedLabel": "保存状态",
      "unsaved": "有未保存的修改",
      "clean": "已读取本机配置",
      "failed": "操作失败，请重试。",
      "noGateway": "尚未生成接入文件。",
      "optionalCredentials": "进阶模式：需要另一个兼容的 QQ World 提供可信私聊事件与回复能力。凭证由该插件管理。",
      "nativePrivateChannel": "此 World 自带任务私聊通道：通过底层 QQ 服务接收主人的指令，并在汇报开启后回复任务结果。",
      "enableWorld": "启用此 World",
      "stateDirectory": "本机任务监管状态目录",
      "credentialReference": "凭证引用",
      "environmentTitle": "环境提示词",
      "environmentDescription": "工具范围、任务通知策略与原生批准边界。",
      "modeLabel": "汇报模式",
      "sourceDisabled": "此来源已禁用。",
      "sourceReady": "来源目录存在；没有读取任何对话内容。",
      "sourceUnavailable": "来源目录不可用或已被排除。",
      "gatewayCheckOk": "已通过经过身份验证的回环网关与允许项目范围检查。",
      "gatewayCheckFailed": "网关检查失败，请确认外部 DSH 插件与凭证。",
      "gatewayMissingCredential": "尚未保存网关凭证；只读来源仍可运行。",
      "qqRequired": "请填写 QQ 服务地址与机器人账号。",
      "nativeCheckOk": "已验证 SnowLuma 身份与增量订阅辅助组件；检查没有修改订阅。",
      "nativeCheckFailed": "SnowLuma 身份或辅助组件验证失败。请检查地址、账号及凭证，并使用附带的增量订阅辅助组件。",
      "onebotCheckNote": "连接后会按机器人及主人账号验证 OneBot 帧；本次检查不发送 QQ 消息。",
      "savedScopePending": "权限变更已保存，旧组件已立即停止。请重启此 World，让新范围以关闭汇报的状态启用。",
      "savedConfigurationPending": "设置已保存；运行中的组件会保持原设置，直到此 World 重启。",
      "additiveSubscriptions": "此 World 只添加主人的订阅，不会替换 SnowLuma 用于其他对话的订阅。",
      "offLimits": "关闭时会忽略主人的普通消息；原始 #@ 仍可切换汇报。关闭不会清除已送达的内容或取消已提交的原生任务。",
      "scopeChanged": "更换主人、来源权限、根目录或排除项，会创建新的关闭汇报范围与队列。旧状态目录会保留；已提交的原生任务会独立继续执行。",
      "armInstruction": "检查连接、保存并应用后，等待一秒，再发送新的私聊 #@ 开启汇报；再次发送即可关闭。",
      "runKit": "在同一台电脑下载并运行此启动器一次。安装完成前，请保持私密安装包的位置不变。",
      "kitSelectProfile": "选择 DSH_HOME 和已有配置档（例如 desktop）。安装器会显示确切的 YAML 目标，并要求输入 INSTALL。",
      "kitBackup": "安装器会保留其他插件及凭证、备份已有文件、使用原生写入锁，并保存凭证而不显示内容。更新已有网关需要明确确认。",
      "kitRestart": "重启所选 DSH 宿主，再在此检查经过验证的连接。安装器不会启动网关或验证网关正在运行。",
      "codexOnlyControl": "Codex 只读监看不需要 DSH 网关；原生 Codex 控制还需要明确配置受支持的 Codex 传输方式。",
      "kitSecurity": "本机安装器已准备，但尚未安装。私密安装包含有凭证，请勿分享整个安装包。DSH 必须加载原生插件；此 World 需要该独立宿主。",
      "formRequired": "请先提供设置表单。",
      "actionUnsupported": "不支持此设置操作。",
      "installerNeedsScope": "生成安装器前，请选择主人和至少一个明确的项目来源。",
      "gatewayCredentialInvalid": "网关凭证至少需要 32 个字符，且不能包含空白。",
      "credentialInvalid": "请检查凭证格式；不能包含空白或超过 8192 个字符。",
      "qqAccountInvalid": "请填写有效的机器人 QQ 数字账号。",
      "invalidConfiguration": "请检查配置字段",
      "unsupportedOption": "不支持此选项",
      "invalidDirectory": "请选择允许范围内最多 100 个有效的绝对目录路径。",
      "invalidEndpoint": "请为所选服务填写明确的 IPv4 回环地址与端口。",
      "rootsRequired": "请为每个启用的来源选择至少一个允许的工作区。",
      "componentIssue": "此组件需要处理。请检查来源、连接与凭证。",
      "diagnosticCode": "诊断代码",
      "unknownDiagnostic": "服务返回了无法识别的诊断信息。请检查连接和组件状态。",
      "itemLabel": "项目",
      "readOnlyLabel": "只读",
      "unknownOption": "其他设置",
      "modeWorkspace": "工作区",
      "modeMemory": "外部记忆",
      "policyImportant": "完成与需要处理的问题",
      "policyRecord": "仅在本机记录",
      "publicFinal": "最终结果",
      "publicCommentary": "中间进度",
      "onOffLabel": "汇报状态"
    },
    "labels": {
      "pollIntervalMs": "网关轮询间隔（毫秒）",
      "desktopProgressEnabled": "收录桌面 DSH 任务边界",
      "requestTimeoutMs": "网关请求超时（毫秒）",
      "eventTtlMs": "真人消息有效期（毫秒）",
      "selectionTtlMs": "目标选择有效期（毫秒）",
      "includeSubagents": "包含子代理任务",
      "workspaceFileRoots": "项目文件目录",
      "workspaceMaxFileBytes": "文本文件大小上限（字节）",
      "watchIntervalSeconds": "轮询间隔（秒）",
      "watchMaxItems": "每次轮询条目上限",
      "maxReadBytes": "每页读取预算（字节）",
      "maxScanBytes": "每次扫描预算（字节）",
      "notificationPolicy": "任务通知策略",
      "notifyPhases": "收录的公开消息阶段",
      "notifyUserMessages": "收录公开用户消息",
      "notifyLifecycle": "收录原生生命周期事实",
      "eventContentChars": "事件正文上限（字符）",
      "sourceMode": "DSH 来源模式",
      "healthCheckIntervalSeconds": "来源健康检查间隔（秒）",
      "writeMaxPerTick": "每批写入上限",
      "queueMaxPending": "待写入条目上限",
      "rawSyncIntervalSeconds": "原始对话同步间隔（秒）",
      "rawMaxSourceBytes": "原始对话大小上限（字节）",
      "dbFile": "DSH 记忆数据库",
      "allowedProjects": "允许的项目名称",
      "includeGlobal": "包含全局记忆层",
      "levels": "可读记忆层",
      "watchMaxPerTick": "每次轮询记忆条目上限",
      "watchContentChars": "记忆预览上限（字符）",
      "writeEnabled": "允许写入外部记忆",
      "writeFlushSeconds": "写入队列间隔（秒）",
      "writeLevels": "可写记忆层",
      "writeSourceLabel": "外部写入来源标签",
      "rawEnabled": "启用原始对话镜像",
      "rawDir": "本机对话镜像目录",
      "rawBuckets": "允许的镜像分区",
      "rawMaxTurns": "每个镜像对话的轮次上限"
    },
    "hints": {
      "sourceMode": "工作区模式限定在选定的项目范围；记忆模式读取指定的 DSH 外部记忆数据库。",
      "workspaceFileRoots": "每行一个项目目录，必须位于允许的 Codex 工作区内；不能选择整盘或用户主目录。",
      "notificationPolicy": "仅在原生任务完成或需要真人处理问题时提供通知；普通步骤保留在本机。",
      "allowedProjects": "用英文逗号分隔精确的项目名称；名称属于外部记忆来源。",
      "levels": "用英文逗号分隔可读记忆层的名称。",
      "writeLevels": "用英文逗号分隔可写记忆层的名称；不能写入全局 soul 与 user 层。",
      "includeGlobal": "允许在记忆模式读取全局记忆层；默认关闭。",
      "writeEnabled": "在记忆模式把标明来源的外部记忆加入写入队列；入队不代表已确认持久写入。",
      "rawEnabled": "把清理敏感信息后的原始对话导入本机镜像；来源目录与工作区排除规则仍然适用。",
      "rawBuckets": "用英文逗号分隔分区名称；留空则使用设置的来源范围。",
      "watchIntervalSeconds": "设为零可关闭后台轮询；开启任务监管时仍可按需读取。",
      "desktopProgressEnabled": "只读取已授权工作区内新的桌面 DSH 原生事件，不推测 QQ 收件人。",
      "workspaceMaxFileBytes": "默认 1 MiB。超过限制的文件会被拒绝，不会截断后作为全文提供。",
      "maxReadBytes": "第一条完整记录可以超出此页预算；超出量与上下文前缀扫描会分别记录。",
      "maxScanBytes": "第一条完整记录可以超出扫描预算，随后结束本轮；历史上下文重放单独记录。",
      "notifyPhases": "用英文逗号分隔阶段标识：commentary、final_answer、message。中间文本在重要任务边界出现前保留在本机。",
      "healthCheckIntervalSeconds": "即使没有新数据，也会定期检查来源健康状态；健康心跳不代表任务有进度。",
      "rawSyncIntervalSeconds": "在独立 Worker 中同步。零表示手动同步；没有新对话时，状态仍记录最后检查时间。",
      "rawMaxSourceBytes": "限制每次同步读取的来源字节数；未完成的游标会在下次继续。",
      "dbFile": "选定的 DSH 外部记忆 SQLite 数据库绝对路径；修改后请重启此 World。",
      "watchMaxPerTick": "超过上限的条目留到下一次轮询。",
      "watchContentChars": "限制每条记忆的预览长度；开启任务访问时，读取工具仍可获取完整来源正文。",
      "writeFlushSeconds": "按此间隔写出队列；零表示调用操作时立即写入。",
      "writeSourceLabel": "写入 source_session，供 DSH 识别外部来源。",
      "rawDir": "清理敏感信息后的对话镜像本机目录。已有条目只追加；排除和受保护的路径仍无法访问。",
      "rawMaxTurns": "限制每次同步导入的对话轮次；其余轮次会在下次继续。"
    }
  },
  "en": {
    "copy": {
      "nativeRequirement": "SnowLuma native connections require the native add-on included in this package. Installing SnowLuma itself does not provide this API.",
      "duplicateOwner": "Do not let another QQ World also listen to private messages from the same owner; duplicate listeners create two channels.",
      "title": "Task supervisor",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "Connect DSH and Codex to Coo, then take over through QQ when away.",
      "steps": [
        "Connect",
        "Choose scope",
        "Features",
        "Check & apply"
      ],
      "stepNotes": [
        "Owner and services",
        "Workspaces and sessions",
        "All optional features",
        "Validate, save and connect"
      ],
      "loading": "Reading configuration…",
      "retry": "Read again",
      "off": "Local standby",
      "on": "Reporting enabled",
      "offNote": "Important task notices stay local until you enable reporting.",
      "onNote": "Only completion, failure and issues that need your attention are reported.",
      "queue": "Queued notices",
      "owner": "Owner QQ number",
      "ownerHint": "Only private messages from this account can toggle reporting with #@. Groups and other accounts cannot.",
      "toggleHint": "In your private QQ chat, start a message with #@, or send #@ alone, to enable reporting and release the queue. Send it again to turn reporting off. The switch does not submit work. Each native operation still needs a separate fresh confirmation.",
      "transport": "QQ connection",
      "native": "SnowLuma native connection",
      "trusted": "Existing QQ World (trusted private events)",
      "onebot": "OneBot v11 (existing deployments)",
      "qqEndpoint": "QQ service address",
      "qqAccount": "Bot QQ number",
      "qqAccountHint": "The account signed in to SnowLuma, rather than the owner account.",
      "qqToken": "QQ connection credential",
      "tokenHint": "Leave blank to keep the stored credential. Saved values are never returned.",
      "configured": "Stored",
      "unconfigured": "Not stored",
      "gateway": "DSH control gateway address",
      "gatewayHint": "Use the control gateway exposed by the DSH host. This World works together with the host plugin.",
      "gatewayToken": "DSH gateway credential",
      "connectionsNote": "Credentials stay on this machine. Connection checks only read: they do not send QQ messages or execute tasks.",
      "dshEnabled": "Connect DSH",
      "codexEnabled": "Connect Codex",
      "roots": "Allowed workspaces",
      "rootsHint": "One directory per line. Only the scope you list is available to Coo.",
      "dshSessions": "DSH session directory",
      "codexSessions": "Codex session directory",
      "sessionsHint": "Used to discover tasks and read history. Keep the default to use the standard local location.",
      "excluded": "Always excluded directories",
      "excludedHint": "One directory per line. Sessions, searches and file access must respect these boundaries.",
      "files": "Allow workspace file reads",
      "filesHint": "Off by default. Reads still respect the allowed scope, exclusions and reporting mode.",
      "fileRoots": "Codex project file directories",
      "fileRootsHint": "Required for Codex file reads. One project directory per line, inside an allowed Codex workspace above. Whole drives and home directories are not accepted.",
      "fileRootsRequired": "Choose the Codex project file directories under Choose scope first.",
      "choose": "Choose directory",
      "addPath": "Add directory",
      "optionsNote": "These controls cover conversation operations, Codex and DSH memory. Most installations only need the first two steps.",
      "command": "QQ private chat",
      "conversation": "Conversations & approvals",
      "codex": "Codex reads",
      "memory": "DSH memory",
      "noOptions": "No additional settings for this component.",
      "optional": "Optional",
      "addItem": "Add item",
      "remove": "Remove",
      "statusSetup": "Setup required",
      "statusStarting": "Starting",
      "statusOffline": "Offline",
      "checkTitle": "Check connections, then save",
      "checkNote": "Checks use this form. Run them again after making changes. Saving writes settings to this World.",
      "check": "Check connections",
      "checkRunning": "Checking…",
      "checksNone": "This configuration has not been checked.",
      "checksPassed": "The current configuration has been checked.",
      "checksFailed": "Some connections need attention. See the results below.",
      "checkStale": "Configuration changed. Check again.",
      "save": "Save & apply",
      "saving": "Saving…",
      "restart": "Restart this World after saving",
      "restartHint": "Reload only this extension to apply the new connections and scope.",
      "saved": "Configuration saved.",
      "savedRestart": "Configuration saved; a World restart was requested.",
      "warnings": "Notes",
      "components": "Component status",
      "gatewayTitle": "Connect the DSH host too",
      "gatewayNote": "Generate the installer, download it and run it on this computer. It asks you to choose DSH_HOME and a profile, then confirm before applying changes.",
      "generate": "Generate DSH installer",
      "generating": "Generating…",
      "download": "Download installer",
      "downloadLegacy": "Download connection notes",
      "gatewayPrepared": "Installer prepared. It has not been installed in DSH.",
      "gatewayLegacyPrepared": "Connection notes prepared. They have not been installed in DSH.",
      "gatewaySteps": "Finish these steps in DSH",
      "generatedNote": "The launcher contains no credential and depends on the private kit on this computer. Run it locally.",
      "kitDirectory": "Local installation kit",
      "runCommand": "Or run locally in a command line",
      "privateKit": "The credential stays in the private local kit, outside the downloaded launcher. Finish starting DSH and checking its connection afterwards.",
      "legacyKit": "This is an older connection specification. Generate it again with a version that provides the installer; no manual JSON editing is needed.",
      "back": "Back",
      "next": "Next",
      "fieldError": "Check the form: ",
      "invalidOwner": "Enter a valid numeric QQ account for the owner.",
      "invalidNumber": "Enter a valid number: ",
      "statusUnknown": "Not reported",
      "statusOk": "Ready",
      "statusError": "Error",
      "statusSkipped": "Skipped",
      "statusStopped": "Stopped",
      "version": "Extension version",
      "savedLabel": "Configuration",
      "unsaved": "Unsaved changes",
      "clean": "Local configuration loaded",
      "failed": "The operation failed. Try again.",
      "noGateway": "No connection file has been generated.",
      "optionalCredentials": "Advanced: a compatible QQ World must supply trusted private events and replies. That plugin manages its credentials.",
      "nativePrivateChannel": "This World includes the task private-chat channel: it receives owner commands through the underlying QQ service and replies with results while reporting is enabled.",
      "enableWorld": "Enable this World",
      "stateDirectory": "Local supervision state directory",
      "credentialReference": "Credential reference",
      "environmentTitle": "Environment prompt",
      "environmentDescription": "Tool scope, task notification policy and native approval boundaries.",
      "modeLabel": "Reporting mode",
      "sourceDisabled": "This source is disabled.",
      "sourceReady": "The source directory exists. No conversation content was read.",
      "sourceUnavailable": "The source directory is unavailable or excluded.",
      "gatewayCheckOk": "The authenticated loopback gateway and permitted project scopes passed their checks.",
      "gatewayCheckFailed": "The gateway check failed. Verify the external DSH plugin and its credential.",
      "gatewayMissingCredential": "No gateway credential is stored. Read-only sources can still run.",
      "qqRequired": "Enter the QQ service address and bot account.",
      "nativeCheckOk": "SnowLuma identity and its additive-subscription helper were verified. The check did not change subscriptions.",
      "nativeCheckFailed": "SnowLuma identity or helper verification failed. Check the address, account and credential, and use the included helper with additive subscriptions.",
      "onebotCheckNote": "After connection, OneBot frames are verified against the bot account and owner. This check sends no QQ messages.",
      "savedScopePending": "Permission changes were saved and the previous components stopped immediately. Restart this World to activate the new scope, which starts OFF.",
      "savedConfigurationPending": "The configuration is saved. Running components keep their previous settings until this World restarts.",
      "additiveSubscriptions": "This World adds the owner subscription without replacing SnowLuma subscriptions used by other conversations.",
      "offLimits": "While OFF, ordinary owner chat is ignored; an original #@ still toggles reporting. OFF does not erase delivered content or cancel submitted native tasks.",
      "scopeChanged": "Changing the owner, source permissions, roots or exclusions creates a new OFF scope and queue. Previous state directories are kept; already submitted native tasks continue independently.",
      "armInstruction": "Check connections, save and apply. Wait one second, then send a new private #@ to enable reporting; send it again to turn reporting off.",
      "runKit": "Download and run this launcher once on the same computer. Keep the private kit in place until installation finishes.",
      "kitSelectProfile": "Choose DSH_HOME and an existing profile, such as desktop. The installer shows the exact YAML targets and asks you to type INSTALL.",
      "kitBackup": "The installer preserves other plugins and credentials, backs up existing files, uses native writer locks and stores the credential without displaying it. Updating an existing gateway requires explicit confirmation.",
      "kitRestart": "Restart the selected DSH host, then check authenticated connections here. The installer does not start or verify a running gateway.",
      "codexOnlyControl": "Codex read-only monitoring does not need a DSH gateway. Native Codex control also needs an explicitly configured supported Codex transport.",
      "kitSecurity": "The local installer is prepared but not installed. Its private kit contains a credential: do not share the kit. DSH must load the native plugin; this World requires that separate host.",
      "formRequired": "Provide the setup form first.",
      "actionUnsupported": "This setup action is not supported.",
      "installerNeedsScope": "Choose the owner and at least one explicit project source before generating an installer.",
      "gatewayCredentialInvalid": "The gateway credential must contain at least 32 characters without whitespace.",
      "credentialInvalid": "Check the credential format. Whitespace and values longer than 8192 characters are not accepted.",
      "qqAccountInvalid": "Enter a valid numeric QQ account for the bot.",
      "invalidConfiguration": "Check the configuration field",
      "unsupportedOption": "This option is not supported",
      "invalidDirectory": "Choose up to 100 valid absolute directory paths within the permitted scope.",
      "invalidEndpoint": "Use an explicit IPv4 loopback address and port for the selected service.",
      "rootsRequired": "Choose at least one permitted workspace for each enabled source.",
      "componentIssue": "This component needs attention. Check its source, connection and credential.",
      "diagnosticCode": "Diagnostic code",
      "unknownDiagnostic": "The service reported an unrecognized diagnostic. Check the connection and component status.",
      "itemLabel": "Item",
      "readOnlyLabel": "Read only",
      "unknownOption": "Additional setting",
      "modeWorkspace": "Workspaces",
      "modeMemory": "External memory",
      "policyImportant": "Completion and issues requiring attention",
      "policyRecord": "Record locally",
      "publicFinal": "Final result",
      "publicCommentary": "Intermediate progress",
      "onOffLabel": "Reporting state"
    },
    "labels": {
      "pollIntervalMs": "Gateway polling interval (ms)",
      "desktopProgressEnabled": "Collect desktop DSH task boundaries",
      "requestTimeoutMs": "Gateway request timeout (ms)",
      "eventTtlMs": "Human message validity (ms)",
      "selectionTtlMs": "Target selection validity (ms)",
      "includeSubagents": "Include subagent tasks",
      "workspaceFileRoots": "Project file directories",
      "workspaceMaxFileBytes": "Maximum text file size (bytes)",
      "watchIntervalSeconds": "Polling interval (seconds)",
      "watchMaxItems": "Items per poll",
      "maxReadBytes": "Page read budget (bytes)",
      "maxScanBytes": "Polling scan budget (bytes)",
      "notificationPolicy": "Task notification policy",
      "notifyPhases": "Public message phases",
      "notifyUserMessages": "Include public user messages",
      "notifyLifecycle": "Include native lifecycle facts",
      "eventContentChars": "Event text limit (characters)",
      "sourceMode": "DSH source mode",
      "healthCheckIntervalSeconds": "Source health check interval (seconds)",
      "writeMaxPerTick": "Writes per batch",
      "queueMaxPending": "Maximum pending writes",
      "rawSyncIntervalSeconds": "Original session sync interval (seconds)",
      "rawMaxSourceBytes": "Maximum original session size (bytes)",
      "dbFile": "DSH memory database",
      "allowedProjects": "Allowed project names",
      "includeGlobal": "Include global memory layers",
      "levels": "Readable memory layers",
      "watchMaxPerTick": "Memory items per poll",
      "watchContentChars": "Memory preview limit (characters)",
      "writeEnabled": "Allow external memory writes",
      "writeFlushSeconds": "Write queue interval (seconds)",
      "writeLevels": "Writable memory layers",
      "writeSourceLabel": "External write source label",
      "rawEnabled": "Enable original session mirrors",
      "rawDir": "Local session mirror directory",
      "rawBuckets": "Allowed mirror buckets",
      "rawMaxTurns": "Maximum turns per mirrored session"
    },
    "hints": {
      "sourceMode": "Workspace mode stays within the selected project scope. Memory mode reads the configured DSH external memory database.",
      "workspaceFileRoots": "One project directory per line, inside an allowed Codex workspace. Whole drives and home directories are rejected.",
      "notificationPolicy": "Only native completion or issues requiring human attention are delivered. Ordinary steps remain local.",
      "allowedProjects": "Exact project names, separated by commas. These names belong to the external memory source.",
      "levels": "Readable layer names, separated by commas.",
      "writeLevels": "Writable layer names, separated by commas. Global soul and user layers cannot be written.",
      "includeGlobal": "Allow reads from global memory layers in memory mode. Off by default.",
      "writeEnabled": "Queue source-labelled external memory entries in memory mode. A queued entry is not yet a verified durable write.",
      "rawEnabled": "Import scrubbed original sessions into a local mirror. Source directories and workspace exclusions still apply.",
      "rawBuckets": "Bucket names separated by commas. Leave blank to use the configured source scope.",
      "watchIntervalSeconds": "Set to zero to disable background polling. Reads remain on demand while supervision is enabled.",
      "desktopProgressEnabled": "Read new native desktop DSH events only inside authorized workspaces. No QQ recipient is inferred.",
      "workspaceMaxFileBytes": "Default: 1 MiB. Files over the limit are rejected rather than truncated and presented as complete.",
      "maxReadBytes": "The first complete record can exceed this page budget. Overflow and context-prefix scanning are tracked separately.",
      "maxScanBytes": "The first complete record can exceed this scan budget; the poll then ends. Historical context replay is tracked separately.",
      "notifyPhases": "Comma-separated phase identifiers: commentary, final_answer, message. Intermediate text stays local until an important task boundary.",
      "healthCheckIntervalSeconds": "Check source health periodically even when no new data arrives. A health heartbeat does not imply task progress.",
      "rawSyncIntervalSeconds": "Sync in a separate worker. Zero selects manual sync. With no new sessions, status still records the last check time.",
      "rawMaxSourceBytes": "Limit the source bytes read per sync. An unfinished cursor continues on the next pass.",
      "dbFile": "Absolute path to the selected DSH external-memory SQLite database. Restart this World after changing it.",
      "watchMaxPerTick": "Items beyond this limit remain for the next poll.",
      "watchContentChars": "Limit each memory preview. The read tool can return the full source body while task access is enabled.",
      "writeFlushSeconds": "Flush the write queue at this interval. Zero writes when the operation is called.",
      "writeSourceLabel": "Stored in source_session so DSH can identify the external origin.",
      "rawDir": "Local directory for scrubbed session mirrors. Existing entries are appended; excluded and protected paths remain unavailable.",
      "rawMaxTurns": "Limit conversation turns imported per sync. Remaining turns continue on the next pass."
    }
  },
  "zh-Hant": {
    "copy": {
      "nativeRequirement": "SnowLuma 原生連線需要本套件附帶的原生附加元件；僅安裝 SnowLuma 主程式並不會提供此 API。",
      "duplicateOwner": "請勿讓另一個 QQ World 同時監聽這位主人的私訊，以免形成重複通道。",
      "title": "任務託管",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "將 DSH 與 Codex 接到 Coo，離開電腦後透過 QQ 接手。",
      "steps": [
        "連線服務",
        "選擇範圍",
        "功能設定",
        "檢查與套用"
      ],
      "stepNotes": [
        "主人與連線",
        "工作區與對話",
        "完整選用功能",
        "驗證、儲存與接入"
      ],
      "loading": "正在讀取設定…",
      "retry": "重新讀取",
      "off": "本機待命",
      "on": "正在回報",
      "offNote": "重要任務通知會先保留在本機；透過 QQ 開啟後才會提供給 Coo。",
      "onNote": "僅回報任務完成、失敗或需要你處理的問題。",
      "queue": "待送通知",
      "owner": "主人 QQ 號碼",
      "ownerHint": "只有這個帳號的私訊可以用 #@ 切換回報。群組與其他帳號均無效。",
      "toggleHint": "在你與她的 QQ 私訊中，將 #@ 放在訊息開頭，或單獨傳送 #@：開啟並補送累積通知；再次傳送則關閉。 回報開關不會提交任務；每次原生操作仍需另外取得新的明確確認。",
      "transport": "QQ 接入方式",
      "native": "SnowLuma 原生連線",
      "trusted": "既有 QQ World（可信私訊事件）",
      "onebot": "OneBot v11（相容既有部署）",
      "qqEndpoint": "QQ 服務位址",
      "qqAccount": "機器人 QQ 號碼",
      "qqAccountHint": "登入 SnowLuma 的帳號，與主人帳號不同。",
      "qqToken": "QQ 連線憑證",
      "tokenHint": "留空可保留既有憑證；儲存後不會回傳內容。",
      "configured": "已儲存",
      "unconfigured": "尚未儲存",
      "gateway": "DSH 控制閘道位址",
      "gatewayHint": "填入 DSH 宿主提供的控制閘道位址。此 World 需要與宿主外掛配合。",
      "gatewayToken": "DSH 閘道憑證",
      "connectionsNote": "憑證保留在這台電腦。連線檢查僅執行讀取，不會傳送 QQ 訊息或執行任務。",
      "dshEnabled": "接入 DSH",
      "codexEnabled": "接入 Codex",
      "roots": "允許存取的工作區",
      "rootsHint": "每行一個目錄。只有明確列出的範圍會提供給 Coo。",
      "dshSessions": "DSH 對話目錄",
      "codexSessions": "Codex 對話目錄",
      "sessionsHint": "用於探索任務及讀取歷史；保留預設值即可使用標準本機位置。",
      "excluded": "一律排除的目錄",
      "excludedHint": "每行一個目錄；對話、搜尋與檔案存取均受這些邊界限制。",
      "files": "允許讀取工作區檔案",
      "filesHint": "預設關閉。開啟後仍受允許目錄、排除目錄及回報模式限制。",
      "fileRoots": "Codex 專案檔案子目錄",
      "fileRootsHint": "讀取 Codex 檔案時必填。每行一個專案目錄，必須位於上方允許的 Codex 工作區內；不可選擇整個磁碟或使用者家目錄。",
      "fileRootsRequired": "請先在「選擇範圍」填寫 Codex 專案檔案子目錄。",
      "choose": "選擇目錄",
      "addPath": "新增目錄",
      "optionsNote": "這些設定涵蓋對話控制、Codex 與 DSH 記憶能力。一般只需完成前兩步。",
      "command": "QQ 私訊",
      "conversation": "對話與核准",
      "codex": "Codex 讀取",
      "memory": "DSH 記憶",
      "noOptions": "此元件沒有額外設定。",
      "optional": "選用",
      "addItem": "新增一項",
      "remove": "移除",
      "statusSetup": "等待設定",
      "statusStarting": "正在啟動",
      "statusOffline": "連線離線",
      "checkTitle": "先檢查連線，再儲存套用",
      "checkNote": "檢查使用目前表單；修改後需重新檢查。儲存會將設定寫入此 World。",
      "check": "檢查連線",
      "checkRunning": "正在檢查…",
      "checksNone": "尚未檢查目前設定。",
      "checksPassed": "目前設定已檢查完成。",
      "checksFailed": "部分連線需要處理，請查看下方結果。",
      "checkStale": "設定已修改，請重新檢查。",
      "save": "儲存並套用",
      "saving": "正在儲存…",
      "restart": "儲存後重新啟動此 World",
      "restartHint": "僅重新載入此擴充功能，讓新連線與範圍生效。",
      "saved": "設定已儲存。",
      "savedRestart": "設定已儲存，已要求重新啟動此 World。",
      "warnings": "注意事項",
      "components": "元件狀態",
      "gatewayTitle": "接入 DSH 宿主",
      "gatewayNote": "產生安裝程式，下載後在這台電腦執行。安裝程式會讓你選擇 DSH_HOME 和設定檔，並在套用前要求確認。",
      "generate": "產生 DSH 安裝程式",
      "generating": "正在產生…",
      "download": "下載安裝程式",
      "downloadLegacy": "下載接入說明",
      "gatewayPrepared": "安裝程式已備妥；尚未安裝到 DSH。",
      "gatewayLegacyPrepared": "接入說明已產生；尚未安裝到 DSH。",
      "gatewaySteps": "接下來在 DSH 中完成",
      "generatedNote": "啟動器不含憑證；它依賴這台電腦上的私密安裝套件，請在本機執行。",
      "kitDirectory": "本機安裝套件",
      "runCommand": "也可在本機命令列執行",
      "privateKit": "憑證只保留在本機私密套件，不會寫入下載的啟動器。之後仍需啟動 DSH 並檢查連線。",
      "legacyKit": "這是舊版接入說明。請用提供安裝程式的版本重新產生，無需手動編輯 JSON。",
      "back": "上一步",
      "next": "下一步",
      "fieldError": "請檢查表單：",
      "invalidOwner": "請填寫有效的主人 QQ 數字帳號。",
      "invalidNumber": "請輸入有效數字：",
      "statusUnknown": "未回報",
      "statusOk": "正常",
      "statusError": "異常",
      "statusSkipped": "已略過",
      "statusStopped": "已停止",
      "version": "擴充功能版本",
      "savedLabel": "設定狀態",
      "unsaved": "有尚未儲存的修改",
      "clean": "已讀取本機設定",
      "failed": "操作失敗，請重試。",
      "noGateway": "尚未產生接入檔案。",
      "optionalCredentials": "進階模式：需要相容的 QQ World 提供可信私訊事件與回覆功能，憑證由該擴充功能管理。",
      "nativePrivateChannel": "此 World 內建任務私訊通道，透過底層 QQ 服務接收主人指令，並在開啟回報後回覆任務結果。",
      "enableWorld": "啟用此 World",
      "stateDirectory": "本機任務託管狀態目錄",
      "credentialReference": "憑證參照",
      "environmentTitle": "環境提示詞",
      "environmentDescription": "工具範圍、任務通知策略與原生核准邊界。",
      "modeLabel": "回報模式",
      "sourceDisabled": "此來源已停用。",
      "sourceReady": "來源目錄存在；未讀取任何對話內容。",
      "sourceUnavailable": "來源目錄無法使用或已被排除。",
      "gatewayCheckOk": "已通過本機迴路閘道的身分驗證及允許專案範圍檢查。",
      "gatewayCheckFailed": "閘道檢查失敗。請確認外部 DSH 外掛與憑證。",
      "gatewayMissingCredential": "尚未儲存閘道憑證；唯讀來源仍可運作。",
      "qqRequired": "請填寫 QQ 服務位址與機器人帳號。",
      "nativeCheckOk": "已驗證 SnowLuma 身分與增量訂閱輔助元件；檢查未更動訂閱。",
      "nativeCheckFailed": "SnowLuma 身分或輔助元件驗證失敗。請檢查位址、帳號及憑證，並使用附帶的增量訂閱輔助元件。",
      "onebotCheckNote": "連線後會依機器人及主人帳號驗證 OneBot 訊框。本次檢查不會傳送 QQ 訊息。",
      "savedScopePending": "權限變更已儲存，原元件已立即停止。請重新啟動此 World，讓新的範圍以關閉回報狀態啟用。",
      "savedConfigurationPending": "設定已儲存；執行中的元件會維持原設定，直到此 World 重新啟動。",
      "additiveSubscriptions": "此 World 僅新增主人的訂閱，不會取代 SnowLuma 用於其他對話的訂閱。",
      "offLimits": "關閉時會忽略主人的一般訊息；原始 #@ 仍可切換回報。關閉不會清除已送達內容或取消已提交的原生任務。",
      "scopeChanged": "更換主人、來源權限、根目錄或排除項目，會建立新的關閉回報範圍與佇列。原狀態目錄會保留；已提交的原生任務會獨立繼續執行。",
      "armInstruction": "檢查連線、儲存並套用後，等待一秒，再傳送新的私訊 #@ 開啟回報；再次傳送即可關閉。",
      "runKit": "在同一台電腦下載並執行此啟動器一次。安裝完成前，請保留私密套件的位置。",
      "kitSelectProfile": "選擇 DSH_HOME 與既有設定檔（例如 desktop）。安裝程式會顯示確切的 YAML 目標，並要求你輸入 INSTALL。",
      "kitBackup": "安裝程式會保留其他外掛及憑證、備份既有檔案、使用原生寫入鎖，並儲存憑證而不顯示內容。更新既有閘道需要明確確認。",
      "kitRestart": "重新啟動所選 DSH 宿主，再於此檢查經驗證的連線。安裝程式不會啟動或驗證執行中的閘道。",
      "codexOnlyControl": "Codex 唯讀監看不需要 DSH 閘道；原生 Codex 控制另需明確設定支援的 Codex 傳輸方式。",
      "kitSecurity": "本機安裝程式已備妥，但尚未安裝。私密套件含有憑證，請勿分享整個套件。DSH 必須載入原生外掛；此 World 需要該獨立宿主。",
      "formRequired": "請先提供設定表單。",
      "actionUnsupported": "不支援此設定操作。",
      "installerNeedsScope": "產生安裝程式前，請選擇主人及至少一個明確的專案來源。",
      "gatewayCredentialInvalid": "閘道憑證至少需要 32 個字元，且不可包含空白。",
      "credentialInvalid": "請檢查憑證格式；不可包含空白或超過 8192 個字元。",
      "qqAccountInvalid": "請填寫有效的機器人 QQ 數字帳號。",
      "invalidConfiguration": "請檢查設定欄位",
      "unsupportedOption": "不支援此選項",
      "invalidDirectory": "請選擇允許範圍內最多 100 個有效的絕對目錄路徑。",
      "invalidEndpoint": "請為所選服務填寫明確的 IPv4 本機迴路位址及連接埠。",
      "rootsRequired": "請為每個啟用的來源選擇至少一個允許的工作區。",
      "componentIssue": "此元件需要處理。請檢查來源、連線與憑證。",
      "diagnosticCode": "診斷代碼",
      "unknownDiagnostic": "服務回傳無法識別的診斷資訊。請檢查連線與元件狀態。",
      "itemLabel": "項目",
      "readOnlyLabel": "唯讀",
      "unknownOption": "其他設定",
      "modeWorkspace": "工作區",
      "modeMemory": "外部記憶",
      "policyImportant": "完成與需處理的問題",
      "policyRecord": "僅於本機記錄",
      "publicFinal": "最終結果",
      "publicCommentary": "中間進度",
      "onOffLabel": "回報狀態"
    },
    "labels": {
      "pollIntervalMs": "閘道輪詢間隔（毫秒）",
      "desktopProgressEnabled": "收錄桌面 DSH 任務邊界",
      "requestTimeoutMs": "閘道請求逾時（毫秒）",
      "eventTtlMs": "真人訊息有效期（毫秒）",
      "selectionTtlMs": "目標選擇有效期（毫秒）",
      "includeSubagents": "包含子代理任務",
      "workspaceFileRoots": "專案檔案目錄",
      "workspaceMaxFileBytes": "文字檔案大小上限（位元組）",
      "watchIntervalSeconds": "輪詢間隔（秒）",
      "watchMaxItems": "每次輪詢項目上限",
      "maxReadBytes": "每頁讀取預算（位元組）",
      "maxScanBytes": "每次掃描預算（位元組）",
      "notificationPolicy": "任務通知策略",
      "notifyPhases": "收錄的公開訊息階段",
      "notifyUserMessages": "收錄公開使用者訊息",
      "notifyLifecycle": "收錄原生生命週期事實",
      "eventContentChars": "事件正文上限（字元）",
      "sourceMode": "DSH 來源模式",
      "healthCheckIntervalSeconds": "來源健康檢查間隔（秒）",
      "writeMaxPerTick": "每批寫入上限",
      "queueMaxPending": "待寫入項目上限",
      "rawSyncIntervalSeconds": "原始對話同步間隔（秒）",
      "rawMaxSourceBytes": "原始對話大小上限（位元組）",
      "dbFile": "DSH 記憶資料庫",
      "allowedProjects": "允許的專案名稱",
      "includeGlobal": "包含全域記憶層",
      "levels": "可讀取的記憶層",
      "watchMaxPerTick": "每次輪詢記憶項目上限",
      "watchContentChars": "記憶預覽上限（字元）",
      "writeEnabled": "允許寫入外部記憶",
      "writeFlushSeconds": "寫入佇列間隔（秒）",
      "writeLevels": "可寫入的記憶層",
      "writeSourceLabel": "外部寫入來源標籤",
      "rawEnabled": "啟用原始對話鏡像",
      "rawDir": "本機對話鏡像目錄",
      "rawBuckets": "允許的鏡像分區",
      "rawMaxTurns": "每個鏡像對話的輪次上限"
    },
    "hints": {
      "sourceMode": "工作區模式限定於選定的專案範圍；記憶模式讀取指定的 DSH 外部記憶資料庫。",
      "workspaceFileRoots": "每行一個專案目錄，必須位於允許的 Codex 工作區內；不可選擇整個磁碟或使用者家目錄。",
      "notificationPolicy": "僅在原生任務完成或需真人處理問題時提供通知；一般步驟保留在本機。",
      "allowedProjects": "以半形逗號分隔精確的專案名稱；名稱屬於外部記憶來源。",
      "levels": "以半形逗號分隔可讀取的記憶層名稱。",
      "writeLevels": "以半形逗號分隔可寫入的記憶層名稱；不可寫入全域 soul 與 user 層。",
      "includeGlobal": "允許在記憶模式讀取全域記憶層；預設關閉。",
      "writeEnabled": "在記憶模式將標示來源的外部記憶加入寫入佇列；加入佇列不代表已確認持久寫入。",
      "rawEnabled": "將清理敏感資訊後的原始對話匯入本機鏡像；來源目錄與工作區排除規則仍然適用。",
      "rawBuckets": "以半形逗號分隔分區名稱；留空則使用設定的來源範圍。",
      "watchIntervalSeconds": "設為零可關閉背景輪詢；開啟任務託管時仍可按需讀取。",
      "desktopProgressEnabled": "只讀取已授權工作區的新桌面 DSH 原生事件，不推測 QQ 收件人。",
      "workspaceMaxFileBytes": "預設 1 MiB。超過限制的檔案會被拒絕，不會截斷後當作全文提供。",
      "maxReadBytes": "第一筆完整紀錄可超出此頁預算；超出量與上下文前綴掃描會分別追蹤。",
      "maxScanBytes": "第一筆完整紀錄可超出掃描預算，之後結束本次輪詢；歷史上下文重播會分別追蹤。",
      "notifyPhases": "以半形逗號分隔階段識別碼：commentary、final_answer、message。中間文字在重要任務邊界出現前保留於本機。",
      "healthCheckIntervalSeconds": "即使沒有新資料，也會定期檢查來源健康狀態；健康心跳不代表任務有進度。",
      "rawSyncIntervalSeconds": "在獨立 Worker 中同步。零代表手動同步；沒有新對話時，狀態仍會記錄最後檢查時間。",
      "rawMaxSourceBytes": "限制每次同步讀取的來源位元組；未完成的游標會在下次繼續。",
      "dbFile": "選定的 DSH 外部記憶 SQLite 資料庫絕對路徑；修改後請重新啟動此 World。",
      "watchMaxPerTick": "超過上限的項目留待下一次輪詢。",
      "watchContentChars": "限制每筆記憶的預覽長度；開啟任務存取時，讀取工具仍可取得完整來源正文。",
      "writeFlushSeconds": "依此間隔寫出佇列；零代表呼叫操作時立即寫入。",
      "writeSourceLabel": "寫入 source_session，供 DSH 識別外部來源。",
      "rawDir": "清理敏感資訊後的對話鏡像本機目錄。既有項目只會追加；排除及受保護的路徑仍無法存取。",
      "rawMaxTurns": "限制每次同步匯入的對話輪次；其餘輪次會在下次繼續。"
    }
  },
  "ja": {
    "copy": {
      "nativeRequirement": "SnowLuma のネイティブ接続には、このパッケージに付属するネイティブ追加モジュールが必要です。SnowLuma 本体をインストールするだけでは、この API は利用できません。",
      "duplicateOwner": "同じオーナーの個人チャットを別の QQ World でも監視すると、経路が重複します。同時に監視しないでください。",
      "title": "タスク管理",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "DSH と Codex を Coo に接続し、パソコンを離れた後は QQ から操作します。",
      "steps": [
        "サービス接続",
        "対象範囲",
        "機能設定",
        "確認と適用"
      ],
      "stepNotes": [
        "オーナーと接続先",
        "作業領域と会話",
        "すべての任意機能",
        "検証・保存・接続"
      ],
      "loading": "設定を読み込み中…",
      "retry": "再読み込み",
      "off": "ローカル待機",
      "on": "報告中",
      "offNote": "重要なタスク通知は、QQ で報告を有効にするまでローカルに保持されます。",
      "onNote": "完了、失敗、対応が必要な問題のみを報告します。",
      "queue": "保留中の通知",
      "owner": "オーナーの QQ 番号",
      "ownerHint": "このアカウントからの個人メッセージだけが #@ で報告を切り替えられます。グループや他のアカウントでは切り替わりません。",
      "toggleHint": "QQ の個人チャットで、文頭に #@ を付けるか #@ だけを送信すると、報告が有効になり保留通知も送られます。もう一度送信すると無効になります。 この切り替えでは作業は送信されません。ネイティブ操作ごとに、別の新しい明示的な確認が必要です。",
      "transport": "QQ 接続方式",
      "native": "SnowLuma ネイティブ接続",
      "trusted": "既存の QQ World（信頼済み個人イベント）",
      "onebot": "OneBot v11（既存環境との互換接続）",
      "qqEndpoint": "QQ サービスのアドレス",
      "qqAccount": "ボットの QQ 番号",
      "qqAccountHint": "SnowLuma にログインしているボットのアカウントです。オーナーの番号とは異なります。",
      "qqToken": "QQ 接続用の認証情報",
      "tokenHint": "空欄なら保存済みの認証情報を維持します。保存後に内容を返すことはありません。",
      "configured": "保存済み",
      "unconfigured": "未保存",
      "gateway": "DSH 制御ゲートウェイのアドレス",
      "gatewayHint": "DSH ホストが提供する制御ゲートウェイを指定します。この World はホスト側プラグインと連携します。",
      "gatewayToken": "DSH ゲートウェイの認証情報",
      "connectionsNote": "認証情報はこの端末に保存されます。接続確認は読み取りのみで、QQ メッセージの送信やタスクの実行は行いません。",
      "dshEnabled": "DSH に接続",
      "codexEnabled": "Codex に接続",
      "roots": "アクセスを許可する作業領域",
      "rootsHint": "1 行に 1 ディレクトリを指定します。列挙した範囲だけが Coo に公開されます。",
      "dshSessions": "DSH の会話ディレクトリ",
      "codexSessions": "Codex の会話ディレクトリ",
      "sessionsHint": "タスクの検出と履歴の読み取りに使います。標準のローカル保存先を使う場合は既定値を維持してください。",
      "excluded": "常に除外するディレクトリ",
      "excludedHint": "1 行に 1 ディレクトリを指定します。会話、検索、ファイルへのアクセスに同じ制限を適用します。",
      "files": "作業領域のファイル読み取りを許可",
      "filesHint": "既定では無効です。有効時も許可範囲、除外設定、報告モードによって制限されます。",
      "fileRoots": "Codex のプロジェクトファイル用ディレクトリ",
      "fileRootsHint": "Codex のファイル読み取りには必須です。上で許可した Codex 作業領域内のプロジェクトを 1 行ずつ指定してください。ドライブ全体やホームディレクトリは指定できません。",
      "fileRootsRequired": "先に「対象範囲」で Codex のプロジェクトファイル用ディレクトリを選択してください。",
      "choose": "ディレクトリを選択",
      "addPath": "ディレクトリを追加",
      "optionsNote": "会話操作、Codex、DSH の記憶に関する設定です。通常の導入では最初の 2 手順を設定すれば十分です。",
      "command": "QQ 個人チャット",
      "conversation": "会話と承認",
      "codex": "Codex の読み取り",
      "memory": "DSH の記憶",
      "noOptions": "このコンポーネントに追加設定はありません。",
      "optional": "任意",
      "addItem": "項目を追加",
      "remove": "削除",
      "statusSetup": "設定が必要",
      "statusStarting": "起動中",
      "statusOffline": "オフライン",
      "checkTitle": "接続を確認してから保存",
      "checkNote": "現在のフォームを使って確認します。変更後は再確認してください。保存するとこの World に設定が書き込まれます。",
      "check": "接続を確認",
      "checkRunning": "確認中…",
      "checksNone": "現在の設定はまだ確認されていません。",
      "checksPassed": "現在の設定の確認が完了しました。",
      "checksFailed": "対応が必要な接続があります。下の結果を確認してください。",
      "checkStale": "設定が変更されました。再確認してください。",
      "save": "保存して適用",
      "saving": "保存中…",
      "restart": "保存後にこの World を再起動",
      "restartHint": "この拡張だけを再読み込みし、新しい接続と範囲を適用します。",
      "saved": "設定を保存しました。",
      "savedRestart": "設定を保存し、この World の再起動を要求しました。",
      "warnings": "確認事項",
      "components": "コンポーネントの状態",
      "gatewayTitle": "DSH ホストも接続",
      "gatewayNote": "インストーラーを生成し、この端末にダウンロードして実行します。DSH_HOME とプロファイルを選択し、変更の適用前に確認します。",
      "generate": "DSH インストーラーを生成",
      "generating": "生成中…",
      "download": "インストーラーをダウンロード",
      "downloadLegacy": "接続手順をダウンロード",
      "gatewayPrepared": "インストーラーを準備しました。DSH にはまだインストールされていません。",
      "gatewayLegacyPrepared": "接続手順を生成しました。DSH にはまだインストールされていません。",
      "gatewaySteps": "DSH 側で行う手順",
      "generatedNote": "ランチャーに認証情報は含まれません。この端末の非公開キットを使うため、ローカルで実行してください。",
      "kitDirectory": "ローカルのインストールキット",
      "runCommand": "ローカルのコマンドラインからも実行可能",
      "privateKit": "認証情報はダウンロードするランチャーではなく、ローカルの非公開キットに保存されます。その後も DSH の起動と接続確認が必要です。",
      "legacyKit": "これは旧形式の接続手順です。インストーラーに対応する版で再生成してください。JSON を手動編集する必要はありません。",
      "back": "戻る",
      "next": "次へ",
      "fieldError": "フォームを確認してください：",
      "invalidOwner": "オーナーの有効な数字の QQ アカウントを入力してください。",
      "invalidNumber": "有効な数値を入力してください：",
      "statusUnknown": "未報告",
      "statusOk": "正常",
      "statusError": "エラー",
      "statusSkipped": "スキップ済み",
      "statusStopped": "停止中",
      "version": "拡張のバージョン",
      "savedLabel": "設定の状態",
      "unsaved": "未保存の変更があります",
      "clean": "ローカル設定を読み込みました",
      "failed": "操作に失敗しました。再試行してください。",
      "noGateway": "接続用ファイルはまだ生成されていません。",
      "optionalCredentials": "上級設定：信頼済みの個人イベントと返信を提供する、互換性のある QQ World が必要です。認証情報はその拡張が管理します。",
      "nativePrivateChannel": "この World にはタスク用の個人チャット経路が含まれます。基盤の QQ サービス経由でオーナーの指示を受け取り、報告が有効な間に結果を返信します。",
      "enableWorld": "この World を有効化",
      "stateDirectory": "ローカルのタスク管理状態ディレクトリ",
      "credentialReference": "認証情報の参照名",
      "environmentTitle": "環境プロンプト",
      "environmentDescription": "ツールの対象範囲、タスク通知の方針、ネイティブ承認の境界。",
      "modeLabel": "報告モード",
      "sourceDisabled": "このデータソースは無効です。",
      "sourceReady": "ソースディレクトリは存在します。会話の内容は読み取っていません。",
      "sourceUnavailable": "ソースディレクトリが利用できないか、除外されています。",
      "gatewayCheckOk": "認証済みのループバックゲートウェイと、許可されたプロジェクト範囲の確認に成功しました。",
      "gatewayCheckFailed": "ゲートウェイの確認に失敗しました。外部 DSH プラグインと認証情報を確認してください。",
      "gatewayMissingCredential": "ゲートウェイの認証情報が未保存です。読み取り専用のソースは引き続き利用できます。",
      "qqRequired": "QQ サービスのアドレスとボットのアカウントを入力してください。",
      "nativeCheckOk": "SnowLuma のアカウントと追加型購読ヘルパーを確認しました。確認処理で購読は変更していません。",
      "nativeCheckFailed": "SnowLuma のアカウントまたはヘルパーの確認に失敗しました。アドレス、アカウント、認証情報を確認し、付属の追加型購読ヘルパーを使用してください。",
      "onebotCheckNote": "接続後、OneBot のフレームをボットとオーナーのアカウントに照合します。この確認では QQ メッセージを送信しません。",
      "savedScopePending": "権限の変更を保存し、以前のコンポーネントを直ちに停止しました。新しい範囲を報告無効の状態で有効にするには、この World を再起動してください。",
      "savedConfigurationPending": "設定を保存しました。実行中のコンポーネントは、この World の再起動まで以前の設定を使います。",
      "additiveSubscriptions": "この World はオーナーの購読を追加し、SnowLuma が他の会話で使う購読は置き換えません。",
      "offLimits": "無効時はオーナーの通常メッセージを無視しますが、元の #@ コマンドで報告を切り替えられます。無効化しても配信済みの内容は消えず、送信済みのネイティブタスクも取り消されません。",
      "scopeChanged": "オーナー、ソース権限、ルート、除外項目を変更すると、報告が無効な新しい範囲とキューを作成します。以前の状態ディレクトリは保持され、送信済みのネイティブタスクは独立して続行します。",
      "armInstruction": "接続を確認し、保存して適用します。1 秒待ってから新しい個人メッセージ #@ を送信すると報告が有効になり、再送信すると無効になります。",
      "runKit": "このランチャーを同じ端末にダウンロードして一度実行してください。インストールが終わるまで非公開キットを移動しないでください。",
      "kitSelectProfile": "DSH_HOME と desktop などの既存プロファイルを選択します。インストーラーは対象の YAML を表示し、INSTALL の入力を求めます。",
      "kitBackup": "他のプラグインと認証情報を維持し、既存ファイルをバックアップし、ネイティブの書き込みロックを使用して認証情報を非表示で保存します。既存ゲートウェイの更新には明示的な確認が必要です。",
      "kitRestart": "選択した DSH ホストを再起動し、ここで認証付き接続を確認してください。インストーラーはゲートウェイを起動せず、稼働状態も確認しません。",
      "codexOnlyControl": "Codex の読み取り専用監視に DSH ゲートウェイは不要です。ネイティブの Codex 制御には、対応する Codex 接続方式の明示的な設定も必要です。",
      "kitSecurity": "ローカルのインストーラーを準備しましたが、まだインストールされていません。非公開キットには認証情報が含まれるため、共有しないでください。DSH はネイティブプラグインを読み込む必要があり、この World はその独立したホストを必要とします。",
      "formRequired": "先に設定フォームを用意してください。",
      "actionUnsupported": "この設定操作には対応していません。",
      "installerNeedsScope": "インストーラーを生成する前に、オーナーと少なくとも 1 つの明示的なプロジェクトソースを選択してください。",
      "gatewayCredentialInvalid": "ゲートウェイの認証情報は、空白を含まない 32 文字以上である必要があります。",
      "credentialInvalid": "認証情報の形式を確認してください。空白や 8192 文字を超える値は使用できません。",
      "qqAccountInvalid": "ボットの有効な数字の QQ アカウントを入力してください。",
      "invalidConfiguration": "設定フィールドを確認してください",
      "unsupportedOption": "このオプションには対応していません",
      "invalidDirectory": "許可された範囲内の有効な絶対ディレクトリパスを 100 件まで選択してください。",
      "invalidEndpoint": "対象サービスの IPv4 ループバックアドレスとポートを明示してください。",
      "rootsRequired": "有効にしたソースごとに、少なくとも 1 つの許可作業領域を選択してください。",
      "componentIssue": "このコンポーネントに対応が必要です。ソース、接続、認証情報を確認してください。",
      "diagnosticCode": "診断コード",
      "unknownDiagnostic": "サービスから認識できない診断情報が返されました。接続とコンポーネントの状態を確認してください。",
      "itemLabel": "項目",
      "readOnlyLabel": "読み取り専用",
      "unknownOption": "追加設定",
      "modeWorkspace": "作業領域",
      "modeMemory": "外部記憶",
      "policyImportant": "完了と対応が必要な問題",
      "policyRecord": "ローカルに記録",
      "publicFinal": "最終結果",
      "publicCommentary": "途中経過",
      "onOffLabel": "報告の状態"
    },
    "labels": {
      "pollIntervalMs": "ゲートウェイの確認間隔（ミリ秒）",
      "desktopProgressEnabled": "デスクトップ DSH のタスク境界を収集",
      "requestTimeoutMs": "ゲートウェイ要求のタイムアウト（ミリ秒）",
      "eventTtlMs": "本人のメッセージの有効期間（ミリ秒）",
      "selectionTtlMs": "対象選択の有効期間（ミリ秒）",
      "includeSubagents": "サブエージェントのタスクを含める",
      "workspaceFileRoots": "プロジェクトファイルのディレクトリ",
      "workspaceMaxFileBytes": "テキストファイルの最大サイズ（バイト）",
      "watchIntervalSeconds": "確認間隔（秒）",
      "watchMaxItems": "確認 1 回の最大項目数",
      "maxReadBytes": "ページの読み取り予算（バイト）",
      "maxScanBytes": "確認 1 回の走査予算（バイト）",
      "notificationPolicy": "タスク通知の方針",
      "notifyPhases": "収集する公開メッセージの段階",
      "notifyUserMessages": "公開されたユーザーメッセージを含める",
      "notifyLifecycle": "ネイティブのライフサイクル情報を含める",
      "eventContentChars": "イベント本文の上限（文字）",
      "sourceMode": "DSH のソースモード",
      "healthCheckIntervalSeconds": "ソースの稼働確認間隔（秒）",
      "writeMaxPerTick": "バッチごとの書き込み上限",
      "queueMaxPending": "保留書き込みの最大数",
      "rawSyncIntervalSeconds": "元の会話の同期間隔（秒）",
      "rawMaxSourceBytes": "元の会話の最大サイズ（バイト）",
      "dbFile": "DSH 記憶データベース",
      "allowedProjects": "許可するプロジェクト名",
      "includeGlobal": "グローバルな記憶層を含める",
      "levels": "読み取り可能な記憶層",
      "watchMaxPerTick": "確認 1 回の記憶項目数",
      "watchContentChars": "記憶プレビューの上限（文字）",
      "writeEnabled": "外部記憶への書き込みを許可",
      "writeFlushSeconds": "書き込みキューの処理間隔（秒）",
      "writeLevels": "書き込み可能な記憶層",
      "writeSourceLabel": "外部書き込みのソースラベル",
      "rawEnabled": "元の会話のミラーを有効化",
      "rawDir": "ローカル会話ミラーのディレクトリ",
      "rawBuckets": "許可するミラー区分",
      "rawMaxTurns": "ミラー会話ごとの最大ターン数"
    },
    "hints": {
      "sourceMode": "作業領域モードは選択したプロジェクト範囲だけを扱います。記憶モードは指定された DSH 外部記憶データベースを読み取ります。",
      "workspaceFileRoots": "許可された Codex 作業領域内のプロジェクトディレクトリを 1 行ずつ指定します。ドライブ全体やホームディレクトリは指定できません。",
      "notificationPolicy": "ネイティブタスクの完了または本人の対応が必要な問題だけを配信します。通常の手順はローカルに保持します。",
      "allowedProjects": "外部記憶ソース内の正確なプロジェクト名を半角カンマで区切ります。",
      "levels": "読み取り可能な記憶層の名前を半角カンマで区切ります。",
      "writeLevels": "書き込み可能な記憶層の名前を半角カンマで区切ります。グローバルの soul と user 層には書き込めません。",
      "includeGlobal": "記憶モードでグローバルな記憶層の読み取りを許可します。既定では無効です。",
      "writeEnabled": "記憶モードでソースを明示した外部記憶をキューに入れます。キューへの追加は永続書き込みの確認完了を意味しません。",
      "rawEnabled": "機密情報を除去した元の会話をローカルミラーに取り込みます。ソース範囲と作業領域の除外設定は引き続き適用されます。",
      "rawBuckets": "区分名を半角カンマで区切ります。空欄なら設定済みのソース範囲を使用します。",
      "watchIntervalSeconds": "ゼロでバックグラウンドの確認を無効にします。管理が有効な間は必要に応じて読み取れます。",
      "desktopProgressEnabled": "許可された作業領域内の新しいデスクトップ DSH ネイティブイベントだけを読み取ります。QQ の宛先は推測しません。",
      "workspaceMaxFileBytes": "既定値は 1 MiB です。上限を超えるファイルは拒否され、切り詰めた内容を全文として提示しません。",
      "maxReadBytes": "先頭の完全な記録はページ予算を超えられます。超過分と文脈プレフィックスの走査量は別に記録します。",
      "maxScanBytes": "先頭の完全な記録は走査予算を超えられ、その後は今回の確認を終了します。過去の文脈の再生量は別に記録します。",
      "notifyPhases": "commentary、final_answer、message の段階識別子を半角カンマで区切ります。途中の文章は重要なタスク境界までローカルに保持します。",
      "healthCheckIntervalSeconds": "新しいデータがなくてもソースの稼働状態を定期確認します。稼働確認の通知はタスクの進捗を示しません。",
      "rawSyncIntervalSeconds": "独立した Worker で同期します。ゼロなら手動同期です。新しい会話がなくても、最後の確認時刻を状態に記録します。",
      "rawMaxSourceBytes": "同期 1 回に読み取るソースのバイト数を制限します。未完了のカーソルは次回に継続します。",
      "dbFile": "選択した DSH 外部記憶 SQLite データベースの絶対パスです。変更後はこの World を再起動してください。",
      "watchMaxPerTick": "上限を超えた項目は次回の確認に持ち越します。",
      "watchContentChars": "記憶ごとのプレビューを制限します。タスクへのアクセスが有効な間は、読み取りツールでソースの全文を取得できます。",
      "writeFlushSeconds": "指定間隔でキューを書き込みます。ゼロなら操作の呼び出し時に書き込みます。",
      "writeSourceLabel": "DSH が外部ソースを識別できるよう source_session に保存します。",
      "rawDir": "機密情報を除去した会話ミラーのローカルディレクトリです。既存項目には追記し、除外・保護されたパスは引き続き使用できません。",
      "rawMaxTurns": "同期 1 回で取り込む会話のターン数を制限します。残りは次回に継続します。"
    }
  },
  "ko": {
    "copy": {
      "nativeRequirement": "SnowLuma 네이티브 연결에는 이 패키지에 포함된 네이티브 추가 모듈이 필요합니다. SnowLuma 본체만 설치해서는 이 API를 사용할 수 없습니다.",
      "duplicateOwner": "다른 QQ World가 같은 소유자의 개인 채팅을 동시에 수신하지 않도록 하세요. 두 통로가 생겨 중복 처리될 수 있습니다.",
      "title": "작업 관리",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "DSH와 Codex를 Coo에 연결하고, 컴퓨터를 떠난 뒤에는 QQ로 작업을 이어가세요.",
      "steps": [
        "서비스 연결",
        "범위 선택",
        "기능 설정",
        "확인 및 적용"
      ],
      "stepNotes": [
        "소유자와 연결",
        "작업 공간과 대화",
        "모든 선택 기능",
        "검증·저장·연결"
      ],
      "loading": "설정을 읽는 중…",
      "retry": "다시 읽기",
      "off": "로컬 대기",
      "on": "보고 중",
      "offNote": "QQ에서 보고를 켜기 전까지 중요한 작업 알림은 로컬에 보관됩니다.",
      "onNote": "완료, 실패, 사용자의 처리가 필요한 문제만 보고합니다.",
      "queue": "대기 중인 알림",
      "owner": "소유자 QQ 번호",
      "ownerHint": "이 계정의 개인 메시지만 #@로 보고를 전환할 수 있습니다. 그룹과 다른 계정은 전환할 수 없습니다.",
      "toggleHint": "QQ 개인 채팅에서 메시지 맨 앞에 #@를 붙이거나 #@만 보내면 보고가 켜지고 밀린 알림도 전달됩니다. 다시 보내면 보고가 꺼집니다. 보고 전환은 작업을 제출하지 않습니다. 네이티브 작업마다 별도의 새로운 명시적 확인이 필요합니다.",
      "transport": "QQ 연결 방식",
      "native": "SnowLuma 네이티브 연결",
      "trusted": "기존 QQ World(신뢰할 수 있는 개인 메시지 이벤트)",
      "onebot": "OneBot v11(기존 환경 호환)",
      "qqEndpoint": "QQ 서비스 주소",
      "qqAccount": "봇 QQ 번호",
      "qqAccountHint": "SnowLuma에 로그인한 봇 계정입니다. 소유자 계정과는 다릅니다.",
      "qqToken": "QQ 연결 자격 증명",
      "tokenHint": "비워 두면 기존 자격 증명을 유지합니다. 저장된 값은 다시 반환하지 않습니다.",
      "configured": "저장됨",
      "unconfigured": "저장되지 않음",
      "gateway": "DSH 제어 게이트웨이 주소",
      "gatewayHint": "DSH 호스트가 제공하는 제어 게이트웨이를 사용하세요. 이 World는 호스트 플러그인과 함께 동작합니다.",
      "gatewayToken": "DSH 게이트웨이 자격 증명",
      "connectionsNote": "자격 증명은 이 컴퓨터에 보관됩니다. 연결 확인은 읽기만 수행하며 QQ 메시지를 보내거나 작업을 실행하지 않습니다.",
      "dshEnabled": "DSH 연결",
      "codexEnabled": "Codex 연결",
      "roots": "접근을 허용할 작업 공간",
      "rootsHint": "한 줄에 디렉터리 하나를 입력하세요. 명시한 범위만 Coo에 제공됩니다.",
      "dshSessions": "DSH 대화 디렉터리",
      "codexSessions": "Codex 대화 디렉터리",
      "sessionsHint": "작업을 찾고 기록을 읽는 데 사용합니다. 표준 로컬 위치를 사용하려면 기본값을 유지하세요.",
      "excluded": "항상 제외할 디렉터리",
      "excludedHint": "한 줄에 디렉터리 하나를 입력하세요. 대화, 검색, 파일 접근에 이 경계가 적용됩니다.",
      "files": "작업 공간 파일 읽기 허용",
      "filesHint": "기본적으로 꺼져 있습니다. 켠 뒤에도 허용 범위, 제외 목록, 보고 모드가 적용됩니다.",
      "fileRoots": "Codex 프로젝트 파일 디렉터리",
      "fileRootsHint": "Codex 파일 읽기에 필요합니다. 위에서 허용한 Codex 작업 공간 안의 프로젝트 디렉터리를 한 줄씩 입력하세요. 드라이브 전체나 홈 디렉터리는 사용할 수 없습니다.",
      "fileRootsRequired": "먼저 ‘범위 선택’에서 Codex 프로젝트 파일 디렉터리를 지정하세요.",
      "choose": "디렉터리 선택",
      "addPath": "디렉터리 추가",
      "optionsNote": "대화 제어, Codex, DSH 메모리 기능을 설정합니다. 일반적인 설치에서는 처음 두 단계만 설정하면 됩니다.",
      "command": "QQ 개인 채팅",
      "conversation": "대화 및 승인",
      "codex": "Codex 읽기",
      "memory": "DSH 메모리",
      "noOptions": "이 구성 요소에는 추가 설정이 없습니다.",
      "optional": "선택 사항",
      "addItem": "항목 추가",
      "remove": "제거",
      "statusSetup": "설정 필요",
      "statusStarting": "시작 중",
      "statusOffline": "오프라인",
      "checkTitle": "연결을 확인한 뒤 저장",
      "checkNote": "현재 양식으로 확인합니다. 수정 후에는 다시 확인하세요. 저장하면 이 World에 설정이 기록됩니다.",
      "check": "연결 확인",
      "checkRunning": "확인 중…",
      "checksNone": "현재 설정을 아직 확인하지 않았습니다.",
      "checksPassed": "현재 설정의 확인이 완료되었습니다.",
      "checksFailed": "확인이 필요한 연결이 있습니다. 아래 결과를 확인하세요.",
      "checkStale": "설정이 변경되었습니다. 다시 확인하세요.",
      "save": "저장 및 적용",
      "saving": "저장 중…",
      "restart": "저장 후 이 World 다시 시작",
      "restartHint": "이 확장만 다시 불러와 새 연결과 범위를 적용합니다.",
      "saved": "설정을 저장했습니다.",
      "savedRestart": "설정을 저장하고 이 World의 다시 시작을 요청했습니다.",
      "warnings": "확인할 사항",
      "components": "구성 요소 상태",
      "gatewayTitle": "DSH 호스트도 연결",
      "gatewayNote": "설치 프로그램을 생성해 이 컴퓨터에서 다운로드하고 실행하세요. DSH_HOME과 프로필을 선택한 뒤 변경 적용 전에 확인합니다.",
      "generate": "DSH 설치 프로그램 생성",
      "generating": "생성 중…",
      "download": "설치 프로그램 다운로드",
      "downloadLegacy": "연결 안내 다운로드",
      "gatewayPrepared": "설치 프로그램이 준비되었습니다. 아직 DSH에 설치되지 않았습니다.",
      "gatewayLegacyPrepared": "연결 안내가 준비되었습니다. 아직 DSH에 설치되지 않았습니다.",
      "gatewaySteps": "DSH에서 완료할 단계",
      "generatedNote": "실행 파일에는 자격 증명이 없습니다. 이 컴퓨터의 비공개 설치 키트가 필요하므로 로컬에서 실행하세요.",
      "kitDirectory": "로컬 설치 키트",
      "runCommand": "로컬 명령줄에서도 실행 가능",
      "privateKit": "자격 증명은 다운로드하는 실행 파일이 아니라 로컬 비공개 키트에 보관됩니다. 이후 DSH 시작과 연결 확인을 완료해야 합니다.",
      "legacyKit": "이 파일은 이전 형식의 연결 안내입니다. 설치 프로그램을 제공하는 버전에서 다시 생성하세요. JSON을 직접 수정할 필요는 없습니다.",
      "back": "이전",
      "next": "다음",
      "fieldError": "양식을 확인하세요: ",
      "invalidOwner": "유효한 숫자 형식의 소유자 QQ 계정을 입력하세요.",
      "invalidNumber": "유효한 숫자를 입력하세요: ",
      "statusUnknown": "보고되지 않음",
      "statusOk": "정상",
      "statusError": "오류",
      "statusSkipped": "건너뜀",
      "statusStopped": "중지됨",
      "version": "확장 버전",
      "savedLabel": "설정 상태",
      "unsaved": "저장하지 않은 변경 사항이 있음",
      "clean": "로컬 설정을 읽었습니다",
      "failed": "작업에 실패했습니다. 다시 시도하세요.",
      "noGateway": "연결 파일을 아직 생성하지 않았습니다.",
      "optionalCredentials": "고급 모드: 신뢰할 수 있는 개인 메시지 이벤트와 답장을 제공하는 호환 QQ World가 필요합니다. 자격 증명은 해당 확장이 관리합니다.",
      "nativePrivateChannel": "이 World에는 작업용 개인 채팅 통로가 포함됩니다. 기반 QQ 서비스를 통해 소유자의 지시를 받고, 보고가 켜져 있는 동안 결과를 답장합니다.",
      "enableWorld": "이 World 사용",
      "stateDirectory": "로컬 작업 관리 상태 디렉터리",
      "credentialReference": "자격 증명 참조",
      "environmentTitle": "환경 프롬프트",
      "environmentDescription": "도구 범위, 작업 알림 정책, 네이티브 승인 경계입니다.",
      "modeLabel": "보고 모드",
      "sourceDisabled": "이 소스는 사용하지 않습니다.",
      "sourceReady": "소스 디렉터리가 있습니다. 대화 내용은 읽지 않았습니다.",
      "sourceUnavailable": "소스 디렉터리를 사용할 수 없거나 제외되어 있습니다.",
      "gatewayCheckOk": "인증된 루프백 게이트웨이와 허용된 프로젝트 범위의 확인에 성공했습니다.",
      "gatewayCheckFailed": "게이트웨이 확인에 실패했습니다. 외부 DSH 플러그인과 자격 증명을 확인하세요.",
      "gatewayMissingCredential": "게이트웨이 자격 증명이 저장되지 않았습니다. 읽기 전용 소스는 계속 동작할 수 있습니다.",
      "qqRequired": "QQ 서비스 주소와 봇 계정을 입력하세요.",
      "nativeCheckOk": "SnowLuma 계정과 추가 방식의 구독 도우미를 확인했습니다. 확인 과정에서 구독은 변경하지 않았습니다.",
      "nativeCheckFailed": "SnowLuma 계정 또는 도우미를 확인하지 못했습니다. 주소, 계정, 자격 증명을 점검하고 함께 제공된 추가 구독 도우미를 사용하세요.",
      "onebotCheckNote": "연결 후 OneBot 프레임을 봇 및 소유자 계정과 대조합니다. 이 확인은 QQ 메시지를 보내지 않습니다.",
      "savedScopePending": "권한 변경을 저장하고 이전 구성 요소를 즉시 중지했습니다. 이 World를 다시 시작하면 새 범위가 보고 꺼짐 상태로 활성화됩니다.",
      "savedConfigurationPending": "설정을 저장했습니다. 실행 중인 구성 요소는 이 World가 다시 시작될 때까지 이전 설정을 유지합니다.",
      "additiveSubscriptions": "이 World는 소유자 구독을 추가하며, SnowLuma가 다른 대화에 사용하는 구독을 대체하지 않습니다.",
      "offLimits": "보고가 꺼져 있으면 소유자의 일반 메시지는 무시하지만 원본 #@ 명령은 계속 작동합니다. 끄더라도 이미 전달된 내용이 지워지거나 제출된 네이티브 작업이 취소되지는 않습니다.",
      "scopeChanged": "소유자, 소스 권한, 루트 또는 제외 항목을 변경하면 보고가 꺼진 새 범위와 큐가 생성됩니다. 이전 상태 디렉터리는 보존되고, 이미 제출된 네이티브 작업은 독립적으로 계속됩니다.",
      "armInstruction": "연결을 확인하고 저장 및 적용하세요. 1초 뒤 새 개인 메시지 #@를 보내면 보고가 켜지고, 다시 보내면 꺼집니다.",
      "runKit": "같은 컴퓨터에서 이 실행 파일을 다운로드해 한 번 실행하세요. 설치가 끝날 때까지 비공개 키트 위치를 유지하세요.",
      "kitSelectProfile": "DSH_HOME과 desktop 같은 기존 프로필을 선택하세요. 설치 프로그램이 정확한 YAML 대상을 표시하고 INSTALL 입력을 요청합니다.",
      "kitBackup": "다른 플러그인과 자격 증명을 유지하고, 기존 파일을 백업하며, 네이티브 쓰기 잠금을 사용해 자격 증명을 표시하지 않고 저장합니다. 기존 게이트웨이 업데이트에는 명시적 확인이 필요합니다.",
      "kitRestart": "선택한 DSH 호스트를 다시 시작한 후 여기에서 인증된 연결을 확인하세요. 설치 프로그램은 게이트웨이를 시작하거나 실행 여부를 검증하지 않습니다.",
      "codexOnlyControl": "Codex 읽기 전용 모니터링에는 DSH 게이트웨이가 필요하지 않습니다. 네이티브 Codex 제어에는 지원되는 Codex 전송 방식도 명시적으로 설정해야 합니다.",
      "kitSecurity": "로컬 설치 프로그램은 준비되었지만 아직 설치되지 않았습니다. 비공개 키트에는 자격 증명이 있으므로 공유하지 마세요. DSH가 네이티브 플러그인을 불러와야 하며, 이 World에는 별도의 해당 호스트가 필요합니다.",
      "formRequired": "먼저 설정 양식을 제공하세요.",
      "actionUnsupported": "지원하지 않는 설정 작업입니다.",
      "installerNeedsScope": "설치 프로그램을 만들기 전에 소유자와 하나 이상의 명확한 프로젝트 소스를 선택하세요.",
      "gatewayCredentialInvalid": "게이트웨이 자격 증명은 공백 없이 32자 이상이어야 합니다.",
      "credentialInvalid": "자격 증명 형식을 확인하세요. 공백을 포함하거나 8192자를 초과한 값은 허용되지 않습니다.",
      "qqAccountInvalid": "유효한 숫자 형식의 봇 QQ 계정을 입력하세요.",
      "invalidConfiguration": "설정 항목을 확인하세요",
      "unsupportedOption": "지원하지 않는 옵션입니다",
      "invalidDirectory": "허용 범위 안에 있는 유효한 절대 디렉터리 경로를 최대 100개 선택하세요.",
      "invalidEndpoint": "선택한 서비스의 IPv4 루프백 주소와 포트를 명시하세요.",
      "rootsRequired": "사용할 소스마다 하나 이상의 허용 작업 공간을 선택하세요.",
      "componentIssue": "이 구성 요소를 점검해야 합니다. 소스, 연결, 자격 증명을 확인하세요.",
      "diagnosticCode": "진단 코드",
      "unknownDiagnostic": "서비스가 인식할 수 없는 진단을 반환했습니다. 연결 및 구성 요소 상태를 확인하세요.",
      "itemLabel": "항목",
      "readOnlyLabel": "읽기 전용",
      "unknownOption": "추가 설정",
      "modeWorkspace": "작업 공간",
      "modeMemory": "외부 메모리",
      "policyImportant": "완료 및 처리가 필요한 문제",
      "policyRecord": "로컬에 기록",
      "publicFinal": "최종 결과",
      "publicCommentary": "중간 진행 상황",
      "onOffLabel": "보고 상태"
    },
    "labels": {
      "pollIntervalMs": "게이트웨이 확인 간격(밀리초)",
      "desktopProgressEnabled": "데스크톱 DSH 작업 경계 수집",
      "requestTimeoutMs": "게이트웨이 요청 제한 시간(밀리초)",
      "eventTtlMs": "실제 사용자 메시지 유효 기간(밀리초)",
      "selectionTtlMs": "대상 선택 유효 기간(밀리초)",
      "includeSubagents": "하위 에이전트 작업 포함",
      "workspaceFileRoots": "프로젝트 파일 디렉터리",
      "workspaceMaxFileBytes": "텍스트 파일 최대 크기(바이트)",
      "watchIntervalSeconds": "확인 간격(초)",
      "watchMaxItems": "확인당 최대 항목 수",
      "maxReadBytes": "페이지 읽기 예산(바이트)",
      "maxScanBytes": "확인당 스캔 예산(바이트)",
      "notificationPolicy": "작업 알림 정책",
      "notifyPhases": "수집할 공개 메시지 단계",
      "notifyUserMessages": "공개 사용자 메시지 포함",
      "notifyLifecycle": "네이티브 수명 주기 정보 포함",
      "eventContentChars": "이벤트 본문 제한(문자)",
      "sourceMode": "DSH 소스 모드",
      "healthCheckIntervalSeconds": "소스 상태 확인 간격(초)",
      "writeMaxPerTick": "일괄 쓰기 최대 수",
      "queueMaxPending": "최대 대기 쓰기 수",
      "rawSyncIntervalSeconds": "원본 대화 동기화 간격(초)",
      "rawMaxSourceBytes": "원본 대화 최대 크기(바이트)",
      "dbFile": "DSH 메모리 데이터베이스",
      "allowedProjects": "허용할 프로젝트 이름",
      "includeGlobal": "전역 메모리 계층 포함",
      "levels": "읽을 수 있는 메모리 계층",
      "watchMaxPerTick": "확인당 메모리 항목 수",
      "watchContentChars": "메모리 미리 보기 제한(문자)",
      "writeEnabled": "외부 메모리 쓰기 허용",
      "writeFlushSeconds": "쓰기 큐 처리 간격(초)",
      "writeLevels": "쓸 수 있는 메모리 계층",
      "writeSourceLabel": "외부 쓰기 소스 레이블",
      "rawEnabled": "원본 대화 미러 사용",
      "rawDir": "로컬 대화 미러 디렉터리",
      "rawBuckets": "허용할 미러 버킷",
      "rawMaxTurns": "미러 대화당 최대 턴 수"
    },
    "hints": {
      "sourceMode": "작업 공간 모드는 선택한 프로젝트 범위 안에서만 동작합니다. 메모리 모드는 지정한 DSH 외부 메모리 데이터베이스를 읽습니다.",
      "workspaceFileRoots": "허용된 Codex 작업 공간 안의 프로젝트 디렉터리를 한 줄씩 입력하세요. 드라이브 전체와 홈 디렉터리는 거부됩니다.",
      "notificationPolicy": "네이티브 작업 완료 또는 사람의 처리가 필요한 문제만 전달합니다. 일반 단계는 로컬에 보관됩니다.",
      "allowedProjects": "외부 메모리 소스의 정확한 프로젝트 이름을 쉼표로 구분하세요.",
      "levels": "읽을 메모리 계층 이름을 쉼표로 구분하세요.",
      "writeLevels": "쓸 메모리 계층 이름을 쉼표로 구분하세요. 전역 soul 및 user 계층에는 쓸 수 없습니다.",
      "includeGlobal": "메모리 모드에서 전역 메모리 계층 읽기를 허용합니다. 기본값은 꺼짐입니다.",
      "writeEnabled": "메모리 모드에서 소스를 표시한 외부 메모리 항목을 큐에 추가합니다. 큐에 들어갔다고 영구 저장이 검증된 것은 아닙니다.",
      "rawEnabled": "민감 정보를 제거한 원본 대화를 로컬 미러로 가져옵니다. 소스 디렉터리와 작업 공간 제외 규칙은 계속 적용됩니다.",
      "rawBuckets": "버킷 이름을 쉼표로 구분하세요. 비워 두면 설정된 소스 범위를 사용합니다.",
      "watchIntervalSeconds": "0으로 설정하면 백그라운드 확인을 끕니다. 작업 관리가 켜진 동안 필요할 때 읽을 수 있습니다.",
      "desktopProgressEnabled": "허용된 작업 공간 안의 새로운 데스크톱 DSH 네이티브 이벤트만 읽습니다. QQ 수신자를 추측하지 않습니다.",
      "workspaceMaxFileBytes": "기본값은 1 MiB입니다. 제한을 넘는 파일은 거부하며, 잘라 낸 내용을 전체 파일처럼 제공하지 않습니다.",
      "maxReadBytes": "첫 번째 완전한 레코드는 페이지 예산을 초과할 수 있습니다. 초과량과 문맥 접두부 스캔은 따로 추적합니다.",
      "maxScanBytes": "첫 번째 완전한 레코드는 스캔 예산을 넘을 수 있으며, 그 뒤에는 이번 확인을 마칩니다. 과거 문맥 재생은 별도로 추적합니다.",
      "notifyPhases": "commentary, final_answer, message 단계 식별자를 쉼표로 구분하세요. 중간 텍스트는 중요한 작업 경계가 생길 때까지 로컬에 보관합니다.",
      "healthCheckIntervalSeconds": "새 데이터가 없어도 소스 상태를 주기적으로 확인합니다. 상태 확인 신호는 작업 진행을 뜻하지 않습니다.",
      "rawSyncIntervalSeconds": "별도 Worker에서 동기화합니다. 0은 수동 동기화입니다. 새 대화가 없어도 마지막 확인 시간을 상태에 기록합니다.",
      "rawMaxSourceBytes": "동기화당 읽을 소스 바이트 수를 제한합니다. 미완료 커서는 다음 실행에서 이어집니다.",
      "dbFile": "선택한 DSH 외부 메모리 SQLite 데이터베이스의 절대 경로입니다. 변경 후 이 World를 다시 시작하세요.",
      "watchMaxPerTick": "제한을 넘는 항목은 다음 확인에서 처리합니다.",
      "watchContentChars": "각 메모리의 미리 보기 길이를 제한합니다. 작업 접근이 켜져 있는 동안 읽기 도구로 원문 전체를 가져올 수 있습니다.",
      "writeFlushSeconds": "이 간격으로 쓰기 큐를 처리합니다. 0이면 작업 호출 시 바로 씁니다.",
      "writeSourceLabel": "DSH가 외부 출처를 구분할 수 있도록 source_session에 저장합니다.",
      "rawDir": "민감 정보를 제거한 대화 미러를 저장할 로컬 디렉터리입니다. 기존 항목에는 추가만 하며 제외·보호된 경로는 계속 사용할 수 없습니다.",
      "rawMaxTurns": "동기화당 가져올 대화 턴 수를 제한합니다. 나머지는 다음 실행에서 이어집니다."
    }
  },
  "fr": {
    "copy": {
      "nativeRequirement": "Les connexions natives SnowLuma nécessitent le module natif fourni dans ce paquet. L’installation de SnowLuma seul ne fournit pas cette API.",
      "duplicateOwner": "Ne laissez pas un autre QQ World écouter aussi les messages privés du même propriétaire : deux écouteurs créeraient deux canaux.",
      "title": "Task Supervisor",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "Connectez DSH et Codex à Coo, puis prenez le relais via QQ lorsque vous vous absentez.",
      "steps": [
        "Connexion",
        "Choisir le périmètre",
        "Fonctionnalités",
        "Vérifier et appliquer"
      ],
      "stepNotes": [
        "Propriétaire et services",
        "Espaces de travail et sessions",
        "Toutes les fonctions facultatives",
        "Valider, enregistrer et connecter"
      ],
      "loading": "Lecture de la configuration…",
      "retry": "Relire",
      "off": "Veille locale",
      "on": "Signalement activé",
      "offNote": "Les avis importants sur les tâches restent locaux jusqu’à l’activation du signalement.",
      "onNote": "Seuls les achèvements, les échecs et les problèmes nécessitant votre attention sont signalés.",
      "queue": "Avis en attente",
      "owner": "Numéro QQ du propriétaire",
      "ownerHint": "Seuls les messages privés de ce compte peuvent activer ou désactiver le signalement avec #@. Les groupes et les autres comptes ne le peuvent pas.",
      "toggleHint": "Dans votre conversation privée QQ, commencez un message par #@ ou envoyez uniquement #@ pour activer le signalement et transmettre la file d’attente. Renvoyez-le pour désactiver le signalement. Ce changement ne soumet aucune tâche. Chaque opération native exige toujours une confirmation explicite distincte et récente.",
      "transport": "Connexion QQ",
      "native": "Connexion native SnowLuma",
      "trusted": "QQ World existant (événements privés de confiance)",
      "onebot": "OneBot v11 (déploiements existants)",
      "qqEndpoint": "Adresse du service QQ",
      "qqAccount": "Numéro QQ du bot",
      "qqAccountHint": "Le compte connecté à SnowLuma, et non celui du propriétaire.",
      "qqToken": "Identifiant secret de connexion QQ",
      "tokenHint": "Laissez vide pour conserver l’identifiant secret enregistré. Les valeurs enregistrées ne sont jamais renvoyées.",
      "configured": "Enregistré",
      "unconfigured": "Non enregistré",
      "gateway": "Adresse de la passerelle de contrôle DSH",
      "gatewayHint": "Utilisez la passerelle de contrôle exposée par l’hôte DSH. Ce World fonctionne avec le plugin de l’hôte.",
      "gatewayToken": "Identifiant secret de la passerelle DSH",
      "connectionsNote": "Les identifiants secrets restent sur cet ordinateur. Les vérifications de connexion sont en lecture seule : elles n’envoient aucun message QQ et n’exécutent aucune tâche.",
      "dshEnabled": "Connecter DSH",
      "codexEnabled": "Connecter Codex",
      "roots": "Espaces de travail autorisés",
      "rootsHint": "Un répertoire par ligne. Coo ne peut accéder qu’au périmètre indiqué.",
      "dshSessions": "Répertoire des sessions DSH",
      "codexSessions": "Répertoire des sessions Codex",
      "sessionsHint": "Sert à découvrir les tâches et à lire l’historique. Gardez la valeur par défaut pour utiliser l’emplacement local standard.",
      "excluded": "Répertoires toujours exclus",
      "excludedHint": "Un répertoire par ligne. Les sessions, les recherches et les accès aux fichiers doivent respecter ces limites.",
      "files": "Autoriser la lecture des fichiers de travail",
      "filesHint": "Désactivé par défaut. Les lectures respectent toujours le périmètre autorisé, les exclusions et le mode de signalement.",
      "fileRoots": "Répertoires des fichiers de projet Codex",
      "fileRootsHint": "Obligatoires pour lire les fichiers Codex. Un répertoire de projet par ligne, dans un espace de travail Codex autorisé ci-dessus. Les lecteurs entiers et les répertoires personnels sont refusés.",
      "fileRootsRequired": "Choisissez d’abord les répertoires des fichiers de projet Codex dans Choisir le périmètre.",
      "choose": "Choisir un répertoire",
      "addPath": "Ajouter un répertoire",
      "optionsNote": "Ces réglages couvrent les opérations sur les conversations, Codex et la mémoire DSH. Les deux premières étapes suffisent à la plupart des installations.",
      "command": "Conversation privée QQ",
      "conversation": "Conversations et approbations",
      "codex": "Lectures Codex",
      "memory": "Mémoire DSH",
      "noOptions": "Aucun réglage supplémentaire pour ce composant.",
      "optional": "Facultatif",
      "addItem": "Ajouter un élément",
      "remove": "Supprimer",
      "statusSetup": "Configuration requise",
      "statusStarting": "Démarrage",
      "statusOffline": "Hors ligne",
      "checkTitle": "Vérifier les connexions, puis enregistrer",
      "checkNote": "Les vérifications utilisent ce formulaire. Relancez-les après toute modification. L’enregistrement écrit les réglages dans ce World.",
      "check": "Vérifier les connexions",
      "checkRunning": "Vérification…",
      "checksNone": "Cette configuration n’a pas été vérifiée.",
      "checksPassed": "La configuration actuelle a été vérifiée.",
      "checksFailed": "Certaines connexions nécessitent votre attention. Consultez les résultats ci-dessous.",
      "checkStale": "La configuration a changé. Vérifiez à nouveau.",
      "save": "Enregistrer et appliquer",
      "saving": "Enregistrement…",
      "restart": "Redémarrer ce World après l’enregistrement",
      "restartHint": "Recharge uniquement cette extension pour appliquer les nouvelles connexions et le nouveau périmètre.",
      "saved": "Configuration enregistrée.",
      "savedRestart": "Configuration enregistrée ; un redémarrage du World a été demandé.",
      "warnings": "Remarques",
      "components": "État des composants",
      "gatewayTitle": "Connecter aussi l’hôte DSH",
      "gatewayNote": "Générez l’installateur, téléchargez-le et exécutez-le sur cet ordinateur. Il vous demande de choisir DSH_HOME et un profil, puis de confirmer avant d’appliquer les modifications.",
      "generate": "Générer l’installateur DSH",
      "generating": "Génération…",
      "download": "Télécharger l’installateur",
      "downloadLegacy": "Télécharger les instructions de connexion",
      "gatewayPrepared": "Installateur préparé. Il n’a pas été installé dans DSH.",
      "gatewayLegacyPrepared": "Instructions de connexion préparées. Elles n’ont pas été installées dans DSH.",
      "gatewaySteps": "Terminer ces étapes dans DSH",
      "generatedNote": "Le lanceur ne contient aucun identifiant secret et dépend du kit privé présent sur cet ordinateur. Exécutez-le localement.",
      "kitDirectory": "Kit d’installation local",
      "runCommand": "Ou exécuter localement en ligne de commande",
      "privateKit": "L’identifiant secret reste dans le kit local privé, hors du lanceur téléchargé. Terminez ensuite le démarrage de DSH et la vérification de sa connexion.",
      "legacyKit": "Il s’agit d’une ancienne spécification de connexion. Générez-la à nouveau avec une version fournissant l’installateur ; aucune modification manuelle du JSON n’est nécessaire.",
      "back": "Retour",
      "next": "Suivant",
      "fieldError": "Vérifiez le formulaire : ",
      "invalidOwner": "Saisissez un compte QQ numérique valide pour le propriétaire.",
      "invalidNumber": "Saisissez un nombre valide : ",
      "statusUnknown": "Non signalé",
      "statusOk": "Prêt",
      "statusError": "Erreur",
      "statusSkipped": "Ignoré",
      "statusStopped": "Arrêté",
      "version": "Version de l’extension",
      "savedLabel": "Configuration",
      "unsaved": "Modifications non enregistrées",
      "clean": "Configuration locale chargée",
      "failed": "L’opération a échoué. Réessayez.",
      "noGateway": "Aucun fichier de connexion n’a été généré.",
      "optionalCredentials": "Avancé : un QQ World compatible doit fournir des événements privés et des réponses de confiance. Ce plugin gère ses propres identifiants secrets.",
      "nativePrivateChannel": "Ce World comprend le canal privé des tâches : il reçoit les commandes du propriétaire via le service QQ sous-jacent et répond avec les résultats lorsque le signalement est activé.",
      "enableWorld": "Activer ce World",
      "stateDirectory": "Répertoire local de l’état de supervision",
      "credentialReference": "Référence de l’identifiant secret",
      "environmentTitle": "Consigne d’environnement",
      "environmentDescription": "Périmètre des outils, politique de notification des tâches et limites des approbations natives.",
      "modeLabel": "Mode de signalement",
      "sourceDisabled": "Cette source est désactivée.",
      "sourceReady": "Le répertoire source existe. Aucun contenu de conversation n’a été lu.",
      "sourceUnavailable": "Le répertoire source est indisponible ou exclu.",
      "gatewayCheckOk": "La passerelle de bouclage authentifiée et les périmètres de projet autorisés ont passé les vérifications.",
      "gatewayCheckFailed": "La vérification de la passerelle a échoué. Vérifiez le plugin DSH externe et son identifiant secret.",
      "gatewayMissingCredential": "Aucun identifiant secret de passerelle n’est enregistré. Les sources en lecture seule peuvent fonctionner.",
      "qqRequired": "Saisissez l’adresse du service QQ et le compte du bot.",
      "nativeCheckOk": "L’identité SnowLuma et son auxiliaire d’abonnement additif ont été vérifiés. La vérification n’a modifié aucun abonnement.",
      "nativeCheckFailed": "La vérification de l’identité SnowLuma ou de l’auxiliaire a échoué. Vérifiez l’adresse, le compte et l’identifiant secret, et utilisez l’auxiliaire fourni avec les abonnements additifs.",
      "onebotCheckNote": "Après la connexion, les trames OneBot sont vérifiées par rapport au compte du bot et au propriétaire. Cette vérification n’envoie aucun message QQ.",
      "savedScopePending": "Les modifications des autorisations ont été enregistrées et les composants précédents se sont arrêtés immédiatement. Redémarrez ce World pour activer le nouveau périmètre, qui démarre en mode OFF.",
      "savedConfigurationPending": "La configuration est enregistrée. Les composants en cours d’exécution conservent leurs anciens réglages jusqu’au redémarrage de ce World.",
      "additiveSubscriptions": "Ce World ajoute l’abonnement du propriétaire sans remplacer les abonnements SnowLuma utilisés par d’autres conversations.",
      "offLimits": "En mode OFF, les messages ordinaires du propriétaire sont ignorés ; un #@ original permet toujours de basculer le signalement. Le mode OFF n’efface pas le contenu déjà transmis et n’annule pas les tâches natives déjà soumises.",
      "scopeChanged": "Modifier le propriétaire, les autorisations des sources, les racines ou les exclusions crée un nouveau périmètre OFF et une nouvelle file d’attente. Les anciens répertoires d’état sont conservés ; les tâches natives déjà soumises continuent indépendamment.",
      "armInstruction": "Vérifiez les connexions, enregistrez et appliquez. Attendez une seconde, puis envoyez un nouveau #@ privé pour activer le signalement ; renvoyez-le pour le désactiver.",
      "runKit": "Téléchargez et exécutez ce lanceur une fois sur le même ordinateur. Gardez le kit privé en place jusqu’à la fin de l’installation.",
      "kitSelectProfile": "Choisissez DSH_HOME et un profil existant, par exemple desktop. L’installateur affiche les cibles YAML exactes et vous demande de saisir INSTALL.",
      "kitBackup": "L’installateur préserve les autres plugins et identifiants secrets, sauvegarde les fichiers existants, utilise les verrous natifs d’écriture et stocke l’identifiant secret sans l’afficher. La mise à jour d’une passerelle existante nécessite une confirmation explicite.",
      "kitRestart": "Redémarrez l’hôte DSH choisi, puis vérifiez ici les connexions authentifiées. L’installateur ne démarre pas de passerelle et ne vérifie pas une passerelle en cours d’exécution.",
      "codexOnlyControl": "La surveillance Codex en lecture seule ne nécessite pas de passerelle DSH. Le contrôle natif de Codex nécessite aussi un transport Codex pris en charge et explicitement configuré.",
      "kitSecurity": "L’installateur local est préparé, mais pas installé. Son kit privé contient un identifiant secret : ne partagez pas ce kit. DSH doit charger le plugin natif ; ce World nécessite cet hôte distinct.",
      "formRequired": "Fournissez d’abord le formulaire de configuration.",
      "actionUnsupported": "Cette action de configuration n’est pas prise en charge.",
      "installerNeedsScope": "Choisissez le propriétaire et au moins une source de projet explicite avant de générer un installateur.",
      "gatewayCredentialInvalid": "L’identifiant secret de la passerelle doit contenir au moins 32 caractères sans espace blanc.",
      "credentialInvalid": "Vérifiez le format de l’identifiant secret. Les espaces blancs et les valeurs de plus de 8192 caractères sont refusés.",
      "qqAccountInvalid": "Saisissez un compte QQ numérique valide pour le bot.",
      "invalidConfiguration": "Vérifiez le champ de configuration",
      "unsupportedOption": "Cette option n’est pas prise en charge",
      "invalidDirectory": "Choisissez au plus 100 chemins de répertoires absolus valides dans le périmètre autorisé.",
      "invalidEndpoint": "Utilisez une adresse IPv4 de bouclage explicite et un port pour le service choisi.",
      "rootsRequired": "Choisissez au moins un espace de travail autorisé pour chaque source activée.",
      "componentIssue": "Ce composant nécessite votre attention. Vérifiez sa source, sa connexion et son identifiant secret.",
      "diagnosticCode": "Code de diagnostic",
      "unknownDiagnostic": "Le service a renvoyé un diagnostic inconnu. Vérifiez la connexion et l’état du composant.",
      "itemLabel": "Élément",
      "readOnlyLabel": "Lecture seule",
      "unknownOption": "Réglage supplémentaire",
      "modeWorkspace": "Espaces de travail",
      "modeMemory": "Mémoire externe",
      "policyImportant": "Achèvement et problèmes nécessitant une attention",
      "policyRecord": "Enregistrer localement",
      "publicFinal": "Résultat final",
      "publicCommentary": "Progression intermédiaire",
      "onOffLabel": "État du signalement"
    },
    "labels": {
      "pollIntervalMs": "Intervalle d’interrogation de la passerelle (ms)",
      "desktopProgressEnabled": "Recueillir les limites des tâches DSH de bureau",
      "requestTimeoutMs": "Délai d’expiration des requêtes de passerelle (ms)",
      "eventTtlMs": "Durée de validité des messages humains (ms)",
      "selectionTtlMs": "Durée de validité du choix de cible (ms)",
      "includeSubagents": "Inclure les tâches des sous-agents",
      "workspaceFileRoots": "Répertoires des fichiers de projet",
      "workspaceMaxFileBytes": "Taille maximale des fichiers texte (octets)",
      "watchIntervalSeconds": "Intervalle d’interrogation (secondes)",
      "watchMaxItems": "Éléments par interrogation",
      "maxReadBytes": "Budget de lecture de page (octets)",
      "maxScanBytes": "Budget d’analyse par interrogation (octets)",
      "notificationPolicy": "Politique de notification des tâches",
      "notifyPhases": "Phases des messages publics",
      "notifyUserMessages": "Inclure les messages publics de l’utilisateur",
      "notifyLifecycle": "Inclure les faits du cycle de vie natif",
      "eventContentChars": "Limite du texte des événements (caractères)",
      "sourceMode": "Mode de source DSH",
      "healthCheckIntervalSeconds": "Intervalle de vérification de la source (secondes)",
      "writeMaxPerTick": "Écritures par lot",
      "queueMaxPending": "Nombre maximal d’écritures en attente",
      "rawSyncIntervalSeconds": "Intervalle de synchronisation des sessions originales (secondes)",
      "rawMaxSourceBytes": "Taille maximale des sessions originales (octets)",
      "dbFile": "Base de données mémoire DSH",
      "allowedProjects": "Noms de projet autorisés",
      "includeGlobal": "Inclure les couches de mémoire globales",
      "levels": "Couches de mémoire lisibles",
      "watchMaxPerTick": "Éléments de mémoire par interrogation",
      "watchContentChars": "Limite de l’aperçu mémoire (caractères)",
      "writeEnabled": "Autoriser les écritures en mémoire externe",
      "writeFlushSeconds": "Intervalle de traitement de la file d’écriture (secondes)",
      "writeLevels": "Couches de mémoire accessibles en écriture",
      "writeSourceLabel": "Étiquette source des écritures externes",
      "rawEnabled": "Activer les miroirs des sessions originales",
      "rawDir": "Répertoire local des miroirs de session",
      "rawBuckets": "Compartiments de miroir autorisés",
      "rawMaxTurns": "Nombre maximal de tours par session en miroir"
    },
    "hints": {
      "sourceMode": "Le mode espace de travail reste dans le périmètre de projet choisi. Le mode mémoire lit la base de données mémoire externe DSH configurée.",
      "workspaceFileRoots": "Un répertoire de projet par ligne, dans un espace de travail Codex autorisé. Les lecteurs entiers et les répertoires personnels sont refusés.",
      "notificationPolicy": "Seuls les achèvements natifs et les problèmes nécessitant une intervention humaine sont transmis. Les étapes ordinaires restent locales.",
      "allowedProjects": "Noms de projet exacts, séparés par des virgules. Ces noms appartiennent à la source de mémoire externe.",
      "levels": "Noms des couches lisibles, séparés par des virgules.",
      "writeLevels": "Noms des couches accessibles en écriture, séparés par des virgules. Les couches globales soul et user ne peuvent pas être écrites.",
      "includeGlobal": "Autoriser la lecture des couches de mémoire globales en mode mémoire. Désactivé par défaut.",
      "writeEnabled": "Mettre en file d’attente les entrées de mémoire externe étiquetées avec leur source en mode mémoire. Une entrée en attente n’est pas encore une écriture durable vérifiée.",
      "rawEnabled": "Importer les sessions originales nettoyées dans un miroir local. Les répertoires sources et les exclusions des espaces de travail s’appliquent toujours.",
      "rawBuckets": "Noms de compartiment séparés par des virgules. Laissez vide pour utiliser le périmètre source configuré.",
      "watchIntervalSeconds": "Réglez sur zéro pour désactiver l’interrogation en arrière-plan. Les lectures restent disponibles à la demande tant que la supervision est activée.",
      "desktopProgressEnabled": "Lire les nouveaux événements natifs de DSH de bureau uniquement dans les espaces de travail autorisés. Aucun destinataire QQ n’est déduit.",
      "workspaceMaxFileBytes": "Valeur par défaut : 1 MiB. Les fichiers dépassant la limite sont refusés, au lieu d’être tronqués puis présentés comme complets.",
      "maxReadBytes": "Le premier enregistrement complet peut dépasser ce budget de page. Le dépassement et l’analyse du préfixe de contexte sont suivis séparément.",
      "maxScanBytes": "Le premier enregistrement complet peut dépasser ce budget d’analyse ; l’interrogation se termine alors. La relecture du contexte historique est suivie séparément.",
      "notifyPhases": "Identifiants de phase séparés par des virgules : commentary, final_answer, message. Le texte intermédiaire reste local jusqu’à une limite importante de tâche.",
      "healthCheckIntervalSeconds": "Vérifier régulièrement la disponibilité de la source, même sans nouvelles données. Un signal de présence ne prouve pas l’avancement d’une tâche.",
      "rawSyncIntervalSeconds": "Synchroniser dans un processus de travail distinct. Zéro sélectionne la synchronisation manuelle. Même sans nouvelle session, l’état enregistre l’heure de la dernière vérification.",
      "rawMaxSourceBytes": "Limiter les octets sources lus par synchronisation. Un curseur non terminé reprend au passage suivant.",
      "dbFile": "Chemin absolu de la base SQLite de mémoire externe DSH choisie. Redémarrez ce World après modification.",
      "watchMaxPerTick": "Les éléments dépassant cette limite attendent l’interrogation suivante.",
      "watchContentChars": "Limiter chaque aperçu mémoire. L’outil de lecture peut renvoyer le contenu source intégral lorsque l’accès aux tâches est activé.",
      "writeFlushSeconds": "Vider la file d’écriture à cet intervalle. Zéro déclenche l’écriture à l’appel de l’opération.",
      "writeSourceLabel": "Enregistré dans source_session pour que DSH puisse identifier l’origine externe.",
      "rawDir": "Répertoire local des miroirs de sessions nettoyées. Les entrées existantes sont complétées par ajout ; les chemins exclus et protégés restent inaccessibles.",
      "rawMaxTurns": "Limiter les tours de conversation importés par synchronisation. Les tours restants sont repris au passage suivant."
    }
  },
  "de": {
    "copy": {
      "nativeRequirement": "Native SnowLuma-Verbindungen benötigen das native Zusatzmodul aus diesem Paket. Die Installation von SnowLuma allein stellt diese API nicht bereit.",
      "duplicateOwner": "Lassen Sie keine weitere QQ World private Nachrichten desselben Eigentümers empfangen; doppelte Empfänger erzeugen zwei Kanäle.",
      "title": "Task Supervisor",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "Verbinden Sie DSH und Codex mit Coo und übernehmen Sie unterwegs über QQ.",
      "steps": [
        "Verbinden",
        "Bereich wählen",
        "Funktionen",
        "Prüfen und anwenden"
      ],
      "stepNotes": [
        "Eigentümer und Dienste",
        "Arbeitsbereiche und Sitzungen",
        "Alle optionalen Funktionen",
        "Prüfen, speichern und verbinden"
      ],
      "loading": "Konfiguration wird gelesen…",
      "retry": "Erneut lesen",
      "off": "Lokale Bereitschaft",
      "on": "Meldungen aktiviert",
      "offNote": "Wichtige Aufgabenhinweise bleiben lokal, bis Sie Meldungen aktivieren.",
      "onNote": "Gemeldet werden nur Abschlüsse, Fehler und Probleme, die Ihre Aufmerksamkeit erfordern.",
      "queue": "Wartende Hinweise",
      "owner": "QQ-Nummer des Eigentümers",
      "ownerHint": "Nur private Nachrichten dieses Kontos können Meldungen mit #@ ein- oder ausschalten. Gruppen und andere Konten können dies nicht.",
      "toggleHint": "Beginnen Sie im privaten QQ-Chat eine Nachricht mit #@ oder senden Sie nur #@, um Meldungen zu aktivieren und die Warteschlange freizugeben. Erneutes Senden schaltet Meldungen aus. Der Schalter übermittelt keine Aufgaben. Für jeden nativen Vorgang ist weiterhin eine separate neue ausdrückliche Bestätigung erforderlich.",
      "transport": "QQ-Verbindung",
      "native": "Native SnowLuma-Verbindung",
      "trusted": "Vorhandene QQ World (vertrauenswürdige private Ereignisse)",
      "onebot": "OneBot v11 (vorhandene Installationen)",
      "qqEndpoint": "Adresse des QQ-Dienstes",
      "qqAccount": "QQ-Nummer des Bots",
      "qqAccountHint": "Das bei SnowLuma angemeldete Konto, nicht das Eigentümerkonto.",
      "qqToken": "QQ-Zugangsdaten",
      "tokenHint": "Leer lassen, um die gespeicherten Zugangsdaten beizubehalten. Gespeicherte Werte werden nie zurückgegeben.",
      "configured": "Gespeichert",
      "unconfigured": "Nicht gespeichert",
      "gateway": "Adresse des DSH-Steuerungsgateways",
      "gatewayHint": "Verwenden Sie das vom DSH-Host bereitgestellte Steuerungsgateway. Diese World arbeitet mit dem Host-Plugin zusammen.",
      "gatewayToken": "Zugangsdaten des DSH-Gateways",
      "connectionsNote": "Zugangsdaten bleiben auf diesem Computer. Verbindungsprüfungen lesen nur: Sie senden keine QQ-Nachrichten und führen keine Aufgaben aus.",
      "dshEnabled": "DSH verbinden",
      "codexEnabled": "Codex verbinden",
      "roots": "Erlaubte Arbeitsbereiche",
      "rootsHint": "Ein Verzeichnis pro Zeile. Coo kann nur auf die von Ihnen aufgeführten Bereiche zugreifen.",
      "dshSessions": "DSH-Sitzungsverzeichnis",
      "codexSessions": "Codex-Sitzungsverzeichnis",
      "sessionsHint": "Dient zum Auffinden von Aufgaben und Lesen des Verlaufs. Behalten Sie den Standardwert bei, um den üblichen lokalen Speicherort zu verwenden.",
      "excluded": "Immer ausgeschlossene Verzeichnisse",
      "excludedHint": "Ein Verzeichnis pro Zeile. Sitzungen, Suchen und Dateizugriffe müssen diese Grenzen einhalten.",
      "files": "Lesen von Arbeitsbereichsdateien erlauben",
      "filesHint": "Standardmäßig aus. Lesezugriffe beachten weiterhin erlaubte Bereiche, Ausschlüsse und den Meldungsmodus.",
      "fileRoots": "Verzeichnisse der Codex-Projektdateien",
      "fileRootsHint": "Für Codex-Dateizugriffe erforderlich. Ein Projektverzeichnis pro Zeile innerhalb eines oben erlaubten Codex-Arbeitsbereichs. Ganze Laufwerke und Benutzerverzeichnisse werden nicht akzeptiert.",
      "fileRootsRequired": "Wählen Sie zuerst unter Bereich wählen die Verzeichnisse der Codex-Projektdateien.",
      "choose": "Verzeichnis wählen",
      "addPath": "Verzeichnis hinzufügen",
      "optionsNote": "Diese Einstellungen betreffen Gesprächsaktionen, Codex und den DSH-Speicher. Für die meisten Installationen genügen die ersten beiden Schritte.",
      "command": "Privater QQ-Chat",
      "conversation": "Gespräche und Genehmigungen",
      "codex": "Codex-Lesezugriffe",
      "memory": "DSH-Speicher",
      "noOptions": "Keine weiteren Einstellungen für diese Komponente.",
      "optional": "Optional",
      "addItem": "Eintrag hinzufügen",
      "remove": "Entfernen",
      "statusSetup": "Einrichtung erforderlich",
      "statusStarting": "Wird gestartet",
      "statusOffline": "Nicht verbunden",
      "checkTitle": "Verbindungen prüfen, dann speichern",
      "checkNote": "Die Prüfungen verwenden dieses Formular. Führen Sie sie nach Änderungen erneut aus. Beim Speichern werden die Einstellungen in diese World geschrieben.",
      "check": "Verbindungen prüfen",
      "checkRunning": "Wird geprüft…",
      "checksNone": "Diese Konfiguration wurde noch nicht geprüft.",
      "checksPassed": "Die aktuelle Konfiguration wurde geprüft.",
      "checksFailed": "Einige Verbindungen erfordern Aufmerksamkeit. Beachten Sie die Ergebnisse unten.",
      "checkStale": "Konfiguration geändert. Erneut prüfen.",
      "save": "Speichern und anwenden",
      "saving": "Wird gespeichert…",
      "restart": "Diese World nach dem Speichern neu starten",
      "restartHint": "Lädt nur diese Erweiterung neu, um die neuen Verbindungen und Bereiche anzuwenden.",
      "saved": "Konfiguration gespeichert.",
      "savedRestart": "Konfiguration gespeichert; ein Neustart der World wurde angefordert.",
      "warnings": "Hinweise",
      "components": "Komponentenstatus",
      "gatewayTitle": "Auch den DSH-Host verbinden",
      "gatewayNote": "Erstellen Sie das Installationsprogramm, laden Sie es herunter und führen Sie es auf diesem Computer aus. Es fordert Sie auf, DSH_HOME und ein Profil zu wählen und Änderungen vor ihrer Anwendung zu bestätigen.",
      "generate": "DSH-Installationsprogramm erstellen",
      "generating": "Wird erstellt…",
      "download": "Installationsprogramm herunterladen",
      "downloadLegacy": "Verbindungshinweise herunterladen",
      "gatewayPrepared": "Installationsprogramm vorbereitet. Es wurde noch nicht in DSH installiert.",
      "gatewayLegacyPrepared": "Verbindungshinweise vorbereitet. Sie wurden noch nicht in DSH installiert.",
      "gatewaySteps": "Diese Schritte in DSH abschließen",
      "generatedNote": "Das Startprogramm enthält keine Zugangsdaten und benötigt das private Kit auf diesem Computer. Führen Sie es lokal aus.",
      "kitDirectory": "Lokales Installationskit",
      "runCommand": "Oder lokal in einer Befehlszeile ausführen",
      "privateKit": "Die Zugangsdaten bleiben im privaten lokalen Kit und sind nicht im heruntergeladenen Startprogramm enthalten. Starten Sie danach DSH vollständig und prüfen Sie dessen Verbindung.",
      "legacyKit": "Dies ist eine ältere Verbindungsspezifikation. Erstellen Sie sie erneut mit einer Version, die das Installationsprogramm bereitstellt; manuelle JSON-Änderungen sind nicht erforderlich.",
      "back": "Zurück",
      "next": "Weiter",
      "fieldError": "Formular prüfen: ",
      "invalidOwner": "Geben Sie für den Eigentümer ein gültiges numerisches QQ-Konto ein.",
      "invalidNumber": "Gültige Zahl eingeben: ",
      "statusUnknown": "Nicht gemeldet",
      "statusOk": "Bereit",
      "statusError": "Fehler",
      "statusSkipped": "Übersprungen",
      "statusStopped": "Gestoppt",
      "version": "Erweiterungsversion",
      "savedLabel": "Konfiguration",
      "unsaved": "Ungespeicherte Änderungen",
      "clean": "Lokale Konfiguration geladen",
      "failed": "Der Vorgang ist fehlgeschlagen. Versuchen Sie es erneut.",
      "noGateway": "Es wurde noch keine Verbindungsdatei erstellt.",
      "optionalCredentials": "Erweitert: Eine kompatible QQ World muss vertrauenswürdige private Ereignisse und Antworten bereitstellen. Dieses Plugin verwaltet seine Zugangsdaten selbst.",
      "nativePrivateChannel": "Diese World enthält den privaten Aufgabenkanal: Sie empfängt Eigentümerbefehle über den zugrunde liegenden QQ-Dienst und antwortet bei aktivierten Meldungen mit Ergebnissen.",
      "enableWorld": "Diese World aktivieren",
      "stateDirectory": "Lokales Verzeichnis für den Überwachungszustand",
      "credentialReference": "Referenz auf Zugangsdaten",
      "environmentTitle": "Umgebungsanweisung",
      "environmentDescription": "Werkzeugbereiche, Aufgabenbenachrichtigungen und Grenzen nativer Genehmigungen.",
      "modeLabel": "Meldungsmodus",
      "sourceDisabled": "Diese Quelle ist deaktiviert.",
      "sourceReady": "Das Quellverzeichnis ist vorhanden. Es wurden keine Gesprächsinhalte gelesen.",
      "sourceUnavailable": "Das Quellverzeichnis ist nicht verfügbar oder ausgeschlossen.",
      "gatewayCheckOk": "Das authentifizierte Loopback-Gateway und die erlaubten Projektbereiche haben die Prüfungen bestanden.",
      "gatewayCheckFailed": "Die Gateway-Prüfung ist fehlgeschlagen. Prüfen Sie das externe DSH-Plugin und dessen Zugangsdaten.",
      "gatewayMissingCredential": "Es sind keine Gateway-Zugangsdaten gespeichert. Quellen mit reinem Lesezugriff können trotzdem laufen.",
      "qqRequired": "Geben Sie die QQ-Dienstadresse und das Bot-Konto ein.",
      "nativeCheckOk": "Die SnowLuma-Identität und das Hilfsmodul für additive Abonnements wurden geprüft. Die Prüfung hat keine Abonnements geändert.",
      "nativeCheckFailed": "Die Prüfung der SnowLuma-Identität oder des Hilfsmoduls ist fehlgeschlagen. Prüfen Sie Adresse, Konto und Zugangsdaten und verwenden Sie das mitgelieferte Hilfsmodul mit additiven Abonnements.",
      "onebotCheckNote": "Nach dem Verbinden werden OneBot-Datenrahmen mit Bot-Konto und Eigentümer abgeglichen. Diese Prüfung sendet keine QQ-Nachrichten.",
      "savedScopePending": "Berechtigungsänderungen wurden gespeichert und die bisherigen Komponenten sofort gestoppt. Starten Sie diese World neu, um den neuen Bereich zu aktivieren; er beginnt mit OFF.",
      "savedConfigurationPending": "Die Konfiguration ist gespeichert. Laufende Komponenten behalten ihre bisherigen Einstellungen bis zum Neustart dieser World.",
      "additiveSubscriptions": "Diese World fügt das Abonnement des Eigentümers hinzu, ohne SnowLuma-Abonnements anderer Gespräche zu ersetzen.",
      "offLimits": "Bei OFF werden gewöhnliche Eigentümernachrichten ignoriert; ein ursprüngliches #@ schaltet Meldungen weiterhin um. OFF löscht keine bereits übermittelten Inhalte und bricht keine bereits eingereichten nativen Aufgaben ab.",
      "scopeChanged": "Eine Änderung von Eigentümer, Quellberechtigungen, Wurzelverzeichnissen oder Ausschlüssen erzeugt einen neuen OFF-Bereich und eine neue Warteschlange. Frühere Zustandsverzeichnisse bleiben erhalten; bereits eingereichte native Aufgaben laufen unabhängig weiter.",
      "armInstruction": "Prüfen Sie die Verbindungen, speichern Sie und wenden Sie die Änderungen an. Warten Sie eine Sekunde und senden Sie dann ein neues privates #@, um Meldungen zu aktivieren; erneutes Senden schaltet sie aus.",
      "runKit": "Laden Sie dieses Startprogramm herunter und führen Sie es einmal auf demselben Computer aus. Lassen Sie das private Kit bis zum Abschluss der Installation an seinem Platz.",
      "kitSelectProfile": "Wählen Sie DSH_HOME und ein vorhandenes Profil, etwa desktop. Das Installationsprogramm zeigt die genauen YAML-Ziele und fordert Sie zur Eingabe von INSTALL auf.",
      "kitBackup": "Das Installationsprogramm erhält andere Plugins und Zugangsdaten, sichert vorhandene Dateien, verwendet native Schreibsperren und speichert Zugangsdaten, ohne sie anzuzeigen. Die Aktualisierung eines vorhandenen Gateways erfordert eine ausdrückliche Bestätigung.",
      "kitRestart": "Starten Sie den gewählten DSH-Host neu und prüfen Sie anschließend hier die authentifizierten Verbindungen. Das Installationsprogramm startet kein Gateway und prüft kein laufendes Gateway.",
      "codexOnlyControl": "Die reine Leseüberwachung von Codex benötigt kein DSH-Gateway. Die native Codex-Steuerung benötigt zusätzlich einen ausdrücklich konfigurierten, unterstützten Codex-Transport.",
      "kitSecurity": "Das lokale Installationsprogramm ist vorbereitet, aber noch nicht installiert. Sein privates Kit enthält Zugangsdaten: Geben Sie das Kit nicht weiter. DSH muss das native Plugin laden; diese World benötigt diesen separaten Host.",
      "formRequired": "Stellen Sie zuerst das Einrichtungsformular bereit.",
      "actionUnsupported": "Diese Einrichtungsaktion wird nicht unterstützt.",
      "installerNeedsScope": "Wählen Sie vor dem Erstellen eines Installationsprogramms den Eigentümer und mindestens eine ausdrücklich festgelegte Projektquelle.",
      "gatewayCredentialInvalid": "Die Gateway-Zugangsdaten müssen mindestens 32 Zeichen ohne Leerraum enthalten.",
      "credentialInvalid": "Prüfen Sie das Format der Zugangsdaten. Leerraum und Werte mit mehr als 8192 Zeichen werden nicht akzeptiert.",
      "qqAccountInvalid": "Geben Sie für den Bot ein gültiges numerisches QQ-Konto ein.",
      "invalidConfiguration": "Konfigurationsfeld prüfen",
      "unsupportedOption": "Diese Option wird nicht unterstützt",
      "invalidDirectory": "Wählen Sie höchstens 100 gültige absolute Verzeichnispfade innerhalb des erlaubten Bereichs.",
      "invalidEndpoint": "Verwenden Sie für den gewählten Dienst eine ausdrückliche IPv4-Loopback-Adresse mit Port.",
      "rootsRequired": "Wählen Sie für jede aktivierte Quelle mindestens einen erlaubten Arbeitsbereich.",
      "componentIssue": "Diese Komponente erfordert Aufmerksamkeit. Prüfen Sie Quelle, Verbindung und Zugangsdaten.",
      "diagnosticCode": "Diagnosecode",
      "unknownDiagnostic": "Der Dienst hat eine unbekannte Diagnose gemeldet. Prüfen Sie Verbindung und Komponentenstatus.",
      "itemLabel": "Eintrag",
      "readOnlyLabel": "Nur lesen",
      "unknownOption": "Zusätzliche Einstellung",
      "modeWorkspace": "Arbeitsbereiche",
      "modeMemory": "Externer Speicher",
      "policyImportant": "Abschluss und Probleme mit Handlungsbedarf",
      "policyRecord": "Lokal aufzeichnen",
      "publicFinal": "Endergebnis",
      "publicCommentary": "Zwischenstand",
      "onOffLabel": "Meldungszustand"
    },
    "labels": {
      "pollIntervalMs": "Gateway-Abfrageintervall (ms)",
      "desktopProgressEnabled": "Aufgabengrenzen von Desktop-DSH erfassen",
      "requestTimeoutMs": "Zeitlimit für Gateway-Anfragen (ms)",
      "eventTtlMs": "Gültigkeitsdauer menschlicher Nachrichten (ms)",
      "selectionTtlMs": "Gültigkeitsdauer der Zielauswahl (ms)",
      "includeSubagents": "Aufgaben von Unteragenten einbeziehen",
      "workspaceFileRoots": "Projektdateiverzeichnisse",
      "workspaceMaxFileBytes": "Maximale Textdateigröße (Bytes)",
      "watchIntervalSeconds": "Abfrageintervall (Sekunden)",
      "watchMaxItems": "Einträge pro Abfrage",
      "maxReadBytes": "Lesebudget pro Seite (Bytes)",
      "maxScanBytes": "Scanbudget pro Abfrage (Bytes)",
      "notificationPolicy": "Benachrichtigungsrichtlinie für Aufgaben",
      "notifyPhases": "Phasen öffentlicher Nachrichten",
      "notifyUserMessages": "Öffentliche Benutzernachrichten einbeziehen",
      "notifyLifecycle": "Native Lebenszyklusfakten einbeziehen",
      "eventContentChars": "Längenlimit für Ereignistexte (Zeichen)",
      "sourceMode": "DSH-Quellmodus",
      "healthCheckIntervalSeconds": "Intervall der Quellenprüfung (Sekunden)",
      "writeMaxPerTick": "Schreibvorgänge pro Stapel",
      "queueMaxPending": "Maximal wartende Schreibvorgänge",
      "rawSyncIntervalSeconds": "Synchronisierungsintervall für Originalsitzungen (Sekunden)",
      "rawMaxSourceBytes": "Maximale Größe einer Originalsitzung (Bytes)",
      "dbFile": "DSH-Speicherdatenbank",
      "allowedProjects": "Erlaubte Projektnamen",
      "includeGlobal": "Globale Speicherebenen einbeziehen",
      "levels": "Lesbare Speicherebenen",
      "watchMaxPerTick": "Speichereinträge pro Abfrage",
      "watchContentChars": "Längenlimit der Speichervorschau (Zeichen)",
      "writeEnabled": "Schreiben in externen Speicher erlauben",
      "writeFlushSeconds": "Intervall der Schreibwarteschlange (Sekunden)",
      "writeLevels": "Beschreibbare Speicherebenen",
      "writeSourceLabel": "Quellbezeichnung externer Schreibvorgänge",
      "rawEnabled": "Spiegelung von Originalsitzungen aktivieren",
      "rawDir": "Lokales Verzeichnis der Sitzungsspiegel",
      "rawBuckets": "Erlaubte Spiegelbereiche",
      "rawMaxTurns": "Maximale Gesprächsrunden pro gespiegelter Sitzung"
    },
    "hints": {
      "sourceMode": "Der Arbeitsbereichsmodus bleibt innerhalb des gewählten Projektbereichs. Der Speichermodus liest die konfigurierte externe DSH-Speicherdatenbank.",
      "workspaceFileRoots": "Ein Projektverzeichnis pro Zeile innerhalb eines erlaubten Codex-Arbeitsbereichs. Ganze Laufwerke und Benutzerverzeichnisse werden abgelehnt.",
      "notificationPolicy": "Nur native Aufgabenabschlüsse oder Probleme mit menschlichem Handlungsbedarf werden übermittelt. Gewöhnliche Schritte bleiben lokal.",
      "allowedProjects": "Exakte Projektnamen, durch Kommas getrennt. Diese Namen gehören zur externen Speicherquelle.",
      "levels": "Namen lesbarer Ebenen, durch Kommas getrennt.",
      "writeLevels": "Namen beschreibbarer Ebenen, durch Kommas getrennt. In die globalen Ebenen soul und user kann nicht geschrieben werden.",
      "includeGlobal": "Lesezugriffe auf globale Speicherebenen im Speichermodus erlauben. Standardmäßig aus.",
      "writeEnabled": "Externe Speichereinträge im Speichermodus mit Quellbezeichnung einreihen. Ein wartender Eintrag ist noch kein bestätigter dauerhafter Schreibvorgang.",
      "rawEnabled": "Bereinigte Originalsitzungen in einen lokalen Spiegel importieren. Quellverzeichnisse und Arbeitsbereichsausschlüsse gelten weiterhin.",
      "rawBuckets": "Bereichsnamen durch Kommas trennen. Leer lassen, um den konfigurierten Quellbereich zu verwenden.",
      "watchIntervalSeconds": "Auf null setzen, um Hintergrundabfragen zu deaktivieren. Bei aktivierter Überwachung bleiben Lesezugriffe auf Anfrage möglich.",
      "desktopProgressEnabled": "Neue native Desktop-DSH-Ereignisse nur innerhalb autorisierter Arbeitsbereiche lesen. Es wird kein QQ-Empfänger abgeleitet.",
      "workspaceMaxFileBytes": "Standard: 1 MiB. Dateien über dem Limit werden abgelehnt, statt gekürzt und als vollständig dargestellt zu werden.",
      "maxReadBytes": "Der erste vollständige Datensatz darf dieses Seitenbudget überschreiten. Überschreitungen und das Scannen des Kontextpräfixes werden getrennt erfasst.",
      "maxScanBytes": "Der erste vollständige Datensatz darf dieses Scanbudget überschreiten; danach endet die Abfrage. Die Wiedergabe historischen Kontexts wird getrennt erfasst.",
      "notifyPhases": "Phasenkennungen, durch Kommas getrennt: commentary, final_answer, message. Zwischentexte bleiben bis zu einer wichtigen Aufgabengrenze lokal.",
      "healthCheckIntervalSeconds": "Die Quelle regelmäßig prüfen, auch wenn keine neuen Daten eintreffen. Ein Lebenszeichen belegt keinen Aufgabenfortschritt.",
      "rawSyncIntervalSeconds": "In einem separaten Hintergrundprozess synchronisieren. Null wählt manuelle Synchronisierung. Auch ohne neue Sitzungen hält der Status die letzte Prüfzeit fest.",
      "rawMaxSourceBytes": "Die pro Synchronisierung gelesenen Quellbytes begrenzen. Eine noch offene Cursorposition wird im nächsten Durchlauf fortgesetzt.",
      "dbFile": "Absoluter Pfad zur gewählten SQLite-Datenbank des externen DSH-Speichers. Diese World nach einer Änderung neu starten.",
      "watchMaxPerTick": "Einträge über diesem Limit bleiben für die nächste Abfrage übrig.",
      "watchContentChars": "Jede Speichervorschau begrenzen. Das Lesewerkzeug kann bei aktiviertem Aufgabenzugriff den vollständigen Quellinhalt zurückgeben.",
      "writeFlushSeconds": "Die Schreibwarteschlange in diesem Intervall abarbeiten. Null schreibt beim Aufruf der Operation.",
      "writeSourceLabel": "Wird in source_session gespeichert, damit DSH die externe Herkunft erkennen kann.",
      "rawDir": "Lokales Verzeichnis für bereinigte Sitzungsspiegel. Bestehende Einträge werden durch Anhängen ergänzt; ausgeschlossene und geschützte Pfade bleiben unzugänglich.",
      "rawMaxTurns": "Pro Synchronisierung importierte Gesprächsrunden begrenzen. Verbleibende Runden folgen im nächsten Durchlauf."
    }
  },
  "es-419": {
    "copy": {
      "nativeRequirement": "Las conexiones nativas de SnowLuma requieren el complemento nativo incluido en este paquete. Instalar solo SnowLuma no proporciona esta API.",
      "duplicateOwner": "No permitas que otro QQ World también reciba mensajes privados del mismo propietario; dos receptores crean dos canales.",
      "title": "Task Supervisor",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "Conecta DSH y Codex a Coo y toma el control por QQ cuando estés fuera.",
      "steps": [
        "Conectar",
        "Elegir alcance",
        "Funciones",
        "Verificar y aplicar"
      ],
      "stepNotes": [
        "Propietario y servicios",
        "Espacios de trabajo y sesiones",
        "Todas las funciones opcionales",
        "Validar, guardar y conectar"
      ],
      "loading": "Leyendo la configuración…",
      "retry": "Volver a leer",
      "off": "En espera local",
      "on": "Reportes activados",
      "offNote": "Los avisos importantes de las tareas permanecen en este equipo hasta que actives los reportes.",
      "onNote": "Solo se reportan finalizaciones, fallas y problemas que necesitan tu atención.",
      "queue": "Avisos en cola",
      "owner": "Número QQ del propietario",
      "ownerHint": "Solo los mensajes privados de esta cuenta pueden activar o desactivar los reportes con #@. Los grupos y las demás cuentas no pueden hacerlo.",
      "toggleHint": "En tu chat privado de QQ, empieza un mensaje con #@ o envía solo #@ para activar los reportes y liberar la cola. Envíalo de nuevo para desactivar los reportes. Este cambio no envía tareas. Cada operación nativa sigue necesitando una confirmación explícita, nueva y por separado.",
      "transport": "Conexión QQ",
      "native": "Conexión nativa de SnowLuma",
      "trusted": "QQ World existente (eventos privados de confianza)",
      "onebot": "OneBot v11 (implementaciones existentes)",
      "qqEndpoint": "Dirección del servicio QQ",
      "qqAccount": "Número QQ del bot",
      "qqAccountHint": "La cuenta que inició sesión en SnowLuma, en lugar de la cuenta del propietario.",
      "qqToken": "Credencial de conexión QQ",
      "tokenHint": "Déjalo vacío para conservar la credencial guardada. Los valores guardados nunca se devuelven.",
      "configured": "Guardada",
      "unconfigured": "Sin guardar",
      "gateway": "Dirección de la puerta de enlace de control DSH",
      "gatewayHint": "Usa la puerta de enlace de control que expone el host DSH. Este World trabaja junto con el plugin del host.",
      "gatewayToken": "Credencial de la puerta de enlace DSH",
      "connectionsNote": "Las credenciales permanecen en este equipo. Las verificaciones de conexión solo leen: no envían mensajes QQ ni ejecutan tareas.",
      "dshEnabled": "Conectar DSH",
      "codexEnabled": "Conectar Codex",
      "roots": "Espacios de trabajo permitidos",
      "rootsHint": "Un directorio por línea. Coo solo tiene acceso al alcance que indiques.",
      "dshSessions": "Directorio de sesiones DSH",
      "codexSessions": "Directorio de sesiones Codex",
      "sessionsHint": "Se usa para descubrir tareas y leer el historial. Conserva el valor predeterminado para usar la ubicación local estándar.",
      "excluded": "Directorios siempre excluidos",
      "excludedHint": "Un directorio por línea. Las sesiones, las búsquedas y el acceso a archivos deben respetar estos límites.",
      "files": "Permitir la lectura de archivos del espacio de trabajo",
      "filesHint": "Desactivada de forma predeterminada. Las lecturas siguen respetando el alcance permitido, las exclusiones y el modo de reportes.",
      "fileRoots": "Directorios de archivos de proyectos Codex",
      "fileRootsHint": "Son obligatorios para leer archivos de Codex. Un directorio de proyecto por línea, dentro de un espacio de trabajo Codex permitido arriba. No se aceptan unidades completas ni directorios personales.",
      "fileRootsRequired": "Primero elige los directorios de archivos de proyectos Codex en Elegir alcance.",
      "choose": "Elegir directorio",
      "addPath": "Agregar directorio",
      "optionsNote": "Estos controles abarcan las operaciones de conversaciones, Codex y la memoria DSH. La mayoría de las instalaciones solo necesitan los primeros dos pasos.",
      "command": "Chat privado QQ",
      "conversation": "Conversaciones y aprobaciones",
      "codex": "Lecturas de Codex",
      "memory": "Memoria DSH",
      "noOptions": "No hay ajustes adicionales para este componente.",
      "optional": "Opcional",
      "addItem": "Agregar elemento",
      "remove": "Quitar",
      "statusSetup": "Requiere configuración",
      "statusStarting": "Iniciando",
      "statusOffline": "Sin conexión",
      "checkTitle": "Verifica las conexiones y luego guarda",
      "checkNote": "Las verificaciones usan este formulario. Repítelas después de hacer cambios. Al guardar, los ajustes se escriben en este World.",
      "check": "Verificar conexiones",
      "checkRunning": "Verificando…",
      "checksNone": "Esta configuración aún no se ha verificado.",
      "checksPassed": "La configuración actual se ha verificado.",
      "checksFailed": "Algunas conexiones necesitan atención. Consulta los resultados de abajo.",
      "checkStale": "La configuración cambió. Verifica de nuevo.",
      "save": "Guardar y aplicar",
      "saving": "Guardando…",
      "restart": "Reiniciar este World después de guardar",
      "restartHint": "Recarga solo esta extensión para aplicar las nuevas conexiones y el nuevo alcance.",
      "saved": "Configuración guardada.",
      "savedRestart": "Configuración guardada; se solicitó reiniciar el World.",
      "warnings": "Notas",
      "components": "Estado de los componentes",
      "gatewayTitle": "Conecta también el host DSH",
      "gatewayNote": "Genera el instalador, descárgalo y ejecútalo en este equipo. Te pide elegir DSH_HOME y un perfil, y luego confirmar antes de aplicar los cambios.",
      "generate": "Generar instalador DSH",
      "generating": "Generando…",
      "download": "Descargar instalador",
      "downloadLegacy": "Descargar instrucciones de conexión",
      "gatewayPrepared": "Instalador preparado. Aún no se ha instalado en DSH.",
      "gatewayLegacyPrepared": "Instrucciones de conexión preparadas. Aún no se han instalado en DSH.",
      "gatewaySteps": "Completa estos pasos en DSH",
      "generatedNote": "El lanzador no contiene credenciales y depende del kit privado de este equipo. Ejecútalo localmente.",
      "kitDirectory": "Kit de instalación local",
      "runCommand": "O ejecutar localmente desde una línea de comandos",
      "privateKit": "La credencial permanece en el kit local privado, fuera del lanzador descargado. Después, termina de iniciar DSH y verifica su conexión.",
      "legacyKit": "Esta es una especificación de conexión anterior. Genérala de nuevo con una versión que proporcione el instalador; no necesitas editar JSON manualmente.",
      "back": "Atrás",
      "next": "Siguiente",
      "fieldError": "Revisa el formulario: ",
      "invalidOwner": "Ingresa una cuenta QQ numérica válida para el propietario.",
      "invalidNumber": "Ingresa un número válido: ",
      "statusUnknown": "Sin reporte",
      "statusOk": "Listo",
      "statusError": "Error",
      "statusSkipped": "Omitido",
      "statusStopped": "Detenido",
      "version": "Versión de la extensión",
      "savedLabel": "Configuración",
      "unsaved": "Cambios sin guardar",
      "clean": "Configuración local cargada",
      "failed": "La operación falló. Inténtalo de nuevo.",
      "noGateway": "No se ha generado ningún archivo de conexión.",
      "optionalCredentials": "Avanzado: un QQ World compatible debe proporcionar eventos privados y respuestas de confianza. Ese plugin administra sus credenciales.",
      "nativePrivateChannel": "Este World incluye el canal privado de tareas: recibe comandos del propietario a través del servicio QQ subyacente y responde con los resultados mientras los reportes están activados.",
      "enableWorld": "Activar este World",
      "stateDirectory": "Directorio local del estado de supervisión",
      "credentialReference": "Referencia de credencial",
      "environmentTitle": "Instrucción de entorno",
      "environmentDescription": "Alcance de las herramientas, política de avisos de tareas y límites de las aprobaciones nativas.",
      "modeLabel": "Modo de reportes",
      "sourceDisabled": "Esta fuente está desactivada.",
      "sourceReady": "El directorio de la fuente existe. No se leyó ningún contenido de conversaciones.",
      "sourceUnavailable": "El directorio de la fuente no está disponible o está excluido.",
      "gatewayCheckOk": "La puerta de enlace de bucle local autenticada y los alcances de proyecto permitidos pasaron las verificaciones.",
      "gatewayCheckFailed": "Falló la verificación de la puerta de enlace. Revisa el plugin DSH externo y su credencial.",
      "gatewayMissingCredential": "No hay una credencial guardada para la puerta de enlace. Las fuentes de solo lectura pueden seguir funcionando.",
      "qqRequired": "Ingresa la dirección del servicio QQ y la cuenta del bot.",
      "nativeCheckOk": "Se verificaron la identidad de SnowLuma y su auxiliar de suscripciones aditivas. La verificación no cambió ninguna suscripción.",
      "nativeCheckFailed": "Falló la verificación de la identidad de SnowLuma o del auxiliar. Revisa la dirección, la cuenta y la credencial, y usa el auxiliar incluido con suscripciones aditivas.",
      "onebotCheckNote": "Después de conectar, las tramas de OneBot se verifican contra la cuenta del bot y el propietario. Esta verificación no envía mensajes QQ.",
      "savedScopePending": "Los cambios de permisos se guardaron y los componentes anteriores se detuvieron de inmediato. Reinicia este World para activar el nuevo alcance, que comienza en OFF.",
      "savedConfigurationPending": "La configuración está guardada. Los componentes en ejecución conservan sus ajustes anteriores hasta que se reinicie este World.",
      "additiveSubscriptions": "Este World agrega la suscripción del propietario sin reemplazar las suscripciones de SnowLuma que usan otras conversaciones.",
      "offLimits": "En OFF se ignora el chat habitual del propietario; un #@ original aún permite activar o desactivar los reportes. OFF no borra el contenido ya entregado ni cancela las tareas nativas ya enviadas.",
      "scopeChanged": "Cambiar el propietario, los permisos de las fuentes, los directorios raíz o las exclusiones crea un nuevo alcance en OFF y una cola nueva. Los directorios de estado anteriores se conservan; las tareas nativas ya enviadas continúan de forma independiente.",
      "armInstruction": "Verifica las conexiones, guarda y aplica. Espera un segundo y envía un nuevo #@ privado para activar los reportes; envíalo de nuevo para desactivarlos.",
      "runKit": "Descarga y ejecuta este lanzador una vez en el mismo equipo. Mantén el kit privado en su ubicación hasta que termine la instalación.",
      "kitSelectProfile": "Elige DSH_HOME y un perfil existente, como desktop. El instalador muestra los destinos YAML exactos y te pide escribir INSTALL.",
      "kitBackup": "El instalador conserva los demás plugins y credenciales, respalda los archivos existentes, usa bloqueos nativos de escritura y guarda la credencial sin mostrarla. Actualizar una puerta de enlace existente requiere confirmación explícita.",
      "kitRestart": "Reinicia el host DSH elegido y luego verifica aquí las conexiones autenticadas. El instalador no inicia ni verifica una puerta de enlace en ejecución.",
      "codexOnlyControl": "El monitoreo de solo lectura de Codex no necesita una puerta de enlace DSH. El control nativo de Codex también necesita un transporte Codex compatible configurado de forma explícita.",
      "kitSecurity": "El instalador local está preparado, pero no instalado. Su kit privado contiene una credencial: no compartas el kit. DSH debe cargar el plugin nativo; este World necesita ese host por separado.",
      "formRequired": "Primero proporciona el formulario de configuración.",
      "actionUnsupported": "Esta acción de configuración no es compatible.",
      "installerNeedsScope": "Elige el propietario y al menos una fuente de proyecto explícita antes de generar un instalador.",
      "gatewayCredentialInvalid": "La credencial de la puerta de enlace debe contener al menos 32 caracteres sin espacios en blanco.",
      "credentialInvalid": "Revisa el formato de la credencial. No se aceptan espacios en blanco ni valores de más de 8192 caracteres.",
      "qqAccountInvalid": "Ingresa una cuenta QQ numérica válida para el bot.",
      "invalidConfiguration": "Revisa el campo de configuración",
      "unsupportedOption": "Esta opción no es compatible",
      "invalidDirectory": "Elige hasta 100 rutas absolutas de directorios válidas dentro del ámbito permitido.",
      "invalidEndpoint": "Usa una dirección IPv4 de bucle local explícita y un puerto para el servicio elegido.",
      "rootsRequired": "Elige al menos un espacio de trabajo permitido para cada fuente activada.",
      "componentIssue": "Este componente necesita atención. Revisa su fuente, conexión y credencial.",
      "diagnosticCode": "Código de diagnóstico",
      "unknownDiagnostic": "El servicio reportó un diagnóstico desconocido. Revisa la conexión y el estado del componente.",
      "itemLabel": "Elemento",
      "readOnlyLabel": "Solo lectura",
      "unknownOption": "Ajuste adicional",
      "modeWorkspace": "Espacios de trabajo",
      "modeMemory": "Memoria externa",
      "policyImportant": "Finalización y problemas que requieren atención",
      "policyRecord": "Registrar localmente",
      "publicFinal": "Resultado final",
      "publicCommentary": "Avance intermedio",
      "onOffLabel": "Estado de los reportes"
    },
    "labels": {
      "pollIntervalMs": "Intervalo de consulta de la puerta de enlace (ms)",
      "desktopProgressEnabled": "Recopilar límites de tareas DSH de escritorio",
      "requestTimeoutMs": "Tiempo de espera de solicitudes a la puerta de enlace (ms)",
      "eventTtlMs": "Vigencia de los mensajes humanos (ms)",
      "selectionTtlMs": "Vigencia de la selección de destino (ms)",
      "includeSubagents": "Incluir tareas de subagentes",
      "workspaceFileRoots": "Directorios de archivos de proyectos",
      "workspaceMaxFileBytes": "Tamaño máximo de archivo de texto (bytes)",
      "watchIntervalSeconds": "Intervalo de consulta (segundos)",
      "watchMaxItems": "Elementos por consulta",
      "maxReadBytes": "Presupuesto de lectura por página (bytes)",
      "maxScanBytes": "Presupuesto de exploración por consulta (bytes)",
      "notificationPolicy": "Política de avisos de tareas",
      "notifyPhases": "Fases de mensajes públicos",
      "notifyUserMessages": "Incluir mensajes públicos del usuario",
      "notifyLifecycle": "Incluir hechos del ciclo de vida nativo",
      "eventContentChars": "Límite de texto del evento (caracteres)",
      "sourceMode": "Modo de fuente DSH",
      "healthCheckIntervalSeconds": "Intervalo de verificación de la fuente (segundos)",
      "writeMaxPerTick": "Escrituras por lote",
      "queueMaxPending": "Máximo de escrituras pendientes",
      "rawSyncIntervalSeconds": "Intervalo de sincronización de sesiones originales (segundos)",
      "rawMaxSourceBytes": "Tamaño máximo de sesión original (bytes)",
      "dbFile": "Base de datos de memoria DSH",
      "allowedProjects": "Nombres de proyecto permitidos",
      "includeGlobal": "Incluir capas globales de memoria",
      "levels": "Capas de memoria legibles",
      "watchMaxPerTick": "Elementos de memoria por consulta",
      "watchContentChars": "Límite de vista previa de memoria (caracteres)",
      "writeEnabled": "Permitir escrituras en memoria externa",
      "writeFlushSeconds": "Intervalo de la cola de escritura (segundos)",
      "writeLevels": "Capas de memoria con permiso de escritura",
      "writeSourceLabel": "Etiqueta de origen de escrituras externas",
      "rawEnabled": "Activar espejos de sesiones originales",
      "rawDir": "Directorio local de espejos de sesiones",
      "rawBuckets": "Contenedores de espejo permitidos",
      "rawMaxTurns": "Máximo de turnos por sesión reflejada"
    },
    "hints": {
      "sourceMode": "El modo de espacio de trabajo se mantiene dentro del alcance del proyecto elegido. El modo de memoria lee la base de datos de memoria externa DSH configurada.",
      "workspaceFileRoots": "Un directorio de proyecto por línea, dentro de un espacio de trabajo Codex permitido. Se rechazan unidades completas y directorios personales.",
      "notificationPolicy": "Solo se entregan finalizaciones nativas o problemas que requieren atención humana. Los pasos habituales permanecen en este equipo.",
      "allowedProjects": "Nombres exactos de proyecto separados por comas. Estos nombres pertenecen a la fuente de memoria externa.",
      "levels": "Nombres de capas legibles separados por comas.",
      "writeLevels": "Nombres de capas con permiso de escritura separados por comas. No se puede escribir en las capas globales soul y user.",
      "includeGlobal": "Permitir lecturas de capas globales en el modo de memoria. Desactivado de forma predeterminada.",
      "writeEnabled": "Poner en cola entradas de memoria externa con etiqueta de origen en el modo de memoria. Una entrada en cola aún no es una escritura duradera verificada.",
      "rawEnabled": "Importar sesiones originales depuradas a un espejo local. Siguen aplicándose los directorios fuente y las exclusiones de los espacios de trabajo.",
      "rawBuckets": "Nombres de contenedores separados por comas. Déjalo vacío para usar el alcance de fuente configurado.",
      "watchIntervalSeconds": "Establécelo en cero para desactivar las consultas en segundo plano. Las lecturas siguen disponibles bajo demanda mientras la supervisión esté activada.",
      "desktopProgressEnabled": "Leer nuevos eventos nativos de DSH de escritorio solo dentro de espacios de trabajo autorizados. No se deduce ningún destinatario QQ.",
      "workspaceMaxFileBytes": "Predeterminado: 1 MiB. Los archivos que superan el límite se rechazan en lugar de truncarse y presentarse como completos.",
      "maxReadBytes": "El primer registro completo puede superar este presupuesto por página. El exceso y la exploración del prefijo de contexto se registran por separado.",
      "maxScanBytes": "El primer registro completo puede superar este presupuesto de exploración; después termina la consulta. La reproducción del contexto histórico se registra por separado.",
      "notifyPhases": "Identificadores de fase separados por comas: commentary, final_answer, message. El texto intermedio permanece en este equipo hasta un límite importante de la tarea.",
      "healthCheckIntervalSeconds": "Verificar periódicamente el estado de la fuente, incluso sin datos nuevos. Una señal de actividad no implica avance de la tarea.",
      "rawSyncIntervalSeconds": "Sincronizar en un proceso de trabajo separado. Cero selecciona la sincronización manual. Aunque no haya sesiones nuevas, el estado registra la hora de la última verificación.",
      "rawMaxSourceBytes": "Limitar los bytes de la fuente leídos por sincronización. Un cursor sin terminar continúa en la siguiente pasada.",
      "dbFile": "Ruta absoluta a la base SQLite de memoria externa DSH elegida. Reinicia este World después de cambiarla.",
      "watchMaxPerTick": "Los elementos que superan este límite quedan para la siguiente consulta.",
      "watchContentChars": "Limitar cada vista previa de memoria. La herramienta de lectura puede devolver el contenido completo de la fuente mientras el acceso a tareas esté activado.",
      "writeFlushSeconds": "Procesar la cola de escritura con este intervalo. Cero escribe cuando se llama a la operación.",
      "writeSourceLabel": "Se guarda en source_session para que DSH pueda identificar el origen externo.",
      "rawDir": "Directorio local para espejos de sesiones depuradas. Las entradas existentes se amplían mediante anexado; las rutas excluidas y protegidas siguen sin estar disponibles.",
      "rawMaxTurns": "Limitar los turnos de conversación importados por sincronización. Los turnos restantes continúan en la siguiente pasada."
    }
  },
  "pt-BR": {
    "copy": {
      "nativeRequirement": "As conexões nativas do SnowLuma exigem o complemento nativo incluído neste pacote. Instalar apenas o SnowLuma não disponibiliza esta API.",
      "duplicateOwner": "Não permita que outro QQ World também receba mensagens privadas do mesmo proprietário; receptores duplicados criam dois canais.",
      "title": "Task Supervisor",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "Conecte o DSH e o Codex ao Coo e assuma o controle pelo QQ quando estiver fora.",
      "steps": [
        "Conectar",
        "Escolher escopo",
        "Recursos",
        "Verificar e aplicar"
      ],
      "stepNotes": [
        "Proprietário e serviços",
        "Espaços de trabalho e sessões",
        "Todos os recursos opcionais",
        "Validar, salvar e conectar"
      ],
      "loading": "Lendo a configuração…",
      "retry": "Ler novamente",
      "off": "Espera local",
      "on": "Relatos ativados",
      "offNote": "Os avisos importantes das tarefas ficam neste computador até você ativar os relatos.",
      "onNote": "São relatados apenas conclusões, falhas e problemas que precisam da sua atenção.",
      "queue": "Avisos na fila",
      "owner": "Número QQ do proprietário",
      "ownerHint": "Somente mensagens privadas desta conta podem ativar ou desativar os relatos com #@. Grupos e outras contas não podem fazer isso.",
      "toggleHint": "Na sua conversa privada do QQ, comece uma mensagem com #@ ou envie apenas #@ para ativar os relatos e liberar a fila. Envie novamente para desativar os relatos. A alternância não envia tarefas. Cada operação nativa ainda exige uma confirmação explícita, nova e separada.",
      "transport": "Conexão QQ",
      "native": "Conexão nativa do SnowLuma",
      "trusted": "QQ World existente (eventos privados confiáveis)",
      "onebot": "OneBot v11 (implantações existentes)",
      "qqEndpoint": "Endereço do serviço QQ",
      "qqAccount": "Número QQ do bot",
      "qqAccountHint": "A conta conectada ao SnowLuma, em vez da conta do proprietário.",
      "qqToken": "Credencial de conexão QQ",
      "tokenHint": "Deixe em branco para manter a credencial armazenada. Os valores salvos nunca são retornados.",
      "configured": "Armazenada",
      "unconfigured": "Não armazenada",
      "gateway": "Endereço do gateway de controle DSH",
      "gatewayHint": "Use o gateway de controle exposto pelo host DSH. Este World funciona em conjunto com o plugin do host.",
      "gatewayToken": "Credencial do gateway DSH",
      "connectionsNote": "As credenciais ficam neste computador. As verificações de conexão apenas leem: não enviam mensagens QQ nem executam tarefas.",
      "dshEnabled": "Conectar DSH",
      "codexEnabled": "Conectar Codex",
      "roots": "Espaços de trabalho permitidos",
      "rootsHint": "Um diretório por linha. Apenas o escopo que você listar estará disponível para o Coo.",
      "dshSessions": "Diretório de sessões DSH",
      "codexSessions": "Diretório de sessões Codex",
      "sessionsHint": "Usado para descobrir tarefas e ler o histórico. Mantenha o padrão para usar o local padrão neste computador.",
      "excluded": "Diretórios sempre excluídos",
      "excludedHint": "Um diretório por linha. Sessões, buscas e acesso a arquivos devem respeitar esses limites.",
      "files": "Permitir leitura de arquivos do espaço de trabalho",
      "filesHint": "Desativada por padrão. As leituras continuam respeitando o escopo permitido, as exclusões e o modo de relatos.",
      "fileRoots": "Diretórios de arquivos de projetos Codex",
      "fileRootsHint": "Obrigatórios para ler arquivos do Codex. Um diretório de projeto por linha, dentro de um espaço de trabalho Codex permitido acima. Unidades inteiras e diretórios pessoais não são aceitos.",
      "fileRootsRequired": "Primeiro escolha os diretórios de arquivos de projetos Codex em Escolher escopo.",
      "choose": "Escolher diretório",
      "addPath": "Adicionar diretório",
      "optionsNote": "Estes controles abrangem operações de conversas, Codex e memória DSH. A maioria das instalações precisa apenas das duas primeiras etapas.",
      "command": "Conversa privada QQ",
      "conversation": "Conversas e aprovações",
      "codex": "Leituras do Codex",
      "memory": "Memória DSH",
      "noOptions": "Não há configurações adicionais para este componente.",
      "optional": "Opcional",
      "addItem": "Adicionar item",
      "remove": "Remover",
      "statusSetup": "Configuração necessária",
      "statusStarting": "Iniciando",
      "statusOffline": "Desconectado",
      "checkTitle": "Verifique as conexões e depois salve",
      "checkNote": "As verificações usam este formulário. Execute-as novamente após fazer alterações. Ao salvar, as configurações são gravadas neste World.",
      "check": "Verificar conexões",
      "checkRunning": "Verificando…",
      "checksNone": "Esta configuração ainda não foi verificada.",
      "checksPassed": "A configuração atual foi verificada.",
      "checksFailed": "Algumas conexões precisam de atenção. Veja os resultados abaixo.",
      "checkStale": "A configuração mudou. Verifique novamente.",
      "save": "Salvar e aplicar",
      "saving": "Salvando…",
      "restart": "Reiniciar este World após salvar",
      "restartHint": "Recarrega apenas esta extensão para aplicar as novas conexões e o novo escopo.",
      "saved": "Configuração salva.",
      "savedRestart": "Configuração salva; foi solicitado o reinício do World.",
      "warnings": "Observações",
      "components": "Estado dos componentes",
      "gatewayTitle": "Conecte também o host DSH",
      "gatewayNote": "Gere o instalador, baixe-o e execute-o neste computador. Ele pede que você escolha DSH_HOME e um perfil e confirme antes de aplicar as alterações.",
      "generate": "Gerar instalador DSH",
      "generating": "Gerando…",
      "download": "Baixar instalador",
      "downloadLegacy": "Baixar instruções de conexão",
      "gatewayPrepared": "Instalador preparado. Ainda não foi instalado no DSH.",
      "gatewayLegacyPrepared": "Instruções de conexão preparadas. Ainda não foram instaladas no DSH.",
      "gatewaySteps": "Conclua estas etapas no DSH",
      "generatedNote": "O inicializador não contém credenciais e depende do kit privado neste computador. Execute-o localmente.",
      "kitDirectory": "Kit de instalação local",
      "runCommand": "Ou execute localmente em uma linha de comando",
      "privateKit": "A credencial permanece no kit local privado, fora do inicializador baixado. Depois, conclua a inicialização do DSH e verifique sua conexão.",
      "legacyKit": "Esta é uma especificação de conexão antiga. Gere-a novamente com uma versão que forneça o instalador; não é necessário editar JSON manualmente.",
      "back": "Voltar",
      "next": "Avançar",
      "fieldError": "Verifique o formulário: ",
      "invalidOwner": "Digite uma conta QQ numérica válida para o proprietário.",
      "invalidNumber": "Digite um número válido: ",
      "statusUnknown": "Não informado",
      "statusOk": "Pronto",
      "statusError": "Erro",
      "statusSkipped": "Ignorado",
      "statusStopped": "Parado",
      "version": "Versão da extensão",
      "savedLabel": "Configuração",
      "unsaved": "Alterações não salvas",
      "clean": "Configuração local carregada",
      "failed": "A operação falhou. Tente novamente.",
      "noGateway": "Nenhum arquivo de conexão foi gerado.",
      "optionalCredentials": "Avançado: um QQ World compatível deve fornecer eventos privados e respostas confiáveis. Esse plugin gerencia suas próprias credenciais.",
      "nativePrivateChannel": "Este World inclui o canal privado de tarefas: recebe comandos do proprietário pelo serviço QQ subjacente e responde com os resultados enquanto os relatos estão ativados.",
      "enableWorld": "Ativar este World",
      "stateDirectory": "Diretório local do estado de supervisão",
      "credentialReference": "Referência da credencial",
      "environmentTitle": "Instrução de ambiente",
      "environmentDescription": "Escopo das ferramentas, política de avisos de tarefas e limites das aprovações nativas.",
      "modeLabel": "Modo de relatos",
      "sourceDisabled": "Esta fonte está desativada.",
      "sourceReady": "O diretório da fonte existe. Nenhum conteúdo de conversa foi lido.",
      "sourceUnavailable": "O diretório da fonte está indisponível ou excluído.",
      "gatewayCheckOk": "O gateway autenticado de loopback e os escopos de projeto permitidos passaram nas verificações.",
      "gatewayCheckFailed": "A verificação do gateway falhou. Verifique o plugin DSH externo e sua credencial.",
      "gatewayMissingCredential": "Nenhuma credencial de gateway está armazenada. As fontes somente leitura ainda podem funcionar.",
      "qqRequired": "Digite o endereço do serviço QQ e a conta do bot.",
      "nativeCheckOk": "A identidade do SnowLuma e seu auxiliar de assinaturas aditivas foram verificados. A verificação não alterou nenhuma assinatura.",
      "nativeCheckFailed": "A verificação da identidade do SnowLuma ou do auxiliar falhou. Verifique endereço, conta e credencial e use o auxiliar incluído com assinaturas aditivas.",
      "onebotCheckNote": "Após a conexão, os quadros OneBot são verificados em relação à conta do bot e ao proprietário. Esta verificação não envia mensagens QQ.",
      "savedScopePending": "As alterações de permissão foram salvas e os componentes anteriores pararam imediatamente. Reinicie este World para ativar o novo escopo, que começa em OFF.",
      "savedConfigurationPending": "A configuração está salva. Os componentes em execução mantêm suas configurações anteriores até que este World seja reiniciado.",
      "additiveSubscriptions": "Este World adiciona a assinatura do proprietário sem substituir as assinaturas do SnowLuma usadas por outras conversas.",
      "offLimits": "Em OFF, as mensagens comuns do proprietário são ignoradas; um #@ original ainda alterna os relatos. OFF não apaga conteúdo já entregue nem cancela tarefas nativas já enviadas.",
      "scopeChanged": "Alterar o proprietário, as permissões das fontes, os diretórios raiz ou as exclusões cria um novo escopo em OFF e uma nova fila. Os diretórios de estado anteriores são mantidos; as tarefas nativas já enviadas continuam de forma independente.",
      "armInstruction": "Verifique as conexões, salve e aplique. Espere um segundo e envie um novo #@ privado para ativar os relatos; envie novamente para desativá-los.",
      "runKit": "Baixe e execute este inicializador uma vez no mesmo computador. Mantenha o kit privado no lugar até a instalação terminar.",
      "kitSelectProfile": "Escolha DSH_HOME e um perfil existente, como desktop. O instalador mostra os destinos YAML exatos e pede que você digite INSTALL.",
      "kitBackup": "O instalador preserva outros plugins e credenciais, faz backup dos arquivos existentes, usa bloqueios nativos de escrita e armazena a credencial sem exibi-la. Atualizar um gateway existente exige confirmação explícita.",
      "kitRestart": "Reinicie o host DSH selecionado e depois verifique aqui as conexões autenticadas. O instalador não inicia nem verifica um gateway em execução.",
      "codexOnlyControl": "O monitoramento somente leitura do Codex não precisa de um gateway DSH. O controle nativo do Codex também exige um transporte Codex compatível configurado explicitamente.",
      "kitSecurity": "O instalador local está preparado, mas não instalado. Seu kit privado contém uma credencial: não compartilhe o kit. O DSH deve carregar o plugin nativo; este World exige esse host separado.",
      "formRequired": "Forneça primeiro o formulário de configuração.",
      "actionUnsupported": "Esta ação de configuração não é compatível.",
      "installerNeedsScope": "Escolha o proprietário e pelo menos uma fonte de projeto explícita antes de gerar um instalador.",
      "gatewayCredentialInvalid": "A credencial do gateway deve conter pelo menos 32 caracteres sem espaços em branco.",
      "credentialInvalid": "Verifique o formato da credencial. Espaços em branco e valores com mais de 8192 caracteres não são aceitos.",
      "qqAccountInvalid": "Digite uma conta QQ numérica válida para o bot.",
      "invalidConfiguration": "Verifique o campo de configuração",
      "unsupportedOption": "Esta opção não é compatível",
      "invalidDirectory": "Escolha até 100 caminhos absolutos de diretórios válidos dentro do escopo permitido.",
      "invalidEndpoint": "Use um endereço IPv4 de loopback explícito e uma porta para o serviço selecionado.",
      "rootsRequired": "Escolha pelo menos um espaço de trabalho permitido para cada fonte ativada.",
      "componentIssue": "Este componente precisa de atenção. Verifique sua fonte, conexão e credencial.",
      "diagnosticCode": "Código de diagnóstico",
      "unknownDiagnostic": "O serviço informou um diagnóstico desconhecido. Verifique a conexão e o estado do componente.",
      "itemLabel": "Item",
      "readOnlyLabel": "Somente leitura",
      "unknownOption": "Configuração adicional",
      "modeWorkspace": "Espaços de trabalho",
      "modeMemory": "Memória externa",
      "policyImportant": "Conclusão e problemas que exigem atenção",
      "policyRecord": "Registrar localmente",
      "publicFinal": "Resultado final",
      "publicCommentary": "Progresso intermediário",
      "onOffLabel": "Estado dos relatos"
    },
    "labels": {
      "pollIntervalMs": "Intervalo de consulta ao gateway (ms)",
      "desktopProgressEnabled": "Coletar limites de tarefas DSH de desktop",
      "requestTimeoutMs": "Tempo limite das solicitações ao gateway (ms)",
      "eventTtlMs": "Validade das mensagens humanas (ms)",
      "selectionTtlMs": "Validade da seleção de destino (ms)",
      "includeSubagents": "Incluir tarefas de subagentes",
      "workspaceFileRoots": "Diretórios de arquivos de projetos",
      "workspaceMaxFileBytes": "Tamanho máximo de arquivo de texto (bytes)",
      "watchIntervalSeconds": "Intervalo de consulta (segundos)",
      "watchMaxItems": "Itens por consulta",
      "maxReadBytes": "Orçamento de leitura por página (bytes)",
      "maxScanBytes": "Orçamento de varredura por consulta (bytes)",
      "notificationPolicy": "Política de avisos de tarefas",
      "notifyPhases": "Fases de mensagens públicas",
      "notifyUserMessages": "Incluir mensagens públicas do usuário",
      "notifyLifecycle": "Incluir fatos do ciclo de vida nativo",
      "eventContentChars": "Limite de texto do evento (caracteres)",
      "sourceMode": "Modo de fonte DSH",
      "healthCheckIntervalSeconds": "Intervalo de verificação da fonte (segundos)",
      "writeMaxPerTick": "Escritas por lote",
      "queueMaxPending": "Máximo de escritas pendentes",
      "rawSyncIntervalSeconds": "Intervalo de sincronização de sessões originais (segundos)",
      "rawMaxSourceBytes": "Tamanho máximo da sessão original (bytes)",
      "dbFile": "Banco de dados de memória DSH",
      "allowedProjects": "Nomes de projetos permitidos",
      "includeGlobal": "Incluir camadas globais de memória",
      "levels": "Camadas de memória legíveis",
      "watchMaxPerTick": "Itens de memória por consulta",
      "watchContentChars": "Limite da prévia de memória (caracteres)",
      "writeEnabled": "Permitir escritas na memória externa",
      "writeFlushSeconds": "Intervalo da fila de escrita (segundos)",
      "writeLevels": "Camadas de memória graváveis",
      "writeSourceLabel": "Rótulo de origem das escritas externas",
      "rawEnabled": "Ativar espelhos das sessões originais",
      "rawDir": "Diretório local dos espelhos de sessões",
      "rawBuckets": "Compartimentos de espelho permitidos",
      "rawMaxTurns": "Máximo de turnos por sessão espelhada"
    },
    "hints": {
      "sourceMode": "O modo de espaço de trabalho permanece dentro do escopo de projeto selecionado. O modo de memória lê o banco de dados de memória externa DSH configurado.",
      "workspaceFileRoots": "Um diretório de projeto por linha, dentro de um espaço de trabalho Codex permitido. Unidades inteiras e diretórios pessoais são rejeitados.",
      "notificationPolicy": "São entregues apenas conclusões nativas ou problemas que exigem atenção humana. As etapas comuns ficam neste computador.",
      "allowedProjects": "Nomes exatos de projetos, separados por vírgulas. Esses nomes pertencem à fonte de memória externa.",
      "levels": "Nomes de camadas legíveis, separados por vírgulas.",
      "writeLevels": "Nomes de camadas graváveis, separados por vírgulas. As camadas globais soul e user não podem receber escritas.",
      "includeGlobal": "Permitir leituras de camadas globais no modo de memória. Desativado por padrão.",
      "writeEnabled": "Enfileirar entradas de memória externa com rótulo de origem no modo de memória. Uma entrada na fila ainda não é uma escrita durável verificada.",
      "rawEnabled": "Importar sessões originais higienizadas para um espelho local. Os diretórios de origem e as exclusões dos espaços de trabalho continuam valendo.",
      "rawBuckets": "Nomes de compartimentos separados por vírgulas. Deixe em branco para usar o escopo de origem configurado.",
      "watchIntervalSeconds": "Defina como zero para desativar as consultas em segundo plano. As leituras continuam disponíveis sob demanda enquanto a supervisão estiver ativada.",
      "desktopProgressEnabled": "Ler novos eventos nativos do DSH de desktop somente em espaços de trabalho autorizados. Nenhum destinatário QQ é inferido.",
      "workspaceMaxFileBytes": "Padrão: 1 MiB. Arquivos acima do limite são rejeitados, em vez de truncados e apresentados como completos.",
      "maxReadBytes": "O primeiro registro completo pode exceder este orçamento por página. O excesso e a varredura do prefixo de contexto são registrados separadamente.",
      "maxScanBytes": "O primeiro registro completo pode exceder este orçamento de varredura; a consulta então termina. A reprodução do contexto histórico é registrada separadamente.",
      "notifyPhases": "Identificadores de fase separados por vírgulas: commentary, final_answer, message. O texto intermediário permanece local até um limite importante da tarefa.",
      "healthCheckIntervalSeconds": "Verificar periodicamente a integridade da fonte, mesmo sem novos dados. Um sinal de atividade não implica progresso da tarefa.",
      "rawSyncIntervalSeconds": "Sincronizar em um processo de trabalho separado. Zero seleciona a sincronização manual. Mesmo sem novas sessões, o estado registra a hora da última verificação.",
      "rawMaxSourceBytes": "Limitar os bytes de origem lidos por sincronização. Um cursor ainda não concluído continua na próxima passagem.",
      "dbFile": "Caminho absoluto para o banco SQLite de memória externa DSH selecionado. Reinicie este World após alterá-lo.",
      "watchMaxPerTick": "Os itens acima deste limite ficam para a próxima consulta.",
      "watchContentChars": "Limitar cada prévia de memória. A ferramenta de leitura pode retornar o conteúdo completo da fonte enquanto o acesso a tarefas estiver ativado.",
      "writeFlushSeconds": "Processar a fila de escrita neste intervalo. Zero grava quando a operação é chamada.",
      "writeSourceLabel": "Armazenado em source_session para que o DSH possa identificar a origem externa.",
      "rawDir": "Diretório local para espelhos de sessões higienizadas. As entradas existentes são complementadas por anexação; caminhos excluídos e protegidos continuam indisponíveis.",
      "rawMaxTurns": "Limitar os turnos de conversa importados por sincronização. Os turnos restantes continuam na próxima passagem."
    }
  },
  "it": {
    "copy": {
      "nativeRequirement": "Le connessioni native SnowLuma richiedono il componente aggiuntivo nativo incluso in questo pacchetto. Installare solo SnowLuma non rende disponibile questa API.",
      "duplicateOwner": "Non consentire a un altro QQ World di ricevere anche i messaggi privati dello stesso proprietario: due ricevitori creano due canali.",
      "title": "Task Supervisor",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "Collega DSH e Codex a Coo, poi prendi il controllo tramite QQ quando sei fuori.",
      "steps": [
        "Collega",
        "Scegli l’ambito",
        "Funzioni",
        "Verifica e applica"
      ],
      "stepNotes": [
        "Proprietario e servizi",
        "Aree di lavoro e sessioni",
        "Tutte le funzioni facoltative",
        "Convalida, salva e collega"
      ],
      "loading": "Lettura della configurazione…",
      "retry": "Leggi di nuovo",
      "off": "Attesa locale",
      "on": "Segnalazioni attive",
      "offNote": "Gli avvisi importanti sulle attività restano locali finché non attivi le segnalazioni.",
      "onNote": "Vengono segnalati solo completamenti, errori e problemi che richiedono la tua attenzione.",
      "queue": "Avvisi in coda",
      "owner": "Numero QQ del proprietario",
      "ownerHint": "Solo i messaggi privati di questo account possono attivare o disattivare le segnalazioni con #@. I gruppi e gli altri account non possono farlo.",
      "toggleHint": "Nella tua chat privata QQ, inizia un messaggio con #@ o invia solo #@ per attivare le segnalazioni e inoltrare la coda. Invialo di nuovo per disattivare le segnalazioni. Il cambio di modalità non invia attività. Ogni operazione nativa richiede comunque una nuova conferma esplicita separata.",
      "transport": "Connessione QQ",
      "native": "Connessione nativa SnowLuma",
      "trusted": "QQ World esistente (eventi privati attendibili)",
      "onebot": "OneBot v11 (installazioni esistenti)",
      "qqEndpoint": "Indirizzo del servizio QQ",
      "qqAccount": "Numero QQ del bot",
      "qqAccountHint": "L’account connesso a SnowLuma, anziché quello del proprietario.",
      "qqToken": "Credenziale di connessione QQ",
      "tokenHint": "Lascia vuoto per mantenere la credenziale memorizzata. I valori salvati non vengono mai restituiti.",
      "configured": "Memorizzata",
      "unconfigured": "Non memorizzata",
      "gateway": "Indirizzo del gateway di controllo DSH",
      "gatewayHint": "Usa il gateway di controllo esposto dall’host DSH. Questo World funziona insieme al plugin dell’host.",
      "gatewayToken": "Credenziale del gateway DSH",
      "connectionsNote": "Le credenziali restano su questo computer. Le verifiche di connessione eseguono solo letture: non inviano messaggi QQ e non eseguono attività.",
      "dshEnabled": "Collega DSH",
      "codexEnabled": "Collega Codex",
      "roots": "Aree di lavoro consentite",
      "rootsHint": "Una directory per riga. Coo può accedere solo all’ambito che indichi.",
      "dshSessions": "Directory delle sessioni DSH",
      "codexSessions": "Directory delle sessioni Codex",
      "sessionsHint": "Serve a individuare le attività e leggere la cronologia. Mantieni il valore predefinito per usare il percorso locale standard.",
      "excluded": "Directory sempre escluse",
      "excludedHint": "Una directory per riga. Sessioni, ricerche e accessi ai file devono rispettare questi limiti.",
      "files": "Consenti la lettura dei file delle aree di lavoro",
      "filesHint": "Disattivata per impostazione predefinita. Le letture rispettano comunque l’ambito consentito, le esclusioni e la modalità di segnalazione.",
      "fileRoots": "Directory dei file di progetto Codex",
      "fileRootsHint": "Obbligatorie per leggere i file Codex. Una directory di progetto per riga, all’interno di un’area di lavoro Codex consentita sopra. Non sono ammesse unità intere o directory personali.",
      "fileRootsRequired": "Scegli prima le directory dei file di progetto Codex in Scegli l’ambito.",
      "choose": "Scegli directory",
      "addPath": "Aggiungi directory",
      "optionsNote": "Questi controlli riguardano le operazioni sulle conversazioni, Codex e la memoria DSH. Per la maggior parte delle installazioni bastano i primi due passaggi.",
      "command": "Chat privata QQ",
      "conversation": "Conversazioni e approvazioni",
      "codex": "Letture Codex",
      "memory": "Memoria DSH",
      "noOptions": "Nessuna impostazione aggiuntiva per questo componente.",
      "optional": "Facoltativo",
      "addItem": "Aggiungi elemento",
      "remove": "Rimuovi",
      "statusSetup": "Configurazione necessaria",
      "statusStarting": "Avvio in corso",
      "statusOffline": "Non connesso",
      "checkTitle": "Verifica le connessioni, poi salva",
      "checkNote": "Le verifiche usano questo modulo. Ripetile dopo ogni modifica. Il salvataggio scrive le impostazioni in questo World.",
      "check": "Verifica connessioni",
      "checkRunning": "Verifica in corso…",
      "checksNone": "Questa configurazione non è stata verificata.",
      "checksPassed": "La configurazione attuale è stata verificata.",
      "checksFailed": "Alcune connessioni richiedono attenzione. Consulta i risultati qui sotto.",
      "checkStale": "La configurazione è cambiata. Verifica di nuovo.",
      "save": "Salva e applica",
      "saving": "Salvataggio in corso…",
      "restart": "Riavvia questo World dopo il salvataggio",
      "restartHint": "Ricarica solo questa estensione per applicare le nuove connessioni e il nuovo ambito.",
      "saved": "Configurazione salvata.",
      "savedRestart": "Configurazione salvata; è stato richiesto il riavvio del World.",
      "warnings": "Note",
      "components": "Stato dei componenti",
      "gatewayTitle": "Collega anche l’host DSH",
      "gatewayNote": "Genera il programma di installazione, scaricalo ed eseguilo su questo computer. Ti chiede di scegliere DSH_HOME e un profilo, quindi di confermare prima di applicare le modifiche.",
      "generate": "Genera il programma di installazione DSH",
      "generating": "Generazione in corso…",
      "download": "Scarica il programma di installazione",
      "downloadLegacy": "Scarica le istruzioni di connessione",
      "gatewayPrepared": "Programma di installazione preparato. Non è ancora stato installato in DSH.",
      "gatewayLegacyPrepared": "Istruzioni di connessione preparate. Non sono ancora state installate in DSH.",
      "gatewaySteps": "Completa questi passaggi in DSH",
      "generatedNote": "Il programma di avvio non contiene credenziali e dipende dal kit privato presente su questo computer. Eseguilo localmente.",
      "kitDirectory": "Kit di installazione locale",
      "runCommand": "Oppure esegui localmente dalla riga di comando",
      "privateKit": "La credenziale resta nel kit locale privato, fuori dal programma di avvio scaricato. Completa poi l’avvio di DSH e la verifica della connessione.",
      "legacyKit": "Questa è una vecchia specifica di connessione. Generala di nuovo con una versione che fornisce il programma di installazione; non occorre modificare manualmente il JSON.",
      "back": "Indietro",
      "next": "Avanti",
      "fieldError": "Controlla il modulo: ",
      "invalidOwner": "Inserisci un account QQ numerico valido per il proprietario.",
      "invalidNumber": "Inserisci un numero valido: ",
      "statusUnknown": "Non segnalato",
      "statusOk": "Pronto",
      "statusError": "Errore",
      "statusSkipped": "Saltato",
      "statusStopped": "Arrestato",
      "version": "Versione dell’estensione",
      "savedLabel": "Configurazione",
      "unsaved": "Modifiche non salvate",
      "clean": "Configurazione locale caricata",
      "failed": "L’operazione non è riuscita. Riprova.",
      "noGateway": "Non è stato generato alcun file di connessione.",
      "optionalCredentials": "Avanzate: un QQ World compatibile deve fornire eventi privati e risposte attendibili. Quel plugin gestisce le proprie credenziali.",
      "nativePrivateChannel": "Questo World include il canale privato delle attività: riceve i comandi del proprietario tramite il servizio QQ sottostante e risponde con i risultati quando le segnalazioni sono attive.",
      "enableWorld": "Attiva questo World",
      "stateDirectory": "Directory locale dello stato di supervisione",
      "credentialReference": "Riferimento alla credenziale",
      "environmentTitle": "Istruzione dell’ambiente",
      "environmentDescription": "Ambito degli strumenti, criteri di notifica delle attività e limiti delle approvazioni native.",
      "modeLabel": "Modalità di segnalazione",
      "sourceDisabled": "Questa origine è disattivata.",
      "sourceReady": "La directory di origine esiste. Non è stato letto alcun contenuto delle conversazioni.",
      "sourceUnavailable": "La directory di origine non è disponibile oppure è esclusa.",
      "gatewayCheckOk": "Il gateway di loopback autenticato e gli ambiti di progetto consentiti hanno superato le verifiche.",
      "gatewayCheckFailed": "La verifica del gateway non è riuscita. Controlla il plugin DSH esterno e la relativa credenziale.",
      "gatewayMissingCredential": "Non è memorizzata alcuna credenziale del gateway. Le origini di sola lettura possono comunque funzionare.",
      "qqRequired": "Inserisci l’indirizzo del servizio QQ e l’account del bot.",
      "nativeCheckOk": "Sono stati verificati l’identità SnowLuma e il modulo ausiliario per le sottoscrizioni additive. La verifica non ha modificato le sottoscrizioni.",
      "nativeCheckFailed": "La verifica dell’identità SnowLuma o del modulo ausiliario non è riuscita. Controlla indirizzo, account e credenziale e usa il modulo incluso con le sottoscrizioni additive.",
      "onebotCheckNote": "Dopo la connessione, i frame OneBot vengono verificati rispetto all’account del bot e al proprietario. Questa verifica non invia messaggi QQ.",
      "savedScopePending": "Le modifiche ai permessi sono state salvate e i componenti precedenti si sono arrestati subito. Riavvia questo World per attivare il nuovo ambito, che parte in OFF.",
      "savedConfigurationPending": "La configurazione è salvata. I componenti in esecuzione mantengono le impostazioni precedenti fino al riavvio di questo World.",
      "additiveSubscriptions": "Questo World aggiunge la sottoscrizione del proprietario senza sostituire quelle SnowLuma usate da altre conversazioni.",
      "offLimits": "In OFF, i normali messaggi del proprietario vengono ignorati; un #@ originale continua ad attivare o disattivare le segnalazioni. OFF non elimina i contenuti già consegnati e non annulla le attività native già inviate.",
      "scopeChanged": "Modificare il proprietario, i permessi delle origini, le directory radice o le esclusioni crea un nuovo ambito in OFF e una nuova coda. Le directory di stato precedenti vengono conservate; le attività native già inviate proseguono autonomamente.",
      "armInstruction": "Verifica le connessioni, salva e applica. Attendi un secondo, poi invia un nuovo #@ privato per attivare le segnalazioni; invialo di nuovo per disattivarle.",
      "runKit": "Scarica ed esegui questo programma di avvio una volta sullo stesso computer. Lascia il kit privato al suo posto fino al termine dell’installazione.",
      "kitSelectProfile": "Scegli DSH_HOME e un profilo esistente, ad esempio desktop. Il programma di installazione mostra le destinazioni YAML esatte e ti chiede di digitare INSTALL.",
      "kitBackup": "Il programma di installazione preserva gli altri plugin e le credenziali, crea copie di backup dei file esistenti, usa blocchi di scrittura nativi e memorizza la credenziale senza mostrarla. L’aggiornamento di un gateway esistente richiede una conferma esplicita.",
      "kitRestart": "Riavvia l’host DSH selezionato, quindi verifica qui le connessioni autenticate. Il programma di installazione non avvia né verifica un gateway in esecuzione.",
      "codexOnlyControl": "Il monitoraggio Codex di sola lettura non richiede un gateway DSH. Il controllo nativo di Codex richiede anche un trasporto Codex supportato e configurato esplicitamente.",
      "kitSecurity": "Il programma di installazione locale è preparato, ma non installato. Il suo kit privato contiene una credenziale: non condividere il kit. DSH deve caricare il plugin nativo; questo World richiede quell’host separato.",
      "formRequired": "Fornisci prima il modulo di configurazione.",
      "actionUnsupported": "Questa azione di configurazione non è supportata.",
      "installerNeedsScope": "Scegli il proprietario e almeno un’origine di progetto esplicita prima di generare un programma di installazione.",
      "gatewayCredentialInvalid": "La credenziale del gateway deve contenere almeno 32 caratteri senza spazi bianchi.",
      "credentialInvalid": "Controlla il formato della credenziale. Non sono ammessi spazi bianchi o valori di oltre 8192 caratteri.",
      "qqAccountInvalid": "Inserisci un account QQ numerico valido per il bot.",
      "invalidConfiguration": "Controlla il campo di configurazione",
      "unsupportedOption": "Questa opzione non è supportata",
      "invalidDirectory": "Scegli fino a 100 percorsi assoluti di cartelle validi nell’ambito consentito.",
      "invalidEndpoint": "Usa un indirizzo IPv4 di loopback esplicito e una porta per il servizio selezionato.",
      "rootsRequired": "Scegli almeno un’area di lavoro consentita per ogni origine attiva.",
      "componentIssue": "Questo componente richiede attenzione. Controlla origine, connessione e credenziale.",
      "diagnosticCode": "Codice diagnostico",
      "unknownDiagnostic": "Il servizio ha segnalato un codice diagnostico sconosciuto. Controlla la connessione e lo stato del componente.",
      "itemLabel": "Elemento",
      "readOnlyLabel": "Sola lettura",
      "unknownOption": "Impostazione aggiuntiva",
      "modeWorkspace": "Aree di lavoro",
      "modeMemory": "Memoria esterna",
      "policyImportant": "Completamenti e problemi che richiedono attenzione",
      "policyRecord": "Registra localmente",
      "publicFinal": "Risultato finale",
      "publicCommentary": "Avanzamento intermedio",
      "onOffLabel": "Stato delle segnalazioni"
    },
    "labels": {
      "pollIntervalMs": "Intervallo di interrogazione del gateway (ms)",
      "desktopProgressEnabled": "Raccogli i limiti delle attività DSH desktop",
      "requestTimeoutMs": "Timeout delle richieste al gateway (ms)",
      "eventTtlMs": "Validità dei messaggi umani (ms)",
      "selectionTtlMs": "Validità della selezione della destinazione (ms)",
      "includeSubagents": "Includi le attività dei sottoagenti",
      "workspaceFileRoots": "Directory dei file di progetto",
      "workspaceMaxFileBytes": "Dimensione massima dei file di testo (byte)",
      "watchIntervalSeconds": "Intervallo di interrogazione (secondi)",
      "watchMaxItems": "Elementi per interrogazione",
      "maxReadBytes": "Budget di lettura per pagina (byte)",
      "maxScanBytes": "Budget di scansione per interrogazione (byte)",
      "notificationPolicy": "Criteri di notifica delle attività",
      "notifyPhases": "Fasi dei messaggi pubblici",
      "notifyUserMessages": "Includi i messaggi pubblici dell’utente",
      "notifyLifecycle": "Includi i fatti del ciclo di vita nativo",
      "eventContentChars": "Limite del testo degli eventi (caratteri)",
      "sourceMode": "Modalità di origine DSH",
      "healthCheckIntervalSeconds": "Intervallo di verifica dell’origine (secondi)",
      "writeMaxPerTick": "Scritture per gruppo",
      "queueMaxPending": "Numero massimo di scritture in attesa",
      "rawSyncIntervalSeconds": "Intervallo di sincronizzazione delle sessioni originali (secondi)",
      "rawMaxSourceBytes": "Dimensione massima delle sessioni originali (byte)",
      "dbFile": "Database della memoria DSH",
      "allowedProjects": "Nomi di progetto consentiti",
      "includeGlobal": "Includi i livelli di memoria globali",
      "levels": "Livelli di memoria leggibili",
      "watchMaxPerTick": "Elementi di memoria per interrogazione",
      "watchContentChars": "Limite dell’anteprima della memoria (caratteri)",
      "writeEnabled": "Consenti scritture nella memoria esterna",
      "writeFlushSeconds": "Intervallo della coda di scrittura (secondi)",
      "writeLevels": "Livelli di memoria scrivibili",
      "writeSourceLabel": "Etichetta di origine delle scritture esterne",
      "rawEnabled": "Attiva i mirror delle sessioni originali",
      "rawDir": "Directory locale dei mirror delle sessioni",
      "rawBuckets": "Contenitori mirror consentiti",
      "rawMaxTurns": "Numero massimo di turni per sessione replicata"
    },
    "hints": {
      "sourceMode": "La modalità area di lavoro resta nell’ambito del progetto selezionato. La modalità memoria legge il database di memoria esterna DSH configurato.",
      "workspaceFileRoots": "Una directory di progetto per riga, all’interno di un’area di lavoro Codex consentita. Le unità intere e le directory personali vengono rifiutate.",
      "notificationPolicy": "Vengono consegnati solo i completamenti nativi o i problemi che richiedono attenzione umana. I passaggi ordinari restano locali.",
      "allowedProjects": "Nomi di progetto esatti, separati da virgole. Questi nomi appartengono all’origine della memoria esterna.",
      "levels": "Nomi dei livelli leggibili, separati da virgole.",
      "writeLevels": "Nomi dei livelli scrivibili, separati da virgole. Non è possibile scrivere nei livelli globali soul e user.",
      "includeGlobal": "Consenti la lettura dei livelli di memoria globali in modalità memoria. Disattivata per impostazione predefinita.",
      "writeEnabled": "Accoda in modalità memoria le voci di memoria esterna con etichetta di origine. Una voce in coda non è ancora una scrittura duratura verificata.",
      "rawEnabled": "Importa le sessioni originali ripulite in un mirror locale. Restano validi i limiti delle directory di origine e le esclusioni delle aree di lavoro.",
      "rawBuckets": "Nomi dei contenitori separati da virgole. Lascia vuoto per usare l’ambito di origine configurato.",
      "watchIntervalSeconds": "Imposta zero per disattivare le interrogazioni in background. Le letture restano disponibili su richiesta mentre la supervisione è attiva.",
      "desktopProgressEnabled": "Leggi i nuovi eventi nativi DSH desktop solo nelle aree di lavoro autorizzate. Non viene dedotto alcun destinatario QQ.",
      "workspaceMaxFileBytes": "Valore predefinito: 1 MiB. I file oltre il limite vengono rifiutati, anziché troncati e presentati come completi.",
      "maxReadBytes": "Il primo record completo può superare questo budget per pagina. Il superamento e la scansione del prefisso di contesto vengono registrati separatamente.",
      "maxScanBytes": "Il primo record completo può superare questo budget di scansione; l’interrogazione termina quindi. La riproduzione del contesto storico viene registrata separatamente.",
      "notifyPhases": "Identificatori di fase separati da virgole: commentary, final_answer, message. Il testo intermedio resta locale fino a un limite importante dell’attività.",
      "healthCheckIntervalSeconds": "Verifica periodicamente lo stato dell’origine anche senza nuovi dati. Un segnale di presenza non implica avanzamento dell’attività.",
      "rawSyncIntervalSeconds": "Sincronizza in un processo di lavoro separato. Zero seleziona la sincronizzazione manuale. Anche senza nuove sessioni, lo stato registra l’ora dell’ultima verifica.",
      "rawMaxSourceBytes": "Limita i byte di origine letti per sincronizzazione. Un cursore non completato riprende al passaggio successivo.",
      "dbFile": "Percorso assoluto del database SQLite della memoria esterna DSH selezionato. Riavvia questo World dopo averlo modificato.",
      "watchMaxPerTick": "Gli elementi oltre questo limite restano per l’interrogazione successiva.",
      "watchContentChars": "Limita ogni anteprima della memoria. Lo strumento di lettura può restituire il contenuto completo dell’origine mentre l’accesso alle attività è attivo.",
      "writeFlushSeconds": "Elabora la coda di scrittura a questo intervallo. Zero scrive quando viene chiamata l’operazione.",
      "writeSourceLabel": "Memorizzata in source_session per consentire a DSH di identificare l’origine esterna.",
      "rawDir": "Directory locale dei mirror delle sessioni ripulite. Le voci esistenti vengono integrate in append; i percorsi esclusi e protetti restano inaccessibili.",
      "rawMaxTurns": "Limita i turni di conversazione importati per sincronizzazione. I turni rimanenti proseguono al passaggio successivo."
    }
  },
  "ru": {
    "copy": {
      "nativeRequirement": "Для нативного подключения SnowLuma нужно нативное дополнение из этого пакета. Установка только самой SnowLuma не предоставляет этот API.",
      "duplicateOwner": "Не включайте одновременное чтение личного чата этого владельца в другом QQ World: это создаст два канала обработки.",
      "title": "Управление задачами",
      "eyebrow": "TASK SUPERVISOR",
      "intro": "Подключите DSH и Codex к Coo, чтобы управлять работой через QQ вдали от компьютера.",
      "steps": [
        "Подключение",
        "Область доступа",
        "Возможности",
        "Проверка и применение"
      ],
      "stepNotes": [
        "Владелец и службы",
        "Рабочие каталоги и диалоги",
        "Все дополнительные функции",
        "Проверка, сохранение, подключение"
      ],
      "loading": "Чтение настроек…",
      "retry": "Прочитать снова",
      "off": "Локальное ожидание",
      "on": "Отчёты включены",
      "offNote": "Важные уведомления хранятся локально, пока вы не включите отчёты через QQ.",
      "onNote": "Сообщаются только завершение, ошибки и проблемы, требующие вашего внимания.",
      "queue": "Уведомления в очереди",
      "owner": "Номер QQ владельца",
      "ownerHint": "Переключить отчёты с помощью #@ могут только личные сообщения этой учётной записи. Группы и другие аккаунты не допускаются.",
      "toggleHint": "Начните личное сообщение в QQ с #@ или отправьте только #@, чтобы включить отчёты и передать накопленные уведомления. Повторная отправка выключает отчёты. Переключение режима не отправляет задачи. Каждая нативная операция по-прежнему требует отдельного нового явного подтверждения.",
      "transport": "Способ подключения QQ",
      "native": "Нативное подключение SnowLuma",
      "trusted": "Существующий QQ World (доверенные личные события)",
      "onebot": "OneBot v11 (совместимость с существующей установкой)",
      "qqEndpoint": "Адрес службы QQ",
      "qqAccount": "Номер QQ бота",
      "qqAccountHint": "Учётная запись бота, вошедшего в SnowLuma; она отличается от учётной записи владельца.",
      "qqToken": "Учётные данные подключения QQ",
      "tokenHint": "Оставьте поле пустым, чтобы сохранить прежние учётные данные. Сохранённые значения не возвращаются.",
      "configured": "Сохранены",
      "unconfigured": "Не сохранены",
      "gateway": "Адрес шлюза управления DSH",
      "gatewayHint": "Укажите шлюз управления, предоставленный хостом DSH. Этот World работает вместе с плагином хоста.",
      "gatewayToken": "Учётные данные шлюза DSH",
      "connectionsNote": "Учётные данные остаются на этом компьютере. Проверка соединений только читает данные: сообщения QQ не отправляются, задачи не запускаются.",
      "dshEnabled": "Подключить DSH",
      "codexEnabled": "Подключить Codex",
      "roots": "Разрешённые рабочие каталоги",
      "rootsHint": "Один каталог в строке. Coo получает доступ только к указанной области.",
      "dshSessions": "Каталог диалогов DSH",
      "codexSessions": "Каталог диалогов Codex",
      "sessionsHint": "Используется для поиска задач и чтения истории. Оставьте значение по умолчанию для стандартного локального каталога.",
      "excluded": "Всегда исключённые каталоги",
      "excludedHint": "Один каталог в строке. Эти границы действуют для диалогов, поиска и доступа к файлам.",
      "files": "Разрешить чтение файлов рабочих каталогов",
      "filesHint": "По умолчанию выключено. После включения сохраняются ограничения области доступа, исключений и режима отчётов.",
      "fileRoots": "Каталоги файлов проектов Codex",
      "fileRootsHint": "Обязательны для чтения файлов Codex. Укажите по одному каталогу проекта в строке внутри разрешённых выше рабочих каталогов Codex. Целые диски и домашние каталоги не допускаются.",
      "fileRootsRequired": "Сначала выберите каталоги файлов проектов Codex на шаге «Область доступа».",
      "choose": "Выбрать каталог",
      "addPath": "Добавить каталог",
      "optionsNote": "Настройки операций с диалогами, Codex и памятью DSH. Для большинства установок достаточно первых двух шагов.",
      "command": "Личный чат QQ",
      "conversation": "Диалоги и подтверждения",
      "codex": "Чтение Codex",
      "memory": "Память DSH",
      "noOptions": "У этого компонента нет дополнительных настроек.",
      "optional": "Необязательно",
      "addItem": "Добавить элемент",
      "remove": "Удалить",
      "statusSetup": "Нужна настройка",
      "statusStarting": "Запуск",
      "statusOffline": "Нет соединения",
      "checkTitle": "Проверьте соединения, затем сохраните",
      "checkNote": "Проверяется текущая форма. После изменения выполните проверку снова. Сохранение записывает настройки этого World.",
      "check": "Проверить соединения",
      "checkRunning": "Проверка…",
      "checksNone": "Текущие настройки ещё не проверены.",
      "checksPassed": "Проверка текущих настроек завершена.",
      "checksFailed": "Некоторые соединения требуют внимания. См. результаты ниже.",
      "checkStale": "Настройки изменены. Проверьте их снова.",
      "save": "Сохранить и применить",
      "saving": "Сохранение…",
      "restart": "Перезапустить этот World после сохранения",
      "restartHint": "Перезагрузить только это расширение для применения новых подключений и области доступа.",
      "saved": "Настройки сохранены.",
      "savedRestart": "Настройки сохранены; запрошен перезапуск этого World.",
      "warnings": "Примечания",
      "components": "Состояние компонентов",
      "gatewayTitle": "Подключите также хост DSH",
      "gatewayNote": "Создайте установщик, скачайте и запустите его на этом компьютере. Он предложит выбрать DSH_HOME и профиль, затем подтвердить изменения перед применением.",
      "generate": "Создать установщик DSH",
      "generating": "Создание…",
      "download": "Скачать установщик",
      "downloadLegacy": "Скачать инструкции подключения",
      "gatewayPrepared": "Установщик подготовлен. В DSH он ещё не установлен.",
      "gatewayLegacyPrepared": "Инструкции подключения подготовлены. Установка в DSH ещё не выполнена.",
      "gatewaySteps": "Дальнейшие действия в DSH",
      "generatedNote": "Средство запуска не содержит учётных данных и использует закрытый набор файлов на этом компьютере. Запускайте его локально.",
      "kitDirectory": "Локальный установочный набор",
      "runCommand": "Можно также запустить в локальной командной строке",
      "privateKit": "Учётные данные остаются в закрытом локальном наборе, отдельно от скачанного средства запуска. После этого необходимо запустить DSH и проверить соединение.",
      "legacyKit": "Это старый формат инструкции подключения. Создайте файлы снова в версии с установщиком; редактировать JSON вручную не требуется.",
      "back": "Назад",
      "next": "Далее",
      "fieldError": "Проверьте форму: ",
      "invalidOwner": "Введите корректный числовой номер QQ владельца.",
      "invalidNumber": "Введите корректное число: ",
      "statusUnknown": "Нет данных",
      "statusOk": "Готово",
      "statusError": "Ошибка",
      "statusSkipped": "Пропущено",
      "statusStopped": "Остановлено",
      "version": "Версия расширения",
      "savedLabel": "Состояние настроек",
      "unsaved": "Есть несохранённые изменения",
      "clean": "Локальные настройки прочитаны",
      "failed": "Операция не удалась. Попробуйте снова.",
      "noGateway": "Файл подключения ещё не создан.",
      "optionalCredentials": "Расширенный режим: нужен совместимый QQ World, предоставляющий доверенные личные события и ответы. Учётными данными управляет то расширение.",
      "nativePrivateChannel": "Этот World включает канал личного чата для задач: принимает команды владельца через базовую службу QQ и отвечает о результатах, пока отчёты включены.",
      "enableWorld": "Включить этот World",
      "stateDirectory": "Локальный каталог состояния управления задачами",
      "credentialReference": "Ссылка на учётные данные",
      "environmentTitle": "Промпт окружения",
      "environmentDescription": "Область инструментов, политика уведомлений и границы подтверждения нативных операций.",
      "modeLabel": "Режим отчётов",
      "sourceDisabled": "Этот источник отключён.",
      "sourceReady": "Каталог источника существует. Содержимое диалогов не читалось.",
      "sourceUnavailable": "Каталог источника недоступен или исключён.",
      "gatewayCheckOk": "Проверки аутентифицированного шлюза на локальном интерфейсе и разрешённых проектов завершились успешно.",
      "gatewayCheckFailed": "Проверка шлюза не удалась. Проверьте внешний плагин DSH и учётные данные.",
      "gatewayMissingCredential": "Учётные данные шлюза не сохранены. Источники только для чтения могут продолжать работу.",
      "qqRequired": "Введите адрес службы QQ и учётную запись бота.",
      "nativeCheckOk": "Проверены учётная запись SnowLuma и помощник добавления подписок. Проверка не меняла подписки.",
      "nativeCheckFailed": "Не удалось проверить учётную запись или помощник SnowLuma. Проверьте адрес, аккаунт и учётные данные; используйте комплектный помощник с добавлением подписок.",
      "onebotCheckNote": "После подключения кадры OneBot проверяются по учётным записям бота и владельца. Эта проверка не отправляет сообщения QQ.",
      "savedScopePending": "Изменения разрешений сохранены, прежние компоненты немедленно остановлены. Перезапустите этот World, чтобы активировать новую область с выключенными отчётами.",
      "savedConfigurationPending": "Настройки сохранены. Работающие компоненты используют прежнюю конфигурацию до перезапуска этого World.",
      "additiveSubscriptions": "Этот World добавляет подписку владельца, не заменяя подписки SnowLuma для других диалогов.",
      "offLimits": "При выключенных отчётах обычные сообщения владельца игнорируются, но исходная команда #@ продолжает переключать режим. Выключение не удаляет уже переданное содержимое и не отменяет отправленные нативные задачи.",
      "scopeChanged": "Изменение владельца, разрешений источников, корней или исключений создаёт новую область и очередь с выключенными отчётами. Прежние каталоги состояния сохраняются; уже отправленные нативные задачи продолжаются независимо.",
      "armInstruction": "Проверьте соединения, сохраните и примените настройки. Подождите одну секунду, затем отправьте новое личное сообщение #@, чтобы включить отчёты; повторная отправка их выключит.",
      "runKit": "Скачайте и один раз запустите это средство запуска на том же компьютере. До конца установки не перемещайте закрытый набор файлов.",
      "kitSelectProfile": "Выберите DSH_HOME и существующий профиль, например desktop. Установщик покажет точные целевые YAML-файлы и попросит ввести INSTALL.",
      "kitBackup": "Установщик сохраняет другие плагины и учётные данные, создаёт резервные копии существующих файлов, использует нативные блокировки записи и сохраняет учётные данные без показа. Обновление имеющегося шлюза требует явного подтверждения.",
      "kitRestart": "Перезапустите выбранный хост DSH и проверьте здесь аутентифицированные соединения. Установщик не запускает шлюз и не подтверждает его работу.",
      "codexOnlyControl": "Мониторингу Codex только для чтения шлюз DSH не нужен. Для нативного управления Codex дополнительно требуется явно настроенный поддерживаемый транспорт Codex.",
      "kitSecurity": "Локальный установщик подготовлен, но ещё не установлен. Закрытый набор содержит учётные данные: не передавайте его другим. DSH должен загрузить нативный плагин; этому World нужен отдельный хост.",
      "formRequired": "Сначала предоставьте форму настройки.",
      "actionUnsupported": "Это действие настройки не поддерживается.",
      "installerNeedsScope": "Перед созданием установщика выберите владельца и хотя бы один явно указанный источник проекта.",
      "gatewayCredentialInvalid": "Учётные данные шлюза должны содержать не менее 32 символов без пробельных знаков.",
      "credentialInvalid": "Проверьте формат учётных данных. Пробельные знаки и значения длиннее 8192 символов не допускаются.",
      "qqAccountInvalid": "Введите корректный числовой номер QQ бота.",
      "invalidConfiguration": "Проверьте поле настройки",
      "unsupportedOption": "Эта настройка не поддерживается",
      "invalidDirectory": "Выберите до 100 корректных абсолютных путей к каталогам в разрешённой области.",
      "invalidEndpoint": "Для выбранной службы явно укажите локальный IPv4-адрес обратной петли и порт.",
      "rootsRequired": "Выберите хотя бы один разрешённый рабочий каталог для каждого включённого источника.",
      "componentIssue": "Этот компонент требует внимания. Проверьте его источник, соединение и учётные данные.",
      "diagnosticCode": "Код диагностики",
      "unknownDiagnostic": "Служба вернула неизвестное диагностическое сообщение. Проверьте соединение и состояние компонентов.",
      "itemLabel": "Элемент",
      "readOnlyLabel": "Только чтение",
      "unknownOption": "Дополнительная настройка",
      "modeWorkspace": "Рабочие каталоги",
      "modeMemory": "Внешняя память",
      "policyImportant": "Завершение и проблемы, требующие внимания",
      "policyRecord": "Записывать локально",
      "publicFinal": "Итоговый результат",
      "publicCommentary": "Промежуточный ход работы",
      "onOffLabel": "Состояние отчётов"
    },
    "labels": {
      "pollIntervalMs": "Интервал проверки шлюза (мс)",
      "desktopProgressEnabled": "Собирать границы задач настольного DSH",
      "requestTimeoutMs": "Тайм-аут запроса к шлюзу (мс)",
      "eventTtlMs": "Срок действия сообщения человека (мс)",
      "selectionTtlMs": "Срок действия выбора цели (мс)",
      "includeSubagents": "Включать задачи субагентов",
      "workspaceFileRoots": "Каталоги файлов проектов",
      "workspaceMaxFileBytes": "Максимальный размер текстового файла (байты)",
      "watchIntervalSeconds": "Интервал опроса (секунды)",
      "watchMaxItems": "Максимум элементов за опрос",
      "maxReadBytes": "Бюджет чтения страницы (байты)",
      "maxScanBytes": "Бюджет сканирования за опрос (байты)",
      "notificationPolicy": "Политика уведомлений о задачах",
      "notifyPhases": "Собираемые фазы публичных сообщений",
      "notifyUserMessages": "Включать публичные сообщения пользователя",
      "notifyLifecycle": "Включать нативные факты жизненного цикла",
      "eventContentChars": "Лимит текста события (символы)",
      "sourceMode": "Режим источника DSH",
      "healthCheckIntervalSeconds": "Интервал проверки состояния источника (секунды)",
      "writeMaxPerTick": "Записей в одной партии",
      "queueMaxPending": "Максимум ожидающих записей",
      "rawSyncIntervalSeconds": "Интервал синхронизации исходных диалогов (секунды)",
      "rawMaxSourceBytes": "Максимальный размер исходного диалога (байты)",
      "dbFile": "База памяти DSH",
      "allowedProjects": "Разрешённые имена проектов",
      "includeGlobal": "Включать глобальные слои памяти",
      "levels": "Слои памяти для чтения",
      "watchMaxPerTick": "Элементов памяти за опрос",
      "watchContentChars": "Лимит предпросмотра памяти (символы)",
      "writeEnabled": "Разрешить запись во внешнюю память",
      "writeFlushSeconds": "Интервал обработки очереди записи (секунды)",
      "writeLevels": "Слои памяти для записи",
      "writeSourceLabel": "Метка внешнего источника записи",
      "rawEnabled": "Включить зеркала исходных диалогов",
      "rawDir": "Каталог локальных зеркал диалогов",
      "rawBuckets": "Разрешённые разделы зеркал",
      "rawMaxTurns": "Максимум ходов в зеркале диалога"
    },
    "hints": {
      "sourceMode": "Режим рабочих каталогов ограничен выбранными проектами. Режим памяти читает указанную внешнюю базу памяти DSH.",
      "workspaceFileRoots": "По одному каталогу проекта в строке внутри разрешённого рабочего каталога Codex. Целые диски и домашние каталоги не допускаются.",
      "notificationPolicy": "Передаются только нативное завершение и проблемы, требующие участия человека. Обычные шаги остаются локально.",
      "allowedProjects": "Точные имена проектов во внешнем источнике памяти, разделённые запятыми.",
      "levels": "Имена слоёв памяти для чтения, разделённые запятыми.",
      "writeLevels": "Имена слоёв для записи, разделённые запятыми. Глобальные слои soul и user недоступны для записи.",
      "includeGlobal": "Разрешить чтение глобальных слоёв в режиме памяти. По умолчанию выключено.",
      "writeEnabled": "В режиме памяти ставить в очередь внешние записи с меткой источника. Попадание в очередь ещё не подтверждает постоянную запись.",
      "rawEnabled": "Импортировать исходные диалоги с удалёнными секретами в локальное зеркало. Области источников и исключения рабочих каталогов сохраняются.",
      "rawBuckets": "Имена разделов через запятую. Пустое поле означает настроенную область источника.",
      "watchIntervalSeconds": "Ноль отключает фоновый опрос. Пока управление включено, чтение по запросу остаётся доступным.",
      "desktopProgressEnabled": "Читать новые нативные события настольного DSH только в разрешённых рабочих каталогах. Получатель QQ не определяется предположениями.",
      "workspaceMaxFileBytes": "По умолчанию 1 MiB. Слишком большие файлы отклоняются; усечённое содержимое не выдаётся за полный файл.",
      "maxReadBytes": "Первая полная запись может превысить бюджет страницы. Превышение и сканирование префикса контекста учитываются отдельно.",
      "maxScanBytes": "Первая полная запись может превысить бюджет сканирования; после неё текущий опрос заканчивается. Повторное чтение исторического контекста учитывается отдельно.",
      "notifyPhases": "Идентификаторы фаз commentary, final_answer, message через запятую. Промежуточный текст остаётся локально до важной границы задачи.",
      "healthCheckIntervalSeconds": "Периодически проверять состояние источника даже без новых данных. Сигнал доступности не означает прогресс задачи.",
      "rawSyncIntervalSeconds": "Синхронизация в отдельном Worker. Ноль включает ручной режим. При отсутствии новых диалогов всё равно записывается время последней проверки.",
      "rawMaxSourceBytes": "Ограничить число байтов источника за синхронизацию. Незавершённый курсор продолжит работу в следующем проходе.",
      "dbFile": "Абсолютный путь к выбранной SQLite-базе внешней памяти DSH. После изменения перезапустите этот World.",
      "watchMaxPerTick": "Элементы сверх лимита остаются до следующего опроса.",
      "watchContentChars": "Ограничить предпросмотр каждой записи памяти. При включённом доступе к задачам инструмент чтения может получить полный исходный текст.",
      "writeFlushSeconds": "Записывать очередь с указанным интервалом. При нуле запись выполняется при вызове операции.",
      "writeSourceLabel": "Сохраняется в source_session, чтобы DSH мог определить внешний источник.",
      "rawDir": "Локальный каталог зеркал диалогов с удалёнными секретами. Существующие записи только дополняются; исключённые и защищённые пути остаются недоступными.",
      "rawMaxTurns": "Ограничить число ходов диалога за синхронизацию. Остальные будут продолжены в следующем проходе."
    }
  }
};
const COPY = Object.fromEntries(Object.entries(UI_TRANSLATIONS).map(([language, table]) => [language, table.copy]));
const OPTION_LABELS = Object.fromEntries(Object.entries(UI_TRANSLATIONS).map(([language, table]) => [language, table.labels]));
const OPTION_HINTS = Object.fromEntries(Object.entries(UI_TRANSLATIONS).map(([language, table]) => [language, table.hints]));

export const UI_LANGUAGES = Object.freeze(['zh', 'zh-Hant', 'en', 'ja', 'ko', 'fr', 'de', 'es-419', 'pt-BR', 'it', 'ru']);

function canonicalLanguage(value) {
  if (value && typeof value === 'object') value = value.language;
  if (typeof value !== 'string') return null;
  const locale = value.trim().replaceAll('_', '-').toLowerCase();
  if (/^zh(?:-|$)/.test(locale)) return /(?:^|-)(?:hant|tw|hk|mo)(?:-|$)/.test(locale) ? 'zh-Hant' : 'zh';
  if (/^es(?:-|$)/.test(locale)) return 'es-419';
  if (/^pt(?:-|$)/.test(locale)) return 'pt-BR';
  return UI_LANGUAGES.find(language => language.toLowerCase() === locale || locale.startsWith(`${language.toLowerCase()}-`)) || null;
}

export function selectLanguage(language) { return canonicalLanguage(language) || 'en'; }

export function uiCopy(language) {
  const copy = COPY[selectLanguage(language)];
  return { ...copy, metadataConfigTitle: copy.title, metadataPanelTitle: copy.title,
    metadataPanelDescription: copy.intro, metadataPromptTitle: copy.environmentTitle,
    metadataPromptDescription: copy.environmentDescription, metadataOwnerDescription: copy.owner,
    metadataModeDescription: copy.modeLabel };
}

export function uiFieldLabel(key, language) {
  const locale = selectLanguage(language), t = COPY[locale];
  key = String(key).split('.').at(-1);
  const root = { enabled: t.enableWorld, ownerQQ: t.owner, commandTransport: t.transport,
    qqEndpoint: t.qqEndpoint, qqAccountId: t.qqAccount, qqTokenSecret: `${t.qqToken} · ${t.credentialReference}`,
    gatewayEndpoint: t.gateway, gatewayTokenSecret: `${t.gatewayToken} · ${t.credentialReference}`,
    dshEnabled: t.dshEnabled, codexEnabled: t.codexEnabled, dshWorkspaceRoots: `DSH · ${t.roots}`,
    codexWorkspaceRoots: `Codex · ${t.roots}`, excludedRoots: t.excluded, dshSessionsDir: t.dshSessions,
    codexSessionsDir: t.codexSessions, workspaceFilesEnabled: t.files, stateDir: t.stateDirectory,
    conversationOptions: t.conversation, codexOptions: t.codex, memoryOptions: t.memory };
  return root[key] || OPTION_LABELS[locale]?.[key] || key;
}

export function uiOptionHint(key, language) { return OPTION_HINTS[selectLanguage(language)]?.[String(key).split('.').at(-1)] || ''; }

export function uiEnumLabel(value, language) {
  const t = COPY[selectLanguage(language)];
  return ({ workspace: t.modeWorkspace, memory: t.modeMemory, important: t.policyImportant,
    record: t.policyRecord, final_answer: t.publicFinal, commentary: t.publicCommentary })[value] || String(value);
}

const DIAGNOSTIC_MESSAGES = {
  'Install the host plugin.': 'gatewayHint',
  'Source disabled.': 'sourceDisabled',
  'Source directory exists; no conversation content was read.': 'sourceReady',
  'Source directory is unavailable or excluded.': 'sourceUnavailable',
  'Authenticated loopback gateway health and project scope checks succeeded.': 'gatewayCheckOk',
  'Gateway health failed; verify the external DSH plugin and credential.': 'gatewayCheckFailed',
  'Gateway credential not configured; read-only sources can still operate.': 'gatewayMissingCredential',
  'Requires a QQ extension producing trusted native taskReportingCommand metadata. Rendered text is never accepted.': 'optionalCredentials',
  'QQ endpoint and bot account are required.': 'qqRequired',
  'Authenticated SnowLuma identity and additive-subscription helper matched. This check did not change subscriptions.': 'nativeCheckOk',
  'SnowLuma identity/helper check failed. Verify endpoint, account and credential, and use the bundled helper with additive subscriptions.': 'nativeCheckFailed',
  'OneBot command frames are checked against configured self_id and the owner after connection; no QQ message is sent.': 'onebotCheckNote',
  'Saved permission changes stopped the previous components immediately. Restart is required to activate the new OFF scope.': 'savedScopePending',
  'Permission changes were saved and previous components stopped. Restart to activate the new OFF scope.': 'savedScopePending',
  'Configuration was saved; running components keep their previous configuration until this World is restarted.': 'savedConfigurationPending',
  'Advanced reuse mode needs an existing QQ extension providing trusted raw command metadata and owner replies.': 'optionalCredentials',
  'Raw transport includes the owner private chat channel and ON-only owner replies. Do not also monitor the same owner in another QQ World; this package never replaces SnowLuma shared subscriptions.': ['nativePrivateChannel', 'duplicateOwner', 'additiveSubscriptions'],
  'While OFF, ordinary owner chat is ignored; the original #@ command still toggles supervision. OFF cannot erase previously delivered content or cancel submitted native operations.': 'offLimits',
  'Changing owner, source permissions, roots or exclusions creates a separate fresh OFF scope and queue. Previous state directories are retained; previously submitted native tasks continue independently.': 'scopeChanged',
  'Choose the owner private QQ account and a raw transport, or explicitly select advanced QQ-extension reuse.': ['ownerHint', 'optionalCredentials'],
  'Choose explicit DSH/Codex workspace roots and exclusions.': ['rootsHint', 'excludedHint'],
  'Save credentials in the World panel; install the generated gateway in the external DSH host when native control is required.': ['tokenHint', 'gatewayHint'],
  'Check connections, save and apply. Wait one second, then send a new private #@ to enable; repeat to close.': 'armInstruction',
  'Installer prepared locally; not installed yet. The kit contains a private credential. Do not share it. DSH must load this native plugin; the Cortico World cannot replace that host.': 'kitSecurity',
  'Download and run this launcher once on the same computer. Keep the private kit in place until installation finishes.': 'runKit',
  'Choose DSH_HOME and an existing profile such as desktop. The installer displays the exact YAML targets and asks for INSTALL.': 'kitSelectProfile',
  'The installer preserves other plugins and credentials, backs up existing files, uses native writer locks and writes the managed credential without showing it. Existing gateway definitions require an explicit update confirmation.': 'kitBackup',
  'Restart the selected DSH host, then check authenticated connections here. The installer does not claim a running gateway.': 'kitRestart',
  'Codex-only readers need no DSH gateway; native Codex control additionally needs an explicitly configured supported Codex transport.': 'codexOnlyControl',
  'Setup form required.': 'formRequired', 'Setup form is required.': 'formRequired',
  'Unsupported setup field.': 'actionUnsupported', 'Unsupported panel.': 'actionUnsupported', 'Unsupported method.': 'actionUnsupported',
  'Owner QQ is required.': 'invalidOwner', 'ownerQQ must be a QQ number string.': 'invalidOwner',
  'qqAccountId must be a QQ number string.': 'qqAccountInvalid',
  'Invalid secret value.': 'credentialInvalid',
  'Choose an owner and at least one explicit project source before preparing an installer.': 'installerNeedsScope',
  'Gateway credential must contain at least 32 non-whitespace characters.': 'gatewayCredentialInvalid',
  'DSH requires explicit workspace roots.': 'rootsRequired', 'Codex requires explicit workspace roots.': 'rootsRequired',
  'QQ bot account and owner must be distinct numeric IDs.': ['qqAccountInvalid', 'qqAccountHint'],
};

export function localizeUiMessage(message, language, secrets = {}) {
  const locale = selectLanguage(language), t = COPY[locale];
  const text = redactUiMessage(message instanceof Error ? message.message : message, secrets);
  if (!text) return t.failed;
  const values = Object.values(t).flat();
  if (values.includes(text) || [t.invalidNumber, t.invalidConfiguration, t.unsupportedOption].some(prefix => text.startsWith(prefix))) return text;
  const keys = DIAGNOSTIC_MESSAGES[text];
  if (keys) return (Array.isArray(keys) ? keys : [keys]).map(key => t[key]).join(' ');
  if (/^[A-Z][A-Z0-9_.:-]{2,100}$/.test(text)) return `${t.componentIssue} ${t.diagnosticCode}: ${text}`;
  let match = text.match(/^Unsupported (?:conversation|codex|memory) option: ([A-Za-z][A-Za-z0-9_.-]*)\.$/);
  if (match) return `${t.unsupportedOption}: ${uiFieldLabel(match[1], locale)}`;
  match = text.match(/^Invalid (?:(?:conversation|codex|memory) option type: |)([A-Za-z][A-Za-z0-9_.-]*)(?: object| credential reference)?\.$/);
  if (match) return `${t.invalidConfiguration}: ${uiFieldLabel(match[1], locale)}`;
  if (/requires up to 100 absolute directory paths\.$/.test(text)) return t.invalidDirectory;
  if (/^Invalid (?:native|onebot|gateway) endpoint:/.test(text)) return t.invalidEndpoint;
  return locale === 'en' ? text : t.unknownDiagnostic;
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
  const language = [ctx.language, ctx.host?.language, ctx.host?.locale, ctx.locale].map(canonicalLanguage).find(Boolean) || 'en';
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
  shell.lang = language === 'zh' ? 'zh-CN' : language;
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
    return localizeUiMessage(error || t.failed, language, credentials);
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
    const fieldKey = schemaPath(key).at(-1);
    const localizedTitle = typeof schema?.title === 'object' ? schema.title[language] : '';
    const title = OPTION_LABELS[language]?.[fieldKey] || localizedTitle
      || (language === 'en' && !/[\u3400-\u9fff]/.test(declaredTitle) ? declaredTitle : '')
      || (/^\d+$/.test(key) ? `${t.itemLabel} ${key}` : `${t.unknownOption} · ${fieldKey}`);
    const localizedDescription = typeof schema?.description === 'object' ? schema.description[language] : '';
    const description = uiOptionHint(fieldKey, language) || localizedDescription
      || (language === 'en' && !/[\u3400-\u9fff]/.test(declaredDescription) ? declaredDescription : '');
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
        const option = element('option', '', uiEnumLabel(item, language));
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
    return ({ ok: t.statusOk, ready: t.statusOk, running: t.statusOk, error: t.statusError, failed: t.statusError, skipped: t.statusSkipped, stopped: t.statusStopped, disabled: t.statusStopped, 'setup-required': t.statusSetup, starting: t.statusStarting, offline: t.statusOffline })[value] || t.statusUnknown;
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
      const checkTitle = ({ dshSessions: t.dshSessions, codexSessions: t.codexSessions, gateway: t.gateway, qq: t.command })[check.id] || uiFieldLabel(check.id, language);
      row.append(element('span', 'ts-result-mark', statusText(check.status)), element('strong', '', checkTitle), element('p', '', errorMessage(check.message)));
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
      gateway.append(download, element('p', 'ts-hint', state.generated.warning ? errorMessage(state.generated.warning) : t.generatedNote));
      if (installer) {
        gateway.append(element('p', 'ts-hint', t.privateKit));
        if (state.generated.kitDirectory) {
          gateway.append(element('h3', '', t.kitDirectory), element('code', 'ts-local-path', redactUiMessage(state.generated.kitDirectory, credentials)));
        }
        if (state.generated.runCommand) {
          gateway.append(element('h3', '', t.runCommand), element('code', 'ts-local-path', redactUiMessage(state.generated.runCommand, credentials)));
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
