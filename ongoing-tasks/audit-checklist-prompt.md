---
description: "Audit a checklist initiative: verify every checked step's implementation matches its acceptance criteria, detect drift, missing tests, dead code, and broken wiring."
---

# Checklist Audit

You are performing a **post-implementation audit** of a completed (or in-progress) checklist initiative.

## Inputs

The user will provide a reference to a checklist file (e.g. `ongoing-tasks/{feature}-checklist.md`). That is your primary input.

## Preparation

1. Read the checklist file.
2. Initiative shape in this repo: checklist + `{feature}/architecture.md` + numbered step files `{feature}/NN-*.md`. Read both the checklist and the architecture file.
3. Identify the target stack(s) from the checklist / architecture and read the matching methodology recipe under `docs/methodology/` (the generic recipe is `feature-development.md`; if a stack-specific recipe exists, use it instead).
4. Read `CLAUDE.md` (or `.github/copilot-instructions.md`) — the tripwires you will check the implementation against.
5. Check `adr/` for ADRs referenced by or relevant to this initiative.

## Audit Procedure

For **each checked `[x]` step** in the checklist:

### A. Specification Compliance

- Open the step file.
- Read every acceptance criterion (AC).
- For each AC, locate the corresponding implementation in the codebase (file, class, method, route, etc.).
- For each AC, locate the corresponding test(s) that verify it.
- Flag: **AC not implemented**, **AC implemented but not tested**, **test exists but does not assert the AC**.
- **Heuristic for "test does not assert the AC":** extract the key noun-verb from the AC (e.g., "returns null on 404"); search the test for an assertion that mentions or implies it. If you cannot find an assertion that maps to the AC's claim, flag it for human review rather than silently passing.
- **Respect documented deviations:** if the checklist's `## Notes` explicitly documents a divergence from the step file (e.g., "Minor deviation: kept synchronous because pure string formatting"), treat that deviation as accepted and do NOT flag it. Only flag drift that is undocumented or contradicts user-approved decisions.

### B. Code Quality

- Check that the implementation follows the repo tripwires for its stack (from `CLAUDE.md`).
- Check for: hardcoded values that should come from configuration, missing DI registrations, dead code left behind, `TODO` / `FIXME` comments.
- Check that no business logic lives in thin layers (controllers, endpoints, page components) when the tripwires forbid it.
- Check that test naming follows the project's convention.

### C. Wiring & Integration

- Verify DI / IOC registrations exist in the appropriate location for all new services / interfaces (if applicable to the stack).
- Verify configuration sections are surfaced in the canonical config file (if CONFIG steps exist).
- Verify no orphaned interfaces (interface registered but never injected anywhere).
- Verify no orphaned implementations (class exists but not registered / not exported / not routed).
- Verify routes / endpoints / event handlers are reachable from outside the module.

### C2. INFRA steps (when applicable)

For any step that touches infrastructure-as-code (Helm, Terraform, CDK, Pulumi, raw YAML, container configs):

- Verify the manifest renders / synthesizes / validates without errors.
- Verify any new templated values have corresponding entries in the values / variables file (no orphaned references).
- Verify any new env-var references in deployment templates have corresponding declarations.
- Verify ignore-files (`.helmignore`, `.dockerignore`, etc.) keep internal-only files out of artifacts.

### D. Drift Detection

- Compare step file specifications against actual implementation — flag any divergence (extra features added, features described but missing, different naming).
- Check that the checklist's `## Notes` section documents any decisions that deviate from the original step files.

### E. Test Coverage

- Count total tests related to this initiative.
- For CODE steps, verify TDD was followed: each behavior should have at least one test.
- Run all tests for the affected components and report pass / fail counts.
  - Use the test commands declared in `ongoing-tasks/execution-prompt.md` § Test Frameworks.
  - For initiatives that span multiple components, run each separately and report a per-component tally. Do not aggregate into a single number that hides which component is broken.
  - If tests fail, do not flag them all individually — note the count and check whether any failures are pre-existing (run on the main / trunk baseline). Pre-existing failures are out of scope for this audit.

## For unchecked `[ ]` steps

List them as **Not Started** — do not audit implementation (there should be none). If implementation exists for an unchecked step, flag it as **undocumented work**.

## Output Format

```
# Audit Report: {Initiative Name}

## Summary
- Steps checked: N/M
- Total tests: X (Y passing, Z failing)
- Issues found: K

## Step-by-Step Findings

### Step NN — {title} ✅ | ⚠️ | ❌
**Status:** All ACs met / Partial / Missing implementation
**ACs:**
- [x] {AC text} — verified in {test file}:{test name}
- [ ] {AC text} — ⚠️ {issue description}
**Code quality:** {any tripwire violations or concerns}
**Wiring:** {DI / config / routing issues if any}

### ...

## Cross-Cutting Issues
{Issues that span multiple steps: missing ADR, orphaned code, config gaps, etc.}

## Recommendations
{Prioritized list of fixes needed}
```

## Rules

- Be thorough — read every step file and every AC.
- Be evidence-based — cite specific files and line numbers for every finding.
- Do not fix issues during audit — only report them.
- Do not create summary markdown files — the audit output in chat IS the report.
- If a step file references other steps as dependencies, verify those dependencies are satisfied.
- Respect explicitly documented deviations in the checklist's `## Notes` (rationale + user approval). Only flag undocumented divergence.
- If a check applies to a stack we don't have for the audited initiative, skip it silently — don't pad the report with "N/A" entries.
