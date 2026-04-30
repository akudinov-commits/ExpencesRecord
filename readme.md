# Context-Driven Development — Template Repo

> A reusable scaffold for AI-assisted software projects. Drop it into a fresh repo or layer it onto an existing one, then let an AI agent fill in the placeholders.

This repo is **not a working project**. It is a structured prompt system — a set of files that tell an AI coding agent (Claude Code, GitHub Copilot, Cursor, etc.) where to find rules, what to read first, how to plan work, and how to execute it.

The same idea drives serious AI-coding setups in larger codebases. This repo distils the pattern into a stack-agnostic skeleton that you can copy and adapt.

---

## The 30-second pitch

AI coding here is not "chat and hope." It runs on **three layers of guidance** plus **structured work orders**:

1. **Auto-loaded rules** (`CLAUDE.md` + `.github/copilot-instructions.md`) — what the AI must never violate. Loaded every turn, no matter what.
2. **Session bootstrap** (`session-start.md`) — read once per session. Where things live, what the non-negotiables are.
3. **Execution protocol** (`ongoing-tasks/execution-prompt.md`) — how to run a task: classification, TDD where it applies, reporting format.

Work is organised as **checklists + step files**. One feature = one checklist (the source of truth) + one folder of granular, self-contained steps. The human points the AI at a checklist; the AI ticks its way through the steps.

Architectural decisions live in **ADRs** under [`adr/`](adr/). The AI reads them as constraints, not history.

---

## Repo structure

```
.
├── readme.md                       This file — vision, context flow, how to bootstrap
├── CLAUDE.md                       Auto-loaded routing table + tripwires (Claude Code)
├── .github/
│   └── copilot-instructions.md     Mirror of CLAUDE.md (auto-loaded by GitHub Copilot)
├── session-start.md                Read-once-per-session bootstrap
├── ai-workflow.md                  Human guide: how to drive AI sessions in this repo
│
├── docs/
│   ├── methodology/
│   │   ├── task-workflow.md        How checklists + step files work (conventions, lifecycle)
│   │   └── feature-development.md  Generic feature recipe — the "how" of building
│   └── architecture/
│       └── overview.md             Project topology (placeholders to fill on bootstrap)
│
├── adr/
│   ├── readme.md                   ADR index + format guide
│   └── _template.md                Copy this when writing a new ADR
│
└── ongoing-tasks/
    ├── readme.md                   TL;DR + pointer to methodology
    ├── execution-prompt.md         TDD / task-classification / reporting protocol
    ├── audit-checklist-prompt.md   Post-implementation audit prompt
    ├── _template/                  Copy-paste starter for a new initiative
    │   ├── checklist.md            → copy to ../{feature-name}-checklist.md
    │   └── feature/                → copy to ../{feature-name}/
    │       ├── architecture.md
    │       └── 01-first-step.md
    └── archive/                    Completed or superseded checklists land here
```

---

## How the AI builds context — the layered flow

