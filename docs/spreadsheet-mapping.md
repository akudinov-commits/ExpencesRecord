# Read-only spreadsheet mapping

The base mapping feature completed all seven steps and is merged into main. This guide describes its operator configuration and the locally implemented daily-entry monthly-summary extension below; hosted configuration for that extension remains pending approval. No formula, value, format or sheet structure is changed by the application.

## Configuration and layers
Set `EXPENSE_WORKBOOKS_JSON` privately, using the approved version-1 schema in the [feature architecture](../ongoing-tasks/spreadsheet-mapping-configuration/feature-architecture.md). Keep real workbook IDs and populated configuration out of Git. `.env.example` contains only the empty setting name. Local `.env` can hold a single-quoted JSON value; keep it on one physical line or use a correctly quoted multiline value. Do not paste credentials or private configuration into chat or shell command arguments.

Bootstrap validates the closed configuration schema and compiles references into neutral coordinates. Application owns owner authorization and all year/month/date/header/category/currency decisions. Infrastructure performs bounded GET reads and provider-error translation only. Controllers validate HTTP shape, delegate and project the safe DTO. No Google/SDK/environment access enters application, and the thin Node/Vercel adapter is shared.

Missing or invalid mapping settings return `mapping_unavailable` only for the context API; existing login, session and health keep working. A configured mapping without its separate read-only Sheets grant returns `reconnect_required`. Configuration is loaded once per app instance; restart/redeploy after changing it.

Use an explicit year/workbook/base currency with explicit month/tab/range, date rows/encoding, category IDs/header labels/columns and currency/rate references. New years are configured only after the user creates and verifies the annual workbook. Unconfigured years/months fail explicitly; the application does not create or guess them.

Currency codes are configuration entries, not a hardcoded list. The base currency has `rate: null`. Other currencies point to their specific sheet/cell and multiply/divide meaning. The referenced effective value must be positive and finite; the app does not calculate conversion. A user-added rate cell needs a verified configuration entry. Nothing automatically creates the cell, changes a rate or rewrites an expense.

Dates use an explicit encoding: native Sheets integer serial, ISO calendar text or day-first calendar text. The incoming API date is always strict `YYYY-MM-DD`. Configure actual calendar rows, not every row in a copied 31-day template. Missing, duplicate, moved or erroneous dates/headers/rates fail as `mapping_invalid`.

## Protected context API
`GET /api/expense-context?date=YYYY-MM-DD` requires the existing encrypted session and application authorization. It has no generated HEAD or write method. The response is no-store and contains date, base currency, category IDs/labels and currency codes, plus the explicitly requested optional daily observations and monthly totals described below. Mapping/workbook addresses and credentials are not projected. The selected cell's actual formula may include its original references and is returned only to the authorized owner; broader financial history is not exposed.

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

GitHub checks and checked Preview delivery passed for feature commit 7fb78b6. The stable alias points to the ready Node 24 Preview, and deployed health, anonymous/invalid-cookie context denial, secure exact OAuth callback, retained Vercel protection, client-asset privacy and runtime-log scans passed. Real Google owner login and the controlled context request passed: the browser displayed exactly the synthetic date/category/KZT/AED/JPY DTO, and sanitized hosted request history confirmed context 200 versus anonymous/invalid-cookie 401. The initial owner check exposed a named Vercel rewrite capture adding an unwanted path query key; an observed RED/GREEN regression and unnamed /api/(.*) rewrite corrected it without relaxing API validation. Fix 270b469 passed checked CI/Preview; all 400 tests, types/lint, boundaries and builds passed. No real owner/session was fabricated. Step 07 is complete, and the user approved merging/pushing the verified feature on 2026-11-26; local main contains merge dca8987. No Production release or archive occurred.

## Real-workbook findings and future writes
Step 04 inspected June-November through November 26, 2026, read-only. Sanitized structural findings and cached-value verification limits are recorded in the [feature architecture](../ongoing-tasks/spreadsheet-mapping-configuration/feature-architecture.md). Daily/monthly total formulas are heterogeneous, and four reviewed months have differing total definitions. Native-currency buckets and mixed/linked/subtracted expressions also need explicit future write policy. No discrepancy was repaired, and cached checks are not proof of fresh recalculation or correct business inclusions.

