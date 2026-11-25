import { expect, test } from 'vitest';
import { AuthError, AuthService } from '../../src/application/auth.js';
import { IdentityRejected, IdentityUnavailable } from '../../src/application/ports/auth.js';
import { authFixture, now, owner } from '../support/auth.js';

test.each(['allowedSubject', 'sessionVersion'] as const)('missing %s cannot create a permissive application policy', (field) => {
  const { ports } = authFixture();
  expect(() => new AuthService({ allowedSubject: owner, sessionVersion: 'version-1', [field]: ' ' }, ports)).toThrow('Authentication policy configuration is required');
});

test('starts a fresh ten-minute transaction with independent state, nonce and PKCE verifier', async () => {
  const { service, ports } = authFixture();
  expect(await service.beginLogin()).toEqual({ transactionToken: 'sealed-flow', authorizationUrl: 'https://accounts.google.com/example-test-authorization' });
  const expected = { state: 'random-1', nonce: 'random-2', verifier: 'random-3', issuedAt: now, expiresAt: now + 600 };
  expect(ports.transactions.seal).toHaveBeenCalledWith(expected);
  expect(ports.identity.authorizationUrl).toHaveBeenCalledWith(expected);
});

test('the verified configured subject receives a fixed seven-day app session without Google credentials', async () => {
  const { service, ports, transaction } = authFixture();
  expect(await service.completeLogin({ transactionToken: 'flow', state: transaction.state, code: 'synthetic-code' })).toEqual({ sessionToken: 'sealed-session' });
  expect(ports.identity.exchange).toHaveBeenCalledWith('synthetic-code', transaction);
  expect(ports.sessions.seal).toHaveBeenCalledWith({ subject: owner, version: 'version-1', csrf: 'random-1', issuedAt: now, expiresAt: now + 604800 });
});

test('a valid different Google identity is rejected by application policy', async () => {
  const { service, ports, transaction } = authFixture();
  ports.identity.exchange.mockResolvedValue({ subject: 'another-valid-subject' });
  await expect(service.completeLogin({ transactionToken: 'flow', state: transaction.state, code: 'code' })).rejects.toMatchObject({ code: 'access_denied' });
  expect(ports.sessions.seal).not.toHaveBeenCalled();
});

test.each(['absent', 'expired', 'wrong-state', 'future', 'too-long', 'empty-code'])('rejects %s callback binding before contacting Google', async (failure) => {
  const { service, ports, transaction } = authFixture();
  if (failure === 'absent') ports.transactions.open.mockResolvedValue(null);
  if (failure === 'expired') transaction.expiresAt = now;
  if (failure === 'future') transaction.issuedAt = now + 61;
  if (failure === 'too-long') transaction.expiresAt = now + 601;
  await expect(service.completeLogin({ transactionToken: 'flow', state: failure === 'wrong-state' ? 'forged-state' : transaction.state, code: failure === 'empty-code' ? '' : 'code' })).rejects.toMatchObject({ code: 'invalid_callback' });
  expect(ports.identity.exchange).not.toHaveBeenCalled();
});

test.each([
  [new IdentityRejected(), 'invalid_callback'],
  [new IdentityUnavailable(), 'identity_unavailable'],
] as const)('translates a known identity adapter failure without creating a session: %s', async (error, code) => {
  const { service, ports, transaction } = authFixture();
  ports.identity.exchange.mockRejectedValue(error);
  await expect(service.completeLogin({ transactionToken: 'flow', state: transaction.state, code: 'code' })).rejects.toMatchObject({ code });
  expect(ports.sessions.seal).not.toHaveBeenCalled();
});

test('does not disguise an unexpected implementation failure as an authentication result', async () => {
  const { service, ports, transaction } = authFixture();
  const failure = new Error('unexpected internal failure');
  ports.identity.exchange.mockRejectedValue(failure);
  await expect(service.completeLogin({ transactionToken: 'flow', state: transaction.state, code: 'code' })).rejects.toBe(failure);
});

test('authenticates the current owner session without extending it', async () => {
  const { service, ports, session } = authFixture();
  expect(await service.authenticate('session')).toEqual(session);
  expect(ports.sessions.seal).not.toHaveBeenCalled();
});

test('an absent encoded session is rejected before invoking even a permissive port double', async () => {
  const { service, ports } = authFixture();
  await expect(service.authenticate('')).rejects.toMatchObject({ code: 'unauthenticated' });
  expect(ports.sessions.open).not.toHaveBeenCalled();
});

test('an absent encoded callback transaction cannot be replaced by a port double', async () => {
  const { service, ports, transaction } = authFixture();
  await expect(service.completeLogin({ transactionToken: '', state: transaction.state, code: 'code' })).rejects.toMatchObject({ code: 'invalid_callback' });
  expect(ports.identity.exchange).not.toHaveBeenCalled();
});

test.each(['absent', 'expired', 'version', 'future', 'too-long', 'empty-csrf'])('rejects %s app sessions', async (failure) => {
  const { service, ports, session } = authFixture();
  if (failure === 'absent') ports.sessions.open.mockResolvedValue(null);
  if (failure === 'expired') session.expiresAt = now;
  if (failure === 'version') session.version = 'revoked-version';
  if (failure === 'future') session.issuedAt = now + 61;
  if (failure === 'too-long') session.expiresAt = now + 604801;
  if (failure === 'empty-csrf') session.csrf = '';
  await expect(service.authenticate('session')).rejects.toMatchObject({ code: 'unauthenticated' });
});

test('application policy denies a structurally valid session for another subject', async () => {
  const { service, session } = authFixture();
  session.subject = 'another-subject';
  await expect(service.authenticate('session')).rejects.toMatchObject({ code: 'access_denied' });
});

test('logout requires matching CSRF and preserves the documented no-store replay limitation', async () => {
  const { service, session } = authFixture();
  await expect(service.logout('session', 'forged-csrf')).rejects.toMatchObject({ code: 'invalid_csrf' });
  await expect(service.logout('session', session.csrf)).resolves.toBeUndefined();
  expect(await service.authenticate('copied-session')).toEqual(session);
});

test('an absent CSRF value is rejected even if a faulty caller passes an empty expected value', () => {
  const { service, session } = authFixture();
  session.csrf = '';
  expect(() => service.assertCsrf(session, '')).toThrow(AuthError);
});