When a human says *"Read session-start.md. Follow methodology. Execute the next unticked step in `feature-x-checklist.md`"*, the agent assembles its working context in layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 0 — ALWAYS PRESENT (auto-loaded)                             │
│                                                                     │
│  CLAUDE.md                       (Claude Code reads this)           │
│  .github/copilot-instructions.md (GitHub Copilot reads this)        │
│                                                                     │
│  ROLE: Hard rules — naming, architecture, forbidden patterns,       │
│        repo shape. The tripwires the AI must never violate.         │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — SESSION BOOTSTRAP                                        │
│  Trigger: human says "Read session-start.md"                        │
│                                                                     │
│  session-start.md instructs the agent to read, in order:            │
│    • adr/readme.md            (active constraints)                  │
│    • docs/architecture/*.md   (system topology)                     │
│    • ongoing-tasks/readme.md  (where active work lives)             │
│                                                                     │
│  ROLE: Project awareness — what's decided, what exists, what's      │
│        active. Prevents re-deciding settled questions.              │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — METHODOLOGY                                              │
│  Trigger: human says "Follow methodology" (or session-start points) │
│                                                                     │
│  docs/methodology/feature-development.md                            │
│    → the recipe: how to design, implement, test, wire, ship         │
│  docs/methodology/task-workflow.md                                  │
│    → checklist + step file conventions, naming, lifecycle           │
│                                                                     │
│  ROLE: Process — HOW to build. Step-by-step recipe with checklist   │
│        of validations to run before declaring done.                 │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3 — STEP FILE                                                │
│  Trigger: human says "Execute step NN" or "next unticked step"      │
│                                                                     │
│  ongoing-tasks/{feature}-checklist.md  (source of truth)            │
│  ongoing-tasks/{feature}/architecture.md  (feature mental model)    │
│  ongoing-tasks/{feature}/NN-{feature}-<short>.md  (the work order)  │
│                                                                     │
│  Step file sections: Goal · Track · What Exists · What to Build ·   │
│                      Acceptance Criteria · References               │
│                                                                     │
│  ROLE: Task specification — WHAT to build. Field-level detail.      │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — DERIVED (agent reads autonomously)                       │
│                                                                     │
│  • Existing code referenced by the step file (patterns to mimic)    │
│  • ADRs cited by the step file or the checklist                     │
│  • External docs / RFCs / API specs the step references             │
│                                                                     │
│  ROLE: Domain truth + pattern conformance. The agent fills these    │
│        in based on what the step file points at.                    │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXECUTION                                                          │
│                                                                     │
│  Layer 0 (rules)        → never violated                            │
│  Layer 2 (methodology)  → followed step by step                     │
│  Layer 3 (step file)    → built to spec                             │
│  Layer 4 (existing)     → patterns matched                          │
│                                                                     │
│  Agent ticks the checklist · reports briefly · moves to next step.  │
└─────────────────────────────────────────────────────────────────────┘
```

### Rule hierarchy — when guidance conflicts

```
PRIORITY 1 (highest)  Tripwires in CLAUDE.md / copilot-instructions.md
                      Cannot be overridden by any step or methodology.

PRIORITY 2            ADRs (adr/NNN-*.md)
                      Architectural constraints. Override methodology suggestions.

PRIORITY 3            Methodology (docs/methodology/*.md)
                      The default recipe. A step file can specialize it.

PRIORITY 4 (lowest)   Step file specifics
                      Task-level details, within the rules above.
```

---

## CLAUDE.md vs `.github/copilot-instructions.md`

Both files are **auto-loaded** by their respective tools — Claude Code reads `CLAUDE.md` from workspace roots; GitHub Copilot reads `.github/copilot-instructions.md`. Other agents (Cursor, Aider, Continue) tend to follow one of these two conventions, or both.

**This template ships them as duplicates.** The content is identical. Pick one as canonical, mirror to the other, and treat keeping them in sync as part of the change.

> Why duplicate instead of pointing? Auto-load is path-specific. A pointer file (`> See ../CLAUDE.md`) is unreliable — the agent may not chase it before generating code. Two copies of the rules is annoying; the AI silently violating them because it never read the rules is worse.

If your team only uses one tool, delete the other file and update `readme.md` to match.

---

## How to use this repo

There are two paths: **bootstrap mode** (you just copied this template into a project) and **steady-state mode** (the project is already running on the methodology).

### Bootstrap mode — first-time setup in a new or existing project

If `<<PLACEHOLDERS>>` (double angle brackets) are still present anywhere in the repo, you are in bootstrap mode. Run this prompt against the repo root:

```
You are bootstrapping a new project from the context-driven-dev-sample template.

1. Read readme.md (this file) end-to-end.
2. Scan the host project (or describe-the-target-system if greenfield) and detect:
   - Primary language(s) and runtime
   - Build / package tooling
   - Test framework(s)
   - Existing folder structure and entry points
   - Any existing rules files (.editorconfig, .eslintrc, ruff.toml, etc.)

3. Walk every file in this template that contains `<<PLACEHOLDER>>` markers.
   For each placeholder:
   - If you can fill it confidently from the scan, propose the value.
   - If not, list the open question for the human.
   Do NOT write changes yet — produce a single proposal document first.

4. Propose initial CLAUDE.md tripwires based on the detected stack
   (e.g., for TypeScript: "no any", "no raw fetch in components", etc.).
   Reference: the example tripwire patterns in this template's CLAUDE.md.

5. Wait for human approval. Then:
   - Apply approved values to all placeholders.
   - Mirror CLAUDE.md content to .github/copilot-instructions.md.
   - Fill docs/architecture/overview.md skeleton with what you learned.
   - Leave adr/_template.md untouched. Do not invent ADRs without human input.
   - Leave ongoing-tasks/_template/ untouched. Do not invent feature checklists.

6. Report which placeholders remain unfilled and why.
```

The AI should **not** invent ADRs, methodology recipes, or feature checklists during bootstrap. Those are human-driven decisions; bootstrap only fills the scaffolding.

### Steady-state mode — driving real work

See [`ai-workflow.md`](ai-workflow.md) for the full human-facing workflow (how to start a session, continue, jump to a step, scope a task without coding). The short version:

```
Read session-start.md. Then execute ongoing-tasks/{feature}-checklist.md
starting from the first unticked step.
```

---

## Adapting the template

| Want to… | Do this |
|----------|---------|
| Add a stack-specific recipe (e.g., `dotnet-service.md`, `react-ui.md`) | Add a file under `docs/methodology/`. Link it from `CLAUDE.md` "Where to Read What" table. |
| Add a stack-specific tripwire | Edit `CLAUDE.md`. Mirror to `.github/copilot-instructions.md`. |
| Record an architectural decision | Copy `adr/_template.md` → `adr/NNN-title.md`. Update `adr/readme.md` index. |
| Start a feature | Copy `ongoing-tasks/_template/checklist.md` → `ongoing-tasks/{feature}-checklist.md`. Copy `ongoing-tasks/_template/feature/` → `ongoing-tasks/{feature}/`. Rename and fill. |
| Archive a finished feature | Move the checklist + folder pair into `ongoing-tasks/archive/`. |

---

## Credits

The pattern is distilled from working setups across larger codebases — the layered context model, the checklist + step files convention, the rule hierarchy, the audit prompt. This repo is the stack-agnostic skeleton; your project-specific rules and recipes are what make it useful.
