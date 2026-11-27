import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Gallery } from '../../src/ui/Gallery.js';
test('the synthetic gallery demonstrates explicit appearance and reusable field interaction', () => {
  render(<Gallery />);
  const gallery = screen.getByRole('main', { name: 'Component gallery' });
  fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(gallery).toHaveAttribute('data-theme', 'dark');
  fireEvent.change(screen.getByRole('textbox', { name: 'Example label' }), { target: { value: 'Edited example' } });
  expect(screen.getByRole('status')).toHaveTextContent('Edited example');
  expect(screen.getByText('Past date · Wed, 25 Nov 2026')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
});
