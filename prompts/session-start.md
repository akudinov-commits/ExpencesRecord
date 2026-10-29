---
description: "Read at the start of every AI session — orientation and read-on-start order."
---

# session-start.md — Read this first

> Entry point for a fresh AI session in this repo. Read this top-to-bottom at the start of every new chat or context reset.

You are working in **<<PROJECT_NAME>>** — <<ONE_LINE_PROJECT_DESCRIPTION>>.

## Read-on-start (in order)

1. **`CLAUDE.md`** (or `.github/copilot-instructions.md` — same content) — auto-loaded hard rules per stack. Always in context, but re-read deliberately at session start so you can recite the tripwires before writing code.
2. **`template-readme.md`** — template orientation: what this scaffold is, the layered context flow, how the methodology works. (The project's own `readme.md`, if any, is for the project itself — read it for product context, not for the methodology.)
3. **`adr/readme.md`** — index of architectural decisions. Read the index; open individual ADRs only when the work touches them.
4. **`docs/architecture/overview.md`** — system topology and component map.

## When the human assigns a task

1. Open the initiative's checklist: `ongoing-tasks/{feature-name}-checklist.md`. This is the source of truth (goal, scope, step links).
2. Read `ongoing-tasks/{feature-name}/feature-architecture.md` for the big-picture context (pipeline, component diagram, data flow). This is the shared mental model for the feature.
3. Open the next unticked step from `ongoing-tasks/{feature-name}/NN-{feature-name}-*.md`. Each step is self-contained (Goal · Track · What Exists · What to Build · Acceptance Criteria · References).
4. Identify the **target stack** and re-read the matching section in `CLAUDE.md`.
5. If the task requires a recipe, read the matching `docs/methodology/*.md`.
6. Check `adr/` for constraints that forbid certain approaches.
7. Implement → add/update tests → tick the step's item in the checklist. Log decisions/blockers in the checklist's `## Notes`, not in the step file.
8. Do **not** create throwaway markdown files to summarize what you did. Checklist ticks + commit messages + (if architectural) a new ADR are the record.
9. For new initiatives: start from `ongoing-tasks/_template/`. Fill in `feature-architecture.md` first. Full conventions: `docs/methodology/task-workflow.md`.
10. For the execution protocol (TDD cycle, task classification, reporting format), follow `prompts/execution.md`.

## Repo map (cheat sheet)

```
<<TOP_LEVEL_REPO_MAP>>
```

> Bootstrap note: replace the block above with the actual top-level layout, one line per directory, with a short purpose comment. Keep it under 25 lines — it's a cheat sheet, not a sitemap.

## Non-negotiables

- No secrets in code or commits.
- AI agents never merge — changes flow through human review.
- Tests required for new behavior.
- No architectural decisions without explicit human approval — propose, wait, then write.
- Tripwires in `CLAUDE.md` cannot be relaxed without an ADR.
