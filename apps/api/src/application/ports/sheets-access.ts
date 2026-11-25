export class SheetsAccessError extends Error {
  constructor(public readonly code: 'reconnect_required' | 'access_denied' | 'unavailable') { super(code); }
}
export interface SheetsCredentials { get(): Promise<{ accessToken: string; subject: string }> }
export interface SpreadsheetProbe { check(spreadsheetId: string, accessToken: string): Promise<void> }
