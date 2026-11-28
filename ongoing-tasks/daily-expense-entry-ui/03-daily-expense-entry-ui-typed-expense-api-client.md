# 03 — Daily expense entry and reusable design system — Extend the same-cell stack contract and connect the typed frontend API client

## Goal
Extend the existing expense command backward compatibly for the explicitly requested same-cell amount stack, then connect the browser through a small typed same-origin client with safe response parsing and outcome classification.

## Track
frontend / backend contract / API integration

## What Exists
- apps/web/src/api/auth.ts provides the existing transport pattern; the app retains CSRF only in memory.
- Backend exposes GET /api/expense-context?date=YYYY-MM-DD and protected POST /api/expenses/preview, /api/expenses and /api/expenses/comments.
- The backend returns selected-cell preview, expectedVersion, warnings and separate expense/comment outcomes. Its inward ports must not be imported by frontend code.

## What to Build
- Implement the approved optional per-category monthlyTotal row/currency mapping and protected context DTO/read extension. Application reads the existing effective aggregate via bounded SheetReader cells; no sum, FX calculation, total formula write or new endpoint. Finite zero is available; blank/error/text/missing data is unavailable. Optional summary failures cannot break legacy mappings or expense writes; no aggregate dependency in save fingerprints.
- Implement the step-01 approved stack contract through existing application-owned ports/use cases and thin HTTP projection, retaining scalar amount compatibility. Validate the entire ordered list, build each grouped term/FX reference and compare one fresh snapshot before one writer dispatch; no serial per-amount saves or metadata/store.
- Extend preview fingerprints, warnings and comment-only associations to the exact normalized stack. Preserve existing auth/status/response semantics and comment/provider bounds. Test invalid/both/missing amount fields, empty/oversized lists, stale/reordered stacks, per-term FX, manual old formulas and legacy scalar requests with RED before behavior changes.
- Add an injected/fakeable expense client with browser wire types and unknown-response narrowing for context, preview, save and comment-only requests. Reuse current same-origin cookies and memory-only CSRF; no bearer-token convention or direct Sheets transport.
- Encode calendar date safely and send only the closed command/acknowledgment fields. Read existing API documentation; do not send resources, addresses, formulas, numeric rates or client-chosen workbook IDs.
- Translate known authentication, invalid-input, missing-year/month, unavailable setup, blocked formula, acknowledgment and stale-preview responses into usable typed UI results without reflecting provider details.
- Treat a mutation transport loss, malformed/unconfirmed response or explicit unknown outcome as uncertain. Never classify such a mutation as definitely not saved or automatically retry it. Preview/context read failures remain distinguishable from save uncertainty.
- Test through the injected fetch boundary before behavior implementation, including DTO validation, headers, caching/redirect behavior, safe errors and exact no-replay counts. Keep parsing/HTTP mechanics here and interaction rules in expense orchestration.

## Acceptance Criteria
- [ ] Configured selected-month/category totals carry explicit aggregate currency; zero and unavailable are distinct; bounded read, legacy mappings, authorization and DTO/privacy narrowing pass observed RED/GREEN (configuration/application/API/client tests).
- [ ] A valid same-category/date/currency list preserves every amount as a separate grouped term and executes one exact cell write; invalid/stale stacks execute none (API/application/formula tests).
- [ ] Legacy scalar requests remain compatible; list bounds/normalization, full-stack fingerprints, warnings and optional stack/comment-only association obey the approved contract and existing security (negative/regression tests).
- [ ] All four expense operations use documented methods/payloads, same-origin credentials, no-store handling and CSRF on POST (client contract tests).
- [ ] Malformed/unexpected data is narrowed safely without unchecked any, private-resource leakage or backend source imports (negative/client/boundary tests).
- [ ] Unauthorized/expired sessions and known rejected/unavailable/conflict states remain distinct from uncertain mutation delivery (client tests).
- [ ] Lost/malformed mutation responses produce uncertainty and exactly one dispatch, with no automatic replay (fault-injected client tests).
- [ ] Client source/tests align with reviewed wire contracts using existing tooling and no unapproved package (type/lint/contract checks).

## References
- [Feature checklist](../daily-expense-entry-ui-checklist.md)
- [Feature architecture](feature-architecture.md)
- [React recipe](../../docs/methodology/react-ui.md)
- [Feature development](../../docs/methodology/feature-development.md)
- [Execution protocol](../../prompts/execution.md)
- [Layer boundaries](../../adr/001-layer-boundaries.md)
- [Authentication](../../adr/003-google-authentication-and-access.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Preview/write limits](../../adr/007-expense-preview-and-write-limits.md)
- [Backend operator/API guide](../../docs/expense-registration.md)
- Depends on: [02 — Build and document the reusable design system](02-daily-expense-entry-ui-reusable-design-system.md).
