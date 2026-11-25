import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance } from 'fastify';
import { createConfiguredApp } from '../apps/api/src/bootstrap/runtime.js';

export function createNodeHandler(createApplication: () => FastifyInstance) {
  let app: FastifyInstance | undefined;
  return async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      app ??= createApplication();
      await app.ready();
      app.server.emit('request', request, response);
    } catch {
      console.error(JSON.stringify({ event: 'runtime_unavailable' }));
      if (response.headersSent) { response.destroy(); return; }
      response.statusCode = 503;
      response.setHeader('content-type', 'application/json');
      response.setHeader('cache-control', 'no-store');
      response.end(JSON.stringify({ error: { code: 'service_unavailable' } }));
    }
  };
}

export default createNodeHandler(() => createConfiguredApp());
