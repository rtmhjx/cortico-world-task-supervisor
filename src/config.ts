import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import type { ConfigGroup } from 'cortico/core/types.ts';
import { conversationControlDefaults, CONVERSATIONCONTROL_CONFIG_GROUP } from '../vendor/cortico-world-conversation-control/src/config.ts';
import { codexBridgeDefaults, CODEXBRIDGE_CONFIG_GROUP } from '../vendor/cortico-world-codex-bridge/src/config.ts';
import { dshMemoryDefaults, DSHMEMORY_CONFIG_GROUP } from '../vendor/cortico-world-dsh-memory/src/config.ts';
import type { SetupForm } from './backend-contract.ts';

export interface TaskSupervisorConfig {
  enabled: boolean;
  ownerQQ: string;
  commandTransport: string;
  qqEndpoint: string;
  qqAccountId: string;
  qqTokenSecret: string;
  gatewayEndpoint: string;
  gatewayTokenSecret: string;
  dshEnabled: boolean;
  codexEnabled: boolean;
  dshWorkspaceRoots: string;
  codexWorkspaceRoots: string;
  excludedRoots: string;
  dshSessionsDir: string;
  codexSessionsDir: string;
  workspaceFilesEnabled: boolean;
  conversationOptions: string;
  codexOptions: string;
  memoryOptions: string;
  stateDir: string;
}
const reserved = {
  conversation: ['enabled','endpoint','tokenSecret','operatorIds','reportingOperatorId','reportingStateFile','stateDir'],
  codex: ['enabled','sessionsDir','allowedWorkspaces','deniedWorkspaces','reportingOperatorId','reportingStateFile','stateDir','workspaceFilesEnabled'],
  memory: ['enabled','sessionsDir','workspaceRoots','workspaceDenied','reportingOperatorId','reportingStateFile','stateDir','workspaceFilesEnabled','watchTrigger'],
};
const defaults = {
  conversation: conversationControlDefaults(), codex: codexBridgeDefaults(),
  memory: { ...dshMemoryDefaults(), sourceMode: 'workspace', writeEnabled: false, rawEnabled: false },
};
export function optionDefaults(kind: keyof typeof reserved): Record<string, unknown> {
  return Object.fromEntries(Object.entries(defaults[kind]).filter(([key]) => !reserved[kind].includes(key)));
}
export function taskSupervisorDefaults(): TaskSupervisorConfig {
  return { enabled: false, ownerQQ: '', commandTransport: 'snowluma-native', qqEndpoint: '', qqAccountId: '',
    qqTokenSecret: 'CORTICO_TASK_SUPERVISOR_QQ_TOKEN', gatewayEndpoint: 'http://127.0.0.1:3092',
    gatewayTokenSecret: 'CORTICO_TASK_SUPERVISOR_GATEWAY_TOKEN', dshEnabled: false, codexEnabled: false,
    dshWorkspaceRoots: '[]', codexWorkspaceRoots: '[]', excludedRoots: '[]',
    dshSessionsDir: join(homedir(), '.dsh', 'sessions'), codexSessionsDir: join(homedir(), '.codex', 'sessions'),
    workspaceFilesEnabled: false, conversationOptions: JSON.stringify(optionDefaults('conversation')),
    codexOptions: JSON.stringify(optionDefaults('codex')), memoryOptions: JSON.stringify(optionDefaults('memory')), stateDir: '' };
}
function object(value: unknown, field: string): Record<string, unknown> {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`Invalid ${field} object.`);
  return parsed as Record<string, unknown>;
}
export function options(kind: keyof typeof reserved, value: unknown): Record<string, unknown> {
  const allowed = optionDefaults(kind), input = object(value, `${kind}Options`);
  for (const [key, item] of Object.entries(input)) {
    if (!Object.hasOwn(allowed,key)) throw new Error(`Unsupported ${kind} option: ${key}.`);
    if (Array.isArray(item) && typeof allowed[key] === 'string' && String(allowed[key]).startsWith('[')) input[key] = JSON.stringify(item);
    else if (typeof item !== typeof allowed[key]) throw new Error(`Invalid ${kind} option type: ${key}.`);
  }
  return { ...allowed, ...input };
}
export function paths(value: unknown, field: string): string[] {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(parsed) || parsed.length > 100 || parsed.some(path => typeof path !== 'string' || !path.trim() || !isAbsolute(path) || /[\x00-\x1f]/.test(path))) throw new Error(`${field} requires up to 100 absolute directory paths.`);
  return [...new Set(parsed)] as string[];
}
export function loopbackEndpoint(value: string, kind: 'native' | 'ws' | 'gateway'): URL {
  const url = new URL(value);
  if (url.hostname !== '127.0.0.1' || !url.port || url.username || url.password || url.search || url.hash
    || url.protocol !== (kind === 'ws' ? 'ws:' : 'http:')
    || (kind === 'native' ? url.pathname.replace(/\/$/, '') !== '/native/v1' : url.pathname !== '/')) throw new Error(`Invalid ${kind} endpoint: an explicit IPv4 loopback port is required.`);
  return url;
}
export function resolveConfig(input: TaskSupervisorConfig): TaskSupervisorConfig {
  const cfg = { ...taskSupervisorDefaults(), ...input };
  for (const key of ['enabled','dshEnabled','codexEnabled','workspaceFilesEnabled'] as const) if (typeof cfg[key] !== 'boolean') throw new Error(`Invalid ${key}.`);
  for (const [key, value] of Object.entries(cfg)) if (!['enabled','dshEnabled','codexEnabled','workspaceFilesEnabled'].includes(key) && typeof value !== 'string') throw new Error(`Invalid ${key}.`);
  if (cfg.ownerQQ && !/^[1-9]\d{4,19}$/.test(cfg.ownerQQ)) throw new Error('ownerQQ must be a QQ number string.');
  if (cfg.qqAccountId && !/^[1-9]\d{4,19}$/.test(cfg.qqAccountId)) throw new Error('qqAccountId must be a QQ number string.');
  if (!['snowluma-native','onebot-v11','trusted-meta'].includes(cfg.commandTransport)) throw new Error('Invalid commandTransport.');
  for (const key of ['qqTokenSecret','gatewayTokenSecret'] as const) if (!/^CORTICO_[A-Z0-9_]+$/.test(cfg[key])) throw new Error(`Invalid ${key} credential reference.`);
  if (cfg.qqEndpoint && cfg.commandTransport !== 'trusted-meta') loopbackEndpoint(cfg.qqEndpoint, cfg.commandTransport === 'onebot-v11' ? 'ws' : 'native');
  loopbackEndpoint(cfg.gatewayEndpoint, 'gateway');
  for (const key of ['dshWorkspaceRoots','codexWorkspaceRoots','excludedRoots'] as const) cfg[key] = JSON.stringify(paths(cfg[key], key));
  for (const key of ['dshSessionsDir','codexSessionsDir','stateDir'] as const) if (cfg[key] && (!isAbsolute(cfg[key]) || /[\x00-\x1f]/.test(cfg[key]))) throw new Error(`Invalid ${key}.`);
  for (const kind of ['conversation','codex','memory'] as const) cfg[`${kind}Options`] = JSON.stringify(options(kind, cfg[`${kind}Options`]));
  if (cfg.dshEnabled && !paths(cfg.dshWorkspaceRoots, 'dshWorkspaceRoots').length) throw new Error('DSH requires explicit workspace roots.');
  if (cfg.codexEnabled && !paths(cfg.codexWorkspaceRoots, 'codexWorkspaceRoots').length) throw new Error('Codex requires explicit workspace roots.');
  return cfg;
}
export function setupForm(cfg: TaskSupervisorConfig): SetupForm {
  const { enabled: _enabled, stateDir: _stateDir, ...form } = resolveConfig(cfg);
  return { ...form, commandTransport: form.commandTransport as SetupForm['commandTransport'],
    dshWorkspaceRoots: paths(form.dshWorkspaceRoots, 'dshWorkspaceRoots'), codexWorkspaceRoots: paths(form.codexWorkspaceRoots, 'codexWorkspaceRoots'), excludedRoots: paths(form.excludedRoots, 'excludedRoots'),
    conversationOptions: options('conversation', form.conversationOptions), codexOptions: options('codex', form.codexOptions), memoryOptions: options('memory', form.memoryOptions) };
}
export function configFromForm(form: SetupForm, base: TaskSupervisorConfig): TaskSupervisorConfig {
  if (!form || typeof form !== 'object' || Array.isArray(form)) throw new Error('Setup form is required.');
  const allowed = Object.keys(setupForm(taskSupervisorDefaults()));
  if (Object.keys(form).some(key => !allowed.includes(key))) throw new Error('Unsupported setup field.');
  return resolveConfig({ ...base, ...form, dshWorkspaceRoots: JSON.stringify(paths(form.dshWorkspaceRoots,'dshWorkspaceRoots')),
    codexWorkspaceRoots: JSON.stringify(paths(form.codexWorkspaceRoots,'codexWorkspaceRoots')), excludedRoots: JSON.stringify(paths(form.excludedRoots,'excludedRoots')),
    conversationOptions: JSON.stringify(options('conversation', form.conversationOptions)), codexOptions: JSON.stringify(options('codex', form.codexOptions)), memoryOptions: JSON.stringify(options('memory', form.memoryOptions)) });
}
export function optionSchemas() {
  const groups = { conversation: CONVERSATIONCONTROL_CONFIG_GROUP, codex: CODEXBRIDGE_CONFIG_GROUP, memory: DSHMEMORY_CONFIG_GROUP };
  return Object.fromEntries(Object.entries(groups).map(([kind, group]) => [kind, { properties:
    Object.fromEntries(Object.entries(group.schema.properties ?? {}).map(([key, schema]) => [key.split('.').at(-1)!, schema])
      .filter(([key]) => !reserved[kind as keyof typeof reserved].includes(key as string))) }])) as Record<'conversation'|'codex'|'memory', { properties: Record<string, unknown> }>;
}
const props = Object.fromEntries(Object.entries(taskSupervisorDefaults()).filter(([key]) => key !== 'enabled').map(([key, value]) =>
  [`worlds.tasksupervisor.${key}`, { type: typeof value === 'boolean' ? 'boolean' : 'string', title: key, 'x-hot': false }]));
export const TASK_SUPERVISOR_CONFIG_GROUP: ConfigGroup = { id: 'world:tasksupervisor', owner: 'world:tasksupervisor',
  schema: { type: 'object', title: 'Task Supervisor · 单 World 任务监管', properties: props as ConfigGroup['schema']['properties'] } };
