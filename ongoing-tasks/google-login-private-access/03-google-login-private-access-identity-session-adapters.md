# 03 — Google login and private access — Implement Google identity and session adapters

## Goal
Implement the external identity and session mechanics behind the application ports approved in steps 01-02. This is a future execution specification; scaffolding does not execute it.

## Track
backend / infrastructure

## What Exists
- The application policy and required ports come from step 02; no Google SDK or session adapter exists today.
- Composition is located under apps/api/src/bootstrap and existing tests use Vitest.

## What to Build
- Write adapter contract tests first under apps/api/test/infrastructure with controlled Google/session doubles; select dependencies only as approved in step 01.
- Implement Google exchange and cryptographic identity verification, including issuer/audience/expiry and flow-specific replay protections required by the accepted design.
- Implement the selected session encoding/storage/refresh/revocation mechanics without inventing an alternative token store or claiming stronger logout guarantees than the design provides.
- Translate provider failures into application-owned outcomes and load/validate required configuration through bootstrap; never place allowed-user policy in adapters.

## Acceptance Criteria
- [ ] Tampered credentials, wrong issuer/audience, expiry, replay/nonce failures where applicable and provider errors fail safely (adapter contract tests and RED/GREEN evidence).
- [ ] Session integrity, expiry/refresh and revocation mechanics match the approved lifecycle (adapter contract tests).
- [ ] Missing required configuration fails explicitly; no SDK types or account-allowlist decisions leak across the inward ports (config tests, import checks and review).
- [ ] Tests use synthetic credentials/doubles and no token values are logged, committed or exposed to the client (security review).

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
- Depends on: [02 — Implement application identity and single-user policy](02-google-login-private-access-application-identity-policy.md) must be complete before execution.
