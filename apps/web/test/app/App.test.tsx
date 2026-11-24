import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from '../../src/app/App.js';

test('presents an accessible daily-expense application shell', () => {
  render(<App />);
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'ExpencesRecord' })).toBeVisible();
  expect(screen.getByText('Keep track of everyday spending.')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
