# ExpencesRecord — Coding rules

Read this file before work. `.github/copilot-instructions.md` must remain byte-identical. `AGENTS.md` routes Codex here.

## Approval and scope
No new architectural decisions without explicit human approval: new boundaries, interfaces, storage, services or DI changes need an agreed design. Existing approval in the conversation or an Accepted ADR remains valid; do not ask for it again. Routine work within an authorized plan may proceed.

Plan the full ordered step list with the human before execution. Each title and scope belongs in the feature checklist. A request to execute a clearly defined scope authorizes its routine decomposition; it does not authorize extra features. Detail already agreed steps before running them. If new scope or architecture is needed, stop the dependent work and agree the change before adding, splitting, merging, reordering or expanding steps.

## Where to read what
| Topic | File |
|---|---|
| Project and current state | `readme.md` |
| Human workflow | `ai-workflow.md` |
| Session orientation | `prompts/session-start.md` |
| Execution and TDD | `prompts/execution.md` |
| Feature layout/lifecycle | `docs/methodology/task-workflow.md` |
| Feature recipe | `docs/methodology/feature-development.md` |
| Backend | `docs/methodology/node-service.md`, authoritative project-specific section |
| Frontend | `docs/methodology/react-ui.md`, authoritative project-specific section |
| Architecture | `docs/architecture/overview.md`, `adr/readme.md` |
| Review | `.ignix/review-instructions.md`, `prompts/audit-checklist.md` |
| Operator prompts | `prompts/readme.md` |

## Repository state
ExpencesRecord is a private single-user iPhone PWA for daily expenses in an existing annual Google spreadsheet. React/strict TypeScript FE, Node.js/TypeScript/Fastify BE and Vercel are selected. The foundation now contains React/Fastify shells, manifests, tests and checked-preview configuration. Google login, encrypted sessions and the separate read-only Sheets operator helper are implemented locally in the active feature; real Google owner verification, explicit private credential storage and an authorized isolated-workbook metadata probe have passed. Hosted Preview configuration, checked delivery, anonymous/security checks and real allowed-owner sign-in/logout have passed. All seven feature steps are complete and the user approved merging the verified feature into main on 2026-11-25. The user approved merging spreadsheet mapping/configuration into main on 2026-11-26, completed as merge dca8987. Annual/currency configuration, a bounded raw reader, application mapping and protected GET /api/expense-context are implemented; all seven steps are complete, including real read-only discovery, controlled Google integration, approved private Preview configuration, checked feature publication and real signed-in owner context verification. All 400 tests pass; the hosting rewrite preserves the strict query contract. Missing mapping configuration affects only context availability; existing auth/health stay usable. Safe expense registration is implemented, locally/Preview verified and merged into main under explicit user approval on 2026-11-26. Application owns bounded formula/FX planning, selected-cell preview, configured past dates, advisory duplicate warnings, acknowledgment and final-read comparison under Accepted ADR 007. Protected POST /api/expenses/preview, /api/expenses and /api/expenses/comments use existing owner/Origin/CSRF protection. Separate owner write consent and controlled synthetic N17/O17 tests passed locally; actual cell comments are visible in Google Sheets. Writes default disabled. The user approved Preview-only writer settings and feature publication on 2026-11-26. The three private Preview settings are stored for the isolated 2020-01-15 N17/O17 fixture. Feature commit a94277f is pushed; actual GitHub checks and checked Node 24 Preview delivery passed. Hosted synthetic-session writes/comments/security/privacy checks and the real signed-in owner browser save/read-back are verified. All five expense-backend steps are complete; records remain in place for human review. The user explicitly approved merging this feature into main on 2026-11-26 (merge 367d72d), with the final real-browser verification subsequently completed. Real-workbook activation and Production release remain separate. Distinguish local verification from actual GitHub/Vercel execution; never invent deployment results.

`adr/` records decisions; `docs/` defines architecture/methodology; `ongoing-tasks/` holds features; `prompts/` holds operators; `scripts/verify-bootstrap.ps1` checks bootstrap structure. Tooling is pinned in package.json/package-lock.json: Node 24, npm workspaces, Vite, Vitest, Testing Library, ESLint and dependency-cruiser. Google auth/access follows Accepted ADR 003; expense writes follow the accepted preview/recheck limitations in ADR 007; there is no lock or exactly-once guarantee.

