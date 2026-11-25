# 003 — Google authentication and spreadsheet access

## Status
Accepted — 2026-11-25. The user selected delegated access through their own Google account and then explicitly selected "Keep seven-day login (recommended)" after the cookie/logout tradeoff was explained. Use the documented database-free flow and protections below; service-account federation is superseded. Account creation, Google grants, irreversible audience/terms choices and secure credential setup remain separately verified operational prerequisites; no such provisioning is claimed.

## Context
A private single-user iPhone app needs Google login and narrowly scoped server-side access to existing annual workbooks. React/Fastify/Vercel and inward layer dependencies are already Accepted. The foundation and its checked Preview are verified; application and infrastructure are still reserved directories. No additional database is selected.

## Accepted design

### 1. Identity and login flow
- Use backend-mediated Google OpenID Connect authorization-code flow, with S256 PKCE, random state and nonce. Request only openid and email for sign-in; do not request user Drive/Sheets access or an offline refresh token in this login flow.
- Infrastructure exchanges the code and verifies Google signature, issuer, audience, expiry and expected nonce. Application authorizes only the exact configured stable Google subject (GOOGLE_ALLOWED_SUBJECT); email is not the authorization key.
- A 10-minute encrypted, HttpOnly, host-only flow cookie holds the state, nonce and PKCE verifier. The callback validates the matching state, consumes the one-use Google code, checks nonce and clears the flow cookie on success or failure. No in-memory cross-instance replay store is claimed.
- Authentication is disabled safely until the owner's stable subject is explicitly configured. A local operator-only setup flow can obtain and verify the chosen account's subject for secure configuration; it cannot auto-enroll the first visitor or add a public enrollment endpoint.
- Redirect only to the fixed application root after success. Errors use a small fixed safe error code; do not reflect provider error details or accept an arbitrary return URL. Never log callback codes, tokens, cookies, authorization headers or secret-bearing query strings.

### 2. Sessions and logout
- Use an application session carried in an authenticated-encrypted JWE cookie (jose dir/A256GCM), with a fixed seven-day lifetime, no sliding renewal and no database. Require a new Google login after expiry.
- Session claims contain only the allowed subject, issue/expiry times, session version, purpose/audience and a random CSRF value; no Google access or refresh tokens are stored in the cookie. Use separate 32-byte secrets for session and OAuth-flow cookies and reject cross-purpose tokens.
- On HTTPS use __Host-expences_session and __Host-expences_oauth with Secure, HttpOnly, SameSite=Lax, Path=/ and no Domain. Local HTTP development is limited to the exact configured localhost origin, using separate dev cookie names; no insecure external-origin fallback is permitted.
- Every protected request passes authentication and application-owned subject/version/lifetime authorization. A required AUTH_SESSION_VERSION configuration value enables global invalidation; rotating the session key or changing the allowed subject also invalidates existing credentials after configuration rollout.
- POST logout clears this browser's cookie. Explicit tradeoff: without a session store, a copied unexpired cookie is not individually revoked by logout and could be replayed until expiry or global invalidation. If immediate per-session revocation is required, select a server-side session store before implementation; it is not silently added.

### 3. HTTP contracts and request protection
| Method/path | Access | Result |
|---|---|---|
| GET /api/health and generated HEAD | Existing public exception | Minimal status only |
| GET /api/auth/login | Proposed public exception | Begin bound Google redirect flow |
| GET /api/auth/callback | Proposed public exception | Validate callback, authorize subject, establish session or deny |
| GET /api/auth/session | Authenticated and application-authorized | 200 with authenticated:true and CSRF token; 401 for missing/invalid/expired session; 403 for a disallowed valid subject |
| POST /api/auth/logout | Authenticated and application-authorized, same-origin and CSRF protected | 204 plus cleared session cookie |

- Authenticated session responses are Cache-Control:no-store; the CSRF value stays in frontend memory, not browser preference storage. Mutating protected requests require the matching X-CSRF-Token and exact Origin. Reject missing/untrusted Origin, malformed input and unsupported methods. Keep CORS closed.
- Route registration is protected by default; only the exact method/path exceptions above are public. Verify this using test-only routes, not an invented expense/diagnostic endpoint.
- Controllers handle HTTP validation, cookies, status and redirects only. Application owns allowed-user and session lifecycle policy. Infrastructure performs cryptography, Google exchange and credential I/O; bootstrap injects configuration and concrete ports. The thin Vercel handler and portable Fastify boundary remain intact.

