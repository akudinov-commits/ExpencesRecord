import type { RecordedExpense } from '../../api/expenses.js';
export function RecordedExpenseNote({value,date}:{value:RecordedExpense|undefined;date:string}) {
  if (!value || value.date!==date || value.status==='unavailable') return <p className="u-help expense-recorded">Recorded amount unavailable.</p>;
  if (value.status!=='recorded') return null;
  const text=value.amount===null?'Already recorded: total unavailable':`Already recorded: ${new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:6}).format(value.amount)} ${value.currency}`;
  if (!value.formula) return <p className="u-help expense-recorded">{text}</p>;
  return <details className="expense-recorded"><summary><span>{text}</span> <span>Formula</span></summary><p>{value.formula}</p></details>;
}
