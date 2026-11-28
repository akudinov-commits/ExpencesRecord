# Production release and iPhone setup

## Goal
Merge the reviewed app, deploy Production using the real expense workbook, and help the owner install the production app on iPhone.

## Scope
- In scope: the four ordered steps below, existing Vercel project/Google owner, private real-workbook mapping, basic Home Screen branding and production checks.
- Out of scope: mobile preferences, zero-cell warning behavior changes, new services/storage/interfaces/dependencies, service workers/offline submission, copied real financial fixtures, automatic real-sheet edits, unverified annual workbooks or a claimed complete feature-7 certification.
- Dependencies: [reviewed UI](daily-expense-entry-ui-checklist.md), [mapping](spreadsheet-mapping-configuration-checklist.md), [auth](../adr/003-google-authentication-and-access.md), [write limits](../adr/007-expense-preview-and-write-limits.md), [execution](../prompts/execution.md).

## Architecture
See [feature-architecture.md](production-release-iphone-setup/feature-architecture.md). Existing FE/API/application/infrastructure boundaries and default owner authorization remain unchanged.

## Steps
- [ ] [01 — Merge reviewed UI into main](production-release-iphone-setup/01-production-release-iphone-setup-merge-reviewed-ui.md)
- [ ] [02 — Prepare real-workbook Production settings](production-release-iphone-setup/02-production-release-iphone-setup-production-configuration.md)
- [ ] [03 — Prepare iPhone Home Screen metadata](production-release-iphone-setup/03-production-release-iphone-setup-home-screen-metadata.md)
- [ ] [04 — Deploy checked main and set up the phone](production-release-iphone-setup/04-production-release-iphone-setup-deploy-and-phone-setup.md)

## Notes
- 2026-11-28: the user explicitly approved merging to main, publishing Production and setting up the iPhone app, then selected the real Expences 2026 workbook. This supersedes earlier Preview-only/no-merge restrictions for this release. The four steps are routine decomposition of that request. Real workbook inspection/configuration is authorized; no financial test mutation is needed. Full preferences and service-worker/update features remain separate. First release checks were interrupted by approval-service usage limits before any merge/deployment; the user reset limits and work resumed. Independent Production cookie keys and unchanged Preview avoid cross-environment sessions/configuration.
