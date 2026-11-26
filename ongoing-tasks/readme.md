# Ongoing tasks

Every change beyond a simple 2–3-line mechanical edit gets a named feature here before work. Every behavior/security/architecture/dependency/formula/deployment change needs one regardless of size. One cohesive feature may cover many files; do not fragment changes to bypass the rule.

Use [task-workflow.md](../docs/methodology/task-workflow.md): `{feature}-checklist.md` + `{feature}/feature-architecture.md` + ordered `NN-{feature}-<short-kebab>.md` specifications. Plan the scope upfront, link only existing steps, record TDD/check evidence in checklist Notes, and obtain human review before archiving. No separate plan or task summary.

## Agreed initial-scope roadmap

Approved by the user on 2026-11-24. The order below is the agreed high-level plan; features 1 and 2 are implemented. Features 1 and 2 are complete and merged into main under explicit user approval; authentication has checked Preview and verified real owner sign-in/logout. Each later feature gets its own template-based checklist, architecture and steps when authorized. No separate `plan.md` is used.

| Order | Feature | Intended result | Status |
|---|---|---|---|
| 1 | [Application foundation and delivery](application-foundation-checklist.md) | React/TypeScript and Fastify foundations, separated layers, runnable tests/import guards, GitHub checks and prepared Vercel preview delivery | Complete; merged/pushed to main with verified CI and protected Preview; retained for review |
| 2 | [Google login and private access](google-login-private-access-checklist.md) | Google sign-in/logout, single-user authorization and approved server-side Sheets access; explicitly design session/CSRF and public login/callback exceptions | All seven steps complete; Accepted ADR 003 implemented; checked Preview and real owner sign-in/logout verified; merged into main under explicit user approval; retained for reference |
| 3 | [Spreadsheet mapping and configuration](spreadsheet-mapping-configuration-checklist.md) | Read categories/currencies; map dates/months/cells and currency-rate references; configure annual workbooks including user-created 2027 workbook | All seven steps complete; real read-only discovery, TDD, controlled Google, checked Preview and signed-in owner context verified; user-approved merge to main dca8987; records retained |
| 4 | Safe expense registration backend | Application-owned validation, additive formula-preserving writes and truthful outcomes; resolve concurrency, duplicates and ambiguous writes before production use | Approved roadmap only |
| 5 | Daily expense entry interface | Select date, amount, category and currency; submit, receive confirmation/actionable errors and quickly enter another expense | Approved roadmap only |
| 6 | Mobile preferences | Remember preferred categories/currencies locally on mobile; no desktop/server synchronization | Approved roadmap only |
| 7 | iPhone PWA and release readiness | Home Screen installation, safe areas, light/dark appearance, update handling, complete authenticated-flow verification and production delivery | Approved roadmap only |

Cross-feature rules: TDD for every behavior change; HTTP-only controllers; application-owned business policy and ports; mechanical infrastructure adapters; unchanged spreadsheet structure/formulas/formatting; controlled fixtures/test workbook before production verification. No transaction history, reporting, offline submission queue, spreadsheet redesign or additional database in the initial scope.

Foundation interview/tooling choices were reconciled in feature 1 step 01. Feature 2 resolved its Google design in Accepted ADR 003 before implementation. Google flow/access decisions belong to feature 2; actual sheet mappings to feature 3; safe concurrent/idempotent writes to feature 4. Do not treat roadmap approval as approval of unselected libraries or mechanisms.

## Current features
- [Spreadsheet mapping and configuration](spreadsheet-mapping-configuration-checklist.md) — all seven steps complete; configuration, bounded reader, application and protected API verified with 400 tests, controlled Google integration, checked Preview and real signed-in owner context. User-approved merge to main completed as dca8987; records retained without archive.
- [Google login and private access](google-login-private-access-checklist.md) — all seven steps complete and merged into main under explicit user approval; CI/Preview, real owner sign-in/logout and controlled read-only Sheets probe verified; retained for reference.
- [Application foundation and delivery](application-foundation-checklist.md) — all six steps complete, merged/pushed to main; CI and checked Preview verified; retained for completion review.
- [Repository bootstrap](repository-bootstrap-checklist.md) — documents applied; structural checks passed; the previously missing tooling/layout interview topic was reconciled through explicit user approval in foundation step 01. Bootstrap inputs remain for review.

## Templates
[_template/_template-checklist.md](_template/_template-checklist.md) and [_template/_template/feature-architecture.md](_template/_template/feature-architecture.md) are generic examples. Copy and adapt them; do not copy illustrative links to files that do not exist. The current project rules override template examples.
