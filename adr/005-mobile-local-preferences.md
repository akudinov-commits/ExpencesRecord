# 005 — Mobile-local preferences

## Status
Accepted — 2026-11-24.

## Context
The user wants preferred currencies/categories remembered for mobile entry only.

## Decision
Store only these UI preferences on the mobile client. Keep them separate from expense data and authoritative backend validation. Do not synchronize them to desktop or add a server preference store. Choose the storage API and mobile detection behavior in the relevant feature.

## Consequences
Preferences are device/browser-local and may be lost when local storage is cleared. No credentials or Google tokens may be stored alongside preferences. Test restore, invalid/stale preference values and storage failure behavior before implementing.
