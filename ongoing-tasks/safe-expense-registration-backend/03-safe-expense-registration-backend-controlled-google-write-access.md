# 03 — Safe expense registration backend — Enable controlled Google write access

## Goal
Provision only the explicitly approved owner write access and isolated test configuration required by the agreed design.

## Track
backend / infrastructure / operator configuration

## What Exists
- Step 02 must have an approved scope/configuration/safety plan. The separate local Google setup helper verifies the owner and stores credentials only after confirmation.
- The current grant is spreadsheets.readonly and the hosted mapping is synthetic. Existing consent/upload approvals covered read-only credentials, not a write-capable replacement.
- The test workbook contains four original cells plus five approved mapping fixture cells; preserve them unless separately specified preparation is authorized.

## What to Build
- Use the approved operator-only consent path to obtain the minimum write permission for expense cells and native comments. Confirm exact owner, granted scopes, token refresh and intended isolated workbook before enabling writes; retain private credential handling.
- If the operator helper needs behavior changes, implement them with observed RED/GREEN first inside this step. No temporary broad grant, public credential endpoint or service-account/billing setup.
- Prepare an exact isolated fixture/configuration and baseline, naming new targets and expected formula/comment effects for approval before mutation. Preserve original test content and the real workbook; no structural changes or real financial fixtures.
- Store only approved settings in ignored local files and, if separately approved, the named Vercel Preview project. Never print/upload credentials implicitly or reuse the old read-only-transfer approval as consent to a new grant.
- Verify denied/revoked/wrong-owner/insufficient-scope outcomes using synthetic tests and the approved controlled probe. Do not claim a metadata-only or read-only probe demonstrates write/comment permission.

## Acceptance Criteria
- [ ] Exact write consent, owner identity, scopes, refresh and isolated configuration are verified under explicit authorization (operator/controlled evidence).
- [ ] Any helper/runtime behavior has recorded semantic RED/GREEN and affected checks before provisioning (unit/integration evidence).
- [ ] New fixture operations and secret destinations were concretely approved; existing test data and real workbook remain protected (baseline/privacy review).
- [ ] Source, logs, client artifacts and command arguments contain no credentials/private workbook IDs; failure outcomes are safe (scan/negative checks).

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
- Depends on: [02 — Write safety and contracts](02-safe-expense-registration-backend-write-safety-and-contracts.md).
- [Current Google operator setup](../../docs/google-setup.md)
- [Current mapping configuration and test fixture](../../docs/spreadsheet-mapping.md)
