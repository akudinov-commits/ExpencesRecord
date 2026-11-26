import type { Clock, LoginTransaction } from '../application/ports/auth.js';
import type { GoogleSetupConsent, GoogleSetupResult } from '../application/ports/google-setup.js';
import type { GoogleOAuthClient } from './google-identity.js';
import { GoogleIdentityAdapter } from './google-identity.js';
import { READONLY_SHEETS_SCOPE, WRITE_SHEETS_SCOPE } from './sheets-access.js';
export class GoogleOperatorConsent implements GoogleSetupConsent {
  constructor(private readonly client: GoogleOAuthClient, private readonly configuration: { clientId: string; redirectUri: string; sheetsWrite?: boolean }, private readonly clock: Clock) {}
  authorizationUrl(transaction: LoginTransaction, offline: boolean): string {
    const url = new URL(new GoogleIdentityAdapter(this.client, this.configuration, this.clock).authorizationUrl(transaction));
    url.searchParams.set('include_granted_scopes', 'false');
    if (offline) {
      url.searchParams.set('scope', `openid email ${this.configuration.sheetsWrite ? WRITE_SHEETS_SCOPE : READONLY_SHEETS_SCOPE}`);
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
    }
    return url.toString();
  }
  async exchange(code: string, transaction: LoginTransaction): Promise<GoogleSetupResult> {
    let refreshToken: string | undefined;
    const client: GoogleOAuthClient = {
      generateAuthUrl: (options) => this.client.generateAuthUrl(options),
      verifyIdToken: (options) => this.client.verifyIdToken(options),
      getToken: async (options) => {
        const response = await this.client.getToken(options);
        if (response.tokens.refresh_token) refreshToken = response.tokens.refresh_token;
        return response;
      },
    };
    const { subject } = await new GoogleIdentityAdapter(client, this.configuration, this.clock).exchange(code, transaction);
    return refreshToken ? { subject, refreshToken } : { subject };
  }
}
