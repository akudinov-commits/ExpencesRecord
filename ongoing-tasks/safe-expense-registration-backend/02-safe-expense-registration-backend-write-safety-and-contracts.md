# 02 — Safe expense registration backend — Agree write safety and contracts

## Goal
Agree a concrete safe write architecture and contracts before provisioning write credentials or implementing expense registration.

## Track
backend / architecture / delivery design

## What Exists
- Step 01 must supply agreed formula/comment/FX requirements. Existing Fastify auth/CSRF, portable bootstrap and checked Preview delivery are available.
- The user replaced the metadata proposal with cell preview/confirmation and possible-duplicate warnings. No durable coordinator, receipts, lock, database or strict multi-instance guarantee is selected.
- The initial scope excludes an additional database or spreadsheet restructuring; source currently guards the stable Preview alias for the mapping feature branch only.

## What to Build
- Specify the user-directed flow: protected selected-cell preview; normalized command/context snapshot fingerprint; explicit existing-data/possible-duplicate acknowledgment; final fresh read and comparison; changed cell requires a new preview. Support all configured past dates. No metadata or external store is added.
- Explain the final-read/commit race, overlapping-device/manual edits and unknown outcomes. Do not call the checksum a lock, compare-and-swap or durable idempotency token; there is no automatic request-status recovery or blind write retry.
- Agree advisory duplicate matching/inconclusive states and intentional-repeat acknowledgment; exact formulas/values are owner-visible only for the selected preview. A separate explicit comment-only action cannot contain a formula mutation. Unknown prior delivery remains unknown; no receipts or retention/cleanup policy is introduced.
- Propose application-owned mutation/comment/safety contracts and exact permitted write-plan shapes, with raw infrastructure outcomes translated inward. Application retains owner/target/formula/retry policy; controllers and adapters remain mechanical.
- Agree the protected HTTP method/path, structured decimal/date/category/currency/optional-comment/expected-version inputs and acknowledgment flags, safe result/status/error contracts and validation bounds. Browser cannot send raw formulas, addresses, workbook IDs or FX values; enforce existing session/Origin/CSRF.
- Agree minimal private configuration changes, Google scope plan, isolated-fixture verification, exact Preview branch/alias/callback plan and credential destinations. Keep existing auth/context usable as appropriate when writes are unconfigured; do not add a public route exception or product Production path.
- Record broader approved architecture in an ADR only once selected; link it here. This scaffold creates no ADR decision, coordinator, database, queue or runtime settings.

## Acceptance Criteria
- [ ] The user-directed preview/recheck design, protected owner-visible fields, configured past dates and explicit residual race/uncertainty limits are reviewed before implementation (design review).
- [ ] No metadata/receipts/locks/store or retired-date cleanup mechanism is selected; stale previews reject and intentional duplicates can be acknowledged (contract/scenario review).
- [ ] No in-memory lock, blind retry, read-back heuristic or ordinary batch is represented as durable isolation/exactly-once (guarantee review).
- [ ] Inward ports, application policy ownership, HTTP/configuration/outcome contracts and required architecture approvals are recorded (contract/ADR review).
- [ ] A failed optional comment cannot cause expense resubmission; unknown expense outcomes have an explicit safe user/recovery path (scenario review).
- [ ] Minimum write-scope, isolated-test and checked Preview plans are concrete; no unapproved store/dependency/permission/hosting change is silently accepted (scope review).

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
- Depends on: [01 — Formula and optional-comment rules](01-safe-expense-registration-backend-formula-and-comment-rules.md).
- [Sheets batch semantics](https://developers.google.com/workspace/sheets/api/guides/batchupdate)
