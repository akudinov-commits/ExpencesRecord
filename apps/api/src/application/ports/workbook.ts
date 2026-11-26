export interface Rectangle { startRow: number; endRow: number; startColumn: number; endColumn: number }
export interface CellReference { sheetTitle: string; row: number; column: number }
export interface RateReference extends CellReference { operation: 'multiply' | 'divide' }
export interface CategoryBinding { id: string; label: string; column: number; storageCurrency?: string }
export interface CurrencyBinding { code: string; rate: RateReference | null }
export interface MonthMapping {
  month: number; sheetTitle: string; range: Rectangle; headerRow: number; dateColumn: number;
  dateRows: { from: number; to: number }; dateEncoding: 'serial' | 'iso' | 'day-first';
  categories: CategoryBinding[]; currencies: CurrencyBinding[];
}
export interface WorkbookYear { year: number; spreadsheetId: string; baseCurrency: string; months: MonthMapping[] }
export interface MappingConfiguration { years: WorkbookYear[] }
export interface MappingConfigurationSource { get(): MappingConfiguration | null }
export interface SheetMetadata { title: string; rowCount: number; columnCount: number; sheetId?: number }
export interface SheetCell { row: number; column: number; value: string | number | boolean | null; formula?: string; error?: string }
export interface SheetReader {
  listSheets(spreadsheetId: string, accessToken: string): Promise<SheetMetadata[]>;
  readCells(spreadsheetId: string, sheetTitle: string, rectangle: Rectangle, accessToken: string): Promise<SheetCell[]>;
}
