# Ongoing tasks

Every change beyond a simple 2–3-line mechanical edit gets a named feature here before work. Every behavior/security/architecture/dependency/formula/deployment change needs one regardless of size. One cohesive feature may cover many files; do not fragment changes to bypass the rule.

Use [task-workflow.md](../docs/methodology/task-workflow.md): `{feature}-checklist.md` + `{feature}/feature-architecture.md` + ordered `NN-{feature}-<short-kebab>.md` specifications. Plan the scope upfront, link only existing steps, record TDD/check evidence in checklist Notes, and obtain human review before archiving. No separate plan or task summary.

## Agreed initial-scope roadmap

Approved by the user on 2026-11-24. The order below is the agreed high-level plan; only feature 1 is scaffolded. Each later feature gets its own template-based checklist, architecture and steps when authorized. No separate `plan.md` is used.

| Order | Feature | Intended result | Status |
|---|---|---|---|
| 1 | [Application foundation and delivery](application-foundation-checklist.md) | React/TypeScript and Fastify foundations, separated layers, runnable tests/import guards, GitHub checks and prepared Vercel preview delivery | Implemented locally; remote verification/account setup pending |
| 2 | Google login and private access | Google sign-in/logout, single-user authorization and approved server-side Sheets access; explicitly design session/CSRF and public login/callback exceptions | Approved roadmap only |
| 3 | Spreadsheet mapping and configuration | Read categories/currencies; map dates/months/cells and currency-rate references; configure annual workbooks including user-created 2027 workbook | Approved roadmap only |
| 4 | Safe expense registration backend | Application-owned validation, additive formula-preserving writes and truthful outcomes; resolve concurrency, duplicates and ambiguous writes before production use | Approved roadmap only |
| 5 | Daily expense entry interface | Select date, amount, category and currency; submit, receive confirmation/actionable errors and quickly enter another expense | Approved roadmap only |
| 6 | Mobile preferences | Remember preferred categories/currencies locally on mobile; no desktop/server synchronization | Approved roadmap only |
| 7 | iPhone PWA and release readiness | Home Screen installation, safe areas, light/dark appearance, update handling, complete authenticated-flow verification and production delivery | Approved roadmap only |

Cross-feature rules: TDD for every behavior change; HTTP-only controllers; application-owned business policy and ports; mechanical infrastructure adapters; unchanged spreadsheet structure/formulas/formatting; controlled fixtures/test workbook before production verification. No transaction history, reporting, offline submission queue, spreadsheet redesign or additional database in the initial scope.

Implementation prerequisites: complete the missing bootstrap interview and confirm foundation choices in feature 1 step 01. Google flow/access decisions belong to feature 2; actual sheet mappings to feature 3; safe concurrent/idempotent writes to feature 4. Do not treat roadmap approval as approval of unselected libraries or mechanisms.

## Current features
- [Application foundation and delivery](application-foundation-checklist.md) — steps 01–04 complete locally; delivery/account prerequisites remain open.
- [Repository bootstrap](repository-bootstrap-checklist.md) — documents applied; structural checks passed; the previously missing tooling/layout interview topic was reconciled through explicit user approval in foundation step 01. Bootstrap inputs remain for review.

## Templates
[_template/_template-checklist.md](_template/_template-checklist.md) and [_template/_template/feature-architecture.md](_template/_template/feature-architecture.md) are generic examples. Copy and adapt them; do not copy illustrative links to files that do not exist. The current project rules override template examples.
