# 01 — Daily expense entry and reusable design system — Interview, agree the flow and approve the visual direction

## Goal
Complete a short interview and agree the mobile interaction flow, visual direction, reusable-component boundaries and concrete frontend layout before implementation.

## Track
frontend / design / architecture

## What Exists
- apps/web/src/app/App.tsx currently renders the authenticated shell; apps/web/src/api/auth.ts owns same-origin session/logout transport and keeps CSRF in memory.
- React/strict TypeScript, existing CSS, Vitest/jsdom/Testing Library and API/backend tests are already installed. No UI kit, router, state/query library or component-gallery package has been selected.
- The seven-step scope, reusable design system and backend contracts are approved in the conversation; exact visual/default/reset decisions have not been interviewed.

## What to Build
- Compare the four requested company-inspired visual directions plus the user-requested Original teal design on the accepted flow; obtain the user's system choice. The monthly aggregate is a small, muted informational line rather than a large total card.
- Include the requested category monthly-total note on entry and its narrowly scoped read-only mapping/context extension in the concrete design review. Use the selected date month, not today's month for past entries.
- Record the revised user requirements: one warning-free single amount into an explicitly blank cell skips confirmation after a successful preview; all other cases use review with arrow Back and explicit Confirm rather than checkboxes. Show an Options page reached by gear with Light/Dark controls; review the proposed theme-only local persistence.
- Interview about field order, default/retained date/category/currency, amount keyboard and decimal separator, comment entry, formula disclosure, confirmation presentation and post-save reset. Treat earlier answers and approved backend limits as fixed context.
- Agree a small-screen mockup and reusable visual rules: typography, spacing, colors, focus, control sizes, light/dark token foundations and responsive behavior. Show populated, empty, warning, blocked and result examples with synthetic content.
- Review the proposed frontend code/test organization and component/API boundaries in feature-architecture.md; settle concrete names and required primitive set before dependent implementation. No new dependency, public route, storage or backend contract is implicitly selected.
- Record agreed loading/editing/preview/saving/result transitions, draft preservation and recovery behavior, including explicit uncertainty and comment-only recovery. Obtain human approval of the concrete design before steps 02-06.

## Acceptance Criteria
- [ ] Accepted flow and five distinct visual alternatives are recorded; user selects the visual system before component implementation (visual/design review).
- [ ] Monthly aggregate note/source/currency, optional mapping compatibility and protected DTO extension are included in the concrete design (design/architecture review).
- [ ] Conditional direct-save/review behavior, Back navigation, warning acknowledgment through Confirm, Options access and theme-only persistence are included in concrete design approval (design/architecture review).
- [ ] Interview answers/defaults/reset behavior are recorded and unresolved consequential choices remain explicit (design review).
- [ ] Mobile layout and representative states have a reviewed mockup and explicit human approval before component/form implementation (visual/design review).
- [ ] Generic UI primitives, expense-specific orchestration and central transport are separated; exact proposed source/test layout and any architectural choice are reviewed (architecture review).
- [ ] Amount/date/comment input behavior fits the existing API; no client FX, formula construction, automatic write retry or persistent preference feature is introduced (contract review).
- [ ] Seven-step order and deferred preferences/PWA/real-workbook boundaries remain unchanged (scope review).

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
- Depends on: completed backend/authentication features.
