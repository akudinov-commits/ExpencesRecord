# .NET Service Recipe — Stub

> Stack-specific recipe for .NET (C#) services. Stub form: replace `<<PLACEHOLDERS>>`, drop sections you don't need, and link from `CLAUDE.md`'s **Where to Read What** table.
>
> **Two common shapes** for .NET services:
> 1. **Onion microservice** (default for services owning business logic, data, or async messaging) — separate API, ApplicationServices, Domain, Infrastructure, Contracts, Tests projects.
> 2. **Feature-slice service** (lighter, e.g. via `FastEndpoints`) — single project, vertical slices under `Features/<Domain>/<UseCase>/`. Pick this for thin proxy / read-only / aggregator services without async messaging.
>
> **Pattern:** describe what is *actually present* in this repo. Recipes are written from real code — not aspirational. Divergences from the recipe go under [Known Tech Debt](#known-tech-debt).

---

## Stack

| Concern | Library / version |
|---------|-------------------|
| Target framework | `<<net8.0>>` |
| Logging | `<<Serilog 4.x>>` (+ sinks: Console, App Insights, File as needed) |
| Mediator | `<<MediatR 12.x>>` (with custom `LoggingBehavior<,>` if applicable) |
| Object mapping | `<<AutoMapper 13.x>>` |
| Service bus | `<<MassTransit + MassTransit.AzureServiceBus | RabbitMQ | none>>` |
| HTTP API (onion) | `<<ASP.NET Core MVC controllers + Swashbuckle.AspNetCore>>` |
| HTTP API (feature-slice) | `<<FastEndpoints + FastEndpoints.Swagger>>` |
| ORM (onion) | `<<Microsoft.EntityFrameworkCore 8.x>>` (in `Infrastructure`) |
| ORM (feature-slice) | `<<Dapper 2.x>>` |
| Testing | `<<xUnit + NSubstitute + FluentAssertions>>` (+ `MassTransit.Testing` if using MassTransit) |
| Auth | `<<Microsoft.AspNetCore.Authentication.JwtBearer>>` (+ shared identity package if used) |
| Health checks | `<<AspNetCore.HealthChecks.* + HealthChecks.UI.Client>>` |

> Bootstrap note: read this from the actual `.csproj` files. Pin majors at minimum.

---

## Service Inventory

| Service | Shape | TFM | Service-bus consumer? | Primary purpose |
|---------|-------|-----|----------------------|-----------------|
| `<<SERVICE_1>>` | `<<onion | feature-slice>>` | `<<net8.0>>` | `<<yes/no>>` | `<<one-line purpose>>` |
| `<<SERVICE_2>>` | … | … | … | … |

> Bootstrap note: one row per deployable service. Mark dead code explicitly. Note any TFM drift.

---

## Org-level rules

> Bootstrap note: replace the bullets below with the actual rules your team enforces. Keep them short — link out for detail. Drop bullets that don't apply.

- `<<Contract-first design (e.g., OpenAPI / SwaggerHub) before code, when applicable>>`.
- `<<Cross-service contracts shipped as NuGet packages (events + REST clients) consumed by other services — never duplicated>>`.
- `<<Health checks mandatory for every external dependency (DB, message broker, downstream HTTP)>>`.
- `<<TDD policy — preferred / mandatory / pragmatic — and where to read the rationale>>`.
- `<<Documentation expectations (wiki page, README, ADR) for new services>>`.

---

## Onion microservice — folder structure

```
<service-name>/
├── <Service>.sln
├── <Service>/                              # The API project (entry point)
│   ├── Program.cs                          # Wires logging, config, DI
│   ├── Startup.cs                          # ConfigureServices + Configure (legacy hosting style)
│   ├── AppConfig.cs                        # Root settings POCO bound from configuration
│   ├── ConfigurationHelper.cs              # appsettings + env + secret-store loader
│   ├── Dockerfile
│   ├── appsettings.json
│   ├── appsettings.<Env>.json              # one per environment
│   ├── Controllers/                        # Thin — bind input, call Mediator, return result
│   ├── Consumers/                          # Service-bus consumers (if applicable)
│   ├── Configurations/                     # Mapping profiles, helper config classes
│   ├── Filters/                            # MVC + Swagger filters
│   ├── Attributes/                         # Custom attributes (validation, auth)
│   └── Helpers/
│
├── <Service>.ApplicationServices/          # Business-logic layer
│   ├── Commands/                           # MediatR IRequest types (one per use case)
│   ├── Handlers/                           # MediatR IRequestHandler<TReq, TRes> + BaseHandler
│   ├── Services/                           # Pure business services (no HTTP/DB types)
│   ├── Helper/
│   └── IServiceCollectionExtension.cs      # AddApplicationServices(IConfiguration)
│
├── <Service>.Domain/                       # Domain models + repository contracts
│   ├── AggregatesModel/                    # Domain entities and aggregates
│   ├── ApiModels/                          # Request/response models surfaced to Controllers
│   ├── Repository/                         # IRepository<T> interfaces
│   ├── Constants/
│   ├── Exceptions/                         # Domain exceptions
│   └── IServiceCollectionExtension.cs      # AddDomain(IConfiguration)
│
├── <Service>.Infrastructure/               # Repository implementations + EF model
│   ├── EfModel/                            # DbContext + entity configurations
│   ├── Migrations/                         # EF Core migrations
│   ├── Repositories/                       # Concrete IRepository<T> implementations
│   └── IServiceCollectionExtension.cs      # AddInfrastructure(IConfiguration)
│
├── <Service>.Contracts/                    # Published as NuGet (commands, events, DTOs)
│   ├── Commands/
│   ├── Models/
│   └── nuget.config
│
└── <Service>.Tests/                        # xUnit tests
    ├── BaseTestClass.cs
    ├── Handlers/                           # Mirror ApplicationServices/Handlers/
    └── ServiceCollectionsFake.cs
```

### Project references

```
<Service>           → ApplicationServices, Contracts, Domain, Infrastructure
ApplicationServices → Domain, Contracts
Infrastructure      → Domain
Contracts           → (no internal references — published as NuGet)
Tests               → all of the above
```

> A REST-client NuGet package (if used) is typically published from a separate `<Service>.Client/` project or generated from the OpenAPI spec via NSwag / OpenAPI Generator. Document the actual approach in this repo.

---

## Feature-slice service — folder structure

For thin services with no async messaging and minimal domain logic (proxies, aggregators, read-only readers):

```
<service-name>/
├── <service>.sln
├── <service>.csproj                        # Single project, no separate libraries
├── Program.cs                              # WebApplication.CreateBuilder + FastEndpoints
├── AppConfig.cs                            # Settings POCO
├── ConfigurationHelper.cs                  # Same loader pattern as onion
├── appsettings.json
├── appsettings.<Env>.json
├── Context/                                # Dapper contexts / connection wrappers
└── Features/
    └── <Domain>/
        └── <UseCase>/
            ├── Endpoint.cs                 # FastEndpoints.Endpoint<TReq>
            ├── Models.cs                   # Req / Res records co-located
            └── Summary.cs                  # FastEndpoints Summary
```

Pick this shape when:
- No service-bus consumers / publishers.
- No EF Core migrations or domain aggregates.
- Most "logic" is `request → query → map → response`.

Otherwise default to the onion microservice.

---

## Naming conventions

| Kind | Pattern | Example |
|------|---------|---------|
| Solution / namespace | `<Service>` (PascalCase, no dots in service name) | `<<OrderService>>` |
| Project suffixes | `.ApplicationServices`, `.Domain`, `.Infrastructure`, `.Contracts`, `.Tests` | `<<OrderService.Domain>>` |
| MediatR command | `<Verb><Entity>` (no `Command` suffix) | `<<GetOrderStatus>>` |
| MediatR handler | `<Command>Handler` extends `BaseHandler` and implements `IRequestHandler<TReq,TRes>` | `<<GetOrderStatusHandler>>` |
| Service-bus consumer | `<Verb><Entity>Consumer` implements `IConsumer<TMessage>` | `<<ValidatePaymentConsumer>>` |
| Endpoint queue name | kebab-case, matches the message verb | `<<"validate-payment">>` |
| Controller | `<Domain>Controller : ControllerBase` with `[ApiController]` | `<<OrdersController>>` |
| Request DTO | `<Action>Request` | `<<CreateOrderRequest>>` |
| Response DTO | `<Action>Response` | `<<OrderResponse>>` |
| Repository interface | `I<Entity>Repository` | `<<IOrderRepository>>` |
| Repository impl | `<Entity>Repository` (no `Impl` suffix) | `<<OrderRepository>>` |
| Settings POCO | `AppConfig` (root) or `<Feature>Configuration` (sub-section) | `<<OrderProcessingConfiguration>>` |
| FastEndpoints endpoint | `Endpoint` inside `Features/<Domain>/<UseCase>/` | `<<Features/Orders/Create/Endpoint.cs>>` |
| Test class | `<ClassUnderTest>Tests` | `<<GetOrderStatusHandlerTests>>` |
| Test method | `<Method>_<Scenario>_<Expected>` | `<<Handle_OrderMissing_ReturnsNotFound>>` |
| File | One public type per file, file name = type name | — |

---

## Layering

### Onion

```
Controller / Consumer (thin)
        ↓ IMediator.Send
ApplicationServices.Handler (orchestration + business rules)
        ↓ via interface
Domain.IRepository<T>  →  Infrastructure.Repository<T>  →  EF DbContext / external client
                                                                 ↓
                                                          SQL / HTTP / Service Bus
```

Rules:
- **Controllers and consumers are thin.** Build a `MediatR` command, `await _mediator.Send(...)`, return the result. No business logic.
- **EF types (`DbContext`, `IQueryable<T>`, `DbSet<T>`) live only in `Infrastructure`.** `ApplicationServices` and `Domain` see only `IRepository<T>` and domain types.
- **Cross-service contracts** (commands, events, DTOs) live in `<Service>.Contracts` — never duplicated. Other services consume them as a NuGet reference, never copy.
- **`AppConfig` is the root settings type.** Sub-sections bind to dedicated POCOs via `services.Configure<TSection>(...)`.

### Feature-slice

```
Endpoint (HandleAsync) — request validation + orchestration + response shaping
        ↓
Context (Dapper) / direct service call
```

No layering. Each `Features/<Domain>/<UseCase>/` is self-contained.

---

## Dependency injection

Each project (in onion shape) exposes one extension method:

```csharp
public static class IServiceCollectionExtension
{
    public static IServiceCollection AddDomain(this IServiceCollection services, IConfiguration cfg) { … }
    // or AddApplicationServices, AddInfrastructure
}
```

`Startup.ConfigureServices` calls them in dependency order (`Domain` → `Infrastructure` → `ApplicationServices`). The API project additionally registers MediatR, the message bus (if any), AutoMapper, telemetry, logging, health checks, and Swagger.

### Lifetime decision rule

- **Scoped** (default): MediatR handlers, repositories, EF DbContext, services that touch per-request state.
- **Singleton**: configuration POCOs (via `IOptions<T>`), AutoMapper `IMapper`, message-bus client, HTTP clients via `IHttpClientFactory`, custom long-lived clients.
- **Transient**: lightweight stateless helpers, exception-handling middleware.
- **`AddHostedService<T>()`**: BackgroundServices.

---

## Configuration

### The standard loader

A `ConfigurationHelper.GetConfiguration(IConfigurationBuilder builder)` builds configuration in this order:

1. `appsettings.json` (required, reload-on-change)
2. `appsettings.{ASPNETCORE_ENVIRONMENT}.json`
3. User secrets (when a `UserSecretsId` is set)
4. Environment variables
5. **Secret-store values** (`<<Azure Key Vault | AWS Secrets Manager | HashiCorp Vault>>`) — typically loaded only in the deployed environment, e.g. via `AddKeyPerFile` for Key Vault values mounted as files

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        var config = ConfigurationHelper.GetConfiguration(null);
        // Configure logging from config
        // Build host
        // Apply migrations on startup if applicable
    }
}
```

### Settings binding

Bind the root POCO once in `Startup.ConfigureServices`, then bind sub-sections separately:

```csharp
services.Configure<AppConfig>(Configuration);
var appSettings = Configuration.Get<AppConfig>();
services.Configure<<<FeatureConfiguration>>>(
    Configuration.GetSection("<<FeatureConfiguration>>"));
