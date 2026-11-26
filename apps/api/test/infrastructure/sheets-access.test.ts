import type { Credentials, TokenInfo } from 'google-auth-library';
import { expect, test, vi } from 'vitest';
import { GoogleSheetsCredentials, GoogleSpreadsheetProbe, READONLY_SHEETS_SCOPE } from '../../src/infrastructure/sheets-access.js';
import type { GoogleRefreshClient } from '../../src/infrastructure/sheets-access.js';
import { now } from '../support/auth.js';

const clientId = 'test-client.apps.googleusercontent.com';
function fixture(permission: 'read' | 'write' = 'read') {
  let listener: (value: Credentials) => void = () => {};
  const info: TokenInfo = { aud: clientId, sub: 'verified-subject', expiry_date: (now + 3600) * 1000, scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.email', READONLY_SHEETS_SCOPE] };
  const client = {
    setCredentials: vi.fn<(value: Credentials) => void>(),
    on: vi.fn<GoogleRefreshClient['on']>().mockImplementation((_event, value) => { listener = value; }),
    getAccessToken: vi.fn<GoogleRefreshClient['getAccessToken']>().mockResolvedValue({ token: 'synthetic-access' }),
    getTokenInfo: vi.fn<GoogleRefreshClient['getTokenInfo']>().mockResolvedValue(info),
  };
  const provider = new GoogleSheetsCredentials(client, { refreshToken: 'synthetic-refresh', clientId, permission }, { now: () => now });
  return { provider, client, info, emit: (value: Credentials) => listener(value) };
}
test('refresh stays behind the SDK and returns only server-side access plus verified subject', async () => {
  const { provider, client } = fixture();
  expect(await provider.get()).toEqual({ accessToken: 'synthetic-access', subject: 'verified-subject' });
  expect(client.setCredentials).toHaveBeenCalledExactlyOnceWith({ refresh_token: 'synthetic-refresh' });
  expect(client.getTokenInfo).toHaveBeenCalledExactlyOnceWith('synthetic-access');
});
test('missing refresh configuration is explicitly reconnect-required', () => {
  const { client } = fixture();
  expect(() => new GoogleSheetsCredentials(client, { refreshToken: '', clientId }, { now: () => now })).toThrow('reconnect_required');
});
test.each([400, 401, 403])('invalid/revoked credentials (%s) require reconnect without provider details', async (status) => {
  const { provider, client } = fixture();
  client.getAccessToken.mockRejectedValue({ response: { status }, message: 'synthetic-sensitive-detail' });
  await expect(provider.get()).rejects.toMatchObject({ code: 'reconnect_required', message: 'reconnect_required' });
});
test.each([429, 503, undefined])('transient provider failure (%s) stays unavailable', async (status) => {
  const { provider, client } = fixture();
  client.getAccessToken.mockRejectedValue({ response: { status }, message: 'synthetic-sensitive-detail' });
  await expect(provider.get()).rejects.toMatchObject({ code: 'unavailable', message: 'unavailable' });
});
test.each(['empty-token', 'no-sheets-scope', 'write-scope', 'wrong-client', 'missing-subject', 'expired'])('invalid grant metadata (%s) cannot be used', async (failure) => {
  const { provider, client, info } = fixture();
  if (failure === 'empty-token') client.getAccessToken.mockResolvedValue({ token: null });
  if (failure === 'no-sheets-scope') info.scopes = ['openid', 'email'];
  if (failure === 'write-scope') info.scopes.push('https://www.googleapis.com/auth/spreadsheets');
  if (failure === 'wrong-client') info.aud = 'other-client';
  if (failure === 'missing-subject') delete info.sub;
  if (failure === 'expired') info.expiry_date = now * 1000;
  await expect(provider.get()).rejects.toMatchObject({ code: 'reconnect_required' });
});
test('unexpected refresh-token replacement blocks use until controlled reconnection', async () => {
  const { provider, client, emit } = fixture();
  client.getAccessToken.mockImplementation(async () => { emit({ access_token: 'synthetic-access', refresh_token: 'replacement-refresh' }); return { token: 'synthetic-access' }; });
  await expect(provider.get()).rejects.toMatchObject({ code: 'reconnect_required' });
  await expect(provider.get()).rejects.toMatchObject({ code: 'reconnect_required' });
  expect(client.getAccessToken).toHaveBeenCalledOnce();
});
test('normal refresh events without replacement remain usable', async () => {
  const { provider, emit } = fixture();
  emit({ access_token: 'synthetic-access' });
  expect(await provider.get()).toMatchObject({ subject: 'verified-subject' });
});
test('the read-only probe requests only the configured spreadsheet ID, with no grid data', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ spreadsheetId: 'synthetic_test_id' })));
  expect(await new GoogleSpreadsheetProbe(request).check('synthetic_test_id', 'synthetic-access')).toBeUndefined();
  const [input, options] = request.mock.calls[0] ?? [];
  const url = new URL(String(input));
  expect(url.origin).toBe('https://sheets.googleapis.com');
  expect(url.pathname).toBe('/v4/spreadsheets/synthetic_test_id');
  expect(url.searchParams.get('fields')).toBe('spreadsheetId');
  expect(url.searchParams.get('includeGridData')).toBe('false');
  expect(options).toMatchObject({ method: 'GET', headers: { Authorization: 'Bearer synthetic-access' }, redirect: 'error' });
  expect(options?.body).toBeUndefined();
});
test.each([[401, 'reconnect_required'], [403, 'access_denied'], [404, 'access_denied'], [429, 'unavailable'], [503, 'unavailable']])('probe failure %s maps to safe %s without retries', async (status, code) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('synthetic-sensitive-detail', { status: Number(status) }));
  await expect(new GoogleSpreadsheetProbe(request).check('synthetic_test_id', 'synthetic-access')).rejects.toMatchObject({ code, message: code });
  expect(request).toHaveBeenCalledOnce();
});
test.each(['{}', '{"spreadsheetId":"different"}', 'not-json'])('invalid probe response %s is unavailable', async (body) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
  await expect(new GoogleSpreadsheetProbe(request).check('synthetic_test_id', 'synthetic-access')).rejects.toMatchObject({ code: 'unavailable' });
});
test('network failure does not expose credential-bearing request details', async () => {
  const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('synthetic-access synthetic_test_id'));
  await expect(new GoogleSpreadsheetProbe(request).check('synthetic_test_id', 'synthetic-access')).rejects.toThrow('unavailable');
});

test('explicit writer credentials require and accept the granted Sheets write scope', async () => {
  const f = fixture('write'); f.info.scopes = ['openid', 'email', 'https://www.googleapis.com/auth/spreadsheets'];
  expect(await f.provider.get()).toEqual({ accessToken: 'synthetic-access', subject: 'verified-subject' });
});
test('writer credentials cannot accept a merely read-only grant', async () => {
  const f = fixture('write'); await expect(f.provider.get()).rejects.toMatchObject({ code: 'reconnect_required' });
});
test('writer credentials allow the explicitly approved old read scope alongside write but reject unrelated scopes', async () => {
  const f = fixture('write'); f.info.scopes.push('https://www.googleapis.com/auth/spreadsheets');
  expect(await f.provider.get()).toMatchObject({ subject: 'verified-subject' });
  f.info.scopes.push('https://www.googleapis.com/auth/drive');
  await expect(f.provider.get()).rejects.toMatchObject({ code: 'reconnect_required' });
});
