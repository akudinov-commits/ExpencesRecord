import { expect, test, vi } from 'vitest';
import { GoogleExpenseWriter } from '../../src/infrastructure/expense-writer.js';
import { expenseFingerprint } from '../../src/infrastructure/expense-fingerprint.js';
import type { ExpenseWritePlan } from '../../src/application/ports/expenses.js';
const plan: ExpenseWritePlan = { spreadsheetId:'synthetic-workbook-id',sheetId:0,row:17,column:14,formula:'=(5)+(6)' };
function fixture(body: unknown={spreadsheetId:plan.spreadsheetId,replies:[{}]},status=200) {
  const request=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body),{status}));
  return {request,writer:new GoogleExpenseWriter(request)};
}
test('a formula uses one precise value-only batch request and no formatting, notes or metadata',async()=>{
  const f=fixture(); expect(await f.writer.execute(plan,'synthetic-access')).toEqual({expense:'saved',comment:'not_requested'});
  expect(f.request).toHaveBeenCalledOnce(); const [url,options]=f.request.mock.calls[0]!;
  expect(url).toBe('https://sheets.googleapis.com/v4/spreadsheets/synthetic-workbook-id:batchUpdate');
  expect(options).toMatchObject({method:'POST',redirect:'error',headers:{Authorization:'Bearer synthetic-access','Content-Type':'application/json'}}); expect(options?.signal).toBeInstanceOf(AbortSignal);
  expect(JSON.parse(String(options?.body))).toEqual({requests:[{updateCells:{start:{sheetId:0,rowIndex:16,columnIndex:13},rows:[{values:[{userEnteredValue:{formulaValue:plan.formula}}]}],fields:'userEnteredValue'}}]});
});
test.each([['ALL_SAVED','saved'],['ALL_FAILED_UNKNOWN_REASON','failed'],['COMMENT_UPDATE_STATE_UNSPECIFIED','unknown'],['NO_UPDATES_REQUESTED','unknown'],[undefined,'unknown']] as const)('comment state %s is independent of a saved expense',async(state,expected)=>{
 const f=fixture({spreadsheetId:plan.spreadsheetId,replies:[{},{insertComment:{commentId:'synthetic'}}],...(state?{commentUpdateState:state}:{})});
 expect(await f.writer.execute({...plan,comment:'5 KZT\nSynthetic comment'},'synthetic-access')).toEqual({expense:'saved',comment:expected});
 expect(JSON.parse(String(f.request.mock.calls[0]![1]?.body)).requests[1]).toEqual({insertComment:{coordinate:{sheetId:0,rowIndex:16,columnIndex:13},content:'5 KZT\nSynthetic comment'}});
});
test('a comment-only action has no cell mutation and does not report an expense as saved',async()=>{
 const f=fixture({spreadsheetId:plan.spreadsheetId,replies:[{insertComment:{commentId:'synthetic'}}],commentUpdateState:'ALL_SAVED'});
 const target={spreadsheetId:plan.spreadsheetId,sheetId:plan.sheetId,row:plan.row,column:plan.column}; expect(await f.writer.execute({...target,comment:'Synthetic comment'},'synthetic-access')).toEqual({expense:'unchanged',comment:'saved'});
 const body=JSON.parse(String(f.request.mock.calls[0]![1]?.body)); expect(body.requests).toHaveLength(1); expect(body.requests[0]).toHaveProperty('insertComment'); expect(JSON.stringify(body)).not.toMatch(/updateCells|formulaValue|note|metadata/);
});
test.each([400,401,403,404,429])('known rejection %s is not retried and exposes no provider body',async status=>{
 const f=fixture({error:{message:'private-marker'}},status); const outcome=await f.writer.execute({...plan,comment:'text'},'synthetic-access');
 expect(outcome).toMatchObject({expense:'not_saved',comment:'failed'}); expect(JSON.stringify(outcome)).not.toContain('private-marker'); expect(f.request).toHaveBeenCalledOnce();
});
test.each([500,502,503,307])('unconfirmed status %s is unknown and never retried',async status=>{
 const f=fixture({},status); expect(await f.writer.execute({...plan,comment:'text'},'synthetic-access')).toMatchObject({expense:'unknown',comment:'unknown',code:'outcome_unknown'}); expect(f.request).toHaveBeenCalledOnce();
});
test.each(['network','abort','invalid-json','wrong-id','wrong-replies','large-body'])('%s after dispatch is unknown, not failed',async state=>{
 const f=fixture();
 if(state==='network'||state==='abort')f.request.mockRejectedValue(new Error('private-transport-marker'));
 if(state==='invalid-json')f.request.mockResolvedValue(new Response('{'));
 if(state==='wrong-id')f.request.mockResolvedValue(new Response(JSON.stringify({spreadsheetId:'other',replies:[{}]})));
 if(state==='wrong-replies')f.request.mockResolvedValue(new Response(JSON.stringify({spreadsheetId:plan.spreadsheetId,replies:[]})));
 if(state==='large-body')f.request.mockResolvedValue(new Response('x'.repeat(65537)));
 expect(await f.writer.execute({...plan,comment:'text'},'synthetic-access')).toMatchObject({expense:'unknown',comment:'unknown',code:'outcome_unknown'}); expect(f.request).toHaveBeenCalledOnce();
});
test.each([{...plan,sheetId:-1},{...plan,row:0},{...plan,column:18279},{...plan,spreadsheetId:'https://attacker.invalid'},{...plan,formula:'x'},{...plan,formula:'='+ '1'.repeat(8001)},{...plan,comment:'x'.repeat(2049)}])('mechanically invalid plan never dispatches',async invalid=>{
 const f=fixture(); expect(await f.writer.execute(invalid,'synthetic-access')).toMatchObject({expense:'not_saved'}); expect(f.request).not.toHaveBeenCalled();
});
test('empty plan or invalid credential never dispatches',async()=>{
 const f=fixture(); const empty={spreadsheetId:plan.spreadsheetId,sheetId:plan.sheetId,row:plan.row,column:plan.column};
 await f.writer.execute(empty,'synthetic-access'); await f.writer.execute(plan,'bad token'); expect(f.request).not.toHaveBeenCalled();
});
test('fingerprint is deterministic, bounded, opaque and changes for a changed snapshot',()=>{
 const snapshot=['synthetic-financial-marker',5]; const hash=expenseFingerprint.of(snapshot);
 expect(hash).toMatch(/^[A-Za-z0-9_-]{43}$/); expect(expenseFingerprint.of(structuredClone(snapshot))).toBe(hash); expect(expenseFingerprint.of(['synthetic-financial-marker',6])).not.toBe(hash); expect(hash).not.toContain('synthetic-financial-marker');
});
