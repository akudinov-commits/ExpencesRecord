# 02 — Daily expense entry and reusable design system — Build and document the reusable design system

## Goal
Provide a documented reusable visual foundation and accessible React primitives that the expense interface and future enhancements can compose.

## Track
frontend / design system

## What Exists
- Step 01 supplies approved visual direction, state examples, component boundaries and layout.
- apps/web/src/styles.css supplies existing shell styles, and apps/web/test supplies the current interaction-test patterns. No reusable component system/gallery exists yet.

## What to Build
- Include reusable semantic date-state styling: teal Today and amber Past date treatments with readable text in light/dark themes. The date meaning is supplied by the expense feature, not computed in generic primitives.
- Include a named icon-button variant and native radio-group semantics for Options. Central theme tokens support a deliberate light/dark app setting; no theme switch is placed on entry/review. Remove acknowledgment-checkbox/dialog assumptions from the concrete primitive set.
- Implement agreed semantic tokens for color, typography, spacing, borders, radii and control/focus sizing, with light/dark foundations. Keep reusable styling centralized; expense components consume it.
- Build only primitives justified by the approved form: buttons, field/label/help/error wrapper, text/amount input composition, select/date input, textarea, native radio group, card and status/alert/loading as required. Generic primitives receive props/events and contain no expense data, auth decisions or API calls.
- Cover applicable normal/focus/disabled/loading/error/success/warning states, accessible names/descriptions, keyboard operation and focus behavior. Test interactive behavior with observed RED/GREEN; verify purely visual token/style changes visually without artificial TDD claims.
- Add usage/state/accessibility documentation and a synthetic local development component gallery using the existing React setup. Keep it development-only or behind existing owner access if publishing is later explicitly chosen; never add a public financial-data route or unselected Storybook/UI dependency.
- Demonstrate composition and reuse through the gallery and the later expense form, including compatibility with the existing sign-in shell where appropriate. Avoid speculative controls or package extraction without an agreed need.

## Acceptance Criteria
- [ ] Today/Past date visual treatments are legible in both themes and do not rely on color alone (visual/accessibility review).
- [ ] Named icon buttons and native appearance choices have keyboard/label/state coverage with observed RED/GREEN; shared primitives own no expense/navigation/storage policy (component/source checks).
- [ ] Semantic tokens are reusable and demonstrate agreed light/dark, small-screen and focus states (visual review).
- [ ] Primitives are independent of expense features, transport, Google SDKs and backend internals (source/boundary review).
- [ ] Keyboard, labels/help/errors, focus/disabled/loading and dialog behavior where applicable have meaningful failing-first interaction tests and passing results (component tests).
- [ ] Synthetic component gallery and usage/accessibility guidance cover supported variants and contain no private data or new public exception (documentation/access review).
- [ ] Shared components can compose the agreed expense UI without duplicated feature-specific style systems or an unapproved dependency (reuse review).

## References
- [Feature checklist](../daily-expense-entry-ui-checklist.md)
- [Feature architecture](feature-architecture.md)
- [React recipe](../../docs/methodology/react-ui.md)
- [Feature development](../../docs/methodology/feature-development.md)
- [Execution protocol](../../prompts/execution.md)
- [Layer boundaries](../../adr/001-layer-boundaries.md)
- [Authentication](../../adr/003-google-authentication-and-access.md)
- [TDD and feature scope](../../adr/006-tdd-and-feature-scope.md)
- [Preview/write limits](../../adr/007-expense-preview-and-write-limits.md)
- [Backend operator/API guide](../../docs/expense-registration.md)
- Depends on: [01 — Interview, agree the flow and approve the visual direction](01-daily-expense-entry-ui-interview-and-visual-direction.md).
