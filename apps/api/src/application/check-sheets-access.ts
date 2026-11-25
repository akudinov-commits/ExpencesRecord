import type { SheetsCredentials, SpreadsheetProbe } from './ports/sheets-access.js';
import { SheetsAccessError } from './ports/sheets-access.js';

export class CheckSheetsAccess {
  constructor(private readonly configuration: { allowedSubject: string; testSpreadsheetId: string }, private readonly credentials: SheetsCredentials, private readonly probe: SpreadsheetProbe) {
    if (!configuration.allowedSubject.trim() || !configuration.testSpreadsheetId.trim()) throw new Error('Sheets access configuration is required');
  }
  async execute(): Promise<void> {
    const credential = await this.credentials.get();
    if (credential.subject !== this.configuration.allowedSubject) throw new SheetsAccessError('access_denied');
    await this.probe.check(this.configuration.testSpreadsheetId, credential.accessToken);
  }
}
