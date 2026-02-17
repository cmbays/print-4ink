---
shaping: true
---

# Data Access Layer — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | **Single data access boundary — components never import from `mock-data.ts` or `db/` directly** | Core goal |
| **R1** | **Zero-disruption backend swap (mock → Supabase) without changing consumer code** | Must-have |
| R1.1 | Function signatures are async (matching future Supabase provider) | Must-have |
| R1.2 | Provider pattern with env-based switching | Must-have |
| **R2** | **Per-entity incremental migration (strangler fig)** | Must-have |
| R2.1 | Each domain (customers, jobs, quotes...) routes to its own provider file independently | Must-have |
| R2.2 | One domain can be on Supabase while others remain on mock — in the same running app | Must-have |
| **R3** | **Agent-friendly architecture** | Must-have |
| R3.1 | 8-20x context reduction — domain file is ~50-100 lines, not 2,429 | Must-have |
| R3.2 | No merge conflicts when parallel agents work on different domains | Must-have |
| R3.3 | Self-documenting: explicit return types, param objects for >2 params, minimal JSDoc | Must-have |
| **R4** | **Security boundary** | Must-have |
| R4.1 | Architecture supports auth insertion — function signatures accept session/user context (Phase 2 activation) | Must-have |
| R4.2 | `server-only` guard prevents DAL import from client bundles | Undecided |
| R4.3 | DTO returns — never expose raw internal data shapes | Must-have |
| R4.4 | 3-tier error handling: null for lookups, Result<T,E> for mutations, thrown for bugs | Must-have |
| R4.5 | Fail-closed provider selection — missing/invalid `DATA_PROVIDER` throws, never silently falls through to mock | Must-have |
| R4.6 | Input validation at DAL boundary — all ID parameters validated as UUIDs via Zod before use | Must-have |
| R4.7 | No raw array exports — DAL exports functions only, never entity arrays by reference | Must-have |
| R4.8 | Error responses never leak schema, table names, or SQL to client | Must-have |
| **R5** | **Type-safe contracts via Zod** | Must-have |
| R5.1 | DAL functions return Zod-typed objects | Must-have |
| R5.2 | Existing Zod schemas (UI/form) coexist with future Drizzle schemas (DB) | Must-have |
| **R6** | **Testable without infrastructure** | Must-have |
| R6.1 | All 529 existing tests pass unchanged (zero behavior regression) | Must-have |
| R6.2 | DAL foundation tests validate provider interface contract | Must-have |
| **R7** | **Zero user-visible change in Phase 1** — pure architectural refactor | Must-have |
| **R8** | **Cross-entity business logic isolated in services, not DAL** | Must-have |
| R8.1 | Color resolution (global → brand → customer hierarchy) lives in `lib/services/` | Must-have |
| R8.2 | Board projections (Job → JobCard, 5-entity join) lives in `lib/services/` | Must-have |

---

## Decision Points Log

| # | Decision | Outcome | Date |
|---|----------|---------|------|
| 1 | Flat functions vs. Repository classes | Flat functions (aligns with Next.js App Router, tree-shakeable, agent-friendly) | 2026-02-16 |
| 2 | Migration strategy | Strangler fig (incremental waves, not big-bang) | 2026-02-16 |
| 3 | Error handling style | 3-tier: null for reads, Result<T,E> for mutations, thrown for bugs. No `neverthrow` (not Server Action serializable) | 2026-02-16 |
| 4 | No barrel exports | Direct domain imports: `from '@/lib/dal/customers'`, never `from '@/lib/dal'` | 2026-02-16 |
| 5 | Schema coexistence | Existing Zod schemas for UI, future Drizzle schemas for DB — unified over time, not replaced | 2026-02-16 |
| 6 | Shape selection | **Shape B** — Async signatures + per-domain providers, defer guards to Phase 2 | 2026-02-16 |
| 7 | `server-only` timing (R4.2) | Nice-to-have — defer to Phase 2 RSC migration. Phase 1 has no real data to protect. | 2026-02-16 |
| 8 | Security audit integration | 4 critical findings from security agent incorporated: fail-closed provider (B9), input validation (B10), no raw exports (B11), install `server-only` now (B12). Security headers added (B13). | 2026-02-16 |
| 9 | Provider selection pattern | Fail-closed (throw on invalid env) not fail-open (silent fallback to mock). Prevents serving fake data in production. | 2026-02-16 |

---

## Existing System Context

### Mock Data Module (current)

