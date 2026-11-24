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
The user approved the code/test tree and instructed execution. Use one project rooted at the repository: static FE output apps/web/dist, a thin api/index.ts Node handler forwarding to independently constructed Fastify, and /api/* rewrites. GitHub Foundation workflow requires quality checks before opt-in preview deployment; vercel.json disables automatic Git deployment. Node 24 is pinned. Real GitHub/Vercel execution depends on user account access and is not established by local tests/builds. No production rollout is part of this feature.

Primary references: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Git configuration](https://vercel.com/docs/project-configuration/git-configuration), [GitHub Actions deployment pattern](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).
