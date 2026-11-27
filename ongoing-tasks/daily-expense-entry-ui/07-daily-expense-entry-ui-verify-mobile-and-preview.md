# 07 — Daily expense entry and reusable design system — Verify accessibility/mobile behavior and deliver checked Preview

## Goal
Verify the complete mobile interface, reusable components, security and actual checked Preview flow using controlled data, then present the feature for review.

## Track
cross-cutting / accessibility / delivery / verification

## What Exists
- Steps 01-06 must have recorded design approval, observed behavior RED/GREEN/refactor and passing focused component/client/form tests.
- Existing npm run check covers types/lint/tests/boundaries/build. Checked GitHub Preview and its stable callback/alias exist; its branch guard currently allows only feature/safe-expense-registration-backend.
- The real expense workbook is not a test target. Earlier backend fixture/credential approvals do not automatically authorize new UI test mutations, secret transfers or publication.

## What to Build
- Include the weekday beside every selected expense date on entry/review, derived from the selected calendar date without a timezone day shift; retain distinct Today/Past date labels.
- Verify the monthly category note against an explicitly authorized synthetic aggregate fixture, current/past month routing, category selection, aggregate currency and unavailable/zero/stale/reload cases. Existing total formulas and unrelated cells remain unchanged; request concrete fixture/configuration authorization before live changes.
- Visually verify supplied/absent/multiline/long comments on review and distinct Today/Past date states in both themes, including readable full dates, wrapping and non-color labels. Distinguish static mockup evidence from actual browser/device checks.
- Verify both direct single-empty and reviewed stack/existing-cell paths, no acknowledgment checkboxes, Back/edit review invalidation, Options gear accessibility, explicit device-local theme reload and blocked-storage fallback. Screen navigation never changes theme or loses the draft.
- Run required checks and complete acceptance review across tokens/primitives, API transport, form, preview/confirmation, save feedback and existing auth. Record automated versus visual versus controlled/hosted evidence separately.
- Review mobile/small-screen and desktop layouts, decimal/date keyboards, focus/error placement, touch targets, contrast, long labels/formulas/comments and light/dark foundations. Verify actual browser/device behavior where available and report device checks not performed; full PWA installation/update/release remains feature 7.
- Plan concrete isolated fixture dates/categories/currencies and exact allowed cells before mutations; obtain the necessary operational approval, preserve unrelated data/format/notes/comments and avoid real-workbook tests. Demonstrate a complete real-owner form/preview/save and optional-comment path without requiring developer-console commands.
- Prepare a tested branch-guard transition for this feature and checked delivery only within approved publication scope. Reuse the stable alias/callback and retain platform protection; no new auth exception, secret upload, main merge or Production release is implied.
- Verify denial/expiry/CSRF paths, malicious display text, stale data, duplicate acknowledgment, in-flight lock, uncertain save and comment-only recovery through appropriate controlled/fault-injected checks. Inspect available logs/client assets for secrets and financial payloads without printing them.
- Reconcile design-system usage guidance/gallery, operator/feature/current-state records and canonical instruction mirrors; present completion for human review without automatically archiving or scaffolding preferences/PWA features.

## Acceptance Criteria
- [ ] Selected-date weekday matches the full calendar date on entry/review, including past dates and local-midnight/timezone edge cases (interaction/render tests).
- [ ] Monthly note reads the configured existing aggregate without recalculation or writes, preserves sheet content and reports refresh/unavailable states truthfully (automated/controlled review).
- [ ] Optional-comment review and accessible Today/Past date treatment pass interaction/visual checks in both themes; local-calendar/midnight edge cases do not change the selected date (verification review).
- [ ] Conditional confirmation, Back/edit, Options navigation and light/dark persistence/fallback have actual interaction and visual evidence, without inline theme controls or financial storage (review/tests).
- [ ] A controlled stacked UI save preserves separate input terms in one cell update, with backward-compatible scalar tests and preserved unrelated content (controlled/application/client checks).
- [ ] Required local checks and actual checked CI/Preview pass for the reviewed commit, with real versus synthetic evidence identified (verification review).
- [ ] Mobile/desktop, keyboard/focus/labels/status/contrast and supported theme states are visually/accessibly reviewed; missing physical-device checks are explicit (manual/device review).
- [ ] Real owner completes entry/preview/confirmation/save through the actual UI using only authorized isolated cells; formula/FX/comment behavior and unrelated-content preservation are verified (controlled hosted test).
- [ ] Authentication, safe rendering, stale/duplicate/in-flight/unknown and comment-only scenarios pass without leaks, hidden retries or weakened route protection (security/fault checks).
- [ ] Generic components are documented/reused and future preference/PWA extension points remain separate from expense policy/API logic (design-system/source review).
- [ ] Feature records/instruction mirrors/links reflect actual results, residual ADR 007 limits and separate real-workbook/Production decisions; human review precedes archive (documentation review).

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
- Depends on: [06 — Implement safe saving and result feedback](06-daily-expense-entry-ui-safe-save-and-result-feedback.md).