`lib/mock-data.ts` — 2,429 lines:
- 16 entity arrays (customers, jobs, quotes, invoices, colors, garmentCatalog, screens, artworks, payments, creditMemos, contacts, customerGroups, customerAddresses, customerNotes, quoteCards, scratchNotes)
- 5 config values (mockupTemplates, brandPreferences, displayPreference, autoPropagationConfig, dtfSheetTiers)
- 13 query functions (getCustomerQuotes, getJobsByLane, getInvoicePayments, etc.)
- 45 files import from it

### Helper Files (current)

| File | Imports From mock-data | Pattern |
|------|----------------------|---------|
| `garment-helpers.ts` | garmentCatalog, colors | Simple lookups (getById, getAvailableBrands) |
| `screen-helpers.ts` | jobs, screens | Derived data (screens from completed jobs) |
| `color-preferences.ts` | colors, customers, brandPreferences, autoPropagationConfig | 3-level hierarchical resolution (business logic) |
| `board-projections.ts` | customers, invoices, garmentCatalog, colors, artworks | Multi-entity join → view model (highest complexity) |

### Key Constraint

Phase 1 uses `"use client"` extensively — most page components use hooks, event handlers, or browser APIs. Adding `server-only` to DAL files would require restructuring all 45 consuming files to follow Server Component → Client Component prop-passing patterns. This is a correct architectural direction but triples the scope of the DAL migration.

---

## A: Full RSC Architecture

Build DAL with all Phase 2 patterns from day one: async signatures, `server-only`, `cache()` wrappers, RSC refactoring of all consuming components.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | `lib/dal/` directory with per-domain files, all async, `import 'server-only'` at top | |
| **A2** | Per-domain provider routing (`_providers/mock/`, `_providers/supabase/`) | |
| **A3** | `cache()` wrapper on every DAL function for request deduplication | |
| **A4** | RSC refactor: every page that imports DAL becomes Server Component, passes data as props to `"use client"` children | ⚠️ |
| **A5** | `_shared/result.ts` with `Result<T, E>` discriminated union type | |
| **A6** | `lib/services/` for color-resolution and board-projections | |

**A4 is flagged**: Restructuring 45 files from client-side mock-data imports to Server Component prop-passing is a massive scope expansion. This involves splitting many existing components into Server + Client pairs, changing data flow patterns, and potentially breaking interactive behavior.

---

## B: Structural Foundation (Async + Deferred Guards)

