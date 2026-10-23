# dsh，codex等工作agent的实时汇报与控制桥

**DSH、CODEX CONTRLO WORLD**

离开电脑后，通过本人 QQ 私聊获知编码任务的重要变化，并按明确授权继续处理工作。本项目是**独立维护的第三方 World API 6 扩展**，将 dsh/codex 等工作 agent 的任务通知、授权会话控制、限定范围的内容读取和 QQ 任务私聊整合在一个 World 内。

中文名与英文名按以上原样使用；英文品牌中的 `CONTRLO` 为正式拼写。技术包名仍为 `cortico-world-task-supervisor`，World ID 仍为 `tasksupervisor`，工具与事件 ID 保持原值。来源文件、NOTICE 与 vendor 原文保留历史称谓和归属；其中 Task Supervisor 为旧称或技术标记，不改变本项目现正式名称。

## 安装与四步配置

当前版本为 **0.1.0-preview.3**。在支持 World API 6 的 Coo/Cortico 扩展页，使用技术包名 `cortico-world-task-supervisor` 安装对应版本；Coo 的入口是“高级模式 → 扩展”。启用这个 World 后打开配置页。源码本机安装需先按下文构建，再用扩展页的本机目录安装方式选择项目根目录。候选文件存在、构建通过、npm 发布和正式启用是分别确认的阶段，请以对应版本的发行记录和注册表为准。

1. **连接服务**：填写本人 QQ 号，选择本机 QQ 底层服务并填写连接地址、账号与凭证。凭证交给宿主保存，配置接口不返回凭证值。SnowLuma 原生连接、OneBot v11 是可选传输；进阶方式可复用兼容 QQ World 的可信元数据。
2. **选择范围**：使用目录选择器指定 dsh/codex 工作区与会话目录，加入需要排除的私人目录。项目文件读取默认关闭。
3. **功能设置**：在面板内选择监看、读取、原文镜像或限定的外部记忆写入等能力，无须手改 JSON。只做 codex 只读监看时，可不启用 dsh 或配置其网关；原生控制仍需相应应用与网关就绪。
4. **检查与应用**：检查连接、保存并按提示重启。需要 dsh 控制时，在本页生成私密安装器和启动器，在本机选择 DSH_HOME/profile 并明确确认安装，随后重启 dsh 并再次检查连接。生成安装器文件不代表已安装成功。

本扩展自带本人 QQ 私聊通道，QQ 功能仍需底层服务。**SnowLuma 原生模式需要配套 native helper/add-on；单装 SnowLuma 主程序没有本包的原生接口。** 使用内置私聊通道时，请避免另一个 QQ World 重复接管同一本人私聊。helper 源码与接口说明见 [vendor/snowluma-native/README.md](vendor/snowluma-native/README.md)。

dsh 控制需要独立运行的 dsh 宿主及会话网关；本 World 使用它的原生会话生命周期服务。安装器通过受管凭据保存 token、备份已有配置并保留其他插件，token 不写入 `.env`。**World 内提供中文安装引导，独立安装器终端保留英文提示。** 源码构建与独立安装器使用 **Node 24**。桌面 codex 原生控制是绑定应用版本与进程的 Windows 适配器，需要兼容且正在运行的原生应用；会话目录本身不提供控制能力。

## 什么时候汇报，怎样切换

汇报和模型的任务内容访问**默认 OFF**。只认配置的本人账号发来的真实 QQ 私聊，在原始文字最开头输入或单独发送：

```text
#@
```

也可使用：

```text
#@我离开电脑了，开始汇报。
```

再次输入此前缀即切换回 OFF。前置空格、引用/转发、正文中途的标记、群聊和其他账号不切换。同一平台消息重复到达只切换一次，开关状态跨进程重启保留。配置页显示状态，开关由真实本人私聊控制。

- **ON**：补投本地积压的重要事件，并继续接收任务完成、失败、需人工处理的阻塞和待批准/待输入事实。普通逐步进度不刷屏。原生 QQ 通道接收本人的任务指令，并仅回复同一本人私聊。
- **OFF**：重要事件继续在本地积压，新的任务内容读取、控制和任务私聊发送暂停。已经提交的原生工作继续按原应用的权限运行。

积压应结合来源、时间与最新状态看；完成代表宿主记录的结束事实，业务结果仍需验收。普通中间说明、缺少原生完成证据的最终文字，以及仍有已跟踪后台作业运行的回合，都不会被当作整个操作已经完成。

**开关不等于批准任务。** 原生控制仍需明确目标、草案以及草案之后另发的一次新的人类确认；`#@ 确认` 不代替这次确认。原应用的权限与审批规则保持有效。

## 内容范围与数据

只应选择你愿意交给已配置模型服务处理的目录。投递的本机会话内容会进入该模型服务；网关保持本机回环地址，凭证留在宿主管理中。

