# {Feature Name}

> Copy this file to `ongoing-tasks/{feature-name}-checklist.md`.
> Copy the sibling `feature/` folder to `ongoing-tasks/{feature-name}/`.
> Replace every `{feature-name}` placeholder. Rename step files: `01-first-step.md` → `01-{feature-name}-<short-kebab>.md`.

## Goal
One to three sentences. What changes for the user or system when this is done.

## Scope
- **In scope:** bullets
- **Out of scope:** bullets
- **Dependencies:** link to other checklists, ADRs, or services

## Architecture
See [architecture.md](./{feature-name}/architecture.md) for the big-picture overview: pipeline, component diagram, and data flow.

## Steps
- [ ] [01 — first step title](./{feature-name}/01-{feature-name}-<short-kebab>.md)
- [ ] [02 — next step title](./{feature-name}/02-{feature-name}-<short-kebab>.md)
  - [ ] sub-bullet for in-step granularity that doesn't warrant its own step file

## Notes
Free-form log of decisions, blockers, links to PRs. Dated entries preferred (YYYY-MM-DD).
