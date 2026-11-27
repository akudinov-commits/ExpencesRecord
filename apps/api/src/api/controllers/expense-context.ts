import type { FastifyReply, FastifyRequest } from 'fastify';
import { MappingError } from '../../application/expense-context.js';
import type { ExpenseContextQuery, MappingFailure } from '../../application/expense-context.js';
const statuses: Record<MappingFailure, number> = { invalid_date: 400, year_not_configured: 404, month_not_configured: 404, mapping_invalid: 409,
  mapping_unavailable: 503, reconnect_required: 503, sheets_unavailable: 503, access_denied: 403 };
export function expenseContextController(query: ExpenseContextQuery) {
  return async (request: FastifyRequest<{ Querystring: { date: string } }>, reply: FastifyReply) => {
    if (Object.keys(request.query).length !== 1) return reply.code(400).send({ error: { code: 'invalid_request' } });
    try {
      const result = await query.execute(request.verifiedSession?.subject ?? '', request.query.date);
      return reply.send({ date: result.date, baseCurrency: result.baseCurrency,
        categories: result.categories.map(({ id, label }) => {
          const total = result.monthlyTotals?.[id];
          return { id, label, ...(total ? { monthlyTotal: total.status === 'available'
            ? { period: total.period, status: total.status, amount: total.amount, currency: total.currency }
            : { period: total.period, status: total.status } } : {}) };
        }), currencies: result.currencies.map(({ code }) => ({ code })) });
    } catch (error) {
      if (!(error instanceof MappingError)) throw error;
      return reply.code(statuses[error.code]).send({ error: { code: error.code } });
    }
  };
}
