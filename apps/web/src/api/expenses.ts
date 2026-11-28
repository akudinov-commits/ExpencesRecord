export type RecordedExpense = {date:string;status:'recorded';amount:number|null;currency:string;formula:string|null} | {date:string;status:'empty'|'unavailable'};
export type MonthlyTotal = { period: string; status: 'available'; amount: number; currency: string } | { period: string; status: 'unavailable' };
export interface ExpenseContext { date: string; baseCurrency: string; categories: { id: string; label: string; recordedExpense?: RecordedExpense; monthlyTotal?: MonthlyTotal }[]; currencies: { code: string }[] }
export interface ExpenseDraft { date: string; amounts: string[]; categoryId: string; currency: string; comment?: string }
export type ExpenseWarning = 'existing_data' | 'possible_duplicate' | 'duplicate_check_inconclusive';
export interface ExpensePreview { date: string; categoryId: string; storageCurrency: string; currentCell: { hasData: boolean; calculatedTotal: number | null; formula: string | null; scalarValue: string | number | boolean | null }; proposedFormula: string | null; expectedVersion: string; canSave: boolean; warnings: ExpenseWarning[]; blockedReason?: 'writes_unavailable' | 'unsupported_formula' }
export interface ExpenseMutation extends ExpenseDraft { expectedVersion: string; acknowledgeExistingData?: boolean; acknowledgePossibleDuplicate?: boolean; acknowledgeInconclusive?: boolean }
export interface ExpenseOutcome { expense: 'saved' | 'not_saved' | 'unknown' | 'unchanged'; comment: 'not_requested' | 'saved' | 'failed' | 'unknown' }
export type ApiFailure = 'unauthenticated' | 'access_denied' | 'invalid_request' | 'invalid_amount' | 'invalid_comment' | 'invalid_date' | 'year_not_configured' | 'month_not_configured' | 'mapping_invalid' | 'mapping_unavailable' | 'reconnect_required' | 'sheets_unavailable' | 'writes_unavailable' | 'unsupported_formula' | 'cell_changed' | 'acknowledgment_required' | 'invalid_origin' | 'invalid_csrf' | 'unavailable';
export type ApiResult<T> = { state: 'ok'; value: T } | { state: 'error'; code: ApiFailure } | { state: 'uncertain' };
export interface ExpenseClient { context(date: string): Promise<ApiResult<ExpenseContext>>; preview(draft: ExpenseDraft, csrf: string): Promise<ApiResult<ExpensePreview>>; save(draft: ExpenseMutation, csrf: string): Promise<ApiResult<ExpenseOutcome>>; comment(draft: ExpenseMutation, csrf: string): Promise<ApiResult<ExpenseOutcome>> }
function record(value: unknown): Record<string, unknown> | null { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function text(value: unknown, maximum: number, pattern?: RegExp): value is string { return typeof value === 'string' && value.length > 0 && value.length <= maximum && (!pattern || pattern.test(value)); }
function member<T extends string>(value: unknown, values: readonly T[]): value is T { return typeof value === 'string' && values.some(item => item === value); }
const currencyPattern = /^[A-Z]{3}$/;
const warnings = ['existing_data', 'possible_duplicate', 'duplicate_check_inconclusive'] as const;
function contextValue(value: unknown, date: string): ExpenseContext | null {
  const raw = record(value);
  if (!raw || raw.date !== date || !text(raw.baseCurrency, 3, currencyPattern) || !Array.isArray(raw.categories) || !raw.categories.length || raw.categories.length > 200
    || !Array.isArray(raw.currencies) || !raw.currencies.length || raw.currencies.length > 200) return null;
  const categories: ExpenseContext['categories'] = []; const currencies: ExpenseContext['currencies'] = [];
  for (const value of raw.categories) {
    const category = record(value);
    if (!category || !text(category.id, 64, /^[a-z][a-z0-9-]*$/) || !text(category.label, 200)) return null;
    let monthlyTotal: MonthlyTotal | undefined;
    if (category.monthlyTotal !== undefined) {
      const total = record(category.monthlyTotal); const period = date.slice(0, 7);
      monthlyTotal = total?.period === period && total.status === 'available' && typeof total.amount === 'number' && Number.isFinite(total.amount) && text(total.currency, 3, currencyPattern)
        ? { period, status: 'available', amount: total.amount, currency: total.currency } : { period, status: 'unavailable' };
    }
    let recordedExpense: RecordedExpense | undefined;
    if (category.recordedExpense !== undefined) {
      const daily = record(category.recordedExpense);
      recordedExpense = { date, status: 'unavailable' };
      if (daily?.date === date) {
        if (daily.status === 'empty' || daily.status === 'unavailable') recordedExpense = { date, status: daily.status };
        else if (daily.status === 'recorded' && (daily.amount === null || typeof daily.amount === 'number' && Number.isFinite(daily.amount))
          && text(daily.currency, 3, currencyPattern) && (daily.formula === null || text(daily.formula, 8000, /^=/)))
          recordedExpense = { date, status: 'recorded', amount: daily.amount, currency: daily.currency, formula: daily.formula };
      }
    }
    categories.push({ id: category.id, label: category.label, ...(recordedExpense ? { recordedExpense } : {}), ...(monthlyTotal ? { monthlyTotal } : {}) });
  }
  for (const value of raw.currencies) { const currency = record(value); if (!currency || !text(currency.code, 3, currencyPattern)) return null; currencies.push({ code: currency.code }); }
  if (new Set(categories.map(category => category.id)).size !== categories.length || new Set(currencies.map(currency => currency.code)).size !== currencies.length) return null;
  return { date, baseCurrency: raw.baseCurrency, categories, currencies };
}
function previewValue(value: unknown, draft: ExpenseDraft): ExpensePreview | null {
  const raw = record(value); const cell = record(raw?.currentCell);
  if (!raw || !cell || raw.date !== draft.date || raw.categoryId !== draft.categoryId || !text(raw.storageCurrency, 3, currencyPattern)
    || !text(raw.expectedVersion, 43, /^[A-Za-z0-9_-]{43}$/) || typeof raw.canSave !== 'boolean' || typeof cell.hasData !== 'boolean'
    || !(cell.calculatedTotal === null || typeof cell.calculatedTotal === 'number' && Number.isFinite(cell.calculatedTotal))
    || !(cell.formula === null || text(cell.formula, 8000, /^=/))
    || !(cell.scalarValue === null || typeof cell.scalarValue === 'boolean' || typeof cell.scalarValue === 'string' && cell.scalarValue.length <= 8000 || typeof cell.scalarValue === 'number' && Number.isFinite(cell.scalarValue))
    || !(raw.proposedFormula === null || text(raw.proposedFormula, 8000, /^=/))
    || (raw.canSave && raw.proposedFormula === null) || (!cell.hasData && (cell.calculatedTotal !== null || cell.formula !== null || cell.scalarValue !== null && cell.scalarValue !== ''))
    || !Array.isArray(raw.warnings) || raw.warnings.length > 3 || !raw.warnings.every(value => member(value, warnings)) || new Set(raw.warnings).size !== raw.warnings.length
    || (raw.blockedReason !== undefined && !member(raw.blockedReason, ['writes_unavailable', 'unsupported_formula']))) return null;
  return { date: draft.date, categoryId: draft.categoryId, storageCurrency: raw.storageCurrency,
    currentCell: { hasData: cell.hasData, calculatedTotal: cell.calculatedTotal, formula: cell.formula, scalarValue: cell.scalarValue },
    proposedFormula: raw.proposedFormula, expectedVersion: raw.expectedVersion, canSave: raw.canSave, warnings: raw.warnings,
    ...(raw.blockedReason ? { blockedReason: raw.blockedReason } : {}) };
}
function outcomeValue(value: unknown): ExpenseOutcome | null {
  const raw = record(value);
  return raw && member(raw.expense, ['saved', 'not_saved', 'unknown', 'unchanged']) && member(raw.comment, ['not_requested', 'saved', 'failed', 'unknown']) ? { expense: raw.expense, comment: raw.comment } : null;
}
const failureStatuses: Record<Exclude<ApiFailure, 'unavailable'>, number> = {
  unauthenticated: 401, access_denied: 403, invalid_request: 400, invalid_amount: 400, invalid_comment: 400, invalid_date: 400, year_not_configured: 404, month_not_configured: 404,
  mapping_invalid: 409, mapping_unavailable: 503, reconnect_required: 503, sheets_unavailable: 503, writes_unavailable: 503, unsupported_formula: 409, cell_changed: 409, acknowledgment_required: 409, invalid_origin: 403, invalid_csrf: 403,
};
function knownFailure(value: unknown, status: number): ApiFailure | null {
  const code = record(record(value)?.error)?.code;
  return typeof code === 'string' && Object.hasOwn(failureStatuses, code) && failureStatuses[code as keyof typeof failureStatuses] === status ? code as ApiFailure : null;
}
function payload(draft: ExpenseDraft, mutation = false): Record<string, unknown> {
  const result: Record<string, unknown> = { date: draft.date, amounts: [...draft.amounts], categoryId: draft.categoryId, currency: draft.currency, ...(draft.comment ? { comment: draft.comment } : {}) };
  if (mutation) {
    const reviewed = draft as ExpenseMutation; result.expectedVersion = reviewed.expectedVersion;
    for (const key of ['acknowledgeExistingData', 'acknowledgePossibleDuplicate', 'acknowledgeInconclusive'] as const) if (reviewed[key] === true) result[key] = true;
  }
  return result;
}
export function createExpenseClient(request: typeof fetch = fetch): ExpenseClient {
  async function exchange<T>(url: string, init: RequestInit, parse: (value: unknown) => T | null, mutation = false, commentOnly = false): Promise<ApiResult<T>> {
    try {
      const response = await request(url, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', ...init });
      if (response.status === 401) return { state: 'error', code: 'unauthenticated' };
      if (response.status === 403) return { state: 'error', code: 'access_denied' };
      const rawText = await response.text();
      if (rawText.length > 262144) return mutation ? { state: 'uncertain' } : { state: 'error', code: 'unavailable' };
      const raw: unknown = JSON.parse(rawText);
      if (mutation) {
        const outcome = outcomeValue(raw);
        const statusValid = response.status === 201 || response.status === 202 && (outcome?.expense === 'unknown' || outcome?.comment === 'unknown')
          || response.status === 503 && (outcome?.expense === 'not_saved' || outcome?.expense === 'unchanged' && outcome?.comment === 'failed');
        if (outcome && statusValid && (commentOnly ? outcome.expense === 'unchanged' || outcome.expense === 'unknown' : outcome.expense !== 'unchanged')) {
          const value = parse(outcome); if (value) return { state: 'ok', value };
        }
      } else if (response.status === 200) { const value = parse(raw); if (value) return { state: 'ok', value }; }
      const code = knownFailure(raw, response.status);
      return code ? { state: 'error', code } : mutation ? { state: 'uncertain' } : { state: 'error', code: 'unavailable' };
    } catch { return mutation ? { state: 'uncertain' } : { state: 'error', code: 'unavailable' }; }
  }
  const post = (draft: ExpenseDraft, csrf: string, mutation = false): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify(payload(draft, mutation)) });
  return {
    context: date => exchange('/api/expense-context?date=' + encodeURIComponent(date), {}, value => contextValue(value, date)),
    preview: (draft, csrf) => exchange('/api/expenses/preview', post(draft, csrf), value => previewValue(value, draft)),
    save: (draft, csrf) => exchange('/api/expenses', post(draft, csrf, true), outcomeValue, true),
    comment: (draft, csrf) => exchange('/api/expenses/comments', post(draft, csrf, true), outcomeValue, true, true),
  };
}
