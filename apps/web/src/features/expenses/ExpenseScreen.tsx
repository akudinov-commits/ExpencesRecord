import { useEffect, useRef, useState } from 'react';
import type { ExpenseClient } from '../../api/expenses.js';
import type { AppearanceSetting } from '../options/appearance.js';
import { browserAppearanceSetting } from '../options/appearance.js';
import type { Appearance } from '../options/appearance.js';
import { Button, Card, Field, IconButton, Notice, RadioGroup, Select, Status, TextArea, TextInput } from '../../ui/components.js';
import { inputTotal, localDate, monthLabel, selectedDateLabel, systemNow, useExpenseDraft } from './draft.js';
import { ExpenseReview } from './ExpenseReview.js';
import { expenseMessage } from './messages.js';
import { useExpenseRegistration } from './registration.js';
import { CommentRecovery } from './CommentRecovery.js';
export interface ExpenseScreenProps { client: ExpenseClient; csrfToken: string; now?: () => Date; appearanceSetting?: AppearanceSetting; onBusyChange?: (busy:boolean)=>void }
export function ExpenseScreen({client,csrfToken,now=systemNow,appearanceSetting,onBusyChange}: ExpenseScreenProps) {
  const blocked=useRef(false);const draft=useExpenseDraft(client,now,blocked);const workflow=useExpenseRegistration(client,csrfToken,draft,blocked,onBusyChange);
  const {saving,previewing}=workflow;const [options,setOptions]=useState(false);const [dateEditor,setDateEditor]=useState(false);
  const [setting]=useState(()=>appearanceSetting??browserAppearanceSetting());const [appearance,setAppearance]=useState<Appearance>(()=>setting.read());const [temporaryAppearance,setTemporaryAppearance]=useState(false);
  const optionsHeading=useRef<HTMLHeadingElement>(null);const optionsButton=useRef<HTMLButtonElement>(null);const wasOptions=useRef(false);
  useEffect(()=>{document.documentElement.dataset.theme=appearance;},[appearance]);
  useEffect(()=>{if(options)optionsHeading.current?.focus();else if(wasOptions.current)optionsButton.current?.focus();wasOptions.current=options;},[options]);
  const activeReview=workflow.review?.revision===draft.revision.current?workflow.review:null;
  const wasReview=useRef(false);
  useEffect(()=>{if(!activeReview&&wasReview.current&&!options)document.getElementById('expense-amount')?.focus();wasReview.current=!!activeReview;},[activeReview,options]);
  const category=draft.context?.categories.find(category=>category.id===draft.categoryId);const total=category?.monthlyTotal;
  const contextFailure=draft.result?.state==='error'?draft.result.code:null;
  const unavailable=!!contextFailure;
  const accessExpired=workflow.authRequired||contextFailure==='unauthenticated'||contextFailure==='access_denied';
  const dateLabel=selectedDateLabel(draft.date,draft.clock);
  const feedback=<>{saving&&<Status busy>Saving…</Status>}{workflow.unknownExpense&&<Notice tone="warning">We could not confirm whether the expense was saved. Check your spreadsheet before trying again.</Notice>}
    {workflow.feedback&&<div aria-live="polite"><Notice tone={workflow.feedback.tone}>{workflow.feedback.text}</Notice></div>}{accessExpired&&<a className="primary-action" href="/api/auth/login">Sign in again</a>}</>;
  if(options)return <section className="expense-content" aria-label="Options"><Button variant="quiet" disabled={saving} onClick={()=>setOptions(false)}><span aria-hidden="true">←</span>Back</Button><h2 ref={optionsHeading} tabIndex={-1}>Options</h2>
    <RadioGroup label="Appearance" name="appearance" value={appearance} onChange={value=>{if(value==='light'||value==='dark'){setAppearance(value);setTemporaryAppearance(!setting.save(value));}}} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} />
    {temporaryAppearance?<Notice>This choice is temporary because it could not be saved on this device.</Notice>:<p className="u-help">Remembered on this device.</p>}</section>;
  if(activeReview)return <div className="expense-content">{feedback}<ExpenseReview review={activeReview} now={draft.clock} onBack={workflow.back} onConfirm={workflow.confirm} saving={saving} /></div>;
  return <section className="expense-content" aria-label="Expense entry">
    <header className="expense-heading"><h2>Add an expense</h2><IconButton ref={optionsButton} label="Options" disabled={saving} onClick={()=>{draft.invalidate();setOptions(true);}}><span aria-hidden="true">⚙</span></IconButton></header>
    <div className="expense-date-row"><span className={`u-date ${draft.date<localDate(draft.clock)?'u-date--past':''}`}>{dateLabel}</span><Button variant="quiet" disabled={saving} onClick={()=>setDateEditor(value=>!value)}>Change date</Button></div>
    {dateEditor&&<Field id="expense-date" label="Date">{control=><TextInput {...control} type="date" disabled={saving} value={draft.date} onChange={event=>draft.edit('date',event.target.value)} />}</Field>}
    {!draft.result?<Status busy>Loading categories and currencies…</Status>:contextFailure?<Notice>{expenseMessage(contextFailure)}</Notice>:null}
    {unavailable&&!accessExpired&&<Button variant="quiet" disabled={saving} onClick={draft.refresh}>Retry loading</Button>}
    {feedback}
    {workflow.comments.map(comment=><CommentRecovery key={comment.id} comment={comment} now={draft.clock} busy={saving||previewing||workflow.authRequired} onReview={()=>{void workflow.reviewComment(comment.id);}} onConfirm={()=>{void workflow.addComment(comment.id);}} />)}
    <form className="expense-form" onSubmit={event=>{event.preventDefault();void workflow.submit();}} noValidate><fieldset className="expense-fields" disabled={saving}>
      <Field id="expense-category" label="Category" {...(draft.errors.categoryId?{error:draft.errors.categoryId}:{})}>{control=><Select {...control} value={draft.categoryId} disabled={!draft.context} onChange={event=>draft.edit('categoryId',event.target.value)}><option value="">Choose category</option>{draft.context?.categories.map(category=><option key={category.id} value={category.id}>{category.label}</option>)}</Select>}</Field>
      <p className="u-help expense-monthly">{!draft.result?'Loading monthly total…':contextFailure?`${monthLabel(draft.date)} · Monthly total unavailable`:!category?'Choose a category to see its monthly total.':total?.status==='available'?`${monthLabel(draft.date)} · ${new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:6}).format(total.amount)} ${total.currency} already recorded`:`${monthLabel(draft.date)} · Monthly total unavailable`}</p>
      <div className="expense-amount-row"><Field id="expense-amount" label="Amount" {...(draft.errors.amount?{error:draft.errors.amount}:{})}>{control=><TextInput {...control} inputMode="decimal" autoComplete="off" value={draft.amount} placeholder="0.00" onChange={event=>draft.edit('amount',event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();draft.queue();}}} />}</Field>
        <Field id="expense-currency" label="Currency" {...(draft.errors.currency?{error:draft.errors.currency}:{})}>{control=><Select {...control} value={draft.currency} disabled={!draft.context} onChange={event=>draft.edit('currency',event.target.value)}><option value="">Choose</option>{draft.context?.currencies.map(currency=><option key={currency.code}>{currency.code}</option>)}</Select>}</Field></div>
      <Button variant="quiet" onClick={draft.queue}><span aria-hidden="true">+</span>Add amount</Button>
      {draft.amounts.length>0&&<Card className="amount-stack"><h3>Amounts in this entry</h3><ul aria-label="Amounts in this entry">{draft.amounts.map((amount,index)=><li key={index}><span>{amount} {draft.currency}</span><IconButton label={`Remove ${amount} ${draft.currency}`} onClick={()=>draft.remove(index)}><span aria-hidden="true">×</span></IconButton></li>)}</ul><p>Entry total: {inputTotal(draft.amounts)} {draft.currency}</p></Card>}
      <Field id="expense-comment" label="Comment (optional)" {...(draft.errors.comment?{error:draft.errors.comment}:{})}>{control=><TextArea {...control} rows={2} value={draft.comment} onChange={event=>draft.edit('comment',event.target.value)} />}</Field>
      <Button type="submit" loading={previewing||saving} disabled={!draft.context||workflow.authRequired}>Submit</Button>
      </fieldset>
    </form>
  </section>;
}
