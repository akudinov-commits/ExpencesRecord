# 01 — Google login and private access — Approve Google authentication and access design

## Goal
Resolve the open identity, session and Sheets-access choices before introducing runtime behavior or provisioning credentials. This is a future execution specification; scaffolding does not execute it.

## Track
cross-cutting / design

## What Exists
- ADR 003 is Proposed; Google sign-in, sessions and Sheets credentials are not implemented.
- The React/Fastify foundation, tests, import checks and protected Vercel Preview delivery are verified.

## What to Build
- Research current official Google and Vercel requirements, compatibility and free-tier constraints during execution; record primary references and alternatives in ADR 003.
- Propose exact Google login/callback flow, identity verification, allowed-user enrollment by stable Google subject, account-denial behavior and minimal session-status/logout contracts.
- Decide session representation, expiry/renewal, logout and revocation semantics, cookie attributes, CSRF/state/nonce/replay controls, return-URL validation and required storage. Do not silently introduce a database.
- Compare service-account access with keyless federation against delegated user OAuth for Sheets; decide least-privilege scopes, annual-workbook access, credential refresh/revocation and secure storage.
- Specify exact local/Preview redirect origins, how changing Preview URLs are handled, configuration names, selected dependencies and the small explicit public login/callback exception list.
- Present the concrete design and setup prerequisites for human approval; record provenance and accept ADR 003 only after that decision. This step does not provision accounts or credentials.

## Acceptance Criteria
- [ ] An approved ADR resolves the Google flow, session/CSRF model, stable-subject enrollment and Sheets access method, or the dependent steps remain blocked (document review).
- [ ] Endpoint exceptions, trust boundaries, dependency choices, configuration names, expiry/refresh/revocation and local/Preview setup are explicit (design/security review).
- [ ] No existing approved stack/layer choice is reopened and no runtime code, secrets, cloud resources or workbook changes are produced in this decision step (diff review).

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
- Depends on: the verified foundation. The user authorized feature execution on 2026-11-25; explicit approval of the new concrete ADR 003 design is still required before dependent implementation.
