# 04 — Google login and private access — Wire protected authentication API and composition

## Goal
Expose the accepted authentication contracts and establish protection by default without putting authorization policy into controllers. This is a future execution specification; scaffolding does not execute it.

## Track
backend / API / composition

## What Exists
- Only GET /api/health and framework-provided HEAD are currently exposed anonymously.
- Steps 02-03 provide application policy, ports and identity/session mechanics; api/index.ts remains a thin host adapter.

## What to Build
- Write Fastify/API and host-adapter tests first under apps/api/test/api and tests/delivery for the approved login/callback/session/logout contracts.
- Keep controllers in apps/api/src/api responsible for HTTP validation, cookie/redirect/status mechanics and delegation; wire concrete dependencies under bootstrap.
- Apply authentication by default and application authorization to protected routes. Permit only the minimal health and explicitly approved login/callback public exceptions.
- Implement the selected CSRF, cookie, callback-state and safe-return-URL controls at the appropriate boundary, delegating access decisions to application use cases.
- Prove future protected-route registration using test-only route fixtures; do not add a public diagnostic or fake expense endpoint to production.

## Acceptance Criteria
- [ ] Absent/invalid/expired sessions and a different valid Google user cannot reach protected functionality; the configured subject can (API integration tests and RED/GREEN evidence).
- [ ] The explicit exception list is tested, health stays minimal, and new protected-route fixtures fail closed (API tests).
- [ ] Callbacks, cookie attributes, logout method/CSRF, replay and return-URL handling match the accepted design (negative API/security tests).
- [ ] Controllers contain no allowed-user, session-lifecycle or expense policy; the portable Fastify and Vercel paths use the same composition (review, boundaries and adapter tests).

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
- Depends on: [03 — Implement Google identity and session adapters](03-google-login-private-access-identity-session-adapters.md) must be complete before execution.
