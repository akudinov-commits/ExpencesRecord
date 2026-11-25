import type { GoogleSetupResult } from '../application/ports/google-setup.js';
import { GoogleSetupFailed } from '../application/ports/google-setup.js';
import type { GoogleClientRegistration } from './google-setup-config.js';
import { createGoogleSetupApp } from '../api/google-setup-server.js';
import { GoogleSetupService } from '../application/google-setup.js';
import { CheckSheetsAccess } from '../application/check-sheets-access.js';
import { OAuth2Client } from 'google-auth-library';
import { parseAuthConfiguration } from './auth-config.js';
import { parseGoogleClientRegistration, parseSheetsProbeConfiguration } from './google-setup-config.js';
import { secureSecrets, systemClock } from '../infrastructure/auth-crypto.js';
import { GoogleOperatorConsent } from '../infrastructure/google-setup-consent.js';
import { GoogleSheetsCredentials, GoogleSpreadsheetProbe } from '../infrastructure/sheets-access.js';
import { saveLocalGoogleSettings } from '../infrastructure/local-google-settings.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import type { SetupCompletion } from '../api/google-setup-server.js';
export interface SetupInput { mode: 'owner' | 'sheets'; registration: GoogleClientRegistration; result: GoogleSetupResult; environment: NodeJS.ProcessEnv }
export async function saveGoogleSetupResult(input: SetupInput, confirm: () => Promise<boolean>, save: (values: Record<string, string>) => Promise<void>): Promise<boolean> {
  if (!await confirm()) return false;
  if (input.mode === 'sheets') {
    if (!input.result.refreshToken) throw new Error('Google setup failed');
    await save({ GOOGLE_SHEETS_REFRESH_TOKEN: input.result.refreshToken });
    return true;
  }
  const settings = {
    HOST: input.environment.HOST || '127.0.0.1', PORT: input.environment.PORT || '3001', APP_ORIGIN: input.environment.APP_ORIGIN || 'http://localhost:5173',
    GOOGLE_CLIENT_ID: input.registration.clientId, GOOGLE_CLIENT_SECRET: input.registration.clientSecret, GOOGLE_ALLOWED_SUBJECT: input.result.subject,
    AUTH_SESSION_KEY: input.environment.AUTH_SESSION_KEY || secureSecrets.token(), AUTH_FLOW_KEY: input.environment.AUTH_FLOW_KEY || secureSecrets.token(), AUTH_SESSION_VERSION: input.environment.AUTH_SESSION_VERSION || '1',
  };
  parseAuthConfiguration(settings);
  await save(settings);
  return true;
}
export function createGoogleSetupRuntime(mode: 'owner' | 'sheets', registration: GoogleClientRegistration, allowedSubject?: string) {
  const client = new OAuth2Client({ ...registration, transporterOptions: { timeout: 10000, retry: false } });
  const consent = new GoogleOperatorConsent(client, registration, systemClock);
  const service = new GoogleSetupService({ mode, ...(allowedSubject ? { allowedSubject } : {}) }, consent, systemClock, secureSecrets);
  return createGoogleSetupApp(service);
}
export function createSheetsProbe(environment: NodeJS.ProcessEnv): CheckSheetsAccess {
  const auth = parseAuthConfiguration(environment);
  const sheets = parseSheetsProbeConfiguration(environment);
  const client = new OAuth2Client({ clientId: auth.clientId, clientSecret: auth.clientSecret, transporterOptions: { timeout: 10000, retry: false } });
  const credentials = new GoogleSheetsCredentials(client, { clientId: auth.clientId, refreshToken: sheets.refreshToken }, systemClock);
  return new CheckSheetsAccess({ allowedSubject: auth.allowedSubject, testSpreadsheetId: sheets.testSpreadsheetId }, credentials, new GoogleSpreadsheetProbe());
}

export async function runGoogleSetup(mode: 'owner' | 'sheets' | 'probe', environment: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (mode === 'probe') {
    await createSheetsProbe(environment).execute();
    console.log('Read-only test workbook access verified. No grid data was requested.');
    return;
  }
  let registration: GoogleClientRegistration;
  if (mode === 'owner') {
    const downloaded: unknown = JSON.parse(await readFile(resolve('.env.google-client.json'), 'utf8'));
    registration = parseGoogleClientRegistration(downloaded);
  } else {
    const auth = parseAuthConfiguration(environment);
    registration = { clientId: auth.clientId, clientSecret: auth.clientSecret, redirectUri: 'http://localhost:5173/api/auth/callback' };
  }
  const runtime = createGoogleSetupRuntime(mode, registration, environment.GOOGLE_ALLOWED_SUBJECT?.trim());
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let completion: SetupCompletion;
  try {
    await runtime.app.listen({ host: '127.0.0.1', port: 5173 });
    console.log('Open http://localhost:5173 in your browser. Select your intended Google account.');
    const deadline = new Promise<SetupCompletion>((resolve) => { timeout = setTimeout(() => resolve({ ok: false, reason: 'setup_timeout' }), 10 * 60 * 1000); });
    completion = await Promise.race([runtime.completion, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
    await runtime.app.close();
  }
  if (!completion.ok) throw new GoogleSetupFailed(completion.reason);
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const saved = await saveGoogleSetupResult({ mode, registration, result: completion.value, environment }, async () => {
      const question = mode === 'owner' ? 'Save the Google account you just selected as the app owner? Type YES: ' : 'Save the separate read-only Sheets grant for the configured owner? Type YES: ';
      return (await terminal.question(question)).trim() === 'YES';
    }, (values) => saveLocalGoogleSettings(resolve('.env'), values));
    console.log(saved ? 'Google settings saved directly to the ignored local .env file.' : 'Setup canceled. No settings were saved.');
  } finally { terminal.close(); }
}
