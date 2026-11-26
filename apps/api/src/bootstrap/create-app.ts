import { registerExpenseRoutes } from '../api/routes/expenses.js';
import type { ExpenseOperations } from '../application/ports/expenses.js';
import { registerExpenseContextRoutes } from '../api/routes/expense-context.js';
import type { ExpenseContextQuery } from '../application/expense-context.js';
import Fastify from 'fastify';
import type { FastifyServerOptions } from 'fastify';
import { registerHealthRoutes } from '../api/routes/health.js';
import type { AuthHttpDependencies } from '../api/auth-context.js';
import cookie from '@fastify/cookie';
import { AuthError } from '../application/auth.js';
import { authCookies } from '../api/controllers/auth.js';
import { registerAuthRoutes } from '../api/routes/auth.js';

function safeRequest(value: unknown) {
  if (typeof value !== 'object' || value === null) return {};
  const request = value as { method?: unknown; url?: unknown };
  return { method: typeof request.method === 'string' ? request.method : '', path: typeof request.url === 'string' ? request.url.split('?')[0] : '' };
}

export function createApp(options: FastifyServerOptions, dependencies?: AuthHttpDependencies, expenseContext?: ExpenseContextQuery, expenses?: ExpenseOperations) {
  const logging = options.logger && typeof options.logger === 'object' ? options.logger : {};
  const app = Fastify({ ...options, logger: options.logger ? { ...logging, serializers: {
    req: safeRequest,
    res: (value: unknown) => {
      const code = typeof value === 'object' && value !== null && 'statusCode' in value ? value.statusCode : undefined;
      return typeof code === 'number' || typeof code === 'string' ? { statusCode: code } : {};
    },
    err: () => ({ type: 'RequestError', message: 'request_failed', stack: '' }),
  } } : false });
  app.register(cookie);
  app.decorateRequest('verifiedSession', null);
  app.addHook('onRequest', async (request, reply) => {
    const path = request.routeOptions.url;
    if (!path) return;
    const health = path === '/api/health' && ['GET', 'HEAD'].includes(request.method);
    const login = ['GET'].includes(request.method) && ['/api/auth/login', '/api/auth/callback'].includes(path);
    if (health || login) return;
    if (!dependencies) return reply.code(503).send({ error: { code: 'authentication_unavailable' } });
    const names = authCookies(dependencies);
    const token = app.parseCookie(request.headers.cookie ?? '')[names.session] ?? '';
    const session = await dependencies.service.authenticate(token);
    request.verifiedSession = session;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (request.headers.origin !== dependencies.appOrigin) return reply.code(403).send({ error: { code: 'invalid_origin' } });
      const supplied = request.headers['x-csrf-token'];
      dependencies.service.assertCsrf(session, typeof supplied === 'string' ? supplied : '');
    }
  });
  app.addHook('onSend', async (request, reply, payload) => {
    if (request.routeOptions.url?.startsWith('/api/auth/') || request.routeOptions.url === '/api/expense-context' || request.routeOptions.url?.startsWith('/api/expenses')) reply.header('cache-control', 'no-store').header('referrer-policy', 'no-referrer');
    return payload;
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).header('cache-control', 'no-store').send({ error: { code: 'not_found' } }));
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      const status = error.code === 'unauthenticated' ? 401 : ['access_denied', 'invalid_csrf'].includes(error.code) ? 403 : error.code === 'identity_unavailable' ? 503 : 400;
      return reply.code(status).header('cache-control', 'no-store').send({ error: { code: error.code } });
    }
    if (typeof error === 'object' && error !== null && 'validation' in error) {
      if (request.routeOptions.url === '/api/auth/callback' && dependencies) {
        const names = authCookies(dependencies);
        reply.clearCookie(names.flow, names.options);
      }
      return reply.code(400).send({ error: { code: 'invalid_request' } });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      && error.code.startsWith('FST_ERR_CTP_') && 'statusCode' in error && typeof error.statusCode === 'number') {
      return reply.code(error.statusCode).send({ error: { code: 'invalid_request' } });
    }
    request.log.error({ event: 'request_failed' }, 'request_failed');
    return reply.code(500).send({ error: { code: 'internal_error' } });
  });
  registerHealthRoutes(app);
  if (dependencies) registerAuthRoutes(app, dependencies);
  if (expenseContext) registerExpenseContextRoutes(app, expenseContext);
  if (expenses) registerExpenseRoutes(app, expenses);
  return app;
}
