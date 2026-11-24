# Application foundation and delivery — Architecture Overview

## 1. Pipeline / Integration

This feature establishes the build/test/delivery foundation for the approved React/TypeScript frontend and Node.js/TypeScript/Fastify backend on Vercel. It does not implement login or expenses. All runtime components below are planned, not existing.

```mermaid
flowchart LR
  Decisions[Interview and approved foundation decisions] --> Harness[Workspace and runnable test harness]
  Harness --> Boundaries[Import boundary checks]
  Boundaries --> Shells[Minimal FE and BE shells with TDD]
  Shells --> Checks[GitHub checks]
  Checks --> Preview[Prepared Vercel preview delivery]
  Preview --> Handoff[Foundation verification and handoff]
```

| Stage | What happens | Where |
|---|---|---|
| Decisions | Complete missing interview; confirm tools, paths, baseline and delivery packaging | Step 01; decision records |
| Workspace and tests | Configure selected tools; make checks runnable before behavior | Step 02; future workspace |
| Boundaries | Enforce inward source dependencies and prevent FE imports of backend internals | Step 03; future automated checks |
| Minimal shells | Test first, then build the minimum frontend and portable Fastify shell | Step 04; future application source |
| Delivery | Run checks before building/deploying a preview; one deployment owner | Step 05; future GitHub/Vercel configuration |
| Handoff | Verify clean-checkout instructions and evidence; update actual project state | Step 06; checks and documentation |

## 2. Component Diagram

```mermaid
flowchart TD
  FE[Planned React frontend] --> Contracts[Planned wire contracts only when needed]
  API[Planned Fastify API / controllers] --> APP[Planned application layer / owned ports]
  INFRA[Planned infrastructure adapters] --> APP
  API --> Contracts
  ROOT[Planned composition root] --> API
  ROOT --> APP
  ROOT --> INFRA
  Host[Planned thin hosting entry point] --> ROOT
  CI[Planned GitHub checks] --> FE
  CI --> Host
  CI --> Boundary[Planned dependency boundary checker]
  CI --> Vercel[Planned Vercel preview delivery]
```

Arrows within application code indicate source dependencies. Application must not import Fastify, Google/Vercel SDKs, infrastructure, controllers or environment-loading code. Actual folders/package boundaries and host packaging are decisions for step 01; no diagram box is a claim that source exists today. Do not create speculative use cases, interfaces, Google adapters or DTOs to populate empty layers. Google integrations belong to later features.

## 3. Data Flow

### 3.1 Inbound / Ingestion
Development changes enter GitHub checks. No expense data, Google credentials or spreadsheet data enters this foundation. The minimal UI serves only a foundation shell; no expense entry or login is implemented.

### 3.2 Processing / Event Handling
The selected toolchain runs type/lint/test/boundary checks and builds. A failing required check prevents preview delivery. Test fixtures exercise permitted and forbidden imports. Minimal UI/API behavior is implemented only after meaningful RED has been observed.

### 3.3 Query / Serving
React serves the minimum shell; Fastify construction is separate from server startup/host adaptation. Only a minimal health endpoint may be anonymous if its path/response are confirmed in step 01. No business endpoints are introduced. Preview deployment, if executed during later implementation, serves no private data and uses no production Google configuration.

## 4. Data Stores Summary

| Store | Technology | Collections / Tables / Indices | Purpose |
|---|---|---|---|
| Repository | Existing Git working tree | Planning documents now; source/config only during later implementation | Versioned project foundation |
| CI/build output | Toolchain selected in step 01 | Ephemeral test/build artifacts | Verification and deployment preparation |
| Application database / Sheets | None accessed or created in this feature | None | Expense storage remains a later feature |

No server preference store, token store, cache or coordination database is introduced.

## 5. Extension Points

Later features add Google identity and Sheets adapters through application-owned ports when those use cases are approved. Controllers delegate; application policy stays independent of host/SDK mechanics. Frontend business interactions use a central API boundary once contracts exist. Keep Fastify construction independent of Vercel so another Node host can replace the thin hosting entry point. Test and CI commands established here become required checks for later features.

## 6. Security & Isolation

- All business endpoints require authentication at the API boundary and authorization in application use cases. No business endpoints or permissive authentication bypasses are added in this foundation.
- Minimal health is the existing anonymous exception. Google login initiation/callback public exceptions must be explicitly defined and approved in feature 2; do not infer a blanket public-route exemption.
- No private data, workbook identifiers, Google credentials or production secrets in fixtures, client bundles, repository or preview configuration. Do not loosen `.claude` permissions.
- Composition validates configuration and injects values; application has no environment or I/O access. Controllers/infrastructure contain no business policy.
- Preview and production contexts remain separate. Production rollout and full Google/session/CSRF verification belong to later features. No cloud changes or deployment are authorized by this planning-only request.
