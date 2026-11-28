# Realistic workbook mock — Architecture

## 1. Pipeline / Integration
Read-only source structure -> synthetic local workbook/visual review -> exact new-tab batch in existing test workbook -> Google recalculation/preservation checks -> existing private EXPENSE_WORKBOOKS_JSON -> checked existing Preview branch. No application source changes or new runtime interfaces.

## 2. Component Diagram
Existing owner read grant inspects structural ranges only. Existing owner write grant creates four absent test tabs and their synthetic cells. Existing GetExpenseContext/GetExpenseEntryContext and ExpenseRegistration consume ordinary version-2 per-month mappings. Separate operator work remains private; no new service/DI/store/package.

## 3. Data Flow
Sep/Oct/Nov 2026: real named category headers/column positions; native serial dates in B2:B32 and weekday formulas C; true-month mapping excludes short-month spillover rows. Category totals D34:AD34 preserve native UAH/USD/EUR aggregate conversion at Y/Z/AD. Daily A uses the observed formula; A34 and B34 preserve the two observed distinct total definitions. Rates use synthetic positive values at F35:F39/H35/L36:L37; no real exchange rate or expense is reused. A few deterministic synthetic scalar, grouped-FX and manual-precedence examples exercise the supported grammar. Totals links both monthly definitions and category totals across all three tabs; no real income/personal summary copied.

The 25 named categories are mapped explicitly; currency-only USD/EUR columns remain in the sheet/summary but are not invented app categories. Kiev UAH stores native UAH, its monthly aggregate is KZT; other named categories use KZT. Eight currency codes/rate-cell references follow observed source positions. Existing January 2020 mapping remains. Replace prior flat November 2026 binding with Nov; Sheet1's data remains physically unchanged and its previous mapping is backed up privately.

## 4. Data Stores Summary
Only existing test Google Sheets and ignored local/private Preview mapping. Save fresh test baseline and dispatch journal before writes. Confirm all four titles are absent; no retry after unknown mutation. New sheets have fixed planned IDs and no writes may address Sheet1. All old properties/cells/formats/notes/comments/anchors remain equal after creation.

## 5. Extension Points
Uses current mapping schema and bounded reader. Adding future months remains explicit configuration, with no hardcoded universal F39 or automatic real-workbook writes.

## 6. Security & Isolation
Source workbook only GET; destination ID explicitly equals the existing test workbook and differs from source. Source data never becomes financial test fixtures. No credential upload or auth weakening. Integration RED is real missing Sep/Oct routing under current config; GREEN verifies new routing against actual Google results, totals independently reconciled and synthetic FX change/revert propagates through linked summaries. Native formula/type/error and source-preservation checks supplement existing TDD. No new application behavior is implemented, and no fabricated unit RED is claimed for document styling.
