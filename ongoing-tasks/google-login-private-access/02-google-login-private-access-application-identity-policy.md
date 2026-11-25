# 02 — Google login and private access — Implement application identity and single-user policy

## Goal
Establish the application-owned authentication orchestration and single-user authorization rules selected in step 01, independently of HTTP and Google SDKs. This is a future execution specification; scaffolding does not execute it.

## Track
backend / application

## What Exists
- apps/api/src/application is reserved and has no implemented use cases or ports.
- Step 01 must provide the approved identity/session/access design and exact contracts.

## What to Build
- Write focused tests first under apps/api/test/application for approved sign-in/session/logout policy and configured stable-subject authorization, using fake ports.
- Implement only the use cases, value types and inward ports actually required by the accepted design under apps/api/src/application; do not create speculative expense abstractions.
- Define truthful outcomes for missing/invalid/expired identity, a valid different Google user, session expiry and the approved logout/revocation behavior.
- Keep HTTP mapping, signature/JWKS verification, token exchange, cookie serialization, configuration loading and external I/O outside application policy.

## Acceptance Criteria
- [ ] Meaningful RED precedes each policy behavior; tests then prove the configured subject is allowed and another valid subject is denied (application unit tests and checklist evidence).
- [ ] Invalid/expired identity, session transitions and logout/revocation follow the approved design without relying on email alone (application unit tests).
- [ ] Application imports no Fastify, Google/Vercel SDK, controller, infrastructure, environment-loading or I/O code (type/import checks and review).

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
- Depends on: [01 — Approve Google authentication and access design](01-google-login-private-access-approve-authentication-design.md) must be complete before execution.
