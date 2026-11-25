import type { GenerateAuthUrlOpts, GetTokenOptions, LoginTicket, VerifyIdTokenOptions } from 'google-auth-library';
import { CodeChallengeMethod } from 'google-auth-library';
import { createHash } from 'node:crypto';
import type { Clock, GoogleIdentity, LoginTransaction } from '../application/ports/auth.js';
import { IdentityRejected, IdentityUnavailable } from '../application/ports/auth.js';
import { secureSecrets } from './auth-crypto.js';

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function status(error: unknown): number | undefined {
  return record(error) && record(error.response) && typeof error.response.status === 'number' ? error.response.status : undefined;
}
function networkError(error: unknown): boolean {
  return record(error) && typeof error.code === 'string' && ['ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED'].includes(error.code);
}

export interface GoogleOAuthClient {
  generateAuthUrl(options: GenerateAuthUrlOpts): string;
  getToken(options: GetTokenOptions): Promise<GoogleTokenResponse>;
  verifyIdToken(options: VerifyIdTokenOptions): Promise<LoginTicket>;
}

export interface GoogleTokenResponse { tokens: { id_token?: string | null; access_token?: string | null; refresh_token?: string | null }; res: unknown }

export class GoogleIdentityAdapter implements GoogleIdentity {
  constructor(private readonly client: GoogleOAuthClient, private readonly configuration: { clientId: string; redirectUri: string }, private readonly clock: Clock) {}

  authorizationUrl(transaction: LoginTransaction): string {
    return this.client.generateAuthUrl({
      response_type: 'code', scope: ['openid', 'email'], access_type: 'online', state: transaction.state, nonce: transaction.nonce,
      redirect_uri: this.configuration.redirectUri, code_challenge_method: CodeChallengeMethod.S256,
      code_challenge: createHash('sha256').update(transaction.verifier).digest('base64url'),
    });
  }

  async exchange(code: string, transaction: LoginTransaction): Promise<{ subject: string }> {
    let response: GoogleTokenResponse;
    try {
      response = await this.client.getToken({ code, codeVerifier: transaction.verifier, redirect_uri: this.configuration.redirectUri });
    } catch (error) {
      const code = status(error);
      if (code !== undefined && code >= 400 && code < 429) throw new IdentityRejected('Google identity rejected', 'code_exchange_rejected');
      throw new IdentityUnavailable('Google identity unavailable');
    }
    const { tokens } = response;
    if (!tokens.id_token) throw new IdentityRejected('Google identity rejected');
    let ticket: LoginTicket;
    try {
      ticket = await this.client.verifyIdToken({ idToken: tokens.id_token, audience: this.configuration.clientId });
    } catch (error) {
      if (status(error) !== undefined || networkError(error)) throw new IdentityUnavailable('Google identity unavailable');
      if (error instanceof Error) throw new IdentityRejected('Google identity rejected', 'identity_verification_failed');
      throw error;
    }
    const payload: unknown = ticket.getPayload();
    const now = this.clock.now();
    if (record(payload) && typeof payload.iat === 'number' && Number.isSafeInteger(payload.iat) && payload.iat > now + 60) {
      throw new IdentityRejected('Google identity rejected', 'identity_clock_ahead');
    }
    if (!record(payload) || typeof payload.sub !== 'string' || !/^[\x21-\x7e]{1,255}$/.test(payload.sub)
      || payload.aud !== this.configuration.clientId || !['https://accounts.google.com', 'accounts.google.com'].includes(String(payload.iss))
      || typeof payload.exp !== 'number' || !Number.isSafeInteger(payload.exp) || payload.exp <= now
      || typeof payload.iat !== 'number' || !Number.isSafeInteger(payload.iat) || payload.iat > now + 60
      || typeof payload.nonce !== 'string' || !secureSecrets.equal(payload.nonce, transaction.nonce)
      || (payload.azp !== undefined && payload.azp !== this.configuration.clientId)) {
      throw new IdentityRejected('Google identity rejected');
    }
    return { subject: payload.sub };
  }
}
