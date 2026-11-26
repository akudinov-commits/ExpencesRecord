# 05 — Safe expense registration backend — Verify controlled writes and checked Preview

## Goal
Verify the approved expense/comment flow end to end against controlled data and checked Preview, then hand off the backend for human review.

## Track
cross-cutting / verification / documentation

## What Exists
- Step 04 must have local implementation, meaningful TDD evidence and passing checks. Step 03 must identify exact authorized isolated fixtures and write credentials.
- The GitHub workflow checks before opt-in Preview delivery; main does not deliver product Production. Stable alias reassignment and new hosted grants require the agreed explicit approval.

## What to Build
- Run required checks and verify actual clean CI. Use the authorized isolated workbook to test empty/existing/supported/malformed cells, mixed/configured FX, repeated additions and native-currency handling while preserving unrelated values, formulas, totals, formatting, notes and existing comments.
- Verify optional comments actually appear attached to the exact cell and expense context; exercise omitted comments, existing threads, partial comment failure and safe comment-only recovery through controlled/fault-injected evidence. No real spreadsheet writes, comments or financial fixtures.
- Verify selected-cell preview, existing-data acknowledgment, intentional repeats, possible-duplicate/inconclusive warnings, configured past dates and stale-preview rejection. Cover race/timeouts/restart uncertainty without claiming cross-instance isolation, durable duplicate detection or exactly-once. No metadata is added or cleanup mechanism required.
- Publish/deploy only when authorized and follow checked delivery; verify real owner mutation/read-context through the approved Preview path plus anonymous/wrong-owner/CSRF/origin/malformed request denial. Preserve Vercel protection, exact callback and existing auth; no product Production path.
- Reconcile operator guide, feature records, current-state docs and canonical mirrors; scan source/logs/deployed client for credentials/private data. Document real-workbook activation as a separate controlled decision and unresolved/manual-edit constraints honestly.
- Present the completed backend for human review without automatic merge/archive or scaffold of feature 5. Its later UI plan must include past-date selection, current-cell total/formula preview, explicit add-another confirmation, possible-duplicate warning, disabled in-flight Save, optional comment and distinct expense/comment/unknown feedback.

## Acceptance Criteria
- [ ] Manual-formula grouping scenarios have synthetic planner/application regression evidence: old expression preserved once, new FX scoped to the new term, later additions flat, and manual edits after preview rejected. Controlled/hosted evidence must distinguish this refinement from earlier write proofs; never edit the real workbook to demonstrate it (verification review).
- [ ] Required local checks, actual CI and checked Preview pass, with synthetic versus controlled Google versus real owner evidence clearly separated (verification review).
- [ ] Authorized fixture expense additions/formulas/FX and actual cell comments pass while unrelated test content/formatting/comments and the real workbook remain unchanged (baseline/controlled review).
- [ ] Preview/acknowledgment/past-date/stale-state scenarios pass; duplicate warnings remain advisory, unknown writes are not auto-retried and comment-only recovery never changes the expense formula (controlled/fault review).
- [ ] Residual final-read/commit races and lack of durable request history are explicitly documented; no metadata/receipt/lock or unsupported isolation/success claim is introduced (design/security review).
- [ ] Real owner hosted behavior and unauthorized/CSRF/origin denial pass without credential/private-data exposure or broader public access (hosted/security checks).
- [ ] Instructions/mirrors/links and future UI/real-workbook handoff are accurate; completion is presented for human review (documentation review).

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
- Depends on: [04 — Protected registration with TDD](04-safe-expense-registration-backend-implement-protected-registration.md).
- [Task lifecycle](../../docs/methodology/task-workflow.md)
- [Audit gates](../../prompts/audit-checklist.md)
- [Comment save states](https://developers.google.com/workspace/sheets/api/guides/comments#comment_update_status)
