import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AuthPreviewInput { branchRef: string; alias?: string; deploymentUrl: string }
export function planAuthPreview(input: AuthPreviewInput): { alias: string; deploymentUrl: string } | null {
  if (input.branchRef !== 'refs/heads/feature/safe-expense-registration-backend') return null;
  if (!input.alias) throw new Error('AUTH_PREVIEW_ALIAS is required');
  if (input.alias !== 'expences-record-auth-preview.vercel.app') throw new Error('Unapproved authentication Preview alias');
  let url: URL;
  try { url = new URL(input.deploymentUrl); } catch { throw new Error('Invalid checked Preview deployment URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/'
    || !/^expences-record-[a-z0-9-]+-akudinov-7567\.vercel\.app$/.test(url.hostname)) throw new Error('Invalid checked Preview deployment URL');
  return { alias: input.alias, deploymentUrl: url.origin };
}
export function assignAuthPreview(input: AuthPreviewInput, run: (args: string[]) => number | null): void {
  const plan = planAuthPreview(input);
  if (!plan) return;
  const endpoint = `/v2/deployments/${new URL(plan.deploymentUrl).hostname}/aliases?slug=akudinov-7567`;
  const status = run(['exec', '--yes', '--package=vercel@66.6.0', '--', 'vercel', 'api', endpoint, '--method', 'POST', '--raw-field', `alias=${plan.alias}`, '--silent']);
  if (status !== 0) throw new Error('Preview alias assignment failed');
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    const alias = process.env.AUTH_PREVIEW_ALIAS;
    assignAuthPreview({ branchRef: process.env.GITHUB_REF ?? '', deploymentUrl: process.argv[2] ?? '', ...(alias ? { alias } : {}) }, (args) => {
      const windows = process.platform === 'win32';
      return spawnSync(windows ? 'npm.cmd' : 'npm', args, { stdio: 'inherit', shell: windows }).status;
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Preview alias assignment failed');
    process.exitCode = 1;
  }
}