### 4. Sheets credentials — user OAuth selected
- The user selected their own Google account on 2026-11-25. Use delegated OAuth, not a service account, federation, a service-account JSON key or a new billing account. A Google API/OAuth project is still required; do not enroll in a Cloud trial or enable billing.
- Keep ordinary app sign-in limited to openid/email. A separate local operator-only consent/setup helper requests openid, email and https://www.googleapis.com/auth/spreadsheets.readonly with offline access for the initial controlled probe. Verify its Google subject matches the explicitly selected owner before accepting a grant. Do not auto-enroll a visitor or add a public credential/enrollment endpoint.
- Store the owner's refresh token as GOOGLE_SHEETS_REFRESH_TOKEN in existing encrypted Vercel server configuration and ignored local configuration. Tokens never enter the browser, session cookie, client bundle, logs, command arguments or repository. No application database is introduced.
- Infrastructure exchanges that refresh credential for short-lived access tokens using google-auth-library. Missing, expired or revoked grants fail explicitly with a reconnect-required outcome; they never fall back to another account or scope. Reconnection is an operator consent/setup operation that updates the secret, not application access to Vercel deployment credentials.
- Treat an unexpected replacement refresh token as requiring controlled credential replacement; do not promise durable cross-instance rotation using memory or silently continue with an invalid older token. App logout ends the app session according to section 2; it does not revoke the owner's separately configured Sheets grant. Google permission can be revoked independently through the owner's Google account.
- The initial Sheets scope is read-only and can technically read spreadsheets accessible to this Google account; application code/probes request only the separately authorized configured test file. Do not imply that the scope itself enforces a per-file or per-cell restriction. drive.file with explicit file selection is a narrower alternative requiring an approved Picker/file-grant flow, not an implicit replacement.
- The step-06 operator/integration probe reads only minimal metadata from an isolated test workbook. No production expense workbook reads, financial fixtures, structure changes or writes occur. Feature 3 configures annual workbook IDs, including 2027; feature 4 must approve any write-scope upgrade before expense writes.
- Prefer Google's Personal mode for this single-account web application: its OAuth client only accepts the creator's Google account, without ordinary test-user token expiry or app verification. Personal mode is irreversible for that project and cannot later become External/Internal; actual creation and terms acceptance remain a separate concrete setup action. Backend stable-subject authorization still applies independently of Google's audience setting.
- If Personal mode cannot be used, report the exact reason. External Testing mode with Sheets scopes normally issues refresh tokens lasting seven days; do not present those as permanent or silently publish an app to change that behavior. No unverified-app warning is bypassed by automation.
- Changing hosts moves secure OAuth configuration behind the same inward credential port; application policy is unchanged. There is no Vercel OIDC dependency for Google access.

### 5. Origins, configuration and dependencies
- Local application origin: http://localhost:5173. Vite proxies /api to the existing local Fastify server so browser requests stay same-origin. Exact local Google redirect: http://localhost:5173/api/auth/callback.
- Proposed stable Preview alias: expences-record-auth-preview.vercel.app, subject to checking availability before assignment. Exact proposed redirect: https://expences-record-auth-preview.vercel.app/api/auth/callback. Configure APP_ORIGIN to the stable alias rather than a commit-specific URL. No wildcard or forwarded-host-derived Google redirect URI is accepted.
- After checked Preview deployment, the pipeline can update this explicitly configured Preview alias for this feature branch; it must never assign the production domain. Per-deployment URLs remain diagnostic; login starts on the canonical APP_ORIGIN before issuing the bound flow cookie.
- Required authentication configuration: APP_ORIGIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_ALLOWED_SUBJECT, AUTH_SESSION_KEY, AUTH_FLOW_KEY and AUTH_SESSION_VERSION. Validate syntax and required values in bootstrap; do not use permissive defaults or a production bypass mode.
- Sheets probe configuration: GOOGLE_SHEETS_REFRESH_TOKEN and GOOGLE_TEST_SPREADSHEET_ID, plus the explicitly selected owner and Google OAuth client configuration above. Keep real values in encrypted server settings/ignored local files; no real IDs or grants are committed. The auth-only UI/API does not require an expense-workbook ID.
- Approved runtime packages, checked against npm registry on 2026-11-25 and installed during this feature: google-auth-library 11.3.4 (Node >=22), jose 6.2.18, @fastify/cookie 11.1.5 (official compatibility matrix: Fastify 5). Keep existing Node 24 and the current test/build tools. Use native fetch for the small read-only probe rather than adding the full googleapis client.
- These approved packages are installed and verified by the feature tests. Dependencies remain in their owning layers; shared wire types have no SDK types or business policy. google-auth-library cannot enter FE/controllers/application; cookie mechanics remain transport, encryption and identity mechanics remain infrastructure.

## Alternatives considered
| Choice | Benefit | Cost/tradeoff | Proposal |
|---|---|---|---|
| Database-free encrypted session | No added service; works across serverless instances | No immediate per-session revocation of a copied cookie | Recommended with explicit seven-day bound and global invalidation |
| Opaque session plus server store | Immediate per-session revocation and device/session tracking | Adds storage/service, operations and another architectural boundary | Use if the logout tradeoff is unacceptable |
| Keyless service-account Sheets access | No persisted Google private key/user refresh token; explicit file sharing | Federation needs billing enabled and more setup | Superseded by the user-account choice |
| Delegated user OAuth | Uses the chosen Google account without a separate technical identity | Secure refresh-token storage and reconnection; initial read-only scope is not per-file | Selected by the user; no database required |
| Service-account JSON key | Simpler initial host-independent secret setup | Long-lived private key must be stored/rotated | Not recommended; never an automatic fallback |

