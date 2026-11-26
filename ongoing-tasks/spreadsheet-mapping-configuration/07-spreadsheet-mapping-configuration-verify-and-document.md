# 07 — Spreadsheet mapping and configuration — Verify and document

## Goal
Verify the completed read-only mapping feature across configuration, application, adapter and protected API boundaries, document the actual results and hand it off for review before safe expense-write work.

## Track
cross-cutting / verification

## What Exists
- Steps 01-06 must have complete acceptance and recorded meaningful RED/GREEN for behavior.
- npm run check and the existing GitHub checked-Preview workflow cover tests, types, lint, boundaries and builds.
- The stable authentication alias is guarded for feature/google-login-private-access only; this feature's authenticated Preview routing and any hosted Sheets setup must be explicitly agreed.

## What to Build
- Run npm run check and clean CI verification; cover a controlled synthetic layout end to end, year/date/category/currency failures, safe provider errors and a newly configured currency/rate reference.
- Use only a separately authorized representative isolated workbook for integration tests. The existing blank workbook has no known layout; request concrete preparation authorization or use a separately supplied controlled fixture, never populate or mutate the real expense workbook.
- Verify checked Preview delivery and real authenticated read-context behavior using the agreed routing, exact callback and secure configuration. Any required delivery behavior change must have observed RED/GREEN inside this step; no silent alias reassignment, scope upgrade or production release.
- Before any hosted credential transfer, obtain approval naming the Sheets grant/configuration and destination. Preserve Vercel protection and do not infer that authentication-only secrets approval covers this feature.
- Reconcile readme, feature architecture, accepted decisions and instruction mirrors; scan logs/source/client artifacts for private values. Present completion for human review without automatic archive, merge or scaffold of the write feature.

## Acceptance Criteria
- [ ] Required checks and actual clean CI pass; recorded evidence separates synthetic tests, controlled Google integration, real read-only discovery and checked Preview (verification review).
- [ ] Allowed-owner read context and unauthorized-user denial are verified through the agreed host path, with secure configuration and no broadened public access (controlled integration/security evidence).
- [ ] The real workbook is unchanged; controlled fixtures are separate and no financial data/IDs/credentials enter source, client bundles or logs (privacy/request review).
- [ ] Instructions, links, mirrors and handoff explain actual supported mappings, added-currency/annual setup and unresolved future write/concurrency choices (document review).

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
- Depends on: [06 — Expose protected API endpoints](06-spreadsheet-mapping-configuration-protected-api.md) must be complete before execution.
