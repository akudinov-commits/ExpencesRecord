import type { FastifyInstance } from 'fastify';
import type { ExpenseContextQuery } from '../../application/expense-context.js';
import { expenseContextController } from '../controllers/expense-context.js';
export function registerExpenseContextRoutes(app: FastifyInstance, query: ExpenseContextQuery) {
  app.get('/api/expense-context', { exposeHeadRoute: false, schema: { querystring: {
    type: 'object', required: ['date'], additionalProperties: true,
    properties: { date: { type: 'string', minLength: 10, maxLength: 10, pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' } },
  } } }, expenseContextController(query));
}
