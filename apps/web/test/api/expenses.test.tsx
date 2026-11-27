import { expect, test, vi } from 'vitest';
import { createExpenseClient } from '../../src/api/expenses.js';
const draft={date:'2026-11-27',amounts:['5','10','12'],categoryId:'groceries',currency:'AED',comment:'Receipt'};
const version='x'.repeat(43);
const context={date:draft.date,baseCurrency:'KZT',categories:[{id:'groceries',label:'Supermarket',monthlyTotal:{period:'2026-11',status:'available',amount:12500,currency:'KZT'}}],currencies:[{code:'AED'},{code:'KZT'}]};
const preview={date:draft.date,categoryId:'groceries',storageCurrency:'KZT',currentCell:{hasData:false,calculatedTotal:null,formula:null,scalarValue:null},proposedFormula:'=(5*$F$39)+(10*$F$39)+(12*$F$39)',expectedVersion:version,canSave:true,warnings:[]};
const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
test('context uses a bounded date URL and narrows away private provider/mapping fields',async()=>{
 const request=vi.fn<typeof fetch>().mockResolvedValue(reply({...context,spreadsheetId:'private-marker',categories:[{...context.categories[0],column:7}]}));
 expect(await createExpenseClient(request).context(draft.date)).toEqual({state:'ok',value:context});
 expect(request).toHaveBeenCalledExactlyOnceWith('/api/expense-context?date=2026-11-27',{credentials:'same-origin',cache:'no-store',redirect:'error'});
});
test('preview serializes only the closed ordered stack and memory CSRF, without client formulas/resources',async()=>{
 const request=vi.fn<typeof fetch>().mockResolvedValue(reply(preview));
 expect(await createExpenseClient(request).preview(Object.assign({...draft},{formula:'=99',spreadsheetId:'private-marker'}),'memory-csrf')).toEqual({state:'ok',value:preview});
 expect(request).toHaveBeenCalledExactlyOnceWith('/api/expenses/preview',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json','X-CSRF-Token':'memory-csrf'},body:JSON.stringify(draft)});
});
test.each(['save','comment'] as const)('%s uses its own protected endpoint and only the reviewed flags',async method=>{
 const outcome={expense:method==='save'?'saved':'unchanged',comment:'saved'};
 const request=vi.fn<typeof fetch>().mockResolvedValue(reply(outcome,201));const command={...draft,expectedVersion:version,acknowledgeExistingData:true};
 expect(await createExpenseClient(request)[method](command,'memory-csrf')).toEqual({state:'ok',value:outcome});
 const [url,init]=request.mock.calls[0]!;expect(url).toBe(method==='save'?'/api/expenses':'/api/expenses/comments');expect(init?.method).toBe('POST');expect(JSON.parse(init?.body as string)).toEqual(command);expect(request).toHaveBeenCalledOnce();
});
test.each([{...preview,expectedVersion:'bad'},{...preview,date:'2025-01-01'},{...preview,warnings:['invented']},{...preview,canSave:'true'},{...preview,currentCell:{...preview.currentCell,calculatedTotal:0}},{...preview,proposedFormula:'x'.repeat(9000)}])('malformed or stale preview never becomes a writable review',async body=>{
 const request=vi.fn<typeof fetch>().mockResolvedValue(reply(body));expect(await createExpenseClient(request).preview(draft,'csrf')).toEqual({state:'error',code:'unavailable'});
});
test('invalid optional monthly data does not masquerade as zero or break the valid catalog',async()=>{
 const body={...context,categories:[{...context.categories[0],monthlyTotal:{period:'2026-10',status:'available',amount:0,currency:'KZT'}}]};
 const request=vi.fn<typeof fetch>().mockResolvedValue(reply(body));const result=await createExpenseClient(request).context(draft.date);
 expect(result.state).toBe('ok');if(result.state==='ok')expect(result.value.categories[0]?.monthlyTotal).toEqual({period:'2026-11',status:'unavailable'});
});
test('legacy catalog without optional monthly totals is accepted',async()=>{
 const body={...context,categories:[{id:'groceries',label:'Supermarket'}]};const request=vi.fn<typeof fetch>().mockResolvedValue(reply(body));
 expect(await createExpenseClient(request).context(draft.date)).toEqual({state:'ok',value:body});
});
test.each([401,403])('auth status %s is a definite protected rejection',async status=>{
 const request=vi.fn<typeof fetch>().mockResolvedValue(new Response('',{status}));
 expect(await createExpenseClient(request).save({...draft,expectedVersion:version},'csrf')).toEqual({state:'error',code:status===401?'unauthenticated':'access_denied'});
});
test('known conflict is a rejected mutation that requires fresh review',async()=>{
 const request=vi.fn<typeof fetch>().mockResolvedValue(reply({error:{code:'cell_changed'}},409));
 expect(await createExpenseClient(request).save({...draft,expectedVersion:version},'csrf')).toEqual({state:'error',code:'cell_changed'});
});
test.each([new Response('not-json',{status:201}),reply({expense:'saved',comment:'not_requested'},500),reply({error:{code:'invalid_amount'}},500),reply({expense:'saved',comment:'not_requested'},202)])('unconfirmed mutation response remains uncertain and is never replayed',async response=>{
 const request=vi.fn<typeof fetch>().mockResolvedValue(response);
 expect(await createExpenseClient(request).save({...draft,expectedVersion:version},'csrf')).toEqual({state:'uncertain'});expect(request).toHaveBeenCalledOnce();
});
test('network loss has read failure versus mutation uncertainty, with no retry',async()=>{
 const request=vi.fn<typeof fetch>().mockRejectedValue(new Error('private upstream detail'));const client=createExpenseClient(request);
 expect(await client.preview(draft,'csrf')).toEqual({state:'error',code:'unavailable'});
 expect(await client.save({...draft,expectedVersion:version},'csrf')).toEqual({state:'uncertain'});expect(request).toHaveBeenCalledTimes(2);
});
test('confirmed expense/comment failure and explicit unknown delivery remain distinct',async()=>{
 const request=vi.fn<typeof fetch>().mockResolvedValueOnce(reply({expense:'saved',comment:'failed'},201)).mockResolvedValueOnce(reply({expense:'unknown',comment:'unknown'},202));const client=createExpenseClient(request);
 expect(await client.save({...draft,expectedVersion:version},'csrf')).toEqual({state:'ok',value:{expense:'saved',comment:'failed'}});
 expect(await client.save({...draft,expectedVersion:version},'csrf')).toEqual({state:'ok',value:{expense:'unknown',comment:'unknown'}});
});
