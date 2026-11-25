# Node backend recipe


## Project-specific — ExpencesRecord (authoritative)
These approved project rules replace conflicting generic template examples. Node.js/strict TypeScript + Fastify is selected; the foundation uses Node 24/npm workspaces, TypeScript 6, Vitest and dependency-cruiser. Source is apps/api/src; tests are apps/api/test. Versions are pinned in manifests/lockfile.

- Use API/controllers → application; infrastructure → application-owned ports; composition root → concrete modules. Application imports no Fastify, Google/Vercel SDK, infrastructure or process.env.
- Controllers only validate transport shape, hand off verified identity, call a use case and map results/status. No expense or authorization decisions there.
- Application owns RegisterExpense, allowed-user policy, workbook/year/month/category/currency resolution, accumulation, supported formula parsing and exact permitted write planning. Inject configuration and ports.
- Infrastructure verifies identity cryptographically, acquires credentials, reads Sheets and executes the application's exact write plan. SDK adapters do not select cells, decide authorization or implement expense rules.
- Build a Fastify app independently from its server/hosting adapter; wire dependencies in the composition root with manual injection unless an approved need changes that.
- Observed failing unit/contract/API tests precede each behavior implementation. Test application with fake ports, controllers with Fastify injection and adapters with contract/integration checks. Never use the production workbook as a test fixture.
- Preserve formulas and formatting. Unknown formulas and missing mappings fail before writing. No blind retry, in-memory distributed lock or exactly-once claim. Resolve concurrent submissions and ambiguous writes before production.
- Google flow/session/CSRF/access follows Accepted ADR 003: backend code/PKCE login, seven-day encrypted cookies, exact public exceptions and separate read-only owner grant. Actual configuration and remote verification remain tracked in feature 2. No secrets in client/logs, no SDK types in wire DTOs and no dependency chosen simply because a generic recipe mentions it.