Completed feature awaiting human review: daily-expense-entry-ui on its feature branch, with the user-selected Apple-inspired/teal direction. All seven steps are verified: 705 local tests, checked GitHub/Preview delivery and two real-owner hosted UI saves in the authorized synthetic cells. Read its checklist for actual formula/FX/comment/aggregate/preservation/security evidence and unperformed physical iPhone/Safari checks. Generic UI, feature orchestration, transport and backend application policy remain separate. Only the light/dark appearance enum persists locally; financial drafts and pending comment contexts stay in memory. Real-workbook activation, main merge, Production release, archive and next-feature scaffolding remain separate decisions.

## Mandatory feature gate
- Anything beyond one simple mechanical edit totaling at most **2–3 changed lines** must have its own named feature under `ongoing-tasks/` before substantive work. Count the whole cohesive change, not each file separately.
- Behavior changes, fixes, security/auth, architecture, dependencies, schema/formula or deployment changes require a feature **regardless of line count**. Never split work or call it CONFIG/UI/CLEANUP to bypass this gate.
- One cohesive feature may span many files. Existing active features may cover changes only within their agreed scope; unrelated work needs a separate feature.
- Each feature has `{feature}-checklist.md`, `{feature}/feature-architecture.md`, and ordered `NN-{feature}-<short-kebab>.md` step files. No separate plan.md or task summary.
- Checklist: Goal · Scope · Architecture · Steps · Notes. Step: Goal · Track · What Exists · What to Build · Acceptance Criteria · References. Link steps only once their files exist; undetailed agreed steps stay unlinked and marked `(planned · detail written before execution)`.
- Read checklist → feature architecture → current step → stack recipe → relevant ADRs → execution protocol. Mark a step complete only after its acceptance checks pass; log evidence/decisions in checklist Notes. Keep step scope stable.
- Human review precedes moving completed/superseded pairs to `ongoing-tasks/archive/`.

## Mandatory TDD
- **Every behavior change:** write a focused test, run it and observe RED for the intended missing behavior; implement the minimum; run it and observe GREEN; refactor; rerun the affected suite. Include bug fixes, UI interactions, API/auth, adapters and behavior-bearing configuration.
- Record test identity, exact commands, expected failure and actual GREEN results in checklist Notes. A compiler error, missing package, unrun test, or tests added after implementation is not adequate behavior RED evidence.
- Toolchain bootstrapping may be needed to make tests runnable; establish the harness in its approved foundation step, then prove behavior RED before production behavior implementation. Do not use a missing harness as a test exemption.
- Pure documentation, mechanical edits, type-only declarations and visual-only styling with no behavior use appropriate structure/type/build/visual checks; state why TDD is not applicable. If observable behavior is affected, TDD applies irrespective of classification or line count.
- No discretionary test-skipping exemption for behavior. If tests cannot run, report the blocker and leave the step incomplete. No production financial data as test fixtures.
- These rules are review gates. Run npm run check for types, lint, tests, import boundaries and builds. Passing checks do not themselves prove TDD chronology; retain actual RED/GREEN evidence.

## Backend tripwires
- Controllers own HTTP validation, verified principal handoff, delegation and result mapping only. No business logic.
- Application owns use cases, allowed-user authorization, date/year/category/currency rules, expression accumulation and exact permitted write planning. Its ports are defined inward; no Fastify/Google/Vercel imports, infra imports, environment reads or I/O.
- Infrastructure implements ports: identity verification, credentials, external I/O and error translation. No authorization, cell selection, expense or formula policy there. Composition root wires concrete dependencies and validated config.
- Preserve existing workbook structure, labels, formulas, calculated totals and formatting. Year routing is explicit; the user creates annual workbooks. Do not hardcode F39 as every rate. Unknown formulas/layouts/mappings fail before writes.
- No blind write retries, serverless in-memory locking promises or exactly-once claims. Concurrency/idempotency needs an agreed design before production writes.
- Google access/session mechanism is Accepted in ADR 003: code/PKCE/state/nonce, seven-day encrypted database-free cookies and separate delegated owner Sheets credentials. Real provisioning remains explicitly tracked; no implicit database is introduced.

## Frontend tripwires
- React/strict TypeScript, mobile-first PWA. Keep presentation/interactions distinct from a central API client. Shared DTOs contain no logic or SDK types.
- No direct Sheets access, Google secrets, authoritative FX/accumulation or backend authorization in FE.
- Preferred categories/currencies stay mobile-local; no desktop/server sync. No tokens in localStorage or logs.
- Use unknown + narrowing at untrusted boundaries; no unchecked any. No unselected libraries, bearer-token conventions or enterprise UI requirements inferred from generic recipes.

