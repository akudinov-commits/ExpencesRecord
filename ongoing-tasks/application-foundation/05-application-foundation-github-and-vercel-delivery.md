# 05 — Application foundation and delivery — Prepare checked GitHub and Vercel preview delivery

## Goal

Prepare checked GitHub and Vercel preview delivery within the approved foundation scope. This is a future execution specification; creating this file does not execute the step.

## Track

delivery / configuration

## What Exists

- Steps 01–04 establish the approved deployment owner/packaging, runnable checks and buildable minimal shells.
- ADR 004 selects Vercel and portable hosting boundaries; no deployment workflow exists today.

## What to Build

- During implementation, create the approved GitHub check/deployment configuration and thin Vercel host configuration only after validating current official platform requirements.
- Require install/type/lint/test/boundary/build checks before preview delivery. Configure one deployment owner to avoid parallel automatic and pipeline deployments bypassing those gates.
- Verify failing checks block delivery and passing checks build the intended FE/BE artifacts. Use approved isolated verification/dry runs as appropriate; do not equate syntax validation with a deployed preview.
- Document external account/project/secret prerequisites and exact local/pipeline commands. No real Google credentials, production data, production deployment or paid resources belong to this feature.

## Acceptance Criteria

- [ ] The approved check commands run in GitHub and failed required checks prevent the configured preview deployment path (pipeline verification).
- [ ] Build artifacts include the intended frontend and portable backend entry point without duplicate deployment ownership (artifact/config verification).
- [ ] Preview configuration contains no production financial data or credentials and does not expose business endpoints (config/security review).
- [ ] Any unavailable account/project prerequisite is recorded as a blocker; deployment is not marked verified solely from a successful build (actual evidence review).

## References

- [Feature checklist](../application-foundation-checklist.md)
- [Feature architecture](feature-architecture.md)
- [Accepted boundaries](../../adr/001-layer-boundaries.md)
- [Vercel decision](../../adr/004-vercel-and-portability.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Execution protocol](../../prompts/execution.md)
- [Task workflow](../../docs/methodology/task-workflow.md)
- [Node recipe](../../docs/methodology/node-service.md)
- [React recipe](../../docs/methodology/react-ui.md)
- Depends on: [04 — Build minimal frontend and portable backend shells](04-application-foundation-minimal-application-shells.md) must be complete before execution.
