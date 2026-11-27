import type { PendingComment } from './registration.js';
import { Button, Card, Notice } from '../../ui/components.js';
import { selectedDateLabel } from './draft.js';
export function CommentRecovery({comment,now,busy,onReview,onConfirm}: {comment:PendingComment;now:Date;busy:boolean;onReview:()=>void;onConfirm:()=>void}) {
  return <Card className="u-stack" aria-label={`Pending comment ${comment.id}`}><h3>Pending comment</h3><p className="u-help">{selectedDateLabel(comment.draft.date,now)} · {comment.categoryLabel}</p>
    <p>{comment.draft.amounts.join(' + ')} {comment.draft.currency}</p><p className="expense-plain-text">{comment.draft.comment}</p>
    <p className="u-help">{comment.status==='unknown'?'Check the cell comments before another comment request. This action does not submit an expense.':'The expense is already saved. This action adds only its comment.'}</p>
    {comment.preview?<><p className="u-help">The selected cell was read again. Confirm to add this comment only.</p>
      {comment.preview.blockedReason==='writes_unavailable'&&<Notice>Comment writing is unavailable.</Notice>}
      <Button disabled={busy||comment.preview.blockedReason==='writes_unavailable'} onClick={onConfirm}>Add comment only</Button></>
      :<Button variant="secondary" disabled={busy} onClick={onReview}>Review comment only</Button>}
  </Card>;
}
