import type { Credentials, TokenInfo } from 'google-auth-library';
import type { Clock } from '../application/ports/auth.js';
import type { SheetsCredentials, SpreadsheetProbe } from '../application/ports/sheets-access.js';
import { SheetsAccessError } from '../application/ports/sheets-access.js';

export const READONLY_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
export const WRITE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
export interface GoogleRefreshClient {
  setCredentials(value: Credentials): void;
  on(event: 'tokens', listener: (value: Credentials) => void): unknown;
  getAccessToken(): Promise<{ token?: string | null }>;
  getTokenInfo(token: string): Promise<TokenInfo>;
}
export class GoogleSheetsCredentials implements SheetsCredentials {
  private replacementRequired = false;
  constructor(private readonly client: GoogleRefreshClient, private readonly configuration: { refreshToken: string; clientId: string; permission?: 'read' | 'write' }, private readonly clock: Clock) {
    if (!configuration.refreshToken.trim()) throw new SheetsAccessError('reconnect_required');
    client.on('tokens', (tokens) => {
      if (tokens.refresh_token && tokens.refresh_token !== configuration.refreshToken) this.replacementRequired = true;
    });
    client.setCredentials({ refresh_token: configuration.refreshToken });
  }
  async get(): Promise<{ accessToken: string; subject: string }> {
    if (this.replacementRequired) throw new SheetsAccessError('reconnect_required');
    try {
      const { token } = await this.client.getAccessToken();
      if (this.replacementRequired || !token) throw new SheetsAccessError('reconnect_required');
      const info = await this.client.getTokenInfo(token);
      const requiredScope = this.configuration.permission === 'write' ? WRITE_SHEETS_SCOPE : READONLY_SHEETS_SCOPE;
      const allowedScopes = ['openid', 'email', 'https://www.googleapis.com/auth/userinfo.email', READONLY_SHEETS_SCOPE, ...(this.configuration.permission === 'write' ? [WRITE_SHEETS_SCOPE] : [])];
      if (info.aud !== this.configuration.clientId || typeof info.sub !== 'string' || !/^[\x21-\x7e]{1,255}$/.test(info.sub)
        || !Number.isFinite(info.expiry_date) || info.expiry_date <= this.clock.now() * 1000
        || !Array.isArray(info.scopes) || !info.scopes.includes(requiredScope) || !info.scopes.includes('openid')
        || info.scopes.some((scope) => !allowedScopes.includes(scope))) throw new SheetsAccessError('reconnect_required');
      return { accessToken: token, subject: info.sub };
    } catch (error) {
      if (error instanceof SheetsAccessError) throw error;
      const status = responseStatus(error);
      throw new SheetsAccessError(status === 400 || status === 401 || status === 403 ? 'reconnect_required' : 'unavailable');
    }
  }
}
export class GoogleSpreadsheetProbe implements SpreadsheetProbe {
  constructor(private readonly request: typeof fetch = fetch) {}
  async check(spreadsheetId: string, accessToken: string): Promise<void> {
    try {
      const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`);
      url.searchParams.set('fields', 'spreadsheetId');
      url.searchParams.set('includeGridData', 'false');
      const response = await this.request(url.toString(), { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (response.status === 401) throw new SheetsAccessError('reconnect_required');
      if (response.status === 403 || response.status === 404) throw new SheetsAccessError('access_denied');
      if (response.status !== 200) throw new SheetsAccessError('unavailable');
      const value: unknown = await response.json();
      if (typeof value !== 'object' || value === null || !('spreadsheetId' in value) || value.spreadsheetId !== spreadsheetId) throw new SheetsAccessError('unavailable');
    } catch (error) {
      if (error instanceof SheetsAccessError) throw error;
      throw new SheetsAccessError('unavailable');
    }
  }
}

function responseStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return;
  const response = error.response;
  return typeof response === 'object' && response !== null && 'status' in response && typeof response.status === 'number' ? response.status : undefined;
}
