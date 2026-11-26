# 05 — Spreadsheet mapping and configuration — Implement application mapping

## Goal
Implement the approved application mapping rules using step-04 evidence: resolve configured year/month/date/category/currency context and deny missing or ambiguous mappings without writing expenses or evaluating currency conversion.

## Track
backend / application

## What Exists
- Application AuthService and the existing Sheets-access use case demonstrate inward policy/port composition.
- Steps 01-03 provide agreed contracts, validated configuration and raw readers; step 04 supplies reviewed real-layout findings.
- No date/category/currency mapping service or expense registration use case exists.

## What to Build
- Write application tests first under apps/api/test/application with synthetic representations of the reviewed layout and fake read/credential ports.
- Implement only approved mapping use cases/value types under apps/api/src/application, reusing configured-owner authorization and explicit annual routing.
- Resolve month/date rows, allowed category inputs and configured currency/rate bindings; distinguish input cells from total/formula/rate helpers and fail safely on absent/duplicate/unexpected layouts.
- Support configured additional currency references without a fixed supported-currency switch. Preserve Sheets as the FX/totals authority; do not compute converted amounts, rewrite expressions or plan/execute writes.
- Wire application and adapters through existing bootstrap composition only; do not place mapping or owner policy in controllers/infrastructure.

## Acceptance Criteria
- [ ] Meaningful RED precedes each policy behavior; tests cover correct resolution, unconfigured years, calendar boundaries, duplicate/missing dates/categories/currencies and added rate bindings (application tests/Notes).
- [ ] The configured owner is authorized and another valid subject is denied at the application boundary (application negative tests).
- [ ] Application uses only inward contracts and injected validated settings, with no Fastify/Google/Vercel/infra/env/I/O imports (boundary/type checks and review).
- [ ] No expense write, FX computation, formula rewriting or guessed fallback cell is introduced (unit tests and source/scope review).

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
- Depends on: [04 — Review the real spreadsheet, read-only](04-spreadsheet-mapping-configuration-review-real-spreadsheet.md) must be complete before execution.
