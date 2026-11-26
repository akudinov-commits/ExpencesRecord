export function mappingInput() {
  return { version: 1, years: [{ year: 2099, spreadsheetId: 'synthetic-workbook-id', baseCurrency: 'KZT', months: [{
    month: 1, sheetTitle: 'Synthetic January', range: 'A1:H40', headerRow: 1, dateColumn: 'A', dateRows: { from: 2, to: 32 }, dateEncoding: 'serial',
    categories: [{ id: 'groceries', label: 'Synthetic groceries', column: 'C' }],
    currencies: [{ code: 'KZT', rate: null }, { code: 'AED', rate: { sheetTitle: 'Synthetic January', cell: 'F39', operation: 'multiply' } }],
  }] }] };
}
export function mappingEnvironment(value: unknown = mappingInput()) { return { EXPENSE_WORKBOOKS_JSON: JSON.stringify(value) }; }
