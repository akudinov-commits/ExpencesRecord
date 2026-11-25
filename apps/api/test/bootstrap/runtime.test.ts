import { expect, test } from 'vitest';
import { createConfiguredApp } from '../../src/bootstrap/runtime.js';
import { parseAuthConfiguration } from '../../src/bootstrap/auth-config.js';
import { sessionCodec } from '../../src/infrastructure/auth-crypto.js';
import { authEnvironment } from '../support/config.js';

test('real composition requires explicit authentication configuration', () => {
  expect(() => createConfiguredApp({}, false)).toThrow('APP_ORIGIN');
});

test('the configured portable app constructs the real Google URL and real protected encrypted sessions', async () => {
  const app = createConfiguredApp(authEnvironment, false);
  try {
    const login = await app.inject({ url: '/api/auth/login', headers: { host: 'auth.example.test' } });
    expect(login.statusCode).toBe(303);
    const url = new URL(String(login.headers.location));
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('redirect_uri')).toBe('https://auth.example.test/api/auth/callback');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect((await app.inject('/api/auth/session')).statusCode).toBe(401);
    const config = parseAuthConfiguration(authEnvironment);
    const now = Math.floor(Date.now() / 1000);
    const session = { subject: config.allowedSubject, version: config.sessionVersion, csrf: 'synthetic-csrf', issuedAt: now, expiresAt: now + 604800 };
    const codec = sessionCodec(config.sessionKey, config.appOrigin);
    const credential = await codec.seal(session);
    const allowed = await app.inject({ url: '/api/auth/session', headers: { cookie: `__Host-expences_session=${credential}` } });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toEqual({ authenticated: true, csrfToken: 'synthetic-csrf' });
    const denied = await codec.seal({ ...session, subject: 'another-subject' });
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: `__Host-expences_session=${denied}` } })).statusCode).toBe(403);
  } finally { await app.close(); }
});
