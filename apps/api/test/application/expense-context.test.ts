import { expect, test, vi } from 'vitest';
import { GetExpenseContext } from '../../src/application/expense-context.js';
import { SheetsAccessError } from '../../src/application/ports/sheets-access.js';
import type { SheetCell, SheetReader } from '../../src/application/ports/workbook.js';
import { parseMappingConfiguration } from '../../src/bootstrap/mapping-config.js';
import { mappingEnvironment, mappingInput } from '../support/mapping.js';
const owner = 'synthetic-owner'; const requestedDate = '2099-01-15';
const serial = (value: string) => (Date.parse(`${value}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000;
function fixture() {
  const config = parseMappingConfiguration(mappingEnvironment());
  const cells: SheetCell[] = [{ row: 1, column: 3, value: 'Synthetic groceries' }, { row: 16, column: 1, value: serial(requestedDate) }, { row: 39, column: 6, value: 7 }];
  const configuration = { get: vi.fn(() => config) };
  const credentials = { get: vi.fn(async () => ({ subject: owner, accessToken: 'synthetic-access' })) };
  const reader = {
    listSheets: vi.fn<SheetReader['listSheets']>().mockResolvedValue([{ title: 'Synthetic January', rowCount: 65, columnCount: 30 }, { title: 'Synthetic rates', rowCount: 65, columnCount: 30 }]),
    readCells: vi.fn<SheetReader['readCells']>().mockResolvedValue(cells),
  };
  return { config, cells, configuration, credentials, reader, service: new GetExpenseContext(owner, configuration, credentials, reader) };
}
test('the allowed owner resolves an explicit date/header/rate without FX evaluation or changing raw cells', async () => {
  const f = fixture(); const before = structuredClone(f.cells);
  const result = await f.service.execute(owner, requestedDate);
  expect(result).toEqual({ date: requestedDate, baseCurrency: 'KZT', categories: [{ id: 'groceries', label: 'Synthetic groceries', column: 3 }], currencies: f.config.years[0]!.months[0]!.currencies,
    target: { spreadsheetId: 'synthetic-workbook-id', sheetTitle: 'Synthetic January', row: 16 } });
  expect(f.credentials.get).toHaveBeenCalledOnce(); expect(f.reader.listSheets).toHaveBeenCalledExactlyOnceWith('synthetic-workbook-id', 'synthetic-access');
  expect(f.reader.readCells).toHaveBeenCalledExactlyOnceWith('synthetic-workbook-id', 'Synthetic January', f.config.years[0]!.months[0]!.range, 'synthetic-access');
  expect(f.cells).toEqual(before); expect(JSON.stringify(result)).not.toContain('synthetic-access');
});
test.each(['', 'different-owner'])('requesting subject %s is denied before config, credentials or I/O', async subject => {
  const f = fixture(); await expect(f.service.execute(subject, requestedDate)).rejects.toMatchObject({ code: 'access_denied' });
  expect(f.configuration.get).not.toHaveBeenCalled(); expect(f.credentials.get).not.toHaveBeenCalled();
});
test('a valid refreshed credential for another subject cannot reach the workbook', async () => {
  const f = fixture(); f.credentials.get.mockResolvedValue({ subject: 'different', accessToken: 'other-access' });
  await expect(f.service.execute(owner, requestedDate)).rejects.toMatchObject({ code: 'access_denied' }); expect(f.reader.listSheets).not.toHaveBeenCalled();
});
test.each(['', '2099-02-29', '2099-13-01', '2099-00-01', '2099-01-00', '2099-04-31', '2099-1-15', '2099-01-15T00:00:00Z', '../2099-01-15'])('invalid calendar input %s is rejected before dependency access', async date => {
  const f = fixture(); await expect(f.service.execute(owner, date)).rejects.toMatchObject({ code: 'invalid_date' }); expect(f.configuration.get).not.toHaveBeenCalled();
});
test('absent mapping configuration is an explicit unavailable result', async () => {
  const f = fixture(); const service = new GetExpenseContext(owner, { get: () => null }, f.credentials, f.reader);
  await expect(service.execute(owner, requestedDate)).rejects.toMatchObject({ code: 'mapping_unavailable' }); expect(f.credentials.get).not.toHaveBeenCalled();
});
test.each([['2100-01-15', 'year_not_configured'], ['2099-02-15', 'month_not_configured']])('unconfigured request %s produces %s without a guessed workbook', async (date, code) => {
  const f = fixture(); await expect(f.service.execute(owner, date!)).rejects.toMatchObject({ code }); expect(f.credentials.get).not.toHaveBeenCalled();
});
test.each(['reconnect_required', 'access_denied', 'unavailable'] as const)('credential failure %s is translated without its private message', async code => {
  const f = fixture(); f.credentials.get.mockRejectedValue(new SheetsAccessError(code));
  await expect(f.service.execute(owner, requestedDate)).rejects.toMatchObject({ code: code === 'unavailable' ? 'sheets_unavailable' : code });
});
test('unexpected implementation failures are not disguised as dependency or user errors', async () => {
  const f = fixture(); const unexpected = new Error('implementation failure'); f.reader.listSheets.mockRejectedValue(unexpected);
  await expect(f.service.execute(owner, requestedDate)).rejects.toBe(unexpected);
});
test.each(['missing-sheet', 'duplicate-sheet', 'too-few-rows', 'too-few-columns'])('invalid metadata %s fails before raw-cell reads', async failure => {
  const f = fixture();
  f.reader.listSheets.mockResolvedValue(failure === 'missing-sheet' ? [] : failure === 'duplicate-sheet' ? [{ title: 'Synthetic January', rowCount: 65, columnCount: 30 }, { title: 'Synthetic January', rowCount: 65, columnCount: 30 }] : [{ title: 'Synthetic January', rowCount: failure === 'too-few-rows' ? 10 : 65, columnCount: failure === 'too-few-columns' ? 2 : 30 }]);
  await expect(f.service.execute(owner, requestedDate)).rejects.toMatchObject({ code: 'mapping_invalid' }); expect(f.reader.readCells).not.toHaveBeenCalled();
});
test.each(['missing-header', 'moved-header', 'duplicate-header', 'header-error', 'missing-date', 'duplicate-date', 'date-error', 'wrong-month', 'bad-date', 'missing-rate', 'zero-rate', 'negative-rate', 'text-rate', 'rate-error', 'duplicate-coordinate', 'out-of-bounds'])('invalid layout %s fails explicitly', async failure => {
  const f = fixture(); const header = f.cells[0]!, day = f.cells[1]!, rate = f.cells[2]!;
  if (failure === 'missing-header') header.value = null;
  if (failure === 'moved-header') header.column = 4;
  if (failure === 'duplicate-header') f.cells.push({ ...header, column: 4 });
  if (failure === 'header-error') header.error = 'REF';
  if (failure === 'missing-date') day.value = null;
  if (failure === 'duplicate-date') f.cells.push({ ...day, row: 17 });
  if (failure === 'date-error') day.error = 'VALUE';
  if (failure === 'wrong-month') day.value = serial('2099-02-15');
  if (failure === 'bad-date') day.value = 1.5;
  if (failure === 'missing-rate') rate.value = null;
  if (failure === 'zero-rate') rate.value = 0;
  if (failure === 'negative-rate') rate.value = -1;
  if (failure === 'text-rate') rate.value = '7';
  if (failure === 'rate-error') rate.error = 'REF';
  if (failure === 'duplicate-coordinate') f.cells.push({ ...day });
  if (failure === 'out-of-bounds') f.cells.push({ row: 100, column: 1, value: 0 });
  await expect(f.service.execute(owner, requestedDate)).rejects.toMatchObject({ code: 'mapping_invalid' });
});
test.each([['iso', requestedDate], ['day-first', '15/01/2099']] as const)('configured encoding %s resolves the same calendar date', async (encoding, value) => {
  const f = fixture(); f.config.years[0]!.months[0]!.dateEncoding = encoding; f.cells[1]!.value = value;
  expect((await f.service.execute(owner, requestedDate)).target.row).toBe(16);
});
test('a true leap day is accepted without local time-zone conversion', async () => {
  const input = mappingInput(); input.years[0]!.year = 2096; input.years[0]!.months[0]!.month = 2;
  const f = fixture(); const config = parseMappingConfiguration(mappingEnvironment(input)); f.cells[1]!.value = serial('2096-02-29');
  const service = new GetExpenseContext(owner, { get: () => config }, f.credentials, f.reader);
  expect((await service.execute(owner, '2096-02-29')).date).toBe('2096-02-29');
});
test('configured month boundaries exclude the template next-month spillover row', async () => {
  const f = fixture(); f.config.years[0]!.months[0]!.dateRows.to = 31;
  f.cells.push({ row: 32, column: 1, value: serial('2099-02-01') });
  expect((await f.service.execute(owner, requestedDate)).target.row).toBe(16);
});
test('an added currency reads its cross-tab reference without a fixed currency list', async () => {
  const f = fixture(); f.config.years[0]!.months[0]!.currencies.push({ code: 'JPY', rate: { sheetTitle: 'Synthetic rates', row: 7, column: 27, operation: 'divide' } });
  f.reader.readCells.mockImplementation(async (_id, sheet) => sheet === 'Synthetic rates' ? [{ row: 7, column: 27, value: 0.25 }] : f.cells);
  const result = await f.service.execute(owner, requestedDate);
  expect(result.currencies.map(currency => currency.code)).toEqual(['KZT', 'AED', 'JPY']);
  expect(f.reader.readCells).toHaveBeenCalledWith('synthetic-workbook-id', 'Synthetic rates', { startRow: 7, endRow: 7, startColumn: 27, endColumn: 27 }, 'synthetic-access');
});
