# 01 — Recorded expense context — Read model

## Goal
Read model for the requested recorded-expense/playground feature.

## Track
backend / transport / client

## What Exists
Existing GetExpenseEntryContext decorates owner context with monthly totals; the protected controller projects it, and the same-origin client narrows responses.

## What to Build
Add selected-row daily summaries in the existing application query and optional closed context DTO; narrow client values. Follow observed RED/GREEN and retain scalar/stack/mapping/auth regressions.

## Acceptance Criteria
- [ ] Recorded, empty, zero and unavailable/formula-error states are distinguished; input remains owner/bounds/budget validated.
- [ ] Closed DTO/client stripping and malformed/legacy responses pass tests; no mapping addresses, write dispatch or changed write fingerprints.

## References
- [Checklist](../recorded-expense-context-checklist.md)
- [Architecture](feature-architecture.md)
- [Execution](../../prompts/execution.md)
