# Recorded expense context and test playground — Architecture

## 1. Pipeline / Integration
Existing protected GET /api/expense-context?date=YYYY-MM-DD -> existing GetExpenseEntryContext -> existing owner-bound SheetReader -> optional per-category recordedExpense DTO -> existing narrowed client -> entry note before monthly total. The user explicitly requested this read/display behavior and a full-month/category test configuration. Routine extension of this existing DTO/query reuses all accepted boundaries; no new endpoint, service, DI, store or dependency.

## 2. Component Diagram
Existing owner session -> existing context controller -> existing entry query/base mapping -> bounded raw reader. Entry UI selects its category from the one date-bound context response. Preview/save remain separate and authoritative.

## 3. Data Flow
Read the mapped selected row in a validated bounded rectangle. Per category return recordedExpense as status recorded with amount:number|null, currency and formula:string|null, or explicit empty/unavailable. Zero/formula-to-zero counts as recorded; unknown/errored totals never become zero. The entry decorator alone supplies this optional field, so core mapping/write snapshots do not acquire display dependencies. Total entry enrichment budget is 20,000 cells; validate subject, sheet bounds, duplicate/out-of-range cells and formula length. Optional provider unavailability is explicit; reconnect/denial/unexpected failures retain existing semantics. Controller only projects the closed DTO. Client narrows unknown values and strips extra fields; malformed optional daily data becomes unavailable. Existing date/focus/save context refresh and stale-response rejection bind the note to the current date/category. Formula is plain text inside a native disclosure; empty cells have no recorded-expense warning. This note never supplies save fingerprints or replaces Submit's fresh preview.

## 4. Data Stores Summary
No new store or persisted financial data. Private synthetic mapping adds November 2026 while retaining January 2020. In the separate existing test workbook only, verify A50:G82 blank, set A50 Date plus six category headers B50:G50; set A51:A80 to ISO dates 2026-11-01 through 2026-11-30; A82 Monthly total and B82:G82 SUMs of each category's rows 51:80. Exactly 44 new values/formulas, no formatting/structure/comment changes or seeded expenses. Retain existing KZT/AED configuration and synthetic Q39 rate. Set private mapping locally and Preview only; no credential upload. Fresh snapshot/journal prevents replay; verify unrelated user values/formats/notes/comments unchanged.

## 5. Extension Points
Existing CategoryBinding monthly config and generic Field/details styling compose the result. No client FX/calculation or new currency policy. Future annual workbooks stay explicit; real workbook activation is separate.

## 6. Security & Isolation
Existing owner authentication/authorization and no-store remain. Existing Origin/CSRF/final-read mutation guards remain. No real-workbook access, automatic expense submission, main merge or Production release. Test-workbook additions/configuration and checked review-branch publication implement the user's current request; earlier narrower fixture approvals are not the authority for these new cells. Logs/assets/commits must exclude credentials/identifiers and financial payloads.
