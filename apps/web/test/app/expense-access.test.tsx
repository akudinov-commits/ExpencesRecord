import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../../src/app/App.js';
import { expenseClient } from '../support/expenses.js';
test('private expense entry is composed only after the owner session is allowed',async()=>{
 const expenses=expenseClient();render(<App client={{session:vi.fn().mockResolvedValue({state:'allowed',csrfToken:'memory-csrf'}),logout:async()=> 'signed-out'}} expenseClient={expenses} />);
 expect(await screen.findByLabelText('Amount')).toBeVisible();expect(expenses.context).toHaveBeenCalledOnce();
});
test('signed-out shell never loads a private expense catalog',async()=>{
 const expenses=expenseClient();render(<App client={{session:vi.fn().mockResolvedValue({state:'signed-out'}),logout:async()=> 'signed-out'}} expenseClient={expenses} />);
 expect(await screen.findByRole('link',{name:'Sign in with Google'})).toBeVisible();expect(expenses.context).not.toHaveBeenCalled();expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument();
});
