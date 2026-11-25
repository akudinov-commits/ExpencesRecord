import Fastify from 'fastify';
import type { GoogleSetupService } from '../application/google-setup.js';
import type { GoogleSetupFailureReason, GoogleSetupResult } from '../application/ports/google-setup.js';
import { IdentityRejected, IdentityUnavailable } from '../application/ports/auth.js';
import { AuthError } from '../application/auth.js';
import { SheetsAccessError } from '../application/ports/sheets-access.js';
export type SetupCompletion = { ok: true; value: GoogleSetupResult } | { ok: false; reason: GoogleSetupFailureReason };

function safeReason(error: unknown): GoogleSetupFailureReason {
  if (error instanceof IdentityRejected) {
    switch (error.reason) {
      case 'identity_rejected': case 'code_exchange_rejected': case 'identity_verification_failed': case 'identity_clock_ahead': return error.reason;
      default: return 'unexpected_failure';
    }
  }
  if (error instanceof IdentityUnavailable) return 'identity_unavailable';
  if (error instanceof AuthError && error.code === 'invalid_callback') return 'invalid_callback';
  if (error instanceof AuthError && error.code === 'access_denied') return 'owner_denied';
  if (error instanceof SheetsAccessError && error.code === 'reconnect_required') return 'reconnect_required';
  return 'unexpected_failure';
}
export function createGoogleSetupApp(service: Pick<GoogleSetupService, 'begin' | 'complete'>) {
  const app = Fastify({ logger: false, exposeHeadRoutes: false });
  let result: SetupCompletion | undefined;
  let finish: (value: SetupCompletion) => void = () => {};
  const completion = new Promise<SetupCompletion>((resolve) => { finish = resolve; });
  app.addHook('onRequest', async (request, reply) => {
    if (request.headers.host !== 'localhost:5173') return reply.code(400).send({ error: { code: 'invalid_host' } });
  });
  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header('cache-control', 'no-store').header('referrer-policy', 'no-referrer').header('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
    return payload;
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: { code: 'not_found' } }));
  app.setErrorHandler((_error, _request, reply) => reply.code(400).send({ error: { code: 'setup_failed' } }));
  app.get('/', async (_request, reply) => reply.redirect(service.begin(), 303));
  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>('/api/auth/callback', {
    schema: { querystring: { type: 'object', properties: { code: { type: 'string', maxLength: 4096 }, state: { type: 'string', maxLength: 128 }, error: { type: 'string', maxLength: 128 } } } },
  }, async (request, reply) => {
    if (result) return reply.code(409).send({ error: { code: 'setup_finished' } });
    try {
      result = request.query.error ? { ok: false, reason: request.query.error === 'access_denied' ? 'provider_denied' : 'provider_rejected' } : { ok: true, value: await service.complete({ code: request.query.code ?? '', state: request.query.state ?? '' }) };
    } catch (error) { result = { ok: false, reason: safeReason(error) }; }
    return reply.redirect('/complete', 303);
  });
  app.get('/complete', async (_request, reply) => {
    if (!result) return reply.code(404).send({ error: { code: 'not_found' } });
    finish(result);
    return reply.type('text/html').send(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Google setup</title><main><h1>${result.ok ? 'Google account verified' : 'Google setup failed'}</h1>${result.ok ? '' : `<p>Reason: ${result.reason}</p>`}<p>Return to the local terminal to continue.</p></main></html>`);
  });
  return { app, completion };
}
