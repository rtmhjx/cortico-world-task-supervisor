/** Conversation routing is independent of the bridge-owned DSH task ledger. */
export type Framework = 'dsh' | 'codex';
export type Action = 'pause' | 'continue' | 'check' | 'send';
export type ReceiptStatus = 'accepted' | 'running' | 'waiting_user' | 'completed' | 'paused' | 'blocked' | 'failed' | 'unknown';
export interface Conversation {
  framework: Framework;
  id: string;
  title: string | null;
  workspace: string;
  /** Chat activity, never asserted to be code modification time. */
  lastActivityAt: string;
  summary: string;
  status: 'running' | 'idle' | 'paused' | 'unknown';
  revision: string;
  capabilities: Action[];
  source: string;
  /** Discovery metadata does not grant control; draft/get must verify the exact native state. */
  stateVerification?: 'deferred';
}
export interface ActionRequest {
  operationId: string;
  framework: Framework;
  targetId: string;
  action: Action;
  prompt?: string;
  expectedRevision: string;
}
export interface ActionReceipt {
  operationId: string;
  framework: Framework;
  targetId: string;
  status: ReceiptStatus;
  at: string;
  /** Persisted ownership and cutoff for turns started by this operation. */
  action?: Action;
  deadlineAt?: string;
  requestId?: string;
  turnId?: string;
  answer?: string;
  errorCode?: string;
  detail?: string;
}
export interface ConversationAdapter {
  readonly framework: Framework;
  readonly discoveryWarnings?: readonly { id: string; code: string }[];
  list(input: { query: string; limit: number; signal?: AbortSignal }): Promise<Conversation[]>;
  get(id: string, signal?: AbortSignal): Promise<Conversation>;
  /** Called only once after durable intent. A transport exception is an unknown outcome. */
  execute(request: ActionRequest, signal?: AbortSignal): Promise<ActionReceipt>;
  /** No resubmission, retry, resume or new turn. May enforce the stored cutoff on its own turn. */
  observe(receipt: ActionReceipt, signal?: AbortSignal): Promise<ActionReceipt>;
  dispose?(): Promise<void> | void;
}
export interface ConversationBackend {
  list(input: { query: string; limit: number; frameworks?: Framework[]; signal?: AbortSignal }): Promise<Conversation[]>;
  get(framework: Framework, id: string, signal?: AbortSignal): Promise<Conversation>;
  execute(request: ActionRequest, signal?: AbortSignal): Promise<ActionReceipt>;
  observe(operationId: string, signal?: AbortSignal): Promise<ActionReceipt>;
  diagnostics?(): Promise<Record<string, unknown>>;
}
export interface DiscoveryScope {
  roots: Record<Framework, string[]>;
  excludedRoots: string[];
  matchMode: 'literal-substring';
}
export class RouteError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'RouteError'; }
}
export const terminal = (status: ReceiptStatus): boolean => ['completed', 'paused', 'blocked', 'failed', 'unknown'].includes(status);
export const standardPrompt = (action: Action): string | undefined => action === 'continue' ? '继续。请遵守当前项目的既有约束，在当前回合的执行预算内推进；遇到阻塞时停止并报告。' : action === 'check' ? '检查这个项目的现状。仅进行只读检查；报告已完成、未完成、失败证据、当前阻塞和下一步。不要挂载、部署、重启、发送消息或修改文件。' : undefined;
