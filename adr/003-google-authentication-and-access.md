# 003 — Google authentication and spreadsheet access

## Status
Proposed — 2026-11-24.

## Context
A private app needs Google login, single-user authorization and narrowly scoped access to existing annual workbooks without exposing credentials on mobile.

## Decision
Required boundary: infrastructure verifies Google identity; application authorizes the configured stable Google subject; controllers pass the verified identity. Proposed approach: backend sessions and server-side Sheets access through a service account, preferably keyless federation. Exact OAuth/OIDC flow, session cookie/CSRF controls, consent configuration and access mechanism need approval before implementation. No service account, token store or credentials are provisioned.

## Consequences
Evaluate refresh/access behavior and operational setup before choosing. User OAuth with file selection is an alternative whose token storage and consent lifecycle need explicit design. Access denial and expired/invalid sessions require tests. No tokens in localStorage, logs or frontend bundles.
