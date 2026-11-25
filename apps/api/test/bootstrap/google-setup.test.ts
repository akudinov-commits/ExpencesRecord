import { afterEach, expect, test, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createGoogleSetupRuntime, createSheetsProbe, saveGoogleSetupResult } from '../../src/bootstrap/google-setup.js';
import { authEnvironment } from '../support/config.js';
const registration = { clientId: authEnvironment.GOOGLE_CLIENT_ID, clientSecret: authEnvironment.GOOGLE_CLIENT_SECRET, redirectUri: 'http://localhost:5173/api/auth/callback' };
const opened: FastifyInstance[] = [];
afterEach(async () => { await Promise.all(opened.splice(0).map(app => app.close())); });
test('explicit operator confirmation is required before storing the initial verified owner', async () => {
  const confirm = vi.fn(async () => true); const save = vi.fn<(values: Record<string, string>) => Promise<void>>().mockResolvedValue();
  expect(await saveGoogleSetupResult({ mode: 'owner', registration, result: { subject: 'verified-owner' }, environment: {} }, confirm, save)).toBe(true);
  expect(confirm).toHaveBeenCalledOnce();
  expect(save).toHaveBeenCalledOnce();
  const settings = save.mock.calls[0]?.[0];
  expect(settings).toMatchObject({ GOOGLE_ALLOWED_SUBJECT: 'verified-owner', GOOGLE_CLIENT_ID: registration.clientId, GOOGLE_CLIENT_SECRET: registration.clientSecret, APP_ORIGIN: 'http://localhost:5173', HOST: '127.0.0.1', PORT: '3001', AUTH_SESSION_VERSION: '1' });
  expect(settings?.AUTH_SESSION_KEY).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(settings?.AUTH_FLOW_KEY).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(settings?.AUTH_SESSION_KEY).not.toBe(settings?.AUTH_FLOW_KEY);
  expect(settings).not.toHaveProperty('GOOGLE_SHEETS_REFRESH_TOKEN');
});
test('declined owner confirmation writes nothing', async () => {
  const confirm = vi.fn(async () => false); const save = vi.fn();
  expect(await saveGoogleSetupResult({ mode: 'owner', registration, result: { subject: 'verified-owner' }, environment: {} }, confirm, save)).toBe(false);
  expect(confirm).toHaveBeenCalledOnce(); expect(save).not.toHaveBeenCalled();
});
test('repeated owner setup preserves configured cookie keys and session version', async () => {
  const save = vi.fn<(values: Record<string, string>) => Promise<void>>().mockResolvedValue();
  await saveGoogleSetupResult({ mode: 'owner', registration, result: { subject: authEnvironment.GOOGLE_ALLOWED_SUBJECT }, environment: authEnvironment }, async () => true, save);
  expect(save.mock.calls[0]?.[0]).toMatchObject({ AUTH_SESSION_KEY: authEnvironment.AUTH_SESSION_KEY, AUTH_FLOW_KEY: authEnvironment.AUTH_FLOW_KEY, AUTH_SESSION_VERSION: authEnvironment.AUTH_SESSION_VERSION });
});
test('the separately confirmed Sheets grant updates only the refresh setting', async () => {
  const save = vi.fn<(values: Record<string, string>) => Promise<void>>().mockResolvedValue();
  expect(await saveGoogleSetupResult({ mode: 'sheets', registration, result: { subject: 'verified-owner', refreshToken: 'synthetic-refresh' }, environment: authEnvironment }, async () => true, save)).toBe(true);
  expect(save).toHaveBeenCalledExactlyOnceWith({ GOOGLE_SHEETS_REFRESH_TOKEN: 'synthetic-refresh' });
});
test('local setup composition requests the approved consent flow without provider I/O', async () => {
  const { app } = createGoogleSetupRuntime('owner', registration); opened.push(app);
  const response = await app.inject({ url: '/', headers: { host: 'localhost:5173' } });
  expect(response.statusCode).toBe(303);
  const url = new URL(response.headers.location ?? '');
  expect(url.origin).toBe('https://accounts.google.com');
  expect(url.searchParams.get('redirect_uri')).toBe(registration.redirectUri);
  expect(url.searchParams.get('scope')).toBe('openid email');
});
test('Sheets consent and probe composition fail before network I/O when required configuration is absent', () => {
  expect(() => createGoogleSetupRuntime('sheets', registration)).toThrow('Google owner configuration is required');
  expect(() => createSheetsProbe({})).toThrow('APP_ORIGIN');
  expect(() => createSheetsProbe(authEnvironment)).toThrow('GOOGLE_SHEETS_REFRESH_TOKEN');
});
