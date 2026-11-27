import { expect, test, vi } from 'vitest';
import { GetExpenseEntryContext } from '../../src/application/expense-entry-context.js';
import { MappingError } from '../../src/application/expense-context.js';
import { SheetsAccessError } from '../../src/application/ports/sheets-access.js';
import type { ExpenseContextResult } from '../../src/application/expense-context.js';
import type { SheetReader } from '../../src/application/ports/workbook.js';
import { parseMappingConfiguration } from '../../src/bootstrap/mapping-config.js';
import { mappingEnvironment } from '../support/mapping.js';
import { writeMappingInput } from '../support/registration.js';
import { createMappingQuery } from '../../src/bootstrap/mapping-runtime.js';
function fixture(){
 const context:ExpenseContextResult={date:'2020-01-15',baseCurrency:'KZT',categories:[{id:'groceries',label:'Synthetic groceries',column:3,storageCurrency:'AED',monthlyTotal:{row:34,currency:'KZT'}}],currencies:[{code:'KZT',rate:null}],target:{spreadsheetId:'synthetic-workbook-id',sheetTitle:'Synthetic January',row:16}};
 const base={execute:vi.fn(async()=>structuredClone(context))};
 const credentials={get:vi.fn(async()=>({subject:'owner',accessToken:'synthetic-read'}))};
 const reader={listSheets:vi.fn<SheetReader['listSheets']>().mockResolvedValue([{title:'Synthetic January',rowCount:65,columnCount:30}]),readCells:vi.fn<SheetReader['readCells']>().mockResolvedValue([{row:34,column:3,value:12500,formula:'=SUM(C2:C32)'}])};
 return {context,base,credentials,reader,query:new GetExpenseEntryContext(base,credentials,reader)};
}
test('monthly binding is optional and explicit while legacy mappings remain compatible',()=>{
 const input=writeMappingInput();Object.assign(input.years[0]!.months[0]!.categories[0]!,{monthlyTotal:{row:34,currency:'KZT'}});
 expect(parseMappingConfiguration(mappingEnvironment(input)).years[0]!.months[0]!.categories[0]!.monthlyTotal).toEqual({row:34,currency:'KZT'});
 expect(parseMappingConfiguration(mappingEnvironment(writeMappingInput())).years[0]!.months[0]!.categories[0]!.monthlyTotal).toBeUndefined();
});
test.each([{row:0,currency:'KZT'},{row:10000001,currency:'KZT'},{row:34,currency:'kzt'},{row:34,currency:'KZT',extra:'private'}])('invalid optional binding %j is rejected',monthlyTotal=>{
 const input=writeMappingInput();Object.assign(input.years[0]!.months[0]!.categories[0]!,{monthlyTotal});
 expect(()=>parseMappingConfiguration(mappingEnvironment(input))).toThrow();
});
test('entry context reads the existing monthly aggregate with its own currency, not daily or input currency',async()=>{
 const f=fixture();const result=await f.query.execute('owner',f.context.date);
 expect(result.monthlyTotals?.groceries).toEqual({period:'2020-01',status:'available',amount:12500,currency:'KZT'});
 expect(f.reader.readCells).toHaveBeenCalledExactlyOnceWith('synthetic-workbook-id','Synthetic January',{startRow:34,endRow:34,startColumn:3,endColumn:3},'synthetic-read');
});
test.each([0,-5])('finite monthly value %s is displayed faithfully',async value=>{
 const f=fixture();f.reader.readCells.mockResolvedValue([{row:34,column:3,value}]);
 expect((await f.query.execute('owner',f.context.date)).monthlyTotals?.groceries).toMatchObject({status:'available',amount:value});
});
test.each([null,'', 'text',Number.NaN,Number.POSITIVE_INFINITY])('non-numeric monthly value %s is unavailable rather than zero',async value=>{
 const f=fixture();f.reader.readCells.mockResolvedValue([{row:34,column:3,value}]);
 expect((await f.query.execute('owner',f.context.date)).monthlyTotals?.groceries).toEqual({period:'2020-01',status:'unavailable'});
});
test('formula errors and out-of-bounds or duplicate returned cells never become totals',async()=>{
 const f=fixture();for(const cells of [[{row:34,column:3,value:0,error:'REF'}],[{row:35,column:3,value:9}],[{row:34,column:3,value:9},{row:34,column:3,value:10}]]){
 f.reader.readCells.mockResolvedValue(cells);expect((await f.query.execute('owner',f.context.date)).monthlyTotals?.groceries?.status).toBe('unavailable');}
});
test('unconfigured monthly totals preserve legacy context and require no extra credentials or reads',async()=>{
 const f=fixture();delete f.context.categories[0]!.monthlyTotal;
 expect(await f.query.execute('owner',f.context.date)).toEqual(f.context);expect(f.credentials.get).not.toHaveBeenCalled();expect(f.reader.readCells).not.toHaveBeenCalled();
});
test('core authorization failure precedes any monthly read; refreshed subject must also match',async()=>{
 const f=fixture();f.base.execute.mockRejectedValueOnce(new MappingError('access_denied'));
 await expect(f.query.execute('intruder',f.context.date)).rejects.toMatchObject({code:'access_denied'});expect(f.reader.readCells).not.toHaveBeenCalled();
 f.credentials.get.mockResolvedValue({subject:'intruder',accessToken:'synthetic-other'});
 await expect(f.query.execute('owner',f.context.date)).rejects.toMatchObject({code:'access_denied'});
});
test('optional upstream unavailability leaves entry context usable without guessing a total',async()=>{
 const f=fixture();f.reader.readCells.mockRejectedValue(new SheetsAccessError('unavailable'));
 expect((await f.query.execute('owner',f.context.date)).monthlyTotals?.groceries?.status).toBe('unavailable');
});
test('same-row category aggregates are read together with a bounded rectangle',async()=>{
 const f=fixture();f.context.categories.push({id:'transport',label:'Synthetic transport',column:4,monthlyTotal:{row:34,currency:'AED'}});
 f.reader.readCells.mockResolvedValue([{row:34,column:3,value:9},{row:34,column:4,value:2}]);
 const result=await f.query.execute('owner',f.context.date);
 expect(result.monthlyTotals?.transport).toMatchObject({status:'available',amount:2,currency:'AED'});
 expect(f.reader.readCells).toHaveBeenCalledTimes(1);expect(f.reader.readCells.mock.calls[0]![2]).toEqual({startRow:34,endRow:34,startColumn:3,endColumn:4});
});
test('out-of-sheet summary references are unavailable and never dispatched',async()=>{
 const f=fixture();f.context.categories[0]!.monthlyTotal!.row=1000;
 expect((await f.query.execute('owner',f.context.date)).monthlyTotals?.groceries?.status).toBe('unavailable');expect(f.reader.readCells).not.toHaveBeenCalled();
});
test('reconnect and unexpected implementation errors are not silently converted into zero or hidden',async()=>{
 const f=fixture();f.reader.readCells.mockRejectedValueOnce(new SheetsAccessError('reconnect_required'));
 await expect(f.query.execute('owner',f.context.date)).rejects.toMatchObject({code:'reconnect_required'});
 f.reader.readCells.mockRejectedValueOnce(new Error('implementation-failure'));
 await expect(f.query.execute('owner',f.context.date)).rejects.toThrow('implementation-failure');
});
test('the composition root wires optional summaries only into the entry read path',async()=>{
 const input=writeMappingInput();Object.assign(input.years[0]!.months[0]!.categories[0]!,{monthlyTotal:{row:34,currency:'KZT'}});
 const cells=[{row:1,column:3,value:'Synthetic groceries'},{row:16,column:1,value:(Date.UTC(2020,0,15)-Date.UTC(1899,11,30))/86400000},{row:39,column:6,value:7},{row:34,column:3,value:12}];
 const f=fixture();f.reader.readCells.mockImplementation(async(_id,_title,b)=>cells.filter(c=>c.row>=b.startRow&&c.row<=b.endRow&&c.column>=b.startColumn&&c.column<=b.endColumn));
 const query=createMappingQuery(mappingEnvironment(input),{allowedSubject:'owner',clientId:'synthetic-client',clientSecret:'synthetic-secret'},{reader:f.reader,credentials:f.credentials});
 expect((await query.execute('owner','2020-01-15')).monthlyTotals?.groceries).toMatchObject({status:'available',amount:12});
});
