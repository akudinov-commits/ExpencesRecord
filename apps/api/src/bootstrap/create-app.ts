import Fastify from 'fastify';
import type { FastifyServerOptions } from 'fastify';
import { registerHealthRoutes } from '../api/routes/health.js';

export function createApp(options: FastifyServerOptions) {
  const app = Fastify(options);
  registerHealthRoutes(app);
  return app;
}
