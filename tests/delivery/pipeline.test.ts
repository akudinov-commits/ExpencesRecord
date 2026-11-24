import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from 'yaml';
import { expect, test } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
interface Job { needs?: string[]; if?: string; 'continue-on-error'?: boolean; steps?: { run?: string; 'continue-on-error'?: boolean }[] }
interface Workflow { on?: Record<string, unknown>; permissions?: { contents?: string }; jobs?: Record<string, Job> }
const pipeline: Workflow = parse(readFileSync(join(root, '.github/workflows/foundation.yml'), 'utf8'));

test('required quality checks fail closed before preview deployment', () => {
  const checks = pipeline.jobs?.checks;
  expect(checks).toBeDefined();
  expect(checks?.['continue-on-error']).not.toBe(true);
  const steps = checks?.steps ?? [];
  expect(steps.some((step) => step.run?.includes('npm ci'))).toBe(true);
  expect(steps.some((step) => step.run === 'npm run check')).toBe(true);
  expect(steps.some((step) => step['continue-on-error'] === true)).toBe(false);
  expect(pipeline.jobs?.preview?.needs).toContain('checks');
  expect(pipeline.jobs?.preview?.if).not.toContain('always()');
});

test('preview delivery is opt-in and never runs untrusted PR code with secrets', () => {
  expect(pipeline.permissions?.contents).toBe('read');
  expect(pipeline.on).not.toHaveProperty('pull_request_target');
  const condition = pipeline.jobs?.preview?.if ?? '';
  expect(condition).toContain("vars.VERCEL_PREVIEW_ENABLED == 'true'");
  expect(condition).toContain("github.event_name == 'push'");
  expect(condition).toContain("github.event_name == 'workflow_dispatch'");
  expect(condition).not.toContain("github.event_name == 'pull_request'");
});

test('one Vercel project serves static UI and API without parallel Git deployments', () => {
  const config: { outputDirectory?: string; git?: { deploymentEnabled?: boolean }; rewrites?: { source: string; destination: string }[] } = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  expect(config.outputDirectory).toBe('apps/web/dist');
  expect(config.git?.deploymentEnabled).toBe(false);
  expect(config.rewrites).toEqual([{ source: '/api/:path*', destination: '/api/index' }]);
});
