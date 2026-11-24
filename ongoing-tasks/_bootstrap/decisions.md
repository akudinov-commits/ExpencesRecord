# Bootstrap decisions — 2026-11-24

## Authorization
The user selected Vercel, approved the proposed separated architecture, then explicitly requested bootstrap, TDD enforcement and feature tracking for changes beyond a simple 2–3-line update. This record captures those conversation decisions; it is not a new request to approve them again.
Bootstrap creates documentation and rules only. It does not implement the app.

## Project identity
- ExpencesRecord: private, single-user iPhone PWA for entering daily expenses into an existing annual Google spreadsheet.
- React with strict TypeScript frontend; Node.js/TypeScript with Fastify backend; Vercel hosting.
- Initial entry fields: date, amount, category, currency. Repeated entries add to the existing day/category expression.
- Remember preferred categories/currencies on mobile only. Google Sheets retains currency conversion and totals.
- Preserve the workbook structure, category labels, formulas and formatting. The user creates the 2027 workbook; configure year routing rather than automatically creating it.

## Architecture sketch
FE calls the backend API. API/controllers validate transport shape and delegate. Application use cases own all business policy, authorization, date/year/category/currency decisions, accumulation and formula write planning. Infrastructure implements application-owned ports for Google identity/Sheets I/O without business policy. Composition root wires concrete dependencies and validated configuration. Application imports no Fastify, Google SDK, Vercel SDK, controllers or infrastructure. Shared wire contracts contain no logic.
The application produces an exact permitted write plan; infrastructure executes it. Existing formula expressions are preserved. FX rate references are layout/currency-specific, not a universal F39 constant. Concurrency and idempotency remain unresolved before production writes.

## Tripwires
Backend: no business logic in controllers; no business logic in infrastructure; no application dependency on frameworks/adapters; no hardcoded workbook/cell/identity configuration; no blind read-modify-write retries or in-process serverless locking promises; no credentials or tokens in logs/client code.
Frontend: no Google credentials/direct Sheets access; no FX calculation or authoritative accumulation; no unselected libraries presented as installed; no desktop/server preference synchronization; no tokens stored in localStorage; strict TypeScript without unchecked any.
Workflow: observed RED → minimum implementation → GREEN → refactor → rerun tests for all behavior changes, including fixes. Pure documentation/mechanical changes use appropriate nonbehavioral checks. A feature is mandatory beyond a simple 2–3-line mechanical edit; behavior changes need a feature regardless of line count.

## Recipe decisions
| Recipe | Action | Reason |
|---|---|---|
| node-service.md | FILL-WITH-PROJECT-SPECIFICS | Approved Fastify/API/application/infrastructure boundaries override generic conflicting examples |
| react-ui.md | FILL-WITH-PROJECT-SPECIFICS | Approved mobile PWA; remove assumptions about enterprise identity/UI dependencies |
| dotnet-service.md | DELETE | C# was superseded by the selected Node/TypeScript stack |
| python-service.md | DELETE | Python is not an application stack |

## Pending ADRs
- Separate frontend, API, application, infrastructure and composition
- Google Sheets authority and annual workbook routing
- Google authentication and spreadsheet access
- Vercel hosting and portable deployment
- Mobile-local preferences
- TDD and feature-scoped changes

## Bootstrap application notes
The reusable Apply prompt scaffolds Proposed ADRs only. The user's later explicit architecture approval and request to make it part of ADRs also authorize recording the accepted decisions in this feature; Google access remains Proposed. The user's TDD/layering requirements supersede contradictory generic examples. Preserve the untouched plan/ADR templates. Retain bootstrap inputs until human review; do not commit or push in this task. Remove inherited unrelated Claude tool allow entries and ignore future local build/secret artifacts.

## Pending follow-ups
- Select frontend tooling, Node/package-manager versions, test runners and import-boundary checks in a dedicated application-foundation feature before writing application behavior.
- Approve Google OIDC flow, session/CSRF mechanism, identity allowlist and Sheets access method. Keyless service account federation is a candidate, not configured; OAuth token storage would require a separate decision.
- Resolve serverless concurrency, idempotency, supported formula parsing and safe write limits before production expense writes. Sheets batch atomicity does not provide read-modify-write isolation.
- Select Vercel packaging and GitHub pipeline; use one deployment owner to avoid duplicate deployments. No workflow or cloud resources are created here.
- Inspect actual workbook mappings, formulas, currency/rate references and annual rollover in a later read-only feature. Do not hardcode identifiers from the conversation.
- User review precedes deleting _bootstrap inputs and archiving the completed feature.


## Foundation interview reconciliation — 2026-11-24
- Identity, scope, React/TypeScript, Fastify/TypeScript, Vercel, layers, spreadsheet preservation, mobile-local preferences and existing ADR subjects were answered in the earlier discussion and approved plan. Reuse those answers rather than restart the interview.
- The user explicitly approved the proposed tooling/layout, requested the complete code/test folder tree, then approved proceeding with that tree. This closes the missing stacks/service-inventory topic for this foundation.
- Confirmed: Node 24 LTS, npm workspaces, React + Vite, Fastify, Vitest + React Testing Library, ESLint and dependency-cruiser. FE is apps/web; BE is apps/api/src/{api,application,infrastructure,bootstrap}; tests mirror layers outside src. Root api/index.ts is a thin Vercel adapter. Shared contracts are added only when actually needed.
- Existing tripwires/recipes/architecture remain the user-approved constraints: no business logic in controllers/infrastructure; inward application ports; TDD; protected business endpoints; no spreadsheet redesign or new database. No additional review exceptions are introduced (the interview prompt's default is none). Node/React recipes remain active; .NET/Python are not application stacks.
- Foundation detail within the approved scope: a static accessible ExpencesRecord shell; GET /api/health returns only {"status":"ok"}; no business/login endpoints. Local startup reads required HOST/PORT through bootstrap config. Google identity/session/CSRF and public callback exceptions remain feature-2 decisions.
- Delivery detail: one Vercel project serves static FE plus the thin Node API function under /api. GitHub Actions owns preview delivery after required checks; disable automatic Git-based deployment to avoid a parallel bypass. No production deployment in this feature. Actual preview needs the user's Vercel project/account configuration; missing credentials are reported, never replaced with fabricated IDs.
- Compatible pins checked against official npm registry metadata: Node 24.22.3 / npm 11.19.1, React 19.3.1, Vite 8.3.8, Fastify 5.12.8, Vitest 5.1.1, TypeScript 6.0.3. TypeScript 7 is deliberately not selected because typescript-eslint 8.74.0 requires TypeScript <6.1. All dependencies will be pinned in the lockfile.
- Exact commands: npm ci; npm run typecheck; npm run lint; npm test; npm run check:boundaries; npm run build; npm run check. Their implementation is step 02 onward; no test results are asserted here.
- The user's execution request explicitly authorizes a separate branch, merge into main after verification, and push to origin. It supersedes earlier planning-only/no-commit restrictions. Completed feature files remain active until completion review; no automatic archiving is implied.

## Interview provenance and limits
The earlier bootstrap did not conduct a separate seven-question chat interview. This reconciliation records the existing answers plus the user's explicit tooling/tree approval; it does not invent additional human answers or claim that separate questions were asked. No pending Google/expense decisions are silently accepted.
