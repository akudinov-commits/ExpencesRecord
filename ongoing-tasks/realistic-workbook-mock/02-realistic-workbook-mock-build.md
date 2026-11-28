# 02 — Realistic workbook mock — Build synthetic tabs

## Goal
Build synthetic tabs.

## Track
spreadsheet / configuration / integration

## What Exists
Existing owner grants, bounded application mappings, checked Preview and preserved test Sheet1.

## What to Build
Build/render a local structural analogue with bundled spreadsheet tools, inspect every new tab, then create only absent Sep/Oct/Nov/Totals tabs. Verify dates/formulas/totals, synthetic input change/revert propagation and preservation of all existing test content.

## Acceptance Criteria
- [ ] Google calculates all affected formulas without errors; independent sample totals reconcile; synthetic FX change/revert updates month/summary; original Sheet1 content/styles/notes/comments remains unchanged.

## References
- [Checklist](../realistic-workbook-mock-checklist.md)
- [Architecture](feature-architecture.md)
- [Execution](../../prompts/execution.md)
