Owner: `src/definition.ts`, `src/world.ts`, `console.js`.

# Task Supervisor / 任务监管

One Cortico World for DSH and Codex task notifications, scoped source reads and authorized conversation control. Includes a setup guide and an owner-only QQ task channel. / 一个 World 集成 DSH、Codex 任务通知、限定范围的内容读取与授权会话控制，自带配置向导和本人 QQ 任务私聊通道。

This extension reads selected local conversations and can ask coding agents to execute work with their native permissions. Delivered content reaches your configured model service. Select only the projects you want to share; keep the gateway on loopback. / 本扩展会读取你选中的本机会话，并能让编码工具按原有权限执行工作。投递内容会进入你配置的模型服务。请在向导里明确选择工作区和排除目录，网关保持本机回环地址。

## Install / 安装

The setup page supports all eleven host languages in one bundled client asset: Simplified Chinese (`zh`), Traditional Chinese (`zh-Hant`), English (`en`), Japanese (`ja`), Korean (`ko`), French (`fr`), German (`de`), Latin American Spanish (`es-419`), Brazilian Portuguese (`pt-BR`), Italian (`it`) and Russian (`ru`). It follows the host language and recognized locale variants; unsupported locales fall back to English. Labels, typed advanced settings, status, connection diagnostics and installer guidance are localized. Technical identifiers, paths, commands and model-facing tool text retain their original meaning. Unexpected service diagnostics show a localized notice. The API 6 package metadata still declares only its supported `zh`/`en` locale keys. / 配置页在单一客户端文件内支持宿主的全部十一种语言：简体中文、繁体中文、英语、日语、韩语、法语、德语、拉美西班牙语、巴西葡萄牙语、意大利语和俄语。页面跟随宿主语言并识别地区变体，未支持的语言回退到英语。界面标签、高级配置、状态、连接诊断与安装引导均有对应译文；技术标识、路径、命令和面向模型的工具文本保留原有语义。无法识别的服务诊断会显示本地化提示。API 6 的包元数据仍只声明该契约支持的 `zh`/`en` 语言键。

The community package is `cortico-world-task-supervisor`, version `0.1.0-preview.2`, World API **6**. It targets the API used by Coopanion **0.2.8**, whose Cortico source is **0.2.6**. Use Node **24** for the separate DSH gateway installer. Native desktop Codex control is a version-pinned Windows adapter; it requires a compatible running native application, not just a rollout directory. / 社区包名为 `cortico-world-task-supervisor`，版本 `0.1.0-preview.2`，使用 World API **6**。适配目标为 Coopanion **0.2.8** 使用的 Cortico **0.2.6** 接口。独立 DSH 网关安装器使用 Node **24**。桌面 Codex 原生控制绑定 Windows 应用版本与进程，需要兼容且正在运行的原生应用；仅有会话文件不代表具备控制能力。

Isolated API 6 World assembly and mounting also passed with YuZhou's Coopanion fork at `main@ff30069d`, using its pinned Cortico `087289df` (**0.2.3**). This verifies the World integration boundary; full Electron startup and real QQ execution were not exercised in that check. / 同时已在 YuZhou 的 Coopanion 分支 `main@ff30069d`、其固定 Cortico `087289df`（**0.2.3**）上通过隔离的 API 6 World 装配与挂载检查。该结果确认 World 接口兼容；这项检查未覆盖完整 Electron 启动或真人 QQ 执行。

After npm publication, install it from Coopanion's **Advanced mode → Extensions**, restart the process, enable **Task Supervisor** in World Overview and open its page. Before publication, use the Extensions page's local-directory installer with this repository root, after building it. / npm 发布后，在 Coopanion **高级模式 → 扩展** 中安装，重启进程，在 **World 总览** 启用 Task Supervisor，再打开它的页面。发布前可构建仓库，然后通过扩展页的本机目录安装方式选择本仓库根目录。

