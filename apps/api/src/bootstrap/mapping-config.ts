import type { CurrencyBinding, MappingConfiguration, MonthMapping, Rectangle, WorkbookYear } from '../application/ports/workbook.js';
export class MappingConfigurationError extends Error { constructor() { super('Invalid mapping configuration'); } }
const invalid = (): never => { throw new MappingConfigurationError(); };
function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const object = value as Record<string, unknown>;
  if (Object.keys(object).length !== keys.length || keys.some(key => !Object.hasOwn(object, key))) return invalid();
  return object;
}
function array(value: unknown, maximum: number): unknown[] {
  return Array.isArray(value) && value.length > 0 && value.length <= maximum ? value : invalid();
}
function integer(value: unknown, minimum: number, maximum: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : invalid();
}
function string(value: unknown, maximum: number, pattern?: RegExp): string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum && value.trim() === value
    && ![...value].some(character => character.charCodeAt(0) < 32) && (!pattern || pattern.test(value)) ? value : invalid();
}
function distinct(values: (string | number)[]): void { if (new Set(values).size !== values.length) invalid(); }
function column(value: unknown): number {
  const letters = string(value, 3, /^[A-Z]+$/);
  return integer([...letters].reduce((result, letter) => result * 26 + letter.charCodeAt(0) - 64, 0), 1, 18278);
}
function cell(value: unknown): { row: number; column: number } {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d{0,7})$/.exec(string(value, 16));
  return match ? { row: integer(Number(match[2]), 1, 10000000), column: column(match[1]) } : invalid();
}
function rectangle(value: unknown): Rectangle {
  const pieces = string(value, 40).split(':');
  if (pieces.length !== 2) return invalid();
  const start = cell(pieces[0]); const end = cell(pieces[1]);
  if (end.row < start.row || end.column < start.column || (end.row - start.row + 1) * (end.column - start.column + 1) > 20000) return invalid();
  return { startRow: start.row, endRow: end.row, startColumn: start.column, endColumn: end.column };
}
function month(value: unknown, baseCurrency: string): MonthMapping {
  const v = record(value, ['month', 'sheetTitle', 'range', 'headerRow', 'dateColumn', 'dateRows', 'dateEncoding', 'categories', 'currencies']);
  const range = rectangle(v.range);
  const headerRow = integer(v.headerRow, range.startRow, range.endRow);
  const dateColumn = column(v.dateColumn);
  if (dateColumn < range.startColumn || dateColumn > range.endColumn) return invalid();
  const rows = record(v.dateRows, ['from', 'to']);
  const dateRows = { from: integer(rows.from, range.startRow, range.endRow), to: integer(rows.to, range.startRow, range.endRow) };
  if (dateRows.from > dateRows.to || (headerRow >= dateRows.from && headerRow <= dateRows.to)) return invalid();
  const dateEncoding = v.dateEncoding;
  if (dateEncoding !== 'serial' && dateEncoding !== 'iso' && dateEncoding !== 'day-first') return invalid();
  const categories = array(v.categories, 200).map(value => {
    const category = record(value, ['id', 'label', 'column']); const position = column(category.column);
    if (position < range.startColumn || position > range.endColumn || position === dateColumn) return invalid();
    return { id: string(category.id, 64, /^[a-z][a-z0-9-]*$/), label: string(category.label, 200), column: position };
  });
  distinct(categories.map(category => category.id)); distinct(categories.map(category => category.label)); distinct(categories.map(category => category.column));
  const currencies = array(v.currencies, 200).map<CurrencyBinding>(value => {
    const currency = record(value, ['code', 'rate']); const code = string(currency.code, 3, /^[A-Z]{3}$/);
    if ((code === baseCurrency) !== (currency.rate === null)) return invalid();
    if (currency.rate === null) return { code, rate: null };
    const rate = record(currency.rate, ['sheetTitle', 'cell', 'operation']);
    if (rate.operation !== 'multiply' && rate.operation !== 'divide') return invalid();
    return { code, rate: { sheetTitle: string(rate.sheetTitle, 100), ...cell(rate.cell), operation: rate.operation } };
  });
  distinct(currencies.map(currency => currency.code));
  if (!currencies.some(currency => currency.code === baseCurrency)) return invalid();
  return { month: integer(v.month, 1, 12), sheetTitle: string(v.sheetTitle, 100), range, headerRow, dateColumn, dateRows, dateEncoding, categories, currencies };
}
function year(value: unknown): WorkbookYear {
  const v = record(value, ['year', 'spreadsheetId', 'baseCurrency', 'months']);
  const baseCurrency = string(v.baseCurrency, 3, /^[A-Z]{3}$/);
  const months = array(v.months, 12).map(value => month(value, baseCurrency)); distinct(months.map(month => month.month));
  return { year: integer(v.year, 1900, 9999), spreadsheetId: string(v.spreadsheetId, 200, /^[A-Za-z0-9_-]{10,200}$/), baseCurrency, months };
}
export function parseMappingConfiguration(environment: NodeJS.ProcessEnv): MappingConfiguration {
  const raw = environment.EXPENSE_WORKBOOKS_JSON;
  if (!raw || raw.length > 200000) return invalid();
  try {
    const v = record(JSON.parse(raw), ['version', 'years']);
    if (v.version !== 1) return invalid();
    const years = array(v.years, 100).map(year); distinct(years.map(year => year.year));
    return { years };
  } catch (error) {
    if (error instanceof SyntaxError) return invalid();
    throw error;
  }
}
