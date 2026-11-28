# 06 — Daily expense entry and reusable design system — Implement safe saving and result feedback

## Goal
Submit a reviewed expense once and communicate expense/comment success, rejection or uncertainty without causing accidental repeated expenses.

## Track
frontend / save orchestration and feedback

## What Exists
- Steps 03-05 supply the typed client, form and draft-bound preview/acknowledgments.
- Backend returns confirmed expense success separately from comment failure/uncertainty; comment-only actions return expense unchanged and never include a formula mutation. ADR 007 explicitly accepts the remaining read/commit race.

## What to Build
- After a confirmed expense save, refresh the selected category/month total from the existing context read. Refresh failure only marks the informational total unavailable; it cannot turn confirmed success into save failure, re-add the amount or trigger mutation replay. Never infer an uncertain mutation outcome from a changed aggregate.
- Treat the original Submit as write intent only for the approved single-empty-warning-free path after a successful fresh preview. Otherwise require the review Confirm action. Both paths share one in-flight guard and final backend recheck; stale/conflicted/uncertain attempts cannot silently resume into the shortcut.
- Model editing/reviewing/saving/result states explicitly and disable duplicate submission from repeated clicks, Enter or overlapping handlers. Use the reviewed draft/version/flags; keep in-flight behavior consistent with the approved design.
- On known success, show the expense result and independent comment result, apply the approved amount/comment reset and date/category/currency retention, and invalidate the old preview before another expense.
- Preserve the draft and explain known rejection or detected cell changes. For network/HTTP 202/malformed or otherwise uncertain mutation outcomes, show review-required guidance and do not retry, auto-submit after re-login or infer success/failure from matching formula terms.
- Provide deliberate comment-only recovery after a known saved expense/comment failure using a fresh preview and explicit owner confirmation. This is a new comment request, not a verified idempotent historical retry; unknown comments require inspection/review first.
- Keep form behavior and outcome messaging separate from transport and generic primitives. Never re-add an amount to recover a comment, claim multi-device locking or persist sensitive drafts/preferences in this step.

## Acceptance Criteria
- [ ] Confirmed save refreshes the monthly note; failed refresh and uncertain save do not produce optimistic FX totals, misleading outcomes or additional mutation dispatches (failing-first interaction/fault tests).
- [ ] Direct single-empty save and reviewed Confirm each produce at most one mutation; failed/blocked/stale previews never write and conflicts/uncertainty require deliberate review (interaction/fault tests).
- [ ] One stack Submit/Confirm sends one mutation; success clears queued/pending amounts while retaining selections, and comment-only recovery never repeats any stack term (interaction/contract tests).
- [ ] Rapid click/Enter events produce one mutation while saving; controls and status announcements remain accessible (interaction/fault tests).
- [ ] Confirmed save, definite rejection, cell_changed and uncertain delivery show distinct truthful feedback and agreed draft/reset states (interaction tests).
- [ ] Session expiry/re-login, timeouts and malformed mutation replies never trigger automatic replay (fault-injection/client integration tests).
- [ ] Expense-saved/comment-failed feedback cannot offer another expense save as comment recovery; a confirmed comment-only action uses only the comment endpoint and reports expense unchanged (interaction/contract tests).
- [ ] New-expense flow requires a new preview and confirms warnings again; no durability, exactly-once or cross-device serialization claim is introduced (scenario/source review).

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
- Depends on: [05 — Build preview, warnings and confirmation](05-daily-expense-entry-ui-preview-warnings-and-confirmation.md).
