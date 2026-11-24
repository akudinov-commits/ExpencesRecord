# ExpencesRecord

A private iPhone PWA for entering daily expenses into an existing annual Google spreadsheet.

The initial product will let you select date, amount, category and currency, add to an existing day/category expression and remember category/currency preferences on mobile. Google Sheets retains currency conversion and totals; its structure, formulas and formatting are preserved. The user's new annual workbook, including 2027, will be configured explicitly.

## Current state
The application foundation is implemented: a minimal accessible React shell, portable Fastify construction, validated local startup configuration and anonymous `GET /api/health` returning only `{"status":"ok"}`. There are no expense, login or Google integration endpoints yet. Application and infrastructure directories are reserved without speculative business code. Shared contracts will be added when needed.

Local checks and an isolated clean-checkout install/build pass, including 34 tests. GitHub CI and opt-in Vercel preview configuration exist; remote execution still requires authentication/project setup. Do not treat a local build as a verified deployment. Track current verification/blockers in the [foundation checklist](ongoing-tasks/application-foundation-checklist.md).

## Code and tests
| Path | Responsibility |
|---|---|
| `apps/web/src` / `apps/web/test` | React UI and frontend tests |
| `apps/api/src/api` / `apps/api/test/api` | HTTP routes/controllers and transport tests |
| `apps/api/src/application` | Future use cases, policy and application-owned ports |
| `apps/api/src/infrastructure` | Future external adapters; no business policy |
| `apps/api/src/bootstrap` / `apps/api/test/bootstrap` | Composition, validated configuration and tests |
| `apps/api/src/server.ts` | Local Node startup |
| `api/index.ts` | Thin Vercel Node handler, delegates to the same Fastify app |
| `tests/architecture` | Allowed/forbidden import fixtures and actual failing-exit checks |
| `tests/delivery` | Hosting adapter, deployment gates and bootstrap scan regression checks |

Negative architecture fixtures deliberately contain forbidden/unresolved imports; they are test data excluded from production compilation. See [architecture](docs/architecture/overview.md), [ADRs](adr/readme.md) and the [agreed roadmap](ongoing-tasks/readme.md).

## Run locally
Use Node **24.22.3** and npm **11.19.1** (see `.node-version` and `packageManager`). The system Node installation is not modified. PowerShell 7 (`pwsh`) is required for the bootstrap-verifier regression tests and is available on the GitHub Ubuntu runner.

```sh
npm ci
npm run check
npm run dev:web
```

For the API, copy `.env.example` to `.env` and run `npm run dev:api` from the repository root. `HOST` and `PORT` are required; invalid/missing values fail explicitly. Local secret files are ignored. `npm run build` produces `apps/web/dist` and `apps/api/dist`; `npm run start --workspace @expences/api` runs the compiled local backend using the root `.env`.

Individual checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:boundaries`, `npm run build`. Every behavior change follows observed RED → GREEN → refactor, with evidence in its feature checklist. Import checks enforce source dependencies; code review still checks where business policy lives.

## Delivery setup
GitHub's Foundation workflow checks pushes to `main`/`feature/**` and pull requests. Required checks run before preview delivery; forks do not get deployment credentials. Vercel's Git-based automatic deployments are disabled in `vercel.json` so GitHub Actions is the single deployment owner. This feature configures previews only; production rollout belongs to feature 7.

After creating the user's personal Vercel Hobby account, sign in with the pinned Vercel CLI (`npm exec --yes --package=vercel@66.6.0 -- vercel login`), then link the repository root to the intended project. Its static output is `apps/web/dist`; root `api/index.ts` serves `/api/*`. Do not add Google credentials or financial data to previews.

Configure GitHub Actions secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` through secure account tooling, then set repository variable `VERCEL_PREVIEW_ENABLED=true`. Never paste tokens into commits or chat. Feature-branch pushes or a manually requested preview run check/build/deploy the same commit and verify its health through authenticated Vercel CLI access. Missing credentials fail the enabled preview job explicitly; the disabled flag means no deployment was attempted.

## Development workflow
Read [CLAUDE.md](CLAUDE.md) and [ai-workflow.md](ai-workflow.md). Changes beyond a simple 2–3-line mechanical edit require a feature; behavior/security/architecture/dependency/formula/deployment changes always do regardless of size. For scaffold provenance, see [template-readme.md](template-readme.md).

Bootstrap structure check: `pwsh -NoProfile -File scripts/verify-bootstrap.ps1 -RepoRoot .` (on Windows, use a process-scoped execution-policy option if unsigned local scripts are restricted). This is not an application or TDD-chronology check. Bootstrap inputs remain for review; their cleanup reminder is intentional.
