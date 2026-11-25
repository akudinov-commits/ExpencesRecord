# 06 — Google login and private access — Establish approved server-side Sheets access

## Goal
Make the selected server-side credential mechanism ready for later workbook mapping without implementing expense reads or writes. This is a future execution specification; scaffolding does not execute it.

## Track
backend / infrastructure / configuration

## What Exists
- Step 01 selects the access/grant/storage model; steps 02-04 provide any required application ports and authenticated session integration.
- The existing annual workbook layout and year mappings have not been inspected for implementation; that is feature 3.

## What to Build
- Write credential-provider/configuration tests first using fake Google responses and synthetic identifiers; implement only the accepted credential acquisition/refresh mechanism under infrastructure/bootstrap.
- Complete only the account, consent, federation or sharing setup explicitly approved for the chosen design, using secure platform configuration and documenting non-secret setup steps.
- Verify the granted access using a separately authorized controlled test workbook and a minimal read-only permission probe. Do not request or use the live expense workbook as a test fixture.
- Document access denial, missing scopes/grants, expiry, revocation and annual-workbook onboarding for feature 3; do not infer a universal credential, workbook ID or currency mapping.

## Acceptance Criteria
- [ ] Credential acquisition/refresh failures and missing or revoked access produce truthful tested outcomes without leaking secrets (adapter/config tests and RED/GREEN evidence).
- [ ] Actual controlled-workbook access is verified only when an approved test resource and credentials exist; missing prerequisites remain explicit blockers (isolated integration evidence).
- [ ] No credential is sent to the FE, committed or logged; no database, long-lived key or broader scope is introduced without the step-01 approval (security/config review).
- [ ] No production workbook data, structure, formulas, formatting, mappings or financial calculations are read or changed by this step (scope/diff and isolated-test review).

## References
- [Feature checklist](../google-login-private-access-checklist.md)
- [Feature architecture](feature-architecture.md)
- [Layer boundaries](../../adr/001-layer-boundaries.md)
- [Google authentication and access — Accepted](../../adr/003-google-authentication-and-access.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Execution protocol](../../prompts/execution.md)
- [Task workflow](../../docs/methodology/task-workflow.md)
- [Node recipe](../../docs/methodology/node-service.md)
- [React recipe](../../docs/methodology/react-ui.md)
- Depends on: [05 — Add sign-in, private shell and logout interface](05-google-login-private-access-sign-in-interface.md) must be complete before execution.
