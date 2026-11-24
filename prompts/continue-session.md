---
description: "Resume in-flight work after a break or context reset."
arguments:
  - name: feature
    description: kebab-case feature name
    required: true
  - name: step
    description: zero-padded step number; defaults to first unticked
    required: false
---

## ExpencesRecord project gate
- Follow CLAUDE.md and Accepted ADRs. Existing conversation/ADR approvals remain valid; do not ask for them again.
- Beyond a simple 2–3-line mechanical edit, require a named feature checklist, architecture and steps. Behavior/security/architecture/dependency/formula/deployment changes need a feature regardless of size. No fragmented changes to bypass tracking.
- Every behavior change requires observed meaningful RED before implementation, GREEN and refactor/rerun evidence. UI/CONFIG/INFRA classification is no exemption. Pure documentation needs content/structure/link checks with a reason TDD is not applicable.
- No business policy in controllers or infrastructure; application owns it and its ports. No direct Sheets writes or FX authority in FE. Respect formula/structure preservation and explicit year routing.
- Foundation source/tests/manifests and CI configuration exist; use readme.md/package.json for commands and the active checklist for actual remote results. Do not invent results. If required checks cannot run, report the blocker and leave the step incomplete.



# Continue a session

> Reference this file to resume in-flight work. Pass the feature name (and optionally a step number).
>
> ```
> #file:prompts/continue-session.md   feature={feature-name}
> #file:prompts/continue-session.md   feature={feature-name}   step=03
> ```

## Arguments

- **feature** — kebab-case feature name; the checklist lives at `ongoing-tasks/{feature}-checklist.md`.
- **step** *(optional)* — zero-padded step number to jump to. If omitted, resume at the first unticked step.

---

You are resuming work on the feature the user passed above.

1. Read `prompts/session-start.md` and `prompts/execution.md`.
2. Open `ongoing-tasks/{feature}-checklist.md` and `ongoing-tasks/{feature}/feature-architecture.md`.
3. If a `step` argument was passed: open `ongoing-tasks/{feature}/{step}-{feature}-*.md` and execute it.
   Otherwise: pick the first unticked `[ ]` step.
4. Report the step you are starting (number + title) before you begin work.
5. Follow the execution loop in `prompts/execution.md`.
