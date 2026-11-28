# ExpencesRecord design system

Apple-inspired grouped surfaces, native controls and system typography use a teal accent. The generic layer is `apps/web/src/ui`; it imports neither features nor API/auth/backend policy. No UI library or proprietary Apple font/icon assets were added.

`tokens.css` defines semantic surface/ink/accent/warning/error colors, type sizes, spacing, focus and touch sizing. Explicit `data-theme="light"` or `"dark"` selects appearance; the Options feature owns that setting, never the primitives. `u-date` and `u-date--past` provide visual treatments; callers supply the full Today/Past date/weekday label. The monthly total uses small normal-weight `u-help` text, with month and currency.

Use Button for explicit actions (default type button; set type submit for forms). Loading disables dispatch and exposes aria-busy. IconButton requires a label and hides its decorative child from assistive technology. Button variants are primary, secondary and quiet.

Field connects its label/help/error to a control via its render callback. Pass the provided properties to TextInput, Select or TextArea. Inputs retain native keyboard and focus semantics. RadioGroup uses a named fieldset and native radios; callers own the selected value. Card only groups presentation. Notice uses an alert for errors; Status announces changes politely. Never put expense, storage or transport decisions in these components.

Run `npm run dev:web` and open `/design-system.html` for the synthetic local gallery. It is an additional Vite development entry, excluded from the production build's index entry. No production gallery route is registered. The later expense screen composes these primitives; preferences and PWA release remain separate features.

Verify native tab/arrow navigation, 44px or larger action targets, visible focus, labels/help/errors and long/multiline content. Pure visual tokens require visual/contrast review; interaction changes require failing-first tests. Gallery and component tests live in `apps/web/test/ui`.

Actual compositions are in `apps/web/src/features/expenses`: draft/calendar/decimal helpers, registration view-state orchestration, entry/review and independent comment recovery. Options stores only appearance; the same-origin client owns HTTP/DTO mechanics. Later expenses retain earlier pending comment recovery contexts in memory; no comment action re-adds amounts. Local browser QA uses isolated synthetic clients, distinct from real Google/hosted validation.

The expense entry date composes Field/TextInput as one full-width native Date control. The formatted weekday and Today/Past value is the visible surface and accessible description; its native input is the only focusable picker. The wrapper shows focus and disabled states. There is no separate Change date button/editor toggle.
