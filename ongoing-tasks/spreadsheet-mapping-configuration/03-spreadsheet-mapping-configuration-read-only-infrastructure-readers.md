# 03 — Spreadsheet mapping and configuration — Implement read-only infrastructure readers

## Goal
Implement mechanical bounded Google Sheets reads behind the application-owned port agreed in step 01, retaining the existing verified read-only owner credential mechanism. No live real-workbook inspection occurs in this step.

## Track
backend / infrastructure

## What Exists
- infrastructure/sheets-access.ts implements read-only credential refresh and the small ID-only GoogleSpreadsheetProbe.
- Application-owned SheetsCredentials and SpreadsheetProbe ports exist; they do not expose catalog/layout reads.
- Step 02 provides validated synthetic annual/currency configuration; contract tests can use controlled responses.

## What to Build
- Write focused contract tests under apps/api/test/infrastructure before implementing raw metadata/value/formula reader behavior and safe failure translation.
- Implement only the agreed read port under apps/api/src/infrastructure, preserving formulas alongside effective values where the approved read contract needs them.
- Bound requested ranges/fields and validate response shapes; preserve raw cell evidence without selecting categories, interpreting FX policy or ranking usage inside the adapter.
- Use synthetic requests/responses to test missing scope, denial, expiry, malformed responses and unavailable dependencies. Keep the existing isolated ID-only probe separate.

## Acceptance Criteria
- [ ] Reader behavior has meaningful RED/GREEN evidence and tests verify bounded GET-only calls with no mutations or credential exposure (adapter tests).
- [ ] Google/SDK types and response I/O stay in infrastructure; no mapping/authorization/financial policy leaks outward from application (types/import checks and review).
- [ ] Failures are truthful and safe; no raw credential/provider financial payload enters logs, and no real expense data is used as a fixture (negative contract tests/security review).
- [ ] Steps 02-03 have not accessed the real workbook; step 04 remains deferred until explicitly executed (scope/evidence review).

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
- Depends on: [02 — Configure annual workbooks](02-spreadsheet-mapping-configuration-configure-annual-workbooks.md) must be complete before execution.
