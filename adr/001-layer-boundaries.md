# 001 — Separate frontend, API, application, infrastructure and composition

## Status
Accepted — 2026-11-24.

## Context
The user requires clear FE/BE separation and no business logic in controllers or infrastructure.

## Decision
Use React/TypeScript FE and Fastify/TypeScript BE. Controllers own transport only. Application owns all use cases, authorization and expense/formula policy and defines its ports. Infrastructure implements those ports and external I/O only. Composition root wires validated configuration and concrete adapters. Application depends on neither framework nor infrastructure; shared wire DTOs contain no logic.

## Consequences
Use cases can be tested with fake ports and deployed through another Node adapter. Keep policy out of SDK helpers, controllers and frontend; add import-boundary verification in the foundation feature.
