import { expect, test, vi } from 'vitest';
import { createAuthClient } from '../../src/api/auth.js';

test('session uses only the same-origin backend and validates its minimal response', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ authenticated: true, csrfToken: 'memory-csrf' })));
  expect(await createAuthClient(request).session()).toEqual({ state: 'allowed', csrfToken: 'memory-csrf' });
  expect(request).toHaveBeenCalledExactlyOnceWith('/api/auth/session', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
});

test.each([[401, 'signed-out'], [403, 'denied'], [503, 'unavailable']] as const)('session status %s maps to %s without exposing provider text', async (status, state) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('private upstream detail', { status }));
  expect(await createAuthClient(request).session()).toEqual({ state });
});

test.each(['{}', '{"authenticated":true}', '{"authenticated":true,"csrfToken":123}', 'not-json'])('malformed session response fails safely: %s', async (body) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
  expect(await createAuthClient(request).session()).toEqual({ state: 'unavailable' });
});

test('network failure returns a retryable state', async () => {
  const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('network detail'));
  expect(await createAuthClient(request).session()).toEqual({ state: 'unavailable' });
});

test('logout sends the memory-only CSRF value and cookies to the same origin', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
  expect(await createAuthClient(request).logout('memory-csrf')).toBe('signed-out');
  expect(request).toHaveBeenCalledExactlyOnceWith('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', headers: { 'X-CSRF-Token': 'memory-csrf' } });
});

test.each([[401, 'expired'], [403, 'failed'], [500, 'failed'], [200, 'failed']] as const)('logout status %s maps truthfully to %s', async (status, result) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
  expect(await createAuthClient(request).logout('csrf')).toBe(result);
});

test('logout network errors do not claim success', async () => {
  const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('network detail'));
  expect(await createAuthClient(request).logout('csrf')).toBe('failed');
});
