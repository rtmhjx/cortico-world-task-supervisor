Owner: `src/gate.ts` / `ReportingGate`.

DSH 与 Codex 的任务结果使用同一 SQLite 开关和各自的持久 outbox。默认关闭。关闭时来源可以继续归档重要事实，Persona 不接收这些事实；开启后各来源按保存顺序补投，宿主确认后清除正文并保留去重编号。投递是否进入 QQ 由调用方已有权限与工具契约决定，模块本身不发送 QQ。

开关只接受 QQ World 新入站事件的可信 `meta.taskReportingCommand={version:1,token:'#@'}`，并同时要求 external `qq.message`、指定操作者、同一私聊会话、匹配 senderKey、有效 message_id 和新鲜时间。模块不从昵称、显示包装、引用内容或任意正文匹配命令。首次同步以宿主最新游标建立基线，已有历史不会切换状态；同一平台消息换游标重投也只切一次。

多个 World 可连接同一 gate 文件。`syncCommands()` 以有界游标窗口完整处理新命令；工具执行和每条推送前均需同步并重新检查 `enabled()`。`pendingTransitions()` 独立持久保存开关变更，仅负责状态回报的 World 消费。普通通知按来源调用 `enqueue/pending/ack`，开关状态事件使用 `pendingTransitions/ackTransition`。宿主投递前后恢复由调用方的稳定 marker 去重。

`snapshot()` 只含状态、计数和最近命令身份，不含积压正文。outbox 正文另做凭据形态脱敏并限制为 1 MiB。文件系统别名、受保护路径、不同操作者身份、宿主游标回退和不一致事件范围均拒绝加载或处理。

公开版本不包含任何工作站路径或操作者账号。启动环境 `CORTICO_TASK_SUPERVISOR_EXCLUSIONS` 可配置绝对路径 JSON 数组；未设置时保护 `~/.task-supervisor/private`。在 Cortico 和独立 DSH 网关使用同一排除策略。来源还保留各自的 deniedWorkspaces/workspaceDenied 权限。`ReportingGate` 另接受 `deniedRoots` 数组；策略会参与持久身份，改变策略不会静默复用原有数据库。迁移时先保留旧状态，再显式配置本机需要保护的目录，不把部署配置提交到仓库。
