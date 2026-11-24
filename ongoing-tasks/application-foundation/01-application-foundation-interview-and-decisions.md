# 01 — Application foundation and delivery — Complete interview and confirm foundation decisions

## Goal

Complete interview and confirm foundation decisions within the approved foundation scope. This is a future execution specification; creating this file does not execute the step.

## Track

cross-cutting / documentation

## What Exists

- The approved seven-feature plan is recorded in [ongoing-tasks/readme.md](../readme.md).
- React/strict TypeScript, Node.js/TypeScript/Fastify, Vercel and the logical layer boundaries are accepted.
- Bootstrap documents were applied from the conversation; the prescribed structured interview was not completed. Existing bootstrap inputs remain available.
- No application source, manifests, tests or workflow exists.

## What to Build

- Complete the missing bootstrap interview using `prompts/bootstrap/02-interview.md`, reusing answered questions and surfacing only remaining decisions. Correct bootstrap records to distinguish file application from interview completion.
- Confirm foundation versions/package manager, workspace paths, frontend build tooling, test runners, type/lint tools, boundary-check mechanism and exact runnable commands. Research current compatibility before proposing choices; do not install anything until decisions are approved.
- Confirm minimal shell/health behavior and Vercel FE/BE packaging, GitHub check triggers and one deployment owner. Keep production rollout in feature 7.
- Record approval provenance in the checklist/appropriate decision records; update ADR 004 only as needed for approved delivery details. Record that Google sessions/access, formula grammar and safe concurrent writes are separate later decisions, not implicitly approved here.

## Acceptance Criteria

- [ ] The interview is completed and reconciled with existing decisions; no already-approved choice is needlessly reopened (document review).
- [ ] Foundation tooling, paths, commands, minimal shell/health contract and preview packaging have explicit decisions before steps 02–05 execute (document review).
- [ ] Authentication remains mandatory for business endpoints; any login/callback exception is reserved for explicit design in feature 2 (document review).
- [ ] No source, manifests, installs or cloud resources are produced by this decision step (diff review).

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
- [Bootstrap interview prompt](../../prompts/bootstrap/02-interview.md)
- [Current bootstrap inputs](../_bootstrap/decisions.md)
- Depends on: no earlier implementation step. The initial planning-only restriction was superseded by the user’s later tooling/tree approval and explicit execution/merge/push request; see checklist Notes.
