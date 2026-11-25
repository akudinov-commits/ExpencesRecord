import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../../src/app/App.js';
import type { AuthClient, SessionResult } from '../../src/api/auth.js';

function client(result: SessionResult) {
  return { session: vi.fn<AuthClient['session']>().mockResolvedValue(result), logout: vi.fn<AuthClient['logout']>().mockResolvedValue('signed-out') };
}
afterEach(() => { window.history.replaceState(null, '', '/'); });

test('checks the session before presenting private content', () => {
  render(<App client={{ session: () => new Promise(() => {}), logout: async () => 'failed' }} />);
  expect(screen.getByRole('status')).toHaveTextContent('Checking your sign-in');
  expect(screen.queryByText('You are signed in.')).not.toBeInTheDocument();
});

test('signed-out user can navigate through the backend Google login', async () => {
  render(<App client={client({ state: 'signed-out' })} />);
  expect(await screen.findByRole('link', { name: 'Sign in with Google' })).toHaveAttribute('href', '/api/auth/login');
  expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
});

test('authorized user sees the private shell and signs out with the memory CSRF value', async () => {
  const auth = client({ state: 'allowed', csrfToken: 'csrf-in-memory' });
  render(<App client={auth} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('link', { name: 'Sign in with Google' })).toBeVisible();
  expect(auth.logout).toHaveBeenCalledExactlyOnceWith('csrf-in-memory');
});

test('denied user sees a clear explanation and may retry with the configured Google account', async () => {
  render(<App client={client({ state: 'denied' })} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('This Google account does not have access.');
  expect(screen.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
});

test('a network failure offers a working session retry', async () => {
  const auth = client({ state: 'unavailable' });
  auth.session.mockResolvedValueOnce({ state: 'unavailable' }).mockResolvedValueOnce({ state: 'allowed', csrfToken: 'csrf' });
  render(<App client={auth} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('You are signed in.')).toBeVisible();
  expect(auth.session).toHaveBeenCalledTimes(2);
});

test('an expired session during logout requests a fresh login', async () => {
  const auth = client({ state: 'allowed', csrfToken: 'csrf' });
  auth.logout.mockResolvedValue('expired');
  render(<App client={auth} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Your sign-in expired. Sign in again.');
  expect(screen.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
});

test('failed logout retains the private shell and offers retry without claiming success', async () => {
  const auth = client({ state: 'allowed', csrfToken: 'csrf' });
  auth.logout.mockResolvedValueOnce('failed').mockResolvedValueOnce('signed-out');
  render(<App client={auth} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not sign out. Try again.');
  expect(screen.getByText('You are signed in.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(await screen.findByRole('link', { name: 'Sign in with Google' })).toBeVisible();
});

test.each([['denied', 'This Google account does not have access.'], ['failed', 'Sign-in was not completed. Try again.'], ['unavailable', 'Google sign-in is temporarily unavailable. Try again.']])('callback result %s displays only the fixed safe message', async (code, message) => {
  window.history.replaceState(null, '', `/?auth=${code}&error=private-provider-detail`);
  render(<App client={client({ state: 'signed-out' })} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.queryByText(/private-provider-detail/)).not.toBeInTheDocument();
});
