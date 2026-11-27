import { MappingError } from './expense-context.js';
import type { ExpenseContextQuery, ExpenseContextResult } from './expense-context.js';
import type { CategoryBinding, MonthlyCategoryTotal, SheetReader } from './ports/workbook.js';
import type { SheetsCredentials } from './ports/sheets-access.js';
import { SheetsAccessError } from './ports/sheets-access.js';
export class GetExpenseEntryContext implements ExpenseContextQuery {
  constructor(private readonly base: ExpenseContextQuery, private readonly credentials: SheetsCredentials, private readonly reader: SheetReader) {}
  async execute(subject: string, date: string): Promise<ExpenseContextResult> {
    const context = await this.base.execute(subject, date);
    if (!context.categories.some(category => category.monthlyTotal)) return context;
    const period = date.slice(0, 7);
    const totals: Record<string, MonthlyCategoryTotal> = Object.fromEntries(context.categories.map(category => [category.id, { period, status: 'unavailable' }]));
    const result = { ...context, monthlyTotals: totals };
    try {
      const credential = await this.credentials.get();
      if (credential.subject !== subject) throw new MappingError('access_denied');
      const metadata = await this.reader.listSheets(context.target.spreadsheetId, credential.accessToken);
      const sheets = metadata.filter(sheet => sheet.title === context.target.sheetTitle);
      const sheet = sheets.length === 1 ? sheets[0] : undefined;
      if (!sheet) return result;
      const groups = new Map<number, CategoryBinding[]>();
      for (const category of context.categories) {
        const binding = category.monthlyTotal;
        if (!binding || !Number.isSafeInteger(binding.row) || binding.row < 1 || binding.row > sheet.rowCount
          || !Number.isSafeInteger(category.column) || category.column < 1 || category.column > sheet.columnCount || !/^[A-Z]{3}$/.test(binding.currency)) continue;
        const group = groups.get(binding.row) ?? []; group.push(category); groups.set(binding.row, group);
      }
      let remainingCells = 20000;
      for (const [row, categories] of groups) {
        const startColumn = Math.min(...categories.map(category => category.column));
        const endColumn = Math.max(...categories.map(category => category.column));
        const width = endColumn - startColumn + 1;
        if (width > remainingCells) continue;
        remainingCells -= width;
        const cells = await this.reader.readCells(context.target.spreadsheetId, context.target.sheetTitle, { startRow: row, endRow: row, startColumn, endColumn }, credential.accessToken);
        const seen = new Set<number>();
        if (cells.some(cell => {
          const bad = cell.row !== row || !Number.isSafeInteger(cell.column) || cell.column < startColumn || cell.column > endColumn || seen.has(cell.column);
          seen.add(cell.column); return bad;
        })) continue;
        for (const category of categories) {
          const cell = cells.find(cell => cell.column === category.column);
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
