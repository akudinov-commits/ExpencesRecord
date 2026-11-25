export interface Clock { now(): number }
export interface Secrets { token(): string; equal(left: string, right: string): boolean }

export interface LoginTransaction {
  state: string;
  nonce: string;
  verifier: string;
  issuedAt: number;
  expiresAt: number;
}

export interface AppSession {
  subject: string;
  version: string;
  csrf: string;
  issuedAt: number;
  expiresAt: number;
}

export interface TokenCodec<T> {
  seal(value: T): Promise<string>;
  open(token: string, now: number): Promise<T | null>;
}

export interface GoogleIdentity {
  authorizationUrl(transaction: LoginTransaction): string;
  exchange(code: string, transaction: LoginTransaction): Promise<{ subject: string }>;
}

export type IdentityRejectionReason = 'identity_rejected' | 'code_exchange_rejected' | 'identity_verification_failed' | 'identity_clock_ahead';
export class IdentityRejected extends Error {
  constructor(message = 'Google identity rejected', public readonly reason: IdentityRejectionReason = 'identity_rejected') { super(message); }
}
export class IdentityUnavailable extends Error {}

export interface AuthPorts {
  clock: Clock;
  secrets: Secrets;
  identity: GoogleIdentity;
  transactions: TokenCodec<LoginTransaction>;
  sessions: TokenCodec<AppSession>;
}

export interface AuthConfiguration { allowedSubject: string; sessionVersion: string }
