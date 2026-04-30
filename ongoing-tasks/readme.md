# ongoing-tasks/

Active work orders. **One feature = one checklist + one steps folder.**

## TL;DR

- `{feature-name}-checklist.md` is the **single source of truth** for an initiative (goal, scope, step links, notes).
- `{feature-name}/` holds granular, self-contained step files: `NN-{feature-name}-<short-kebab>.md`.
- `{feature-name}/architecture.md` is the feature's mental model — read at the start of every step.
- No separate `plan.md`. The checklist *is* the plan.
- Completed or superseded work moves to `archive/`.

## System prompts in this folder

| File | Purpose |
|------|---------|
| `execution-prompt.md` | TDD cycle, task classification, reporting format. The AI follows this when executing any step. |
| `audit-checklist-prompt.md` | Post-implementation audit. Run against a finished or in-progress checklist to detect drift, missing tests, dead code, broken wiring. |

## Starting a new initiative

1. Copy `_template/checklist.md` → `{feature-name}-checklist.md`.
2. Copy `_template/feature/` → `{feature-name}/`.
3. Replace `{feature-name}` placeholders inside the copied files. Rename step files: `01-first-step.md` → `01-{feature-name}-<short-kebab>.md`.
4. Fill in `{feature-name}/architecture.md` first (pipeline, components, data flow).
5. Write Goal + Scope in the checklist; write at least step `01` in detail.

## Full conventions

See **[`docs/methodology/task-workflow.md`](../docs/methodology/task-workflow.md)** for templates, naming rules, lifecycle, and relationship to ADRs.

See **[`docs/methodology/feature-development.md`](../docs/methodology/feature-development.md)** for the generic feature recipe (the "how" of building a step).
