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
No application source, manifests, tests or CI exist yet. Planned FE/BE modules are not directories to assume present. Frontend tooling, test runners, versions, auth/access, concurrent writes and deployment packaging remain deferred.

## Non-negotiables
No business logic in controllers or infrastructure; no direct Sheets access from FE; no spreadsheet restructuring or credentials in commits; no unapproved architecture/scope; no test-after-implementation behavior work. Do not ask again for decisions already approved. No standalone task summaries, merges or automatic production writes.
