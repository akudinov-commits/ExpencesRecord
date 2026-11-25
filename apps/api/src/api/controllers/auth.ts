import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthError, LOGIN_SECONDS, SESSION_SECONDS } from '../../application/auth.js';
import type { AuthHttpDependencies } from '../auth-context.js';

export function authCookies(dependencies: Pick<AuthHttpDependencies, 'secureCookies'>) {
  return {
    session: dependencies.secureCookies ? '__Host-expences_session' : 'expences_session_dev',
    flow: dependencies.secureCookies ? '__Host-expences_oauth' : 'expences_oauth_dev',
    options: { path: '/', httpOnly: true, secure: dependencies.secureCookies, sameSite: 'lax' as const },
  };
}

export function authControllers(dependencies: AuthHttpDependencies) {
  const { service, appOrigin } = dependencies;
  const cookies = authCookies(dependencies);
  const expectedHost = new URL(appOrigin).host;
  return {
    async login(request: FastifyRequest, reply: FastifyReply) {
      if (request.headers.host !== expectedHost) return reply.redirect(`${appOrigin}/api/auth/login`, 303);
      const result = await service.beginLogin();
      return reply.setCookie(cookies.flow, result.transactionToken, { ...cookies.options, maxAge: LOGIN_SECONDS }).redirect(result.authorizationUrl, 303);
    },
    async callback(request: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>, reply: FastifyReply) {
      reply.clearCookie(cookies.flow, cookies.options);
      try {
        if (request.headers.host !== expectedHost) throw new AuthError('invalid_callback');
        if (request.query.error) {
          return reply.redirect(`${appOrigin}/?auth=failed`, 303);
        }
        const result = await service.completeLogin({ transactionToken: request.cookies[cookies.flow] ?? '', code: request.query.code ?? '', state: request.query.state ?? '' });
        return reply.setCookie(cookies.session, result.sessionToken, { ...cookies.options, maxAge: SESSION_SECONDS }).redirect(`${appOrigin}/`, 303);
      } catch (error) {
        if (!(error instanceof AuthError)) throw error;
        const reason = error.code === 'access_denied' ? 'denied' : error.code === 'identity_unavailable' ? 'unavailable' : 'failed';
        return reply.redirect(`${appOrigin}/?auth=${reason}`, 303);
      }
    },
    async session(request: FastifyRequest, reply: FastifyReply) {
      const session = await service.authenticate(request.cookies[cookies.session] ?? '');
      return reply.header('cache-control', 'no-store').send({ authenticated: true, csrfToken: session.csrf });
    },
    async logout(request: FastifyRequest, reply: FastifyReply) {
      if (request.body !== undefined && (typeof request.body !== 'object' || request.body === null || Array.isArray(request.body) || Object.keys(request.body).length > 0)) {
        return reply.code(400).send({ error: { code: 'invalid_request' } });
      }
      const csrf = request.headers['x-csrf-token'];
      await service.logout(request.cookies[cookies.session] ?? '', typeof csrf === 'string' ? csrf : '');
      return reply.clearCookie(cookies.session, cookies.options).code(204).send();
    },
  };
}
