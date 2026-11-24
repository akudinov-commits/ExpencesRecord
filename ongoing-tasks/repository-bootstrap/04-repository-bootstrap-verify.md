# 04 — Repository bootstrap — Verify bootstrap

## Goal
Verify bootstrap within the authorized documentation bootstrap.

## Track
Verification

## What Exists
scripts/verify-bootstrap.ps1 provides existing structural verification.

## What to Build
Run the existing verifier without weakening it; check instruction mirror, local Markdown links outside illustrative templates, JSON and git diff whitespace. Record exact results in checklist Notes and leave bootstrap inputs for human review.

## Acceptance Criteria
- No verification failures; any warnings and deferred decisions are reported; no application code, deployment or spreadsheet edits appear in the diff.
- Verification evidence belongs in the checklist Notes, not in this specification.

## References
- [Feature checklist](../repository-bootstrap-checklist.md)
- [Task workflow](../../docs/methodology/task-workflow.md)
- [AI workflow](../../ai-workflow.md)