```

Inject via `IOptions<T>` (or `IOptionsMonitor<T>` for hot-reload). **Never** read `IConfiguration["..."]` in business code — that lives in handlers / services and breaks contract clarity.

### Environment naming

> Bootstrap note: list the actual `ASPNETCORE_ENVIRONMENT` values used in this repo and what each one means.

| Env | Purpose |
|-----|---------|
| `<<Local>>` | Local F5 dev — in-memory dependencies where possible |
| `<<Development>>` | Hosted dev environment |
| `<<Test>>` | Named test environment |
| `<<Production>>` | Production |

---

## HTTP / service-bus communication

### Inter-service async (when applicable)

Use `<<MassTransit on Azure Service Bus | MassTransit on RabbitMQ | NServiceBus | none>>`.

```csharp
services.AddMassTransit(x =>
{
    x.SetKebabCaseEndpointNameFormatter();

    x.AddConsumer<<<VerbEntity>>Consumer>()
        .Endpoint(e => e.Name = "<<verb-entity>>");

    if (envName == "<<Local>>")
    {
        x.UsingInMemory((ctx, cfg) => cfg.ConfigureEndpoints(ctx));
    }
    else
    {
        x.UsingAzureServiceBus((ctx, cfg) =>
        {
            cfg.Host(appSettings.<<MessageBusConnection>>);
            cfg.UseDelayedRedelivery(_ => _.Intervals(
                TimeSpan.FromMinutes(1),
                TimeSpan.FromMinutes(2),
                TimeSpan.FromMinutes(5)));
            cfg.UseMessageRetry(_ => _.Immediate(10));
            cfg.ConfigureEndpoints(ctx);
        });
    }
});
```

- **Consumer endpoint names are kebab-case verbs** (`<<process-payment>>`, `<<send-notification>>`).
- **Retry / redelivery defaults**: `<<Immediate(10)>>` immediate retries + delayed redelivery at `<<1m / 2m / 5m>>`.
- **Local dev** uses `UsingInMemory` so no real broker is needed.

### Inter-service sync (HTTP)

Each service may ship a typed REST client as a NuGet package. Consumers register it via `IHttpClientFactory`:

```csharp
services.AddHttpClient<I<Service>Client, <Service>Client>((sp, client) =>
{
    var settings = sp.GetRequiredService<IOptions<<Service>Settings>>().Value;
    client.BaseAddress = new Uri(settings.BaseUrl);
});
```

Add resilience (`AddStandardResilienceHandler` or Polly) only for flaky downstreams.

### Within a service

Use **MediatR**. `_mediator.Send(new <<GetOrderStatus>>(body))`. Handlers live in `ApplicationServices/Handlers/`.

Pipeline behaviors (logging, validation, telemetry) registered globally:

```csharp
services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining(typeof(Program));
    cfg.RegisterServicesFromAssemblyContaining(typeof(ApplicationServices.IServiceCollectionExtension));
    cfg.RegisterServicesFromAssemblyContaining(typeof(Domain.IServiceCollectionExtension));
    cfg.RegisterServicesFromAssemblyContaining(typeof(Infrastructure.IServiceCollectionExtension));
    cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
});
```

---

## Authentication

> Bootstrap note: name the actual auth mechanism (`<<JwtBearer | shared identity package | API key | mTLS>>`) and where it is wired.

Example with JWT Bearer:

```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* authority, audience, validation parameters */ });
```

Health and `/ping` endpoints stay `[AllowAnonymous]`. For dev environments where auth is not available, controllers may use `[AllowAnonymous]` per-route — but never disable the auth middleware itself.

---

## Health endpoints

**Mandatory.** Every external dependency gets a check.

```csharp
services.AddHealthChecks()
    .AddSqlServer(connectionString: appSettings.DBConnectionString, name: "DB")
    .AddCheck("<Service>Self", new SelfHealthCheckAction())
    .AddCheck("<Downstream>", new <Downstream>HealthCheckAction(Configuration));

