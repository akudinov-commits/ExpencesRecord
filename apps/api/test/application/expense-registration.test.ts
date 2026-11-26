import { createHash } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { ExpenseRegistration } from '../../src/application/expense-registration.js';
import { parseMappingConfiguration } from '../../src/bootstrap/mapping-config.js';
import type { ExpenseOutcome, ExpenseWriter } from '../../src/application/ports/expenses.js';
import type { SheetCell, SheetReader } from '../../src/application/ports/workbook.js';
import { mappingEnvironment } from '../support/mapping.js';
import { writeMappingInput } from '../support/registration.js';
const owner = 'synthetic-owner'; const input = { date: '2020-01-15', amount: '5', categoryId: 'groceries', currency: 'KZT' };
const acknowledgments = { acknowledgeExistingData: true, acknowledgePossibleDuplicate: true, acknowledgeInconclusive: true };
function fixture(enabled = true) {
  const config = parseMappingConfiguration(mappingEnvironment(writeMappingInput()));
  const cells: SheetCell[] = [{row:1,column:3,value:'Synthetic groceries'}, {row:16,column:1,value:(Date.UTC(2020,0,15)-Date.UTC(1899,11,30))/86400000}, {row:39,column:6,value:7}];
  const mapping = { get: vi.fn(() => config) };
  const readCredentials = { get: vi.fn(async () => ({ subject: owner, accessToken: 'synthetic-read' })) };
  const writeCredentials = { get: vi.fn(async () => ({ subject: owner, accessToken: 'synthetic-write' })) };
  const reader = { listSheets: vi.fn<SheetReader['listSheets']>().mockResolvedValue([{title:'Synthetic January',sheetId:0,rowCount:65,columnCount:30}]),
    readCells: vi.fn<SheetReader['readCells']>().mockImplementation(async (_id,_title,b) => structuredClone(cells.filter(c=>c.row>=b.startRow&&c.row<=b.endRow&&c.column>=b.startColumn&&c.column<=b.endColumn))) };
  const writer = { execute: vi.fn<ExpenseWriter['execute']>().mockResolvedValue({expense:'saved',comment:'not_requested'}) };
  const configuration = { allowedSubject: owner, writesEnabled: enabled };
  const service = new ExpenseRegistration(configuration,{mapping,readCredentials,writeCredentials,reader,writer,fingerprint:{of: v=>createHash('sha256').update(JSON.stringify(v)).digest('base64url')}});
  return {service,configuration,config,cells,mapping,reader,writer,readCredentials,writeCredentials};
}
test('owner previews a configured past date and only the selected cell without a write', async () => {
  const f=fixture(); f.cells.push({row:20,column:7,value:'unrelated-private-marker'});
  const result=await f.service.preview(owner,input);
  expect(result).toMatchObject({date:input.date,categoryId:'groceries',storageCurrency:'KZT',currentCell:{hasData:false,calculatedTotal:null,formula:null,scalarValue:null},proposedFormula:'=(5)',canSave:true,warnings:[]});
  expect(result.expectedVersion).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(JSON.stringify(result)).not.toMatch(/synthetic-workbook|synthetic-read|unrelated-private|spreadsheetId|sheetId/); expect(f.writer.execute).not.toHaveBeenCalled();
});
test('existing total/formula and possible duplicate are owner-visible but intentional repeats remain possible', async () => {
  const f=fixture(); f.cells.push({row:16,column:3,value:5,formula:'=(5)'});
  const preview=await f.service.preview(owner,input); expect(preview.currentCell).toMatchObject({hasData:true,calculatedTotal:5,formula:'=(5)'});
  expect(preview.warnings).toEqual(['existing_data','possible_duplicate']);
  await expect(f.service.save(owner,{...input,expectedVersion:preview.expectedVersion})).rejects.toMatchObject({code:'acknowledgment_required'}); expect(f.writer.execute).not.toHaveBeenCalled();
  expect(await f.service.save(owner,{...input,expectedVersion:preview.expectedVersion,...acknowledgments})).toEqual({expense:'saved',comment:'not_requested'});
  expect(f.writer.execute).toHaveBeenCalledExactlyOnceWith({spreadsheetId:'synthetic-workbook-id',sheetId:0,row:16,column:3,formula:'=(5)+(5)'},'synthetic-write');
});
test('a supported legacy group gets an inconclusive warning, not a false already-saved claim', async () => {
  const f=fixture(); f.cells.push({row:16,column:3,value:735,formula:'=(100+5)*F39'});
  const result=await f.service.preview(owner,{...input,amount:'100',currency:'AED'});
  expect(result.currentCell.calculatedTotal).toBe(735); expect(result.proposedFormula).toBe('=((100+5)*F39)+(100*$F$39)');
  expect(result.warnings).toEqual(['existing_data','duplicate_check_inconclusive']);
});
test.each(['cell','rate','command'])('a changed %s requires new preview and never reaches the writer', async change => {
  const f=fixture(); const preview=await f.service.preview(owner,input);
  if(change==='cell') f.cells.push({row:16,column:3,value:7,formula:'=(7)'});
  if(change==='rate') f.cells.find(c=>c.row===39)!.value=8;
  await expect(f.service.save(owner,{...input,...(change==='command'?{amount:'6'}:{}),expectedVersion:preview.expectedVersion,...acknowledgments})).rejects.toMatchObject({code:'cell_changed'});
  expect(f.writer.execute).not.toHaveBeenCalled();
});
test.each(['preview','save','comment'] as const)('%s authorizes before mapping, credentials and any I/O', async method => {
  const f=fixture(); await expect(f.service[method]('other-owner',input)).rejects.toMatchObject({code:'access_denied'});
  expect(f.mapping.get).not.toHaveBeenCalled(); expect(f.readCredentials.get).not.toHaveBeenCalled(); expect(f.writeCredentials.get).not.toHaveBeenCalled(); expect(f.reader.listSheets).not.toHaveBeenCalled();
});
test('a refreshed writer for another owner cannot even read the target', async () => {
  const f=fixture(); const preview=await f.service.preview(owner,input); f.reader.listSheets.mockClear(); f.reader.readCells.mockClear();
  f.writeCredentials.get.mockResolvedValue({subject:'different-owner',accessToken:'other'});
  await expect(f.service.save(owner,{...input,expectedVersion:preview.expectedVersion})).rejects.toMatchObject({code:'access_denied'});
  expect(f.reader.listSheets).not.toHaveBeenCalled(); expect(f.writer.execute).not.toHaveBeenCalled();
});
test.each(['text','formula-error','malformed-formula','function'])('unsupported %s is visible but acknowledgments cannot make it writable', async state => {
  const f=fixture(); const current: SheetCell={row:16,column:3,value:5};
  if(state==='text')current.value='=(100+5';
  if(state==='formula-error')current.error='REF';
  if(state==='malformed-formula')current.formula='=(100+5';
  if(state==='function')current.formula='=SUM(C2:C3)';
  f.cells.push(current); const preview=await f.service.preview(owner,input);
  expect(preview.canSave).toBe(false); expect(preview.blockedReason).toBe('unsupported_formula'); expect(preview.proposedFormula).toBeNull();
  await expect(f.service.save(owner,{...input,expectedVersion:preview.expectedVersion,...acknowledgments})).rejects.toMatchObject({code:'unsupported_formula'}); expect(f.writer.execute).not.toHaveBeenCalled();
});
test.each([null,[],{...input,spreadsheetId:'private-marker'},{...input,amount:5},{...input,amount:'=5'},{...input,date:'2020-02-30'},{...input,currency:'kzt'},{...input,comment:5},{...input,comment:'bad'+String.fromCharCode(0)},{...input,comment:'x'.repeat(1501)},{...input,comment:'😀'.repeat(376)}])('invalid command is rejected before credentials', async command => {
  const f=fixture(); await expect(f.service.preview(owner,command)).rejects.toMatchObject({code:expect.stringMatching(/invalid_request|invalid_amount|invalid_comment/)}); expect(f.readCredentials.get).not.toHaveBeenCalled();
});
test('writer-disabled preview is read-only and save cannot request writer credentials', async () => {
  const f=fixture(false); const preview=await f.service.preview(owner,input); expect(preview.canSave).toBe(false); expect(preview.blockedReason).toBe('writes_unavailable');
  await expect(f.service.save(owner,{...input,expectedVersion:preview.expectedVersion})).rejects.toMatchObject({code:'writes_unavailable'}); expect(f.writeCredentials.get).not.toHaveBeenCalled();
});
test('write-capable mappings require explicit category storage and reject a rate-cell target', async () => {
  const absent=fixture(); Reflect.deleteProperty(absent.config.years[0]!.months[0]!.categories[0]!,'storageCurrency');
  await expect(absent.service.preview(owner,input)).rejects.toMatchObject({code:'writes_unavailable'});
  const overlap=fixture(); overlap.cells.push({row:16,column:3,value:7}); Object.assign(overlap.config.years[0]!.months[0]!.currencies[1]!.rate!,{row:16,column:3});
  await expect(overlap.service.preview(owner,input)).rejects.toMatchObject({code:'mapping_invalid'}); expect(overlap.writer.execute).not.toHaveBeenCalled();
});
test('comment text normalizes independently and a comment-only action never includes a formula', async () => {
  const f=fixture(); f.cells.push({row:16,column:3,value:5,formula:'=(5)'});
  const command={...input,comment:'  Receipt detail\r\nsecond line  '}; const preview=await f.service.preview(owner,command);
  f.writer.execute.mockResolvedValue({expense:'unchanged',comment:'saved'});
  expect(await f.service.comment(owner,{...command,expectedVersion:preview.expectedVersion})).toEqual({expense:'unchanged',comment:'saved'});
  expect(f.writer.execute).toHaveBeenCalledExactlyOnceWith({spreadsheetId:'synthetic-workbook-id',sheetId:0,row:16,column:3,comment:'5 KZT\nReceipt detail\nsecond line'},'synthetic-write');
  expect(f.writer.execute.mock.calls[0]![0]).not.toHaveProperty('formula');
});
test('empty optional comments create no comment request', async () => {
  const f=fixture(); const preview=await f.service.preview(owner,{...input,comment:' \r\n '});
  await f.service.save(owner,{...input,expectedVersion:preview.expectedVersion}); expect(f.writer.execute.mock.calls[0]![0]).not.toHaveProperty('comment');
});
test.each([{expense:'unknown',comment:'unknown',code:'outcome_unknown'},{expense:'saved',comment:'failed'}] satisfies ExpenseOutcome[])('provider outcome is reported without an automatic expense retry', async outcome => {
  const f=fixture(); const preview=await f.service.preview(owner,input); f.writer.execute.mockResolvedValue(outcome);
  expect(await f.service.save(owner,{...input,expectedVersion:preview.expectedVersion})).toEqual(outcome); expect(f.writer.execute).toHaveBeenCalledOnce();
});
test('native storage inverts the configured base conversion without converting equal currencies twice', async () => {
  const f=fixture(); f.config.years[0]!.months[0]!.categories[0]!.storageCurrency='AED';
  expect((await f.service.preview(owner,{...input,currency:'AED'})).proposedFormula).toBe('=(5)');
  expect((await f.service.preview(owner,input)).proposedFormula).toBe('=(5/$F$39)');
});

