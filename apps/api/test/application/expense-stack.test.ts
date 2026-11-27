import { createHash } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { ExpenseRegistration } from '../../src/application/expense-registration.js';
import { appendExpenses } from '../../src/application/expense-formula.js';
import { parseMappingConfiguration } from '../../src/bootstrap/mapping-config.js';
import type { SheetCell, SheetReader } from '../../src/application/ports/workbook.js';
import type { ExpenseWriter } from '../../src/application/ports/expenses.js';
import { mappingEnvironment } from '../support/mapping.js';
import { writeMappingInput } from '../support/registration.js';
const owner='synthetic-owner';
const input={date:'2020-01-15',amounts:['5','10','12'],categoryId:'groceries',currency:'AED'};
const ack={acknowledgeExistingData:true,acknowledgePossibleDuplicate:true,acknowledgeInconclusive:true};
function fixture(){
 const config=parseMappingConfiguration(mappingEnvironment(writeMappingInput()));
 const cells:SheetCell[]=[{row:1,column:3,value:'Synthetic groceries'},{row:16,column:1,value:(Date.UTC(2020,0,15)-Date.UTC(1899,11,30))/86400000},{row:39,column:6,value:7}];
 const read={get:vi.fn(async()=>({subject:owner,accessToken:'synthetic-read'}))};
 const write={get:vi.fn(async()=>({subject:owner,accessToken:'synthetic-write'}))};
 const reader:SheetReader={listSheets:async()=>[{title:'Synthetic January',sheetId:0,rowCount:65,columnCount:30}],readCells:async(_id,_title,b)=>structuredClone(cells.filter(c=>c.row>=b.startRow&&c.row<=b.endRow&&c.column>=b.startColumn&&c.column<=b.endColumn))};
 const writer={execute:vi.fn<ExpenseWriter['execute']>().mockResolvedValue({expense:'saved',comment:'not_requested'})};
 const service=new ExpenseRegistration({allowedSubject:owner,writesEnabled:true},{mapping:{get:()=>config},readCredentials:read,writeCredentials:write,reader,writer,fingerprint:{of:v=>createHash('sha256').update(JSON.stringify(v)).digest('base64url')}});
 return {service,cells,reader,writer,read,write,config};
}
test('stack formula preserves a manual base once and appends each configured FX term',()=>{
 expect(appendExpenses({row:16,column:3,value:123,formula:'=12+13+14*F4'},['5*$F$39','10*$F$39','12*$F$39'],'Synthetic January').formula).toBe('=(12+13+14*F4)+(5*$F$39)+(10*$F$39)+(12*$F$39)');
});
test('intentional repeated stack terms are compared against old content, not each other',()=>{
 expect(appendExpenses(undefined,['5','5'],'Synthetic January')).toEqual({formula:'=(5)+(5)',duplicate:'none'});
});
test('a same-cell stack is planned and dispatched exactly once with one associated comment',async()=>{
 const f=fixture();f.cells.push({row:16,column:3,value:123,formula:'=12+13+14*F4'});
 const command={...input,comment:'Receipt'};const preview=await f.service.preview(owner,command);
 expect(preview.proposedFormula).toBe('=(12+13+14*F4)+(5*$F$39)+(10*$F$39)+(12*$F$39)');
 await f.service.save(owner,{...command,expectedVersion:preview.expectedVersion,...ack});
 expect(f.writer.execute).toHaveBeenCalledExactlyOnceWith({spreadsheetId:'synthetic-workbook-id',sheetId:0,row:16,column:3,formula:preview.proposedFormula,comment:'5 + 10 + 12 AED\nReceipt'},'synthetic-write');
});
test('ordered normalized stack and comment bind the review version',async()=>{
 const f=fixture();const preview=await f.service.preview(owner,input);
 const reordered={...input,amounts:['12','10','5']};
 await expect(f.service.save(owner,{...reordered,expectedVersion:preview.expectedVersion,...ack})).rejects.toMatchObject({code:'cell_changed'});
 expect(f.writer.execute).not.toHaveBeenCalled();
 expect((await f.service.preview(owner,{...input,amounts:['005.00','10.0','12']})).expectedVersion).toBe(preview.expectedVersion);
});
test('one stack comment-only request never includes a formula',async()=>{
 const f=fixture();const command={...input,comment:'Receipt'};const preview=await f.service.preview(owner,command);
 await f.service.comment(owner,{...command,expectedVersion:preview.expectedVersion});
 expect(f.writer.execute.mock.calls[0]![0]).toEqual({spreadsheetId:'synthetic-workbook-id',sheetId:0,row:16,column:3,comment:'5 + 10 + 12 AED\nReceipt'});
});
test.each([[],['0'],['5','=10'],Array(21).fill('1'),null,5,'5'])('invalid stack %j rejects before credentials or dispatch',async amounts=>{
 const f=fixture();await expect(f.service.preview(owner,{...input,amounts})).rejects.toMatchObject({code:expect.stringMatching(/invalid_request|invalid_amount/)});
 expect(f.read.get).not.toHaveBeenCalled();expect(f.writer.execute).not.toHaveBeenCalled();
});
test('scalar and list cannot be supplied together',async()=>{
 const f=fixture();await expect(f.service.preview(owner,{...input,amount:'5'})).rejects.toMatchObject({code:'invalid_request'});expect(f.read.get).not.toHaveBeenCalled();
});
test('existing duplicate and inconclusive warnings still apply to the whole stack',async()=>{
 const f=fixture();f.cells.push({row:16,column:3,value:5,formula:'=(5)'});
 const command={...input,currency:'KZT'};const preview=await f.service.preview(owner,command);
 expect(preview.warnings).toEqual(['existing_data','possible_duplicate']);
 await expect(f.service.save(owner,{...command,expectedVersion:preview.expectedVersion})).rejects.toMatchObject({code:'acknowledgment_required'});expect(f.writer.execute).not.toHaveBeenCalled();
});
test('a supported-size twenty-term stack stays flat and executes once',async()=>{
 const f=fixture();const command={...input,amounts:Array(20).fill('1'),currency:'KZT'};const preview=await f.service.preview(owner,command);
 expect(preview.proposedFormula).toBe('='+Array(20).fill('(1)').join('+'));
 await f.service.save(owner,{...command,expectedVersion:preview.expectedVersion});expect(f.writer.execute).toHaveBeenCalledOnce();
});
test('sparse in-process amount lists reject before any credential access',async()=>{
 const f=fixture();const amounts=new Array<string>(2);amounts[1]='5';
 await expect(f.service.preview(owner,{...input,amounts})).rejects.toMatchObject({code:'invalid_amount'});expect(f.read.get).not.toHaveBeenCalled();
});
test('monthly display values do not affect expense snapshot versions or add monthly reads',async()=>{
 const f=fixture();f.config.years[0]!.months[0]!.categories[0]!.monthlyTotal={row:34,currency:'KZT'};
 const cell={row:34,column:3,value:100};f.cells.push(cell);const before=await f.service.preview(owner,input);cell.value=200;
 expect((await f.service.preview(owner,input)).expectedVersion).toBe(before.expectedVersion);
});
test('formula/parser overflow blocks the whole stack before a writer can see a partial plan',async()=>{
 const f=fixture();f.cells.push({row:16,column:3,value:1,formula:'='+Array(1024).fill('(1)').join('+')});
 const preview=await f.service.preview(owner,{...input,amounts:Array(20).fill('1')});expect(preview.canSave).toBe(false);
 await expect(f.service.save(owner,{...input,amounts:Array(20).fill('1'),expectedVersion:preview.expectedVersion,...ack})).rejects.toMatchObject({code:'unsupported_formula'});expect(f.writer.execute).not.toHaveBeenCalled();
});
