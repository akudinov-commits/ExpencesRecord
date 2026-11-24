# Feature development

Read [task-workflow.md](task-workflow.md), the approved feature checklist/architecture/current step, [CLAUDE.md](../../CLAUDE.md), relevant ADRs and the active stack's authoritative project-specific recipe before work.

## Cycle
1. Confirm the feature gate, approved scope and acceptance criteria. Locate existing patterns; follow Accepted ADRs over conflicting legacy examples.
2. Sketch only the contracts needed for the approved behavior. New architectural choices still require approval; existing approval remains valid.
3. Write and run a focused test. Observe failure for the intended missing behavior, not merely a compiler/import/harness failure. Record RED.
4. Implement the minimum to pass. Observe and record GREEN.
5. Refactor within scope, rerun affected tests and check wiring, transport mappings, adapters and import boundaries.
6. Verify acceptance criteria and relevant build/integration/UI checks. Record commands/results in checklist Notes; mark the step complete and report.

Use this cycle for every behavior change including fixes, UI interaction, authentication, API/controllers, application rules, adapters and configuration with behavioral effects. Do not write implementation first then backfill tests.

Pure documentation/mechanical/type-only/visual-only work uses appropriate checks, with a recorded reason TDD is not applicable; see [execution protocol](../../prompts/execution.md). Classification never exempts behavior from TDD. No test harness exists yet: create it in the approved foundation step before behavior implementation.

## Layer checks
- Application owns policy and ports; test use cases with fake ports.
- Controllers only map HTTP and delegate; verify with Fastify injection once tooling exists.
- Infrastructure performs external mechanics; verify adapter contracts separately without production workbook writes.
- UI interaction tests precede UI behavior. Visual checks complement them.
- Wire concrete dependencies only in composition. Neither controller nor infrastructure is a place to hide expense policy.

## Completion gate
Acceptance criteria pass; recorded RED/GREEN/refactor evidence exists for changed behavior; affected tests/checks pass; no layer/security/formula-preservation violations; no unapproved dependencies/scope; checklist is current. Missing checks leave the step incomplete. Human review precedes archiving.
