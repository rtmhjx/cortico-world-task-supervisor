/** Configuration for the conversation-control World and its local gateway. */
import { isAbsolute } from 'node:path';
import type { ConfigGroup } from 'cortico/core/types.ts';
import { RouteError } from '../../conversation-control/src/contract.ts';

export interface ConversationControlConfigSection {
  enabled: boolean;
  endpoint: string;
  tokenSecret: string;
  operatorIds: string;
  stateDir: string;
  pollIntervalMs: number;
  progressIntervalMs: number;
  desktopProgressEnabled: boolean;
  requestTimeoutMs: number;
  eventTtlMs: number;
  selectionTtlMs: number;
  reportingOperatorId: string;
  reportingStateFile: string;
}
export const CONVERSATIONCONTROL_DEFAULTS: ConversationControlConfigSection = {
  enabled: false, endpoint: 'http://127.0.0.1:3092', tokenSecret: 'CORTICO_CONVERSATION_CONTROL_TOKEN',
  operatorIds: '[]', stateDir: '', pollIntervalMs: 5000, progressIntervalMs: 0, desktopProgressEnabled: true, requestTimeoutMs: 10000,
  eventTtlMs: 300000, selectionTtlMs: 900000, reportingOperatorId: '', reportingStateFile: '',
};
export const conversationControlDefaults = (): ConversationControlConfigSection => ({ ...CONVERSATIONCONTROL_DEFAULTS });
export function resolveConversationControlConfig(input: ConversationControlConfigSection): ConversationControlConfigSection & { operators: string[] } {
  const cfg = { ...CONVERSATIONCONTROL_DEFAULTS, ...input };
  let endpoint: URL;
  try { endpoint = new URL(cfg.endpoint); } catch { throw new RouteError('INVALID_CONFIG', 'Invalid gateway endpoint.'); }
  if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || !endpoint.port || endpoint.pathname !== '/' || endpoint.search || endpoint.hash || endpoint.username || endpoint.password)
    throw new RouteError('INVALID_CONFIG', 'Gateway requires an explicit IPv4 loopback port.');
  if (typeof cfg.enabled !== 'boolean' || typeof cfg.stateDir !== 'string' || (cfg.stateDir !== '' && !isAbsolute(cfg.stateDir)) || !/^CORTICO_[A-Z0-9_]+$/.test(cfg.tokenSecret))
    throw new RouteError('INVALID_CONFIG', 'Invalid state directory, enabled flag or credential reference.');
  let operators: unknown;
  try { operators = JSON.parse(cfg.operatorIds); } catch { throw new RouteError('INVALID_CONFIG', 'operatorIds requires a JSON array of QQ numbers.'); }
  if (!Array.isArray(operators) || operators.length > 100 || operators.some(id => typeof id !== 'string' || !/^[1-9]\d{4,19}$/.test(id)))
    throw new RouteError('INVALID_CONFIG', 'operatorIds requires a JSON array of QQ number strings.');
  for (const [key, min, max] of [['pollIntervalMs', 100, 60000], ['requestTimeoutMs', 1000, 30000], ['eventTtlMs', 1000, 3600000], ['selectionTtlMs', 1000, 86400000]] as const) {
    if (!Number.isSafeInteger(cfg[key]) || cfg[key] < min || cfg[key] > max) throw new RouteError('INVALID_CONFIG', `Invalid ${key}.`);
  }
  if (!Number.isSafeInteger(cfg.progressIntervalMs) || cfg.progressIntervalMs < 0 || cfg.progressIntervalMs > 3600000 || (cfg.progressIntervalMs > 0 && cfg.progressIntervalMs < 1000)) throw new RouteError('INVALID_CONFIG', 'Invalid progressIntervalMs.');
  if (typeof cfg.desktopProgressEnabled !== 'boolean') throw new RouteError('INVALID_CONFIG', 'Invalid desktopProgressEnabled.');
  if (typeof cfg.reportingOperatorId !== 'string' || (cfg.reportingOperatorId !== '' && !/^[1-9]\d{4,19}$/.test(cfg.reportingOperatorId))
    || typeof cfg.reportingStateFile !== 'string' || (cfg.reportingStateFile !== '' && !isAbsolute(cfg.reportingStateFile))) throw new RouteError('INVALID_CONFIG', 'Invalid task reporting identity or state file.');
  if (cfg.reportingOperatorId && !(operators as string[]).includes(cfg.reportingOperatorId)) throw new RouteError('INVALID_CONFIG', 'The reporting owner must be an authorized conversation operator.');
  return { ...cfg, endpoint: endpoint.origin, operators: [...new Set(operators as string[])] };
}
export const CONVERSATIONCONTROL_CONFIG_GROUP: ConfigGroup = {
  id: 'world:conversationcontrol', owner: 'world:conversationcontrol',
  schema: { type: 'object', title: '会话控制', properties: {
    'worlds.conversationcontrol.endpoint': { type: 'string', title: '本机会话网关', 'x-hot': false },
    'worlds.conversationcontrol.tokenSecret': { type: 'string', title: '网关凭证名称', 'x-hot': false },
    'worlds.conversationcontrol.operatorIds': { type: 'string', title: '允许操作的 QQ 号', description: 'QQ 号码字符串的 JSON 数组。', 'x-hot': false },
    'worlds.conversationcontrol.stateDir': { type: 'string', title: '选择与回执目录', 'x-hot': false, 'x-path': { kind: 'directory' } },
    'worlds.conversationcontrol.reportingOperatorId': { type: 'string', title: '任务监管开关所属 QQ 私聊', description: '该用户的私聊首部 #@ 切换监管；初始关闭，开启后投递积压的完成和问题事件。', 'x-hot': false },
    'worlds.conversationcontrol.reportingStateFile': { type: 'string', title: '任务监管状态文件', description: 'DSH 与 Codex 共用同一文件；留空使用部署 data/task-reporting/gate.sqlite。', 'x-hot': false },
    'worlds.conversationcontrol.pollIntervalMs': { type: 'integer', title: '结果检查间隔（毫秒）', minimum: 100, maximum: 60000, 'x-hot': false },
    'worlds.conversationcontrol.desktopProgressEnabled': { type: 'boolean', title: '接收手动 DSH 会话的新进度', description: '通过网关读取已授权工作区的新原生事件；不猜测 QQ 收件人。', 'x-hot': false },
    'worlds.conversationcontrol.requestTimeoutMs': { type: 'integer', title: '网关请求超时（毫秒）', minimum: 1000, maximum: 30000, 'x-hot': false },
    'worlds.conversationcontrol.eventTtlMs': { type: 'integer', title: '操作消息有效期（毫秒）', minimum: 1000, maximum: 3600000, 'x-hot': false },
    'worlds.conversationcontrol.selectionTtlMs': { type: 'integer', title: '候选与选择有效期（毫秒）', minimum: 1000, maximum: 86400000, 'x-hot': false },
  } },
};
