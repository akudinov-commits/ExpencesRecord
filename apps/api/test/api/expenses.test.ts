import type { FastifyInstance } from 'fastify';
import { afterEach, expect, test, vi } from 'vitest';
import { createApp } from '../../src/bootstrap/create-app.js';
import { ExpenseError } from '../../src/application/ports/expenses.js';
import type { ExpenseOperations, ExpensePreview } from '../../src/application/ports/expenses.js';
import { MappingError } from '../../src/application/expense-context.js';
import { SheetsAccessError } from '../../src/application/ports/sheets-access.js';
import { authFixture } from '../support/auth.js';
const opened: FastifyInstance[]=[]; afterEach(async()=>{await Promise.all(opened.splice(0).map(app=>app.close()));});
const input={date:'2020-01-15',amount:'5',categoryId:'groceries',currency:'KZT'};
test('the protected transport delegates the new ordered stack without applying formula policy',async()=>{
 const f=fixture();const body={date:'2020-01-15',amounts:['5','10','12'],categoryId:'groceries',currency:'AED'};
 const response=await f.app.inject({method:'POST',url:'/api/expenses/preview',headers,payload:body});
 expect(response.statusCode).toBe(200);expect(f.operations.preview).toHaveBeenCalledExactlyOnceWith(f.session.subject,body);
});
const preview={...input,storageCurrency:'KZT',currentCell:{hasData:true,calculatedTotal:5,formula:'=(5)',scalarValue:null},proposedFormula:'=(5)+(5)',expectedVersion:'x'.repeat(43),canSave:true,warnings:['existing_data','possible_duplicate']} satisfies ExpensePreview;
const headers={'content-type':'application/json',host:'localhost:5173',cookie:'expences_session_dev=synthetic-session',origin:'http://localhost:5173','x-csrf-token':'bound-csrf'};
function fixture(){
 const auth=authFixture(); const operations={preview:vi.fn<ExpenseOperations['preview']>().mockResolvedValue(preview),save:vi.fn<ExpenseOperations['save']>().mockResolvedValue({expense:'saved',comment:'not_requested'}),comment:vi.fn<ExpenseOperations['comment']>().mockResolvedValue({expense:'unchanged',comment:'saved'})};
 const app=createApp({logger:false},{service:auth.service,appOrigin:headers.origin,secureCookies:false},undefined,operations); opened.push(app); return {...auth,app,operations};
}
test.each(['/api/expenses/preview','/api/expenses','/api/expenses/comments'])('%s is private and exact-Origin/CSRF protected before delegation',async url=>{
 const f=fixture(); expect((await f.app.inject({method:'POST',url,payload:input})).statusCode).toBe(401);
 expect((await f.app.inject({method:'POST',url,payload:input,headers:{...headers,origin:'https://attacker.invalid'}})).statusCode).toBe(403);
 expect((await f.app.inject({method:'POST',url,payload:input,headers:{...headers,'x-csrf-token':'wrong'}})).statusCode).toBe(403);
 for(const op of Object.values(f.operations))expect(op).not.toHaveBeenCalled();
});
test.each([['/api/expenses/preview','preview',200],['/api/expenses','save',201],['/api/expenses/comments','comment',201]] as const)('%s hands off verified owner and maps its response',async(url,method,status)=>{
 const f=fixture(); const response=await f.app.inject({method:'POST',url,headers,payload:input}); expect(response.statusCode).toBe(status); expect(f.operations[method]).toHaveBeenCalledExactlyOnceWith(f.session.subject,input);
 expect(response.headers['cache-control']).toBe('no-store'); expect(response.headers['referrer-policy']).toBe('no-referrer');
});
test.each([{...input,spreadsheetId:'private-marker'},{...input,formula:'=99'},null,[],{...input,range:'A1'}])('transport does not delegate invalid envelopes',async payload=>{
 const f=fixture(); const response=await f.app.inject({method:'POST',url:'/api/expenses/preview',headers,payload:JSON.stringify(payload)}); expect(response.statusCode).toBe(400); expect(f.operations.preview).not.toHaveBeenCalled();
});
test('query parameters cannot choose resources and oversized body is bounded',async()=>{
 const f=fixture(); expect((await f.app.inject({method:'POST',url:'/api/expenses/preview?range=A1',headers,payload:input})).statusCode).toBe(400);
 expect((await f.app.inject({method:'POST',url:'/api/expenses',headers,payload:{...input,comment:'x'.repeat(9000)}})).statusCode).toBe(413); expect(f.operations.preview).not.toHaveBeenCalled(); expect(f.operations.save).not.toHaveBeenCalled();
});
test.each([['invalid_amount',400],['invalid_comment',400],['cell_changed',409],['acknowledgment_required',409],['unsupported_formula',409],['writes_unavailable',503],['access_denied',403]] as const)('safe application error %s maps to %s',async(code,status)=>{
 const f=fixture(); f.operations.save.mockRejectedValue(new ExpenseError(code)); const response=await f.app.inject({method:'POST',url:'/api/expenses',headers,payload:input}); expect(response.statusCode).toBe(status);expect(response.json()).toEqual({error:{code}});
});
test.each([new MappingError('mapping_unavailable'),new SheetsAccessError('reconnect_required')])('known read failures remain safe and explicit',async error=>{
 const f=fixture();f.operations.preview.mockRejectedValue(error);const response=await f.app.inject({method:'POST',url:'/api/expenses/preview',headers,payload:input});expect(response.statusCode).toBe(503);expect(response.json()).toEqual({error:{code:error.code}});
});
test('post-dispatch uncertainty is 202 and confirmed expense with comment failure stays 201',async()=>{
 const f=fixture();f.operations.save.mockResolvedValue({expense:'unknown',comment:'unknown',code:'outcome_unknown'});const options={method:'POST' as const,url:'/api/expenses',headers,payload:input};
 expect((await f.app.inject(options)).statusCode).toBe(202);f.operations.save.mockResolvedValue({expense:'saved',comment:'failed'});const response=await f.app.inject(options);expect(response.statusCode).toBe(201);expect(response.json()).toEqual({expense:'saved',comment:'failed'});
});
test('preview serializes only the approved selected-cell fields',async()=>{
 const f=fixture();f.operations.preview.mockResolvedValue(Object.assign({},preview,{spreadsheetId:'private-marker',accessToken:'private-token'}));const response=await f.app.inject({method:'POST',url:'/api/expenses/preview',headers,payload:input});expect(response.statusCode).toBe(200);expect(response.body).not.toMatch(/private-|amount|currency/);expect(response.json().currentCell.formula).toBe('=(5)');
});
test('unexpected errors reveal no provider or financial detail',async()=>{
 const f=fixture();f.operations.save.mockRejectedValue(new Error('private-marker'));const response=await f.app.inject({method:'POST',url:'/api/expenses',headers,payload:input});expect(response.statusCode).toBe(500);expect(response.body).not.toContain('private-marker');expect(response.headers['cache-control']).toBe('no-store');
});
