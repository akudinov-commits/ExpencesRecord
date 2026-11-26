# 007 — Preview-confirmed expense writes with explicit concurrency limits

## Status
Accepted — 2026-11-26. The user directed replacing the metadata proposal with selected-cell preview/confirmation, past-date entry and possible-duplicate warnings, then explicitly approved after the remaining-overlap/no-automatic-retry trade-off was explained.

## Context
The private single-user app writes additive expense expressions into existing annual Google spreadsheets without changing their visible structure or adding a database. The user wants to inspect existing cell totals/formulas and decide whether to add another expense, including on past dates. Google REST batches are atomic for ordinary cell changes but do not isolate the app's separate read-modify-write sequence from other saves/manual edits. Comments can fail separately.

## Decision
- Use an authenticated selected-cell preview returning its Sheets-calculated value, storage currency, actual formula/scalar, proposed valid addition and an expected-state fingerprint. Expose that financial detail only to the configured owner; keep the existing catalog minimal and exclude it from diagnostics.
- Preserve existing expression meaning and construct a complete grouped new expense term from validated decimal input and explicit FX references/directions. Use explicit storage-currency mapping to avoid native-column double conversion. Reject malformed/unsupported state before writing.
- Permit past entries in every explicitly configured year/month/day; no today-only or retired-month policy. Warn about existing content and possible matching expense terms, distinguish inconclusive legacy formulas and allow intentional repeats after acknowledgment.
- Independently authorize and freshly read/recheck before saving. A changed fingerprint rejects with a new-preview requirement; acknowledged warnings never bypass syntax/layout/authorization failures. The checksum is not a lock, proof of UI interaction or durable idempotency token.
- Accept the remaining race between final read and commit. Two overlapping saves/devices/manual edits can overwrite each other. The later UI disables in-flight Save and advises one save at a time; the backend does not claim strict serialization, durable duplicate detection or exactly-once delivery.
- Never automatically repeat a dispatched ambiguous expense/comment write. Report unknown and require owner review. Formula matching/read-back is a clue, not proof of a past submission identity. Known expense success/comment failure is reported separately; explicit comment-only actions cannot mutate the expense formula.
- Add no metadata, receipts, busy markers, hidden sheet, external coordinator, database or automatic cleanup. Keep policy and ports in application, controllers thin and infrastructure mechanical, with existing owner/session/Origin/CSRF protection. A broader concurrency requirement needs a new decision.

## Consequences
The design keeps the selected Vercel/Google stack and avoids new storage/maintenance. It gives the owner visibility and detects stale previews while preserving past-date entry and intentional repeated amounts. It deliberately cannot guarantee no lost updates across overlapping writers or recover a historical request status after a crash. Optional cell comments have distinct delivery status. Exact write grants, isolated fixtures, hosted credentials, checked publication and real-workbook activation remain controlled operational steps; no production financial tests or automatic release is authorized.

Primary references: [Sheets batch/collaborator semantics](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate), [native comments and partial saves](https://developers.google.com/workspace/sheets/api/guides/comments), [feature contracts](../ongoing-tasks/safe-expense-registration-backend/feature-architecture.md).
