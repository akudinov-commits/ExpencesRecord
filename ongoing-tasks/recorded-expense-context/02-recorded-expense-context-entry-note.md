# 02 — Recorded expense context — Entry note

## Goal
Entry note for the requested recorded-expense/playground feature.

## Track
frontend

## What Exists
Existing context/date/category state rejects stale replies and refreshes on app return/known save.

## What to Build
Display compact recorded amount/currency with native expandable plain-text formula before monthly total. Bind to current date/category, preserve drafts and authoritative Submit preview.

## Acceptance Criteria
- [ ] Amount/formula, scalar/zero/empty/unavailable states and ordering pass interaction tests.
- [ ] Category/date changes, stale replies and known-save refresh never show another cell or stale formula; formula text is safe and disclosure accessible in both themes.

## References
- [Checklist](../recorded-expense-context-checklist.md)
- [Architecture](feature-architecture.md)
- [Execution](../../prompts/execution.md)
