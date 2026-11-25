export interface GoogleClientRegistration { clientId: string; clientSecret: string; redirectUri: string }
export function parseGoogleClientRegistration(value: unknown): GoogleClientRegistration {
  const invalid = () => new Error('Google web client registration is invalid');
  if (typeof value !== 'object' || value === null || !('web' in value) || typeof value.web !== 'object' || value.web === null) throw invalid();
  const web = value.web;
  const redirectUri = 'http://localhost:5173/api/auth/callback';
  if (!('client_id' in web) || typeof web.client_id !== 'string' || !/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(web.client_id)
    || !('client_secret' in web) || typeof web.client_secret !== 'string' || !web.client_secret.trim()
    || !('redirect_uris' in web) || !Array.isArray(web.redirect_uris) || !web.redirect_uris.includes(redirectUri)) throw invalid();
  return { clientId: web.client_id, clientSecret: web.client_secret, redirectUri };
}
export function parseSheetsProbeConfiguration(environment: NodeJS.ProcessEnv): { testSpreadsheetId: string; refreshToken: string } {
  const refreshToken = environment.GOOGLE_SHEETS_REFRESH_TOKEN?.trim();
  if (!refreshToken) throw new Error('GOOGLE_SHEETS_REFRESH_TOKEN is required');
  const testSpreadsheetId = environment.GOOGLE_TEST_SPREADSHEET_ID?.trim();
  if (!testSpreadsheetId || !/^[A-Za-z0-9_-]{10,200}$/.test(testSpreadsheetId)) throw new Error('GOOGLE_TEST_SPREADSHEET_ID is required and must be an isolated workbook ID');
  return { refreshToken, testSpreadsheetId };
}
