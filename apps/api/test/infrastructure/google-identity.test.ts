import { createHash, createSign, generateKeyPairSync } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import type { GetTokenOptions, VerifyIdTokenOptions, LoginTicket } from 'google-auth-library';
import { afterEach, expect, test, vi } from 'vitest';
import { GoogleIdentityAdapter } from '../../src/infrastructure/google-identity.js';
import type { GoogleTokenResponse } from '../../src/infrastructure/google-identity.js';
import { IdentityRejected, IdentityUnavailable } from '../../src/application/ports/auth.js';
import { authFixture, now, owner } from '../support/auth.js';

const clientId = 'test-client.apps.googleusercontent.com';
const redirectUri = 'https://auth.example.test/api/auth/callback';
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const certificates = { 'synthetic-kid': keys.publicKey.export({ format: 'pem', type: 'spki' }).toString() };
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

function token(overrides: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'synthetic-kid' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ iss: 'https://accounts.google.com', aud: clientId, sub: owner, nonce: 'bound-nonce', iat: now - 10, exp: now + 3600, ...overrides })).toString('base64url');
  const signature = createSign('RSA-SHA256').update(`${header}.${body}`).sign(keys.privateKey, 'base64url');
  return `${header}.${body}.${signature}`;
}

function fixture(idToken = token()) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(now * 1000));
  const real = new OAuth2Client({ clientId, clientSecret: 'synthetic-secret', redirectUri });
  const client = {
    generateAuthUrl: real.generateAuthUrl.bind(real),
    getToken: vi.fn<(options: GetTokenOptions) => Promise<GoogleTokenResponse>>().mockResolvedValue({ tokens: { id_token: idToken }, res: null }),
    verifyIdToken: vi.fn<(options: VerifyIdTokenOptions) => Promise<LoginTicket>>().mockImplementation((options) => real.verifySignedJwtWithCertsAsync(options.idToken, certificates, options.audience, ['accounts.google.com', 'https://accounts.google.com'])),
  };
  const adapter = new GoogleIdentityAdapter(client, { clientId, redirectUri }, { now: () => now });
  return { adapter, client, transaction: authFixture().transaction };
}

test('Google authorization binds state/nonce and S256 PKCE, requests only sign-in scopes and no offline token', () => {
  const { adapter, transaction } = fixture();
  const url = new URL(adapter.authorizationUrl(transaction));
  expect(url.origin).toBe('https://accounts.google.com');
  expect(url.searchParams.get('client_id')).toBe(clientId);
  expect(url.searchParams.get('redirect_uri')).toBe(redirectUri);
  expect(url.searchParams.get('state')).toBe(transaction.state);
  expect(url.searchParams.get('nonce')).toBe(transaction.nonce);
  expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(transaction.verifier).digest('base64url'));
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('scope')?.split(' ')).toEqual(['openid', 'email']);
  expect(url.searchParams.get('access_type')).toBe('online');
  expect(url.searchParams.has('code_verifier')).toBe(false);
  expect(url.searchParams.has('client_secret')).toBe(false);
});

test('exchanges the bound code/verifier and verifies a real synthetic RSA-signed Google token', async () => {
  const { adapter, client, transaction } = fixture();
  expect(await adapter.exchange('synthetic-code', transaction)).toEqual({ subject: owner });
  expect(client.getToken).toHaveBeenCalledWith({ code: 'synthetic-code', codeVerifier: transaction.verifier, redirect_uri: redirectUri });
  expect(client.verifyIdToken).toHaveBeenCalledWith(expect.objectContaining({ audience: clientId }));
});

test.each([
  { aud: 'other-client' }, { iss: 'https://forged.example' }, { exp: now - 1 }, { iat: now + 61 },
  { nonce: 'other-nonce' }, { nonce: undefined }, { sub: '' }, { azp: 'another-presenter' },
])('rejects invalid identity claims %j', async (claims) => {
  const { adapter, transaction } = fixture(token(claims));
  await expect(adapter.exchange('code', transaction)).rejects.toBeInstanceOf(IdentityRejected);
});

test('rejects a tampered RSA signature using the real Google verification library', async () => {
  const parts = token().split('.');
  parts[2] = (parts[2]?.[0] === 'A' ? 'B' : 'A') + parts[2]?.slice(1);
  const { adapter, transaction } = fixture(parts.join('.'));
  await expect(adapter.exchange('code', transaction)).rejects.toBeInstanceOf(IdentityRejected);
});

test('a missing ID token never becomes an authenticated identity', async () => {
  const { adapter, client, transaction } = fixture();
  client.getToken.mockResolvedValue({ tokens: { access_token: 'synthetic-access-not-identity' }, res: null });
  await expect(adapter.exchange('code', transaction)).rejects.toBeInstanceOf(IdentityRejected);
  expect(client.verifyIdToken).not.toHaveBeenCalled();
});

test('provider outages remain unavailable rather than invalid-user errors', async () => {
  const { adapter, client, transaction } = fixture();
  client.getToken.mockRejectedValue({ response: { status: 503 }, message: 'sensitive provider details' });
  await expect(adapter.exchange('code', transaction)).rejects.toBeInstanceOf(IdentityUnavailable);
});

test('an invalid or replayed authorization code is rejected without exposing provider details', async () => {
  const { adapter, client, transaction } = fixture();
  client.getToken.mockRejectedValue({ response: { status: 400 }, message: 'sensitive provider details' });
  await expect(adapter.exchange('code', transaction)).rejects.toThrow('Google identity rejected');
});

test('a verified Google token issued too far ahead reports a safe clock diagnostic', async () => {
  const { adapter, transaction } = fixture(token({ iat: now + 90 }));
  await expect(adapter.exchange('code', transaction)).rejects.toMatchObject({ reason: 'identity_clock_ahead', message: 'Google identity rejected' });
});

test('code exchange rejection has a fixed diagnostic without provider message or response details', async () => {
  const { adapter, client, transaction } = fixture();
  client.getToken.mockRejectedValue({ response: { status: 400 }, message: 'synthetic-private-provider-detail' });
  await expect(adapter.exchange('code', transaction)).rejects.toMatchObject({ reason: 'code_exchange_rejected', message: 'Google identity rejected' });
});

test('SDK verification failure reports only its fixed stage, never the credential-bearing SDK error', async () => {
  const { adapter, client, transaction } = fixture();
  client.verifyIdToken.mockRejectedValue(new Error('synthetic-private-id-token'));
  await expect(adapter.exchange('code', transaction)).rejects.toMatchObject({ reason: 'identity_verification_failed', message: 'Google identity rejected' });
});