The three older bridge Worlds do not need to be installed. The aggregate bundles their source modules without registering extra Worlds. / 无须另外安装原来的三个桥接 World；本包内置它们的源码模块，只注册一个 World。

## Set up in the World / 在 World 内完成配置

1. **Connect services / 连接服务**: enter your QQ number, select the bottom-level QQ service and enter its loopback address, bot account and credential. SnowLuma native and OneBot v11 are supported. Existing-QQ-World trusted metadata is an advanced alternative. Credentials are stored by the host and never returned by the setup API. / 填写本人 QQ 号，选择底层 QQ 服务，填写本机连接地址、机器人账号和凭证。支持 SnowLuma 原生连接与 OneBot v11；已有 QQ World 的可信元数据方式属于进阶选项。凭证交给宿主保存，配置接口不返回凭证值。
2. **Select scope / 选择范围**: choose the DSH/Codex workspaces and conversation directories with directory pickers. Add private directories to the exclusion list. Optional project-file reads start disabled. / 使用目录选择器指定 DSH、Codex 工作区与会话目录，填写需要排除的私人目录。项目文件读取默认关闭。
3. **Choose functions / 功能设置**: the page exposes the conversation, Codex and memory options as individual controls. DSH supports workspace mode and the existing external-memory mode; file reads, raw mirrors and external-memory writes retain their separate options. / 页面将会话控制、Codex、DSH 外部记忆的可选配置逐项显示，无须编写 JSON。DSH 保留工作区模式与既有外部记忆模式，文件读取、原文镜像和外部记忆写入分别设置。
4. **Check and apply / 检查与应用**: run the connection checks, save and restart when requested. If the DSH gateway is missing, generate the local installation kit from this page and follow its installation guide. Generated files are labelled **not installed** until the separate DSH host is configured and its authenticated health check succeeds. / 检查连接后保存，按页面提示重启。如果缺少 DSH 网关，在本页生成本机安装工具并按引导安装。文件生成后仍明确显示 **尚未安装**；只有独立 DSH 宿主配置完成、带凭证检查通过，才表示连接可用。

The gateway must run inside the real DSH host because it uses native session lifecycle services. The Coo World cannot replace that host. The installer keeps the token out of `.env`, backs up existing configuration and preserves unrelated credential references and plugins. / 网关使用 DSH 原生会话生命周期服务，必须运行在真实 DSH 宿主中。Coo 中的 World 不能代替它。安装工具将 token 写入 DSH 受管凭据，备份已有配置，并保留其他凭据引用及插件。

## QQ switch / QQ 开关

Supervision starts **OFF**. In a real private message from the configured owner, send either:

```text
#@
```

or place it at the literal beginning of the original text:

```text
#@我离开电脑了，开始监管。
```

Send the prefix again to turn supervision OFF. A leading space, a quote/reply/forward before the text, a marker in the middle of a message, a group message or another account does not toggle it. Duplicate platform message IDs toggle only once. The switch survives process restarts. / 监管默认 **关闭**。仅配置的本人账号在真实私聊中单独发送 `#@`，或把它放在原始文字最开头，才能切换；再次发送则关闭。前置空格、引用或转发、正文中间的标记、群聊和其他账号无效。同一平台消息重复到达只切换一次，重启保持原状态。

**ON:** inject important backlog, then deliver new completion, failure, blocking and approval/user-action facts. Raw QQ transport mode also receives the owner's task messages and exposes a reply tool fixed to that same private chat. **OFF:** keep important facts locally and refuse new task reads/control and task-channel sends. Existing native work continues. / **开启后**，先补投重要积压，再持续投递任务完成、失败、阻塞、待批准或待处理事件。原生 QQ 通道同时接收本人的任务指令，并提供只发回同一私聊的回复工具。**关闭后**，重要事实继续本地积压，拒绝新的任务读取、控制及任务私聊发送；已经开始的原生工作继续执行。

