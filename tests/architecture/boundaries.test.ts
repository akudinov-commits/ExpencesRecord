import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = join(root, 'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs');
const config = join(root, '.dependency-cruiser.cjs');

function inspect(fixture: string) {
  const result = spawnSync(process.execPath, [cli, '--config', config, '--output-type', 'json', 'apps', 'packages'], {
    cwd: join(root, 'tests/architecture/fixtures', fixture), encoding: 'utf8',
  });
  expect(result.error).toBeUndefined();
  expect(result.stdout, result.stderr).not.toBe('');
  const report: { summary: { violations: { rule: { name: string } }[] } } = JSON.parse(result.stdout);
  // The JSON reporter always exits zero; verify the actual CI gate separately.
  const gate = spawnSync(process.execPath, [cli, '--config', config, '--output-type', 'err', 'apps', 'packages'], {
    cwd: join(root, 'tests/architecture/fixtures', fixture), encoding: 'utf8',
  });
  expect(gate.error).toBeUndefined();
  return { status: gate.status, rules: report.summary.violations.map(({ rule }) => rule.name), diagnostic: gate.stdout + gate.stderr };
}

describe('source dependency boundaries', () => {
  test('permits inward ports, composition and frontend wire contracts', () => {
    expect(inspect('allowed')).toMatchObject({ status: 0, rules: [] });
  });

  let denied: ReturnType<typeof inspect>;
  beforeAll(() => { denied = inspect('forbidden'); });

  test.each([
    'application-no-outward',
    'application-no-external',
    'frontend-no-backend',
    'frontend-no-node-or-backend-sdk',
    'contracts-only-wire-types',
    'controllers-no-infrastructure',
    'infrastructure-only-inward',
    'no-circular-dependencies',
    'no-unresolved',
  ])('rejects %s and names the violated boundary', (rule) => {
    expect(denied.rules).toContain(rule);
    expect(denied.status).not.toBe(0);
    expect(denied.diagnostic).toContain(rule);
  });
});
