import type { LoginTransaction } from './auth.js';
import type { IdentityRejectionReason } from './auth.js';
export interface GoogleSetupConsent {
  authorizationUrl(transaction: LoginTransaction, offline: boolean): string;
  exchange(code: string, transaction: LoginTransaction): Promise<{ subject: string; refreshToken?: string }>;
}
export type GoogleSetupResult = { subject: string; refreshToken?: string };
export type GoogleSetupFailureReason = IdentityRejectionReason | 'provider_denied' | 'provider_rejected' | 'identity_unavailable' | 'invalid_callback' | 'owner_denied' | 'reconnect_required' | 'unexpected_failure' | 'setup_timeout';
export class GoogleSetupFailed extends Error {
  constructor(public readonly reason: GoogleSetupFailureReason) { super(`Google setup failed: ${reason}`); }
}
