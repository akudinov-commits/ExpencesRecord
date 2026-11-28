import type { ExpenseDraft, ExpensePreview } from '../../api/expenses.js';
import { useEffect, useRef } from 'react';
import { Button, Card, Notice } from '../../ui/components.js';
import { inputTotal, localDate, selectedDateLabel } from './draft.js';
export interface ReviewedExpense { draft: ExpenseDraft; preview: ExpensePreview; revision: number; categoryLabel?: string }
export function ExpenseReview({review,now,onBack,onConfirm,saving=false}: { review: ReviewedExpense; now: Date; onBack: () => void; onConfirm: () => void; saving?: boolean }) {
  const heading=useRef<HTMLHeadingElement>(null);useEffect(()=>{heading.current?.focus();},[]);
  const {draft,preview}=review;
  const total=preview.currentCell.calculatedTotal;
  return <section className="expense-content" aria-label="Expense review"><Button variant="quiet" disabled={saving} onClick={onBack}><span aria-hidden="true">←</span>Back</Button>
    <h2 ref={heading} tabIndex={-1}>Review expense</h2><span className={`u-date ${draft.date<localDate(now)?'u-date--past':''}`}>{selectedDateLabel(draft.date,now)}</span>
    <Card className="expense-review-summary"><h3>{inputTotal(draft.amounts)} {draft.currency}</h3><p>{review.categoryLabel??draft.categoryId}</p><p>{draft.amounts.join(' + ')} {draft.currency}</p></Card>
    {draft.comment&&<Card><h3>Your comment</h3><p className="expense-plain-text">{draft.comment}</p></Card>}
    <section className="u-stack"><h3>Current cell total</h3><p className="expense-cell-total">{typeof total==='number'?`${new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:6}).format(total)} ${preview.storageCurrency}`:preview.currentCell.hasData?'No numeric total available.':'This cell is empty.'}</p></section>
    <details className="expense-formulas"><summary>Formula details</summary><h3>Existing content</h3><p>{preview.currentCell.formula??String(preview.currentCell.scalarValue??'Empty')}</p><h3>Proposed formula</h3><p>{preview.proposedFormula??'No safe formula available.'}</p></details>
    {preview.warnings.map(warning=><Notice tone="warning" key={warning}>{warning==='existing_data'?'This cell already has expenses. Confirm only if these are additional purchases.':warning==='possible_duplicate'?'A matching amount may already exist. Check the cell before adding another expense.':'We could not reliably check this formula for matching amounts. Check the sheet before confirming.'}</Notice>)}
    {!preview.canSave&&<Notice tone="warning">{preview.blockedReason==='writes_unavailable'?'Saving is currently disabled or unavailable.':'The existing formula cannot be safely extended. Inspect the sheet before continuing.'}</Notice>}
    <Button disabled={!preview.canSave} loading={saving} onClick={onConfirm}>{saving?'Saving…':'Confirm amounts'}</Button>
  </section>;
}
