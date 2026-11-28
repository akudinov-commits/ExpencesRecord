# 01 — Expense date control — Single field

## Goal
Make the selected date visible and editable through one field, without a separate badge, Change date button or editor toggle.

## Track
frontend

## What Exists
ExpenseScreen composes Field/TextInput, selectedDateLabel, in-memory draft and save locking; entry/save tests cover weekday, routing, stale context and disabled controls.

## What to Build
- One Date-labelled native input decorated with the formatted weekday/Today/Past value and existing semantic treatment.
- Pointer/keyboard native picker activation and focus fallback; no extra tabbable control.
- Focused observed RED/GREEN plus affected entry/save regressions, preserving date invalidation and disabled saving state.

## Acceptance Criteria
- [ ] One enabled Date input is available on initial entry and unconfigured dates, with no Change date control (interaction).
- [ ] Pointer and Enter/Space invoke available native picker; missing/refused picker safely focuses the native input (interaction/browser).
- [ ] Date changes update the visible weekday/month and retain stale-context rejection; saving disables Date (existing regressions).
- [ ] Full date is visible once inside the field, with Today/Past distinction and accessible Date label/description/focus treatment (render/visual).

## References
- [Checklist](../expense-date-control-checklist.md)
- [Architecture](feature-architecture.md)
- [React recipe](../../docs/methodology/react-ui.md)
- [Execution](../../prompts/execution.md)