| 能力 | 内容 |
| --- | --- |
| 会话控制 | 查找、选择、起草、确认与对账，保留操作身份及原生终态证据。 |
| codex 来源 | 范围内的会话读取/搜索、重要原生状态通知、可选项目文件只读访问。 |
| dsh 来源 | 工作区会话、带来源的原文镜像、可选项目文件读取，以及既有外部记忆的限定读取与写入队列。 |
| 汇报开关 | 持久 OFF/ON、重要事件积压、来源时间与投递去重。 |
| QQ 任务私聊 | 通过本机底层传输接收本人真实私聊，并固定回复本人。 |
| 配置 | 四步向导、具体选项、目录选择、凭证保存、范围/连接检查和 dsh 安装引导。 |

外部记录保留来源身份，不自动并入 bot 原生 Memory，也不授予命令权限。目录范围检查不能代替编码工具执行命令时的操作系统沙箱。变更本人账号或访问范围会建立新的 OFF 命名空间并关闭旧访问，旧记录不混入新的队列。详细边界见 [SECURITY.md](SECURITY.md)。

## 11 语言与正式名称

单一客户端文件包含宿主全部十一种界面语言：简体中文、繁体中文、英语、日语、韩语、法语、德语、拉美西班牙语、巴西葡萄牙语和俄语。页面跟随宿主语言及受支持地区变体；未知语言回退英语。界面标签、高级选项、状态、已知连接诊断与 World 内安装引导有相应译文；未知服务诊断显示本地化提示。

中文界面的项目标题使用中文正式名，英文及其他语言界面使用英文正式名；品牌按原样保留，不机械翻译。技术标识、路径、命令、会话内容及模型工具指令保留原有语义。API 6 manifest 的 `locales` 继续只使用该契约支持的 `zh`/`en` 键。无需另外安装旧的三个桥接 World，本包内置其模块，只注册一个 World。

## 构建与验证

```sh
npm install
npm run build
npm run verify-build
npm run typecheck
npm test
```

SDK 集成检查将 `CORTICO_DIR` 指向兼容的 Cortico 源码；可用 `CORTICO_TOOLCHAIN_ROOT` 复用已安装的开发依赖，否则使用本包声明的开发依赖。可选 `DSH_SOURCE_ROOT` 用于合成数据的原生会话测试。构建后，通过宿主 `scripts/extension-check.ts` 检查本包的 API 6 `webUi()`、客户端和自描述 metadata。具体方式见 [BUILDING.md](BUILDING.md)。

原 preview.2 在 Cortico **0.2.6**（`ace4c640`）及 **0.2.3**（`087289df`）两份 API 6 源码上通过隔离装配、metadata 和各 5 项挂载检查；这是接口兼容证据，不是对任何宿主分支的依附或背书。本版 preview.3 调整正式名称、展示和文档；其自身界面/metadata/SDK 验证结果以对应发行记录为准，不能把 preview.2 的完整测试自动改写为本版已全跑。

当前为预览版。合成测试、扩展契约、真实隔离宿主挂载、真人 QQ 部署与长期稳定性分别验收。完整 Electron 启动、真实 QQ 收发/控制、生产 dsh 执行和长时间稳定性需要部署环境联调。来源见 [SOURCES.md](SOURCES.md)，变更见 [CHANGELOG.md](CHANGELOG.md)。

---

## English reference

**DSH、CODEX CONTRLO WORLD** is the exact English project name. The Chinese official name is **dsh，codex等工作agent的实时汇报与控制桥**. This independently maintained, optional World API 6 extension combines important work-agent notifications, scoped source reads, authorized conversation control and an owner-only QQ task channel. Its technical package remains `cortico-world-task-supervisor` and its World ID remains `tasksupervisor`.

Install the matching package version from a compatible Coo/Cortico Extensions page, then enable its World and open setup. The four steps connect services, choose scope, select functions, and check/apply. Credentials are host-managed. SnowLuma native mode requires the bundled native add-on; stock SnowLuma alone does not supply this interface. A running dsh host with a separate conversation gateway is required for native dsh control. Codex-only read monitoring can be used without enabling dsh. The setup page creates a private installation kit; run it locally, select DSH_HOME/profile, explicitly confirm installation, restart dsh and check authenticated health. The separate installer retains English terminal prompts. Use Node 24 for source builds and that installer.

Supervision defaults OFF. Only a genuine configured-owner private message whose original text starts with `#@` toggles access. ON delivers important backlog and new completion, failure, blocking and approval/user-input facts. Ordinary steps stay local. OFF queues important facts while refusing new task-content reads, controls and task-channel sends; existing native work continues. Completion is a recorded native boundary, not business acceptance. Each native submission still needs an exact target, a draft and a newer separate human confirmation. The switch, including `#@ 确认`, is not that confirmation.

The single frontend asset retains all eleven host languages. Official project names are verbatim brands, while feature text follows the host language. Identifiers, commands, paths and model instructions retain their meaning. Selected conversation content reaches the configured model service. Scoped reads do not form an OS sandbox for native agent commands. External records retain their source identity and grant no command authority.

This is a preview. Builds, isolated fixtures, SDK checks, settings UI, real QQ/agent deployment and long-running stability are separate acceptance stages. Preview.3 is a naming/presentation/documentation revision; consult its own release validation rather than treating preview.2's full suite as a newly executed preview.3 suite.
