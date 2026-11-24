# 004 — Vercel hosting and portable deployment

## Status
Accepted — 2026-11-24.

## Context
The user selected Vercel and wants simple GitHub delivery plus the ability to change hosts later.

## Decision
Target Vercel with portable React assets and a Fastify application behind a thin host adapter. Keep business logic, Google SDK access and configuration behind the agreed boundaries. GitHub delivery must run checks before deployment; exact workflow, artifact packaging and deployment ownership will be selected in the foundation/deployment features, not during documentation bootstrap.

## Consequences
Moving to another Node host should replace deployment/wiring rather than application policy. Provider limits, sessions and distributed write coordination still need design. No CI, deployment or hosting resources are created by this decision.


## Foundation implementation detail — 2026-11-24
The user approved the code/test tree and instructed execution. Use one project rooted at the repository: static FE output apps/web/dist, a thin api/index.ts Node handler forwarding to independently constructed Fastify, and /api/* rewrites. GitHub Foundation workflow requires quality checks before opt-in preview deployment; vercel.json disables automatic Git deployment. Node 24 is pinned. Actual GitHub checks and Preview delivery with protected health verification pass; see the foundation checklist. Product production rollout remains feature 7; the explicitly approved one-time foundation initialization exception is recorded below.

Primary references: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Git configuration](https://vercel.com/docs/project-configuration/git-configuration), [GitHub Actions deployment pattern](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

## One-time project initialization exception — 2026-11-24
Vercel requires the first deployment of a new project to target Production. After an explicit Preview attempt was rejected, the user approved one foundation-only initialization using --prod --skip-domain, from a clean checkout of a CI-checked commit. Vercel reported no production-domain assignment. This approved manual initialization is the sole exception to GitHub Actions ownership; the checked workflow continues to target Preview only. Full product production rollout remains feature 7. Protected health verification uses Vercel CLI's documented automation access without disabling Deployment Protection.

References: [first-deployment domain behavior](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting), [staged production deployment](https://vercel.com/docs/cli/deploying-from-cli), [authenticated CLI requests](https://vercel.com/docs/cli/curl).
