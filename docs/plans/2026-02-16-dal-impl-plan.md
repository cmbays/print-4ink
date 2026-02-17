# DAL Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Replace the 2,429-line `lib/mock-data.ts` monolith with a structured Data Access Layer (`lib/dal/`) that acts as a single import boundary, supports zero-disruption backend swap, and enables per-entity incremental migration.

**Architecture:** Flat async functions organized by domain (customers, jobs, quotes, invoices, garments, colors, screens, settings, artworks) with per-domain provider routing via re-exports. Mock providers wrap raw data arrays in async copy-returning functions. A services layer handles cross-entity business logic. The strangler fig migration replaces 46 import sites across 5 waves with zero user-visible change.

**Tech Stack:** Next.js 16.1.6, TypeScript, Zod (input validation), Vitest (tests), existing lib/schemas/, existing lib/mock-data.ts (data source)

**Epic:** #360 (DAL Architecture) | **Issue:** #158 (DAL with mock passthrough)
**Breadboard:** `docs/breadboards/dal-breadboard.md`
**Shaping:** `docs/shaping/dal/shaping.md` (Shape B: Structural Foundation, 14 parts)

---

## Migration Patterns Reference

All session agents must apply these patterns consistently:

### Pattern 1: Server Component with module-level arrays

```tsx
// BEFORE
import { jobs, customers } from "@/lib/mock-data";
const blockedJobs = jobs.filter(j => j.lane === "blocked");
export default function DashboardPage() { return <div>{blockedJobs.length}</div>; }

// AFTER — move computations inside async component
import { getJobs } from "@/lib/dal/jobs";
import { getCustomers } from "@/lib/dal/customers";
export default async function DashboardPage() {
  const [jobs, customers] = await Promise.all([getJobs(), getCustomers()]);
  const blockedJobs = jobs.filter(j => j.lane === "blocked");
  return <div>{blockedJobs.length}</div>;
}
```

### Pattern 2: Server Component already async (cleanest migration)

```tsx
// BEFORE
import { customers, quotes } from "@/lib/mock-data";
export default async function CustomerDetailPage({ params }) {
  const { id } = await params;
  const customer = customers.find(c => c.id === id);
  const customerQuotes = quotes.filter(q => q.customerId === id);
}

// AFTER — replace array ops with DAL function calls
import { getCustomerById, getCustomerQuotes } from "@/lib/dal/customers";
export default async function CustomerDetailPage({ params }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  const customerQuotes = await getCustomerQuotes(id);
}
```

### Pattern 3: Client Component page (split required)

When a `"use client"` page component imports from mock-data, split into Server Component page + Client Component inner:

```tsx
// BEFORE — jobs/board/page.tsx ("use client" page)
"use client";
import { jobs, quoteCards, scratchNotes } from "@/lib/mock-data";
export default function ProductionBoardPage() { /* uses state, hooks, DnD */ }

// AFTER — split into two files:
// page.tsx (Server Component — fetches data)
import { getJobs, getQuoteCards, getScratchNotes } from "@/lib/dal/jobs";
import { ProductionBoard } from "./_components/ProductionBoard";
export default async function ProductionBoardPage() {
  const [jobs, quoteCards, scratchNotes] = await Promise.all([
    getJobs(), getQuoteCards(), getScratchNotes(),
  ]);
  return <ProductionBoard initialJobs={jobs} initialQuoteCards={quoteCards} initialScratchNotes={scratchNotes} />;
}

// _components/ProductionBoard.tsx (Client Component — receives data as props)
"use client";
interface ProductionBoardProps {
  initialJobs: Job[];
  initialQuoteCards: QuoteCard[];
  initialScratchNotes: ScratchNote[];
}
export function ProductionBoard({ initialJobs, initialQuoteCards, initialScratchNotes }: ProductionBoardProps) {
  const [jobCards, setJobCards] = useState(() => initialJobs.filter(...).map(projectJobToCard));
  // ... rest of existing component logic
}
```

### Pattern 4: Client Component with cross-reference imports

When a client component imports mock-data for cross-referencing (not its primary domain), have the parent Server Component fetch and pass as props:

