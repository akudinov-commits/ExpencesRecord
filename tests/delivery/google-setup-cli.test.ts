import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
const entry = fileURLToPath(new URL('../../apps/api/src/setup-google.ts', import.meta.url));
test('the operator command rejects unexpected modes without starting a server or exposing configuration', () => {
  const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), entry, 'unexpected-mode'], { encoding: 'utf8', env: { ...process.env, GOOGLE_CLIENT_SECRET: 'synthetic-private-secret' } });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Usage: setup-google owner|sheets|probe');
  expect(result.stderr + result.stdout).not.toContain('synthetic-private-secret');
});

test('operator usage advertises separate write consent and a nonmutating writer probe', () => {
  const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), entry, 'unexpected-mode'], { encoding: 'utf8' });
  expect(result.status).toBe(1); expect(result.stderr).toContain('|sheets-write|probe-write');
});

test.each([['setup:google:sheets-write', 'sheets-write'], ['check:google:sheets-write', 'probe-write']])('explicit operator command %s selects only its intended mode', (name, mode) => {
  const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> };
  expect(manifest.scripts[name]).toBe(`node --env-file=.env --import tsx apps/api/src/setup-google.ts ${mode}`);
});
