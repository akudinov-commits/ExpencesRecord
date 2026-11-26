import { OAuth2Client } from 'google-auth-library';
import { ExpenseRegistration } from '../application/expense-registration.js';
import type { RegistrationDependencies } from '../application/expense-registration.js';
import type { MappingConfiguration } from '../application/ports/workbook.js';
import { SheetsAccessError } from '../application/ports/sheets-access.js';
import { GoogleSheetsCredentials } from '../infrastructure/sheets-access.js';
import { GoogleSheetReader } from '../infrastructure/sheet-reader.js';
import { GoogleExpenseWriter } from '../infrastructure/expense-writer.js';
import { expenseFingerprint } from '../infrastructure/expense-fingerprint.js';
import { systemClock } from '../infrastructure/auth-crypto.js';
import { MappingConfigurationError, parseMappingConfiguration } from './mapping-config.js';
import type { AuthRuntimeConfiguration } from './auth-config.js';
export function createExpenseOperations(environment: NodeJS.ProcessEnv, auth: Pick<AuthRuntimeConfiguration,'allowedSubject'|'clientId'|'clientSecret'>, dependencies: Partial<RegistrationDependencies> = {}) {
  let loaded=false; let configuration: MappingConfiguration | null=null;
  const raw=environment.EXPENSE_WORKBOOKS_JSON;
  const mapping=dependencies.mapping ?? {get:()=>{
    if(!loaded){try{configuration=parseMappingConfiguration({EXPENSE_WORKBOOKS_JSON:raw});}catch(error){if(!(error instanceof MappingConfigurationError))throw error;configuration=null;}loaded=true;}
    return configuration;
  }};
  function credentials(permission:'read'|'write') {
    const refreshToken=environment[permission === 'read'?'GOOGLE_SHEETS_REFRESH_TOKEN':'GOOGLE_SHEETS_WRITE_REFRESH_TOKEN']?.trim();
    let adapter:GoogleSheetsCredentials|undefined;
    return {get:async()=>{
      if(!refreshToken)throw new SheetsAccessError('reconnect_required');
      adapter ??= new GoogleSheetsCredentials(new OAuth2Client({clientId:auth.clientId,clientSecret:auth.clientSecret,transporterOptions:{timeout:10000,retry:false}}),{clientId:auth.clientId,refreshToken,permission},systemClock);
      return adapter.get();
    }};
  }
  const writesEnabled=environment.EXPENSE_WRITES_ENABLED === 'true' && (!!dependencies.writeCredentials || !!environment.GOOGLE_SHEETS_WRITE_REFRESH_TOKEN?.trim());
  return new ExpenseRegistration({allowedSubject:auth.allowedSubject,writesEnabled},{mapping,readCredentials:dependencies.readCredentials ?? credentials('read'),writeCredentials:dependencies.writeCredentials ?? credentials('write'),reader:dependencies.reader ?? new GoogleSheetReader(),writer:dependencies.writer ?? new GoogleExpenseWriter(),fingerprint:dependencies.fingerprint ?? expenseFingerprint});
}
