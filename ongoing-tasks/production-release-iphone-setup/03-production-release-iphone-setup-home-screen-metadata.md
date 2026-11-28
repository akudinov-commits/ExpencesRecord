# 03 — Production release — Prepare iPhone Home Screen metadata

## Goal
Prepare iPhone Home Screen metadata.

## Track
release / configuration / mobile

## What Exists
Reviewed UI, tested owner-only API, isolated Preview and explicit annual mappings.

## What to Build
Observe a focused installation-metadata RED, add only a same-origin web manifest and existing E/teal-brand icons with Apple metadata, then observe GREEN and run full checks. Retain same-origin auth and in-memory financial state; no service worker, offline cache/queue or new dependency.

## Acceptance Criteria
- [ ] The scoped operation and actual verification are recorded; private settings stay outside Git; unavailable owner/physical-device checks remain explicit.

## References
- [Checklist](../production-release-iphone-setup-checklist.md)
- [Architecture](feature-architecture.md)
- [Execution](../../prompts/execution.md)
