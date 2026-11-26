import { expect, test } from 'vitest';
import { MappingConfigurationError, parseMappingConfiguration } from '../../src/bootstrap/mapping-config.js';
import { mappingEnvironment, mappingInput } from '../support/mapping.js';

test('compiles explicit annual/month/category/rate configuration into neutral inward coordinates', () => {
  const result = parseMappingConfiguration(mappingEnvironment());
  expect(result.years).toHaveLength(1);
  expect(result.years[0]).toMatchObject({ year: 2099, spreadsheetId: 'synthetic-workbook-id', baseCurrency: 'KZT', months: [{
    range: { startRow: 1, endRow: 40, startColumn: 1, endColumn: 8 }, dateColumn: 1,
    categories: [{ id: 'groceries', label: 'Synthetic groceries', column: 3 }],
    currencies: [{ code: 'KZT', rate: null }, { code: 'AED', rate: { sheetTitle: 'Synthetic January', row: 39, column: 6, operation: 'multiply' } }],
  }] });
});
test('new currency codes, cross-tab references, division and later annual workbooks require no currency switch', () => {
  const input = mappingInput();
  input.years[0]!.months[0]!.currencies.push({ code: 'JPY', rate: { sheetTitle: 'Synthetic rates', cell: 'AA7', operation: 'divide' } });
  input.years.push({ ...structuredClone(input.years[0]!), year: 2100, spreadsheetId: 'synthetic-later-workbook' });
  const result = parseMappingConfiguration(mappingEnvironment(input));
  expect(result.years.map(y => y.year)).toEqual([2099, 2100]);
  expect(result.years[0]?.months[0]?.currencies[2]?.rate).toEqual({ sheetTitle: 'Synthetic rates', row: 7, column: 27, operation: 'divide' });
});
test.each(['serial', 'iso', 'day-first'])('date encoding %s is explicit and retained', dateEncoding => {
  const input = mappingInput(); input.years[0]!.months[0]!.dateEncoding = dateEncoding;
  expect(parseMappingConfiguration(mappingEnvironment(input)).years[0]?.months[0]?.dateEncoding).toBe(dateEncoding);
});
test.each([undefined, '', '{', 'null', '[]', '{"version":2,"years":[]}', '{"version":1,"years":[]}'])('missing or malformed setting %s fails with a fixed private-safe error', value => {
  expect(() => parseMappingConfiguration(value === undefined ? {} : { EXPENSE_WORKBOOKS_JSON: value })).toThrow(MappingConfigurationError);
});
const corruptions: [string, (value: ReturnType<typeof mappingInput>) => void][] = [
  ['unknown top-level key', v => Object.assign(v, { extra: 'private-marker' })],
  ['unknown month key', v => Object.assign(v.years[0]!.months[0]!, { extra: true })],
  ['duplicate year', v => v.years.push(structuredClone(v.years[0]!))],
  ['duplicate month', v => v.years[0]!.months.push(structuredClone(v.years[0]!.months[0]!))],
  ['invalid year', v => { v.years[0]!.year = 2099.5; }],
  ['invalid workbook', v => { v.years[0]!.spreadsheetId = 'https://attacker.invalid'; }],
  ['invalid currency code', v => { v.years[0]!.baseCurrency = 'kzt'; }],
  ['invalid month', v => { v.years[0]!.months[0]!.month = 13; }],
  ['blank title', v => { v.years[0]!.months[0]!.sheetTitle = ''; }],
  ['unbounded range', v => { v.years[0]!.months[0]!.range = 'A:H'; }],
  ['oversized range', v => { v.years[0]!.months[0]!.range = 'A1:ZZ99999'; }],
  ['reversed range', v => { v.years[0]!.months[0]!.range = 'H40:A1'; }],
  ['header outside range', v => { v.years[0]!.months[0]!.headerRow = 41; }],
  ['date column outside range', v => { v.years[0]!.months[0]!.dateColumn = 'ZZ'; }],
  ['date rows reversed', v => { v.years[0]!.months[0]!.dateRows = { from: 32, to: 2 }; }],
  ['date/header overlap', v => { v.years[0]!.months[0]!.dateRows.from = 1; }],
  ['unknown encoding', v => { v.years[0]!.months[0]!.dateEncoding = 'guess'; }],
  ['empty categories', v => { v.years[0]!.months[0]!.categories = []; }],
  ['duplicate category', v => v.years[0]!.months[0]!.categories.push(structuredClone(v.years[0]!.months[0]!.categories[0]!))],
  ['category/date overlap', v => { v.years[0]!.months[0]!.categories[0]!.column = 'A'; }],
  ['category outside range', v => { v.years[0]!.months[0]!.categories[0]!.column = 'ZZ'; }],
  ['blank category label', v => { v.years[0]!.months[0]!.categories[0]!.label = ''; }],
  ['unsafe category id', v => { v.years[0]!.months[0]!.categories[0]!.id = '../bad'; }],
  ['duplicate currency', v => v.years[0]!.months[0]!.currencies.push({ code: 'KZT', rate: null })],
  ['absent base currency', v => { v.years[0]!.months[0]!.currencies.shift(); }],
  ['foreign currency without rate', v => { v.years[0]!.months[0]!.currencies[1]!.rate = null; }],
  ['base currency with rate', v => { v.years[0]!.months[0]!.currencies[0]!.rate = v.years[0]!.months[0]!.currencies[1]!.rate; }],
  ['invalid operation', v => { v.years[0]!.months[0]!.currencies[1]!.rate!.operation = 'guess'; }],
  ['range instead of rate cell', v => { v.years[0]!.months[0]!.currencies[1]!.rate!.cell = 'F39:F40'; }],
];
test.each(corruptions)('rejects %s without disclosing populated configuration', (_label, corrupt) => {
  const input = mappingInput(); corrupt(input);
  expect(() => parseMappingConfiguration(mappingEnvironment(input))).toThrow('Invalid mapping configuration');
});
