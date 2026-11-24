import type { FastifyInstance } from 'fastify';
import { healthController } from '../controllers/health.js';

export function registerHealthRoutes(app: FastifyInstance) {
  app.get('/api/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', const: 'ok' } },
          additionalProperties: false,
        },
      },
    },
  }, healthController);
}
