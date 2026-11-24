# 002 — Google Sheets authority and annual workbook routing

## Status
Accepted — 2026-11-24.

## Context
The existing annual spreadsheet already owns conversion and totals, and the user requires its structure to remain unchanged. Another workbook will be created for 2027.

## Decision
Use Sheets as the authoritative expense store and calculator. Add entries to existing day/category expressions, preserving previous terms, configured rate references, formats and calculated cells. Application owns the permitted-cell and expression plan; infrastructure only executes it. Route years to explicitly configured workbooks. Mobile preferences do not require an extra backend database.

## Consequences
Inspect actual layouts and support only tested expression patterns; fail safely for unsupported formulas/missing years. Resolve concurrency, idempotency and ambiguous write outcomes before production; no safe multi-instance read-modify-write design is yet selected.
