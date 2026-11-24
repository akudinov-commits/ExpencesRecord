import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, expect, test } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });

function fixture() {
  const target = mkdtempSync(join(tmpdir(), 'expences-bootstrap-'));
  temporary.push(target);
  for (const path of ['CLAUDE.md', '.github/copilot-instructions.md', 'docs/architecture/overview.md', '.ignix/review-instructions.md', 'template-readme.md', 'adr/001-layer-boundaries.md', 'prompts/readme.md', 'prompts/session-start.md', 'prompts/execution.md']) {
    mkdirSync(dirname(join(target, path)), { recursive: true });
    copyFileSync(join(root, path), join(target, path));
  }
  return target;
}
function verify(target: string) {
  const windows = process.platform === 'win32';
  return spawnSync('pwsh', ['-NoProfile', ...(windows ? ['-ExecutionPolicy', 'Bypass'] : []), '-File', join(root, 'scripts/verify-bootstrap.ps1'), '-RepoRoot', target], { encoding: 'utf8' });
}
function marker() { return '<'.repeat(2) + 'EXAMPLE' + '>'.repeat(2); }

test('bootstrap verification excludes dependencies and generated artifacts', () => {
  const target = fixture();
  for (const directory of ['node_modules/dependency', 'apps/web/dist', '.vercel/output', 'coverage', '.git']) {
    mkdirSync(join(target, directory), { recursive: true });
    writeFileSync(join(target, directory, 'example.md'), marker());
  }
  const result = verify(target);
  expect(result.error).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
});

test('bootstrap verification still rejects a real source placeholder', () => {
  const target = fixture();
  mkdirSync(join(target, 'apps/api/src'), { recursive: true });
  writeFileSync(join(target, 'apps/api/src/unfinished.ts'), marker());
  const result = verify(target);
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('unfinished.ts');
});