Both recommended federation and delegated user access use OAuth access tokens. Google sign-in uses OAuth plus OpenID Connect in either case. The choice is whose permission authorizes Sheets access. For one user, a delegated refresh token can be kept in secure server configuration; delegated OAuth does not inherently require a database. It still needs explicit scope, revocation/reconnection and credential-handling design.

## Setup prerequisites after design approval
1. Configure a Personal-mode web OAuth application under the Google account that should own this private app, with the exact local/Preview redirects. Confirm the irreversible single-account audience choice and terms at the concrete setup step. Capture the verified owner subject through controlled local setup; no secrets or grants in chat/commits.
2. Configure the two independent cookie keys and required authentication values in secure local/Preview configuration. Keep sessions and flow keys isolated from the Vercel deployment token.
3. For step 06, enable the Sheets API in the unbilled OAuth project and run the controlled owner-only offline consent setup, securely storing the resulting refresh credential. Verify only a separately authorized test workbook. No service account, IAM pool, federation, private key, trial, billing link or document sharing is required by this selected access mechanism.
4. Confirm the Preview alias before registering it, and verify Vercel's platform protection separately from the app's Google login. Existing CI gates stay mandatory; product production rollout and merge to main are not implied by this feature execution request.

## Verification and execution gate
The seven ordered feature steps remain unchanged. Step 01 is approved through the user-account decision and explicit seven-day-session selection recorded above. Write and observe meaningful RED before each policy, crypto/config/transport/UI behavior; implement minimally, observe GREEN, refactor and rerun. Include callback replay, wrong subject, missing/invalid/expired session, CSRF, canonical redirects, logout semantics, missing config, provider failures, log redaction, inward imports and isolated credential-probe tests. Actual Google/Preview setup results remain separate from local passing tests.

## Consequences and cost basis
The selected user OAuth design needs secure configuration for a single refresh grant, not an application database or federation. Google documents Sheets API usage as free within its quotas. No Cloud trial, payment method, billing enablement or paid service is authorized. Sheets read-only OAuth scope is broader than one workbook; the probe and later application policy must limit requested resources. Future writes and their permissions remain feature 4. The seven-day app session proposal and any Google grant expiry are separate lifetimes and must not be conflated.

## Primary references checked 2026-11-25
- [Google OpenID Connect, stable subject, state, nonce and exact redirects](https://developers.google.com/identity/openid-connect/openid-connect)
- [Google server-side OAuth flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Sheets scopes and their boundaries](https://developers.google.com/workspace/sheets/api/scopes)
- [Service-account access by explicit file sharing](https://developers.google.com/workspace/guides/create-credentials)
- [Vercel OIDC federation](https://vercel.com/docs/oidc)
- [Vercel-to-Google federation setup](https://vercel.com/docs/oidc/gcp)
- [Vercel OIDC runtime request context](https://vercel.com/docs/oidc/reference)
- [Google IAM pricing](https://cloud.google.com/iam/pricing)
- [Sheets quotas and pricing](https://developers.google.com/workspace/sheets/api/limits)
- [Official Fastify cookie compatibility](https://github.com/fastify/fastify-cookie)
- [jose encryption and claim validation](https://github.com/panva/jose)
- [Official Google authentication library](https://github.com/googleapis/google-auth-library-nodejs)

## Billing prerequisite clarification — 2026-11-25
The user encountered a Google Cloud trial offer. The earlier setup explanation omitted the federation billing prerequisite; this correction is factual research, not approval to enroll or create billing resources. Google's [external-provider federation setup](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-providers) requires billing enabled. Its [trial FAQ](https://cloud.google.com/signup-faqs) describes separate trial/billing enrollment, while [Workspace project setup](https://developers.google.com/workspace/guides/create-project) treats billing as dependent on the selected APIs/features. No Google setup has been performed.

## User-account selection — 2026-11-25
After the billing prerequisite was explained, the user said: "ok, then let's go with my account". Record this as approval of delegated Google account access and rejection of federation for the feature. It does not authorize trial/billing activation, a broader grant, a new database or pretending the remaining session decision was explicitly answered.

Further primary references: [Google Personal-mode web OAuth setup](https://support.google.com/cloud/answer/15544987?hl=en), [Google token expiry, including External Testing](https://developers.google.com/identity/protocols/oauth2). Google's Personal mode is restricted to its creator and cannot later change audience type; it supports web redirect URIs. The backend's separate subject check remains required.
