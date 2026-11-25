import type { AppSession, Clock, LoginTransaction, Secrets, TokenCodec } from '../application/ports/auth.js';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { EncryptJWT, errors, jwtDecrypt } from 'jose';
import type { JWTPayload } from 'jose';

export const systemClock: Clock = { now: () => Math.floor(Date.now() / 1000) };
export const secureSecrets: Secrets = {
  token: () => randomBytes(32).toString('base64url'),
  equal: (left, right) => {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  },
};

function encryptedCodec<T extends { issuedAt: number; expiresAt: number }>(key: Uint8Array, origin: string, purpose: string, encode: (value: T) => JWTPayload, decode: (value: JWTPayload) => T | null): TokenCodec<T> {
  return {
    async seal(value) {
      return new EncryptJWT(encode(value)).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuer(origin).setAudience(purpose).setIssuedAt(value.issuedAt).setExpirationTime(value.expiresAt).encrypt(key);
    },
    async open(token, now) {
      if (!token || token.length > 4096) return null;
      try {
        const { payload } = await jwtDecrypt(token, key, {
          issuer: origin, audience: purpose, keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'],
          requiredClaims: ['iat', 'exp'], currentDate: new Date(now * 1000), clockTolerance: 0,
        });
        return decode(payload);
      } catch (error) {
        if (error instanceof errors.JOSEError) return null;
        throw error;
      }
    },
  };
}

function times(value: JWTPayload): { issuedAt: number; expiresAt: number } | null {
  return typeof value.iat === 'number' && typeof value.exp === 'number' && Number.isSafeInteger(value.iat) && Number.isSafeInteger(value.exp)
    ? { issuedAt: value.iat, expiresAt: value.exp } : null;
}

export function sessionCodec(key: Uint8Array, origin: string): TokenCodec<AppSession> {
  return encryptedCodec(key, origin, 'expences-session', (value) => ({ sub: value.subject, version: value.version, csrf: value.csrf }), (value) => {
    const time = times(value);
    return time && typeof value.sub === 'string' && value.sub.length > 0 && value.sub.length <= 255
      && typeof value.version === 'string' && value.version.length > 0 && value.version.length <= 64
      && typeof value.csrf === 'string' && value.csrf.length > 0 && value.csrf.length <= 128
      ? { ...time, subject: value.sub, version: value.version, csrf: value.csrf } : null;
  });
}

export function transactionCodec(key: Uint8Array, origin: string): TokenCodec<LoginTransaction> {
  return encryptedCodec(key, origin, 'expences-flow', (value) => ({ state: value.state, nonce: value.nonce, verifier: value.verifier }), (value) => {
    const time = times(value);
    return time && typeof value.state === 'string' && value.state.length > 0 && value.state.length <= 128
      && typeof value.nonce === 'string' && value.nonce.length > 0 && value.nonce.length <= 128
      && typeof value.verifier === 'string' && value.verifier.length > 0 && value.verifier.length <= 128
      ? { ...time, state: value.state, nonce: value.nonce, verifier: value.verifier } : null;
  });
}
