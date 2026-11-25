import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test } from 'vitest';
import { createNodeHandler } from '../../api/index.js';
import { createConfiguredApp } from '../../apps/api/src/bootstrap/runtime.js';
import { authEnvironment } from '../../apps/api/test/support/config.js';

test('the real Node hosting adapter serves the same protected API and configured login flow', async () => {
  const app = createConfiguredApp(authEnvironment, false);
  const handler = createNodeHandler(() => app);
  const server = createServer((request, response) => { void handler(request, response); });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    expect((await fetch(`${origin}/api/auth/session`)).status).toBe(401);
    const login = await fetch(`${origin}/api/auth/login`, { redirect: 'manual' });
    expect(login.status).toBe(303);
    expect(login.headers.get('location')).toBe('https://auth.example.test/api/auth/login');
    expect(await (await fetch(`${origin}/api/health`)).json()).toEqual({ status: 'ok' });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await app.close();
  }
});

test('runtime configuration failures become an explicit unavailable response without leaking values', async () => {
  const handler = createNodeHandler(() => { throw new Error('sensitive-config-value'); });
  const server = createServer((request, response) => { void handler(request, response); });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/health`);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: 'service_unavailable' } });
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});