## Global safety and quality
- Git is the system of record; AI never merges or force-pushes without explicit instruction. Never amend published commits. No commit/push implied by documentation bootstrap.
- No secrets or real private spreadsheet identifiers in commits. Keep environment-specific values in validated configuration; ignore local .env files. Missing required config fails explicitly.
- Validate input at boundaries and enforce policy in application. Parameterize external queries; no user text concatenated into executable commands or unsafely into formulas. Test supported numeric/formula grammar.
- Routes require authentication and application authorization by default. Accepted public exceptions are GET/HEAD /api/health and exact GET /api/auth/login and /api/auth/callback; health stays minimal. Follow Accepted ADR 003 for cookies, CSRF, fixed redirects and session lifecycle. The separate operator setup command binds only to loopback and is never registered by the deployed API.
- Structured logging without financial payloads, tokens or credentials. No silent catches masking dependency/configuration failures. No untracked TODO/FIXME or unrelated cleanup.
- Prefer existing modules and patterns where they obey Accepted ADRs; conflicting legacy/generic examples never override these rules.


## Implemented foundation commands
- Node 24.22.3 / npm 11.19.1; `npm ci` then `npm run check` from the repository root. PowerShell 7 is required for verifier regression tests.
- FE: `apps/web/src`; BE: `apps/api/src/{api,application,infrastructure,bootstrap}`; local startup: `apps/api/src/server.ts`; Vercel: thin root `api/index.ts`.
- Tests: `apps/web/test`, `apps/api/test`, `tests/architecture`, `tests/delivery`. Architecture fixtures intentionally contain prohibited imports and are excluded from source compilation/check scans.
- Health and the four accepted auth routes are implemented. New routes are protected by default; controllers delegate policy to AuthService. Read-only Sheets credentials/probe and owner consent run through separate local operator commands. Google owner/grant/refresh and the authorized ID-only workbook probe are verified in the feature-2 checklist; hosted Preview login/logout and denial checks have passed; no permissive stub guard is present.
- GitHub CI checks, checked Vercel Preview delivery and protected health verification pass; evidence is in the foundation checklist. The user explicitly approved merging and pushing the completed authentication feature to main on 2026-11-25; this does not authorize a product Production release. One foundation-only Production initialization with domain assignment skipped was explicitly approved and completed; ongoing product production rollout remains feature 7.

Operational update (2026-11-28): the approved three-cell synthetic fixture and private Preview-only mapping are verified; both approved UI submissions and checked delivery passed. No main merge/Production or real-workbook changes are included.

Completed review adjustment: expense-date-control, requested on 2026-11-28 and tracked separately on the existing UI feature branch. One native Date field replaces the badge/button/editor combination; weekday/Today/Past and safe-save locking remain. No mapping/spreadsheet changes or main merge; both steps passed with 707 tests, checked Preview and actual native-picker inspection. See its checklist for evidence; retain records for human review.

Completed user-requested follow-up: recorded-expense-context, on the existing UI review branch. Existing entry query/DTO supplies selected-row recorded amount/formula to a small expandable note before monthly total; Submit retains its own preview/recheck. The authorized isolated playground has all November 2026 dates and six categories, retaining January. No new route/service/DI/storage/dependency, credentials or real-workbook/expense writes. All three steps passed: 734 tests, checked Preview and actual owner read-only note/formula/month/category inspection. Read its checklist for evidence; retain records for human review.

Active user-requested configuration follow-up: realistic-workbook-mock, on the existing UI feature branch. Synthetic Sep/Oct/Nov/Totals tabs preserve the real structural patterns and distinct total definitions without copying real financial values. Original Sheet1/comments remain unchanged, January remains mapped, and private local/Preview mapping now covers 91 dates, 25 categories/eight currencies. All three steps passed: Google formula/FX/preservation, application routing, 734 tests, checked delivery and synthetic-session hosted read-only context/formula/security checks. Retain records for review; no fresh interactive owner or physical iPhone check is claimed. No runtime/dependency/architecture change, main merge or Production. Read its checklist for evidence.

Current user-authorized release: production-release-iphone-setup. UI/follow-ups are reviewed, merged/pushed to main (210d806) and main CI passed. Real January-November 2026 mapping and eleven Production-only Secrets are verified; independent cookie keys separate Preview. User confirmed the production Google callback. Home Screen metadata/icons passed focused RED/GREEN; full checks, deployment and phone verification are pending. This request authorizes Production/real-workbook activation, superseding older Preview-only statements for this release. No real financial test writes, preferences or service worker are included. See its checklist and docs/production-and-iphone.md.
