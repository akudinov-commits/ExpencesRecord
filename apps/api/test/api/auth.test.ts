import type { FastifyInstance } from 'fastify';
import { afterEach, expect, test } from 'vitest';
import { createApp } from '../../src/bootstrap/create-app.js';
import { authFixture } from '../support/auth.js';

const opened: FastifyInstance[] = [];
afterEach(async () => { await Promise.all(opened.splice(0).map((app) => app.close())); });

function fixture(secure = false) {
  const auth = authFixture();
  const app = createApp({ logger: false }, { service: auth.service, appOrigin: secure ? 'https://auth.example.test' : 'http://localhost:5173', secureCookies: secure });
  opened.push(app);
  app.get('/api/private-test', async () => ({ private: true }));
  app.get('/api/auth/not-public', async () => ({ private: true }));
  app.post('/api/mutate-test', async () => ({ changed: true }));
  return { app, ...auth };
}

const browser = { host: 'localhost:5173', cookie: 'expences_session_dev=synthetic-session' };
const mutation = { ...browser, origin: 'http://localhost:5173', 'x-csrf-token': 'bound-csrf' };

test('all new routes are protected by default, including other paths under auth', async () => {
  const { app } = fixture();
  for (const url of ['/api/private-test', '/api/auth/not-public', '/api/auth/session']) {
    const response = await app.inject({ url });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: { code: 'unauthenticated' } });
  }
});

test('only minimal health and the specified login/callback methods can be public', async () => {
  const { app } = fixture();
  expect((await app.inject('/api/health')).json()).toEqual({ status: 'ok' });
  expect((await app.inject({ method: 'HEAD', url: '/api/health' })).statusCode).toBe(200);
  expect((await app.inject({ method: 'HEAD', url: '/api/auth/login' })).statusCode).toBe(404);
  expect((await app.inject({ method: 'POST', url: '/api/auth/login' })).statusCode).toBe(404);
});

test('login begins on the canonical origin and issues a bounded HttpOnly flow cookie', async () => {
  const { app } = fixture();
  const response = await app.inject({ url: '/api/auth/login', headers: { host: 'localhost:5173' } });
  expect(response.statusCode).toBe(303);
  expect(response.headers.location).toBe('https://accounts.google.com/example-test-authorization');
  expect(String(response.headers['set-cookie'])).toContain('expences_oauth_dev=sealed-flow');
  expect(String(response.headers['set-cookie'])).toMatch(/Max-Age=600/);
  expect(String(response.headers['set-cookie'])).toContain('HttpOnly');
  expect(String(response.headers['set-cookie'])).toContain('SameSite=Lax');
});

test('an ephemeral or forged host redirects to the fixed canonical login before creating state', async () => {
  const { app, ports } = fixture(true);
  const response = await app.inject({ url: '/api/auth/login?returnTo=https://attacker.example', headers: { host: 'untrusted.example' } });
  expect(response.statusCode).toBe(303);
  expect(response.headers.location).toBe('https://auth.example.test/api/auth/login');
  expect(ports.transactions.seal).not.toHaveBeenCalled();
  expect(response.headers['set-cookie']).toBeUndefined();
});

test('a bound callback establishes a seven-day cookie and removes transaction state', async () => {
  const { app } = fixture();
  const response = await app.inject({ url: '/api/auth/callback?code=synthetic-code&state=bound-state', headers: { host: 'localhost:5173', cookie: 'expences_oauth_dev=flow' } });
  expect(response.statusCode).toBe(303);
  expect(response.headers.location).toBe('http://localhost:5173/');
  const cookie = String(response.headers['set-cookie']);
  expect(cookie).toContain('expences_session_dev=sealed-session');
  expect(cookie).toContain('Max-Age=604800');
  expect(cookie).toContain('expences_oauth_dev=;');
});

test('HTTPS session cookies are host-only, Secure, HttpOnly and SameSite Lax', async () => {
  const { app } = fixture(true);
  const response = await app.inject({ url: '/api/auth/callback?code=code&state=bound-state', headers: { host: 'auth.example.test', cookie: '__Host-expences_oauth=flow' } });
  const cookie = String(response.headers['set-cookie']);
  expect(cookie).toContain('__Host-expences_session=sealed-session');
  expect(cookie).toContain('Secure');
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  expect(cookie).toContain('Path=/');
  expect(cookie).not.toContain('Domain=');
});

