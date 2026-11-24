# ExpencesRecord

A private iPhone PWA for entering daily expenses into an existing Google spreadsheet.

Choose a date, amount, category and currency: for example, 100 AED in Supermarket, then 500 KZT in Electronics. Repeated entries add to the existing day/category cell while preserving its formula. Google Sheets calculates currency conversion and totals. The app preserves the spreadsheet's structure, formatting and category labels. Preferred categories and currencies are remembered on mobile only.

## Selected architecture
React + strict TypeScript frontend; Node.js/TypeScript + Fastify backend; Vercel hosting. Controllers handle HTTP only. Application use cases own business policy and application-owned ports; infrastructure provides Google identity and Sheets adapters; the composition root wires dependencies. See [architecture](docs/architecture/overview.md) and [ADRs](adr/readme.md).

The user's annual workbooks are configured by year, including the new workbook they will create for 2027. Missing or unsupported mappings must fail explicitly. No additional database is selected.

## Current state
Documentation bootstrap only. There is no application source, dependency manifest, runnable app, application test suite or deployment workflow yet. Do not treat planned technologies as installed dependencies.

Frontend tooling, versions, test runners, precise Google authentication/access, safe concurrent writes and Vercel packaging must be resolved in their implementation features before use. No credentials or workbook identifiers belong in this repository.

## Development
Read [CLAUDE.md](CLAUDE.md) and the [task workflow](docs/methodology/task-workflow.md). Changes beyond a simple 2–3-line mechanical edit require a named feature under `ongoing-tasks/`; behavior changes require a feature regardless of size and follow observed RED → GREEN → refactor.

Existing documentation verification, from the repository root in PowerShell:
```powershell
./scripts/verify-bootstrap.ps1 -RepoRoot .
```
This verifies the bootstrap, not application behavior. Application commands will be documented when the foundation exists.

For the AI-coding workflow this repo follows, see [template-readme.md](template-readme.md) and [ai-workflow.md](ai-workflow.md).
