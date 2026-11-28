import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ExpenseScreen } from '../../../src/features/expenses/ExpenseScreen.js';
import { context, deferred, expenseClient, preview, today } from '../../support/expenses.js';
import type { ApiResult, ExpenseContext, RecordedExpense } from '../../../src/api/expenses.js';
function open(value:RecordedExpense={date:context.date,status:'recorded',amount:30,currency:'AED',formula:'=(10)+(20)'}){
 const client=expenseClient();client.context.mockImplementation(async date=>({state:'ok',value:{...structuredClone(context),date,categories:context.categories.map((category,index)=>({...category,recordedExpense:index===0?{...value,date}:{date,status:'empty'}}))}}));
 render(<ExpenseScreen client={client} csrfToken="memory-csrf" now={today}/>);return client;
}
async function choose(){await screen.findByRole('option',{name:'Supermarket'});fireEvent.change(screen.getByLabelText('Category'),{target:{value:'groceries'}});}
test('small daily note precedes monthly total and formula is collapsed until expanded',async()=>{
 const client=open();await choose();const line=screen.getByText('Already recorded: 30.00 AED');const monthly=screen.getByText(/November 2026.*12,500/);expect(line.compareDocumentPosition(monthly)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 const formula=screen.getByText('=(10)+(20)');expect(formula).not.toBeVisible();fireEvent.click(screen.getByText('Formula'));expect(formula).toBeVisible();expect(client.preview).not.toHaveBeenCalled();expect(client.save).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Category'),{target:{value:'electronics'}});expect(screen.queryByText(/Already recorded/)).not.toBeInTheDocument();expect(screen.queryByText('=(10)+(20)')).not.toBeInTheDocument();
});
test.each([{date:context.date,status:'recorded',amount:0,currency:'KZT',formula:null},{date:context.date,status:'recorded',amount:null,currency:'KZT',formula:'=1/0'},{date:context.date,status:'unavailable'}] satisfies RecordedExpense[])('zero and unavailable daily totals remain truthful: %j',async value=>{
 open(value);await choose();expect(screen.getByText(value.status==='unavailable'?'Recorded amount unavailable.':value.amount===null?'Already recorded: total unavailable':'Already recorded: 0.00 KZT')).toBeVisible();
 if(value.status==='recorded'&&value.formula===null)expect(screen.queryByText('Formula')).not.toBeInTheDocument();
});
test('late date response cannot restore another dates amount/formula',async()=>{
 const client=open();const stale=deferred<ApiResult<ExpenseContext>>();client.context.mockReturnValueOnce(stale.promise);await choose();
 fireEvent.change(screen.getByLabelText('Date'),{target:{value:'2026-10-15'}});fireEvent.change(screen.getByLabelText('Date'),{target:{value:'2026-10-16'}});
 await waitFor(()=>expect(screen.getByText('Already recorded: 30.00 AED')).toBeVisible());
 await act(async()=>{stale.resolve({state:'ok',value:{...context,date:'2026-10-15',categories:[{...context.categories[0]!,recordedExpense:{date:'2026-10-15',status:'recorded',amount:999,currency:'KZT',formula:'=999'}}]}});});expect(screen.queryByText(/999/)).not.toBeInTheDocument();
});
test('known save refreshes daily observation from context instead of calculating the amount locally',async()=>{
 const client=open();await choose();fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'AED'}});fireEvent.change(screen.getByLabelText('Amount'),{target:{value:'5'}});
 client.preview.mockResolvedValue({state:'ok',value:{...preview,currentCell:{hasData:true,calculatedTotal:30,formula:'=(10)+(20)',scalarValue:null},warnings:['existing_data']}});
 client.context.mockResolvedValue({state:'ok',value:{...context,categories:[{...context.categories[0]!,recordedExpense:{date:context.date,status:'recorded',amount:65,currency:'AED',formula:'=(10)+(20)+(5*7)'}}]}});
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));await screen.findByRole('button',{name:'Confirm amounts'});fireEvent.click(screen.getByRole('button',{name:'Confirm amounts'}));expect(await screen.findByText('Already recorded: 65.00 AED')).toBeVisible();expect(client.save).toHaveBeenCalledOnce();
});
test('formula markup is shown as text, never executed as HTML',async()=>{
 open({date:context.date,status:'recorded',amount:5,currency:'KZT',formula:'="<img src=x onerror=alert(1)>"'});await choose();fireEvent.click(screen.getByText('Formula'));expect(screen.getByText('="<img src=x onerror=alert(1)>"')).toBeVisible();expect(document.querySelector('img')).toBeNull();
});
