# 07 — Google login and private access — Verify security, checked Preview delivery and handoff

## Goal
Verify the complete allowed-user flow on the checked Vercel Preview and record the actual security and operational evidence. This is a future execution specification; scaffolding does not execute it.

## Track
cross-cutting / verification

## What Exists
- Steps 01-06 must provide the approved design, tested layers, UI and server-side access readiness.
- The existing Foundation workflow runs checks before Preview delivery; product production rollout remains feature 7.

## What to Build
- Run npm run check and a clean-checkout/CI verification; confirm required failures still block delivery and that authentication does not change the thin hosting boundary.
- Verify allowed-user sign-in, other-user denial, protected-route denial, expiry/refresh, the approved logout/revocation behavior and callback/CSRF failure paths on controlled accounts and fixtures.
- Check the mobile browser flow, exact redirect origins, Vercel deployment protection and secure runtime configuration separately; a deployment token is not an application or Google credential.
- Reconcile readme, architecture, ADR 003, active recipes and canonical instruction mirrors with the implemented mechanism; record real results and outstanding prerequisites in checklist Notes.
- Present completion for human review before archiving; leave mapping, expenses, preferences and production rollout to their roadmap features.

## Acceptance Criteria
- [ ] All preceding criteria and observed RED/GREEN records are complete; types/lint/tests/import boundaries/builds pass from documented commands (CI and evidence review).
- [ ] Actual checked Preview verification proves the configured user can sign in/out and a different or unauthenticated user cannot access protected functionality (isolated end-to-end/security evidence).
- [ ] Secrets, private workbook identifiers and sensitive provider errors are absent from logs, client bundles and commits; no production workbook writes occur (security review).
- [ ] Instructions/mirrors/links describe actual implementation, and completion is reported before any archival or product production release (document/lifecycle review).

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
- Depends on: [06 — Establish approved server-side Sheets access](06-google-login-private-access-server-side-sheets-access.md) must be complete before execution.
