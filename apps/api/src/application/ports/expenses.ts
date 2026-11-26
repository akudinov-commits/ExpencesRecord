export type ExpenseFailure = 'invalid_request' | 'invalid_amount' | 'invalid_comment' | 'mapping_invalid' | 'writes_unavailable' | 'unsupported_formula' | 'cell_changed' | 'acknowledgment_required' | 'access_denied';
export class ExpenseError extends Error { constructor(public readonly code: ExpenseFailure) { super(code); } }
export type ExpenseWarning = 'existing_data' | 'possible_duplicate' | 'duplicate_check_inconclusive';
export interface ExpenseCommand { date: string; amount: string; categoryId: string; currency: string; comment?: string }
export interface ExpensePreview {
  date: string; categoryId: string; storageCurrency: string;
  currentCell: { hasData: boolean; calculatedTotal: number | null; formula: string | null; scalarValue: string | number | boolean | null };
  proposedFormula: string | null; expectedVersion: string; canSave: boolean; warnings: ExpenseWarning[]; blockedReason?: 'writes_unavailable' | 'unsupported_formula';
}
export interface ExpenseOutcome { expense: 'saved' | 'not_saved' | 'unknown' | 'unchanged'; comment: 'not_requested' | 'saved' | 'failed' | 'unknown'; code?: string }
export interface ExpenseWritePlan { spreadsheetId: string; sheetId: number; row: number; column: number; formula?: string; comment?: string }
export interface ExpenseWriter { execute(plan: ExpenseWritePlan, accessToken: string): Promise<ExpenseOutcome> }
export interface ExpenseFingerprint { of(value: unknown): string }
export interface ExpenseOperations {
  preview(subject: string, input: unknown): Promise<ExpensePreview>;
  save(subject: string, input: unknown): Promise<ExpenseOutcome>;
  comment(subject: string, input: unknown): Promise<ExpenseOutcome>;
}
