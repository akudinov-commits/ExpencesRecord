import { expect, test, vi } from 'vitest';
import { GetExpenseEntryContext } from '../../src/application/expense-entry-context.js';
import { SheetsAccessError } from '../../src/application/ports/sheets-access.js';
import type { ExpenseContextResult } from '../../src/application/expense-context.js';
import type { SheetReader, SheetCell } from '../../src/application/ports/workbook.js';
function fixture(cells:SheetCell[]=[]){
 const context:ExpenseContextResult={date:'2026-11-28',baseCurrency:'KZT',categories:[{id:'groceries',label:'Supermarket',column:3,storageCurrency:'AED',monthlyTotal:{row:34,currency:'KZT'}},{id:'transport',label:'Transport',column:4}],currencies:[{code:'KZT',rate:null}],target:{spreadsheetId:'synthetic-workbook-id',sheetTitle:'Synthetic November',row:16}};
 const base={execute:vi.fn(async()=>structuredClone(context))};const credentials={get:vi.fn(async()=>({subject:'owner',accessToken:'synthetic-read'}))};
 const reader={listSheets:vi.fn<SheetReader['listSheets']>().mockResolvedValue([{title:'Synthetic November',rowCount:100,columnCount:30}]),readCells:vi.fn<SheetReader['readCells']>().mockImplementation(async(_id,_title,b)=>cells.filter(c=>c.row>=b.startRow&&c.row<=b.endRow&&c.column>=b.startColumn&&c.column<=b.endColumn))};
 return {context,base,reader,query:new GetExpenseEntryContext(base,credentials,reader)};
}
test('selected-row amount/formula uses category storage currency and known empty stays distinct',async()=>{
 const f=fixture([{row:16,column:3,value:30,formula:'=(10)+(20)'},{row:34,column:3,value:12500}]);const result=await f.query.execute('owner',f.context.date);
 expect(result).toMatchObject({recordedExpenses:{groceries:{date:f.context.date,status:'recorded',amount:30,currency:'AED',formula:'=(10)+(20)'},transport:{date:f.context.date,status:'empty'}},monthlyTotals:{groceries:{amount:12500,currency:'KZT'}}});
 expect(f.reader.readCells).toHaveBeenCalledWith('synthetic-workbook-id','Synthetic November',{startRow:16,endRow:16,startColumn:3,endColumn:4},'synthetic-read');
});
test.each([{value:0,amount:0},{value:0,formula:'=1-1',amount:0},{value:123,amount:123},{value:0,formula:'=1/0',error:'DIVIDE_BY_ZERO',amount:null},{value:'manual text',amount:null}])('recorded zero/scalar/formula/error is truthful: %j',async({amount,...cell})=>{
 const f=fixture([{row:16,column:3,...cell}]);expect(await f.query.execute('owner',f.context.date)).toMatchObject({recordedExpenses:{groceries:{status:'recorded',amount,formula:cell.formula??null,currency:'AED'}}});
});
test('daily observation does not require a configured monthly total',async()=>{
 const f=fixture([{row:16,column:4,value:5}]);delete f.context.categories[0]!.monthlyTotal;expect(await f.query.execute('owner',f.context.date)).toMatchObject({recordedExpenses:{transport:{status:'recorded',amount:5,currency:'KZT',formula:null}}});
});
test.each([[{row:17,column:3,value:5}],[{row:16,column:3,value:5},{row:16,column:3,value:6}],[{row:16,column:3,value:5,formula:'='+ '1'.repeat(8000)}]].map(cells=>({cells})))('invalid selected-row observations remain unavailable',async({cells})=>{
 const f=fixture();f.reader.readCells.mockResolvedValue(cells);expect(await f.query.execute('owner',f.context.date)).toMatchObject({recordedExpenses:{groceries:{date:f.context.date,status:'unavailable'}}});
});
test('daily provider unavailability leaves monthly read usable and never becomes empty',async()=>{
 const f=fixture([{row:34,column:3,value:12500}]);f.reader.readCells.mockRejectedValueOnce(new SheetsAccessError('unavailable'));expect(await f.query.execute('owner',f.context.date)).toMatchObject({recordedExpenses:{groceries:{status:'unavailable'}},monthlyTotals:{groceries:{status:'available',amount:12500}}});
});
test('daily and monthly enrichment share one bounded read budget',async()=>{
 const f=fixture();f.context.categories[1]!.column=18278;f.context.categories[1]!.monthlyTotal={row:34,currency:'KZT'};f.reader.listSheets.mockResolvedValue([{title:'Synthetic November',rowCount:100,columnCount:18278}]);
 expect(await f.query.execute('owner',f.context.date)).toMatchObject({recordedExpenses:{groceries:{status:'empty'}},monthlyTotals:{groceries:{status:'unavailable'}}});expect(f.reader.readCells).toHaveBeenCalledTimes(1);
});
