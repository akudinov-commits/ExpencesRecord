import { createHash } from 'node:crypto';
import type { ExpenseFingerprint } from '../application/ports/expenses.js';
export const expenseFingerprint: ExpenseFingerprint = { of: value => createHash('sha256').update(JSON.stringify(value)).digest('base64url') };
