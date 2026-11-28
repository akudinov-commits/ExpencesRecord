# Expense registration operator guide

The backend was implemented on feature/safe-expense-registration-backend and merged into main as 367d72d under explicit user approval on 2026-11-26. Controlled Google tests passed only against the separately authorized synthetic workbook. The user approved Preview-only private writer settings and feature publication on 2026-11-26; the three private settings are stored, commit a94277f is pushed and actual GitHub checks/checked Preview delivery passed. Hosted protected synthetic-session writes/comments and privacy checks passed. The final real-browser save/read-back and independent content/format/comment preservation check passed; all five steps are complete and retained for human review. The expense-entry UI belongs to feature 5.

## Private configuration

Keep Google/cookie credentials and EXPENSE_WORKBOOKS_JSON server-only. Existing GOOGLE_SHEETS_REFRESH_TOKEN remains read-only. The separate GOOGLE_SHEETS_WRITE_REFRESH_TOKEN requires explicit owner write consent. Use the operator commands in [Google setup](google-setup.md); never put credentials in chat, source, client variables or logs.

EXPENSE_WRITES_ENABLED enables writes only for the exact string true and a separately configured writer grant. Missing, false or invalid settings disable writes while authentication, health and configured read-only preview remain available. Missing/invalid mappings fail only the expense feature. A revoked grant requires reconnection; no fallback to a different credential or automatic write retry occurs.

Mapping schema version 1 remains readable. Version 2 retains the same closed year/month/range/date/category/currency structure and requires storageCurrency on each category. Each storageCurrency must appear in that month's configured currencies. Category/date columns use letters, ranges use A1 notation, and rates use cell addresses, not numeric coordinates in private JSON. For example:

```json
{"version":2,"years":[{"year":2020,"spreadsheetId":"synthetic-workbook-id","baseCurrency":"KZT","months":[{"month":1,"sheetTitle":"Synthetic January","range":"A1:H40","headerRow":1,"dateColumn":"A","dateRows":{"from":2,"to":32},"dateEncoding":"serial","categories":[{"id":"groceries","label":"Synthetic groceries","column":"C","storageCurrency":"KZT"}],"currencies":[{"code":"KZT","rate":null},{"code":"AED","rate":{"sheetTitle":"Synthetic January","cell":"F39","operation":"multiply"}}]}]}]}
```

This is synthetic configuration. The controlled live fixture uses its separately approved columns and a past date; real-workbook activation needs a separately verified mapping. F39 is an example, never a universal rate. Add future currencies with explicit rate cells/directions and add the owner-created 2027 workbook explicitly. The app creates neither cells nor annual sheets.

## Protected request sequence

All three POST routes require the owner session, exact Origin and session-bound x-csrf-token. Responses are no-store/no-referrer. Clients never supply a workbook, sheet, address, formula or numeric FX rate.

1. POST /api/expenses/preview with date, decimal-string amount, categoryId, currency and optional comment. The response exposes only the selected cell's hasData, calculatedTotal, formula and scalarValue plus storageCurrency, proposedFormula, expectedVersion, canSave and warnings. Configured past dates are allowed. Render content as plain text and never log it.
2. If canSave is true, show the current total/formula and require explicit add-another confirmation for existing_data. possible_duplicate and duplicate_check_inconclusive require their own acknowledgment. A matching term is advisory, not proof of a previous submission.
3. POST /api/expenses with the same command, expectedVersion and the required true flags: acknowledgeExistingData, acknowledgePossibleDuplicate, acknowledgeInconclusive. The server refreshes credentials and reads current mapping/rates/cell. A changed snapshot returns 409 cell_changed; unsupported existing content or missing acknowledgment also returns 409 before writing. Refresh and ask the owner again.
4. POST /api/expenses/comments accepts the same expense association, a nonempty comment and a fresh expectedVersion. This creates a new comment only; expense is unchanged and there is no formula mutation. After an unknown comment outcome, inspect comments and obtain deliberate confirmation before making another comment request.

Amounts are positive decimal strings, at most nine integer and six fractional digits, without signs, exponent, commas or formula text. Leading/trailing numeric zeros normalize without rounding. Optional comments normalize line endings/outer whitespace, reject control characters except line feed/tab, and allow at most 1,500 UTF-8 bytes. Empty optional text creates no comment request. Comments are real new cell threads containing amount/currency and the supplied text; existing threads/notes are preserved.

## Formulas and outcomes

Each addition is a complete term: =(5), then =(5)+(6). A manually edited supported formula is preserved as one old block: =12+13+14*F4 becomes =(12+13+14*F4)+(5), then =(12+13+14*F4)+(5)+(6). Already complete grouped terms are appended directly; the accumulated whole is not wrapped again on each save. Existing expression text, whitespace and references are retained; FX applies only to the new expense term. A mapped AED-to-KZT term can be +(100*$F$39); native AED storage with KZT input uses +(500/$F$39). Same input/storage currency is direct. Sheets calculates rates and totals. The parser supports bounded numbers, parentheses, unary signs, arithmetic and same-workbook cell references. Functions, ranges, external links, invalid expressions, text and provider errors are blocked. The app never repairs or evaluates existing formulas.

201 means a confirmed requested mutation. Expense and comment outcomes are separate: a confirmed expense remains saved when its comment fails. 202 reports an uncertain post-dispatch expense or comment outcome; do not replay Save. Known rejection/unavailable dependencies return safe codes and never raw provider details. Comment-only responses use expense unchanged. A freshly visible matching formula cannot prove a historical request identity.

The final read detects a changed preview but is not a lock or compare-and-swap. Another device/tab/manual edit can race between the read and write. There is no durable receipt history, metadata, database, queue or exactly-once guarantee. See [ADR 007](../adr/007-expense-preview-and-write-limits.md).

## Verification and delivery

Follow [the active checklist](../ongoing-tasks/safe-expense-registration-backend-checklist.md) for observed RED/GREEN and actual controlled/hosted evidence. Local tests use fake ports and Fastify injection; the isolated Google proof uses real owner grants and an explicitly manufactured local test session, not a claim of interactive hosted sign-in. The separate real-browser proof uses the existing signed-in owner session, previews the synthetic cell, confirms one 4 KZT save with HTTP 201 and verifies the calculated total changed from 722 to 726. No session was manufactured for that browser proof. Live partial-provider failures are not manufactured: those outcomes are contract-tested with fault injection.

Only explicitly approved test cells may be mutated. Preserve source values, formulas, notes, formats and existing comments. Never use the real workbook for tests. Upload writer/mapping/enable settings only after concrete permission, Preview only. Checked GitHub delivery precedes stable-alias reassignment. No main merge, Production release or real-workbook activation is implied.

## Daily-entry feature contract extension (local implementation)

The active daily-expense-entry-ui feature additionally accepts exactly one of legacy amount or amounts (1-20 decimal strings). The application normalizes the ordered list, binds it to expectedVersion and appends every complete grouped FX term in one writer plan. It never submits one mutation per queued amount. Existing scalar requests remain supported. One optional comment is associated with the full stack, for example `5 + 10 + 12 AED` followed by the comment text. Formula/parser/comment limits and guarded fresh reads remain unchanged.

The approved UI always previews. Only a fresh single amount with hasData=false, canSave=true and no warnings can proceed from Submit directly to one save. Otherwise review shows the full comment/date/formula/warnings; explicit Confirm acknowledges the visible warning flags, and Back discards the review version. Conflict/uncertainty cannot silently continue into the shortcut. No host deployment or real-workbook activation is implied by local implementation.
