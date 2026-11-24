# React PWA recipe


## Project-specific — ExpencesRecord (authoritative)
These approved project rules replace conflicting generic template examples, including enterprise dashboards, role models, MSAL/Auth0, bearer-token assumptions and prescribed UI/query libraries. Only React + strict TypeScript is selected; build tooling, UI libraries, test runner and source paths are deferred. No application code exists yet.

- Build a private mobile-first iPhone PWA: Add to Home Screen, safe areas, system light/dark appearance, desktop usability and a deliberate update strategy. Detailed UX and libraries belong to future approved features.
- Initial entry: date, amount, category and currency; repeated submissions add via the application use case. FE never calculates authoritative FX, edits Sheets directly or owns backend authorization.
- Keep components focused on presentation/interactions; centralize the app API client. Shared wire contracts contain no business logic or Google SDK types. Use strict TypeScript, unknown + narrowing at untrusted boundaries, and no unchecked any.
- Remember category/currency preferences on mobile only. No server/desktop sync and no credential/token storage in browser preferences. Exact local storage and mobile behavior must be designed and tested.
- Google authentication is backend-mediated with exact flow/session still Proposed. Do not implement a token convention from the generic example by default.
- For UI behavior, first write and run an interaction test that fails for the intended missing behavior, implement minimally, observe GREEN and refactor. Verify layout/accessibility manually where relevant; visual checks do not replace behavior tests.
- Do not install dependencies or create app scaffolding during documentation bootstrap. Create a dedicated foundation feature first.
