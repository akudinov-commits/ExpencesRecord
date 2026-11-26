# 04 — Safe expense registration backend — Implement protected expense registration with TDD

## Goal
Implement the approved backend behavior with meaningful failing tests first and strict controller/application/infrastructure separation.

## Track
backend / application / API / infrastructure

## What Exists
- Steps 01-03 must provide approved rules/safety/contracts and controlled write prerequisites. Auth/default route protection, raw reads, mappings and portable composition already exist.
- The new use case, expression planner, safety mechanism, write/comment adapters and protected mutation endpoint do not exist. Concrete names/interfaces come from step 02, not generic recipes.

## What to Build
- For every behavior, write a focused test at its owning boundary, observe semantic RED, implement minimally, observe GREEN, refactor and rerun. Record exact test identities/commands/results in checklist Notes; use synthetic structural data, not real expenses.
- Application owns amount/date/category/currency/comment validation, requesting/refreshed owner authorization, explicit annual/monthly target selection, supported existing-expression parsing and complete safe formula planning. Generate per-expense FX terms from configured references/direction and verified storage currency; never compute FX amounts or repair totals.
- Implement the user-directed preview and fresh-read comparison through inward contracts: selected-cell formula/calculated value, configured past dates, expected-state checksum, existing-data/possible-duplicate/inconclusive warnings and acknowledgments. Re-read immediately before writing; stale state rejects for a new preview. No metadata/receipts/lock or durable deduplication is introduced.
- Cover intentional repeated amounts, changed cells, overlapping request limitations, pre/post-dispatch failure and unknown outcomes. No automatic retry after ambiguity. A comment-only action must contain no formula mutation, and matching formula terms must never be presented as proof of a request outcome.
- Mechanical infrastructure executes only the exact permitted cell/value/comment plan with bounded requests, minimal field masks, explicit formula values and safe provider translation. Preserve formatting, notes, totals, old expense terms and existing comments; no arbitrary target selection or retry policy in adapters.
- Thin authenticated/CSRF-protected HTTP validates transport, passes verified identity, delegates and maps minimal outcomes. No new public exceptions, raw client formula/address/FX inputs, financial logging or Google SDK/config access from application/FE.
- Bootstrap validates and wires the approved private settings/ports using the existing shared Node/Vercel factory. Test unavailable/missing write configuration, revoked grants and existing auth/read-context compatibility. No new expense UI or mobile-preference code.

## Acceptance Criteria
- [ ] Manually entered supported formulas are grouped once with their exact old expression text retained; already grouped additions remain flat, including after many additions. Tests cover plain/mixed-FX sums, multiplication/division/subtraction, whitespace, quoted sheet names containing parentheses, and numeric cells. Application preview/save tests prove the exact planned formula, acknowledgment and stale-manual-edit rejection (observed RED/GREEN).
- [ ] New behavior has observed RED/GREEN/refactor evidence; malformed/unsupported expressions fail before any write and valid additions preserve prior meaning/formatting (application/adapter tests).
- [ ] Mixed/native/base/divide/cross-tab FX cases use only approved mappings and preserve arithmetic precedence; optional comment text cannot enter formulas (unit/security tests).
- [ ] Preview reports selected-cell contents/total and permits configured past dates; stale previews reject, possible duplicates require acknowledgment, and intentional repeats remain possible (application/API tests).
- [ ] Unknown outcomes are not automatically retried or inferred from matching terms; comment-only actions cannot re-add expenses and residual concurrency limits are not overstated (fault-injection/contract tests).
- [ ] Protected HTTP requires owner session, exact Origin and CSRF, rejects invalid/client-selected resources and returns the specifically authorized selected-cell preview plus safe distinct expense/comment outcomes (Fastify injection tests).
- [ ] Missing/revoked settings and provider failures are safe; inward imports, portable wiring, types/lint/tests/build and npm run check pass (existing checks and regression tests).

## References
- [Feature checklist](../safe-expense-registration-backend-checklist.md)
- [Feature architecture](feature-architecture.md)
- [Layer boundaries](../../adr/001-layer-boundaries.md)
- [Sheets authority and annual routing](../../adr/002-sheets-authority-and-year-routing.md)
- [Google authentication/access](../../adr/003-google-authentication-and-access.md)
- [Vercel and portability](../../adr/004-vercel-and-portability.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Execution protocol](../../prompts/execution.md)
- [Backend recipe](../../docs/methodology/node-service.md)
- Depends on: [03 — Controlled Google write access](03-safe-expense-registration-backend-controlled-google-write-access.md).
- [Observed mapping TDD/evidence](../spreadsheet-mapping-configuration-checklist.md)
