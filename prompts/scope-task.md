---
description: "Dry-run a step — plan only, no code."
arguments:
  - name: feature
    description: kebab-case feature name
    required: true
  - name: step
    description: zero-padded step number
    required: true
---

## ExpencesRecord project gate
- Follow CLAUDE.md and Accepted ADRs. Existing conversation/ADR approvals remain valid; do not ask for them again.
- Beyond a simple 2–3-line mechanical edit, require a named feature checklist, architecture and steps. Behavior/security/architecture/dependency/formula/deployment changes need a feature regardless of size. No fragmented changes to bypass tracking.
- Every behavior change requires observed meaningful RED before implementation, GREEN and refactor/rerun evidence. UI/CONFIG/INFRA classification is no exemption. Pure documentation needs content/structure/link checks with a reason TDD is not applicable.
- No business policy in controllers or infrastructure; application owns it and its ports. No direct Sheets writes or FX authority in FE. Respect formula/structure preservation and explicit year routing.
- Foundation source/tests/manifests and CI configuration exist; use readme.md/package.json for commands and the active checklist for actual remote results. Do not invent results. If required checks cannot run, report the blocker and leave the step incomplete.



# Scope a task without coding

> Dry-run prompt. Reference this file with the feature name and step number you want scoped:
>
> ```
> #file:prompts/scope-task.md   feature={feature-name}   step=03
> ```

## Arguments

- **feature** — kebab-case feature name; checklist at `ongoing-tasks/{feature}-checklist.md`.
- **step** — zero-padded step number to scope (e.g. `03`).

---

You are SCOPING the step the user passed above. **Do not write code, do not edit any file.**

1. Read `ongoing-tasks/{feature}-checklist.md`.
2. Read the matching step file `ongoing-tasks/{feature}/{step}-{feature}-*.md`.
3. Report:
   1. What you would do first.
   2. Any ambiguities in the acceptance criteria.
   3. Files you would create or modify.

Stop after the report. The human approves, refines, or rejects before invoking [`execution.md`](execution.md).
