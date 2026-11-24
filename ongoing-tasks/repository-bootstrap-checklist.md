# Repository bootstrap

## Goal
Configure ExpencesRecord's documentation and AI workflow for the approved architecture, mandatory TDD and feature-scoped work.

## Scope
- Project identity, architecture documentation, ADRs, active stack recipes and AI entry points.
- TDD and a feature requirement for changes beyond a simple 2–3-line mechanical edit.
- Bootstrap discovery, conversation-backed decisions and verification.
- No application implementation, dependency installation, deployment or spreadsheet changes.
- Authorization: the user approved the architecture and requested this bootstrap on 2026-11-24. The four steps below decompose that authorized scope; they introduce no application features.

## Architecture
See [feature-architecture.md](repository-bootstrap/feature-architecture.md).

## Steps
- [x] [01 — Capture discovery and approved decisions](repository-bootstrap/01-repository-bootstrap-discovery.md): record facts, approvals and unresolved choices.
- [x] [02 — Configure project and architecture](repository-bootstrap/02-repository-bootstrap-project.md): identity, boundaries, ADRs and stack recipes.
- [x] [03 — Enforce methodology](repository-bootstrap/03-repository-bootstrap-workflow.md): TDD, feature threshold and consistent entry points.
- [x] [04 — Verify bootstrap](repository-bootstrap/04-repository-bootstrap-verify.md): verifier, mirror, links, JSON, whitespace and reviewable diff.

## Notes
- 2026-11-24: This is documentation/configuration work. No behavior is implemented, so application RED/GREEN tests are not applicable. Existing bootstrap verification and structural checks apply; no application test suite or CI currently exists.
- Bootstrap inputs remain in `_bootstrap/` until the user reviews the result, as required by the Apply workflow. Do not delete them or archive this feature before that review.
- No commit or push is part of this bootstrap; changes remain reviewable locally.

- 2026-11-24: Steps 01–03 complete: discovery/decisions recorded; six ADRs (five Accepted, Google access Proposed); canonical/mirrored rules, project recipes and operator prompts configured. No application behavior added.
- 2026-11-24: Step 04 verification on the application repository: existing verifier returned exit 0 with 11 passes, 1 expected cleanup warning, 0 failures. Supplemental checks: 38 Markdown documents, 79 local links resolving, byte-identical instruction mirror, valid JSON/ADR sections, unchanged plan/ADR templates and unchanged verifier. `git diff --check` passed. No app manifest/source or CI added.
- Verification command: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-bootstrap.ps1 -RepoRoot 'D:/Proj/Personal/ExpencesRecord'`. The process-scoped option was needed because this machine rejects unsigned script files; no persistent execution policy was changed.
- Remaining decisions are listed in `_bootstrap/decisions.md`: tooling, Google flow/session/access, concurrent/idempotent writes, workbook mappings and deployment packaging. Human review precedes bootstrap cleanup and archiving; this is the verifier's sole warning.

### Existing verifier output
```text
Verify Bootstrap -- D:/Proj/Personal/ExpencesRecord

-- Structural checks --
  PASS  No unresolved placeholders outside _template/ folders
  PASS  Instruction file(s) present: CLAUDE.md, .github/copilot-instructions.md
  PASS  CLAUDE.md and copilot-instructions.md are in sync
  PASS  docs/architecture/overview.md present with content
  PASS  .ignix/review-instructions.md present
  PASS  template-readme.md present
  PASS  adr/ contains 6 ADR file(s)
  WARN  ongoing-tasks/_bootstrap/ still exists -- delete after reviewing the Apply report
  PASS  Core prompt files present (prompts/readme.md, session-start.md, execution.md)

-- Content checks (decisions.md found) --
  PASS  ADR stub count (6) matches or exceeds pending titles (6)
  PASS  Deleted recipe confirmed gone: docs/methodology/dotnet-service.md
  PASS  Deleted recipe confirmed gone: docs/methodology/python-service.md

-- Summary --
  11 passed, 1 warnings, 0 failures

BOOTSTRAP VERIFICATION PASSED WITH WARNINGS
```

- 2026-11-24 correction: completed marks above describe document application/structural checks, not completion of the prescribed interview. The interview was omitted; earlier bootstrap-completion wording was too broad. The approved [application foundation](application-foundation-checklist.md) step 01 closes the interview gap before implementation. Inputs remain retained for review.
