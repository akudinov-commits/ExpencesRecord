# 01 — Safe expense registration backend — Agree formula and optional-comment rules

## Goal
Agree the expense-expression and optional cell-comment behavior before designing write contracts or generating formulas.

## Track
backend / application design

## What Exists
- Merged feature 3 provides GetExpenseContext, neutral mapping/read ports and private EXPENSE_WORKBOOKS_JSON with explicit rate sheet/cell/multiply-or-divide bindings.
- Its feature-architecture.md records sanitized findings on mixed expressions, native-currency columns and heterogeneous totals. No expense-write grammar or cell-comment policy is implemented.
- The user requested optional visible cell comments and protection against malformed expressions such as =(100+5. Proposed examples use complete grouped expense terms.

## What to Build
- Specify a selected-cell preview showing existing-data status, current Sheets-calculated total with storage currency, formula/scalar content and whether appending is supported. Permit past dates for any explicitly configured existing year/month/day; no today-only or retired-period policy. The later feature-5 UI must let the owner choose to add another expense.
- Record the supported numeric precision/scale/bounds and grammar for new and existing expenses, including empty/numeric/formula cells, parentheses, supported operators/references/functions and expression-size limits. Provide synthetic accepted/rejected examples and obtain agreement.
- Propose =(5), then =(5)+(6), then =(5)+(6)+(7). Compare briefly with =(5+6+7); define preservation/wrapping of old expressions without changing precedence, referenced cells, previous terms or cached-value substitution. Reject malformed/unsupported existing expressions before any write.
- Define per-term FX multiplication/division from private annual/monthly rate references, fixed/quoted cell addressing and category storage-currency semantics. Demonstrate base-currency, converted and mixed-currency examples; avoid double-converting columns with native-currency aggregate conversion. No rate evaluation in the app or universal F39.
- Specify optional real cell comments: absent/empty handling, text bounds, expense association, new thread versus reply, preservation of existing threads/notes and no unsolicited mentions/assignment. Verify the official native Sheets API contract; do not silently use notes or file-wide Drive comments.
- Define advisory possible-duplicate warnings by supported matching amount/currency terms, allow intentional repeats after acknowledgment, and label legacy/inconclusive cases honestly. No warning result proves a previous submission identity.
- Define the required expense/comment partial-success semantics, including expense saved but comment failed. Carry safe retries/reconciliation into step 02 without selecting an unapproved mechanism. No live workbook inspection/write is necessary to agree this design.

## Acceptance Criteria
- [ ] A valid manually entered supported expression is preserved as one grouped block on the next addition: =12+13+14*F4 becomes =(12+13+14*F4)+(5). Existing complete grouped terms remain flat on later additions; parentheses are not added around the accumulated whole on every save. Existing FX/reference/subtraction meaning stays intact, and configured FX applies only to the new term (approved synthetic examples).
- [ ] Preview requirements cover populated/blank cells, current total/formula, explicit add-another choice and configured past dates (design/example review; future API/UI handoff).
- [ ] Duplicate signals are advisory and can be acknowledged for legitimate repeats; unsupported/inconclusive legacy expressions are not silently classified as new (scenario review).
- [ ] Human-reviewed formula/amount/FX/native-currency rules and synthetic examples are recorded before dependent implementation (design review).
- [ ] The convention prevents malformed parentheses and precedence changes; malformed and unsupported old expressions have explicit fail-before-write behavior (design/example review; future unit cases identified).
- [ ] Every new foreign-currency term uses its configured reference/direction, without multiplying the accumulated whole cell or converting native amounts twice (synthetic example review).
- [ ] Optional anchored-comment behavior, existing-content preservation and distinct expense/comment outcomes are specified; API capability is researched without claiming live verification (design/reference review).

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
- [Verified mapping findings](../spreadsheet-mapping-configuration/feature-architecture.md)
- [Native Sheets comments and partial-save status](https://developers.google.com/workspace/sheets/api/guides/comments)
- Depends on: completed mapping feature; initial design approval is complete; implementation and verification are tracked in steps 04-05.
