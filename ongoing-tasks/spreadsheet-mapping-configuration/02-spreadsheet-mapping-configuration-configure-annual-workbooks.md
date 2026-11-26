# 02 — Spreadsheet mapping and configuration — Configure annual workbooks

## Goal
Provide the validated configuration mechanics needed for explicit annual workbooks and extensible currency/rate bindings, using the shape agreed in step 01 and synthetic values only. Final real layout bindings wait for step 04.

## Track
backend / configuration

## What Exists
- bootstrap/auth-config.ts validates authentication configuration; bootstrap/google-setup-config.ts separates the isolated test probe from other resources.
- The real workbook and blank test workbook are distinct. The user creates future annual workbooks, including 2027.
- Step 01 must approve configuration names/shapes and provisional selector/error contracts.

## What to Build
- Write configuration tests first under apps/api/test/bootstrap for valid explicit years, extensible currency bindings and invalid/missing/duplicate/malformed settings.
- Implement only agreed private configuration loading/validation under apps/api/src/bootstrap; update .env.example with empty/synthetic examples and safe operator guidance when executing this step.
- Pass validated configuration into application without environment reads there; keep authorization and layout selection policy in application.
- Allow an added currency to identify its separately configured rate-cell reference instead of adding a hardcoded currency branch; do not create a spreadsheet cell or treat F39 as universal.

## Acceptance Criteria
- [ ] Meaningful configuration RED precedes implementation and tests cover valid additions plus missing/invalid/duplicate settings (bootstrap tests and Notes).
- [ ] Year routing is explicit; unconfigured years do not auto-create or guess workbooks, and actual identifiers stay in ignored/secure configuration (config/security review).
- [ ] Configuration validation does not move date/category/currency selection policy into bootstrap or require live workbook discovery before step 04 (boundary and scope review).

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
- Depends on: [01 — Confirm spreadsheet layout and mapping requirements](01-spreadsheet-mapping-configuration-confirm-layout-and-requirements.md) must be complete before execution.
