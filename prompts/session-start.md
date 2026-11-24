---
description: "Read at every AI session or context reset."
---

# Session start — ExpencesRecord

1. Read [CLAUDE.md](../CLAUDE.md) (byte-identical Copilot mirror), then [readme.md](../readme.md) for actual project state.
2. Read [ai-workflow.md](../ai-workflow.md), [ADR index](../adr/readme.md) and relevant records, then [architecture](../docs/architecture/overview.md).
3. Read the assigned feature's checklist and architecture, next ordered step, applicable stack recipe and [execution protocol](execution.md).
4. Confirm the change belongs to approved scope. Beyond a simple 2–3-line mechanical edit, require a named feature first; any behavior change needs a feature regardless of size.
5. Follow observed RED → minimum implementation → GREEN → refactor → rerun for every behavior change. Record actual evidence in checklist Notes; tick only after acceptance checks pass.

## Actual repository map
```text
adr/                       accepted decisions and proposed Google access
docs/architecture/         system boundaries and deferred design
docs/methodology/          task, feature, Node and React recipes
ongoing-tasks/             feature checklists/steps and bootstrap inputs
prompts/                   operator prompts
scripts/                   existing bootstrap verification
CLAUDE.md                  canonical rules; Copilot mirror must match
AGENTS.md                  Codex routing to canonical rules
readme.md                  product/current state
ai-workflow.md             human workflow
```
Foundation source exists in apps/web/src and apps/api/src; tests mirror layers outside src, with architecture/delivery suites under tests/. Node 24/npm workspaces and pinned test/build tools are configured. Run npm ci and npm run check. GitHub CI passes and the Vercel project is linked; actual preview verification remains pending. Read the active checklist for current evidence. Google auth/access and concurrent writes remain deferred.

## Non-negotiables
No business logic in controllers or infrastructure; no direct Sheets access from FE; no spreadsheet restructuring or credentials in commits; no unapproved architecture/scope; no test-after-implementation behavior work. Do not ask again for decisions already approved. No standalone task summaries, merges without explicit user instruction or automatic production writes.
