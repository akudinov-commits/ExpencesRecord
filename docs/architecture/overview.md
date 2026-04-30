# <<PROJECT_NAME>> — Architecture Overview

> System-level topology. Read at session start. Updated when the topology changes.
> Feature-level architecture lives in `ongoing-tasks/{feature}/architecture.md`, not here.

---

## 1. System Context

`<<ONE_PARAGRAPH_DESCRIPTION_OF_WHAT_THE_SYSTEM_DOES_AND_WHO_USES_IT>>`

```
<<CONTEXT_DIAGRAM>>
```

> Bootstrap note: replace with an ASCII or Mermaid context diagram. Show external actors (users, upstream systems, downstream consumers) and the system as a single box.

---

## 2. Components

| Component | Stack | Purpose | Path |
|-----------|-------|---------|------|
| `<<COMPONENT_1>>` | `<<STACK>>` | `<<PURPOSE>>` | `<<PATH>>` |
| `<<COMPONENT_2>>` | `<<STACK>>` | `<<PURPOSE>>` | `<<PATH>>` |

```
<<COMPONENT_DIAGRAM>>
```

> Bootstrap note: one row per deployable artifact or major module. Mirror the `Repository Shape` table in `CLAUDE.md` — these two should agree.

---

## 3. Data Flow

### 3.1 Inbound

`<<HOW_REQUESTS_OR_EVENTS_ENTER_THE_SYSTEM>>`

### 3.2 Processing

`<<HOW_DATA_MOVES_THROUGH_THE_SYSTEM_INTERNALLY>>`

### 3.3 Outbound

`<<HOW_RESULTS_OR_EVENTS_LEAVE_THE_SYSTEM>>`

---

## 4. Data Stores

| Store | Technology | Purpose | Owner |
|-------|------------|---------|-------|
| `<<STORE_1>>` | `<<TECH>>` | `<<PURPOSE>>` | `<<OWNING_COMPONENT>>` |

---

## 5. Cross-cutting concerns

- **Authentication / Authorization:** `<<MODEL>>`
- **Logging / Observability:** `<<APPROACH>>`
- **Configuration:** `<<APPROACH>>`
- **Secret management:** `<<APPROACH>>`
- **Error handling:** `<<APPROACH>>`

---

## 6. Trust boundaries

`<<DESCRIBE_NETWORK_AND_TRUST_BOUNDARIES_HERE>>`

> Examples: which components are public-facing, which are internal-only, what is treated as untrusted input (LLM output, user-supplied content), how secrets cross boundaries.

---

## 7. Active ADRs

See [`adr/readme.md`](../../adr/readme.md) for the full index. The architectural decisions that most directly shape this overview:

- `<<NNN-relevant-adr.md>>` — `<<one-line-summary>>`

---

## 8. Where to add detail

- **Feature-level architecture** — `ongoing-tasks/{feature}/architecture.md`
- **Per-stack recipes** — `docs/methodology/<<STACK_RECIPE>>.md`
- **Specific decisions** — `adr/NNN-*.md`
- **Hard rules / tripwires** — `CLAUDE.md`
