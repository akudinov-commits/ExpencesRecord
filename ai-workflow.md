# Working with AI in this repo

> **Audience: humans.** How to drive AI coding sessions (Claude Code, GitHub Copilot, Cursor, etc.) against this codebase. If you are an AI agent, read `session-start.md` instead.

---

## The concept in 30 seconds

AI coding here is not "chat and hope." It is driven by **three layers of instructions** plus **structured work orders**:

1. **Rules** (`CLAUDE.md` + `.github/copilot-instructions.md`) — auto-loaded every turn. What the AI must never violate.
2. **Orientation** (`session-start.md`) — read once per session. Where things live, what the non-negotiables are.
3. **Execution protocol** (`ongoing-tasks/execution-prompt.md`) — how to run a task: TDD where it applies, task classification, reporting format.

Work is organised as **checklists + step files**. Each feature gets one checklist (the source of truth) and one folder of granular, self-contained steps. The human points the AI at a checklist; the AI ticks its way through the steps.

---

## How to start a session

### 1. Ensure the initiative exists

Either an existing checklist (`ongoing-tasks/{feature-name}-checklist.md` + its `{feature-name}/` steps folder) or create one:

```
# Copy the templates
cp ongoing-tasks/_template/checklist.md \
   ongoing-tasks/{feature-name}-checklist.md
cp -r ongoing-tasks/_template/feature \
   ongoing-tasks/{feature-name}
# Then rename step files: 01-first-step.md → 01-{feature-name}-<short-kebab>.md
```

Write the Goal, Scope, and at least step `01` before invoking the AI.

### 2. Exact prompt to start a session

Paste this verbatim, substituting `{feature-name}`:

```
Read session-start.md and ongoing-tasks/execution-prompt.md.
Then execute ongoing-tasks/{feature-name}-checklist.md starting from
the first unticked step.
```

The AI will:
1. Load `CLAUDE.md` / `.github/copilot-instructions.md` automatically.
2. Read `session-start.md` for orientation.
3. Read `ongoing-tasks/execution-prompt.md` for the execution protocol.
4. Open the checklist, find the first unticked step, open that step file.
5. Implement → add/update tests → tick the checklist item → report briefly → move to the next step.

---

## How to continue a session

### After the AI reports a completed step

```
Continue with the next unticked step in ongoing-tasks/{feature-name}-checklist.md.
```

### After a context reset / new chat

```
Read session-start.md and ongoing-tasks/execution-prompt.md.
Resume ongoing-tasks/{feature-name}-checklist.md — pick up from the
first unticked step. Report the step you're starting before you begin work.
```

### To jump to a specific step

```
Execute step 03 from ongoing-tasks/{feature-name}-checklist.md
(file: ongoing-tasks/{feature-name}/03-{feature-name}-<short-kebab>.md).
```

### To ask a scoping question before coding

```
Read ongoing-tasks/{feature-name}-checklist.md and
ongoing-tasks/{feature-name}/NN-*.md. Do not write code yet.
Report: 1) what you would do first, 2) any ambiguities in the
acceptance criteria, 3) files you would create or modify.
```

### To audit a finished checklist

```
Read ongoing-tasks/audit-checklist-prompt.md, then audit
ongoing-tasks/{feature-name}-checklist.md.
```

---

## Rules of thumb for humans

- **One feature = one checklist.** Don't split a coherent initiative across several.
- **Checklists carry scope + notes; step files carry specifications.** Don't log progress inside a step file — log it in the checklist's `## Notes`.
- **If the AI wants to refactor beyond the step's scope, say no.** Open a new step or a new checklist instead.
- **Architectural decisions go in `adr/NNN-*.md`** (ADRs), not inside a plan or checklist.
- **After a checklist is fully ticked:** move it + its steps folder to `ongoing-tasks/archive/`. Don't delete.
- **Keep `CLAUDE.md` and `.github/copilot-instructions.md` in sync.** They are duplicates by design — one canonical, one mirror. If you change one, mirror immediately.

---

## Where to read more

| To learn about… | Read |
|------------------|------|
| The big picture | `readme.md` |
| Architecture | `docs/architecture/overview.md` |
| How plans / checklists / steps are structured | `docs/methodology/task-workflow.md` |
| Generic feature recipe | `docs/methodology/feature-development.md` |
| Execution protocol (TDD, task classes, reporting) | `ongoing-tasks/execution-prompt.md` |
| Audit prompt | `ongoing-tasks/audit-checklist-prompt.md` |
| AI session entry point | `session-start.md` |
| Hard coding rules | `CLAUDE.md` (or `.github/copilot-instructions.md`) |
| Active architectural constraints | `adr/readme.md` |
