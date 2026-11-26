import type { Rectangle, SheetCell, SheetMetadata, SheetReader } from '../application/ports/workbook.js';
import { SheetsAccessError } from '../application/ports/sheets-access.js';
const unavailable = (): never => { throw new SheetsAccessError('unavailable'); };
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : unavailable();
}
function array(value: unknown, maximum = 20000): unknown[] { return Array.isArray(value) && value.length <= maximum ? value : unavailable(); }
function integer(value: unknown, minimum: number, maximum: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : unavailable();
}
function text(value: unknown, maximum: number): string { return typeof value === 'string' && value.length <= maximum ? value : unavailable(); }
function title(value: string): string {
  if (!value || value.length > 100 || [...value].some(character => character.charCodeAt(0) < 32)) return unavailable();
  return value;
}
function bounds(r: Rectangle): void {
  integer(r.startRow, 1, 10000000); integer(r.endRow, r.startRow, 10000000);
  integer(r.startColumn, 1, 18278); integer(r.endColumn, r.startColumn, 18278);
  if ((r.endRow - r.startRow + 1) * (r.endColumn - r.startColumn + 1) > 20000) unavailable();
}
function letters(index: number): string {
  let result = '';
  for (let value = index; value > 0; value = Math.floor((value - 1) / 26)) result = String.fromCharCode(65 + (value - 1) % 26) + result;
  return result;
}
function rawCell(value: unknown, row: number, column: number): SheetCell | null {
  const cell = object(value); const result: SheetCell = { row, column, value: null };
  if (cell.userEnteredValue !== undefined) {
    const entered = object(cell.userEnteredValue);
    if (entered.formulaValue !== undefined) result.formula = text(entered.formulaValue, 50000);
  }
  if (cell.effectiveValue !== undefined) {
    const effective = object(cell.effectiveValue); const keys = Object.keys(effective);
    if (keys.length > 1) return unavailable();
    if ('numberValue' in effective) {
      if (typeof effective.numberValue !== 'number' || !Number.isFinite(effective.numberValue)) return unavailable();
      result.value = effective.numberValue;
    } else if ('stringValue' in effective) result.value = text(effective.stringValue, 50000);
    else if ('boolValue' in effective) {
      if (typeof effective.boolValue !== 'boolean') return unavailable(); result.value = effective.boolValue;
    } else if ('errorValue' in effective) {
      const error = object(effective.errorValue).type;
      if (typeof error !== 'string' || !['ERROR', 'NULL_VALUE', 'DIVIDE_BY_ZERO', 'VALUE', 'REF', 'NAME', 'NUM', 'N_A', 'LOADING'].includes(error)) return unavailable();
      result.error = error;
    } else if (keys.length) return unavailable();
  }
  return result.value !== null || result.formula !== undefined || result.error !== undefined ? result : null;
}
export class GoogleSheetReader implements SheetReader {
  constructor(private readonly request: typeof fetch = fetch) {}
  private async get(spreadsheetId: string, accessToken: string, fields: string, range?: string): Promise<Record<string, unknown>> {
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(spreadsheetId) || !accessToken || /\s/.test(accessToken)) return unavailable();
    try {
      const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`);
      url.searchParams.set('fields', fields);
      if (range) url.searchParams.set('ranges', range); else url.searchParams.set('includeGridData', 'false');
      const response = await this.request(url.toString(), { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (response.status === 401) throw new SheetsAccessError('reconnect_required');
      if (response.status === 403 || response.status === 404) throw new SheetsAccessError('access_denied');
      if (response.status !== 200 || !response.body) return unavailable();
      const limit = 2 * 1024 * 1024;
      if (Number(response.headers.get('content-length')) > limit) { await response.body.cancel(); return unavailable(); }
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
      try {
        while (true) {
          const part = await reader.read(); if (part.done) break;
          size += part.value.length;
          if (size > limit) { await reader.cancel(); return unavailable(); }
          chunks.push(part.value);
        }
      } finally { reader.releaseLock(); }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      return object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
    } catch (error) {
      if (error instanceof SheetsAccessError) throw error;
      return unavailable();
    }
  }
  async listSheets(spreadsheetId: string, accessToken: string): Promise<SheetMetadata[]> {
    const result = await this.get(spreadsheetId, accessToken, 'sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))');
    return array(result.sheets, 1000).map(value => {
      const properties = object(object(value).properties); const dimensions = object(properties.gridProperties);
      return { ...(properties.sheetId === undefined ? {} : { sheetId: integer(properties.sheetId, 0, 2147483647) }), title: title(text(properties.title, 100)), rowCount: integer(dimensions.rowCount, 1, 10000000), columnCount: integer(dimensions.columnCount, 1, 18278) };
    });
  }
  async readCells(spreadsheetId: string, sheetTitle: string, rectangle: Rectangle, accessToken: string): Promise<SheetCell[]> {
    bounds(rectangle); title(sheetTitle);
    const range = `'${sheetTitle.replaceAll("'", "''")}'!${letters(rectangle.startColumn)}${rectangle.startRow}:${letters(rectangle.endColumn)}${rectangle.endRow}`;
    const result = await this.get(spreadsheetId, accessToken, 'sheets(properties(title),data(startRow,startColumn,rowData(values(userEnteredValue(formulaValue),effectiveValue))))', range);
    const sheets = array(result.sheets, 1); if (sheets.length !== 1) return unavailable();
    const sheet = object(sheets[0]); if (object(sheet.properties).title !== sheetTitle) return unavailable();
    const cells: SheetCell[] = [];
    for (const raw of array(sheet.data ?? [], 1)) {
      const data = object(raw); const startRow = integer(data.startRow ?? 0, 0, 9999999) + 1; const startColumn = integer(data.startColumn ?? 0, 0, 18277) + 1;
      if (startRow < rectangle.startRow || startColumn < rectangle.startColumn || startRow > rectangle.endRow || startColumn > rectangle.endColumn) return unavailable();
      const rows = array(data.rowData ?? []);
      if (startRow + rows.length - 1 > rectangle.endRow) return unavailable();
      for (let row = 0; row < rows.length; row++) {
        const values = array(object(rows[row]).values ?? []);
        if (startColumn + values.length - 1 > rectangle.endColumn) return unavailable();
        for (let column = 0; column < values.length; column++) {
          const cell = rawCell(values[column], startRow + row, startColumn + column); if (cell) cells.push(cell);
        }
      }
    }
    return cells;
  }
}
