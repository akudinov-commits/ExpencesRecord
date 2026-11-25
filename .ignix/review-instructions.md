# ExpencesRecord review instructions

Use CLAUDE.md, Accepted ADRs and the authoritative project-specific recipes. Flag actionable violations of approved scope and behavior; do not treat unused generic recipe examples as installed dependencies.

## Required gates
- Beyond a simple 2–3-line mechanical edit, require a named ongoing-tasks feature checklist, architecture and steps. Behavior/security/architecture/dependency/formula/deployment changes always require one, irrespective of size. Reject fragmented work used to evade tracking.
- Every behavior change needs recorded meaningful RED before implementation, GREEN and refactor/rerun evidence in checklist Notes. Test presence or final coverage alone does not prove TDD. CODE/UI/CONFIG/INFRA labels cannot exempt behavior.
- Do not declare success when affected checks cannot run or acceptance criteria are unmet. Documentation-only work must state its nonbehavioral checks rather than invent test results.
- Controllers contain HTTP mechanics only. Application owns all authorization/expense/formula policy and its ports; it imports no Fastify, Google/Vercel SDK, env or infrastructure. Infrastructure performs mechanics only; composition root wires dependencies.
- Preserve sheet structure/formulas/formats/calculated totals; explicit annual routing; no universal F39 assumption, blind retries, serverless in-memory lock guarantees or unsupported expression writes.
- No credentials/tokens/private spreadsheet identifiers in code/logs/client; no direct Sheets access/FX authority in FE. Preferences remain mobile-local.
- Google flow/access follows Accepted ADR 003; actual account/grant/Preview verification must be recorded separately from synthetic tests. Concurrent write design remains unresolved; do not ship inferred implementations. No unapproved libraries or extra database.
- Keep CLAUDE and Copilot byte-identical; no missing actual step links or mid-execution scope changes. Preserve templates as examples; human review precedes archive.

## Exceptions and current state
Pure documentation, mechanical edits, type-only declarations and visual-only styling without behavior use appropriate checks; this is not a test-skipping exception for behavior. Foundation source, tests, import guards and CI configuration exist; run npm run check. Actual remote CI/deployment remains separately verified in the checklist. No additional project exceptions are approved; these review instructions alone do not prove chronology.
