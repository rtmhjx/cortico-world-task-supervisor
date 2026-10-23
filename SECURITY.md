Owner: `src/command-listener.ts`, `src/scoped-gateway.ts`, `vendor/task-reporting/src/gate.ts`.

# Data and control boundaries / 数据与控制边界

- Only the configured QQ owner can toggle supervision through a fresh original private message. Raw transport mode accepts only that private channel. Group messages, rendered wrappers, quotes and forwarded text cannot authorize controls. / 只有配置的本人真实私聊可以切换监管；原生通道仅接收该私聊。群聊、显示包装、引用和转发文字不能授予控制权限。
- OFF blocks new task reads and controls. It does not cancel existing native operations, withdraw an already sent QQ message or remove information already in model context. / 关闭后拒绝新的任务读取与控制，不撤销已开始的原生操作、已发出的 QQ 消息或已经进入模型上下文的信息。
- Workspace roots and exclusions apply to source discovery, reads and the gateway scope handshake. Native agents retain their own permissions; a selected directory is not a complete command sandbox. / 工作区和排除范围用于来源发现、读取与网关范围核验；原生编码工具仍遵守各自权限，目录选择不是完整的命令沙箱。
- Loopback gateway and QQ credentials are credentials, not chat content. The setup API returns only whether a secret is configured. The local DSH installation kit contains a private token file and must remain on the owner's machine. / 网关和 QQ 凭证不属于聊天内容；配置接口只返回是否已经保存。本机 DSH 安装工具含私密 token 文件，应保留在本人电脑。
- Task results, conversation text and optional project-file content can reach the configured model service when supervision is ON or an authorized read occurs. Pattern scrubbing does not identify every possible secret. / 监管开启或授权读取时，任务结果、会话与可选项目文件内容可能进入已配置的模型服务；模式脱敏不能识别所有秘密。
- Runtime SQLite databases, checkpoints, credentials, installation kits and host deployment files are not source distribution files. / 运行数据库、游标、凭据、安装工具实例和宿主部署配置不属于源码发布内容。

Report a suspected credential exposure privately to the repository owner. Include affected versions and a reproduction using synthetic values; do not publish real tokens or private conversation logs in an issue. / 疑似凭据泄露请私下联系仓库所有者，提供版本和合成数据复现，不要在公开 issue 中上传真实 token 或私聊日志。