test.each(['missing-cookie', 'wrong-state', 'google-denied', 'wrong-subject'])('callback %s creates no session and uses a fixed safe failure redirect', async (failure) => {
  const { app, ports } = fixture();
  if (failure === 'wrong-subject') ports.identity.exchange.mockResolvedValue({ subject: 'another-valid-subject' });
  const state = failure === 'wrong-state' ? 'forged' : 'bound-state';
  const url = failure === 'google-denied' ? '/api/auth/callback?error=access_denied&state=bound-state' : `/api/auth/callback?code=code&state=${state}`;
  const response = await app.inject({ url, headers: { host: 'localhost:5173', cookie: failure === 'missing-cookie' ? '' : 'expences_oauth_dev=flow' } });
  expect(response.statusCode).toBe(303);
  expect(response.headers.location).toMatch(/^http:\/\/localhost:5173\/\?auth=(?:failed|denied)$/);
  expect(String(response.headers['set-cookie'])).not.toContain('sealed-session');
  expect(ports.sessions.seal).not.toHaveBeenCalled();
});

test('the protected session endpoint returns only session status and in-memory CSRF material without renewal', async () => {
  const { app, ports } = fixture();
  const response = await app.inject({ url: '/api/auth/session', headers: browser });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ authenticated: true, csrfToken: 'bound-csrf' });
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.headers['set-cookie']).toBeUndefined();
  expect(ports.sessions.seal).not.toHaveBeenCalled();
});

test('a valid session for another subject is still denied by application authorization', async () => {
  const { app, session } = fixture();
  session.subject = 'different-subject';
  expect((await app.inject({ url: '/api/private-test', headers: browser })).statusCode).toBe(403);
});

test.each(['wrong-state', 'provider-error'])('an unsolicited %s callback cannot perform a CSRF logout of an existing session', async (failure) => {
  const { app } = fixture();
  const url = failure === 'provider-error' ? '/api/auth/callback?error=access_denied' : '/api/auth/callback?code=code&state=forged';
  const response = await app.inject({ url, headers: { ...browser, cookie: `${browser.cookie}; expences_oauth_dev=flow` } });
  expect(response.statusCode).toBe(303);
  expect(String(response.headers['set-cookie'])).not.toContain('expences_session_dev=;');
});

test.each(['missing-origin', 'wrong-origin', 'missing-csrf', 'wrong-csrf'])('every protected mutation rejects %s', async (failure) => {
  const { app } = fixture();
  const headers: Record<string, string> = { ...mutation };
  if (failure === 'missing-origin') delete headers.origin;
  if (failure === 'wrong-origin') headers.origin = 'https://attacker.example';
  if (failure === 'missing-csrf') delete headers['x-csrf-token'];
  if (failure === 'wrong-csrf') headers['x-csrf-token'] = 'forged';
  const response = await app.inject({ method: 'POST', url: '/api/mutate-test', headers });
  expect(response.statusCode).toBe(403);
  expect(response.headers['set-cookie']).toBeUndefined();
});

test('valid protected mutations work and logout clears only the browser session', async () => {
  const { app } = fixture();
  expect((await app.inject({ method: 'POST', url: '/api/mutate-test', headers: mutation })).json()).toEqual({ changed: true });
  const response = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: mutation });
  expect(response.statusCode).toBe(204);
  expect(String(response.headers['set-cookie'])).toContain('expences_session_dev=;');
});

test('logout rejects unexpected body fields and malformed JSON as client input errors', async () => {
  const { app } = fixture();
  const extra = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: mutation, payload: { unexpected: true } });
  expect(extra.statusCode).toBe(400);
  const malformed = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { ...mutation, 'content-type': 'application/json' }, payload: '{' });
  expect(malformed.statusCode).toBe(400);
  expect(malformed.json()).toEqual({ error: { code: 'invalid_request' } });
});

test('a factory without auth dependencies still fails closed for subsequently registered private routes', async () => {
  const app = createApp({ logger: false });
  opened.push(app);
  app.get('/api/private-test', async () => ({ private: true }));
  expect((await app.inject('/api/private-test')).statusCode).toBe(503);
});

test('request and error logs cannot disclose OAuth codes, cookies, bearer values or provider details', async () => {
  let output = '';
  const auth = authFixture();
  auth.ports.identity.exchange.mockRejectedValue(new Error('do-not-log-provider-detail'));
  const app = createApp({ logger: { stream: { write: (line: string) => { output += line; } } } }, { service: auth.service, appOrigin: 'http://localhost:5173', secureCookies: false });
  opened.push(app);
  const response = await app.inject({ url: '/api/auth/callback?code=do-not-log-code&state=bound-state', headers: { host: 'localhost:5173', cookie: 'expences_oauth_dev=do-not-log-cookie', authorization: 'Bearer do-not-log-bearer' } });
  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({ error: { code: 'internal_error' } });
  expect(output).not.toMatch(/do-not-log-(?:code|cookie|bearer|provider-detail)/);
});

test('unknown routes do not reflect or log secret-bearing query strings', async () => {
  let output = '';
  const app = createApp({ logger: { stream: { write: (line: string) => { output += line; } } } });
  opened.push(app);
  const response = await app.inject('/api/auth/unknown?code=synthetic-private-code');
  expect(response.statusCode).toBe(404);
  expect(response.body).not.toContain('synthetic-private-code');
  expect(output).not.toContain('synthetic-private-code');
});
