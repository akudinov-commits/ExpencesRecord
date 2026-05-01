# React UI Recipe — Stub

> Stack-specific recipe for React/TypeScript UIs (Vite + Tailwind + shadcn assumed; adapt names if you use Next.js / Remix / CRA). Stub form: replace `<<PLACEHOLDERS>>`, drop sections you don't need, and link from `CLAUDE.md`'s **Where to Read What** table.
>
> **Pattern:** describe what is *actually present* in this UI. Recipes are written from real code — not aspirational. Divergences from the recipe go under [Known Tech Debt](#known-tech-debt).

---

## Stack

| Concern | Library | Version |
|---------|---------|---------|
| Build | `<<Vite | Next.js | Remix>>` | `<<6.x>>` |
| Framework | React + TypeScript | `<<18.x / 5.x>>` |
| Styling | Tailwind CSS + `tailwindcss-animate` + `tailwind-merge` | `<<3.x>>` |
| UI primitives | `<<shadcn/ui (Radix + class-variance-authority) | Mantine | Chakra>>` | — |
| Server state | `<<TanStack Query | SWR | Apollo>>` | `<<5.x>>` |
| Routing | `<<React Router (HashRouter | BrowserRouter) | Next.js router>>` | — |
| Auth | `<<MSAL | Auth0 | NextAuth>>` | — |
| Real-time | `<<SignalR | Socket.IO | Pusher | none>>` | — |
| Forms | `<<react-hook-form + zod | Formik + Yup>>` | — |
| Icons | `<<Lucide React | Heroicons>>` | — |
| Toasts | `<<sonner | react-hot-toast>>` | — |
| Testing | `<<Vitest | Jest>>` + Testing Library + `<<MSW>>` | — |
| Stories | `<<Storybook>>` (optional) | — |

Path alias `@/` → `./src/` (configured in `tsconfig.json` and `vite.config.ts`).

Scripts: `<<dev, dev:mock, build, test, lint, storybook>>`.

---

## Folder Structure

```
src/
├── api/            # Domain modules + client.ts (apiClient/get/post/put/del)
├── components/
│   ├── ui/         # shadcn primitives — DO NOT hand-edit
│   ├── common/     # PageShell, EmptyState, ErrorBoundary
│   ├── auth/       # RequireAuth, RequireRole, RequirePermission
│   ├── layout/, <domain1>/, <domain2>/, …    # Domain folders
│   ├── forms/, skeletons/
├── contexts/       # React Context providers
├── hooks/          # use<Feature> hooks
├── lib/            # auth, config, constants, utils, types (legacy core)
├── pages/          # Route-level page components (thin composers)
├── types/          # Per-feature types
├── test/           # setup.ts + mocks/ (server.ts, handlers.ts, fixtures.ts)
├── main.tsx        # Providers + flat route definitions
└── index.css       # Tailwind directives + HSL variables
```

### Where does a new component go?

- Reusable across multiple domains → `components/common/`.
- Specific to one domain → `components/<domain>/`.
- Pure shadcn primitive → `components/ui/`, **only via `npx shadcn add`** (never hand-edit).

---

## Naming

| Kind | Pattern | Example |
|------|---------|---------|
| Page | `PascalCase.tsx` | `<<OrderListPage.tsx>>` |
| Component | `PascalCase.tsx` | `<<OrderStatusBadge.tsx>>` |
| shadcn primitive | `kebab-case.tsx` | `dropdown-menu.tsx` |
| Hook | `useCamelCase.ts` | `<<useOrders.ts>>` |
| API module | `camelCase.ts` | `<<orders.ts>>` |
| Type file | `camelCase.ts` | `<<orders.ts>>` |
| Story | `PascalCase.stories.tsx` | `<<OrderStatusBadge.stories.tsx>>` |
| Test | `PascalCase.test.tsx` | `<<OrderStatusBadge.test.tsx>>` |

Exports: components — **named only**; pages — named **plus** default export (kept for router compatibility). Each `components/<domain>/` ships an `index.ts` barrel; `components/ui/` does **not** (import primitives directly).

All imports use `@/` (no relative `../../..` past one level).

---

## Component Architecture

### Pages are thin

Pages compose domain components and call API hooks. **No business logic.** Real example:

```tsx
export function OrderListPage() {
  const { orders, isLoading } = useOrders()
  return (
    <PageShell>
      <OrderListHeader />
      <OrderTable orders={orders} isLoading={isLoading} />
    </PageShell>
  )
}
```

### Layout

`PageShell` (in `components/common/`) → `AppLayout` (sidebar + top bar + scrollable main, in `components/layout/`).

### Loading / empty / error

- **Loading**: render a skeleton from `components/skeletons/` while `isLoading`. One skeleton per page.
- **Empty**: `<EmptyState>` from `components/common/`.
- **Error**: routed pages wrapped in `<ErrorBoundary>`; mutation errors → `toast.error()`.

---

## API Layer

### Core client — `api/client.ts`

```ts
apiClient<T>(endpoint, options)  // Authenticated fetch — attaches Bearer token
get<T>(endpoint)
post<T>(endpoint, body)
put<T>(endpoint, body)
del<T>(endpoint)
```

Base URL from `getConfig('VITE_<<APP>>_URL')`. Throws `ApiError` with `status`, `statusText`, `body`.

### TanStack Query hooks

Each `api/*.ts` file exports a **per-module key factory** + hooks:

```ts
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: OrdersFilterParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
}

export function useOrders(params: OrdersFilterParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => get<OrdersListResponse>(`/orders${buildQueryString(params)}`),
    staleTime: 10_000,
  })
}
```

Key factories are **per-module**, not centralised — keep them next to the hooks that use them.

---

## Real-Time Data (if applicable)

`<<Describe SignalR/SSE/WebSocket setup, hooks, and reconnection strategy. Delete this section if the app has no real-time features.>>`

---

## Styling

- Tailwind utility classes everywhere. **No CSS modules, no styled-components.**
- `cn()` from `lib/utils.ts` (`twMerge(clsx(...))`) for conditional/merged class names.
- HSL CSS variables (`--primary`, `--background`, `--sidebar-*`) defined in `index.css`.
- Light + dark via `.dark` class (`darkMode: ["class"]` in `tailwind.config.js`).

---

## Auth

- `<<MSAL | Auth0>>` singleton in `lib/auth.ts`; `acquireToken()` for silent token acquisition (falls back to redirect).
- Route guards: `<RequireAuth>`, `<RequireRole roles={[...]}>`, `<RequirePermission>`. Compose by nesting.
- **Never** call `acquireToken` from components — go through `apiClient`.

---

## Toasts

- `toast.success()` / `toast.error()` / `toast.info()` from `<<sonner>>` for transient feedback.
- Reserve `<Dialog>` / `<AlertDialog>` for blocking confirmations.

---

## Routing

- `<<HashRouter | BrowserRouter>>` chosen because `<<one-line rationale>>`. Don't switch without an ADR.
- Flat route definitions in `main.tsx`.
- URL search params for filters/pagination (`useSearchParams`).
- Protected via `<RequireAuth>` and `<RequireRole>`.

---

## Runtime Configuration

`lib/config.ts` provides `getConfig(key)`:
1. Checks `window.__RUNTIME_CONFIG__` (injected at container start).
2. Falls back to `import.meta.env` (build-time).

This lets the same image run against multiple environments without rebuilding.

---

## Forms

**Target pattern:**
- `react-hook-form` + `zodResolver`.
- Schema co-located in `<ComponentName>.schema.ts` next to the form component.
- Render with shadcn `<Form>` + `<FormField>` wrappers from `components/ui/form.tsx`.

**Anti-pattern** (do not replicate): manual `useState` per field + ad-hoc validation.

---

## Testing

| Package | Purpose |
|---------|---------|
| `<<Vitest>>` | Test runner (jsdom, globals) |
| Testing Library | DOM queries + user-event |
| `<<MSW 2>>` | API mocking (`setupServer()`) |
| `<<Storybook>>` | Co-located `*.stories.tsx` (optional) |

Coverage thresholds (configure in `vitest.config.ts`):

- Global `<<50%>>`, `src/api/**` `<<90%>>`, `src/hooks/**` `<<90%>>`, `src/components/ui/**` excluded.
- MSW: `test/mocks/server.ts`, `handlers.ts`, `fixtures.ts`.
- Tests co-located in `__tests__/` subfolders next to the code they cover.

Standard test wrapper:

```tsx
function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}
```

---

## Types

Two locations:

1. **`lib/types.ts`** — core domain (legacy catch-all, if still present).
2. **`types/<feature>.ts`** — feature-specific. **New types go here.**

Constants are co-located with their types.

---

## Adding a New Domain Feature

Standard sequence for a new feature `widgets`:

1. **Types** — `src/types/widgets.ts` with domain types and constants.
2. **API** — `src/api/widgets.ts`: `widgetKeys` factory + hooks (`useWidgets`, `useWidget`, `useCreateWidget`, …) calling `apiClient` from `client.ts`.
3. **Components** — `src/components/widgets/` with components, co-located stories, `__tests__/`, and `index.ts` barrel.
4. **Page(s)** — `src/pages/WidgetListPage.tsx` (named + default export); compose domain components and call API hooks only.
5. **Route** — wire into `src/main.tsx`, wrap in `<RequireAuth>` (and `<RequireRole>` if restricted).
6. **Tests** — API module test (target high coverage); page/component tests using the standard wrapper + MSW handlers in `test/mocks/handlers.ts`.

---

## Tripwires (also in `CLAUDE.md`)

- No `any`. Use `unknown` + narrowing or a proper type.
- No raw `fetch` / `axios` in components or new api modules — use `apiClient` (or TanStack Query hooks built on it).
- No direct Radix imports in pages — use the shadcn wrappers under `components/ui/`.
- No business logic in pages.
- No hand-editing `components/ui/` — use `npx shadcn add`.
- No `useState` + `useEffect` for server data — use TanStack Query.
- No inline `style={{...}}` except for dynamic values.
- No calling `acquireToken` directly in components — use `apiClient`.
- No router switch (Hash↔Browser) without an ADR.

---

## Known Tech Debt

> Bootstrap note: list real, present-day divergences. Do **not** invent debt.

1. `<<example: Mixed API patterns — some modules use apiClient, others call raw fetch(). Concrete violators: api/admin.ts L86–364>>`
2. `<<example: Forms use manual useState + ad-hoc validation; target react-hook-form + zod>>`
3. `<<example: Core types split between lib/types.ts and types/*.ts — new types go in types/<feature>.ts>>`
