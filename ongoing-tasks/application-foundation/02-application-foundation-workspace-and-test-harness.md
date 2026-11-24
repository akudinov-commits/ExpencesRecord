# 02 — Application foundation and delivery — Establish workspace and runnable test harness

## Goal

Establish workspace and runnable test harness within the approved foundation scope. This is a future execution specification; creating this file does not execute the step.

## Track

cross-cutting / tooling

## What Exists

- Step 01 defines approved tools, versions, workspace paths and check commands.
- The repository currently provides only documentation and the bootstrap verifier.

## What to Build

- During implementation, create the approved package/workspace manifests, lockfile and strict TypeScript/build/test configuration at the paths selected in step 01.
- Establish frontend interaction, application-unit and Fastify/API test harnesses before any production behavior is implemented. Add only approved lint/type tooling and local artifact ignores.
- Establish reproducible install/check/build commands. Distinguish harness smoke checks from meaningful behavior RED; a missing import/compiler error is not sufficient RED evidence.
- Do not add domain use cases, expense APIs, Google SDK integration or runtime behavior in this tooling step.

## Acceptance Criteria

- [ ] A fresh checkout can install the pinned toolchain/dependencies using the documented command (clean-checkout verification).
- [ ] Approved type/lint/test harness commands run; empty suites are not reported as behavioral coverage (command results).
- [ ] The harness can run a controlled assertion failure and return nonzero, then pass after the fixture is corrected (harness verification, distinguished from application TDD).
- [ ] Strict TypeScript checks are enabled and no application behavior, secrets or production connections are added (config/diff review).

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
- Depends on: [01 — Complete interview and confirm foundation decisions](01-application-foundation-interview-and-decisions.md) must be complete before execution.
