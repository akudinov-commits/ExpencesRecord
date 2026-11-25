import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = join(root, 'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs');

test.each([
  ['auth-google-forbidden', 'controllers-no-google-sdk'],
  ['auth-crypto-forbidden', 'controllers-no-session-crypto'],
])('%s cannot move identity/session mechanics into controllers or the frontend', (fixture, controllerRule) => {
  const config = join(root, '.dependency-cruiser.cjs');
  const options = { cwd: join(root, 'tests/architecture/fixtures', fixture), encoding: 'utf8' as const };
  const result = spawnSync(process.execPath, [cli, '--config', config, '--output-type', 'json', 'apps'], options);
  expect(result.error).toBeUndefined();
  const report: { summary: { violations: { rule: { name: string } }[] } } = JSON.parse(result.stdout);
  const rules = report.summary.violations.map((violation) => violation.rule.name);
  expect(rules).toContain('frontend-no-node-or-backend-sdk');
  expect(rules).toContain(controllerRule);
  expect(rules).toContain('application-no-external');
  const gate = spawnSync(process.execPath, [cli, '--config', config, '--output-type', 'err', 'apps'], options);
  expect(gate.status).not.toBe(0);
});
