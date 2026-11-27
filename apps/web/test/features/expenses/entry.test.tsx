import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ExpenseScreen } from '../../../src/features/expenses/ExpenseScreen.js';
import { createAppearanceSetting } from '../../../src/features/options/appearance.js';
import { context, deferred, expenseClient, today } from '../../support/expenses.js';
import type { ApiResult, ExpenseContext } from '../../../src/api/expenses.js';
afterEach(()=>{delete document.documentElement.dataset.theme;});
function open(client=expenseClient(),now=today,storage={getItem:vi.fn().mockReturnValue('light'),setItem:vi.fn()}){
 render(<ExpenseScreen client={client} csrfToken="memory-csrf" now={now} appearanceSetting={createAppearanceSetting(storage,()=>false)} />);return {client,storage};
}
async function choose(){await screen.findByRole('option',{name:'Supermarket'});fireEvent.change(screen.getByLabelText('Category'),{target:{value:'groceries'}});fireEvent.change(screen.getByLabelText('Currency'),{target:{value:'AED'}});}
function add(value:string){fireEvent.change(screen.getByLabelText('Amount'),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'Add amount'}));}
test('entry defaults to the local calendar date/weekday and shows only the selected category monthly note',async()=>{
 open();await choose();expect(screen.getByText('Today · Fri, 27 Nov 2026')).toBeVisible();expect(screen.getByText(/November 2026.*12,500/)).toHaveTextContent('KZT');
 fireEvent.change(screen.getByLabelText('Category'),{target:{value:'electronics'}});expect(screen.getByText(/November 2026.*0.00 KZT/)).toBeVisible();
 expect(screen.getByLabelText('Amount')).toHaveAttribute('inputmode','decimal');
});
test('stack Add, Enter and unfinished Submit preserve separate normalized amounts and one group',async()=>{
 const {client}=open();await choose();add('5');fireEvent.change(screen.getByLabelText('Amount'),{target:{value:'10'}});fireEvent.keyDown(screen.getByLabelText('Amount'),{key:'Enter'});add('12');
 expect(within(screen.getByRole('list',{name:'Amounts in this entry'})).getAllByRole('listitem')).toHaveLength(3);
 fireEvent.change(screen.getByLabelText('Amount'),{target:{value:'0,10'}});fireEvent.change(screen.getByLabelText('Comment (optional)'),{target:{value:'Receipt'}});
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 await waitFor(()=>expect(client.preview).toHaveBeenCalledExactlyOnceWith({date:'2026-11-27',categoryId:'groceries',currency:'AED',amounts:['5','10','12','0.1'],comment:'Receipt'},'memory-csrf'));
});
test('invalid pending input blocks Submit instead of silently discarding it',async()=>{
 const {client}=open();await choose();add('5');fireEvent.change(screen.getByLabelText('Amount'),{target:{value:'1,000.00'}});fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid','true');expect(client.preview).not.toHaveBeenCalled();
});
test('Remove edits the queue and the subtotal stays decimal-exact',async()=>{
 open();await choose();add('0.1');add('0.2');expect(screen.getByText('Entry total: 0.3 AED')).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'Remove 0.1 AED'}));expect(screen.getByText('Entry total: 0.2 AED')).toBeVisible();
});
test('gear Options, explicit appearance and Back preserve the draft and write only the theme enum',async()=>{
 const {storage,client}=open();await choose();add('5');fireEvent.change(screen.getByLabelText('Comment (optional)'),{target:{value:'Keep me'}});
 fireEvent.click(screen.getByRole('button',{name:'Options'}));fireEvent.click(screen.getByRole('radio',{name:'Dark'}));
 expect(document.documentElement).toHaveAttribute('data-theme','dark');expect(storage.setItem).toHaveBeenCalledExactlyOnceWith('expences-record.appearance','dark');
 fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByLabelText('Comment (optional)')).toHaveValue('Keep me');expect(screen.getByRole('button',{name:'Remove 5 AED'})).toBeVisible();expect(client.preview).not.toHaveBeenCalled();
});
test('blocked theme storage reports a temporary setting without losing the draft',async()=>{
 const storage={getItem:vi.fn().mockReturnValue('light'),setItem:vi.fn().mockImplementation(()=>{throw new Error('blocked');})};open(expenseClient(),today,storage);await choose();
 fireEvent.click(screen.getByRole('button',{name:'Options'}));fireEvent.click(screen.getByRole('radio',{name:'Dark'}));expect(screen.getByText(/temporary.*device/i)).toBeVisible();
});
test('past-date weekday/month and app-return midnight classification leave the selected date unchanged',async()=>{
 let current=today();open(expenseClient(),()=>current);await choose();current=new Date(2026,10,28,1);act(()=>{fireEvent.focus(window);});
 expect(screen.getByText('Past date · Fri, 27 Nov 2026')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Change date'}));fireEvent.change(screen.getByLabelText('Date'),{target:{value:'2026-10-15'}});
 await waitFor(()=>expect(screen.getByText('Past date · Thu, 15 Oct 2026')).toBeVisible());expect(await screen.findByText(/October 2026.*12,500/)).toBeVisible();
});
test('obsolete catalog replies cannot overwrite a new date or its monthly note',async()=>{
 const client=expenseClient();const old=deferred<ApiResult<ExpenseContext>>();client.context.mockReturnValueOnce(old.promise);open(client);
 fireEvent.click(screen.getByRole('button',{name:'Change date'}));fireEvent.change(screen.getByLabelText('Date'),{target:{value:'2026-10-15'}});
 await choose();await act(async()=>{old.resolve({state:'ok',value:context});});
 expect(screen.queryByText(/November 2026.*12,500/)).not.toBeInTheDocument();expect(screen.getByText(/October 2026.*12,500/)).toBeVisible();
});
test('unconfigured dates expose a clear usable date selection without guessing a catalog',async()=>{
 const client=expenseClient();client.context.mockResolvedValue({state:'error',code:'year_not_configured'});open(client);
 expect(await screen.findByText('This year is not configured. Choose another date.')).toBeVisible();expect(screen.getByRole('button',{name:'Change date'})).toBeEnabled();expect(client.save).not.toHaveBeenCalled();
});
test('Options receives keyboard focus and Back restores focus to its originating control',async()=>{
 open();await choose();fireEvent.click(screen.getByRole('button',{name:'Options'}));
 expect(screen.getByRole('heading',{name:'Options'})).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'Back'}));expect(screen.getByRole('button',{name:'Options'})).toHaveFocus();
});
test('an oversized stack and comment are rejected without dropping queued amounts',async()=>{
 const {client}=open();await choose();for(let i=0;i<20;i++)add('1');add('2');
 expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid','true');expect(screen.getAllByRole('listitem')).toHaveLength(20);
 fireEvent.change(screen.getByLabelText('Amount'),{target:{value:''}});fireEvent.change(screen.getByLabelText('Comment (optional)'),{target:{value:'😀'.repeat(376)}});fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 expect(screen.getByLabelText('Comment (optional)')).toHaveAttribute('aria-invalid','true');expect(client.preview).not.toHaveBeenCalled();expect(client.save).not.toHaveBeenCalled();
});
