import type { ExpenseOutcome, ExpenseWritePlan, ExpenseWriter } from '../application/ports/expenses.js';
function integer(value: number, min: number, max: number) { return Number.isSafeInteger(value) && value >= min && value <= max; }
function valid(plan: ExpenseWritePlan, token: string): boolean {
  return /^[A-Za-z0-9_-]{10,200}$/.test(plan.spreadsheetId) && !!token && !/\s/.test(token)
    && integer(plan.sheetId,0,2147483647) && integer(plan.row,1,10000000) && integer(plan.column,1,18278)
    && (plan.formula !== undefined || plan.comment !== undefined)
    && (plan.formula === undefined || (typeof plan.formula === 'string' && plan.formula.startsWith('=') && plan.formula.length <= 8000))
    && (plan.comment === undefined || (typeof plan.comment === 'string' && !!plan.comment && new TextEncoder().encode(plan.comment).length <= 2048));
}
async function payload(response: Response): Promise<Record<string, unknown>> {
  if (!response.body || Number(response.headers.get('content-length')) > 65536) throw new Error('invalid_response');
  const reader=response.body.getReader(); const chunks: Uint8Array[]=[]; let size=0;
  try { while(true) { const part=await reader.read(); if(part.done)break; size+=part.value.length; if(size>65536){await reader.cancel();throw new Error('invalid_response');} chunks.push(part.value); } }
  finally { reader.releaseLock(); }
  const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const result: unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('invalid_response'); return result as Record<string,unknown>;
}
export class GoogleExpenseWriter implements ExpenseWriter {
  constructor(private readonly request: typeof fetch = fetch) {}
  async execute(plan: ExpenseWritePlan, token: string): Promise<ExpenseOutcome> {
    const rejected = (code: string): ExpenseOutcome => ({expense:plan.formula === undefined?'unchanged':'not_saved',comment:plan.comment === undefined?'not_requested':'failed',code});
    if(!valid(plan,token))return rejected('invalid_write_plan');
    const coordinate={sheetId:plan.sheetId,rowIndex:plan.row-1,columnIndex:plan.column-1};
    const requests: unknown[]=[];
    if(plan.formula!==undefined)requests.push({updateCells:{start:coordinate,rows:[{values:[{userEnteredValue:{formulaValue:plan.formula}}]}],fields:'userEnteredValue'}});
    if(plan.comment!==undefined)requests.push({insertComment:{coordinate,content:plan.comment}});
    try {
      const response=await this.request(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(plan.spreadsheetId)}:batchUpdate`,{
        method:'POST',redirect:'error',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({requests})});
      if([400,401,403,404,429].includes(response.status)) { await response.body?.cancel(); return rejected(response.status===401?'reconnect_required':response.status===403||response.status===404?'access_denied':response.status===429?'rate_limited':'write_rejected'); }
      if(response.status!==200){await response.body?.cancel();throw new Error('unconfirmed_response');}
      const body=await payload(response);
      if(body.spreadsheetId!==plan.spreadsheetId||!Array.isArray(body.replies)||body.replies.length!==requests.length
        ||body.replies.some(reply=>!reply||typeof reply!=='object'||Array.isArray(reply)))throw new Error('unconfirmed_response');
      return {expense:plan.formula===undefined?'unchanged':'saved',comment:plan.comment===undefined?'not_requested':body.commentUpdateState==='ALL_SAVED'?'saved':body.commentUpdateState==='ALL_FAILED_UNKNOWN_REASON'?'failed':'unknown'};
    } catch {
      // A dispatched write may have committed before a timeout or invalid response. Never replay it.
      return {expense:plan.formula===undefined?'unchanged':'unknown',comment:plan.comment===undefined?'not_requested':'unknown',code:'outcome_unknown'};
    }
  }
}
