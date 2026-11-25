import { expect, test, vi } from 'vitest';
import { LoginTicket, OAuth2Client } from 'google-auth-library';
import { GoogleOperatorConsent } from '../../src/infrastructure/google-setup-consent.js';
import type { GoogleOAuthClient, GoogleTokenResponse } from '../../src/infrastructure/google-identity.js';
import { READONLY_SHEETS_SCOPE } from '../../src/infrastructure/sheets-access.js';
import { authFixture, now, owner } from '../support/auth.js';

function fixture() {
  const configuration = { clientId: 'test-client.apps.googleusercontent.com', redirectUri: 'http://localhost:5173/api/auth/callback' };
  const real = new OAuth2Client(configuration.clientId);
  const response: GoogleTokenResponse = { tokens: { id_token: 'synthetic-id', access_token: 'synthetic-access', refresh_token: 'synthetic-refresh' }, res: null };
  const payload = { sub: owner, aud: configuration.clientId, iss: 'https://accounts.google.com', iat: now, exp: now + 3600, nonce: 'bound-nonce' };
  const client = { generateAuthUrl: real.generateAuthUrl.bind(real), getToken: vi.fn<GoogleOAuthClient['getToken']>().mockResolvedValue(response), verifyIdToken: vi.fn<GoogleOAuthClient['verifyIdToken']>().mockResolvedValue(new LoginTicket('', payload)) };
  return { consent: new GoogleOperatorConsent(client, configuration, { now: () => now }), client, transaction: authFixture().transaction, payload };
}
test('offline consent requests only approved identity and read-only Sheets scopes with PKCE', () => {
  const { consent, transaction } = fixture();
  const url = new URL(consent.authorizationUrl(transaction, true));
  expect(url.searchParams.get('scope')?.split(' ')).toEqual(['openid', 'email', READONLY_SHEETS_SCOPE]);
  expect(url.searchParams.get('access_type')).toBe('offline');
  expect(url.searchParams.get('prompt')).toBe('consent');
  expect(url.searchParams.get('include_granted_scopes')).toBe('false');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.has('code_verifier')).toBe(false);
});
test('initial identity discovery never requests offline Sheets access', () => {
  const { consent, transaction } = fixture();
  const url = new URL(consent.authorizationUrl(transaction, false));
  expect(url.searchParams.get('scope')).toBe('openid email');
  expect(url.searchParams.get('access_type')).toBe('online');
});
test('operator exchange reuses Google identity verification and returns no access or ID tokens', async () => {
  const { consent, transaction, client } = fixture();
  expect(await consent.exchange('code', transaction)).toEqual({ subject: owner, refreshToken: 'synthetic-refresh' });
  expect(client.getToken).toHaveBeenCalledOnce();
  expect(client.verifyIdToken).toHaveBeenCalledOnce();
});
test('a nonce mismatch cannot produce a setup result or refresh credential', async () => {
  const { consent, transaction, payload } = fixture(); payload.nonce = 'forged';
  await expect(consent.exchange('code', transaction)).rejects.toThrow('Google identity rejected');
});
