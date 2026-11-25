import { expect, test } from 'vitest';
import { createServer } from 'vite';
import { createConfiguredApp } from '../../apps/api/src/bootstrap/runtime.js';
import { authEnvironment } from '../../apps/api/test/support/config.js';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

async function removeOperatorDirectory(directory: string) {
  if (dirname(resolve(directory)) !== resolve(tmpdir()) || !basename(directory).startsWith('expences-operator-cli-')) throw new Error('Unexpected test cleanup target');
  await rm(directory, { recursive: true, force: true });
}

test('local frontend proxies authentication without changing the configured browser origin', async () => {
  const api = createConfiguredApp({ ...authEnvironment, APP_ORIGIN: 'http://localhost:5173' }, false);
  const web = await createServer({ root: 'apps/web', server: { open: false } });
  try {
    await api.listen({ host: '127.0.0.1', port: 3001 });
    await web.listen();
    const health = await fetch('http://localhost:5173/api/health');
    expect(health.headers.get('content-type')).toContain('application/json');
    expect(await health.json()).toEqual({ status: 'ok' });
    expect((await fetch('http://localhost:5173/api/auth/session')).status).toBe(401);
    const login = await fetch('http://localhost:5173/api/auth/login', { redirect: 'manual' });
    expect(login.status).toBe(303);
    expect(new URL(login.headers.get('location') ?? '').searchParams.get('redirect_uri')).toBe('http://localhost:5173/api/auth/callback');
    expect(login.headers.get('set-cookie')).toContain('expences_oauth_dev=');
  } finally { await web.close(); await api.close(); }
});

test.each(['owner', 'sheets'])('the separate %s operator command serves only localhost consent and cannot auto-save a visitor', async (mode) => {
  const directory = await mkdtemp(join(tmpdir(), 'expences-operator-cli-'));
  const entry = fileURLToPath(new URL('../../apps/api/src/setup-google.ts', import.meta.url));
  await writeFile(join(directory, '.env.google-client.json'), JSON.stringify({ web: { client_id: authEnvironment.GOOGLE_CLIENT_ID, client_secret: 'synthetic-registration-secret', redirect_uris: ['http://localhost:5173/api/auth/callback'] } }));
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), entry, mode], { cwd: directory, env: { ...process.env, ...authEnvironment }, stdio: ['pipe', 'pipe', 'pipe'] });
  const stopped = new Promise<void>((resolve) => child.once('exit', () => resolve()));
  let output = ''; child.stdout.on('data', (data: Buffer) => { output += data.toString(); }); child.stderr.on('data', (data: Buffer) => { output += data.toString(); });
  try {
    await new Promise<void>((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error('Operator command did not expose the local setup start')), 15000);
      child.stdout.on('data', () => { if (output.includes('Open http://localhost:5173')) { clearTimeout(deadline); resolve(); } });
      child.once('exit', () => { clearTimeout(deadline); reject(new Error('Operator command exited before local consent start')); });
    });
    const response = await fetch('http://localhost:5173/', { redirect: 'manual' });
    expect(response.status).toBe(303);
    const url = new URL(response.headers.get('location') ?? '');
    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('access_type')).toBe(mode === 'owner' ? 'online' : 'offline');
    expect(url.searchParams.get('scope')?.includes('spreadsheets.readonly')).toBe(mode === 'sheets');
    const reopened = await fetch('http://localhost:5173/', { redirect: 'manual' });
    expect(reopened.status).toBe(303);
    expect(reopened.headers.get('location')).toBe(response.headers.get('location'));
    expect(output).not.toMatch(/synthetic-(?:registration-secret|client-secret|owner-subject)/);
    await expect(readFile(join(directory, '.env'))).rejects.toMatchObject({ code: 'ENOENT' });
  } finally {
    if (child.exitCode === null) child.kill();
    await stopped;
    await removeOperatorDirectory(directory);
  }
});