Build the DAL structure with async signatures and per-domain providers, but defer `server-only` and `cache()` to Phase 2 when the RSC architecture is formalized alongside Supabase integration.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | `lib/dal/` directory with per-domain files, all async signatures | |
| **B2** | Per-domain provider routing (`_providers/mock/{domain}.ts`) — each domain file is a one-line re-export from its provider | |
| **B3** | No `server-only` in Phase 1 — DAL files importable by client components (same pattern as current mock-data) | |
| **B4** | No `cache()` in Phase 1 — add when real database queries exist and dedup provides actual benefit | |
| **B5** | `_shared/result.ts` with `Result<T, E>` discriminated union type | |
| **B6** | `lib/services/color-resolution.ts` — port 3-level hierarchy from `color-preferences.ts`, calls DAL internally | |
| **B7** | `lib/services/board-projections.ts` — port multi-entity join from `board-projections.ts`, calls DAL internally | |
| **B8** | Strangler fig migration: Waves 0-4 replace all 45 mock-data import sites | |
| **B9** | **Fail-closed provider selection** — `lib/dal/_providers/index.ts` validates `DATA_PROVIDER` env var against allowlist (`'mock' | 'supabase'`), throws on missing/invalid value. No silent fallback. |  |
| **B10** | **Input validation at DAL boundary** — all ID parameters validated as `z.string().uuid()` before use. Invalid IDs return `null` (lookups) or `Result` error (mutations), never passed to provider. | |
| **B11** | **No raw array exports** — DAL files export async functions only. Mock provider returns copies/projections, never references to mutable arrays. | |
| **B12** | **`server-only` package installed** — Added to `package.json` in Wave 0 for Phase 2 readiness. NOT enforced in Phase 1 DAL files (see R4.2 decision). | |
| **B13** | **Security headers** — `next.config.ts` updated with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` | |
| **B14** | CLAUDE.md updated with "always import from `@/lib/dal/{domain}`, never from mock-data" rule + "never use `sql.raw()` with user input" rule | |

**Phase 2 upgrade path** (when Supabase is added):
1. Add `import 'server-only'` to all DAL files
2. Refactor consuming components to RSC + Client Component pairs
3. Add `cache()` wrappers to DAL functions
4. Build `_providers/supabase/{domain}.ts` files
5. Swap one-line re-exports per domain

---

## C: Sync Passthrough

Fastest possible implementation: sync function signatures, single mock provider file, no async/provider complexity.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **C1** | `lib/dal/` directory with per-domain files, **sync** signatures (e.g., `getCustomerById(id: string): Customer | null`) | |
| **C2** | Single `_providers/mock.ts` file — all domain logic in one provider | |
| **C3** | No `server-only`, no `cache()` | |
| **C4** | Services layer for cross-entity logic | |
| **C5** | Strangler fig migration of import sites | |

**Phase 2 cost**: Every DAL function signature changes from sync to async. Every call site across 45+ files must add `await`. Every consuming function must become `async`. This is a breaking change that touches the entire codebase at once — exactly the "big bang" migration we're trying to avoid.

---

## Fit Check

| Req | Requirement | Status | A | B | C |
|-----|-------------|--------|---|---|---|
| **R0** | Single data access boundary | Core goal | ✅ | ✅ | ✅ |
| **R1** | Zero-disruption backend swap | Must-have | ✅ | ✅ | ❌ |
| R1.1 | Async function signatures | Must-have | ✅ | ✅ | ❌ |
| R1.2 | Provider pattern with env-based switching | Must-have | ✅ | ✅ | ❌ |
| **R2** | Per-entity incremental migration | Must-have | ✅ | ✅ | ❌ |
| R2.1 | Per-domain provider routing | Must-have | ✅ | ✅ | ❌ |
| R2.2 | Mixed providers in same app | Must-have | ✅ | ✅ | ❌ |
| **R3** | Agent-friendly architecture | Must-have | ✅ | ✅ | ✅ |
| R3.1 | 8-20x context reduction | Must-have | ✅ | ✅ | ✅ |
| R3.2 | No merge conflicts across domains | Must-have | ✅ | ✅ | ✅ |
| R3.3 | Self-documenting signatures | Must-have | ✅ | ✅ | ✅ |
| **R4** | Security boundary | Must-have | ✅ | ✅ | ✅ |
| R4.1 | Auth insertion point in signatures | Must-have | ✅ | ✅ | ✅ |
| R4.2 | `server-only` guard | Nice-to-have | ✅ | ❌ | ❌ |
| R4.3 | DTO returns | Must-have | ✅ | ✅ | ✅ |
| R4.4 | 3-tier error handling: null for lookups, Result<T,E> for mutations, thrown for bugs | Must-have | ✅ | ✅ | ✅ |
| R4.5 | Fail-closed provider selection — missing/invalid `DATA_PROVIDER` throws, never silently falls through to mock | Must-have | ✅ | ✅ | ❌ |
| R4.6 | Input validation at DAL boundary — all ID parameters validated as UUIDs via Zod before use | Must-have | ✅ | ✅ | ✅ |
| R4.7 | No raw array exports — DAL exports functions only, never entity arrays by reference | Must-have | ✅ | ✅ | ✅ |
| R4.8 | Error responses never leak schema, table names, or SQL to client | Must-have | ✅ | ✅ | ✅ |
| **R5** | Type-safe Zod contracts | Must-have | ✅ | ✅ | ✅ |
| R5.1 | Zod-typed returns | Must-have | ✅ | ✅ | ✅ |
| R5.2 | Schema coexistence | Must-have | ✅ | ✅ | ✅ |
| **R6** | Testable without infra | Must-have | ✅ | ✅ | ✅ |
| R6.1 | 529 tests pass unchanged | Must-have | ✅ | ✅ | ✅ |
| R6.2 | DAL foundation tests | Must-have | ✅ | ✅ | ✅ |
| **R7** | Zero user-visible change | Must-have | ❌ | ✅ | ✅ |
| **R8** | Services for cross-entity logic | Must-have | ✅ | ✅ | ✅ |
| R8.1 | Color resolution in services | Must-have | ✅ | ✅ | ✅ |
| R8.2 | Board projections in services | Must-have | ✅ | ✅ | ✅ |

**Notes:**
- **A fails R7**: `server-only` guard requires RSC refactor of 45 consuming files — this is a visible architecture change that risks UI regressions and triples scope
- **C fails R1, R1.1, R1.2**: Sync signatures create a breaking change when Supabase is added — every call site needs `await` added
- **C fails R2, R2.1, R2.2**: Single provider file can't route per-domain; sync/async can't coexist per-domain
- **C fails R4.5**: No provider abstraction to validate — sync passthrough has no env-based switching
- **B fails R4.2**: `server-only` deferred to Phase 2 — acceptable because Phase 1 has no real data to protect (all mock data is already in the client bundle via `"use client"` components)

---

## Selected Shape: B — Structural Foundation

**Rationale**: Shape B passes all Must-have requirements. The only miss is R4.2 (`server-only`), which is rated Nice-to-have because Phase 1 has no sensitive data — `mock-data.ts` is already fully client-accessible. When Phase 2 adds Supabase with real user data, `server-only` becomes critical and is added as part of the RSC migration alongside the SupabaseDataProvider.

Shape A is the correct long-term architecture but introduces unnecessary scope and risk in Phase 1. Shape C is fast but creates a breaking migration in Phase 2 — exactly the "big bang" we're trying to avoid.

### Selected Shape Parts

| Part | Mechanism |
|------|-----------|
| **B1** | **DAL domain files** — `lib/dal/{domain}.ts` with async function signatures. One file per entity domain: `customers.ts`, `jobs.ts`, `quotes.ts`, `invoices.ts`, `garments.ts`, `screens.ts`, `colors.ts`, `settings.ts`. No barrel `index.ts`. |
| **B2** | **Per-domain provider routing** — `lib/dal/_providers/mock/{domain}.ts` with mock implementations. Each domain DAL file re-exports from its provider: `export { getCustomerById } from './_providers/mock/customers'`. Swap to `./supabase/customers` per-domain in Phase 2. |
| **B3** | **No `server-only` in Phase 1** — DAL files importable by `"use client"` components using same pattern as current mock-data imports. Upgrade path: add `import 'server-only'` + RSC refactor in Phase 2. |
| **B4** | **No `cache()` in Phase 1** — Mock data is in-memory; dedup provides zero benefit. Add `cache()` wrappers when real database queries exist. |
| **B5** | **`Result<T, E>` type** — `lib/dal/_shared/result.ts` defines the discriminated union. Lookups return `T | null`. Mutations return `Result<T, E>` with string literal error unions. Programming bugs throw. |
| **B6** | **Color resolution service** — `lib/services/color-resolution.ts` ported from `color-preferences.ts`. Calls `dal/colors.ts` and `dal/customers.ts` internally. |
| **B7** | **Board projections service** — `lib/services/board-projections.ts` ported from `board-projections.ts`. Calls `dal/customers.ts`, `dal/invoices.ts`, `dal/garments.ts`, `dal/colors.ts` internally. |
| **B8** | **Strangler fig migration** — 5 waves replacing all 45 mock-data import sites (Wave 0: foundation, Wave 1: simple lookups, Wave 2: entity queries, Wave 3: business logic, Wave 4: cleanup) |
| **B9** | **Fail-closed provider selection** — `lib/dal/_providers/index.ts` validates `DATA_PROVIDER` env var against allowlist (`'mock' | 'supabase'`), throws on missing/invalid value. No silent fallback. |
| **B10** | **Input validation at DAL boundary** — all ID parameters validated as `z.string().uuid()` before use. Invalid IDs return `null` (lookups) or `Result` error (mutations). |
| **B11** | **No raw array exports** — DAL files export async functions only. Mock provider returns copies/projections, never references to mutable arrays. |
| **B12** | **`server-only` package installed** — Added to `package.json` in Wave 0. NOT enforced on DAL files in Phase 1 (deferred per R4.2 decision). Ready for Phase 2 RSC migration. |
| **B13** | **Security headers** — `next.config.ts` updated with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| **B14** | **CLAUDE.md rule updates** — "Import from `@/lib/dal/{domain}`, never from `mock-data.ts` or `db/`" + "Never use `sql.raw()` with user input" + "DAL functions validate ID inputs with Zod" |

---

## Phase 2 Upgrade Path (from Shape B → Shape A)

When Supabase integration begins, Shape B naturally evolves into Shape A:

| Step | Change | Scope |
|------|--------|-------|
| 1 | Add `import 'server-only'` to all `dal/{domain}.ts` files | 8 files, 1 line each |
| 2 | Refactor consuming pages to Server Components | ~20 pages (pass data as props) |
| 3 | Extract `"use client"` wrappers for interactive parts | ~15 new wrapper components |
| 4 | Add `cache()` to DAL functions | 8 files, wrap existing functions |
| 5 | Build `_providers/supabase/{domain}.ts` files | 8 new files |
| 6 | Swap re-exports per domain | 8 files, 1 line change each |

This is ~4 PRs of incremental work, not one giant migration.
