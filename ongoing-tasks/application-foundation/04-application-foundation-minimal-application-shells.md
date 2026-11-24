# 04 — Application foundation and delivery — Build minimal frontend and portable backend shells

## Goal

Build minimal frontend and portable backend shells within the approved foundation scope. This is a future execution specification; creating this file does not execute the step.

## Track

frontend / backend / composition

## What Exists

- Steps 01–03 provide approved minimal shell/health contracts, a runnable harness and dependency checks.
- No authentication or expense behavior is implemented by this feature.

## What to Build

- Write/run the approved shell interaction/API tests first, then implement only the minimum React shell and portable Fastify app construction.
- Keep server startup/host adaptation separate from Fastify construction; wire concrete configuration only in composition. Establish the approved module layout without speculative use cases, ports or adapters.
- If step 01 approves health, implement its minimal anonymous response through TDD; introduce no business endpoints, demo expense data, login mocks or permissive route guards.
- Verify strict types/build and that application/infrastructure/controllers remain within the approved boundaries.

## Acceptance Criteria

- [ ] The minimal frontend renders the approved shell; meaningful RED precedes implementation and GREEN follows (interaction test and evidence).
- [ ] Fastify app construction can be exercised in-process without opening a listening port (API/harness test).
- [ ] Any approved health response is minimal and tested before implementation; no other business endpoints are exposed (API tests and route review).
- [ ] Type/build/import-boundary checks pass; no business rules or SDK/environment dependencies leak into application (automated checks and code review).

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
- Depends on: [03 — Enforce architecture dependency boundaries](03-application-foundation-dependency-boundaries.md) must be complete before execution.
