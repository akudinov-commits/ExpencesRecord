import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Button, Field, IconButton, Notice, RadioGroup, Status, TextInput } from '../../src/ui/components.js';

test('a loading action is announced and cannot dispatch again', () => {
  const click = vi.fn();
  render(<Button loading onClick={click}>Saving…</Button>);
  const button = screen.getByRole('button', { name: 'Saving…' });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'true');
  fireEvent.click(button); expect(click).not.toHaveBeenCalled();
});
test('ordinary actions do not implicitly submit an enclosing form', () => {
  const submit = vi.fn((event) => event.preventDefault());
  render(<form onSubmit={submit}><Button>Add amount</Button></form>);
  fireEvent.click(screen.getByRole('button')); expect(submit).not.toHaveBeenCalled();
});
test('icon actions have an accessible name and native disabled semantics', () => {
  const click = vi.fn(); render(<IconButton label="Options" disabled onClick={click}><span aria-hidden>⚙</span></IconButton>);
  const button = screen.getByRole('button', { name: 'Options' });
  fireEvent.click(button); expect(click).not.toHaveBeenCalled();
});
test('field labels, help and validation errors describe the control', () => {
  render(<Field id="amount" label="Amount" help="Use a decimal" error="Enter a positive amount">{control => <TextInput {...control} />}</Field>);
  const input = screen.getByRole('textbox', { name: 'Amount' });
  expect(input).toHaveAccessibleDescription('Use a decimal Enter a positive amount');
  expect(input).toHaveAttribute('aria-invalid', 'true');
});
test('native appearance choices expose checked state and report a deliberate selection', () => {
  const change = vi.fn();
  render(<RadioGroup label="Appearance" name="appearance" value="light" onChange={change} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} />);
  expect(screen.getByRole('group', { name: 'Appearance' })).toBeVisible();
  expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: 'Dark' })); expect(change).toHaveBeenCalledWith('dark');
});
test('errors announce an alert while informative content is not forced into an alert', () => {
  render(<><Notice tone="error">Could not load</Notice><Notice tone="info">Read only information</Notice></>);
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
  expect(screen.getByText('Read only information')).not.toHaveAttribute('role', 'alert');
});
test('loading status is polite and exposes its busy state', () => {
  render(<Status busy>Loading categories…</Status>);
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
});
