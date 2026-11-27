import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from '../../../src/app/App.js';
import { ExpenseScreen } from '../../../src/features/expenses/ExpenseScreen.js';
import { context, deferred, expenseClient, preview, today } from '../../support/expenses.js';
import type { ApiResult, ExpenseOutcome, ExpensePreview } from '../../../src/api/expenses.js';
async function fill(values=['5'],comment='Receipt'){
 await screen.findByRole('option',{name:'Supermarket'});fireEvent.change(screen.getByLabelText('Category'),{target:{value:'groceries'}});fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'AED'}});
 for(const value of values){fireEvent.change(screen.getByLabelText('Amount'),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'Add amount'}));}
 fireEvent.change(screen.getByLabelText('Comment (optional)'),{target:{value:comment}});fireEvent.click(screen.getByRole('button',{name:'Submit'}));
}
function open(client=expenseClient()) { const view=render(<ExpenseScreen client={client} csrfToken="memory-csrf" now={today} />);return {client,...view}; }
test('a single empty-cell Submit waits for preview then saves once without showing confirmation',async()=>{
 const client=expenseClient();const pending=deferred<ApiResult<ExpensePreview>>();client.preview.mockReturnValueOnce(pending.promise);open(client);await fill();expect(client.save).not.toHaveBeenCalled();
 await act(async()=>{pending.resolve({state:'ok',value:preview});});
 await waitFor(()=>expect(client.save).toHaveBeenCalledExactlyOnceWith({date:'2026-11-27',amounts:['5'],categoryId:'groceries',currency:'AED',comment:'Receipt',expectedVersion:preview.expectedVersion},'memory-csrf'));
 expect(screen.queryByRole('button',{name:'Confirm amounts'})).not.toBeInTheDocument();expect(await screen.findByText('Expense saved.')).toBeVisible();
 expect(screen.getByLabelText('Amount')).toHaveValue('');expect(screen.getByLabelText('Comment (optional)')).toHaveValue('');expect(screen.getByLabelText('Category')).toHaveValue('groceries');expect(screen.getByLabelText('Currency')).toHaveValue('AED');
});
test('reviewed stack confirms the displayed flags once and disables Back and Sign out while saving',async()=>{
 const client=expenseClient();client.preview.mockResolvedValue({state:'ok',value:{...preview,currentCell:{...preview.currentCell,hasData:true,calculatedTotal:0},warnings:['existing_data','possible_duplicate','duplicate_check_inconclusive']}});
 const pending=deferred<ApiResult<ExpenseOutcome>>();client.save.mockReturnValueOnce(pending.promise);
 render(<App client={{session:async()=>({state:'allowed',csrfToken:'memory-csrf'}),logout:async()=> 'signed-out'}} expenseClient={client} />);await fill(['5','10']);
 const confirm=await screen.findByRole('button',{name:'Confirm amounts'});fireEvent.click(confirm);fireEvent.click(confirm);
 expect(client.save).toHaveBeenCalledOnce();expect(client.save.mock.calls[0]![0]).toMatchObject({amounts:['5','10'],expectedVersion:preview.expectedVersion,acknowledgeExistingData:true,acknowledgePossibleDuplicate:true,acknowledgeInconclusive:true});
 expect(screen.getByRole('button',{name:'Back'})).toBeDisabled();expect(screen.getByRole('button',{name:'Sign out'})).toBeDisabled();
 await act(async()=>{pending.resolve({state:'ok',value:{expense:'saved',comment:'saved'}});});expect(await screen.findByText('Expense saved. Comment added.')).toBeVisible();
});
test('single existing populated zero still needs an explicit confirmation',async()=>{
 const client=expenseClient();client.preview.mockResolvedValue({state:'ok',value:{...preview,currentCell:{...preview.currentCell,hasData:true,calculatedTotal:0},warnings:['existing_data']}});open(client);await fill();
 expect(await screen.findByRole('button',{name:'Confirm amounts'})).toBeVisible();expect(client.save).not.toHaveBeenCalled();
});
test('blocked preview cannot dispatch even a direct single expense',async()=>{
 const client=expenseClient();client.preview.mockResolvedValue({state:'ok',value:{...preview,canSave:false,blockedReason:'writes_unavailable'}});open(client);await fill();
 expect(await screen.findByRole('button',{name:'Confirm amounts'})).toBeDisabled();expect(client.save).not.toHaveBeenCalled();
});
test('unknown expense outcome keeps the draft, never replays, and forces explicit review even when the next cell appears empty',async()=>{
 const client=expenseClient();client.save.mockResolvedValueOnce({state:'uncertain'});open(client);await fill();
 expect(await screen.findByText(/could not confirm whether the expense was saved/i)).toBeVisible();expect(screen.getByRole('button',{name:'Remove 5 AED'})).toBeVisible();expect(screen.getByLabelText('Comment (optional)')).toHaveValue('Receipt');
 act(()=>{fireEvent.focus(window);});await waitFor(()=>expect(client.context).toHaveBeenCalledTimes(2));expect(client.save).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));expect(await screen.findByRole('button',{name:'Confirm amounts'})).toBeVisible();expect(client.save).toHaveBeenCalledOnce();expect(screen.getByText(/could not confirm whether the expense was saved/i)).toBeVisible();
});
test('a cell_changed response preserves input and requires a new explicit review/version',async()=>{
 const client=expenseClient();client.preview.mockResolvedValueOnce({state:'ok',value:{...preview,currentCell:{...preview.currentCell,hasData:true},warnings:['existing_data']}}).mockResolvedValue({state:'ok',value:{...preview,expectedVersion:'y'.repeat(43)}});
 client.save.mockResolvedValueOnce({state:'error',code:'cell_changed'});open(client);await fill();fireEvent.click(await screen.findByRole('button',{name:'Confirm amounts'}));
 expect(await screen.findByText(/cell changed.*review/i)).toBeVisible();expect(client.preview).toHaveBeenCalledTimes(1);expect(screen.getByRole('button',{name:'Remove 5 AED'})).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));expect(await screen.findByRole('button',{name:'Confirm amounts'})).toBeVisible();expect(client.save).toHaveBeenCalledOnce();fireEvent.click(screen.getByRole('button',{name:'Confirm amounts'}));
 await waitFor(()=>expect(client.save).toHaveBeenCalledTimes(2));expect(client.save.mock.calls[1]![0]).toMatchObject({expectedVersion:'y'.repeat(43)});
});
test('confirmed expense success survives a monthly-total refresh failure without resubmission',async()=>{
 const client=expenseClient();client.context.mockResolvedValueOnce({state:'ok',value:context}).mockResolvedValue({state:'error',code:'sheets_unavailable'});open(client);await fill();
 expect(await screen.findByText('Expense saved.')).toBeVisible();await waitFor(()=>expect(client.context).toHaveBeenCalledTimes(2));expect(screen.getByText(/Monthly total unavailable/i)).toBeVisible();expect(client.save).toHaveBeenCalledOnce();
});
test('a confirmed save refreshes the sheet aggregate instead of adding a converted total in the browser',async()=>{
 const client=expenseClient();client.context.mockResolvedValueOnce({state:'ok',value:context}).mockResolvedValue({state:'ok',value:{...context,categories:[{...context.categories[0]!,monthlyTotal:{period:'2026-11',status:'available',amount:12611,currency:'KZT'}}]}});open(client);await fill();
 expect(await screen.findByText(/November 2026.*12,611/)).toBeVisible();expect(client.save).toHaveBeenCalledOnce();
});
test('saved expense with failed comment clears only the numeric draft and offers a fresh comment-only review',async()=>{
 const client=expenseClient();client.save.mockResolvedValueOnce({state:'ok',value:{expense:'saved',comment:'failed'}});client.preview.mockResolvedValueOnce({state:'ok',value:preview}).mockResolvedValue({state:'ok',value:{...preview,expectedVersion:'y'.repeat(43)}});open(client);await fill();
 expect(await screen.findByText('Expense saved. Comment was not added.')).toBeVisible();expect(screen.getByLabelText('Comment (optional)')).toHaveValue('');expect(screen.queryByRole('button',{name:'Remove 5 AED'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Review comment only'}));expect(await screen.findByRole('button',{name:'Add comment only'})).toBeVisible();expect(client.comment).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Add comment only'}));await waitFor(()=>expect(client.comment).toHaveBeenCalledExactlyOnceWith({date:'2026-11-27',amounts:['5'],categoryId:'groceries',currency:'AED',comment:'Receipt',expectedVersion:'y'.repeat(43)},'memory-csrf'));
 expect(client.save).toHaveBeenCalledOnce();expect(await screen.findByText('Comment added. Expense unchanged.')).toBeVisible();
});
test('unknown comment delivery requires inspection and an explicit fresh comment request, never another expense',async()=>{
 const client=expenseClient();client.save.mockResolvedValueOnce({state:'ok',value:{expense:'saved',comment:'unknown'}});client.comment.mockResolvedValueOnce({state:'uncertain'});open(client);await fill();
 expect(await screen.findByText(/Expense saved.*comment result could not be confirmed/i)).toBeVisible();expect(screen.getByText(/check.*comments.*before/i)).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Review comment only'}));fireEvent.click(await screen.findByRole('button',{name:'Add comment only'}));
 expect(await screen.findByText(/comment result could not be confirmed/i)).toBeVisible();expect(client.comment).toHaveBeenCalledOnce();expect(client.save).toHaveBeenCalledOnce();
});
test('expired preview cannot save or automatically resume, and preserves the in-memory draft',async()=>{
 const client=expenseClient();client.preview.mockResolvedValue({state:'error',code:'unauthenticated'});open(client);await fill();
 expect(await screen.findByRole('link',{name:'Sign in again'})).toBeVisible();expect(screen.getByRole('button',{name:'Remove 5 AED'})).toBeVisible();expect(client.save).not.toHaveBeenCalled();
});
test('an unmounted form cannot turn its late preview into a write',async()=>{
 const client=expenseClient();const pending=deferred<ApiResult<ExpensePreview>>();client.preview.mockReturnValueOnce(pending.promise);const view=open(client);await fill();view.unmount();
 await act(async()=>{pending.resolve({state:'ok',value:preview});});expect(client.save).not.toHaveBeenCalled();
});
test('known not-saved outcome keeps amounts/comment and never reports confirmed success',async()=>{
 const client=expenseClient();client.save.mockResolvedValueOnce({state:'ok',value:{expense:'not_saved',comment:'not_requested'}});open(client);await fill();
 expect(await screen.findByText('Expense was not saved.')).toBeVisible();expect(screen.getByRole('button',{name:'Remove 5 AED'})).toBeVisible();expect(screen.getByLabelText('Comment (optional)')).toHaveValue('Receipt');expect(client.save).toHaveBeenCalledOnce();
});
test('later expenses cannot silently discard an earlier pending comment',async()=>{
 const client=expenseClient();client.save.mockResolvedValue({state:'ok',value:{expense:'saved',comment:'failed'}});open(client);await fill(['5'],'First receipt');
 await screen.findByText('Expense saved. Comment was not added.');await fill(['6'],'Second receipt');
 await waitFor(()=>expect(client.save).toHaveBeenCalledTimes(2));expect(screen.getByText('First receipt')).toBeVisible();expect(screen.getByText('Second receipt')).toBeVisible();expect(screen.getAllByRole('button',{name:'Review comment only'})).toHaveLength(2);
});
test('a pending direct save blocks amount edits and Options, and repeated Enter cannot dispatch twice',async()=>{
 const client=expenseClient();const pending=deferred<ApiResult<ExpenseOutcome>>();client.save.mockReturnValueOnce(pending.promise);open(client);await fill();
 await waitFor(()=>expect(client.save).toHaveBeenCalledOnce());expect(screen.getByLabelText('Amount')).toBeDisabled();expect(screen.getByRole('button',{name:'Options'})).toBeDisabled();expect(screen.getByRole('button',{name:'Change date'})).toBeDisabled();
 fireEvent.keyDown(screen.getByLabelText('Amount'),{key:'Enter'});expect(client.save).toHaveBeenCalledOnce();await act(async()=>{pending.resolve({state:'ok',value:{expense:'saved',comment:'not_requested'}});});
});
