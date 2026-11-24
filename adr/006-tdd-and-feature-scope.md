# 006 — TDD and feature-scoped changes

## Status
Accepted — 2026-11-24.

## Context
The user explicitly requires TDD and a feature for work beyond a simple 2–3-line update.

## Decision
Every behavior change, including fixes, follows observed RED → minimal implementation → GREEN → refactor → rerun. Record test identity, command, expected failure and pass evidence in checklist Notes. Work beyond one simple mechanical edit totaling at most three changed lines requires a named feature checklist, architecture and step specifications. Behavior/security/architecture/dependency changes always require a feature, regardless of line count. Do not split work to evade the threshold.

## Consequences
Documentation-only changes use structural/content checks rather than invented unit tests. A feature may cover multiple cohesive files; it is not one feature per file. Review must reject missing feature/TDD evidence. Automated tests and import checks will be installed in a future foundation feature; documentation alone cannot prove test ordering.

## Implementation status — 2026-11-24
The foundation now includes runnable Vitest/Testing Library tests and dependency-cruiser checks. Actual RED/GREEN evidence is recorded in its checklist; test presence or final pass counts still do not prove chronological TDD. Remote CI/account setup remains a separately reported completion gate.
