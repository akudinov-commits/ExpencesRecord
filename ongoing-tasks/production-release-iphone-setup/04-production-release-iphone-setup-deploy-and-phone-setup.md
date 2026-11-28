# 04 — Production release — Deploy checked main and set up the phone

## Goal
Deploy checked main and set up the phone.

## Track
release / configuration / mobile

## What Exists
Reviewed UI, tested owner-only API, isolated Preview and explicit annual mappings.

## What to Build
Merge/push the release changes to main, verify main CI before production build/deployment, verify actual production health/auth/security/read-only context and manifest/assets. Provide the actual production URL and Safari Home Screen installation steps. Record user-confirmed physical-device login/install separately; no financial test submissions, fabricated phone verification or automatic retry of unknown writes.

## Acceptance Criteria
- [ ] The scoped operation and actual verification are recorded; private settings stay outside Git; unavailable owner/physical-device checks remain explicit.

## References
- [Checklist](../production-release-iphone-setup-checklist.md)
- [Architecture](feature-architecture.md)
- [Execution](../../prompts/execution.md)
