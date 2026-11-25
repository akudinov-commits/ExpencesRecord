import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { authEnvironment } from '../../apps/api/test/support/config.js';

test('local startup uses the same required configured authentication composition', async () => {
  const reservation = createServer();
  await new Promise<void>((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = (reservation.address() as AddressInfo).port;
  await new Promise<void>((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()));
  const child = spawn(process.execPath, ['--import', 'tsx', 'apps/api/src/server.ts'], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), env: { ...process.env, ...authEnvironment, HOST: '127.0.0.1', PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (chunk: Buffer) => { logs += chunk.toString(); });
  child.stderr.on('data', () => { /* Deliberately do not print process configuration or external error details. */ });
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Local test server did not become ready')), 15000);
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('exit', () => { clearTimeout(timeout); reject(new Error('Local test server exited before verification')); });
      child.stdout.on('data', () => { if (logs.includes('Server listening')) { clearTimeout(timeout); resolve(); } });
    });
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/session`);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'unauthenticated' } });
  } finally { child.kill(); }
});
