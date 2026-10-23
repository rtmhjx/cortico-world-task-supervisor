import { RouteError, type ActionReceipt, type ActionRequest, type Conversation, type ConversationBackend, type Framework } from './contract.ts';
import type { DshProgressBatch } from './progress-contract.ts';

export function gatewayEndpoint(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new RouteError('INVALID_ENDPOINT', 'Gateway must use an explicit IPv4 loopback port.');
  return url.origin;
}
export class GatewayClient implements ConversationBackend {
  private endpoint: string;
  constructor(endpoint: string, private secret: () => string | undefined | Promise<string | undefined>, private timeoutMs = 10000) { this.endpoint = gatewayEndpoint(endpoint); }
  private async request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const token = await this.secret(); if (!token) throw new RouteError('CREDENTIAL_UNAVAILABLE', 'Gateway credential is unavailable.');
    const timeout = AbortSignal.timeout(this.timeoutMs), requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const response = await fetch(`${this.endpoint}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: requestSignal, redirect: 'error' });
    // Bound the response before JSON decoding, including chunked responses.
    const reader = response.body?.getReader(); if (!reader) throw new RouteError('BAD_RESPONSE', 'Gateway sent no response body.');
    const chunks: Uint8Array[] = []; let length = 0;
    for (;;) { const item = await reader.read(); if (item.done) break; length += item.value.length; if (length > 1024 * 1024) { await reader.cancel(); throw new RouteError('RESPONSE_TOO_LARGE', 'Gateway response exceeded 1 MiB.'); } chunks.push(item.value); }
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!response.ok) throw new RouteError(typeof value.code === 'string' ? value.code : 'GATEWAY_ERROR', typeof value.message === 'string' ? value.message : 'Gateway rejected the request.');
    return value as T;
  }
  list(input: { query: string; limit: number; frameworks?: Framework[]; signal?: AbortSignal }): Promise<Conversation[]> { const q = new URLSearchParams({ query: input.query, limit: String(input.limit), ...(input.frameworks ? { frameworks: input.frameworks.join(',') } : {}) }); return this.request(`/v1/conversations?${q}`, undefined, input.signal); }
  get(framework: Framework, id: string, signal?: AbortSignal): Promise<Conversation> { return this.request(`/v1/conversations/${framework}/${encodeURIComponent(id)}`, undefined, signal); }
  execute(request: ActionRequest, signal?: AbortSignal): Promise<ActionReceipt> { return this.request('/v1/operations', request, signal); }
  observe(operationId: string, signal?: AbortSignal): Promise<ActionReceipt> { return this.request(`/v1/operations/${encodeURIComponent(operationId)}`, undefined, signal); }
  diagnostics(): Promise<Record<string, unknown>> { return this.request('/v1/health'); }
  progress(after: number, limit = 50, signal?: AbortSignal): Promise<DshProgressBatch> { return this.request(`/v1/dsh-progress?${new URLSearchParams({ after: String(after), limit: String(limit) })}`, undefined, signal); }
}
