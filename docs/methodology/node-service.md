# Node.js Service Recipe — Stub

> Stack-specific recipe for Node.js backend services (Fastify / Express / NestJS / Hono). Stub form: replace `<<PLACEHOLDERS>>`, drop sections you don't need, and link from `CLAUDE.md`'s **Where to Read What** table.
>
> **Pattern:** describe what is *actually present* in this repo. Recipes are written from real code — not aspirational. Divergences from the recipe go under [Known Tech Debt](#known-tech-debt).

---

## Stack

| Concern | Library | Version |
|---------|---------|---------|
| Runtime | Node.js | `<<>=20.x LTS>>` |
| Language | TypeScript | `<<5.x>>` |
| Package manager | `<<pnpm | npm | yarn>>` | `<<x.y>>` |
| Web framework | `<<Fastify | Express | Hono | NestJS>>` | `<<x.y+>>` |
| Validation | `<<zod | typebox | class-validator>>` | `<<x.y+>>` |
| ORM / driver | `<<prisma | drizzle | mongodb | pg>>` | `<<x.y+>>` |
| HTTP client | `<<undici | got | axios>>` | `<<x.y+>>` |
| Logging | `<<pino | winston>>` | `<<x.y+>>` |
| Tests | `<<vitest | jest | node:test>>` | `<<x.y+>>` |
| Lint / format | `<<eslint + prettier | biome>>` | `<<x.y+>>` |

> Bootstrap note: read this from `package.json`. Pin versions explicitly. Note module type (`"type": "module"` for ESM vs CJS).

Scripts: `<<dev, build, start, test, lint, typecheck>>`.

Entry point: `<<dist/index.js>>`. TypeScript config: `<<tsconfig.json>>` with `"strict": true`.

---

## Folder Structure

```
services/<service>/
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── index.ts                # bootstrap: build server, start listening
│   ├── server.ts               # build server (separate from start for testability)
│   ├── routes/                 # HTTP routes grouped by domain
│   │   ├── health.ts
│   │   └── <domain>/
│   ├── services/               # Business logic (one file per service class/module)
│   ├── repositories/           # DB access (one file per aggregate)
│   ├── clients/                # HTTP/external service clients
│   ├── plugins/                # Framework plugins (Fastify) or middleware (Express)
│   ├── schemas/                # zod schemas for request/response validation
│   ├── config/
│   │   └── env.ts              # validated env loader
│   └── lib/                    # cross-cutting helpers
└── test/
    ├── unit/
    └── e2e/
```

---

## Naming

| Kind | Pattern | Example |
|------|---------|---------|
| File | `kebab-case.ts` | `<<order-service.ts>>` |
| Class / type | `PascalCase` | `<<OrderService, OrderCreateRequest>>` |
| Function / variable | `camelCase` | `<<createOrder>>` |
| Constants | `UPPER_SNAKE` | — |
| Test file | `<unit>.test.ts` | `<<order-service.test.ts>>` |
| Schema | `<entity>.schema.ts` | `<<order.schema.ts>>` |

One default export per file is **not** required; prefer **named exports** for tree-shaking and refactor safety.

Path aliases (e.g., `@/`) configured in `tsconfig.json` paths and resolved at runtime via `<<tsx | tsconfig-paths | bundler>>`.

---

## Layering

```
Routes (thin)  →  Services (business logic)  →  Repositories (DB)  →  Driver / ORM
                                            ↘
                                              Clients (external HTTP)
```

- Routes parse input (via schema), call a service, return a result. **No business logic.**
- Repositories are the **only** layer that talks to the database. No ORM/driver imports outside `repositories/`.
- Cross-cutting concerns (auth, request-id, error mapping) are framework plugins/middleware, not service code.

---

## Configuration

Single `env.ts` that parses and validates `process.env` at startup using `<<zod | envalid>>`. Application code imports the typed object — never `process.env` directly.

```ts
// src/config/env.ts
import { z } from 'zod'

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export const env = Env.parse(process.env)
export type Env = z.infer<typeof Env>
```

Fail fast on invalid env — **never** fall back to default values for missing required config.

---

## Dependency Injection

Choose **one** approach and stick to it:

- **Manual factory wiring** (Fastify / Hono): construct services in `server.ts`, attach to request via `decorate` / context.
- **NestJS DI container**: provider modules with `@Injectable()`.
- **`awilix` / `tsyringe`**: only if cross-module wiring becomes painful with manual factories.

> Bootstrap note: pick one and document the chosen pattern with a real example.

---

## Application Entry & Lifecycle

`server.ts` builds the server (no `listen()` call) — `index.ts` calls `buildServer().listen(...)`. This separation enables in-process integration tests.

Lifecycle hooks (`onClose` / `beforeShutdown`):
1. Stop accepting new connections.
2. Drain in-flight requests with a timeout.
3. Close DB / Redis / external clients.

Always handle `SIGTERM` and `SIGINT` for graceful shutdown.

---

## Routes

One file per domain. Pattern (Fastify shown):

```ts
// src/routes/orders/index.ts
import type { FastifyPluginAsync } from 'fastify'
import { OrderCreateRequest, OrderResponse } from '@/schemas/order'

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.post('/orders', {
    schema: { body: OrderCreateRequest, response: { 201: OrderResponse } },
    handler: async (req, reply) => {
      const order = await app.orderService.create(req.body, req.user)
      reply.code(201).send(order)
    },
  })
}
```

All handlers are `async`. Validation lives in the route schema, not in the handler body.

---

## Persistence

### `<<MongoDB | PostgreSQL via Prisma | …>>`

- One client per process (singleton). Initialised at server build, closed on shutdown.
- **All access flows through `repositories/`.** Routes and services never import the driver/ORM directly.
- Migrations: `<<prisma migrate | drizzle-kit | knex migrate>>` — versioned, checked into git, applied via CI.

---

## HTTP Clients

Use `<<undici | got>>`. Avoid `axios` for new code (heavyweight, blocks adoption of Node fetch).

- Construct one client per upstream service in `clients/<service>-client.ts`.
- Set explicit timeouts (connect + total). No infinite waits.
- Add retry with backoff only for **idempotent** requests, and only when the upstream is genuinely flaky.

---

## Authentication

- `<<JWT bearer | session cookie | API key>>`. Implementation in `plugins/auth.ts`.
- Validate signature + claims on every protected route.
- Health endpoints stay anonymous.
- Never log tokens, never log full request bodies for auth endpoints.

---

## Logging

`<<pino>>` configured in `server.ts`. Inject the logger via the framework's request context (e.g., `req.log` in Fastify) so each log line carries the request id.

```ts
req.log.info({ orderId: order.id, userId: user.id }, 'order created')
```

- **Structured fields, not interpolation.** Object first, message last.
- No `console.log` / `console.error` in production paths.
- Redact sensitive fields (`password`, `token`, `authorization`) via the logger's redact config.

---

## Error Handling

- Throw **typed errors** (`OrderNotFoundError`, `ValidationError`) — define them in the module that owns the failure surface.
- A single global error handler maps known errors → HTTP status codes; everything else → 500.
- Never `try/catch` to mask import errors or missing config — let startup fail loudly.

---

## Health Endpoints

- `GET /health` → `{ status: 'ok', version, timestamp }`. Always anonymous, no I/O.
- `GET /ready` → pings critical infra; returns 503 if any check fails.

Do not add expensive checks to `/health` — that's `/ready`'s job.

---

## Testing

| Concern | Library |
|---------|---------|
| Runner | `<<vitest | jest | node:test>>` |
| Assertions | built-in / `expect` |
| Mocks | `<<vi.mock | jest.mock | sinon>>` |
| HTTP client mocking | `<<msw | nock | undici MockAgent>>` |
| Server integration | framework's `inject()` (Fastify) / `supertest` (Express) |

Conventions:
- `test/unit/` for pure logic; `test/e2e/` for full server integration via `inject()` / `supertest`.
- Test names: `<unit>.test.ts` next to or mirroring source layout.
- AAA pattern (Arrange / Act / Assert).
- Avoid hitting real DBs in unit tests — use `<<testcontainers | in-memory implementations>>` in e2e only.

---

## Type Safety

- `tsconfig.json` has `"strict": true` plus `"noUncheckedIndexedAccess": true`.
- `any` is forbidden in new code — narrow with `unknown` + zod / type guards.
- Schema types flow from zod (`z.infer<typeof Schema>`), not duplicated by hand.

---

## Adding a New Endpoint

1. Define the request/response schemas in `src/schemas/<domain>.ts` using zod.
2. Add the route in `src/routes/<domain>/index.ts` (or extend an existing file). Wire schema in the route definition.
3. Implement business logic in `src/services/<domain>-service.ts`.
4. Add repository methods in `src/repositories/<aggregate>-repository.ts` if persistence is involved.
5. Register the route plugin in `server.ts`.
6. Tests: unit test for the service (mock repository); e2e test for the route via `inject()` / `supertest`.

---

## Tripwires (also in `CLAUDE.md`)

- No `any`. Use `unknown` + narrowing or a zod-inferred type.
- No `process.env.X` in business code — use the validated `env` object from `config/env.ts`.
- No raw DB driver / ORM imports outside `repositories/`.
- No `console.log` / `console.error` in production paths — use the request-scoped logger.
- No synchronous filesystem / blocking calls in request handlers.
- No new HTTP client per request — construct singletons at server build.
- No `axios` in new code — use `undici` / `got`.
- No fallback values for required env — fail fast at startup.
- No `try/catch` to swallow startup or import errors.

---

## Known Tech Debt

> Bootstrap note: list real, present-day divergences. Do **not** invent debt.

1. `<<example: legacy axios usage in clients/legacy-x-client.ts — migrate when touched>>`
2. `<<example: process.env.X reads scattered in services/ — centralise in env.ts>>`
3. `<<example: console.log in tools/migrate.ts — kept until migrated to pino>>`
