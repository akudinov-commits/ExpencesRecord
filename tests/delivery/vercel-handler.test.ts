import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, expect, test } from 'vitest';
import handler from '../../api/index.js';

const server = createServer((request, response) => {
  void handler(request, response).catch((error: Error) => response.destroy(error));
});
let origin: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => { server.close((error) => error ? reject(error) : resolve()); }); });

test('the Vercel adapter serves the real Fastify health route over HTTP', async () => {
  const response = await fetch(`${origin}/api/health`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('the adapter preserves the closed expense route', async () => {
  expect((await fetch(`${origin}/api/expenses`)).status).toBe(404);
});
