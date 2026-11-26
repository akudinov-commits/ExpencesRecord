# 06 — Spreadsheet mapping and configuration — Expose protected API endpoints

## Goal
Expose only the agreed protected read-context API through thin Fastify controllers, delegating owner authorization and all layout/category/currency interpretation to application use cases.

## Track
backend / API

## What Exists
- create-app.ts protects registered routes by default; exact public exceptions are health and the existing GET login/callback routes.
- Thin auth controllers and bootstrap/runtime.ts demonstrate HTTP mapping and shared Node/Vercel composition.
- Step 05 provides application-owned mapping use cases and truthful safe outcomes; React expense-entry UI remains a later feature.

## What to Build
- Confirm and document the minimal read-context path/query/DTO/error contracts agreed in step 01 and informed by step 04 before registering routes; do not invent a public workbook/financial diagnostic endpoint.
- Write Fastify/API tests first under apps/api/test/api for valid owner/date context, input validation, missing/expired sessions, wrong subject, provider failures and no-store/error behavior.
- Implement route/controller transport mapping under apps/api/src/api and wire the application through bootstrap; keep root api/index.ts thin.
- Expose only the categories/currencies/date availability needed by the future form. Keep workbook IDs, internal ranges/rate-cell addresses, private amounts, raw financial formulas and Google credentials off the wire.

## Acceptance Criteria
- [ ] All new endpoints are protected by default and application-authorized; negative auth cases pass before/after implementation with recorded RED/GREEN (API tests).
- [ ] Controllers validate HTTP shape and delegate; they contain no year/date/category/currency/cell-selection or financial rules (source/boundary review).
- [ ] Wire responses/errors expose only the agreed context, use appropriate no-store behavior and do not reflect secrets or arbitrary user/provider payloads (API/privacy tests).
- [ ] The same composition serves local Node and Vercel; no expense form, preferences, reporting history or new auth exception is introduced (delivery/scope review).

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
- Depends on: [05 — Implement application mapping](05-spreadsheet-mapping-configuration-application-mapping.md) must be complete before execution.
