# 03 — Application foundation and delivery — Enforce architecture dependency boundaries

## Goal

Enforce architecture dependency boundaries within the approved foundation scope. This is a future execution specification; creating this file does not execute the step.

## Track

cross-cutting / architecture checks

## What Exists

- Steps 01–02 establish the approved module paths, dependency-check tool and runnable harness.
- Accepted ADR 001 defines API → application and infrastructure → application-owned ports; composition wires concrete modules.

## What to Build

- Configure checks over the approved source/package boundaries: application cannot depend on API/infrastructure/framework/SDK/env-loading modules; FE cannot import backend internals; shared contracts cannot import backend policy or SDK types.
- Add controlled positive/negative fixtures proving allowed imports pass and forbidden edges fail. Do not add dummy production abstractions to manufacture dependencies.
- Record meaningful RED before configuring the missing rule, GREEN after implementation and rerun results. Define review checks for policy placement that import tooling cannot prove.

## Acceptance Criteria

- [ ] Fixtures prove valid inward dependencies pass and application → infrastructure/framework, FE → backend internals and contracts → backend/SDK imports fail (automated boundary checks).
- [ ] Exact RED/GREEN/rerun evidence is recorded in checklist Notes (TDD evidence review).
- [ ] The checker fails with a useful violated-boundary diagnostic and does not require speculative production interfaces (automated checks and diff review).
- [ ] Documentation distinguishes automated dependency checks from manual review of business-policy placement (document review).

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
- Depends on: [02 — Establish workspace and runnable test harness](02-application-foundation-workspace-and-test-harness.md) must be complete before execution.
