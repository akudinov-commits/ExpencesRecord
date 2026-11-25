import type { AppSession, AuthConfiguration, AuthPorts } from './ports/auth.js';
import { IdentityRejected, IdentityUnavailable } from './ports/auth.js';

export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const LOGIN_SECONDS = 10 * 60;

function validLifetime(value: { issuedAt: number; expiresAt: number }, now: number, maximum: number): boolean {
  return Number.isSafeInteger(value.issuedAt) && Number.isSafeInteger(value.expiresAt)
    && value.issuedAt >= 0 && value.issuedAt <= now + 60 && value.expiresAt > now
    && value.expiresAt > value.issuedAt && value.expiresAt - value.issuedAt <= maximum;
}

export class AuthError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'access_denied' | 'invalid_callback' | 'identity_unavailable' | 'invalid_csrf') {
    super(code);
  }
}

export class AuthService {
  constructor(private readonly configuration: AuthConfiguration, private readonly ports: AuthPorts) {
    if (!configuration.allowedSubject.trim() || !configuration.sessionVersion.trim()) {
      throw new Error('Authentication policy configuration is required');
    }
  }

  async beginLogin(): Promise<{ transactionToken: string; authorizationUrl: string }> {
    const issuedAt = this.ports.clock.now();
    const transaction = { state: this.ports.secrets.token(), nonce: this.ports.secrets.token(), verifier: this.ports.secrets.token(), issuedAt, expiresAt: issuedAt + LOGIN_SECONDS };
    return { transactionToken: await this.ports.transactions.seal(transaction), authorizationUrl: this.ports.identity.authorizationUrl(transaction) };
  }

  async completeLogin(input: { transactionToken: string; code: string; state: string }): Promise<{ sessionToken: string }> {
    if (!input.transactionToken) throw new AuthError('invalid_callback');
    const now = this.ports.clock.now();
    const transaction = await this.ports.transactions.open(input.transactionToken, now);
    if (!transaction || !input.code || !input.state || !transaction.nonce || !transaction.verifier
      || !validLifetime(transaction, now, LOGIN_SECONDS) || !this.ports.secrets.equal(input.state, transaction.state)) {
      throw new AuthError('invalid_callback');
    }
    let identity: { subject: string };
    try {
      identity = await this.ports.identity.exchange(input.code, transaction);
    } catch (error) {
      if (error instanceof IdentityRejected) throw new AuthError('invalid_callback');
      if (error instanceof IdentityUnavailable) throw new AuthError('identity_unavailable');
      throw error;
    }
    if (identity.subject !== this.configuration.allowedSubject) throw new AuthError('access_denied');
    const issuedAt = this.ports.clock.now();
    const session: AppSession = { subject: identity.subject, version: this.configuration.sessionVersion, csrf: this.ports.secrets.token(), issuedAt, expiresAt: issuedAt + SESSION_SECONDS };
    return { sessionToken: await this.ports.sessions.seal(session) };
  }

  async authenticate(token: string): Promise<AppSession> {
    if (!token) throw new AuthError('unauthenticated');
    const now = this.ports.clock.now();
    const session = await this.ports.sessions.open(token, now);
    if (!session || !validLifetime(session, now, SESSION_SECONDS) || !session.csrf || session.version !== this.configuration.sessionVersion) {
      throw new AuthError('unauthenticated');
    }
    if (session.subject !== this.configuration.allowedSubject) throw new AuthError('access_denied');
    return session;
  }

  assertCsrf(session: AppSession, supplied: string): void {
    if (!supplied || !session.csrf || !this.ports.secrets.equal(session.csrf, supplied)) throw new AuthError('invalid_csrf');
  }

  async logout(token: string, csrf: string): Promise<void> {
    this.assertCsrf(await this.authenticate(token), csrf);
  }
}
