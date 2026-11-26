# 01 — Spreadsheet mapping and configuration — Confirm spreadsheet layout and mapping requirements

## Goal
Agree the minimal read-only feature contracts and layout requirements using existing user context and Accepted ADRs. Record provisional assumptions explicitly; the live workbook review belongs to step 04. Scaffolding does not execute this step.

## Track
cross-cutting / requirements

## What Exists
- Authentication is merged into main at 926acfa; owner policy, inward ports, read-only credentials and an isolated ID-only probe are implemented.
- ADR 002 requires explicit annual routing and unchanged workbook structure/formulas. Real layouts/currency catalogs have not been reviewed for this feature.
- The seven-step order is agreed; no concrete mapping schema, read-port interface or context endpoint is implemented.

## What to Build
- Record the agreed requirements and proposed contract/error/configuration details in feature-architecture.md and checklist Notes before dependent code; use an ADR only for an approved architectural decision.
- Identify the minimal application-owned raw-read port, configuration shape and safe API context needed in steps 02-06, keeping policy out of controllers/infrastructure.
- Separate configuration-known selectors from step-04-discovered mappings; plan dates/time zones, category identity, missing-year/duplicate handling and extensible currency/rate references without inventing observed cells.
- Confirm this feature's authenticated checked Preview routing and secure setup prerequisites; do not silently reuse/repoint the authentication-only alias or assume approval to upload Sheets credentials.

## Acceptance Criteria
- [ ] Requirements, boundaries, concrete contract proposals and unresolved choices are explicit and human-agreed before behavior implementation (document/design review).
- [ ] Step 04 remains the first live real-workbook analysis; provisional assumptions are labeled and no category/rate/cell discoveries are fabricated (scope review).
- [ ] No auth choice, database, dependency, scope, credential or spreadsheet change is introduced by this decision step (diff/security review).

## References
- [Feature checklist](../spreadsheet-mapping-configuration-checklist.md)
- [Feature architecture](feature-architecture.md)
- [Layer boundaries](../../adr/001-layer-boundaries.md)
- [Sheets authority and annual routing](../../adr/002-sheets-authority-and-year-routing.md)
- [Google authentication and read-only access](../../adr/003-google-authentication-and-access.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Execution protocol](../../prompts/execution.md)
- [Task workflow](../../docs/methodology/task-workflow.md)
- [Node recipe](../../docs/methodology/node-service.md)
- Depends on: The completed authentication feature and this scaffold; execution and concrete contract decisions must be authorized separately.
