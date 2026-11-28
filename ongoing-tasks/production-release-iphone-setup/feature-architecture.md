# Production release and iPhone setup — Architecture

## 1. Pipeline / Integration
Reviewed feature -> user-approved main merge -> actual GitHub checks -> private Production configuration -> exact checked-main production build -> Vercel Production -> owner login and iPhone Home Screen setup. No new automatic production workflow is selected; existing Preview pipeline stays unchanged.

## 2. Component Diagram
Existing React/Vite frontend + Fastify transport -> existing application authorization/mapping/expense planning -> existing Google adapters -> real annual workbook. Existing Vercel/Google OAuth project remain external dependencies. New static install metadata/icons are frontend assets, not a service or data store.

## 3. Data Flow
Browser serves same-origin UI/manifest/icons; Google returns to the exact configured production callback; host-only encrypted cookies authorize the existing API. Validated private mappings select actual annual/month tabs and explicit currency/storage/aggregate references. Google retains all calculations. Deployment/read-only checks never post test expenses/comments to the real workbook.

## 4. Data Stores Summary
Existing Vercel private server settings hold production-only origin, independent session/flow keys, owner/client credentials, existing delegated Sheets grants and validated real mapping. Existing Preview remains mapped to its test workbook. No new database or browser financial persistence; no secrets/real workbook identifiers in Git.

## 5. Extension Points
Later years/months require verified explicit configuration; mobile preferences and full PWA caching/update behavior remain later agreed work. No new API/application/infra port or dependency is introduced.

## 6. Security & Isolation
Retain exact owner/default-protected routes, HTTPS Secure/HttpOnly cookies, Origin/CSRF checks, no-store private responses and separate identity/read/write grants. Inspect current Production domain/protection before changing settings; Preview protection remains intact. Independent Production cookie keys prevent cross-environment session reuse. Observe installation/configuration RED before enabling missing behavior, validate with synthetic fixtures and read-only real integration, and distinguish actual CI/deployment, manufactured test sessions, interactive owner login and physical-device evidence. Real-write overlap/no-retry limits remain Accepted ADR 007.
