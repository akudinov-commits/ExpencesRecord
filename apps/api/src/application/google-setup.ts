import type { Clock, LoginTransaction, Secrets } from './ports/auth.js';
import type { GoogleSetupConsent, GoogleSetupResult } from './ports/google-setup.js';
import { AuthError } from './auth.js';
import { SheetsAccessError } from './ports/sheets-access.js';

export class GoogleSetupService {
  private transaction: LoginTransaction | undefined;
  private started = false;
  private authorizationUrl: string | undefined;
  constructor(private readonly configuration: { mode: 'owner' | 'sheets'; allowedSubject?: string }, private readonly consent: GoogleSetupConsent, private readonly clock: Clock, private readonly secrets: Secrets) {
    if (configuration.mode === 'sheets' && !configuration.allowedSubject?.trim()) throw new Error('Google owner configuration is required');
  }
  begin(): string {
    if (this.started) {
      if (!this.transaction || this.transaction.expiresAt <= this.clock.now() || !this.authorizationUrl) throw new AuthError('invalid_callback');
      return this.authorizationUrl;
    }
    this.started = true;
    const issuedAt = this.clock.now();
    this.transaction = { state: this.secrets.token(), nonce: this.secrets.token(), verifier: this.secrets.token(), issuedAt, expiresAt: issuedAt + 600 };
    this.authorizationUrl = this.consent.authorizationUrl(this.transaction, this.configuration.mode === 'sheets');
    return this.authorizationUrl;
  }
  async complete(input: { code: string; state: string }): Promise<GoogleSetupResult> {
    const transaction = this.transaction;
    this.transaction = undefined;
    if (!transaction || !input.code || !input.state || transaction.expiresAt <= this.clock.now() || !this.secrets.equal(input.state, transaction.state)) throw new AuthError('invalid_callback');
    const grant = await this.consent.exchange(input.code, transaction);
    if (this.configuration.allowedSubject && grant.subject !== this.configuration.allowedSubject) throw new AuthError('access_denied');
    if (this.configuration.mode === 'owner') return { subject: grant.subject };
    if (!grant.refreshToken) throw new SheetsAccessError('reconnect_required');
    return { subject: grant.subject, refreshToken: grant.refreshToken };
  }
}