```tsx
// BEFORE — CustomersDataTable.tsx ("use client")
import { quotes } from "@/lib/mock-data";
export function CustomersDataTable({ customers }: Props) {
  // uses quotes.filter(q => q.customerId === c.id)
}

// AFTER — parent passes quotes as prop
// customers/page.tsx (Server Component):
const [customers, quotes] = await Promise.all([getCustomers(), getQuotes()]);
return <CustomersDataTable customers={customers} quotes={quotes} />;

// CustomersDataTable.tsx — add quotes to Props interface
interface Props { customers: Customer[]; quotes: Quote[]; }
```

---

## Wave 0: Foundation Infrastructure

**Serial, 1 session** | Depends on: nothing | Slice: V1

### Task 0.1: Shared Types and Infrastructure

**Files to create:**
- `lib/dal/_shared/result.ts` — `Result<T, E>` discriminated union, `ok()`, `err()`, `isOk()`, `isErr()`
- `lib/dal/_shared/validation.ts` — `validateUUID(id)` using `z.string().uuid()`
- `lib/dal/_shared/errors.ts` — `DalError` base class
- `lib/dal/_providers/index.ts` — `getProviderName()` fail-closed provider selection

**Files to modify:**
- `next.config.ts` — Add security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)
- `CLAUDE.md` — Add DAL import rules under Coding Standards
- `.env.local` — Add `DATA_PROVIDER=mock`

