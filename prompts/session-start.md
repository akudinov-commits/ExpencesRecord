---
description: "Read at every AI session or context reset."
---

# Session start — ExpencesRecord

1. Read [CLAUDE.md](../CLAUDE.md) (byte-identical Copilot mirror), then [readme.md](../readme.md) for actual project state.
2. Read [ai-workflow.md](../ai-workflow.md), [ADR index](../adr/readme.md) and relevant records, then [architecture](../docs/architecture/overview.md).
3. Read the assigned feature's checklist and architecture, next ordered step, applicable stack recipe and [execution protocol](execution.md).
4. Confirm the change belongs to approved scope. Beyond a simple 2–3-line mechanical edit, require a named feature first; any behavior change needs a feature regardless of size.
5. Follow observed RED → minimum implementation → GREEN → refactor → rerun for every behavior change. Record actual evidence in checklist Notes; tick only after acceptance checks pass.

## Actual repository map
```text
adr/                       accepted architecture/authentication decisions
docs/architecture/         system boundaries and deferred design
docs/methodology/          task, feature, Node and React recipes
ongoing-tasks/             feature checklists/steps and bootstrap inputs
prompts/                   operator prompts
scripts/                   existing bootstrap verification
CLAUDE.md                  canonical rules; Copilot mirror must match
AGENTS.md                  Codex routing to canonical rules
readme.md                  product/current state
ai-workflow.md             human workflow
```
Foundation source exists in apps/web/src and apps/api/src; tests mirror layers outside src, with architecture/delivery suites under tests/. Node 24/npm workspaces and pinned test/build tools are configured. Run npm ci and npm run check. GitHub CI, checked Vercel Preview delivery and protected health verification pass. Read the active checklist for current evidence and the approved one-time project initialization exception. The active Google authentication feature has local implementation and tests, with real owner/grant/refresh and the authorized ID-only test-workbook probe verified; checked hosted delivery and anonymous/security checks passed; exact hosted Google callback setup and real owner browser sign-in/logout are verified. All seven authentication steps are complete; the user approved merging the verified feature into main on 2026-11-25. Completed feature is [spreadsheet mapping/configuration](../ongoing-tasks/spreadsheet-mapping-configuration-checklist.md): all seven steps are complete, including the real six-month read-only review before application mapping, controlled Google integration, approved Preview Secrets, feature publication, GitHub checks and checked Preview delivery. The real signed-in owner context request returned the minimal synthetic DTO with HTTP 200; anonymous/invalid-cookie requests remain 401. All 400 tests passed after fixing the Vercel rewrite to preserve strict query contracts. The user explicitly approved merging/pushing this feature on 2026-11-26; local main now contains merge dca8987. The completed records remain in place. The active feature is [safe expense registration backend](../ongoing-tasks/safe-expense-registration-backend-checklist.md). Safe expense registration is implemented and locally verified on feature/safe-expense-registration-backend. Application owns bounded formula/FX planning, selected-cell preview, configured past dates, advisory duplicate warnings, acknowledgment and final-read comparison under Accepted ADR 007. Protected POST /api/expenses/preview, /api/expenses and /api/expenses/comments use existing owner/Origin/CSRF protection. Separate owner write consent and controlled synthetic N17/O17 tests passed locally; actual cell comments are visible in Google Sheets. Writes default disabled. The user approved Preview-only writer settings and feature publication on 2026-11-26. The three private Preview settings are stored for the isolated 2020-01-15 N17/O17 fixture; checked feature publication and hosted verification are in progress. No main merge or real-workbook activation is included.
