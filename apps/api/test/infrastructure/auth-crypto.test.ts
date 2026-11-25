import { expect, test } from 'vitest';
import { jwtDecrypt, CompactEncrypt } from 'jose';
import { secureSecrets, sessionCodec, transactionCodec } from '../../src/infrastructure/auth-crypto.js';
import { authFixture, now } from '../support/auth.js';

const key = new Uint8Array(32).fill(1);
const origin = 'https://auth.example.test';

test('random values are independent 32-byte base64url secrets, suitable as PKCE verifiers', () => {
  const values = Array.from({ length: 10 }, () => secureSecrets.token());
  expect(new Set(values).size).toBe(10);
  expect(values.every((value) => /^[A-Za-z0-9_-]{43}$/.test(value))).toBe(true);
});

test('secret comparison accepts equality and rejects unequal or different-length values', () => {
  expect(secureSecrets.equal('same-value', 'same-value')).toBe(true);
  expect(secureSecrets.equal('same-value', 'same-other')).toBe(false);
  expect(secureSecrets.equal('same-value', 'short')).toBe(false);
});

test('sessions round-trip with encryption and an explicit origin/purpose boundary', async () => {
  const { session } = authFixture();
  const codec = sessionCodec(key, origin);
  const token = await codec.seal(session);
  expect(token.split('.')).toHaveLength(5);
  expect(token).not.toContain(session.subject);
  expect(await codec.open(token, now)).toEqual(session);
  expect(await sessionCodec(key, 'https://other.example.test').open(token, now)).toBeNull();
  expect(await transactionCodec(key, origin).open(token, now)).toBeNull();
});

test('login transactions encrypt the PKCE verifier and cannot become sessions', async () => {
  const { transaction } = authFixture();
  const codec = transactionCodec(key, origin);
  const token = await codec.seal(transaction);
  expect(token).not.toContain(transaction.verifier);
  expect(await codec.open(token, now)).toEqual(transaction);
  expect(await sessionCodec(key, origin).open(token, now)).toBeNull();
});

test('tampered, expired and wrong-key sessions fail closed', async () => {
  const { session } = authFixture();
  const codec = sessionCodec(key, origin);
  const token = await codec.seal(session);
  const pieces = token.split('.');
  pieces[3] = (pieces[3]?.[0] === 'A' ? 'B' : 'A') + pieces[3]?.slice(1);
  expect(await codec.open(pieces.join('.'), now)).toBeNull();
  expect(await codec.open(token, session.expiresAt)).toBeNull();
  expect(await sessionCodec(new Uint8Array(32).fill(2), origin).open(token, now)).toBeNull();
  expect(await codec.open('not-a-token', now)).toBeNull();
});

test('the codec never serializes extra Google credentials from an incorrectly enriched object', async () => {
  const { session } = authFixture();
  const enriched = { ...session, googleRefresh: 'must-not-serialize' };
  const token = await sessionCodec(key, origin).seal(enriched);
  const { payload } = await jwtDecrypt(token, key, { currentDate: new Date(now * 1000) });
  expect(payload).not.toHaveProperty('googleRefresh');
});

test('authenticated encryption alone does not accept an invalid session claim shape', async () => {
  const untrusted = new TextEncoder().encode(JSON.stringify({ sub: 123, version: 'v', csrf: 'csrf', iss: origin, aud: 'expences-session', iat: now, exp: now + 60 }));
  const token = await new CompactEncrypt(untrusted).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).encrypt(key);
  expect(await sessionCodec(key, origin).open(token, now)).toBeNull();
});
