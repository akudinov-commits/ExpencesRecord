# 02 — Expense date control — Verify Preview

## Goal
Validate the consolidated control locally and through checked Preview delivery, then reconcile feature records.

## Track
frontend / delivery

## What Exists
Existing feature branch, checked GitHub/Vercel pipeline, protected stable alias and synthetic browser QA harness.

## What to Build
- Run npm run check and small-screen/light/dark browser review, including native picker focus/selection where available.
- Check documentation links, canonical mirrors, private values and diff; publish the requested review adjustment on the existing branch and verify actual CI/Preview.
- Record exact evidence and physical iPhone/Safari limitations; leave completed records for human review.

## Acceptance Criteria
- [ ] Required local checks pass; browser review shows one date field without overflow and with a visible focus/Today/Past treatment.
- [ ] Actual checked CI/Preview passes for the published adjustment; no spreadsheet/configuration writes or auth relaxation occur.
- [ ] Notes record observed TDD, final results and unperformed physical-device checks; records remain for review.

## References
- [Checklist](../expense-date-control-checklist.md)
- [Single-field step](01-expense-date-control-single-field.md)
- [Execution](../../prompts/execution.md)
