# Expense date control

## Goal
Combine redundant entry-screen date display/edit controls into one accessible Date field with weekday and Today/Past treatment.

## Scope
- In scope: the user's requested consolidation, native-picker/fallback/keyboard interactions, existing date invalidation and saving lock, both-theme/small-screen checks and checked publication on the existing UI Preview branch.
- Out of scope: mapping changes, spreadsheet writes, backend changes, preferences, main merge or Production.
- Dependencies: [daily entry](daily-expense-entry-ui-checklist.md), [layer ADR](../adr/001-layer-boundaries.md), [TDD ADR](../adr/006-tdd-and-feature-scope.md).

## Architecture
See [feature-architecture.md](expense-date-control/feature-architecture.md). Existing UI primitives/draft/client boundaries are reused.

## Steps
- [x] [01 — Consolidate date selection with TDD](expense-date-control/01-expense-date-control-single-field.md)
- [ ] [02 — Verify and publish the Preview adjustment](expense-date-control/02-expense-date-control-verify-preview.md)

## Notes
- 2026-11-28: user requested one Date control after reviewing the hosted UI. This authorizes routine decomposition of that clear follow-up; the completed original feature's scope remains unchanged. Use existing feature/daily-expense-entry-ui for the review adjustment and existing checked delivery/alias guard. Preview date availability remains limited to the approved synthetic January 2020 mapping; the real workbook is not activated. Scaffold is documentation-only and precedes runtime edits. Mandatory observed behavior RED/GREEN applies to the revised interactions.

- Step 01 RED: npm test -- --project web apps/web/test/features/expenses/entry.test.tsx apps/web/test/features/expenses/save.test.tsx (VITEST_MAX_WORKERS=1) observed 6 failed / 22 passed. Initial/past/unconfigured/stale/save-lock/picker tests fail because Date is absent until the old toggle is clicked. This is the intended missing behavior; log date-control-red.log. Minimum implementation now composes the existing Field/TextInput with one formatted surface and native picker/focus fallback; no backend/configuration change.

- Step 01 GREEN: the same focused entry/save command passed all 28 tests after implementation. The native Date field is always present with the correct ISO value, accessible formatted description and no Change date button. Pointer/Enter/Space activation and unavailable/refused showPicker focus fallback passed; existing stale-context, weekday/month, unconfigured-date and saving-lock regressions passed. Refactor removed obsolete editor state/row styling and reused Field/TextInput plus the existing semantic tokens. No new interface, dependency, persistence, API or configuration behavior.
- Step 02 browser verification: the isolated existing synthetic Edge harness passed six combinations (320/390/768 CSS px, light/dark), one Date input/no Change date button, full-width 44px+ target, fitting text, native showPicker availability, focus/navigation/appearance, past-date weekday/month and review/reset regressions. Inspected actual light-320 and dark-390 screenshots; no horizontal overflow. Test clients/data are synthetic and perform no Google writes. Physical iPhone/Safari remains unperformed.
- Full-check first attempt: types/lint passed, then 50 files passed and one existing API transport test exceeded its unchanged 5000ms timeout (706 passed / one timed out). Browser QA was concurrently active. This is not behavior RED or a passing check. Browser work and its server finished; rerunning the unchanged suite alone with VITEST_MAX_WORKERS=1 and no timeout/source changes. Logs: date-control-check.log and date-control-check-final.log.

- Required full-check GREEN: unchanged npm run check with VITEST_MAX_WORKERS=1 passed 51 files / 707 tests, strict types/lint, zero dependency violations (70 modules / 201 dependencies) and API/web builds. No source/timeout/dependency change was needed for the prior startup timeout. Documentation verification passed 22 changed/new Markdown files and 154 local links; canonical mirrors and built-client isolation match. Privacy scan checked 257 versionable files with zero configured private-value matches; git diff --check passed. Checked feature publication and hosted native-picker inspection remain step 02 work.