Started/running steps, ordinary commentary and an assistant's final prose without native completion evidence are not task notifications. A native turn ending while tracked background jobs remain active does not finish the operation. The switch does not approve individual operations: native controls still use an exact target, a draft and a newer human confirmation. / 开始、运行中、普通中间说明，以及缺少原生完成证据的最终文字，都不会成为任务通知。已跟踪后台作业尚未结束时，不会提前完成操作。开关不代替具体操作批准：原生控制仍需明确目标、草稿和更新的人类确认。

## What is included / 全量功能

| Component / 组件 | Functions / 功能 |
| --- | --- |
| Conversation control / 会话控制 | Find, select, draft, confirm and reconcile existing DSH/Codex conversations; preserve operation IDs and native terminal evidence. / 查找、选择、起草、确认与对账，保留操作身份及原生终态证据。 |
| Codex source / Codex 来源 | Scoped public conversation reads and searches, important native lifecycle notifications, optional read-only project-file access. / 限定范围的公开会话读取与搜索、重要原生状态通知、可选的项目文件只读访问。 |
| DSH source / DSH 来源 | Workspace conversation reads, source-labelled raw mirrors, optional project-file reads and the existing scoped external-memory read/write queue. / 工作区会话、带来源的原文镜像、可选项目文件读取，以及既有外部记忆的限定读取与写入队列。 |
| Reporting gate / 汇报开关 | Persistent OFF/ON, durable important outbox, source timestamps and delivery deduplication. / 持久开关、重要事件队列、来源时间和投递去重。 |
| QQ task channel / QQ 任务私聊 | Real owner-only private input and fixed-owner replies over the configured local transport; optional reuse of a compatible QQ World. / 经本机底层服务收取本人真实私聊并固定回复本人，也可进阶复用兼容 QQ World。 |
| Setup / 配置 | In-World guide, typed controls, path pickers, secret storage, scope/connection checks and DSH installation guidance. / 内置向导、具体配置控件、目录选择、凭证保存、范围与连接检查、DSH 安装引导。 |

External DSH records remain external source data. They are not merged into the bot's native Memory and never grant command authority. Directory scope is not an operating-system sandbox for commands submitted to a coding agent. / DSH 记录始终保留外部来源身份，不自动并入 bot 原生 Memory，也不授予命令权限。目录范围检查不能代替编码工具执行命令时的操作系统沙箱。

## Build and verify / 构建与验证

```sh
npm install
npm run build
```

For SDK integration tests, set `CORTICO_DIR` to a compatible Cortico source checkout. `CORTICO_TOOLCHAIN_ROOT` may point at an existing checkout whose development dependencies are installed; otherwise use this package's development dependencies. An optional `DSH_SOURCE_ROOT` enables native prepared-session tests against a local DSH source checkout. These tests use synthetic data. / SDK 集成测试需将 `CORTICO_DIR` 指向兼容的 Cortico 源码。可用 `CORTICO_TOOLCHAIN_ROOT` 复用已有开发依赖，否则使用本包依赖。可选的 `DSH_SOURCE_ROOT` 用于原生会话测试，测试仅使用合成数据。

```sh
npm test
npm run typecheck
```

Then run the host's `scripts/extension-check.ts` against the built package. The package uses API 6 `webUi()`, `webUiClient` and exported self-description metadata. / 构建后，再通过宿主的 `scripts/extension-check.ts` 检查本包。接口使用 API 6 的 `webUi()`、`webUiClient` 与自描述元数据。

This is a preview release. Local fixture tests, extension checks, a real isolated host mount, a live QQ deployment and prolonged stability are separate validation stages. Check the release's validation record for completed stages; passing source tests alone is not a claim of live QQ or prolonged stability. / 这是测试版。合成测试、扩展契约、真实隔离宿主挂载、真人 QQ 部署和长时间稳定性分别验收；请以对应版本的验收记录为准。

Source provenance is in [SOURCES.md](SOURCES.md); data and credential boundaries are in [SECURITY.md](SECURITY.md). / 来源见 [SOURCES.md](SOURCES.md)，数据与凭据边界见 [SECURITY.md](SECURITY.md)。
