# 02 — Production release — Prepare real-workbook Production settings

## Goal
Prepare real-workbook Production settings.

## Track
release / configuration / mobile

## What Exists
Reviewed UI, tested owner-only API, isolated Preview and explicit annual mappings.

## What to Build
Inspect existing project domains/configuration and the real 2026 workbook read-only. Validate explicit real year/month/date/category/storage/aggregate/FX bindings through the existing application. Set private Production credentials with independent session/flow keys and exact origin, retain Preview test mapping, and register the exact production Google callback. Never test writes against real financial data.

## Acceptance Criteria
- [ ] The scoped operation and actual verification are recorded; private settings stay outside Git; unavailable owner/physical-device checks remain explicit.

## References
- [Checklist](../production-release-iphone-setup-checklist.md)
- [Architecture](feature-architecture.md)
- [Execution](../../prompts/execution.md)
