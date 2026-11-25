import { vi } from 'vitest';
import { AuthService } from '../../src/application/auth.js';
import type { AppSession, AuthPorts, LoginTransaction } from '../../src/application/ports/auth.js';

export const owner = 'synthetic-owner-subject';
export const now = 1_800_000_000;

export function authFixture() {
  const transaction: LoginTransaction = { state: 'bound-state', nonce: 'bound-nonce', verifier: 'bound-verifier', issuedAt: now, expiresAt: now + 600 };
  const session: AppSession = { subject: owner, version: 'version-1', csrf: 'bound-csrf', issuedAt: now, expiresAt: now + 604800 };
  let serial = 0;
  const ports = {
    clock: { now: () => now },
    secrets: { token: () => `random-${++serial}`, equal: (a: string, b: string) => a === b },
    identity: {
      authorizationUrl: vi.fn(() => 'https://accounts.google.com/example-test-authorization'),
      exchange: vi.fn(async () => ({ subject: owner })),
    },
    transactions: {
      seal: vi.fn<(value: LoginTransaction) => Promise<string>>().mockResolvedValue('sealed-flow'),
      open: vi.fn<(token: string, time: number) => Promise<LoginTransaction | null>>().mockResolvedValue(transaction),
    },
    sessions: {
      seal: vi.fn<(value: AppSession) => Promise<string>>().mockResolvedValue('sealed-session'),
      open: vi.fn<(token: string, time: number) => Promise<AppSession | null>>().mockResolvedValue(session),
    },
  } satisfies AuthPorts;
  const service = new AuthService({ allowedSubject: owner, sessionVersion: 'version-1' }, ports);
  return { service, ports, transaction, session };
}