test.each(['2020-99-99','2020-00-00','2020-13-01'])('invalid calendar %s returns a safe input error',async date=>{
 const f=fixture(); await expect(f.service.preview(owner,{...input,date})).rejects.toMatchObject({code:'invalid_request'}); expect(f.readCredentials.get).not.toHaveBeenCalled();
});

test('one mapped-range read and one final target read suffice when the FX cell is already in range',async()=>{const f=fixture();await f.service.preview(owner,input);expect(f.reader.readCells).toHaveBeenCalledTimes(2);expect(f.reader.readCells.mock.calls[1]![2]).toEqual({startRow:16,endRow:16,startColumn:3,endColumn:3});});


test('manual mixed expression is previewed intact and saved once as a grouped base with new FX only',async()=>{
 const f=fixture();f.cells.push({row:16,column:3,value:123,formula:'=12+13+14*F4'});
 const command={...input,amount:'5',currency:'AED'};const preview=await f.service.preview(owner,command);
 expect(preview.currentCell).toMatchObject({formula:'=12+13+14*F4',calculatedTotal:123});expect(preview.proposedFormula).toBe('=(12+13+14*F4)+(5*$F$39)');
 await expect(f.service.save(owner,{...command,expectedVersion:preview.expectedVersion})).rejects.toMatchObject({code:'acknowledgment_required'});expect(f.writer.execute).not.toHaveBeenCalled();
 await f.service.save(owner,{...command,expectedVersion:preview.expectedVersion,...acknowledgments});
 expect(f.writer.execute).toHaveBeenCalledExactlyOnceWith({spreadsheetId:'synthetic-workbook-id',sheetId:0,row:16,column:3,formula:'=(12+13+14*F4)+(5*$F$39)'},'synthetic-write');
});

test('a manual edit after preview rejects before write and a fresh preview can safely use the edited formula',async()=>{
 const f=fixture();const current:SheetCell={row:16,column:3,value:25,formula:'=12+13'};f.cells.push(current);
 const old=await f.service.preview(owner,input);current.formula='=12+13+14*F4';current.value=123;
 await expect(f.service.save(owner,{...input,expectedVersion:old.expectedVersion,...acknowledgments})).rejects.toMatchObject({code:'cell_changed'});expect(f.writer.execute).not.toHaveBeenCalled();
 const fresh=await f.service.preview(owner,input);expect(fresh.proposedFormula).toBe('=(12+13+14*F4)+(5)');
 await f.service.save(owner,{...input,expectedVersion:fresh.expectedVersion,...acknowledgments});expect(f.writer.execute.mock.calls[0]![0].formula).toBe('=(12+13+14*F4)+(5)');
});