Expense registration must separately resolve supported expression grammar, column-native currency handling, write permissions, concurrency, duplicate submissions and ambiguous outcomes. It must not infer an append rule or reuse F39 for every currency/year. Mobile preferences, the expense form, physical iPhone/PWA checks and product Production release remain later features.

## Optional monthly category totals

Schema versions 1 and 2 now accept an optional category monthlyTotal binding, for example `"monthlyTotal":{"row":34,"currency":"KZT"}`. The existing category column/month tab supplies the remaining coordinates. Use a verified explicit row and aggregate currency for each month/year; some columns convert at the aggregate, so this need not equal daily storage or input currency. Missing bindings preserve legacy behavior.

The protected entry-context read may include per-category monthlyTotal with period/status and, when available, the existing finite Sheets amount/currency. The application reads bounded raw cells, groups shared-row requests and limits total rectangle area to 20,000 cells. It does not calculate or repair totals. Blank, error, missing and nonnumeric values are unavailable; a genuine numeric zero remains zero. No mapping address or raw total formula is projected. Expense mutation snapshots do not depend on monthly aggregate values or perform these extra reads. The UI treats this as a small whole-month informational note, excludes the unsaved draft and refreshes after confirmed saving. Live private bindings/fixture changes and hosted verification remain controlled setup steps.

## Recorded expense on the entry screen

The existing owner-only context includes optional per-category recordedExpense with the exact selected date. Status is recorded (amount/currency/formula), empty, or unavailable. A recorded numeric zero remains recorded; error/nonnumeric totals use amount:null, never a guessed zero. The application reads the selected row and existing aggregate rows within a shared 20,000-cell enrichment budget, validates returned coordinates and isolates optional read unavailability. This decoration is exclusive to entry context; core mapping and mutation fingerprints are unchanged.

The entry UI shows a small recorded-amount line before the monthly note, with a native expandable plain-text formula when one exists. It uses category storage currency rather than current input currency, omits the warning for a known empty cell, reports unavailable data explicitly, rejects stale date responses and refreshes after known saving/app return. This advisory observation never replaces Submit's fresh preview/recheck.

The earlier six-category November playground remains physically preserved in Sheet1 A50:G82. The private mapping now replaces that November binding with the structural mock described below; prior January 2020 fixtures remain configured. Real-workbook activation is separate.

## Synthetic annual-workbook mock — 2026-11-28

The user-requested test workbook now has Sep, Oct, Nov and linked Totals tabs, following read-only source layout inspection. Each month has native dates in B, weekday C, daily total A, category headings row 1 and category totals row 34. All actual September–November 2026 dates are configured; short-month template spillover is excluded. Twenty-five named categories are available, retaining their real header labels/columns. Currency-only USD/EUR columns remain in the workbook/summary but are not invented app categories.

KZT is the base; CHF, EUR, USD, UAH and AED refer respectively to F35–F39, RSD to L36 and GBP to L37 on each month tab. These eight choices use synthetic rates. Kiev UAH stores UAH while its monthly aggregate is KZT; the other named categories store KZT. The existing application builds reference-based terms and Google performs calculation. Adding currencies still requires explicit verified settings.

Synthetic examples include grouped additions, a manually authored precedence expression, native-currency buckets, empty cells and a recorded numeric zero. Day 15 has a Supermarket grouped example; November 28 has a recorded zero. Row 34 retains both distinct source total definitions: A34 excludes Utilities/Lessons and follows daily totals, while B34 sums category aggregates excluding Lessons. Their different results are intentional; Totals links both, plus category totals and carry/balance examples. No real expense, income or comment was copied. Old Sheet1 data/styles/notes/comments are preserved. Private configuration was stored locally/Preview; deployment and integration evidence is tracked in the [mock checklist](../ongoing-tasks/realistic-workbook-mock-checklist.md). No real-workbook write or Production activation is included.
