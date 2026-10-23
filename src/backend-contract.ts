export const PACKAGE_VERSION = '0.1.0-preview.1';
export type CommandTransport = 'snowluma-native' | 'onebot-v11' | 'trusted-meta';
export interface SetupForm {
  ownerQQ: string;
  commandTransport: CommandTransport;
  qqEndpoint: string;
  qqAccountId: string;
  qqTokenSecret: string;
  gatewayEndpoint: string;
  gatewayTokenSecret: string;
  dshEnabled: boolean;
  codexEnabled: boolean;
  dshWorkspaceRoots: string[];
  codexWorkspaceRoots: string[];
  excludedRoots: string[];
  dshSessionsDir: string;
  codexSessionsDir: string;
  workspaceFilesEnabled: boolean;
  conversationOptions: Record<string, unknown>;
  codexOptions: Record<string, unknown>;
  memoryOptions: Record<string, unknown>;
}
export interface SetupRequest { form: SetupForm; secrets?: { qqToken?: string; gatewayToken?: string }; restart?: boolean }
export interface ComponentStatus { status: 'disabled' | 'setup-required' | 'starting' | 'ready' | 'offline' | 'error'; error?: string; [key: string]: unknown }
export interface SetupSnapshot {
  version: 1; packageVersion: string; form: SetupForm;
  secrets: { qqTokenConfigured: boolean; gatewayTokenConfigured: boolean };
  gate: Record<string, unknown> | null;
  components: Record<'command' | 'conversation' | 'codex' | 'memory', ComponentStatus>;
  optionSchemas: Record<'conversation' | 'codex' | 'memory', { properties: Record<string, unknown> }>;
  warnings: string[]; steps: string[];
  pendingRestart?: boolean;
}
export interface ConnectionCheck { id: string; status: 'ok' | 'error' | 'skipped'; message: string }
export interface ConnectionChecks { ok: boolean; checks: ConnectionCheck[] }
