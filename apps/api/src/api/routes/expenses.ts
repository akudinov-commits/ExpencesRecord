import type { FastifyInstance } from 'fastify';
import type { ExpenseOperations } from '../../application/ports/expenses.js';
import { expensesController } from '../controllers/expenses.js';
export function registerExpenseRoutes(app: FastifyInstance, operations: ExpenseOperations) {
  for(const [path,method] of [['/api/expenses/preview','preview'],['/api/expenses','save'],['/api/expenses/comments','comment']] as const) {
    app.post(path,{bodyLimit:8192},expensesController(operations,method));
  }
}
