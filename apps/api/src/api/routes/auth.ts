import type { FastifyInstance } from 'fastify';
import type { AuthHttpDependencies } from '../auth-context.js';
import { authControllers } from '../controllers/auth.js';

export function registerAuthRoutes(app: FastifyInstance, dependencies: AuthHttpDependencies) {
  const controllers = authControllers(dependencies);
  app.get('/api/auth/login', { exposeHeadRoute: false }, controllers.login);
  app.get('/api/auth/callback', {
    exposeHeadRoute: false,
    schema: { querystring: { type: 'object', properties: { code: { type: 'string', maxLength: 4096 }, state: { type: 'string', maxLength: 128 }, error: { type: 'string', maxLength: 128 } } } },
  }, controllers.callback);
  app.get('/api/auth/session', { exposeHeadRoute: false }, controllers.session);
  app.post('/api/auth/logout', controllers.logout);
}
