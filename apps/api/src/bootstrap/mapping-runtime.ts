import { OAuth2Client } from 'google-auth-library';
import { GetExpenseContext } from '../application/expense-context.js';
import type { MappingConfiguration, SheetReader } from '../application/ports/workbook.js';
import type { SheetsCredentials } from '../application/ports/sheets-access.js';
import { SheetsAccessError } from '../application/ports/sheets-access.js';
import { GoogleSheetsCredentials } from '../infrastructure/sheets-access.js';
import { GoogleSheetReader } from '../infrastructure/sheet-reader.js';
import { systemClock } from '../infrastructure/auth-crypto.js';
import { MappingConfigurationError, parseMappingConfiguration } from './mapping-config.js';
import type { AuthRuntimeConfiguration } from './auth-config.js';
export interface MappingDependencies { reader?: SheetReader; credentials?: SheetsCredentials }
export function createMappingQuery(environment: NodeJS.ProcessEnv, auth: Pick<AuthRuntimeConfiguration, 'allowedSubject' | 'clientId' | 'clientSecret'>, dependencies: MappingDependencies = {}) {
  let loaded = false; let configuration: MappingConfiguration | null = null;
  const raw = environment.EXPENSE_WORKBOOKS_JSON; const refreshToken = environment.GOOGLE_SHEETS_REFRESH_TOKEN?.trim();
  const source = { get: () => {
    if (!loaded) {
      try { configuration = parseMappingConfiguration({ EXPENSE_WORKBOOKS_JSON: raw }); }
      catch (error) { if (!(error instanceof MappingConfigurationError)) throw error; configuration = null; }
      loaded = true;
    }
    return configuration;
  } };
  let adapter: GoogleSheetsCredentials | undefined;
  const credentials = dependencies.credentials ?? { get: async () => {
    if (!refreshToken) throw new SheetsAccessError('reconnect_required');
    adapter ??= new GoogleSheetsCredentials(new OAuth2Client({ clientId: auth.clientId, clientSecret: auth.clientSecret, transporterOptions: { timeout: 10000, retry: false } }), { clientId: auth.clientId, refreshToken }, systemClock);
    return adapter.get();
  } };
  return new GetExpenseContext(auth.allowedSubject, source, credentials, dependencies.reader ?? new GoogleSheetReader());
}
