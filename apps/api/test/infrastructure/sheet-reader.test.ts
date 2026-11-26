import { expect, test, vi } from 'vitest';
import { GoogleSheetReader } from '../../src/infrastructure/sheet-reader.js';
import { SheetsAccessError } from '../../src/application/ports/sheets-access.js';
const id = 'synthetic-workbook-id'; const token = 'synthetic-access-token';
const rectangle = { startRow: 2, endRow: 3, startColumn: 3, endColumn: 5 };
const title = "Synthetic 'January";
function fixture(body: unknown, status = 200) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  return { reader: new GoogleSheetReader(request), request };
}
function grid(rows: unknown[], startRow = 1, startColumn = 2) {
  return { sheets: [{ properties: { title }, data: [{ startRow, startColumn, rowData: rows }] }] };
}
test('lists only neutral sheet titles and dimensions through a bounded metadata-only GET', async () => {
  const { reader, request } = fixture({ sheets: [{ properties: { title, gridProperties: { rowCount: 60, columnCount: 28 } } }] });
  expect(await reader.listSheets(id, token)).toEqual([{ title, rowCount: 60, columnCount: 28 }]);
  const [url, options] = request.mock.calls[0]!; const parsed = new URL(String(url));
  expect(parsed.origin).toBe('https://sheets.googleapis.com');
  expect(parsed.pathname).toBe(`/v4/spreadsheets/${id}`);
  expect(parsed.searchParams.get('fields')).toBe('sheets(properties(title,gridProperties(rowCount,columnCount)))');
  expect(parsed.searchParams.get('includeGridData')).toBe('false');
  expect(options).toMatchObject({ method: 'GET', headers: { Authorization: `Bearer ${token}` }, redirect: 'error' });
  expect(options?.signal).toBeInstanceOf(AbortSignal); expect(options).not.toHaveProperty('body');
});
test('preserves raw scalar/formula/error evidence with absolute coordinates and quotes sheet titles', async () => {
  const { reader, request } = fixture(grid([
    { values: [{ effectiveValue: { numberValue: 5 }, userEnteredValue: { formulaValue: '=2+3' } }, {}, { effectiveValue: { stringValue: 'Synthetic header' } }] },
    { values: [{ effectiveValue: { boolValue: false } }, { effectiveValue: { errorValue: { type: 'REF', message: 'private provider detail' } } }] },
  ]));
  expect(await reader.readCells(id, title, rectangle, token)).toEqual([
    { row: 2, column: 3, value: 5, formula: '=2+3' }, { row: 2, column: 5, value: 'Synthetic header' },
    { row: 3, column: 3, value: false }, { row: 3, column: 4, value: null, error: 'REF' },
  ]);
  const [url, options] = request.mock.calls[0]!; const parsed = new URL(String(url));
  expect(parsed.searchParams.get('ranges')).toBe("'Synthetic ''January'!C2:E3");
  expect(parsed.searchParams.get('fields')).toContain('userEnteredValue(formulaValue)');
  expect(parsed.searchParams.get('fields')).not.toContain('formattedValue');
  expect(options).toMatchObject({ method: 'GET', redirect: 'error' });
});
test('an empty requested rectangle is represented as empty raw cells without invented zeroes', async () => {
  const { reader } = fixture(grid([])); expect(await reader.readCells(id, title, rectangle, token)).toEqual([]);
});
test('zero and empty-string effective values are not lost by truthy-value filtering', async () => {
  const { reader } = fixture(grid([{ values: [{ effectiveValue: { numberValue: 0 } }, { effectiveValue: { stringValue: '' } }] }]));
  expect(await reader.readCells(id, title, rectangle, token)).toEqual([{ row: 2, column: 3, value: 0 }, { row: 2, column: 4, value: '' }]);
});
test.each([[401, 'reconnect_required'], [403, 'access_denied'], [404, 'access_denied'], [429, 'unavailable'], [500, 'unavailable']] as const)('HTTP %s yields safe failure %s without provider payload', async (status, code) => {
  const { reader } = fixture({ error: 'private provider payload' }, status);
  await expect(reader.listSheets(id, token)).rejects.toMatchObject({ code, message: code });
});
test('network exceptions are translated without leaking credential-bearing transport errors', async () => {
  const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('private transport bearer synthetic-access-token'));
  await expect(new GoogleSheetReader(request).listSheets(id, token)).rejects.toMatchObject({ code: 'unavailable', message: 'unavailable' });
  expect(request).toHaveBeenCalledOnce();
});
test.each([null, {}, { sheets: [{}] }, { sheets: [{ properties: { title, gridProperties: { rowCount: -1, columnCount: 2 } } }] }])('invalid metadata shapes fail safely', async body => {
  await expect(fixture(body).reader.listSheets(id, token)).rejects.toBeInstanceOf(SheetsAccessError);
});
test.each([
  { sheets: [{ properties: { title: 'wrong sheet' }, data: [] }] },
  grid([{ values: [{ effectiveValue: { numberValue: 'bad' } }] }]),
  grid([{ values: [{ effectiveValue: { numberValue: 1, stringValue: 'ambiguous' } }] }]),
  grid([{ values: [{ userEnteredValue: { formulaValue: 3 } }] }]),
  grid([{ values: [{ effectiveValue: { errorValue: { type: 'PRIVATE_UNKNOWN' } } }] }]),
  grid([{ values: [{ effectiveValue: { numberValue: 1 } }] }], 0),
  grid([{ values: [{}, {}, {}, { effectiveValue: { numberValue: 1 } }] }]),
  grid([{}, {}, { values: [{ effectiveValue: { numberValue: 1 } }] }]),
])('malformed or out-of-bounds grid data is rejected', async body => {
  await expect(fixture(body).reader.readCells(id, title, rectangle, token)).rejects.toMatchObject({ code: 'unavailable' });
});
test.each([
  { ...rectangle, startRow: 0 }, { ...rectangle, endRow: 1 }, { ...rectangle, endColumn: 2 },
  { ...rectangle, endRow: 999999 }, { ...rectangle, startColumn: 2.5 },
])('invalid or oversized rectangles are rejected before network I/O', async bounds => {
  const { reader, request } = fixture({});
  await expect(reader.readCells(id, title, bounds, token)).rejects.toBeInstanceOf(SheetsAccessError);
  expect(request).not.toHaveBeenCalled();
});
test.each([['../bad', token], [id, ''], [id, 'bad\r\nheader']])('unsafe resource or authorization syntax is rejected before network I/O', async ([workbook, credential]) => {
  const { reader, request } = fixture({});
  await expect(reader.listSheets(workbook!, credential!)).rejects.toBeInstanceOf(SheetsAccessError); expect(request).not.toHaveBeenCalled();
});
test('response reads are size-bounded even without a Content-Length header', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('x'.repeat(2 * 1024 * 1024 + 1)));
  await expect(new GoogleSheetReader(request).listSheets(id, token)).rejects.toMatchObject({ code: 'unavailable' });
});
