---
description: "Execute an approved feature step; TDD for every behavior change."
---

# Execution protocol

Read [session-start.md](session-start.md), [CLAUDE.md](../CLAUDE.md), the feature checklist/architecture/step and applicable recipe/ADRs first.

## Entry gate
Beyond one simple mechanical edit totaling at most three changed lines, work must belong to a named feature. Every behavior/security/architecture/dependency/formula/deployment change requires a feature regardless of size. Verify scope and dependencies before editing. Do not split work to evade tracking.

## Current tooling
No application test runner, package manager, build command or source structure exists yet. Select and install the harness through an approved foundation feature. The only existing repository check is PowerShell `./scripts/verify-bootstrap.ps1 -RepoRoot .`; it does not test application behavior.

## Classification
Classify by effect, not filename or label:

| Effect | Verification |
|---|---|
| Any behavior, including CODE, UI interaction, auth, adapter, serialization or config behavior | Mandatory observed RED → GREEN → refactor |
| Pure type-only contract with no runtime behavior | Type check; runtime serialization/validation changes require TDD |
| Pure documentation | Content, links, structure and relevant existing scripts |
| Pure mechanical rename/move/deletion | Affected existing checks; a behavior change still requires TDD |
| Visual-only styles/layout | Visual/accessibility check; interaction/state changes require TDD |
| Build/deployment harness without application behavior | Parse/build/dry-run or isolated integration verification appropriate to scope; behavior changes still require TDD |

No classification permits implementing behavior and adding its test afterward.

## Execution loop
1. Open the next unticked step and verify its dependencies, acceptance criteria and approved scope.
2. For each behavior, write one focused test through the intended boundary. Run it; confirm it fails because the intended behavior is absent. Fix harness/import/type issues first and rerun to obtain a meaningful RED.
3. Record RED test identity, command and actual failure. Implement only enough to pass.
4. Run the test and observe GREEN. Refactor as useful and rerun affected tests, boundary checks and build.
5. Validate every acceptance criterion, including relevant negative cases. Never test writes against the production expense workbook.
6. Record dated evidence in checklist Notes. Mark the step `[x]` only after checks pass. Step files remain scope specifications, not logs.
7. Report completed behavior, actual checks and next step. Report blockers truthfully and leave blocked steps incomplete.

For nonbehavioral work, record why TDD does not apply and the actual checks used. Do not fabricate test counts or claim documentation enforces test ordering automatically.

## Evidence format
```text
Step / behavior:
RED: test identifier; exact command; expected missing behavior; observed failure
GREEN: exact command; actual result
REFACTOR: change or none; rerun result
Other checks: command/result or reason not applicable
```
An unrun test, missing dependency or compilation error alone does not establish behavior RED. A passing suite alone does not establish TDD.

## Scope and completion
Do not add/reorder/expand steps, interfaces, dependencies or architecture outside the approved plan. Reuse existing approval; seek a decision only for genuinely new scope. No unrelated cleanup or separate task summaries. Commit naturally only when authorized; no phase-per-test commits.

On completion, run affected checks, verify acceptance criteria, report actual results and deferred choices, and wait for human review before archiving the checklist/folder pair. No merge or deployment is implied.
