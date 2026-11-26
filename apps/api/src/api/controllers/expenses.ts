import type { FastifyReply, FastifyRequest } from 'fastify';
import { ExpenseError } from '../../application/ports/expenses.js';
import type { ExpenseFailure, ExpenseOperations } from '../../application/ports/expenses.js';
import { MappingError } from '../../application/expense-context.js';
import { SheetsAccessError } from '../../application/ports/sheets-access.js';
const statuses: Record<ExpenseFailure, number> = { invalid_request:400,invalid_amount:400,invalid_comment:400,mapping_invalid:409,writes_unavailable:503,unsupported_formula:409,cell_changed:409,acknowledgment_required:409,access_denied:403 };
export function expensesController(operations: ExpenseOperations, method: keyof ExpenseOperations) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body;
    const keys = ['date','amount','categoryId','currency','comment',...(method === 'preview' ? [] : ['expectedVersion','acknowledgeExistingData','acknowledgePossibleDuplicate','acknowledgeInconclusive'])];
    if (Object.keys(request.query as object).length || !body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !keys.includes(key))) return reply.code(400).send({error:{code:'invalid_request'}});
    try {
      if(method === 'preview') {
        const result=await operations.preview(request.verifiedSession?.subject ?? '',body);
        return reply.send({date:result.date,categoryId:result.categoryId,storageCurrency:result.storageCurrency,currentCell:{hasData:result.currentCell.hasData,calculatedTotal:result.currentCell.calculatedTotal,formula:result.currentCell.formula,scalarValue:result.currentCell.scalarValue},proposedFormula:result.proposedFormula,expectedVersion:result.expectedVersion,canSave:result.canSave,warnings:result.warnings,...(result.blockedReason?{blockedReason:result.blockedReason}:{})});
      }
      const result=await operations[method](request.verifiedSession?.subject ?? '',body);
      const status=result.expense === 'unknown' || result.comment === 'unknown' ? 202 : result.expense === 'not_saved' || (result.expense === 'unchanged' && result.comment === 'failed') ? 503 : 201;
      return reply.code(status).send({expense:result.expense,comment:result.comment,...(result.code?{code:result.code}:{})});
    } catch(error) {
      if(error instanceof ExpenseError)return reply.code(statuses[error.code]).send({error:{code:error.code}});
      if(error instanceof SheetsAccessError)return reply.code(error.code === 'access_denied' ? 403 : 503).send({error:{code:error.code === 'unavailable' ? 'sheets_unavailable' : error.code}});
      if(error instanceof MappingError)return reply.code(error.code === 'access_denied'?403:error.code === 'invalid_date'?400:['year_not_configured','month_not_configured'].includes(error.code)?404:error.code === 'mapping_invalid'?409:503).send({error:{code:error.code}});
      throw error;
    }
  };
}
