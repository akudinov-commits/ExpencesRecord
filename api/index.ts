import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../apps/api/src/bootstrap/create-app.js';

const app = createApp({ logger: false });

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await app.ready();
  app.server.emit('request', request, response);
}
