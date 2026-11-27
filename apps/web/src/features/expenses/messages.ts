import type { ApiFailure } from '../../api/expenses.js';
const messages: Partial<Record<ApiFailure,string>> = {
  year_not_configured:'This year is not configured. Choose another date.',month_not_configured:'This month is not configured. Choose another date.',
  unauthenticated:'Your sign-in expired. Sign in again before submitting.',access_denied:'This account cannot access the expense sheet.',
  reconnect_required:'Google Sheets access needs to be reconnected.',mapping_unavailable:'Expense setup is not configured.',mapping_invalid:'The sheet layout does not match its configuration.',
  invalid_date:'Choose a valid calendar date.',invalid_amount:'Check the entered amounts.',invalid_comment:'Check the optional comment.',invalid_request:'Check the entry before submitting.',
  cell_changed:'The cell changed. Review it again before saving.',acknowledgment_required:'The sheet needs a fresh review before saving.',
  writes_unavailable:'Saving is currently disabled or unavailable.',unsupported_formula:'The existing formula cannot be safely extended.',invalid_csrf:'Refresh your sign-in before submitting.',invalid_origin:'The request origin was not accepted.',
};
export function expenseMessage(code: ApiFailure): string { return messages[code]??'Could not load expense data. Try again.'; }
