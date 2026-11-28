# 05 — Daily expense entry and reusable design system — Build preview, warnings and confirmation

## Goal
Show the selected cell and planned addition, collect explicit confirmations and prevent stale reviews from being submitted.

## Track
frontend / preview and confirmation

## What Exists
- The form supplies a closed expense command; the backend independently validates it and returns currentCell, storageCurrency, proposedFormula, expectedVersion, canSave and fixed warnings.
- Supported manual formulas are preserved by the backend, and unsupported expressions cannot be made writable through owner acknowledgment.

## What to Build
- Include the weekday beside every selected expense date on entry/review, derived from the selected calendar date without a timezone day shift; retain distinct Today/Past date labels.
- Display the full optional draft comment in a labeled Your comment section, as safe wrapped text preserving meaningful line breaks; omit the section when absent. Show the selected full date with the same explicit Today/Past date distinction as entry. Back preserves the comment; comment edits invalidate review/version.
- A fresh single-amount Submit skips the confirmation view only after a valid preview reports hasData=false, canSave=true and no warnings. A populated zero, formula returning blank/zero, stack, warning, conflict or previous uncertainty cannot take this shortcut. Keep backend preview and expectedVersion protection for every save. Review uses an arrow Back preserving the draft and invalidating review state. Confirm acknowledges each visible returned warning via its existing flag; no checkbox or pre-acknowledgment.
- Request preview through the central client, show existing-data status and Sheets-calculated total with storage currency, and expose actual/proposed formula or scalar as escaped plain text under the approved disclosure design.
- Render existing_data, possible_duplicate and duplicate_check_inconclusive with distinct plain wording. Use explicit Confirm of the displayed warnings for the corresponding acknowledgments and keep intentional repeats possible; matching terms never prove a previous submission identity.
- Disable confirmation when canSave is false or configuration/formula state is blocked. Explain how the owner can inspect the sheet without adding a formula editor or automatic repair.
- Bind preview, expectedVersion and acknowledgments to the exact reviewed normalized draft/ordered amount stack. Any relevant input/catalog/session change invalidates them; ignore out-of-order preview responses.
- Surface cell_changed from a save through the agreed review-reset path: retain the draft, obtain a new preview and require fresh confirmation instead of silently applying the old intent.

## Acceptance Criteria
- [ ] Selected-date weekday matches the full calendar date on entry/review, including past dates and local-midnight/timezone edge cases (interaction/render tests).
- [ ] Review shows the supplied full/multiline comment safely, omits absent comments, preserves it through Back/edit, and displays the selected Today/Past date consistently (failing-first rendering/interaction tests).
- [ ] Single/empty/warning-free preview can proceed directly; stacks/populated zero/formulas/warnings/conflicts/previous uncertainty require review; Back preserves draft and clears the version; Confirm maps only displayed warning flags (failing-first interaction/client tests).
- [ ] The review displays all queued input amounts and backend-proposed separate formula terms; adding/removing/reordering an amount invalidates the prior preview and acknowledgments (interaction tests).
- [ ] Blank, populated zero, numeric, supported manual/mixed formula and blocked-cell previews display the backend's selected-cell data correctly (interaction tests).
- [ ] Existing-data/duplicate/inconclusive confirmations are explicit, map to their own flags and allow acknowledged intentional repeats (interaction/client contract tests).
- [ ] Editing any command field or receiving an obsolete response cannot leave a usable stale preview/version/acknowledgment set (async interaction tests).
- [ ] Backend blocked state cannot be bypassed and stale save state requires a fresh review (negative interaction tests).
- [ ] Formula/comment/provider strings render as plain text with no HTML injection, logging or browser-side formula/FX execution (security/render tests).

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
- Depends on: [04 — Build the expense-entry form using shared components](04-daily-expense-entry-ui-expense-entry-form.md).
