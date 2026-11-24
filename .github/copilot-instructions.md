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
ExpencesRecord is a private single-user iPhone PWA for daily expenses in an existing annual Google spreadsheet. React/strict TypeScript FE, Node.js/TypeScript/Fastify BE and Vercel are selected. This is a documentation scaffold: no app source, manifests, tests or deployment pipelines exist yet. Never claim planned paths or tools are installed.

`adr/` records decisions; `docs/` defines architecture/methodology; `ongoing-tasks/` holds features; `prompts/` holds operators; `scripts/verify-bootstrap.ps1` checks bootstrap structure. Toolchain versions, frontend/test tooling, Google flow and safe concurrent writes remain deferred.

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
- These rules are review gates. Application test automation and import checks must be installed in the future foundation feature; documentation does not itself prove chronology or passing app tests.

## Backend tripwires
- Controllers own HTTP validation, verified principal handoff, delegation and result mapping only. No business logic.
- Application owns use cases, allowed-user authorization, date/year/category/currency rules, expression accumulation and exact permitted write planning. Its ports are defined inward; no Fastify/Google/Vercel imports, infra imports, environment reads or I/O.
- Infrastructure implements ports: identity verification, credentials, external I/O and error translation. No authorization, cell selection, expense or formula policy there. Composition root wires concrete dependencies and validated config.
- Preserve existing workbook structure, labels, formulas, calculated totals and formatting. Year routing is explicit; the user creates annual workbooks. Do not hardcode F39 as every rate. Unknown formulas/layouts/mappings fail before writes.
- No blind write retries, serverless in-memory locking promises or exactly-once claims. Concurrency/idempotency needs an agreed design before production writes.
- Google access/session mechanism remains Proposed; no credentials provisioned or implicit database introduced.

## Frontend tripwires
- React/strict TypeScript, mobile-first PWA. Keep presentation/interactions distinct from a central API client. Shared DTOs contain no logic or SDK types.
- No direct Sheets access, Google secrets, authoritative FX/accumulation or backend authorization in FE.
- Preferred categories/currencies stay mobile-local; no desktop/server sync. No tokens in localStorage or logs.
- Use unknown + narrowing at untrusted boundaries; no unchecked any. No unselected libraries, bearer-token conventions or enterprise UI requirements inferred from generic recipes.

## Global safety and quality
- Git is the system of record; AI never merges or force-pushes without explicit instruction. Never amend published commits. No commit/push implied by documentation bootstrap.
- No secrets or real private spreadsheet identifiers in commits. Keep environment-specific values in validated configuration; ignore local .env files. Missing required config fails explicitly.
- Validate input at boundaries and enforce policy in application. Parameterize external queries; no user text concatenated into executable commands or unsafely into formulas. Test supported numeric/formula grammar.
- All non-health endpoints require authentication and application authorization; health exposes minimal information. Exact Google/session/CSRF mechanics require ADR resolution.
- Structured logging without financial payloads, tokens or credentials. No silent catches masking dependency/configuration failures. No untracked TODO/FIXME or unrelated cleanup.
- Prefer existing modules and patterns where they obey Accepted ADRs; conflicting legacy/generic examples never override these rules.
