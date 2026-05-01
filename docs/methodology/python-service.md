# Python Service Recipe — Stub

> Stack-specific recipe for Python services (FastAPI assumed; adapt section names if you use Flask / Litestar / Django REST). Stub form: replace `<<PLACEHOLDERS>>`, drop sections you don't need, and link from `CLAUDE.md`'s **Where to Read What** table.
>
> **Pattern:** describe what is *actually present* in this repo. Recipes are written from real code — not aspirational. Divergences from the recipe go under [Known Tech Debt](#known-tech-debt).

---

## Stack

| Concern | Library | Version |
|---------|---------|---------|
| Python | CPython | `<<>=3.12,<3.14>>` |
| Build | `<<hatchling | poetry | uv>>` | — |
| Web framework | `<<FastAPI>>` | `<<0.111+>>` |
| ASGI server | `<<uvicorn | hypercorn>>` | `<<0.30+>>` |
| Settings | `<<pydantic + pydantic-settings>>` | `<<2.x>>` |
| Database (async) | `<<motor | asyncpg | sqlalchemy[asyncio]>>` | `<<x.y+>>` |
| Cache / queue | `<<redis (async)>>` | `<<5.0+>>` |
| HTTP client | `<<httpx>>` | `<<0.27+>>` |
| Auth | `<<python-jose | authlib>>` | `<<x.y+>>` |
| Logging | `<<structlog>>` | `<<24.2+>>` |
| Tests | `<<pytest + pytest-asyncio>>` | `<<8.0+ / 0.23+>>` |
| Lint / format | `<<ruff>>` | `<<0.4+>>` |
| Type check | `<<mypy --strict>>` | `<<1.10+>>` |

> Bootstrap note: read this from `pyproject.toml`. Pin minimum versions explicitly.

`pytest` runs with `asyncio_mode = "auto"` if applicable — async tests need no `@pytest.mark.asyncio` decorator.

`ruff` rule selection: `<<E, W, F, I, B, C4, UP, ARG, SIM>>`; first-party packages: `<<server, common>>`; line length `<<100>>`.

Entry point: `<<myapp = "myapp.main:run">>`.

---

## Folder Structure

```
services/<service>/
├── pyproject.toml
├── Dockerfile
├── src/<package>/
│   ├── main.py                 # create_app(), lifespan, middleware, exception handlers, health
│   ├── api/                    # Routers + request/response schemas
│   │   ├── <domain>.py         #   /<domain> router
│   │   └── models.py           #   Pydantic DTOs
│   ├── core/                   # Persistence, infra clients, business logic
│   │   ├── <domain>_store.py   #   Repository pattern
│   │   ├── <client>.py         #   Singleton infra client (Redis, K8s, etc.)
│   │   └── logging.py          #   structlog config + ContextVars
│   ├── config/
│   │   └── settings.py         #   Settings(BaseSettings) + @lru_cache get_settings()
│   └── security/
│       ├── auth.py
│       ├── dependencies.py     #   FastAPI Depends() helpers
│       └── settings.py
└── tests/
    ├── conftest.py
    ├── e2e/
    └── test_*.py
```

---

## Naming

| Kind | Pattern | Example |
|------|---------|---------|
| Module | `snake_case.py` | `<<order_store.py>>` |
| Class | `PascalCase` | `<<OrderStore>>`, `<<OrderCreateRequest>>` |
| Function / variable | `snake_case` | `<<create_order>>` |
| Constants | `UPPER_SNAKE` | — |
| Pydantic request/response | `<Action><Entity>Request` / `<Entity>Response` | `<<OrderCreateRequest, OrderDetail>>` |
| Custom exception | `<Domain>Error` / `<Specific>Error` | `<<OrderNotFoundError>>` |
| Test module | `test_<unit>.py` | `<<test_order_store.py>>` |

One public class per module is **not** required — group tightly-related types in the same module.

---

## Layering

```
api/<router>.py  →  Depends(...)  →  core/<store|client>  →  DB / Redis / external API
                                  ↑
                                  config/settings.Settings (via @lru_cache get_settings)
```

- Routers handle HTTP concerns (validation, status codes, headers). **No business logic.**
- `core/` modules hold business logic and own all I/O. **All DB queries go through repository classes** — no raw driver calls in `api/`.
- `security/` is cross-cutting; routers consume it only via `Depends()`.

---

## Configuration

Single `Settings(BaseSettings)` class in `config/settings.py`. Loaded once via `@lru_cache get_settings()`.

```python
class Settings(BaseSettings):
    db_uri: str
    db_name: str
    redis_url: str
    server_base_url: str
    # ...
```

- Env vars are case-insensitive; nested settings use `__` (e.g., `SECURITY__REQUIRE_AUTHENTICATION`).
- Inject via `settings: Settings = Depends(get_settings)` in routers, or import `get_settings()` directly in `core/` factories.
- **No `os.getenv()` in business code.** Existing exceptions are tech debt.

---

## Dependency Injection

FastAPI's `Depends()` is the only DI mechanism. Patterns:

- **Auth**: `Depends(get_current_user)` from `security/dependencies.py`.
- **Settings**: `Depends(get_settings)` (cached singleton via `@lru_cache`).
- **Stateful singletons** (DB client, Redis, infra clients): created in the lifespan handler and exposed via factories — `<<XxxStoreFactory>>`, `get_<<client>>()`. Routers receive them via `Depends(<factory>)`.

No third-party DI container.

---

## Application Entry & Lifespan

`main.py` builds the app with `create_app()`:

1. Configure `structlog` (service name, version, environment, log level).
2. Build `FastAPI(lifespan=lifespan)`.
3. **Lifespan** initializes infra clients (DB, Redis, K8s, etc.) and exposes them via factories; cleans up on shutdown.
4. Register middleware in this order:
   1. **Request-ID middleware** — adds `X-Request-ID` and pushes it into structlog context.
   2. **CORS middleware** — `allow_origins=["*"]` only when `debug` is on, otherwise restricted.
5. Register the global exception handler.
6. Mount routers via `app.include_router(...)`.

---

## Routers

One `APIRouter` per domain file. All endpoints are `async def`. Routers are constructed at module level with `tags=` and `prefix=`.

| Router | File | Purpose |
|--------|------|---------|
| `<<orders>> (/orders)` | `<<api/orders.py>>` | `<<one-line>>` |

---

## Persistence

### `<<MongoDB | PostgreSQL | …>>`

- One async client per process, created in lifespan; held by `<<XxxStore>>` instances.
- **All access flows through repository classes.** Never call the driver from `api/`.

### Redis

- Async singleton in `core/redis_client.py` (`get_redis()`).
- Used as `<<warm-pod task queue / cache / pub-sub>>`.

---

## HTTP Clients

Use `httpx.AsyncClient` only. **No `requests` (sync) anywhere.**

- For **per-call** outbound HTTP, instantiate `AsyncClient` in an `async with` block.
- For **hot-path** outbound HTTP, create a singleton in lifespan and inject it.

---

## Authentication

`<<JWT bearer | API key | mTLS>>`. Implementation in `security/auth.py`:

- `validate_token()` → required claims.
- JWKS cached for `<<1 hour>>` (if applicable).
- `HTTPBearer(auto_error=False)` lets endpoints decide whether auth is required.

Wire on endpoints via:

```python
@router.post("/", status_code=201)
async def create_order(
    body: OrderCreateRequest,
    user: UserClaims = Depends(get_current_user),
    store: OrderStore = Depends(OrderStoreFactory),
):
    ...
```

Health endpoints stay anonymous.

---

## Logging

`core/logging.py` configures `structlog` for JSON output and binds `ContextVar`s (e.g., `request_id`, `<<run_id>>`) automatically.

```python
import structlog
log = structlog.get_logger(__name__)
log.info("created order", order_id=order.id, user_id=user.id)
```

- Use **keyword args**; never string-format the message.
- The request-ID middleware sets `request_id` for the lifetime of the request.

---

## Error Handling

- **Custom exceptions** for known failure modes — `<<OrderNotFoundError>>`, `<<DuplicateOrderError>>`. Define new ones in the module that owns the failure surface.
- Routers raise `HTTPException(status_code=...)` for client-facing 4xx responses.
- Global `@app.exception_handler(Exception)` in `main.py` returns a typed `ErrorResponse` and logs the exception.
- **Do not** wrap unrelated code in `try/except` to mask import errors or missing config — let it fail at startup.

---

## Health Endpoints

Defined in `main.py`:

- `GET /health` → `HealthResponse { status, version, timestamp }`. Always anonymous, no I/O.
- `GET /ready` → `ReadyResponse { ready: bool, checks: dict }`. Pings critical infra. Returns 503 if any check fails.

---

## Testing

- Layout mirrors `src/`. Top-level `tests/` for unit tests; `tests/e2e/` for end-to-end with its own `conftest.py`.
- Async tests need no decorator (`asyncio_mode = "auto"`); flag explicitly only when the test must opt out.
- **Mocking**: `unittest.mock` (`AsyncMock`, `MagicMock`, `patch`).
- **DB**: `<<mongomock-motor | testcontainers | pytest-postgresql>>` for unit tests of stores. Real DB only in e2e.
- **HTTP**: `<<unittest.mock.patch | respx | pytest-httpx>>`.

Test naming: `test_<behavior>_when_<condition>` (e.g., `test_creates_order_when_payload_valid`).

AAA structure (Arrange / Act / Assert), one assertion topic per test.

---

## Type Hints & Lint

- All functions are annotated (return type + parameter types). `mypy --strict` is the bar; new code must keep it green.
- `ruff check` and `ruff format` handle lint and formatting (no separate `black`/`isort`).
- `Any` is forbidden in new code — narrow with `TypedDict`, `cast(...)`, or proper Pydantic models.

---

## Adding a New Endpoint

1. Pick or create the router in `src/<package>/api/<domain>.py`. Include the router from `main.py` if new.
2. Define request/response schemas in `api/models.py` (or `api/<domain>_models.py` if the domain is large).
3. Implement business logic in `core/<domain>_service.py` or extend an existing store.
4. Wire dependencies via `Depends(...)` (settings, auth, stores).
5. Add tests under `tests/test_<domain>.py`.
6. If the endpoint changes a public contract consumed by other services, update the consuming clients too.

---

## Tripwires (also in `CLAUDE.md`)

- No `os.getenv()` in business code — read from `Settings`.
- No `requests` (sync). Use `httpx.AsyncClient`.
- No `time.sleep` or other blocking calls in `async def` handlers.
- No DB driver calls outside `core/` repository classes.
- No `Any`. No untyped functions.
- No `try/except` to silently swallow startup or import failures.
- No new fallback/default values for missing config — fail loud.

---

## Known Tech Debt

> Bootstrap note: list real, present-day divergences. Do **not** invent debt.

1. `<<example: Direct os.getenv() for kubeconfig in core/k8s_launcher.py L38–40 — should be centralised in Settings>>`
2. `<<example: Mongo client accessed via private _db attribute in main.py L49 — wrap in a public property>>`
