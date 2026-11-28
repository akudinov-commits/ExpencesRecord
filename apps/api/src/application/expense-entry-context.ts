import { MappingError } from './expense-context.js';
import type { ExpenseContextQuery, ExpenseContextResult } from './expense-context.js';
import type { CategoryBinding, MonthlyCategoryTotal, RecordedExpense, Rectangle, SheetCell, SheetReader } from './ports/workbook.js';
import type { SheetsCredentials } from './ports/sheets-access.js';
import { SheetsAccessError } from './ports/sheets-access.js';
export class GetExpenseEntryContext implements ExpenseContextQuery {
  constructor(private readonly base: ExpenseContextQuery, private readonly credentials: SheetsCredentials, private readonly reader: SheetReader) {}
  async execute(subject: string, date: string): Promise<ExpenseContextResult> {
    const context = await this.base.execute(subject, date);
    const period = date.slice(0, 7);
    const totals: Record<string, MonthlyCategoryTotal> = Object.fromEntries(context.categories.map(category => [category.id, { period, status: 'unavailable' }]));
    const recorded: Record<string, RecordedExpense> = Object.fromEntries(context.categories.map(category => [category.id, { date, status: 'unavailable' }]));
    const result = { ...context, recordedExpenses: recorded, ...(context.categories.some(category => category.monthlyTotal) ? { monthlyTotals: totals } : {}) };
    try {
      const credential = await this.credentials.get();
      if (credential.subject !== subject) throw new MappingError('access_denied');
      const metadata = await this.reader.listSheets(context.target.spreadsheetId, credential.accessToken);
      const sheets = metadata.filter(sheet => sheet.title === context.target.sheetTitle);
      const sheet = sheets.length === 1 ? sheets[0] : undefined;
      if (!sheet) return result;
      let remainingCells = 20000;
      const read = async (bounds: Rectangle): Promise<Map<number, SheetCell> | null> => {
        const width = bounds.endColumn - bounds.startColumn + 1;
        if (!Number.isSafeInteger(bounds.startRow) || bounds.startRow < 1 || bounds.endRow !== bounds.startRow || bounds.endRow > sheet.rowCount
          || !Number.isSafeInteger(bounds.startColumn) || !Number.isSafeInteger(bounds.endColumn) || bounds.startColumn < 1 || bounds.endColumn > sheet.columnCount || width < 1 || width > remainingCells) return null;
        remainingCells -= width;
        try {
          const cells = await this.reader.readCells(context.target.spreadsheetId, context.target.sheetTitle, bounds, credential.accessToken);
          const result = new Map<number, SheetCell>();
          for (const cell of cells) {
            if (cell.row !== bounds.startRow || !Number.isSafeInteger(cell.column) || cell.column < bounds.startColumn || cell.column > bounds.endColumn || result.has(cell.column)) return null;
            result.set(cell.column, cell);
          }
          return result;
        } catch (error) { if (error instanceof SheetsAccessError && error.code === 'unavailable') return null; throw error; }
      };
      if (context.categories.length) {
        const columns = context.categories.map(category => category.column);
        const cells = await read({ startRow: context.target.row, endRow: context.target.row, startColumn: Math.min(...columns), endColumn: Math.max(...columns) });
        if (cells) for (const category of context.categories) {
          const cell = cells.get(category.column);
          if (cell?.formula !== undefined && (typeof cell.formula !== 'string' || !cell.formula.startsWith('=') || cell.formula.length > 8000)) continue;
          const hasData = !!cell && (!!cell.formula || !!cell.error || cell.value !== null && cell.value !== '');
          recorded[category.id] = hasData ? { date, status: 'recorded', amount: !cell?.error && typeof cell?.value === 'number' && Number.isFinite(cell.value) ? cell.value : null,
            currency: category.storageCurrency ?? context.baseCurrency, formula: cell?.formula ?? null } : { date, status: 'empty' };
        }
      }
      const groups = new Map<number, CategoryBinding[]>();
      for (const category of context.categories) {
        const binding = category.monthlyTotal;
        if (!binding || !Number.isSafeInteger(binding.row) || binding.row < 1 || binding.row > sheet.rowCount
          || !Number.isSafeInteger(category.column) || category.column < 1 || category.column > sheet.columnCount || !/^[A-Z]{3}$/.test(binding.currency)) continue;
        const group = groups.get(binding.row) ?? []; group.push(category); groups.set(binding.row, group);
      }
      for (const [row, categories] of groups) {
        const startColumn = Math.min(...categories.map(category => category.column));
        const endColumn = Math.max(...categories.map(category => category.column));
        const cells = await read({ startRow: row, endRow: row, startColumn, endColumn });
        if (!cells) continue;
        for (const category of categories) {
          const cell = cells.get(category.column);
          if (!cell || cell.error || typeof cell.value !== 'number' || !Number.isFinite(cell.value)) continue;
          totals[category.id] = { period, status: 'available', amount: cell.value, currency: category.monthlyTotal!.currency };
        }
      }
    } catch (error) {
      if (!(error instanceof SheetsAccessError)) throw error;
      if (error.code !== 'unavailable') throw new MappingError(error.code);
    }
    return result;
  }
}
