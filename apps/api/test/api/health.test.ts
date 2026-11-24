import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createApp } from '../../src/bootstrap/create-app.js';

describe('public health and closed business surface', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp({ logger: false }); });
  afterEach(async () => { await app.close(); });

  test('GET /api/health returns only an operational status', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['content-type']).toContain('application/json');
  });

  test.each(['GET', 'POST'] as const)('does not expose a %s expense endpoint', async (method) => {
    const response = await app.inject({ method, url: '/api/expenses' });
    expect(response.statusCode).toBe(404);
  });

  test('does not turn health into a write endpoint', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/health' })).statusCode).toBe(404);
  });
});
