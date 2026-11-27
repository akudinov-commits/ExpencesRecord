import { GetExpenseContext } from './expense-context.js';
import { appendExpenses, buildExpenseTerm, normalizeAmount } from './expense-formula.js';
import type { MappingConfigurationSource, SheetCell, SheetReader } from './ports/workbook.js';
import type { SheetsCredentials } from './ports/sheets-access.js';
import type { ExpenseCommand, ExpenseFingerprint, ExpenseOperations, ExpenseOutcome, ExpensePreview, ExpenseWarning, ExpenseWriter } from './ports/expenses.js';
import { ExpenseError } from './ports/expenses.js';
export interface RegistrationDependencies { mapping: MappingConfigurationSource; readCredentials: SheetsCredentials; writeCredentials: SheetsCredentials; reader: SheetReader; writer: ExpenseWriter; fingerprint: ExpenseFingerprint }
type Command = Omit<ExpenseCommand, 'amount' | 'amounts'> & { amounts: string[]; expectedVersion?: string; acknowledgeExistingData?: boolean; acknowledgePossibleDuplicate?: boolean; acknowledgeInconclusive?: boolean };
function command(value: unknown, mutation: boolean): Command {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ExpenseError('invalid_request');
  const raw = value as Record<string, unknown>;
  const keys = ['date', 'amount', 'amounts', 'categoryId', 'currency', 'comment', ...(mutation ? ['expectedVersion', 'acknowledgeExistingData', 'acknowledgePossibleDuplicate', 'acknowledgeInconclusive'] : [])];
  if (Object.keys(raw).some(key => !keys.includes(key))) throw new ExpenseError('invalid_request');
  if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) || Number(raw.date.slice(0, 4)) < 1900
    || !Number.isFinite(Date.parse(`${raw.date}T00:00:00Z`)) || new Date(`${raw.date}T00:00:00Z`).toISOString().slice(0, 10) !== raw.date
    || typeof raw.categoryId !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(raw.categoryId)
    || typeof raw.currency !== 'string' || !/^[A-Z]{3}$/.test(raw.currency)) throw new ExpenseError('invalid_request');
  if (Object.hasOwn(raw, 'amount') === Object.hasOwn(raw, 'amounts')) throw new ExpenseError('invalid_request');
  const amounts = Object.hasOwn(raw, 'amounts') ? raw.amounts : [raw.amount];
  if (!Array.isArray(amounts) || !amounts.length || amounts.length > 20) throw new ExpenseError('invalid_request');
  const result: Command = { date: raw.date, categoryId: raw.categoryId, currency: raw.currency, amounts: Array.from(amounts, normalizeAmount) };
  if (raw.comment !== undefined) {
    if (typeof raw.comment !== 'string') throw new ExpenseError('invalid_comment');
    const text = raw.comment.replace(/\r\n?/g, '\n').trim();
    if ([...text].some(c => (c.charCodeAt(0) < 32 && c !== '\n' && c !== '\t') || c.charCodeAt(0) === 127) || new TextEncoder().encode(text).length > 1500) throw new ExpenseError('invalid_comment');
    if (text) result.comment = text;
  }
  if (mutation) {
    if (typeof raw.expectedVersion !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(raw.expectedVersion)) throw new ExpenseError('invalid_request');
    result.expectedVersion = raw.expectedVersion;
    for (const key of ['acknowledgeExistingData', 'acknowledgePossibleDuplicate', 'acknowledgeInconclusive'] as const) {
      if (raw[key] !== undefined && typeof raw[key] !== 'boolean') throw new ExpenseError('invalid_request');
      if (raw[key] === true) result[key] = true;
    }
  }
  return result;
}
export class ExpenseRegistration implements ExpenseOperations {
  constructor(private readonly configuration: { allowedSubject: string; writesEnabled: boolean }, private readonly dependencies: RegistrationDependencies) {}
  private authorize(subject: string): void { if (!subject || subject !== this.configuration.allowedSubject) throw new ExpenseError('access_denied'); }
  private async snapshot(subject: string, cmd: Command, mutation: boolean) {
    let accessToken = '';
    const credentials = mutation ? this.dependencies.writeCredentials : this.dependencies.readCredentials;
    const observed = new Map<string, SheetCell>();
    const reader: SheetReader = { listSheets: (id, token) => this.dependencies.reader.listSheets(id, token), readCells: async (id, title, bounds, token) => {
      const cells = await this.dependencies.reader.readCells(id, title, bounds, token);
      for (const cell of cells) observed.set(JSON.stringify([title, cell.row, cell.column]), cell);
      return cells;
    } };
    const context = await new GetExpenseContext(this.configuration.allowedSubject, this.dependencies.mapping, { get: async () => {
      const credential = await credentials.get(); accessToken = credential.accessToken; return credential;
    } }, reader).execute(subject, cmd.date);
    const category = context.categories.find(c => c.id === cmd.categoryId);
    const input = context.currencies.find(c => c.code === cmd.currency);
    if (!category || !input) throw new ExpenseError('invalid_request');
    if (!category.storageCurrency || context.target.sheetId === undefined) throw new ExpenseError('writes_unavailable');
    const storage = context.currencies.find(c => c.code === category.storageCurrency);
    if (!storage || !Number.isSafeInteger(context.target.sheetId) || context.target.sheetId < 0) throw new ExpenseError('mapping_invalid');
    const target = { spreadsheetId: context.target.spreadsheetId, sheetId: context.target.sheetId, row: context.target.row, column: category.column };
    const rates: SheetCell[][] = [];
    for (const currency of context.currencies) {
      const rate = currency.rate; if (!rate) continue;
      if (rate.sheetTitle === context.target.sheetTitle && rate.row === target.row && rate.column === target.column) throw new ExpenseError('mapping_invalid');
      const cell = observed.get(JSON.stringify([rate.sheetTitle, rate.row, rate.column]));
      if (!cell || cell.error || typeof cell.value !== 'number' || !Number.isFinite(cell.value) || cell.value <= 0) throw new ExpenseError('mapping_invalid');
      rates.push([cell]);
    }
    // Read the selected cell last. This detects stale previews, but does not lock a subsequent write.
    const cells = await this.dependencies.reader.readCells(target.spreadsheetId, context.target.sheetTitle,
      { startRow: target.row, endRow: target.row, startColumn: target.column, endColumn: target.column }, accessToken);
    const cell = cells[0];
    if (cells.length > 1 || (cell && (cell.row !== target.row || cell.column !== target.column))) throw new ExpenseError('mapping_invalid');
    const normalized: ExpenseCommand = { date: cmd.date, amounts: cmd.amounts, categoryId: cmd.categoryId, currency: cmd.currency, ...(cmd.comment ? { comment: cmd.comment } : {}) };
    const expectedVersion = this.dependencies.fingerprint.of([normalized, context, category, cell ?? null, rates]);
    const hasData = !!cell && (!!cell.formula || !!cell.error || (cell.value !== null && cell.value !== ''));
    const warnings: ExpenseWarning[] = hasData ? ['existing_data'] : [];
    let proposedFormula: string | null = null;
    let blockedReason: ExpensePreview['blockedReason'] = this.configuration.writesEnabled ? undefined : 'writes_unavailable';
    try {
      const addition = appendExpenses(cell, cmd.amounts.map(amount => buildExpenseTerm(amount, input, storage, context.target.sheetTitle)), context.target.sheetTitle);
      proposedFormula = addition.formula;
      if (addition.duplicate === 'possible') warnings.push('possible_duplicate');
      if (addition.duplicate === 'inconclusive') warnings.push('duplicate_check_inconclusive');
    } catch (error) {
      if (!(error instanceof ExpenseError) || error.code !== 'unsupported_formula') throw error;
      blockedReason = 'unsupported_formula';
    }
    const preview: ExpensePreview = { date: cmd.date, categoryId: cmd.categoryId, storageCurrency: category.storageCurrency,
      currentCell: { hasData, calculatedTotal: typeof cell?.value === 'number' && Number.isFinite(cell.value) ? cell.value : null,
        formula: cell?.formula ?? null, scalarValue: cell?.formula ? null : cell?.value ?? null },
      proposedFormula, expectedVersion, canSave: !blockedReason, warnings, ...(blockedReason ? { blockedReason } : {}) };
    return { preview, target, accessToken };
  }
  async preview(subject: string, input: unknown): Promise<ExpensePreview> {
    this.authorize(subject); return (await this.snapshot(subject, command(input, false), false)).preview;
  }
  private async mutate(subject: string, input: unknown, commentOnly: boolean): Promise<ExpenseOutcome> {
    this.authorize(subject);
    if (!this.configuration.writesEnabled) throw new ExpenseError('writes_unavailable');
    const cmd = command(input, true);
    if (commentOnly && !cmd.comment) throw new ExpenseError('invalid_comment');
    const { preview, target, accessToken } = await this.snapshot(subject, cmd, true);
    if (preview.expectedVersion !== cmd.expectedVersion) throw new ExpenseError('cell_changed');
    if (!commentOnly) {
      if (!preview.canSave || !preview.proposedFormula) throw new ExpenseError(preview.blockedReason ?? 'unsupported_formula');
      if ((preview.warnings.includes('existing_data') && !cmd.acknowledgeExistingData)
        || (preview.warnings.includes('possible_duplicate') && !cmd.acknowledgePossibleDuplicate)
        || (preview.warnings.includes('duplicate_check_inconclusive') && !cmd.acknowledgeInconclusive)) throw new ExpenseError('acknowledgment_required');
    }
    return this.dependencies.writer.execute({ ...target, ...(!commentOnly ? { formula: preview.proposedFormula! } : {}),
      ...(cmd.comment ? { comment: `${cmd.amounts.join(' + ')} ${cmd.currency}\n${cmd.comment}` } : {}) }, accessToken);
  }
  async save(subject: string, input: unknown): Promise<ExpenseOutcome> { return this.mutate(subject, input, false); }
  async comment(subject: string, input: unknown): Promise<ExpenseOutcome> { return this.mutate(subject, input, true); }
}
