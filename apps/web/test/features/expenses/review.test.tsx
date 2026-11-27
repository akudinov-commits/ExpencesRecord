import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { ExpenseReview } from '../../../src/features/expenses/ExpenseReview.js';
import { ExpenseScreen } from '../../../src/features/expenses/ExpenseScreen.js';
import { requiresConfirmation, reviewedMutation } from '../../../src/features/expenses/confirmation.js';
import { deferred, expenseClient, preview, today } from '../../support/expenses.js';
import type { ApiResult, ExpensePreview } from '../../../src/api/expenses.js';
const draft={date:'2026-11-25',amounts:['5','10','12'],categoryId:'groceries',currency:'AED',comment:'Groceries\nIncludes fruit.'};
test('Confirm maps exactly the displayed warning acknowledgments with the fresh version',()=>{
 expect(reviewedMutation(draft,{...preview,warnings:['existing_data','possible_duplicate']})).toEqual({...draft,expectedVersion:preview.expectedVersion,acknowledgeExistingData:true,acknowledgePossibleDuplicate:true});
 expect(reviewedMutation(draft,{...preview,warnings:['duplicate_check_inconclusive']})).toEqual({...draft,expectedVersion:preview.expectedVersion,acknowledgeInconclusive:true});
});
test('only one writable empty warning-free amount can skip confirmation, including a configured past date',()=>{
 expect(requiresConfirmation({...draft,amounts:['5']},preview)).toBe(false);
 expect(requiresConfirmation(draft,preview)).toBe(true);
 expect(requiresConfirmation({...draft,amounts:['5']},{...preview,currentCell:{...preview.currentCell,hasData:true,calculatedTotal:0}})).toBe(true);
 expect(requiresConfirmation({...draft,amounts:['5']},{...preview,warnings:['duplicate_check_inconclusive']})).toBe(true);
 expect(requiresConfirmation({...draft,amounts:['5']},{...preview,canSave:false})).toBe(true);
 expect(requiresConfirmation({...draft,amounts:['5']},preview,true)).toBe(true);
});
test('review displays every amount, weekday, full multiline comment, zero total and formula details safely',()=>{
 const onBack=vi.fn();const onConfirm=vi.fn();
 render(<ExpenseReview review={{draft,preview:{...preview,date:draft.date,currentCell:{hasData:true,calculatedTotal:0,formula:'=0',scalarValue:null},warnings:['existing_data']},revision:1}} now={today()} onBack={onBack} onConfirm={onConfirm} />);
 expect(screen.getByRole('heading',{name:'Review expense'})).toHaveFocus();
 expect(screen.getByText('Past date · Wed, 25 Nov 2026')).toBeVisible();
 expect(screen.getByText(/5 \+ 10 \+ 12 AED/)).toBeVisible();expect(screen.getByText('Groceries Includes fruit.')).toBeVisible();expect(screen.getByText('0.00 KZT')).toBeVisible();
 fireEvent.click(screen.getByText('Formula details'));expect(screen.getByText('=0')).toBeVisible();
 expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(onBack).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Confirm amounts'}));expect(onConfirm).toHaveBeenCalledOnce();
});
test('blocked review cannot confirm and malicious-looking comment/formula content stays plain text',()=>{
 const confirm=vi.fn();render(<ExpenseReview review={{draft:{...draft,comment:'<img src=x onerror=alert(1)>'},preview:{...preview,canSave:false,proposedFormula:null,blockedReason:'unsupported_formula'},revision:1}} now={today()} onBack={()=>{}} onConfirm={confirm} />);
 expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeVisible();expect(document.querySelector('img')).toBeNull();
 const button=screen.getByRole('button',{name:'Confirm amounts'});expect(button).toBeDisabled();fireEvent.click(button);expect(confirm).not.toHaveBeenCalled();
});
test('review omits the comment section when no optional text was supplied',()=>{
 const {comment:_comment,...withoutComment}=draft;void _comment;
 render(<ExpenseReview review={{draft:withoutComment,preview,revision:1}} now={today()} onBack={()=>{}} onConfirm={()=>{}} />);
 expect(screen.queryByRole('heading',{name:'Your comment'})).not.toBeInTheDocument();
});
async function stack(client=expenseClient()){
 render(<ExpenseScreen client={client} csrfToken="csrf" now={today} />);await screen.findByRole('option',{name:'Supermarket'});
 fireEvent.change(screen.getByLabelText('Category'),{target:{value:'groceries'}});fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'AED'}});
 for(const value of ['5','10']){fireEvent.change(screen.getByLabelText('Amount'),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'Add amount'}));}
 return client;
}
test('Back preserves draft and editing requires a new preview version',async()=>{
 const supplied=expenseClient();supplied.preview.mockImplementation(async command=>({state:'ok',value:{...preview,date:command.date,currentCell:{...preview.currentCell,hasData:true,calculatedTotal:0},warnings:['existing_data']}}));
 const client=await stack(supplied);fireEvent.change(screen.getByLabelText('Comment (optional)'),{target:{value:'Keep me'}});fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 expect(await screen.findByRole('heading',{name:'Review expense'})).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'Back'}));
 expect(screen.getByLabelText('Comment (optional)')).toHaveValue('Keep me');expect(screen.getByLabelText('Amount')).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'Remove 5 AED'}));fireEvent.change(screen.getByLabelText('Comment (optional)'),{target:{value:'Changed'}});fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 await waitFor(()=>expect(client.preview).toHaveBeenCalledTimes(2));expect(client.save).not.toHaveBeenCalled();expect(client.preview.mock.calls[1]![0]).toMatchObject({amounts:['10'],comment:'Changed'});
});
test('editing during an in-flight preview discards the obsolete review completely',async()=>{
 const client=expenseClient();const pending=deferred<ApiResult<ExpensePreview>>();client.preview.mockReturnValueOnce(pending.promise);await stack(client);
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'KZT'}});
 await act(async()=>{pending.resolve({state:'ok',value:preview});});expect(screen.queryByRole('heading',{name:'Review expense'})).not.toBeInTheDocument();expect(client.save).not.toHaveBeenCalled();expect(screen.getByLabelText('Currency')).toHaveValue('KZT');
});
test('review shows the backend warnings without inventing duplicate certainty',()=>{
 render(<ExpenseReview review={{draft,preview:{...preview,warnings:['existing_data','possible_duplicate','duplicate_check_inconclusive']},revision:1}} now={today()} onBack={()=>{}} onConfirm={()=>{}} />);
 expect(screen.getByText(/already has expenses/i)).toBeVisible();expect(screen.getByText(/matching amount may already exist/i)).toBeVisible();expect(screen.getByText(/could not reliably check/i)).toBeVisible();expect(screen.queryByText(/was already submitted/i)).not.toBeInTheDocument();
});
