# 04 — Spreadsheet mapping and configuration — Review the real spreadsheet, read-only

## Goal
Review the explicitly supplied real expense workbook for the last six months and document category frequency, FX cells, daily accumulation and totals before application mapping. This is a future research step; do not run it during scaffolding.

## Track
cross-cutting / read-only discovery

## What Exists
- The user supplied the real Expences 2026 link in the conversation and explicitly deferred reviewing it until this planned step.
- The existing read-only owner grant is selected; steps 02-03 must supply the approved bounded read mechanism.
- The isolated blank test workbook is not the real expense workbook and has no verified representative data/layout.

## What to Build
- Record the precise six-month date interval, selected monthly tabs and partial/current-month treatment. Discover the actual layout and exclude summary/rate/helper rows from daily category usage.
- Rank the most-used categories by an explicitly defined frequency measure; distinguish populated expense-day/category cells from individual purchases and exclude zero placeholders/total rows.
- Trace actual FX formulas to their rate cells, labels, base/quote meaning and relative/absolute/cross-tab references. Check F39 only as the known example, and identify how newly user-added currency cells could be configured without code-specific currency branches.
- Inspect representative daily cells to understand repeated additions, existing terms, constants, converted/mixed-currency expressions and unsupported forms; record sanitized structural examples without implementing expression rewriting.
- Trace and reconcile daily, category and monthly totals using their actual ranges and cached/effective values. Record unexplained mismatches, excluded categories, broken references or double-counting; do not repair or temporarily edit anything.
- Summarize findings and unresolved mapping rules in checklist Notes/feature-architecture.md using sanitized structural evidence. Present permitted category rankings privately; keep raw financial values/formulas and workbook IDs out of Git, logs and test fixtures. Review findings before step 05.

## Acceptance Criteria
- [ ] The real workbook is reviewed only when this step is authorized for execution; the recorded interval and frequency definition make the ranking reproducible (read-only discovery evidence).
- [ ] FX precedents and currency extension requirements are traced to actual inspected cells; unknown or ambiguous mappings remain explicit and no universal F39/fixed-currency assumption is made (formula/reference review).
- [ ] Daily accumulation and daily/category/monthly totals are explained or discrepancies explicitly reported, without claiming cached values prove fresh recalculation (formula/value reconciliation evidence).
- [ ] No workbook value, formula, rate cell, formatting, structure, sharing or permissions are changed; there are no temporary edits or production financial fixtures (request/diff/security review).
- [ ] Findings and remaining decisions are reviewed before step 05; no future write grammar, permission upgrade or concurrency design is silently selected here (handoff review).

## References
- [Feature checklist](../spreadsheet-mapping-configuration-checklist.md)
- [Feature architecture](feature-architecture.md)
- [Layer boundaries](../../adr/001-layer-boundaries.md)
- [Sheets authority and annual routing](../../adr/002-sheets-authority-and-year-routing.md)
- [Google authentication and read-only access](../../adr/003-google-authentication-and-access.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Execution protocol](../../prompts/execution.md)
- [Task workflow](../../docs/methodology/task-workflow.md)
- [Node recipe](../../docs/methodology/node-service.md)
- Depends on: [03 — Implement read-only infrastructure readers](03-spreadsheet-mapping-configuration-read-only-infrastructure-readers.md) must be complete before execution.
