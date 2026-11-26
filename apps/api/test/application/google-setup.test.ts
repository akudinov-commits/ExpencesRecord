import { expect, test, vi } from 'vitest';
import { GoogleSetupService } from '../../src/application/google-setup.js';
import type { GoogleSetupConsent } from '../../src/application/ports/google-setup.js';
import { now, owner } from '../support/auth.js';

function fixture(mode: 'owner' | 'sheets' | 'sheets-write' = 'owner') {
  let time = now; let serial = 0;
  const consent = { authorizationUrl: vi.fn<GoogleSetupConsent['authorizationUrl']>().mockReturnValue('https://accounts.google.com/synthetic-consent'), exchange: vi.fn<GoogleSetupConsent['exchange']>().mockResolvedValue({ subject: owner, refreshToken: 'synthetic-refresh' }) };
  const configuration = { mode, allowedSubject: owner };
  const clock = { now: () => time };
  const secrets = { token: () => `random-${++serial}`, equal: (a: string, b: string) => a === b };
  const service = new GoogleSetupService(configuration, consent, clock, secrets);
  return { service, consent, configuration, clock, secrets, advance: () => { time += 601; } };
}
test('owner discovery requests online identity only, binds state/nonce/verifier and excludes refresh credentials from result', async () => {
  const { service, consent } = fixture();
  expect(service.begin()).toBe('https://accounts.google.com/synthetic-consent');
  expect(consent.authorizationUrl).toHaveBeenCalledWith({ state: 'random-1', nonce: 'random-2', verifier: 'random-3', issuedAt: now, expiresAt: now + 600 }, false);
  expect(await service.complete({ code: 'code', state: 'random-1' })).toEqual({ subject: owner });
});
test('Sheets setup requires the configured owner and passes the separate offline grant to operator storage', async () => {
  const { service, consent } = fixture('sheets');
  service.begin();
  expect(consent.authorizationUrl).toHaveBeenCalledWith(expect.any(Object), true);
  expect(await service.complete({ code: 'code', state: 'random-1' })).toEqual({ subject: owner, refreshToken: 'synthetic-refresh' });
});
test('Sheets setup is disabled until the stable owner is explicitly configured', () => {
  const { consent, clock, secrets } = fixture();
  expect(() => new GoogleSetupService({ mode: 'sheets' }, consent, clock, secrets)).toThrow('Google owner configuration is required');
});
test('another verified subject cannot replace an existing owner or supply a Sheets grant', async () => {
  const { service, consent } = fixture('sheets');
  consent.exchange.mockResolvedValue({ subject: 'another-user', refreshToken: 'another-refresh' });
  service.begin();
  await expect(service.complete({ code: 'code', state: 'random-1' })).rejects.toMatchObject({ code: 'access_denied' });
});
test('a Sheets grant without a refresh token is reconnect-required', async () => {
  const { service, consent } = fixture('sheets');
  consent.exchange.mockResolvedValue({ subject: owner }); service.begin();
  await expect(service.complete({ code: 'code', state: 'random-1' })).rejects.toThrow('reconnect_required');
});
test.each(['before-start', 'wrong-state', 'missing-code', 'expired'])('invalid operator callback (%s) never exchanges credentials', async (failure) => {
  const { service, consent, advance } = fixture();
  if (failure !== 'before-start') service.begin();
  if (failure === 'expired') advance();
  await expect(service.complete({ code: failure === 'missing-code' ? '' : 'code', state: failure === 'wrong-state' ? 'forged' : 'random-1' })).rejects.toMatchObject({ code: 'invalid_callback' });
  expect(consent.exchange).not.toHaveBeenCalled();
});
test('operator callback is consumed before asynchronous exchange and cannot be replayed', async () => {
  const { service, consent } = fixture(); service.begin();
  await service.complete({ code: 'code', state: 'random-1' });
  await expect(service.complete({ code: 'code', state: 'random-1' })).rejects.toMatchObject({ code: 'invalid_callback' });
  expect(consent.exchange).toHaveBeenCalledOnce();
});

test('reopening pending setup returns the same Google flow without resetting state or generating another transaction', async () => {
  const { service, consent } = fixture();
  const first = service.begin();
  expect(service.begin()).toBe(first);
  expect(consent.authorizationUrl).toHaveBeenCalledOnce();
  expect(await service.complete({ code: 'code', state: 'random-1' })).toEqual({ subject: owner });
});

test('a completed or expired setup cannot be reopened to replay its flow', async () => {
  const completed = fixture(); completed.service.begin();
  await completed.service.complete({ code: 'code', state: 'random-1' });
  expect(() => completed.service.begin()).toThrow('invalid_callback');
  const expired = fixture(); expired.service.begin(); expired.advance();
  expect(() => expired.service.begin()).toThrow('invalid_callback');
});

test('write setup requires the existing explicitly configured owner', () => {
  const f = fixture();
  expect(() => new GoogleSetupService({ mode: 'sheets-write' }, f.consent, f.clock, f.secrets)).toThrow('Google owner configuration is required');
});
test('write setup is a separate owner-bound offline consent flow', async () => {
  const f = fixture('sheets-write'); f.service.begin();
  expect(f.consent.authorizationUrl).toHaveBeenCalledWith(expect.any(Object), true);
  expect(await f.service.complete({ code: 'code', state: 'random-1' })).toEqual({ subject: owner, refreshToken: 'synthetic-refresh' });
});
test('write setup rejects another owner and cannot silently accept a grant without refresh', async () => {
  const wrong = fixture('sheets-write'); wrong.consent.exchange.mockResolvedValue({ subject: 'other-owner', refreshToken: 'other-refresh' }); wrong.service.begin();
  await expect(wrong.service.complete({ code: 'code', state: 'random-1' })).rejects.toMatchObject({ code: 'access_denied' });
  const missing = fixture('sheets-write'); missing.consent.exchange.mockResolvedValue({ subject: owner }); missing.service.begin();
  await expect(missing.service.complete({ code: 'code', state: 'random-1' })).rejects.toThrow('reconnect_required');
});
