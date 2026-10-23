import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { RouteError, type ActionRequest, type Framework } from './contract.ts';
import { ConversationGateway } from './gateway.ts';
import type { DshProgressSource } from './progress-contract.ts';

export class GatewayServer {
  private server?: Server;
  private active = new Set<Promise<void>>();
  constructor(private gateway: ConversationGateway, private token: () => Promise<string | undefined>, private port = 3092, private progress?: DshProgressSource) {}
  async start(): Promise<void> {
    if (this.server) throw new Error('Gateway already started.');
    const server = createServer((request, response) => {
      const task = this.handle(request, response).catch(() => { if (!response.headersSent) this.send(response, 503, { code: 'GATEWAY_UNAVAILABLE', message: 'Gateway request failed.' }); else response.end(); }).finally(() => this.active.delete(task));
      this.active.add(task);
    });
    server.requestTimeout = 15000; server.headersTimeout = 5000; server.keepAliveTimeout = 1000; this.server = server;
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(this.port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); }); });
  }
  address(): number | undefined { const address = this.server?.address(); return typeof address === 'object' && address ? address.port : undefined; }
  private send(response: ServerResponse, status: number, value: unknown): void {
    if (response.destroyed || response.writableEnded) return;
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); response.end(JSON.stringify(value));
  }
  private async body(request: IncomingMessage): Promise<unknown> {
    if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) throw new RouteError('INVALID_CONTENT_TYPE', 'JSON body required.');
    const chunks: Buffer[] = []; let length = 0;
    for await (const chunk of request) { const data = Buffer.from(chunk); length += data.length; if (length > 16384) throw new RouteError('BODY_TOO_LARGE', 'Request exceeds 16 KiB.'); chunks.push(data); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new RouteError('INVALID_JSON', 'Malformed JSON body.'); }
  }
  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const controller = new AbortController();
    const disconnect = () => { if (!response.writableEnded) controller.abort(); };
    request.once('aborted', disconnect); response.once('close', disconnect);
    try {
      if (request.headers.origin !== undefined) { this.send(response, 403, { code: 'ORIGIN_DENIED', message: 'Browser-origin requests are denied.' }); return; }
      const expected = await this.token(), supplied = /^Bearer ([^\s]+)$/.exec(request.headers.authorization ?? '')?.[1];
      if (!expected || expected.length < 24) { this.send(response, 503, { code: 'CREDENTIAL_UNAVAILABLE', message: 'Gateway credential is unavailable.' }); return; }
      if (!supplied || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) { this.send(response, 401, { code: 'UNAUTHORIZED', message: 'Authentication required.' }); return; }
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (request.method === 'GET' && url.pathname === '/v1/health') { this.send(response, 200, { ...this.gateway.health(), progress: this.progress?.status() ?? { enabled: false } }); return; }
      if (request.method === 'GET' && url.pathname === '/v1/dsh-progress') {
        if (!this.progress) throw new RouteError('PROGRESS_DISABLED', 'Native progress observation is not enabled.');
        this.send(response, 200, await this.progress.read(Number(url.searchParams.get('after') ?? 0), Number(url.searchParams.get('limit') ?? 50))); return;
      }
      if (request.method === 'GET' && url.pathname === '/v1/conversations') {
        const frameworks = url.searchParams.has('frameworks') ? url.searchParams.get('frameworks')!.split(',') as Framework[] : undefined;
        this.send(response, 200, await this.gateway.list({ query: url.searchParams.get('query') ?? '', limit: Number(url.searchParams.get('limit') ?? 5), frameworks, signal: controller.signal })); return;
      }
      const target = /^\/v1\/conversations\/(dsh|codex)\/([^/]+)$/.exec(url.pathname);
      if (request.method === 'GET' && target) { this.send(response, 200, await this.gateway.get(target[1] as Framework, decodeURIComponent(target[2]), controller.signal)); return; }
      const operation = /^\/v1\/operations\/([^/]+)$/.exec(url.pathname);
      if (request.method === 'GET' && operation) { this.send(response, 200, await this.gateway.observe(decodeURIComponent(operation[1]), controller.signal)); return; }
      if (request.method === 'POST' && url.pathname === '/v1/operations') {
        const body = await this.body(request);
        if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['operationId', 'framework', 'targetId', 'action', 'prompt', 'expectedRevision'].includes(key))) throw new RouteError('INVALID_REQUEST', 'Unsupported operation fields.');
        this.send(response, 200, await this.gateway.execute(body as ActionRequest, controller.signal)); return;
      }
      this.send(response, 404, { code: 'NOT_FOUND', message: 'Gateway route not found.' });
    } catch (error) {
      const code = error instanceof RouteError ? error.code : 'GATEWAY_UNAVAILABLE';
      const message = error instanceof RouteError ? error.message : 'Gateway operation failed; inspect its local state.';
      this.send(response, code === 'BODY_TOO_LARGE' ? 413 : code === 'GATEWAY_UNAVAILABLE' || code === 'PERSISTENCE_UNAVAILABLE' ? 503 : 409, { code, message });
    } finally {
      request.removeListener('aborted', disconnect); response.removeListener('close', disconnect);
    }
  }
  async stop(): Promise<void> {
    const server = this.server; this.server = undefined;
    if (server) { const closed = new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); server.closeIdleConnections(); await Promise.allSettled([...this.active]); await closed; }
  }
}
