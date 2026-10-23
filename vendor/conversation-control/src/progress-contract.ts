/** Append-only observation feed; cursors are scoped to one durable feedId. */
export interface DshProgressEvent {
  cursor: number;
  eventId: string;
  sessionId: string;
  workspace: string;
  turnId: string | null;
  seq: number;
  type: 'started' | 'running' | 'waiting_user' | 'completed' | 'failed' | 'interrupted';
  at: string;
  summary: string;
  toolCalls: number;
  toolResults: number;
  source: 'dsh-native-session-event';
}
export interface DshProgressBatch {
  feedId: string;
  events: DshProgressEvent[];
  nextCursor: number;
  latestCursor: number;
  baselineAt: string;
}
export interface DshProgressSource {
  read(after: number, limit?: number): Promise<DshProgressBatch>;
  status(): Record<string, unknown>;
}
