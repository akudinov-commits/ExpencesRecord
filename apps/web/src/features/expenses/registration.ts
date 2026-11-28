import { useEffect, useRef, useState } from 'react';
import type { ApiFailure, ApiResult, ExpenseClient, ExpenseDraft, ExpenseOutcome, ExpensePreview } from '../../api/expenses.js';
import type { useExpenseDraft } from './draft.js';
import type { ReviewedExpense } from './ExpenseReview.js';
import { requiresConfirmation, reviewedMutation } from './confirmation.js';
import { expenseMessage } from './messages.js';
export interface PendingComment { id: number; draft: ExpenseDraft; categoryLabel: string; status: 'failed' | 'unknown'; preview: ExpensePreview | null }
export function useExpenseRegistration(client: ExpenseClient, csrf: string, draft: ReturnType<typeof useExpenseDraft>, blocked: {current:boolean}, onBusyChange?: (busy:boolean)=>void) {
  const [review,setReview]=useState<ReviewedExpense|null>(null);const [previewing,setPreviewing]=useState(false);const [saving,setSaving]=useState(false);
  const [feedback,setFeedback]=useState<{text:string;tone:'success'|'warning'|'error'}|null>(null);const [unknownExpense,setUnknownExpense]=useState(false);const [authRequired,setAuthRequired]=useState(false);
  const [comments,setComments]=useState<PendingComment[]>([]);const nextComment=useRef(0);const pending=useRef(false);const forceReview=useRef(false);const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;blocked.current=false;onBusyChange?.(false);};},[blocked,onBusyChange]);
  function failure(code:ApiFailure){setFeedback({text:expenseMessage(code),tone:'error'});if(['unauthenticated','access_denied','invalid_csrf'].includes(code))setAuthRequired(true);}
  function beginMutation(){pending.current=true;blocked.current=true;setSaving(true);onBusyChange?.(true);}
  function endMutation(){pending.current=false;blocked.current=false;if(mounted.current){setSaving(false);onBusyChange?.(false);}}
  async function writeEntry(selected:ReviewedExpense){
    if(pending.current||authRequired||!selected.preview.canSave||!selected.preview.proposedFormula||selected.revision!==draft.revision.current||!mounted.current)return;
    beginMutation();let response:ApiResult<ExpenseOutcome>;
    try{response=await client.save(reviewedMutation(selected.draft,selected.preview),csrf);}catch{response={state:'uncertain'};}
    if(!mounted.current){endMutation();return;}
    setReview(null);
    if(response.state==='ok'&&response.value.expense==='saved'){
      const comment=response.value.comment;setUnknownExpense(false);forceReview.current=false;draft.clear();draft.refresh();
      setFeedback({tone:comment==='failed'||comment==='unknown'?'warning':'success',text:comment==='saved'?'Expense saved. Comment added.':comment==='failed'?'Expense saved. Comment was not added.':comment==='unknown'?'Expense saved. The comment result could not be confirmed.':'Expense saved.'});
      if(selected.draft.comment&&(comment==='failed'||comment==='unknown'))setComments(values=>[...values,{id:++nextComment.current,draft:selected.draft,categoryLabel:selected.categoryLabel??selected.draft.categoryId,status:comment,preview:null}]);
    }else if(response.state==='error'){
      failure(response.code);if(response.code==='cell_changed'||response.code==='acknowledgment_required'){forceReview.current=true;draft.invalidate();}
    }else if(response.state==='ok'&&response.value.expense==='not_saved')setFeedback({tone:'warning',text:'Expense was not saved.'});
    else{setFeedback(null);setUnknownExpense(true);forceReview.current=true;}
    endMutation();
  }
  async function submit(){
    if(pending.current||authRequired)return;const command=draft.prepare();if(!command)return;
    const revision=draft.revision.current;pending.current=true;setPreviewing(true);setFeedback(null);let response:ApiResult<ExpensePreview>;
    try{response=await client.preview(command,csrf);}catch{response={state:'error',code:'unavailable'};}
    pending.current=false;if(!mounted.current)return;setPreviewing(false);if(revision!==draft.revision.current)return;
    if(response.state!=='ok'){if(response.state==='error')failure(response.code);return;}
    const selected:ReviewedExpense={draft:command,preview:response.value,revision,categoryLabel:draft.context?.categories.find(category=>category.id===command.categoryId)?.label??command.categoryId};
    if(requiresConfirmation(command,response.value,forceReview.current))setReview(selected);else await writeEntry(selected);
  }
  function back(){if(blocked.current)return;draft.invalidate();setReview(null);}
  async function reviewComment(id:number){
    const comment=comments.find(value=>value.id===id);if(!comment||pending.current||authRequired)return;
    pending.current=true;setPreviewing(true);let response:ApiResult<ExpensePreview>;
    try{response=await client.preview(comment.draft,csrf);}catch{response={state:'error',code:'unavailable'};}
    pending.current=false;if(!mounted.current)return;setPreviewing(false);
    if(response.state==='ok')setComments(values=>values.map(value=>value.id===id?{...value,preview:response.value}:value));else if(response.state==='error')failure(response.code);
  }
  async function addComment(id:number){
    const comment=comments.find(value=>value.id===id);if(!comment?.preview||comment.preview.blockedReason==='writes_unavailable'||pending.current||authRequired)return;
    beginMutation();let response:ApiResult<ExpenseOutcome>;
    try{response=await client.comment({...comment.draft,expectedVersion:comment.preview.expectedVersion},csrf);}catch{response={state:'uncertain'};}
    if(!mounted.current){endMutation();return;}
    if(response.state==='ok'&&response.value.comment==='saved'&&response.value.expense==='unchanged'){
      setComments(values=>values.filter(value=>value.id!==id));setFeedback({tone:'success',text:'Comment added. Expense unchanged.'});
    }else{
      const unknown=response.state==='uncertain'||response.state==='ok'&&(response.value.comment==='unknown'||response.value.expense==='unknown');
      setComments(values=>values.map(value=>value.id===id?{...value,status:unknown?'unknown':'failed',preview:null}:value));
      if(response.state==='error')failure(response.code);else setFeedback({tone:'warning',text:unknown?'The comment result could not be confirmed. Inspect the cell comments before another request.':'Comment was not added. Expense unchanged.'});
    }
    endMutation();
  }
  return {review,previewing,saving,feedback,unknownExpense,authRequired,comments,submit,back,confirm:()=>{if(review)void writeEntry(review);},reviewComment,addComment};
}
