# 004 — Vercel hosting and portable deployment

## Status
Accepted — 2026-11-24.

## Context
The user selected Vercel and wants simple GitHub delivery plus the ability to change hosts later.

## Decision
Target Vercel with portable React assets and a Fastify application behind a thin host adapter. Keep business logic, Google SDK access and configuration behind the agreed boundaries. GitHub delivery must run checks before deployment; exact workflow, artifact packaging and deployment ownership will be selected in the foundation/deployment features, not during documentation bootstrap.

## Consequences
Moving to another Node host should replace deployment/wiring rather than application policy. Provider limits, sessions and distributed write coordination still need design. No CI, deployment or hosting resources are created by this decision.
