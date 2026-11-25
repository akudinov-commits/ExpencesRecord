# 05 — Google login and private access — Add sign-in, private shell and logout interface

## Goal
Let the allowed user sign in and out from the mobile-first shell while treating backend authorization as authoritative. This is a future execution specification; scaffolding does not execute it.

## Track
frontend

## What Exists
- apps/web/src/app/App.tsx currently renders a static foundation shell.
- Step 04 supplies the approved HTTP contracts and protections; no frontend auth client or auth state exists.

## What to Build
- Write interaction tests first under apps/web/test for initial session checking, signed-out sign-in, signed-in shell, denied access, expired session, retryable failures and logout.
- Introduce a small central API client and presentation/state boundaries under apps/web/src, using only the approved wire contracts and chosen session mechanism.
- Use the approved backend-mediated login/logout flow; render useful loading/error states without showing protected content as a security assumption.
- Keep Google/deployment credentials and tokens out of frontend storage, URLs exposed by the app, logs and bundles; leave preferences and expense UI for later features.

## Acceptance Criteria
- [ ] Signed-out, allowed, denied, expired and network-failure states have meaningful interaction RED/GREEN evidence (frontend tests).
- [ ] Sign-in navigation and logout follow the accepted contracts, and failed logout is not presented as successful server-side revocation (frontend/API-client tests).
- [ ] The UI remains usable on iPhone-sized screens, with accessible controls and clear error states (visual/accessibility review).
- [ ] No direct Google Sheets calls, credential persistence, expense form or preferences implementation is introduced (bundle/source review).

## References
- [Feature checklist](../google-login-private-access-checklist.md)
- [Feature architecture](feature-architecture.md)
- [Layer boundaries](../../adr/001-layer-boundaries.md)
- [Google authentication and access — Accepted](../../adr/003-google-authentication-and-access.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Execution protocol](../../prompts/execution.md)
- [Task workflow](../../docs/methodology/task-workflow.md)
- [Node recipe](../../docs/methodology/node-service.md)
- [React recipe](../../docs/methodology/react-ui.md)
- Depends on: [04 — Wire protected authentication API and composition](04-google-login-private-access-protected-authentication-api.md) must be complete before execution.
