# 04 — Daily expense entry and reusable design system — Build the expense-entry form using shared components

## Goal
Let the signed-in owner enter the selected date, amount, configured category/currency and optional comment using the shared design system.

## Track
frontend / expense form

## What Exists
- Steps 01-03 supply approved defaults, shared components and the typed expense API client.
- The backend catalog is configured by calendar date/year/month; the application validates all business rules. The current hosted fixture permits only its synthetic configured date.

## What to Build
- Render the monthly category total as compact normal-weight secondary text, not a numeric hero/card; retain readable contrast, currency/month context and responsive wrapping.
- Include the weekday beside every selected expense date on entry/review, derived from the selected calendar date without a timezone day shift; retain distinct Today/Past date labels.
- Show Recorded in <month year> below the selected category, with its existing sheet monthly aggregate and configured aggregate currency. Use the selected date month, exclude the unsaved stack, show loading/unavailable honestly, and ignore stale reads when category/date/session changes. Do not recalculate totals or replace unavailable values with zero.
- Show the selected full date with distinct Today (teal) or Past date (amber) styling and explicit words. Compare local calendar dates; refresh the classification on app return and before Submit without changing the selected date or adding a new confirmation rule.
- Add an authenticated Options view reached by an accessible gear icon, with Back to entry and preserved in-memory draft. Compose views through existing React state, with no router dependency/public route. Navigation invalidates review and is disabled during mutation. Implement a bounded frontend theme adapter for a light/dark enum only, safe storage failures, and one-time device-theme fallback; no live system-theme subscription or inline theme toggle.
- Compose category-first entry with an editable/removable same-category/date/currency amount queue, exact input-currency subtotal and session-only last-used currency, as approved in step 01. Add/Enter queues amounts; one Submit previews the full stack. No persisted preferences or authoritative FX.
- Compose the mobile form from shared primitives inside the existing allowed-owner shell. Load categories/currencies from the selected date and expose loading, empty/unconfigured, denied and unavailable states.
- Default the date to the agreed local-calendar today behavior and permit configured past dates. Display missing year/month/date availability clearly without guessing a workbook or adding annual sheets.
- Preserve decimal input as text and provide the agreed numeric keyboard/locale entry behavior, required fields and helpful errors without silent rounding. Category/currency changes and optional comment obey the reviewed bounds; backend validation remains authoritative.
- Ignore stale catalog responses when dates change quickly; cancel or disregard obsolete requests. Clear/revalidate selections that no longer belong to the current catalog rather than submitting hidden stale values.
- Implement the approved in-memory draft and reset/retention behavior. Only the appearance enum is persisted; no category/currency preferred choices, draft storage, offline queue or server sync is added; later feature 6 owns mobile preferences.

## Acceptance Criteria
- [ ] Monthly total has deliberately secondary visual emphasis without hiding currency/month or reducing readability (visual/accessibility review).
- [ ] Selected-date weekday matches the full calendar date on entry/review, including past dates and local-midnight/timezone edge cases (interaction/render tests).
- [ ] Current/past-month and category changes show only their matching aggregate/currency; zero/loading/unavailable/stale responses are distinct and drafts remain intact (failing-first interaction tests).
- [ ] Today versus past-date labels/styles follow local calendar dates across midnight/app return and preserve the selected date, queue and comment (failing-first interaction tests).
- [ ] Gear/Options/Back preserves drafts, applies and reloads the explicit light/dark choice, ignores invalid values and handles blocked storage without persisting financial/session data (failing-first interaction/adapter tests).
- [ ] Add/Enter/remove and valid unfinished-input submission preserve the exact ordered queue, selected group/currency and decimal values without accidental loss or duplicate UI dispatch (interaction tests).
- [ ] Only an allowed session sees the form; existing sign-in/sign-out behavior still works (interaction/regression tests).
- [ ] Current/past date selection loads the matching configured catalog and rejects stale responses/selections (async interaction tests).
- [ ] Amount/category/currency/comment controls have accessible labels, agreed keyboard/validation and omitted/empty-comment behavior (interaction/manual checks).
- [ ] Missing year/month/setup, unavailable reads and expired sessions provide clear states while retaining the draft only as agreed (negative interaction tests).
- [ ] The form uses shared components and keeps preference/draft persistence and authoritative formula/FX rules outside this feature (source/scope review).

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
- Depends on: [03 — Connect the typed frontend API client](03-daily-expense-entry-ui-typed-expense-api-client.md).
