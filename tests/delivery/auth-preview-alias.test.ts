import { expect, test, vi } from 'vitest';
import { assignAuthPreview, planAuthPreview } from '../../scripts/assign-auth-preview.js';
const input = { branchRef: 'refs/heads/feature/safe-expense-registration-backend', alias: 'expences-record-auth-preview.vercel.app', deploymentUrl: 'https://expences-record-synthetic123-akudinov-7567.vercel.app' };
test('plans only the explicitly approved authentication Preview alias for this feature', () => {
  expect(planAuthPreview(input)).toEqual({ alias: input.alias, deploymentUrl: input.deploymentUrl });
});
test.each(['refs/heads/feature/spreadsheet-mapping-configuration', 'refs/heads/feature/google-login-private-access', 'refs/heads/main', 'refs/heads/feature/another-feature', 'refs/pull/1/merge'])('branch %s cannot move the auth Preview alias', (branchRef) => {
  const run = vi.fn(() => 0);
  expect(planAuthPreview({ ...input, branchRef })).toBeNull();
  expect(assignAuthPreview({ ...input, branchRef }, run)).toBeUndefined();
  expect(run).not.toHaveBeenCalled();
});
test('missing alias configuration fails explicitly before invoking the deployment tool', () => {
  expect(() => planAuthPreview({ branchRef: input.branchRef, deploymentUrl: input.deploymentUrl })).toThrow('AUTH_PREVIEW_ALIAS is required');
});
test.each(['expences-record.vercel.app', 'example.com', 'expences-record-auth-preview.vercel.app;echo unsafe'])('unapproved alias %s is rejected', (alias) => {
  expect(() => planAuthPreview({ ...input, alias })).toThrow('Unapproved authentication Preview alias');
});
test.each(['http://expences-record-synthetic123-akudinov-7567.vercel.app', 'https://attacker.example', 'https://expences-record-synthetic123-akudinov-7567.vercel.app/path', 'https://expences-record-synthetic123-akudinov-7567.vercel.app/?token=synthetic', 'https://user:password@expences-record-synthetic123-akudinov-7567.vercel.app'])('invalid deployment URL %s is rejected', (deploymentUrl) => {
  expect(() => planAuthPreview({ ...input, deploymentUrl })).toThrow('Invalid checked Preview deployment URL');
});
test('uses the deployment alias API with explicit account scope and no user lookup or credential flags', () => {
  const run = vi.fn(() => 0);
  assignAuthPreview(input, run);
  expect(run).toHaveBeenCalledExactlyOnceWith(['exec', '--yes', '--package=vercel@66.6.0', '--', 'vercel', 'api', '/v2/deployments/expences-record-synthetic123-akudinov-7567.vercel.app/aliases?slug=akudinov-7567', '--method', 'POST', '--raw-field', `alias=${input.alias}`, '--silent']);
});
test('alias command failure stops delivery rather than reporting a successful stable Preview', () => {
  expect(() => assignAuthPreview(input, () => 1)).toThrow('Preview alias assignment failed');
});
