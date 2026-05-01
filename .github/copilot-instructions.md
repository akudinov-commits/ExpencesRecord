# <<PROJECT_NAME>> — Coding Rules

> **MANDATORY: No architectural decisions without explicit human approval.** Present the idea, explain the tradeoffs, and WAIT for approval before writing any code. This includes new files, new interfaces, new data stores, new services, DI changes, and any structural changes. Never proceed autonomously on design decisions.

> **Auto-loaded every session.** This file is a routing table + tripwires. It tells the AI where to find details and what to never do. Keep it lean.

> **If `<<PLACEHOLDERS>>` are still present below, this repo is in bootstrap mode.** See [template-readme.md § Bootstrap mode](template-readme.md#bootstrap-mode--first-time-setup-in-a-new-or-existing-project) before continuing.

---

## Where to Read What

| Topic | File | When to read |
|-------|------|--------------|
| All operator prompts | `prompts/readme.md` | Looking for a prompt to use — index of every prompt the team uses |
| Bootstrap (one-time, three phases) | `prompts/bootstrap/01-discovery.md` → `02-interview.md` → `03-apply.md` | Repo still has `<<PLACEHOLDERS>>` |
| Adding a new stack post-bootstrap | `prompts/add-stack.md` | Introducing a language/framework not yet covered by tripwires or recipes |
| Session bootstrap | `prompts/session-start.md` | Start of every session |
| Execution protocol (TDD, task classification, reporting) | `prompts/execution.md` | Before executing any step |
| Task workflow (checklists, step files, lifecycle) | `docs/methodology/task-workflow.md` | Starting or refactoring a plan |
| Feature recipe (the "how") | `docs/methodology/feature-development.md` | Before implementing any feature |
| Stack-specific recipes | `docs/methodology/<<STACK_RECIPE>>.md` | Working on a specific stack (add files as needed) |
| .NET service recipe (stub) | `docs/methodology/dotnet-service.md` | Working on any .NET service |
| Python service recipe (stub) | `docs/methodology/python-service.md` | Working on any Python service |
| Node.js service recipe (stub) | `docs/methodology/node-service.md` | Working on any Node.js service |
| React UI recipe (stub) | `docs/methodology/react-ui.md` | Working on a React/TypeScript UI |
| PR review (auto-review instructions) | `.ignix/review-instructions.md` | Customizing what the automated reviewer flags in this repo |
| Architectural constraints | `adr/readme.md` | Before choosing approach A over B |
| Feature architecture overview | `ongoing-tasks/{feature}/feature-architecture.md` | Before working on any step of a feature |
| Plan templates | `ongoing-tasks/_template/` | Creating a new initiative |
| Post-implementation audit | `prompts/audit-checklist.md` | When verifying a completed checklist |

---

## Repository Shape

<<PROJECT_DESCRIPTION_ONE_PARAGRAPH>>

| Path | Stack | Purpose |
|------|-------|---------|
| `<<PATH_1>>` | `<<STACK_1>>` | `<<PURPOSE_1>>` |
| `<<PATH_2>>` | `<<STACK_2>>` | `<<PURPOSE_2>>` |

> Bootstrap note: replace this table with the actual top-level directories of your project. Keep it tight — one row per deployable artifact or major module.

---

## Global Rules

Two tiers. **Universal** rules ship as non-negotiable defaults — flip them off only with an ADR. **Recommended Defaults** are opinionated starting points; turn off the ones your team disagrees with by deleting the bullet (and recording the reason in an ADR if the disagreement is non-obvious).

### Universal — keep on (override only via ADR)

- **Git is the system of record.** AI never merges. Changes flow through PRs / human review.
- **No secrets in code or commits.** Use env vars, secret stores, or vaults. `.env` files are local-only and gitignored.
- **No hardcoded URLs, connection strings, image tags, or environment-specific values.** Pull from configuration.
- **Tests required for new behavior.** If you skip tests, state the reason in the commit message and in the checklist's `## Notes`.
- **Validated input at every service boundary.** No trusting upstream payloads.
- **Parameterised queries only.** No string concatenation into SQL, NoSQL filters, or shell commands.
- **No architectural decisions without approval.** See the banner above.

### Recommended Defaults — opt out by deleting (record reason if non-obvious)

- **No `TODO` / `FIXME` / dead code left behind.** Either finish it inline or escalate. *(Soften to "no new TODOs without a tracking issue link" if your team intentionally uses TODO markers as work queue.)*
- **Structured logging only.** No `print` / `console.log` / `Console.WriteLine` in production paths.
- **Edit existing files before creating new ones.** Don't scatter new helpers — extend the closest existing module.
- **Do not create *task summary* markdown files.** The checklist + commit history + ADRs are the record. *(Release notes, RFC drafts, and similar deliverables are explicitly allowed.)*
- **No fallback values, default data, or graceful degradation for missing config / dependencies.** Fail explicitly with a clear error. *(High-friction in some brownfield contexts — drop if your codebase relies on graceful degradation by design.)*
- **No `try/catch` to silently mask missing modules, imports, or build-time dependencies.** Build failures must be explicit.

---

## Stack-Specific Tripwires

> Replace the placeholder block below with one section per stack used in this repo. Keep each section short — list only the rules that prevent the most common mistakes for that stack.

### <<STACK_1>> (e.g., backend services)

> Full recipe: `docs/methodology/<<STACK_1_RECIPE>>.md`

#### Tripwires — never do this
- `<<TRIPWIRE_1>>` (e.g., "No business logic in controllers / endpoints")
- `<<TRIPWIRE_2>>` (e.g., "No raw database access outside the persistence layer")
- `<<TRIPWIRE_3>>` (e.g., "No `async void` outside event handlers")
- `<<TRIPWIRE_4>>` (e.g., "No hardcoded connection strings or queue names")
- `<<TRIPWIRE_5>>` (e.g., "Shared DTOs / contracts go in the contracts module — never duplicated")

### <<STACK_2>> (e.g., frontend)

> Full recipe: `docs/methodology/<<STACK_2_RECIPE>>.md`

#### Tripwires — never do this
- `<<TRIPWIRE_1>>` (e.g., "No `any` — use `unknown` + narrowing or a proper type")
- `<<TRIPWIRE_2>>` (e.g., "No raw fetch / axios in components — use the shared API client")
- `<<TRIPWIRE_3>>` (e.g., "No business logic in pages — pages compose features only")

---

## Tasks & Plans Workflow

- **One feature = one checklist + one steps folder + one architecture overview.** No separate `plan.md`.
- Active work: `ongoing-tasks/{feature-name}-checklist.md` (source of truth) + `ongoing-tasks/{feature-name}/feature-architecture.md` (big-picture context) + `ongoing-tasks/{feature-name}/NN-{feature-name}-<short-kebab>.md` (step files).
- Checklist sections: Goal · Scope · Architecture (link) · Steps (GitHub task list linking to step files) · Notes.
- Architecture file: feature-level pipeline / component diagram / data flow / data stores / extension points / security.
- Step file sections: Goal · Track · What Exists · What to Build · Acceptance Criteria · References.
- Numbering: zero-padded `NN`. Phased (`1.1`, `2.3`) only when the checklist explicitly groups into tracks.
- Completed or superseded → move pair into `ongoing-tasks/archive/`.
- **Architectural decisions** go in `adr/NNN-title.md` with sections: Status · Context · Decision · Consequences.
- Full conventions: `docs/methodology/task-workflow.md`. Template: `ongoing-tasks/_template/`.

When the AI starts work on a step:
1. Read `prompts/session-start.md` (session bootstrap).
2. Read `ongoing-tasks/{feature}/feature-architecture.md` for the feature's big-picture context.
3. Identify the target stack and re-read the matching tripwires section above.
4. If the task requires a recipe, read the matching `docs/methodology/*.md`.
5. Check `adr/` for constraints that forbid certain approaches.
6. Follow `prompts/execution.md` for TDD cycle, task classification, and reporting.
7. Implement → add/update tests → tick the checklist item → leave step files' scope intact (step files are specifications, not logs; log in the checklist's `## Notes`).

---

## AI Tool Usage

- Track progress with the agent's todo / task tracker — one entry per checklist item being worked.
- Fire **independent** file reads / searches in parallel; sequence only when one result feeds the next.
- Read the relevant `docs/methodology/*.md` recipe **before** proposing patterns — don't invent conventions.
- Prefer dedicated file tools over shelling out for file operations.
- Never amend a published commit; create a new one. Never force-push without explicit user instruction.

---

## Security (OWASP-aware)

- Validate all inputs at the service boundary.
- Parameterize all queries. No string concatenation into SQL, NoSQL filters, or shell commands.
- AuthN/AuthZ on every non-health endpoint. Health endpoints are anonymous and minimal.
- Treat LLM output as untrusted input — sanitize before executing, rendering as HTML, or writing to disk.
- Sandbox / resource-limit any user-driven code execution paths. Do not loosen these defaults without an ADR.

---

## When in Doubt

- Ask before making cross-cutting refactors.
- Prefer extending an existing pattern over inventing a new one.
- If a rule above contradicts the code you're editing, the **code is the legacy** — flag it as tech debt and match the closest recent pattern.
