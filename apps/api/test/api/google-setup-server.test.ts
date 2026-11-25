import type { FastifyInstance } from 'fastify';
import { afterEach, expect, test, vi } from 'vitest';
import { createGoogleSetupApp } from '../../src/api/google-setup-server.js';
import { GoogleSetupService } from '../../src/application/google-setup.js';
import { IdentityRejected } from '../../src/application/ports/auth.js';
const opened: FastifyInstance[] = [];
afterEach(async () => { await Promise.all(opened.splice(0).map(app => app.close())); });
function fixture() {
  const service = { begin: vi.fn(() => 'https://accounts.google.com/synthetic-consent'), complete: vi.fn(async () => ({ subject: 'synthetic-owner', refreshToken: 'synthetic-refresh' })) };
  const result = createGoogleSetupApp(service); opened.push(result.app);
  return { ...result, service };
}
const host = { host: 'localhost:5173' };
test('local setup begins Google navigation without a public enrollment API', async () => {
  const { app } = fixture();
  const response = await app.inject({ url: '/', headers: host });
  expect(response.statusCode).toBe(303);
  expect(response.headers.location).toBe('https://accounts.google.com/synthetic-consent');
  expect(response.headers['cache-control']).toBe('no-store');
});
test('callback credentials stay in the local operator process and the browser moves to a clean URL', async () => {
  const { app, service, completion } = fixture();
  const callback = await app.inject({ url: '/api/auth/callback?code=synthetic-code&state=bound-state', headers: host });
  expect(service.complete).toHaveBeenCalledExactlyOnceWith({ code: 'synthetic-code', state: 'bound-state' });
  expect(callback.statusCode).toBe(303);
  expect(callback.headers.location).toBe('/complete');
  const response = await app.inject({ url: '/complete', headers: host });
  expect(response.body).toContain('Return to the local terminal');
  expect(response.body).not.toMatch(/synthetic-(?:owner|refresh|code)/);
  expect(await completion).toEqual({ ok: true, value: { subject: 'synthetic-owner', refreshToken: 'synthetic-refresh' } });
});
test.each(['provider-denial', 'exchange-error'])('setup %s is explicit and contains no provider details', async (failure) => {
  const { app, service, completion } = fixture();
  service.complete.mockRejectedValue(new Error('synthetic-sensitive-provider-error'));
  const url = failure === 'provider-denial' ? '/api/auth/callback?error=access_denied' : '/api/auth/callback?code=code&state=state';
  expect((await app.inject({ url, headers: host })).statusCode).toBe(303);
  const response = await app.inject({ url: '/complete', headers: host });
  expect(response.body).toContain('Google setup failed');
  expect(response.body).not.toContain('synthetic-sensitive-provider-error');
  expect(await completion).toEqual({ ok: false, reason: failure === 'provider-denial' ? 'provider_denied' : 'unexpected_failure' });
  if (failure === 'provider-denial') expect(service.complete).not.toHaveBeenCalled();
});
test('DNS rebinding, unexpected methods and unknown paths cannot reach the setup service', async () => {
  const { app, service } = fixture();
  expect((await app.inject({ url: '/', headers: { host: 'attacker.example' } })).statusCode).toBe(400);
  expect((await app.inject({ method: 'POST', url: '/api/auth/callback', headers: host })).statusCode).toBe(404);
  expect((await app.inject({ url: '/unknown?code=synthetic-private-code', headers: host })).body).not.toContain('synthetic-private-code');
  expect(service.begin).not.toHaveBeenCalled(); expect(service.complete).not.toHaveBeenCalled();
});

test('opening localhost again while Google sign-in is pending resumes the same bound flow', async () => {
  let serial = 0;
  const consent = { authorizationUrl: vi.fn(() => 'https://accounts.google.com/synthetic-consent'), exchange: vi.fn(async () => ({ subject: 'synthetic-owner' })) };
  const service = new GoogleSetupService({ mode: 'owner' }, consent, { now: () => 1800000000 }, { token: () => `random-${++serial}`, equal: (a, b) => a === b });
  const { app } = createGoogleSetupApp(service); opened.push(app);
  const first = await app.inject({ url: '/', headers: host });
  const reopened = await app.inject({ url: '/', headers: host });
  expect(first.statusCode).toBe(303);
  expect(reopened.statusCode).toBe(303);
  expect(reopened.headers.location).toBe(first.headers.location);
  expect(consent.authorizationUrl).toHaveBeenCalledOnce();
  expect((await app.inject({ url: '/api/auth/callback?code=code&state=random-1', headers: host })).statusCode).toBe(303);
  expect(consent.exchange).toHaveBeenCalledOnce();
});

test('a clock validation failure reaches the local operator as a fixed safe diagnostic', async () => {
  const { app, service, completion } = fixture();
  service.complete.mockRejectedValue(Object.assign(new IdentityRejected('synthetic-private-code-or-token'), { reason: 'identity_clock_ahead' }));
  await app.inject({ url: '/api/auth/callback?code=code&state=state', headers: host });
  const page = await app.inject({ url: '/complete', headers: host });
  expect(page.body).toContain('identity_clock_ahead');
  expect(page.body).not.toContain('synthetic-private');
  expect(await completion).toEqual({ ok: false, reason: 'identity_clock_ahead' });
});
