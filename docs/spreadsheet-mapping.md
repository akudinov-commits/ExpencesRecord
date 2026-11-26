# Read-only spreadsheet mapping

The mapping feature is implemented locally on feature/spreadsheet-mapping-configuration. Steps 01-06 are complete; step 07 still requires controlled Google integration and checked hosted verification. This guide describes operator configuration, not an expense-writing feature. No formula, value, format or sheet structure is changed by the application.

## Configuration and layers
Set `EXPENSE_WORKBOOKS_JSON` privately, using the approved version-1 schema in the [feature architecture](../ongoing-tasks/spreadsheet-mapping-configuration/feature-architecture.md). Keep real workbook IDs and populated configuration out of Git. `.env.example` contains only the empty setting name. Local `.env` can hold a single-quoted JSON value; keep it on one physical line or use a correctly quoted multiline value. Do not paste credentials or private configuration into chat or shell command arguments.

Bootstrap validates the closed configuration schema and compiles references into neutral coordinates. Application owns owner authorization and all year/month/date/header/category/currency decisions. Infrastructure performs bounded GET reads and provider-error translation only. Controllers validate HTTP shape, delegate and project the safe DTO. No Google/SDK/environment access enters application, and the thin Node/Vercel adapter is shared.

Missing or invalid mapping settings return `mapping_unavailable` only for the context API; existing login, session and health keep working. A configured mapping without its separate read-only Sheets grant returns `reconnect_required`. Configuration is loaded once per app instance; restart/redeploy after changing it.

Use an explicit year/workbook/base currency with explicit month/tab/range, date rows/encoding, category IDs/header labels/columns and currency/rate references. New years are configured only after the user creates and verifies the annual workbook. Unconfigured years/months fail explicitly; the application does not create or guess them.

Currency codes are configuration entries, not a hardcoded list. The base currency has `rate: null`. Other currencies point to their specific sheet/cell and multiply/divide meaning. The referenced effective value must be positive and finite; the app does not calculate conversion. A user-added rate cell needs a verified configuration entry. Nothing automatically creates the cell, changes a rate or rewrites an expense.

Dates use an explicit encoding: native Sheets integer serial, ISO calendar text or day-first calendar text. The incoming API date is always strict `YYYY-MM-DD`. Configure actual calendar rows, not every row in a copied 31-day template. Missing, duplicate, moved or erroneous dates/headers/rates fail as `mapping_invalid`.

## Protected context API
`GET /api/expense-context?date=YYYY-MM-DD` requires the existing encrypted session and application authorization. It has no generated HEAD or write method. The response is no-store and contains only date, base currency, category IDs/labels and currency codes. No workbook ID, sheet/cell/rate address, rate value, expense amount, raw formula or financial history is exposed.

| Error | HTTP | Meaning |
|---|---|---|
| unauthenticated / access_denied | 401 / 403 | Existing session or owner authorization failed |
| invalid_request / invalid_date | 400 | HTTP shape or calendar date is invalid |
| year_not_configured / month_not_configured | 404 | No explicitly configured annual/month binding |
| mapping_invalid | 409 | Verified headers, dates, rate cells or dimensions do not match |
| mapping_unavailable | 503 | Mapping configuration is absent/invalid |
| reconnect_required | 503 | Separate read-only Google grant is missing/revoked/invalid |
| sheets_unavailable | 503 | Bounded Google read is unavailable/malformed |

Unknown query keys, workbook IDs and ranges supplied by the browser are rejected. Provider messages and financial cell contents are not error diagnostics. Unexpected implementation errors remain generic server errors; they are not disguised as valid empty catalogs.

## Controlled integration fixture — verified 2026-11-26
The user explicitly approved the five synthetic additions below in the separate test workbook. Immediately before preparation, a read-only check verified L1:R40 empty. The operator entered only these five cells through Google Sheets in Kiwi; subsequent API reads verified the exact values/types and all four pre-existing A1:G40 cells unchanged. Real owner-bound credentials and application mapping resolved the controlled date and all three currencies, including the additional JPY reference; wrong-owner, invalid-date and unconfigured year/month checks passed. The real expense workbook was not accessed or modified by this integration.

| Cell | Synthetic content | Purpose |
|---|---|---|
| L1 | Date | Date heading |
| N1 | Synthetic groceries | Category header |
| L16 | Text `2099-01-15` (force text with a leading apostrophe when entering in Sheets) | Unambiguous ISO date |
| Q39 | 7 | Synthetic AED rate |
| R40 | 0.25 | Synthetic additional-currency rate |

The associated private configuration uses this isolated workbook's ID, year 2099, base KZT, month 1, `sheetTitle: Sheet1`, range `L1:R40`, header row 1, date column L, date rows 16 through 16, and `dateEncoding: iso`. Category `groceries` maps to N. Currencies are KZT with no rate, AED at Q39/multiply and JPY at R40/divide. Numbers are synthetic and do not represent real rates or expenses. The supported date is the controlled fixture date, not a claim that real 2026 mapping is deployed.

Keep the real workbook unchanged. The existing backend grant remains read-only; any approved test-fixture preparation is a separate operator action, not a new write-capable application endpoint or silent OAuth scope upgrade. Do not copy real expense rows into fixtures.

## Checked Preview setup — verified 2026-11-26
The tested alias guard in this feature permits only feature/spreadsheet-mapping-configuration to assign the existing stable authentication Preview address after checked health. It replaces the old branch condition in this code version; it does not expand the Vercel token. The URL and registered Google callback stay the same, and existing deployment protection remains enabled. Main performs checks only; product Production remains a later feature.

On 2026-11-26 the user approved transferring exactly `GOOGLE_SHEETS_REFRESH_TOKEN` and the synthetic-test `EXPENSE_WORKBOOKS_JSON` to expences-record Preview as server-only Secrets, then committing/pushing this feature for checked delivery. Both settings were uploaded successfully. Existing authentication/client/cookie settings are reused and unchanged. No real-workbook mapping, main merge or Production release was approved.

GitHub checks and checked Preview delivery passed for feature commit 7fb78b6. The stable alias points to the ready Node 24 Preview, and deployed health, anonymous/invalid-cookie context denial, secure exact OAuth callback, retained Vercel protection, client-asset privacy and runtime-log scans passed. Real Google owner login and the controlled context request passed: the browser displayed exactly the synthetic date/category/KZT/AED/JPY DTO, and sanitized hosted request history confirmed context 200 versus anonymous/invalid-cookie 401. The initial owner check exposed a named Vercel rewrite capture adding an unwanted path query key; an observed RED/GREEN regression and unnamed /api/(.*) rewrite corrected it without relaxing API validation. Fix 270b469 passed checked CI/Preview; all 400 tests, types/lint, boundaries and builds passed. No real owner/session was fabricated. Step 07 is complete, with the feature awaiting human review on its branch.

## Real-workbook findings and future writes
Step 04 inspected June-November through November 26, 2026, read-only. Sanitized structural findings and cached-value verification limits are recorded in the [feature architecture](../ongoing-tasks/spreadsheet-mapping-configuration/feature-architecture.md). Daily/monthly total formulas are heterogeneous, and four reviewed months have differing total definitions. Native-currency buckets and mixed/linked/subtracted expressions also need explicit future write policy. No discrepancy was repaired, and cached checks are not proof of fresh recalculation or correct business inclusions.

Expense registration must separately resolve supported expression grammar, column-native currency handling, write permissions, concurrency, duplicate submissions and ambiguous outcomes. It must not infer an append rule or reuse F39 for every currency/year. Mobile preferences, the expense form, physical iPhone/PWA checks and product Production release remain later features.
