import type { ExpenseDraft, ExpenseMutation, ExpensePreview } from '../../api/expenses.js';
export function reviewedMutation(draft: ExpenseDraft, preview: ExpensePreview): ExpenseMutation {
  return {...draft,amounts:[...draft.amounts],expectedVersion:preview.expectedVersion,
    ...(preview.warnings.includes('existing_data')?{acknowledgeExistingData:true}:{}),
    ...(preview.warnings.includes('possible_duplicate')?{acknowledgePossibleDuplicate:true}:{}),
    ...(preview.warnings.includes('duplicate_check_inconclusive')?{acknowledgeInconclusive:true}:{})};
}
export function requiresConfirmation(draft: ExpenseDraft, preview: ExpensePreview, force = false): boolean { return force || draft.amounts.length !== 1 || preview.currentCell.hasData || !preview.canSave || preview.warnings.length > 0; }