app.UseHealthChecks("<<HEALTH_PATH>>", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
});
```

> Bootstrap note: pick a path (commonly `/health`, `/healthz`, or `/hc`) and use it consistently across services.

A simple `/ping` GET that returns 200 is also commonly added.

---

## Logging

**Serilog** is the standard. Common sinks:

1. Console (with a structured template, e.g. `{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u4}] | {Message:l}{NewLine}{Exception}`)
2. `<<Application Insights | Seq | Datadog>>` in deployed environments
3. Optionally `Serilog.Sinks.File` for local debugging

Inject `ILogger<T>` and use **structured templates with named placeholders**:

```csharp
_logger.LogInformation(
    "Created order for {CustomerId}, total {Total}",
    order.CustomerId, order.Total);
```

No string interpolation into log messages. No `Console.WriteLine` outside `Program.cs` startup. `Microsoft.AspNetCore` minimum level is typically overridden to `Warning` to keep logs useful.

---

## Cancellation & async

- Every async method takes `CancellationToken cancellationToken` (or `ct`) and forwards it.
- MediatR handlers receive it from `Handle(TReq request, CancellationToken cancellationToken)`.
- FastEndpoints injects it into `HandleAsync(req, ct)`.
- Controllers should accept it via parameter and forward to `_mediator.Send(command, ct)`.
- BackgroundServices use `stoppingToken` from `ExecuteAsync`.
- No `Thread.Sleep`, no `.Result` / `.Wait()`, no `async void` outside event handlers.

---

## Adding a new HTTP endpoint (onion shape)

1. **Define the contract first** (in `<<SwaggerHub | the OpenAPI spec | the Contracts project>>`) and get review from the consuming team.
2. **Generate / write the Request and Response models** under `<Service>.Domain/ApiModels/`.
3. **Add a MediatR command** under `<Service>.ApplicationServices/Commands/<Verb><Entity>.cs`:
   ```csharp
   public record <<GetOrderStatus>>(<<OrderStatusRequest>> Payload)
       : IRequest<<<OrderStatusResponse>>>;
   ```
4. **Add the handler** under `<Service>.ApplicationServices/Handlers/<Verb><Entity>Handler.cs` extending `BaseHandler` and implementing `IRequestHandler<TReq, TRes>`. Inject only interfaces (`I*Repository`, `IConfiguration`, `ILogger<T>`).
5. **Add the controller method** in `<Service>/Controllers/<Domain>Controller.cs`. Build the command, `await _mediator.Send(command, ct)`, return `Ok(response)`. Decorate with `[SwaggerOperation]` + `[SwaggerResponse]`.
6. **Update `<Service>.Contracts`** if the request/response is used by other services. Bump the NuGet version.
7. **Tests** in `<Service>.Tests/Handlers/<Verb><Entity>HandlerTests.cs`.

## Adding a new service-bus consumer

1. **Define the message contract in `<Service>.Contracts/Commands/`** (or consume one from another service's Contracts package).
2. **Add the consumer** under `<Service>/Consumers/<Verb><Entity>Consumer.cs` implementing `IConsumer<TMessage>`. Forward to a MediatR command for the actual work.
3. **Register and name the endpoint** in `Startup.ConfigureServices` inside `AddMassTransit`:
   ```csharp
   x.AddConsumer<<<Verb><Entity>>Consumer>()
       .Endpoint(e => e.Name = "<<verb>>-<<entity>>");
   ```
4. **Tests** using `MassTransit.Testing` (`InMemoryTestHarness`).

## Adding a new repository

1. **Interface** in `<Service>.Domain/Repository/I<Entity>Repository.cs` (only domain types in the signature).
2. **Implementation** in `<Service>.Infrastructure/Repositories/<Entity>Repository.cs`. May use `DbContext`, `IQueryable<T>`, `DbSet<T>` — all confined to this layer.
3. **Register** in `<Service>.Infrastructure/IServiceCollectionExtension.cs` (`AddInfrastructure`).
4. **Migrations** via `dotnet ef migrations add <Name> --project <Service>.Infrastructure`. Migrations typically run on startup in deployed environments.

---

## Testing

| Concern | Library |
|---------|---------|
| Framework | xUnit |
| Assertions | `<<FluentAssertions>>` (preferred) |
| Mocking | `<<NSubstitute>>` (preferred) — `<<Moq>>` only when matching legacy code |
| MediatR handler tests | Direct instantiation with substituted dependencies |
| Service-bus consumer tests | `InMemoryTestHarness` from `MassTransit.Testing` (if applicable) |
| HTTP integration tests | `Microsoft.AspNetCore.Mvc.Testing` `WebApplicationFactory<Program>` (requires `public partial class Program { }` in `Program.cs`) |
| Test project location | `<Service>.Tests/` mirroring source folder structure |

Conventions:
- One test class per production class. AAA pattern (Arrange / Act / Assert).
- `BaseTestClass` carries shared setup (substitute factories, common fakes).
- `ServiceCollectionsFake` gives handlers a wired-up `IServiceCollection` without booting the host.

> Bootstrap note: state the team's TDD policy (mandatory / preferred / pragmatic) and cover the main parts of the code; avoid trivial tests for trivial methods.

---

## Tripwires (also in `CLAUDE.md`)

- **No business logic in controllers, FastEndpoints endpoints, or service-bus consumers.** They build a MediatR command and call `_mediator.Send(...)`. That's it.
- **No EF / persistence types (`DbContext`, `IQueryable<T>`, `DbSet<T>`, raw connection objects) outside `<Service>.Infrastructure`.** Domain and ApplicationServices see only `I<Entity>Repository`.
- **No `Thread.Sleep`, `.Result`, `.Wait()`, `async void` outside event handlers.**
- **No `new HttpClient()`** — always `IHttpClientFactory`, named or typed client.
- **No hardcoded URLs, connection strings, queue names, or NuGet credentials.** All via `AppConfig` + `IOptions<T>`. Queue names are kebab-case constants registered in `AddMassTransit` (or equivalent).
- **No `IConfiguration["..."]` in business code.** Configuration access lives in `Startup` / `Program` / a settings POCO.
- **No `Console.WriteLine` outside `Program.cs` startup logging.** Use `ILogger<T>`.
- **No string interpolation into log messages** — use named placeholders.
- **Shared cross-service contracts live in `<Service>.Contracts`** and are consumed as NuGet packages. Never duplicate a contract type into another service's source tree.
- **No new cross-service async transport** (queue, topic, webhook) without an ADR.
- **Health check coverage is mandatory** for every external dependency (DB, message bus, downstream HTTP). Missing health checks block PR review.
- **The HTTP path for health checks is `<<HEALTH_PATH>>`** — pick one and use it consistently.
- **Endpoint changes require a contract change first** (OpenAPI spec / Contracts project). The contract is the source of truth; the code follows.

---

## Known Tech Debt

> Bootstrap note: list real, present-day divergences from the rules above. Do **not** invent debt — only list what genuinely exists. Future contributors should match these patterns only when working *inside* the affected files; new code follows the rules.

1. `<<example: Service A still uses Startup.cs hosting style; new services should use the WebApplication minimal hosting model in Program.cs>>`
2. `<<example: Two ORMs coexist — EF Core in onion services, Dapper in feature-slice services. New onion services use EF; new feature-slice services may use Dapper>>`
3. `<<example: appsettings.<Local>.json contains plain-text dev secrets — accepted because the env never touches real cloud resources; do not use as a template for other environments>>`
