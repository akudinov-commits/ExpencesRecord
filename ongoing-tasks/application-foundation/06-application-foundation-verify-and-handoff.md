# 06 — Application foundation and delivery — Verify foundation and document implementation handoff

## Goal

Verify foundation and document implementation handoff within the approved foundation scope. This is a future execution specification; creating this file does not execute the step.

## Track

cross-cutting / verification

## What Exists

- Steps 01–05 produce the foundation during later implementation, with test and pipeline evidence recorded in this checklist.
- Features 2–7 remain roadmap entries; they have not been scaffolded or implemented.

## What to Build

- Verify a clean-checkout install, all agreed checks, minimal shell behavior, dependency guards, build artifacts and the actual preview-delivery state.
- Reconcile README, architecture, active recipes and instruction mirrors with actual created paths/tooling/commands; replace stale statements only when implementation exists.
- Review controller/application/infrastructure separation and route exposure. Record pending feature-2 auth decisions and later spreadsheet/concurrency dependencies without solving them here.
- Report actual results/blockers, obtain human completion review and only then archive the feature pair. Do not create a separate task-summary document.

## Acceptance Criteria

- [ ] All preceding acceptance criteria are met, affected checks pass and actual results are recorded without invented test/deployment claims (evidence review).
- [ ] A clean-checkout run follows the documented commands and enforces the agreed layer boundaries (reproduction verification).
- [ ] Actual routes and runtime artifacts contain no expense/Google integration or unauthorized business endpoint (security/code review).
- [ ] Project instructions/mirror and links match actual implemented state; remaining decisions belong to named later roadmap features (document review).
- [ ] Completion is reported for human review before archiving; no production release is implied (lifecycle review).

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
- Depends on: [05 — Prepare checked GitHub and Vercel preview delivery](05-application-foundation-github-and-vercel-delivery.md) must be complete before execution.
