# Google setup for the private application

The local authentication code is implemented. Google owner verification, explicit credential storage, read-only refresh and the separately authorized blank-workbook ID-only probe have passed; details are in the active feature checklist. Checked Vercel Preview delivery and hosted anonymous/security checks have passed. The exact hosted callback is registered and real owner browser sign-in/logout has passed; see the active feature checklist for the HTTP status evidence. No production expense workbook is used by this setup.

## Create the OAuth client

Use the Google account that will own and use the application. Open [Google's Personal-mode onboarding](https://console.cloud.google.com/auth/overview/personal). Select **Web application** and register this exact local redirect:

```text
http://localhost:5173/api/auth/callback
```

Personal mode accepts only the Google account that created the application. That audience choice cannot be changed to External/Internal; a future application for multiple users needs a separate project. It avoids the ordinary External Testing seven-day refresh-token expiry. This is separate from the app's accepted seven-day login cookie. See [Google's setup documentation](https://support.google.com/cloud/answer/15544987?hl=en).

Review and accept Google's terms yourself, then download the web client's JSON credentials. Save the file locally as `.env.google-client.json` in the repository root. This filename is ignored by Git. Do not paste the file contents, client secret, refresh token or cookie keys into chat. Do not select an AI-agent client option: this OAuth client belongs to the user's web application. No Cloud trial, payment method or billing account is part of this design. If the expected Personal-mode setup is unavailable, stop and report it; do not silently select External Testing or bypass Google's warnings.

Only register a Preview redirect after the stable alias is actually assigned and verified. `expences-record-auth-preview.vercel.app` is proposed, not yet claimed or verified. The currently deployed foundation Preview does not contain this feature. Per-commit Preview URLs are not the intended OAuth callback origin.

## Identify and explicitly confirm the owner

Use Node 24 and npm from the repository root. Stop the frontend dev server first: the operator helper temporarily needs port 5173.

```sh
npm run setup:google:owner
```

Open the printed localhost URL in your browser. The helper binds only to 127.0.0.1, rejects other Host names, uses Google code/PKCE/state/nonce verification, and requests only `openid email`. After Google returns to the clean completion page, return to the local terminal. Type `YES` only if the account you selected is the intended owner. An existing configured owner cannot be replaced by a different subject through this flow.

Reopening localhost while sign-in is pending resumes the same bound Google flow without resetting its state or lifetime. A completed or expired flow cannot be reopened; restart the operator command for a new attempt.

The helper writes the verified stable subject, client configuration, independent random cookie keys and local defaults directly to the ignored `.env` file. Existing cookie keys/session version are preserved. It prints no Google credentials or subject. Initial enrollment is an explicit local operator action; there is no public enrollment endpoint in the deployed app.

Start the local application in two terminals:

```sh
npm run dev:api
npm run dev:web
```

Open `http://localhost:5173`. Vite proxies `/api` to Fastify on 127.0.0.1:3001 while preserving the browser Host. Required authentication values are documented in `.env.example`; missing configuration fails explicitly. Local HTTP uses development cookie names. HTTPS uses Secure, HttpOnly, host-only cookies and the exact configured origin.

## Connect read-only Sheets access separately

Enable **Google Sheets API** in the unbilled OAuth project. Stop the local frontend, then run:

```sh
npm run setup:google:sheets
```

Open the localhost URL. This distinct operator flow requests `openid`, `email` and `https://www.googleapis.com/auth/spreadsheets.readonly` with offline access and explicit consent. Review that read-only permission yourself. It technically covers spreadsheets accessible to your Google account, not just one workbook. The verified subject must match the configured owner. Confirm in the terminal to save `GOOGLE_SHEETS_REFRESH_TOKEN` directly into ignored local configuration. App logout does not revoke this separate grant.

Before the probe, separately authorize an isolated blank test workbook and put only its ID in `GOOGLE_TEST_SPREADSHEET_ID` in local `.env`. Do not use Expences 2026, other financial documents or a production workbook as a fixture. Then run:

```sh
npm run check:google:sheets
```

The probe refreshes credentials through the Google SDK, checks the token's audience, subject, expiry and approved read-only scopes, and lets application policy verify the owner. It requests only `spreadsheetId` metadata for the configured test ID, with `includeGridData=false`. It returns no spreadsheet ID, cell values, titles, mappings or credentials to the browser or terminal. It makes no writes and does not retry the metadata request automatically.

## Failure and reconnection

| Outcome | Meaning / operator action |
|---|---|
| `reconnect_required` | Missing/revoked/expired grant, missing scope, unexpected refresh-token replacement or invalid token metadata. Run controlled consent again and explicitly replace the secure setting. |
| `access_denied` | The verified subject is not the allowed owner, or the configured test file is inaccessible/API access is denied. Check the chosen account, API enablement and isolated file configuration. |
| `unavailable` | Network/provider/rate-limit or malformed response. Retry the explicit read-only check later; no expense write has been attempted. |
| `identity_clock_ahead` | A verified Google ID token is dated more than 60 seconds ahead of this host. Check and synchronize the host's clock; do not bypass token-time validation. |
| `code_exchange_rejected` / `identity_verification_failed` | The local operator diagnostic identifies the failing stage without exposing provider errors or credentials. Check client/redirect/PKCE configuration or identity verification and retry a new flow. |
| Generic setup failure | Check local registration JSON, exact redirect, selected account and consent. Provider errors and credential-bearing exception objects are intentionally not printed. |

Revoking the application in your Google account invalidates its grant; reconnection requires explicit consent again. Unexpected replacement refresh tokens stop use until controlled configuration replacement. No cross-instance durable token rotation or credential database is implied.

The local completion page and command report only fixed failure reasons, including provider denial, invalid callback, owner denial, identity stage, timeout or an unexpected failure. Raw Google responses, ID-token contents, callback codes and account identifiers are not diagnostic output. A generic failed attempt cannot be retroactively attributed to one of these stages if its raw error was intentionally discarded.

For global app-session invalidation, change `AUTH_SESSION_VERSION`, rotate `AUTH_SESSION_KEY` or change the allowed subject in secure runtime configuration and roll out that configuration. Ordinary logout clears the current browser cookie; a copied unexpired cookie remains usable until its seven-day expiry or global invalidation. Cookie keys and Vercel deployment credentials are independent.

## Preview and future annual workbooks

Configure Google/OAuth/cookie values only as encrypted backend Preview settings, with `APP_ORIGIN` set to the verified stable Preview origin and its exact callback registered with Google. Do not put secrets in `VITE_*` variables, GitHub source, command arguments or client bundles. Preserve Vercel's existing deployment protection; it is independent of the app's Google login. The setup helper does not store deployment credentials or edit Vercel configuration. The checked pipeline reads repository variable VERCEL_AUTH_PREVIEW_ALIAS and runs scripts/assign-auth-preview.ts after protected health verification. Its branch and domain guards permit only this feature branch, the approved authentication Preview alias and a deployment in the configured Vercel project/account namespace. Missing/invalid configuration or alias-command failure stops delivery. Other branches do not move this alias; later feature plans must explicitly choose their Preview routing.

The auth-only Preview does not require a workbook ID or Sheets refresh grant. The controlled Sheets check is a separate local operator operation. Checked Preview delivery, hosted settings and the stable alias are verified. The user confirmed saving https://expences-record-auth-preview.vercel.app/api/auth/callback in the existing Google OAuth client, retaining localhost, and completing sign-in/logout. Preview request history independently confirmed a successful authorized session and logout. The console setting is not registered by editing the downloaded local client JSON. The completed feature was separately approved for merge to main on 2026-11-25. Product Production rollout remains feature 7 and is not included.

Feature 3 will configure and inspect explicitly selected annual workbook mappings, including the user's new 2027 workbook. It must not infer a universal file ID, sheet layout or FX cell. Feature 4 must approve any scope upgrade before writes. Existing production structure, formulas, totals and formatting remain untouched by this feature.
