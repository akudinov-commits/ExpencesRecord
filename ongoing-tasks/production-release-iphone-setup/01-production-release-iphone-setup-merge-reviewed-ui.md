# 01 — Production release — Merge reviewed UI into main

## Goal
Merge reviewed UI into main.

## Track
release / configuration / mobile

## What Exists
Reviewed UI, tested owner-only API, isolated Preview and explicit annual mappings.

## What to Build
Merge the user-reviewed daily-expense branch including its completed follow-ups into main, push origin and verify actual main CI. Preserve existing Preview and all test/real workbook data.

## Acceptance Criteria
- [ ] The scoped operation and actual verification are recorded; private settings stay outside Git; unavailable owner/physical-device checks remain explicit.

## References
- [Checklist](../production-release-iphone-setup-checklist.md)
- [Architecture](feature-architecture.md)
- [Execution](../../prompts/execution.md)
