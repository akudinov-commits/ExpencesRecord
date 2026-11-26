# ExpencesRecord

A private iPhone PWA for entering daily expenses into an existing annual Google spreadsheet.

The initial product will let you select date, amount, category and currency, add to an existing day/category expression and remember category/currency preferences on mobile. Google Sheets retains currency conversion and totals; its structure, formulas and formatting are preserved. The user's new annual workbook, including 2027, will be configured explicitly.

## Current state
The foundation is verified. The completed Google authentication feature is merged into main: Google login/logout, seven-day encrypted sessions, default-protected Fastify routes and the mobile sign-in shell are implemented and tested locally. The separate local operator helper establishes owner identity and read-only Sheets credentials; its probe requests only isolated-workbook ID metadata. Real Google owner verification, private credential storage, read-only refresh and the authorized blank-workbook ID-only probe have passed. Checked authentication Preview delivery and hosted anonymous/security checks have passed at https://expences-record-auth-preview.vercel.app. The hosted callback is registered, and real owner sign-in/logout succeeded: Preview request history confirms authorized session 200 and logout 204. All seven authentication feature steps are complete and the user approved their merge into main on 2026-11-25. There are no expense registration endpoints or writes. See the [authentication feature checklist](ongoing-tasks/google-login-private-access-checklist.md) and [Google setup guide](docs/google-setup.md).

The completed foundation had 35 tests and an isolated clean-checkout install/build. Authentication test counts and RED/GREEN evidence are recorded in its active checklist. GitHub CI checks and build-artifact upload pass on feature/application-foundation. The free Vercel project runs Node 24, and checked preview deployment plus protected health verification pass. The [verified foundation preview](https://expences-record-4mdx1sfxq-akudinov-7567.vercel.app) renders the expected shell; Vercel sign-in may be required. Do not treat a local build as a verified deployment. Track current verification/blockers in the [foundation checklist](ongoing-tasks/application-foundation-checklist.md).

Spreadsheet mapping/configuration is merged into main after explicit user approval on 2026-11-26; all seven steps are complete and verified: private annual/currency configuration, bounded read-only Sheets reader, application mapping and protected GET /api/expense-context. The real six-month read-only review is recorded with its formula/total limitations. Controlled Google integration and the approved Preview Secret uploads have passed. Only five approved synthetic test cells were added, preserving the original four cells; the real workbook is unchanged. Feature commit 7fb78b6 is published; GitHub checks and checked Node 24 Vercel Preview delivery passed. Hosted health, anonymous/invalid-cookie context denial, OAuth protection and client/log privacy passed. The real signed-in owner context request passed after correcting Vercel rewrite query pollution; all 400 tests passed, and checked GitHub/Vercel delivery passed for fix 270b469. Merge dca8987 preserves the verified feature history; no Production release occurred. See the [feature checklist](ongoing-tasks/spreadsheet-mapping-configuration-checklist.md) and [operator guide](docs/spreadsheet-mapping.md).

## Code and tests
| Path | Responsibility |
|---|---|
| `apps/web/src` / `apps/web/test` | React UI and frontend tests |
| `apps/api/src/api` / `apps/api/test/api` | HTTP routes/controllers and transport tests |
| `apps/api/src/application` | Authentication/owner policy, Sheets access verification and inward ports; expense use cases remain future work |
| `apps/api/src/infrastructure` | Google identity/session cryptography, delegated credentials, read-only metadata probe and local secret-file I/O; no business policy |
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

Follow [Google setup](docs/google-setup.md) first: a web OAuth client and explicit local owner confirmation are required. The operator helper writes ignored `.env` directly and creates independent cookie keys. Then run `npm run dev:api` and `npm run dev:web` from the repository root. Authentication settings plus `HOST`/`PORT` are required; invalid/missing values fail explicitly. Vite proxies /api while preserving localhost:5173. No credentials belong in client variables, chat or source. `npm run build` produces `apps/web/dist` and `apps/api/dist`; `npm run start --workspace @expences/api` runs the compiled local backend using the root `.env`.

Individual checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:boundaries`, `npm run build`. Every behavior change follows observed RED → GREEN → refactor, with evidence in its feature checklist. Import checks enforce source dependencies; code review still checks where business policy lives.

## Delivery setup
GitHub's Foundation workflow checks pushes to `main`/`feature/**` and pull requests. Required checks run before preview delivery; forks do not get deployment credentials. Vercel's Git-based automatic deployments are disabled in `vercel.json` so GitHub Actions is the single deployment owner. Normal delivery targets Preview only; product production rollout belongs to feature 7. Vercel required one explicitly approved foundation initialization marked Production with domain assignment skipped. That initialization is complete; no recurring production-deployment path was added.

The user's personal Vercel Hobby account and expences-record project are configured. For a new machine, sign in with the pinned Vercel CLI (`npm exec --yes --package=vercel@66.6.0 -- vercel login`), then link the repository root to the intended project. Its static output is `apps/web/dist`; root `api/index.ts` serves `/api/*`. Configure Google/cookie secrets only as encrypted backend Preview settings for the auth feature; never include them or financial data in source, logs or client bundles. Existing foundation Preview URLs retain the earlier shell. The active authentication feature now has a checked stable Preview with verified owner sign-in/logout and anonymous access denial.

Configure GitHub Actions secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` through secure account tooling, then set repository variable `VERCEL_PREVIEW_ENABLED=true`. Never paste tokens into commits or chat. Feature-branch pushes or a manually requested preview run check/build/deploy the same commit and verify its health through authenticated Vercel CLI access. Missing credentials fail the enabled preview job explicitly; the disabled flag means no deployment was attempted. In the mapping feature code, repository variable VERCEL_AUTH_PREVIEW_ALIAS names the existing expences-record-auth-preview.vercel.app alias, and its tested guard permits only feature/spreadsheet-mapping-configuration. The guarded scripts/assign-auth-preview.ts assigns it only after checked deployment health succeeds; main, PRs and other feature branches cannot move it. Availability and real Google callback registration must be verified before claiming hosted login works.

## Development workflow
Read [CLAUDE.md](CLAUDE.md) and [ai-workflow.md](ai-workflow.md). Changes beyond a simple 2–3-line mechanical edit require a feature; behavior/security/architecture/dependency/formula/deployment changes always do regardless of size. For scaffold provenance, see [template-readme.md](template-readme.md).

Bootstrap structure check: `pwsh -NoProfile -File scripts/verify-bootstrap.ps1 -RepoRoot .` (on Windows, use a process-scoped execution-policy option if unsigned local scripts are restricted). This is not an application or TDD-chronology check. Bootstrap inputs remain for review; their cleanup reminder is intentional.
