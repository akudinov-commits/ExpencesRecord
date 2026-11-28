import { vi } from 'vitest';
import type { ApiResult, ExpenseClient, ExpenseContext, ExpensePreview } from '../../src/api/expenses.js';
export const today = () => new Date(2026,10,27,12);
export const context: ExpenseContext = {date:'2026-11-27',baseCurrency:'KZT',categories:[{id:'groceries',label:'Supermarket',monthlyTotal:{period:'2026-11',status:'available',amount:12500,currency:'KZT'}},{id:'electronics',label:'Electronics',monthlyTotal:{period:'2026-11',status:'available',amount:0,currency:'KZT'}}],currencies:[{code:'AED'},{code:'KZT'}]};
export const preview: ExpensePreview = {date:context.date,categoryId:'groceries',storageCurrency:'KZT',currentCell:{hasData:false,calculatedTotal:null,formula:null,scalarValue:null},proposedFormula:'=(5*$F$39)',expectedVersion:'x'.repeat(43),canSave:true,warnings:[]};
export function expenseClient() {
  return {context:vi.fn<ExpenseClient['context']>().mockImplementation(async date=>({state:'ok',value:{...structuredClone(context),date,categories:context.categories.map(c=>({...c,monthlyTotal:c.monthlyTotal ? {...c.monthlyTotal,period:date.slice(0,7)} : undefined}))}} as ApiResult<ExpenseContext>)),
    preview:vi.fn<ExpenseClient['preview']>().mockImplementation(async draft=>({state:'ok',value:{...preview,date:draft.date,categoryId:draft.categoryId}})),
    save:vi.fn<ExpenseClient['save']>().mockResolvedValue({state:'ok',value:{expense:'saved',comment:'not_requested'}}),
    comment:vi.fn<ExpenseClient['comment']>().mockResolvedValue({state:'ok',value:{expense:'unchanged',comment:'saved'}})};
}
export function deferred<T>() { let resolve!: (value:T)=>void; const promise=new Promise<T>(done=>{resolve=done;});return {promise,resolve}; }
