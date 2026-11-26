import type { CategoryBinding, CurrencyBinding, MappingConfigurationSource, MonthMapping, Rectangle, SheetCell, SheetReader } from './ports/workbook.js';
import type { SheetsCredentials } from './ports/sheets-access.js';
import { SheetsAccessError } from './ports/sheets-access.js';
export type MappingFailure = 'invalid_date' | 'year_not_configured' | 'month_not_configured' | 'mapping_invalid' | 'mapping_unavailable' | 'reconnect_required' | 'sheets_unavailable' | 'access_denied';
export class MappingError extends Error { constructor(public readonly code: MappingFailure) { super(code); } }
export interface ExpenseContextResult {
  date: string; baseCurrency: string; categories: CategoryBinding[]; currencies: CurrencyBinding[];
  target: { spreadsheetId: string; sheetTitle: string; row: number };
}
export interface ExpenseContextQuery { execute(subject: string, date: string): Promise<ExpenseContextResult> }
const invalid = (): never => { throw new MappingError('mapping_invalid'); };
function calendar(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match || Number(match[1]) < 1900 || Number(match[1]) > 9999) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value ? { year: Number(match[1]), month: Number(match[2]) } : null;
}
function storedDate(value: SheetCell['value'], encoding: MonthMapping['dateEncoding']): string | null {
  let date: string;
  if (encoding === 'serial') {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 2958465) return null;
    date = new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10);
  } else {
    if (typeof value !== 'string') return null;
    if (encoding === 'day-first') {
      const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value); if (!match) return null;
      date = `${match[3]}-${match[2]}-${match[1]}`;
    } else date = value;
  }
  return calendar(date) ? date : null;
}
function index(cells: SheetCell[], rectangle: Rectangle): Map<string, SheetCell> {
  const result = new Map<string, SheetCell>();
  for (const cell of cells) {
    const key = `${cell.row}:${cell.column}`;
    if (!Number.isSafeInteger(cell.row) || !Number.isSafeInteger(cell.column) || cell.row < rectangle.startRow || cell.row > rectangle.endRow
      || cell.column < rectangle.startColumn || cell.column > rectangle.endColumn || result.has(key)) return invalid();
    result.set(key, cell);
  }
  return result;
}
export class GetExpenseContext implements ExpenseContextQuery {
  constructor(private readonly allowedSubject: string, private readonly configuration: MappingConfigurationSource, private readonly credentials: SheetsCredentials, private readonly reader: SheetReader) {}
  async execute(subject: string, date: string): Promise<ExpenseContextResult> {
    if (!subject || subject !== this.allowedSubject) throw new MappingError('access_denied');
    const parsed = calendar(date); if (!parsed) throw new MappingError('invalid_date');
    const configuration = this.configuration.get(); if (!configuration) throw new MappingError('mapping_unavailable');
    const years = configuration.years.filter(year => year.year === parsed.year);
    if (!years.length) throw new MappingError('year_not_configured'); if (years.length !== 1) return invalid();
    const year = years[0]!; const months = year.months.filter(month => month.month === parsed.month);
    if (!months.length) throw new MappingError('month_not_configured'); if (months.length !== 1) return invalid();
    const month = months[0]!;
    try {
      const credential = await this.credentials.get();
      if (credential.subject !== this.allowedSubject) throw new MappingError('access_denied');
      const metadata = await this.reader.listSheets(year.spreadsheetId, credential.accessToken);
      const sheets = new Map(metadata.map(sheet => [sheet.title, sheet])); if (sheets.size !== metadata.length) return invalid();
      const sheet = sheets.get(month.sheetTitle);
      if (!sheet || month.range.endRow > sheet.rowCount || month.range.endColumn > sheet.columnCount) return invalid();
      const raw = await this.reader.readCells(year.spreadsheetId, month.sheetTitle, month.range, credential.accessToken);
      const cells = index(raw, month.range);
      for (const category of month.categories) {
        const cell = cells.get(`${month.headerRow}:${category.column}`);
        const matches = raw.filter(value => value.row === month.headerRow && typeof value.value === 'string' && value.value.trim() === category.label);
        if (cell?.error || matches.length !== 1 || matches[0]?.column !== category.column) return invalid();
      }
      const dates = new Map<string, number>();
      for (let row = month.dateRows.from; row <= month.dateRows.to; row++) {
        const cell = cells.get(`${row}:${month.dateColumn}`);
        if (cell?.error) return invalid();
        if (!cell || cell.value === null || cell.value === '') continue;
        const actual = storedDate(cell.value, month.dateEncoding);
        if (!actual || actual.slice(0, 7) !== date.slice(0, 7) || dates.has(actual)) return invalid();
        dates.set(actual, row);
      }
      const row = dates.get(date); if (row === undefined) return invalid();
      for (const currency of month.currencies) {
        const rate = currency.rate; if (!rate) continue;
        const sheet = sheets.get(rate.sheetTitle);
        if (!sheet || rate.row > sheet.rowCount || rate.column > sheet.columnCount) return invalid();
        let cell: SheetCell | undefined;
        if (rate.sheetTitle === month.sheetTitle && rate.row >= month.range.startRow && rate.row <= month.range.endRow && rate.column >= month.range.startColumn && rate.column <= month.range.endColumn) cell = cells.get(`${rate.row}:${rate.column}`);
        else {
          const bounds = { startRow: rate.row, endRow: rate.row, startColumn: rate.column, endColumn: rate.column };
          const raw = await this.reader.readCells(year.spreadsheetId, rate.sheetTitle, bounds, credential.accessToken);
          cell = index(raw, bounds).get(`${rate.row}:${rate.column}`);
        }
        if (!cell || cell.error || typeof cell.value !== 'number' || !Number.isFinite(cell.value) || cell.value <= 0) return invalid();
      }
      return { date, baseCurrency: year.baseCurrency, categories: month.categories.map(category => ({ ...category })),
        currencies: month.currencies.map(currency => ({ code: currency.code, rate: currency.rate ? { ...currency.rate } : null })),
        target: { spreadsheetId: year.spreadsheetId, sheetTitle: month.sheetTitle, row } };
    } catch (error) {
      if (error instanceof SheetsAccessError) throw new MappingError(error.code === 'unavailable' ? 'sheets_unavailable' : error.code);
      throw error;
    }
  }
}
