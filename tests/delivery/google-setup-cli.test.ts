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