**Steps:**
1. Create `lib/dal/` directory structure: `_shared/`, `_providers/`, `_providers/mock/`
2. Write `_shared/result.ts`: `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` with constructors and type guards
3. Write `_shared/validation.ts`: `validateUUID(id: string): string | null` — returns sanitized UUID or null on invalid
4. Write `_shared/errors.ts`: `DalError extends Error` with code property (e.g., `'NOT_FOUND'`, `'VALIDATION'`, `'PROVIDER'`)
5. Write `_providers/index.ts`: reads `DATA_PROVIDER` env, validates against `['mock', 'supabase']`, throws on invalid/missing
6. Add security headers to `next.config.ts`
7. Run `npm install server-only` (install but don't enforce — Phase 2 readiness)
8. Add to CLAUDE.md: "Import from `@/lib/dal/{domain}`, never from `mock-data.ts`" + "Never use `sql.raw()` with user input" + "DAL functions validate ID inputs with Zod"
9. Create `.env.local` with `DATA_PROVIDER=mock`

### Task 0.2: Foundation Tests

**Files to create:**
- `lib/dal/__tests__/result.test.ts`
- `lib/dal/__tests__/validation.test.ts`
- `lib/dal/__tests__/provider-router.test.ts`

**Steps:**
1. Test Result type: `ok()` creates success, `err()` creates failure, `isOk()`/`isErr()` type guards
2. Test validation: valid UUIDs pass, invalid strings return null, non-UUID formats return null
3. Test provider router: `DATA_PROVIDER=mock` returns `'mock'`, `DATA_PROVIDER=supabase` returns `'supabase'`, missing/invalid throws
4. Run `npm test` — all existing 529 tests pass + new foundation tests pass
5. Run `npm run build` — clean build with security headers

**Demo:** `npm test` passes with new foundation tests. `npm run build` clean. Provider router throws on `DATA_PROVIDER=invalid`.

---

## Wave 1: All Domain Providers + Customer Migration

**Serial, 1 session** | Depends on: Wave 0 | Slices: V2 + V3 (provider creation only)

This session creates ALL 18 provider files (establishing the complete DAL boundary) and then migrates the customer route group as the reference implementation that subsequent Wave 2 agents copy.

### Task 1.1: Create All 9 Mock Provider Files

**Files to create (9 files):**
- `lib/dal/_providers/mock/customers.ts`
- `lib/dal/_providers/mock/jobs.ts`
- `lib/dal/_providers/mock/quotes.ts`
- `lib/dal/_providers/mock/invoices.ts`
- `lib/dal/_providers/mock/garments.ts`
- `lib/dal/_providers/mock/colors.ts`
- `lib/dal/_providers/mock/screens.ts`
- `lib/dal/_providers/mock/settings.ts`
- `lib/dal/_providers/mock/artworks.ts`

**Steps per provider file:**
1. Import raw data arrays from `@/lib/mock-data`
2. Import validation from `@/lib/dal/_shared/validation`
3. Import Zod-inferred types from `@/lib/schemas/`
4. Write async functions that return **copies** (spread or `structuredClone`), never references
5. For getById functions: validate UUID input, return `T | null`
6. For getAll functions: return `T[]` (copy of array)
7. For filtered queries (e.g., `getCustomerQuotes(customerId)`): validate UUID, filter, return copies

**Critical constraint:** Mock providers return copies (`[...array]` or `array.map(item => ({...item}))`), never references to mutable source arrays.

### Task 1.2: Create All 9 DAL Domain Files

**Files to create (9 files):**
- `lib/dal/customers.ts`
- `lib/dal/jobs.ts`
- `lib/dal/quotes.ts`
- `lib/dal/invoices.ts`
- `lib/dal/garments.ts`
- `lib/dal/colors.ts`
- `lib/dal/screens.ts`
- `lib/dal/settings.ts`
- `lib/dal/artworks.ts`

**Pattern:** Each file is a one-line re-export from its mock provider:
```typescript
// lib/dal/customers.ts
export {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
} from './_providers/mock/customers';
```

**No barrel index.ts** — consumers import `@/lib/dal/customers`, never `@/lib/dal`.

### Task 1.3: Migrate Customer Route Group (Reference Implementation)

**Files to modify (~6 files):**
- `app/(dashboard)/customers/page.tsx` — Server Component, single domain
- `app/(dashboard)/customers/[id]/page.tsx` — Server Component, 6 domains
- `app/(dashboard)/customers/_components/CustomersDataTable.tsx` — Client Component
- `app/(dashboard)/customers/_components/CustomerDetailHeader.tsx` (if imports mock-data)
- `app/(dashboard)/customers/_components/CustomerTabs.tsx` (if imports mock-data)
- Any other customer components importing mock-data

**Steps:**
1. Read each file, identify its mock-data imports and component type (Server vs Client)
2. For Server Components: replace mock-data imports with DAL imports, add `async/await`
3. For Client Components: remove mock-data imports, add props for the data, update parent to pass data
4. `customers/[id]/page.tsx` — Replace all 6 domain imports with DAL function calls (all providers exist)
5. Verify: `npm run build` clean, `npm test` passes, customer pages render correctly

### Task 1.4: Customer Domain Tests

**Files to create:**
- `lib/dal/__tests__/customers.test.ts`

**Steps:**
1. Test each customer DAL function returns correct type
2. Test `getCustomerById(validId)` returns customer
3. Test `getCustomerById(invalidId)` returns null
4. Test `getCustomerById('not-a-uuid')` returns null (validation)
5. Test returned data is a copy (modifying result doesn't affect source)

**Demo:** Customer pages render. All customer tests pass. Import path changed from `@/lib/mock-data` to `@/lib/dal/customers`.

---

## Wave 2: Consumer Migration

**Parallel, 4 sessions** | Depends on: Wave 1 | Slice: V3 (consumer migration)

Each session handles a non-overlapping set of files to avoid merge conflicts. All 18 DAL provider files already exist from Wave 1.

### Task 2.1: Dashboard + Jobs Route Group (Session A — `dal-migrate-dashboard-jobs`)

**Files to modify (~8 files):**
- `app/(dashboard)/page.tsx` — Server Component, imports `jobs` + `customers` at module level (Pattern 1)
- `app/(dashboard)/jobs/page.tsx` — Server Component
- `app/(dashboard)/jobs/[id]/page.tsx` — Server Component
- `app/(dashboard)/jobs/board/page.tsx` — **Client Component page** (Pattern 3 — split required)
- `app/(dashboard)/jobs/_components/JobDetail*.tsx` — Client Components
- Any other jobs components importing mock-data

**Special handling for `jobs/board/page.tsx`:**
This is the only client component page that imports from mock-data. Must be split:
1. Extract current content to `jobs/board/_components/ProductionBoard.tsx`
2. New `page.tsx` becomes Server Component that fetches data via DAL and passes as props
3. `ProductionBoard.tsx` receives `initialJobs`, `initialQuoteCards`, `initialScratchNotes` as props

**Special handling for `page.tsx` (Dashboard):**
Module-level computations (`const blockedJobs = jobs.filter(...)`) must move inside the component function. Add `async` to the component, `await` the DAL calls.

### Task 2.2: Quotes Route Group (Session B — `dal-migrate-quotes`)

**Files to modify (~7 files):**
- `app/(dashboard)/quotes/page.tsx` — Server Component
- `app/(dashboard)/quotes/new/page.tsx` — Server Component
- `app/(dashboard)/quotes/[id]/page.tsx` — Server Component
- `app/(dashboard)/quotes/[id]/edit/page.tsx` — Server Component
- `app/(dashboard)/quotes/_components/QuoteForm.tsx` — **Client Component, 4 domains** (Pattern 4)
- `app/(dashboard)/quotes/_components/QuotesDataTable.tsx` — Client Component
- Any other quote components importing mock-data

**Special handling for `QuoteForm.tsx`:**
Imports from 4 domains (customers, colors, garmentCatalog, artworks). Parent pages must fetch this data and pass as props. QuoteForm's interface expands to accept these as props.

### Task 2.3: Invoices Route Group (Session C — `dal-migrate-invoices`)

**Files to modify (~6 files):**
- `app/(dashboard)/invoices/page.tsx` — Server Component
- `app/(dashboard)/invoices/[id]/page.tsx` — Server Component
- `app/(dashboard)/invoices/[id]/edit/page.tsx` — Server Component (already async)
- `app/(dashboard)/invoices/_components/InvoiceStatsBar.tsx` — Client Component
- `app/(dashboard)/invoices/_components/InvoicesDataTable.tsx` — Client Component
- Any other invoice components importing mock-data

### Task 2.4: Garments + Screens + Settings + Shared (Session D — `dal-migrate-remaining`)

**Files to modify (~8 files):**
- `app/(dashboard)/garments/page.tsx` — Server Component
- `app/(dashboard)/garments/_components/BrandDetailDrawer.tsx` — Client Component
- `app/(dashboard)/garments/_components/GarmentCatalogDataTable.tsx` — Client Component
- `app/(dashboard)/screens/page.tsx` — Server Component
- `app/(dashboard)/settings/colors/page.tsx` — Server Component
- `app/(dashboard)/settings/_components/DtfTabContent.tsx` — Client Component
- `components/features/ColorSwatchPicker.tsx` — Client Component
- `components/features/InheritanceDetail.tsx` — Client Component

**Verification (all Wave 2 sessions):**
1. `npm run build` — clean
2. `npm test` — all 529 existing tests pass
3. Pages render correctly with mock data
4. No mock-data imports in migrated files (verify with grep)

---

## Wave 3: Services Extraction

**Parallel, 3 sessions** | Depends on: Wave 2 | Slice: V4

Extract cross-entity business logic from helper files into services that call DAL functions.

### Task 3.1: Color Resolution Service (Session A — `dal-service-colors`)

**Files to create:**
- `lib/services/color-resolution.ts`

**Files to modify:**
- All files importing from `lib/helpers/color-preferences.ts` (~7 files)

**Steps:**
1. Read `lib/helpers/color-preferences.ts` — understand the 3-level hierarchy logic
2. Create `lib/services/color-resolution.ts` with async functions that call DAL:
   - `resolveEffectiveFavorites(entityType, entityId?)` → calls `getColors()`, `getBrandPreferences()`, `getCustomerById()`
   - `getInheritanceChain(entityType, entityId?)` → same data sources
   - `propagateAddition(level, colorId)` → calls `getAutoPropagationConfig()`, `getBrandPreferences()`, `getCustomers()`
   - `getImpactPreview(level, colorId)` → calls `getBrandPreferences()`, `getCustomers()`
   - `getBrandPreference(brandName)` → calls `getBrandPreferences()`
   - Color removal functions → calls `getBrandPreferences()`, `getCustomers()`
3. Update all consumers to import from `@/lib/services/color-resolution`
4. Verify `npm run build` + `npm test`

### Task 3.2: Board Projections Service (Session B — `dal-service-board`)

**Files to create:**
- `lib/services/board-projections.ts`

**Files to modify:**
- All files importing from `lib/helpers/board-projections.ts` (~1 file: `jobs/board/page.tsx` or `ProductionBoard.tsx`)

**Steps:**
1. Read `lib/helpers/board-projections.ts` — understand the 5-entity join logic
2. Create `lib/services/board-projections.ts` with async functions that call DAL:
   - `projectJobToCard(job)` → calls `getCustomerById()`, `getInvoiceById()`, `getGarmentById()`, `getColorById()`, `getArtworkById()`
   - `projectScratchNoteToCard(note)` → pure computation (no DAL calls needed)
3. Update consumers to import from `@/lib/services/board-projections`
4. Verify `npm run build` + `npm test`

### Task 3.3: Screen Helpers Service (Session C — `dal-service-screens`)

**Files to create:**
- `lib/services/screen-helpers.ts`

**Files to modify:**
- All files importing from `lib/helpers/screen-helpers.ts` (~4 files)

**Steps:**
1. Read `lib/helpers/screen-helpers.ts` — understand screen derivation logic
2. Create `lib/services/screen-helpers.ts` with async functions that call DAL:
   - `getScreensByJobId(jobId)` → calls `dal/screens.getScreensByJobId()`
   - `getActiveCustomerScreens(customerId)` → calls `deriveScreensFromJobs()`
   - `deriveScreensFromJobs(customerId)` → calls `getJobs()`
3. Update consumers to import from `@/lib/services/screen-helpers`
4. Verify `npm run build` + `npm test`

---

## Wave 4: Cleanup + Verification

**Serial, 1 session** | Depends on: Wave 3 | Slice: V5

### Task 4.1: Remove Unused Mock-Data Exports

**Files to modify:**
- `lib/mock-data.ts` — Add `@deprecated` JSDoc to entity array exports
- Remove any query functions from mock-data that are now handled by DAL (e.g., `getCustomerQuotes`)

### Task 4.2: Import Boundary Enforcement

**Steps:**
1. Add CI grep check: `mock-data` imports only allowed in `_providers/mock/` and `__tests__/` files
2. Verify: `grep -r "from.*mock-data" --include="*.ts" --include="*.tsx" | grep -v "_providers/mock" | grep -v "__tests__" | grep -v "node_modules"` returns zero results

### Task 4.3: Template and Documentation Updates

**Files to modify:**
- `.claude/skills/screen-builder/templates/` — Update templates to use DAL imports
- Verify CLAUDE.md rules are current

### Task 4.4: Final Verification

**Steps:**
1. `npm run build` — clean build
2. `npm test` — all tests pass (529 existing + new DAL tests)
3. `npm run lint` — clean
4. `npx tsc --noEmit` — no type errors
5. Manual grep: zero mock-data imports outside allowed locations
6. Start dev server, verify all 7 verticals render correctly

**Demo:** Full green build + test suite. Zero direct mock-data imports in app code. All pages render identically to pre-migration.

---

## Summary

| Wave | Sessions | Type | Slice | Key Deliverable |
|------|----------|------|-------|-----------------|
| 0 | 1 serial | Foundation | V1 | Shared types, provider router, security headers, CLAUDE.md rules |
| 1 | 1 serial | Providers + Pattern | V2 + V3a | 18 new DAL files + customer migration as reference |
| 2 | 4 parallel | Consumer Migration | V3b | All 46 import sites migrated to DAL |
| 3 | 3 parallel | Services | V4 | color-resolution, board-projections, screen-helpers |
| 4 | 1 serial | Cleanup | V5 | Import boundary enforcement, deprecation, verification |
| **Total** | **10 sessions** | | | |

**Estimated new files:** ~25 (9 DAL + 9 providers + 3 shared + 3 services + test files)
**Estimated modified files:** ~50 (46 consumers + next.config + CLAUDE.md + package.json + .env)
**Zero files deleted** — mock-data.ts stays as data source for providers
