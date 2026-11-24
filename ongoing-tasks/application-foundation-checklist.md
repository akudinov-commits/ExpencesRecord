# Application foundation and delivery

## Goal

Establish a buildable, testable React/TypeScript and Fastify/TypeScript foundation with enforced layer dependencies and checked GitHub/Vercel preview delivery. Current status: implementation in progress on feature/application-foundation.

## Scope

- **In scope:** finish the missing bootstrap interview; confirm foundation choices; create the selected workspace/test harness, dependency guards, minimal shells and GitHub/Vercel preview setup during future execution.
- **Planning now:** record the agreed seven-feature roadmap and scaffold this feature from `ongoing-tasks/_template`, without running the implementation steps.
- **Out of scope:** Google login/access implementation, expense APIs/formulas, spreadsheet reads/writes, preferences, full PWA behavior, production rollout, extra database and paid resources.
- **Dependencies:** [approved roadmap](readme.md), [architecture](../docs/architecture/overview.md), [ADR 001](../adr/001-layer-boundaries.md), [ADR 004](../adr/004-vercel-and-portability.md) and [ADR 006](../adr/006-tdd-and-feature-scope.md).
- **Decision gate:** step 01 resolves missing interview/foundation choices. Reuse accepted decisions; do not install unselected tools or silently resolve new architecture. Google access and concurrent writes remain later-feature decisions.

## Architecture

See [feature-architecture.md](application-foundation/feature-architecture.md) for planned pipeline, components, data flow, stores, extension points and security boundaries. All runtime components remain planned.

## Steps

- [x] [01 — Complete interview and confirm foundation decisions](application-foundation/01-application-foundation-interview-and-decisions.md): complete the prescribed interview and confirm foundation tooling, structure and preview-delivery decisions.
- [x] [02 — Establish workspace and runnable test harness](application-foundation/02-application-foundation-workspace-and-test-harness.md): configure the approved workspace and runnable checks before production behavior.
- [x] [03 — Enforce architecture dependency boundaries](application-foundation/03-application-foundation-dependency-boundaries.md): prove permitted/forbidden imports with automated checks and recorded RED/GREEN evidence.
- [x] [04 — Build minimal frontend and portable backend shells](application-foundation/04-application-foundation-minimal-application-shells.md): test first, then create only the approved React/Fastify shells and minimal health if agreed.
- [ ] [05 — Prepare checked GitHub and Vercel preview delivery](application-foundation/05-application-foundation-github-and-vercel-delivery.md): run required checks before a single preview deployment path; verify actual delivery state.
- [ ] [06 — Verify foundation and document implementation handoff](application-foundation/06-application-foundation-verify-and-handoff.md): reproduce checks, reconcile documentation and hand off for review before archiving.

## Notes

- 2026-11-24: The user agreed to the seven-feature high-level plan and authorized recording it plus scaffolding feature 1 only. The user explicitly prohibited starting code. Approval of the roadmap does not authorize executing these steps in this turn.
- 2026-11-24: Copied/adapted the checklist, architecture and step templates; all six implementation steps remain unchecked. Future feature entries are recorded in the roadmap without scaffolding their folders.
- 2026-11-24: Bootstrap file application passed structural checks, but the formal interview was omitted. Step 01 explicitly closes that gap; no claim is made that the interview has already happened.
- TDD for future execution: meaningful observed RED → minimal implementation → GREEN → refactor → rerun for every behavior change. Record exact test identities/commands/results here. Harness/compiler failures alone do not prove behavior RED. Missing required checks leave steps incomplete.
- 2026-11-24 planning verification: all checklist/architecture/step sections match the templates; all six execution steps remain unchecked; 86 local document links resolve; instruction mirror is unchanged; `git diff --check` passes. The existing bootstrap verifier reports 11 passes, 1 expected retained-input cleanup warning and 0 failures. These structural results do not establish interview completion. Application RED/GREEN is not applicable because no application behavior is written.
- Security: all business endpoints require authentication and application authorization. Minimal health is the existing public exception; login/callback exceptions require explicit feature-2 approval. No Google or production connections are established now.

- 2026-11-24 execution: user approved tooling, reviewed/approved the complete code/test tree and instructed implementation, merge to main and push. Step 01 reconciled prior interview answers and those explicit approvals in `_bootstrap/decisions.md`; no claim that earlier separate questions occurred. Minimal shell/health, config and preview delivery details are recorded there. Vercel authentication/project setup is not present on this laptop and will be handled as an external prerequisite, not claimed as deployed.

- Step 02: pinned dependency install and `npm ci --no-audit --no-fund` succeeded (282 packages). Harness `npm test -- --reporter=dot`: controlled assertion produced 1 failed/2 passed, exit 1; corrected assertion produced 3 passed, exit 0. This is harness verification, not application TDD. `npm run typecheck` and `npm run lint` passed after scoping TypeScript-only lint rules to TypeScript files.
- Step 03 RED: `npm test -- --project=tooling tests/architecture/boundaries.test.ts --reporter=dot` with empty rules produced 9 assertion failures and 1 allowed-dependency pass. An earlier incorrect CLI path was a harness failure and is not counted as RED.
- Step 03 GREEN: same command produced 10/10 passing after implementing inward dependency, external dependency, frontend/backend, contracts, controller/infrastructure, cycle and unresolved-import rules. The tests verify both named JSON violations and the actual error-reporter nonzero exit; JSON output alone always exits zero. Resolver configuration was corrected against the installed package schema. Re-run stayed 10/10 green. Import checks cannot determine where business policy lives; code review still enforces that constraint.

- Step 04 RED: `npm test -- --project=web --project=api --project=tooling apps/web/test/app/App.test.tsx apps/api/test/api/health.test.ts apps/api/test/bootstrap/config.test.ts tests/delivery/vercel-handler.test.ts --reporter=dot` reached the real test boundaries: missing shell main/heading, health 404 instead of 200, unimplemented configuration and adapter 404. Testable skeletons allowed semantic failures rather than unresolved imports; earlier compiler/harness errors are not counted as RED.
