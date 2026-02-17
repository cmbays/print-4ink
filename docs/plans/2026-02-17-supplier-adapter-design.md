# Supplier Adapter Layer Design

**Date**: 2026-02-17
**Issue**: #159 — Design SupplierAdapter interface + MockAdapter
**Status**: Approved (architect review 2026-02-17)
**Related**: #162 (SSActivewearAdapter), #160 (Route Handlers), #161 (Upstash Redis), #166 (S&S epic)

---

## Summary

Introduce `lib/suppliers/` as a dedicated layer for external garment catalog data from supplier APIs (S&S Activewear, SanMar, alphabroder). This layer sits *alongside* the existing `lib/dal/` — not inside it — because supplier catalog data and app-owned data have fundamentally different ownership, lifecycle, failure modes, and auth models.

**Issue #159 scope**: Types, interfaces, `MockAdapter`, `InMemoryCacheStore`, and registry. No real HTTP calls. All tests pass.

---

## Architecture

### Layer Separation Rationale

| Concern | `lib/dal/` | `lib/suppliers/` |
|---------|-----------|-----------------|
| **Ownership** | App-owned (your DB) | Externally governed (supplier APIs) |
| **Mutation** | Via Server Actions | Read-only, fetched + cached |
| **Failure mode** | Bug in your code | Network / API outage |
| **Auth** | Session verification (Phase 2) | API credentials server-side |

### Data Flow

```
S&S API (future)      SanMar (future)
      ↓                     ↓
SSActivewearAdapter   SanMarAdapter
      ↓                     ↓
      └──── SupplierAdapter interface ────┘
                       ↓
              CanonicalStyle[]
                       ↓
          lib/dal/garments.ts   ← ONLY file that imports from lib/suppliers/
                       ↓           maps CanonicalStyle → GarmentCatalog
          Page components (unchanged)
```

**Rule**: Only `lib/dal/garments.ts` imports from `lib/suppliers/`. Components never import from the supplier layer directly.

### File Structure

```
lib/suppliers/
  types.ts                 ← SupplierAdapter interface, CanonicalStyle schema, CacheStore interface
  registry.ts              ← getSupplierAdapter() factory + module-level singleton
  adapters/
    mock.ts                ← MockAdapter (wraps mock-data garments) — built in #159
    ss-activewear.ts       ← SSActivewearAdapter — built in #162, requires credentials
  cache/
    in-memory.ts           ← InMemoryCacheStore — Phase 1
    upstash.ts             ← UpstashCacheStore — Phase 2, #161
```

---

## Types (`lib/suppliers/types.ts`)

### CanonicalStyle Schema

The normalized product representation output by every adapter. All supplier-specific field names are mapped inside the adapter — downstream consumers see only this shape.

```typescript
import { z } from 'zod';

const canonicalImageTypeSchema = z.enum([
  'front', 'back', 'side',
  'on-model-front', 'on-model-back', 'on-model-side',
  'swatch', 'direct-side',
]);

const canonicalImageSchema = z.object({
  type: canonicalImageTypeSchema,
  url:  z.string().url(),
  size: z.enum(['small', 'medium', 'large']).optional(),
});

const canonicalColorSchema = z.object({
  name:   z.string().min(1),   // "Black", "Heather Navy"
  hex1:   z.string().nullable(),  // Primary hex — null if supplier doesn't provide
  hex2:   z.string().nullable(),  // Secondary hex for heather/blend colors
  images: z.array(canonicalImageSchema),
});

const canonicalSizeSchema = z.object({
  name:            z.string().min(1),  // "S", "M", "2XL"
  sortOrder:       z.number().int().nonnegative(),
  priceAdjustment: z.number().default(0),  // delta vs. piecePrice
});

/**
 * Raw supplier prices — NOT for arithmetic.
 * Use big.js (lib/helpers/money.ts) whenever these values are used in calculations.
 */
const canonicalPricingSchema = z.object({
  piecePrice:  z.number().nonnegative().nullable(),
  dozenPrice:  z.number().nonnegative().nullable(),
  casePrice:   z.number().nonnegative().nullable(),
});

export const supplierNameSchema = z.enum([
  'mock',
  'ss-activewear',
  'sanmar',
  'alphabroder',
]);

export const canonicalStyleSchema = z.object({
  supplierId:   z.string().min(1),        // Supplier's own ID (S&S styleId, etc.)
  styleNumber:  z.string().min(1),        // "3001", "18500"
  styleName:    z.string().min(1),        // "Unisex Jersey Short Sleeve Tee"
  brand:        z.string().min(1),        // "Bella+Canvas", "Gildan"
  description:  z.string().default(''),   // Product description text
  categories:   z.array(z.string()),      // Supplier's raw categories (not app enum)
  colors:       z.array(canonicalColorSchema),
  sizes:        z.array(canonicalSizeSchema),
  pricing:      canonicalPricingSchema,
  gtin:         z.string().nullable(),    // UPC barcode — universal cross-supplier key
  supplier:     supplierNameSchema,
  lastSynced:   z.date().optional(),      // When adapter last fetched this style
});

export type CanonicalStyle = z.infer<typeof canonicalStyleSchema>;
export type SupplierName = z.infer<typeof supplierNameSchema>;
```

**Design notes**:
- `categories` is `string[]` not an enum — each supplier has its own taxonomy. `dal/garments.ts` maps to the app's `garmentCategoryEnum`.
- `isEnabled` and `isFavorite` are absent — those are app-level preferences that belong in the database (Supabase, Phase 2), not in supplier data.
- `gtin` (UPC barcode) is the cross-supplier deduplication key. Enables detecting that Gildan 5000 from S&S and Gildan 5000 from SanMar are the same physical product.

### CacheStore Interface

```typescript
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;  // matches @upstash/redis API naming
}
```

Injected into adapters at construction time. Phase 1: `InMemoryCacheStore`. Phase 2 (#161): `UpstashCacheStore`.

### SupplierAdapter Interface

```typescript
export const catalogSearchParamsSchema = z.object({
  brand:    z.string().optional(),
  category: z.string().optional(),
  query:    z.string().optional(),
  limit:    z.number().int().positive().max(100).default(50),
  offset:   z.number().int().nonnegative().default(0),
});

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>;

export interface CatalogSearchResult {
  styles:  CanonicalStyle[];
  total:   number;
  hasMore: boolean;
}

export interface HealthStatus {
  healthy:    boolean;
  supplier:   string;
  checkedAt:  Date;
  latencyMs?: number;
  message?:   string;
}

export interface SupplierAdapter {
  readonly supplierName: string;

  getStyle(styleId: string): Promise<CanonicalStyle | null>;
  getStylesBatch(styleIds: string[]): Promise<CanonicalStyle[]>;  // batch — avoids N+1
  searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResult>;
  getInventory(skuIds: string[]): Promise<Record<string, number>>;  // skuId → qty
  getBrands(): Promise<string[]>;
  getCategories(): Promise<string[]>;
  healthCheck(): Promise<HealthStatus>;
}
```

**Note on `catalogSearchParams`**: Adapters must call `catalogSearchParamsSchema.parse(params)` at the top of `searchCatalog()` to apply defaults (`limit: 50`, `offset: 0`). This is a per-adapter contract.

---

## Registry (`lib/suppliers/registry.ts`)

Module-level singleton to ensure the same adapter + cache instance is reused within a long-lived process (local dev). On Vercel serverless, each cold start gets a fresh instance anyway.

```typescript
import { DalError } from '@/lib/dal/_shared/errors';

const VALID_ADAPTERS = ['mock', 'ss-activewear'] as const;
type AdapterName = (typeof VALID_ADAPTERS)[number];

let _adapter: SupplierAdapter | null = null;

export function getSupplierAdapter(): SupplierAdapter {
  if (_adapter) return _adapter;

  const name = process.env.SUPPLIER_ADAPTER;
  if (!name || !VALID_ADAPTERS.includes(name as AdapterName)) {
    throw new DalError(
      'PROVIDER',
      `SUPPLIER_ADAPTER must be one of [${VALID_ADAPTERS.join(', ')}], got: '${name}'`
    );
  }

  const cache = new InMemoryCacheStore();
  if (name === 'mock') {
    _adapter = new MockAdapter(cache);
    return _adapter;
  }

  throw new DalError('PROVIDER', `Adapter '${name}' not yet implemented`);
}

/** For testing only — resets the singleton so tests get a fresh adapter. */
export function _resetSupplierAdapter(): void {
  _adapter = null;
}
```

Reuses `DalError` from `lib/dal/_shared/errors` — consistent with `DATA_PROVIDER` fail-closed pattern.

---

## InMemoryCacheStore (`lib/suppliers/cache/in-memory.ts`)

```typescript
export class InMemoryCacheStore implements CacheStore {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}
```

Note: Expired entries are not proactively evicted — `get` returns `null` and the entry remains until overwritten. Acceptable memory trade-off for Phase 1 single-shop scale.

---

## MockAdapter (`lib/suppliers/adapters/mock.ts`)

Maps existing `GarmentCatalog` mock data into `CanonicalStyle` shape. Fields absent from mock data (`hex1`, `hex2`, images, pricing tiers) default to `null`/`[]`. The DAL's mapping layer handles the reverse projection.

**Key mapping decisions**:
- `supplierId` = `garment.id` (mock internal ID)
- `styleNumber` = `garment.sku`
- `categories` = `[garment.baseCategory]`
- `colors` = `garment.availableColors.map(id => ({ name: id, hex1: null, hex2: null, images: [] }))`
- `pricing.piecePrice` = `garment.basePrice`, dozen/case = `null`
- `gtin` = `null`
- `getStylesBatch` = `Promise.all(styleIds.map(id => this.getStyle(id)))` then filter nulls

Cache TTLs for MockAdapter (consistent with future real adapter TTLs):
- `searchCatalog` / `getBrands` / `getCategories`: 24h (static mock data never changes)
- `getInventory`: 5min (mirrors volatile S&S inventory TTL)

---

## Testing Strategy

Contract tests in `lib/suppliers/__tests__/`:

1. **`canonical-style.test.ts`** — Schema validation: valid inputs pass, invalid inputs reject
2. **`in-memory-cache.test.ts`** — TTL expiry, get/set/del, returns null after expiry
3. **`mock-adapter.test.ts`** — Implements full `SupplierAdapter` contract:
   - `getStyle` returns null for unknown ID
   - `getStyle` returns valid `CanonicalStyle` for known ID
   - `getStylesBatch` returns array, filters not-found
   - `searchCatalog` respects brand/category filters
   - `getBrands` returns sorted deduplicated list
   - `getCategories` returns list
   - `getInventory` returns record with qty per skuId
   - `healthCheck` returns `{ healthy: true }`
4. **`registry.test.ts`** — Throws on missing/invalid `SUPPLIER_ADAPTER`, returns singleton, `_resetSupplierAdapter` clears singleton

All 529 existing tests pass unchanged (zero behavior change to components or pages).

---

## CLAUDE.md Addition

```
- **Supplier layer boundary**: Only `lib/dal/garments.ts` imports from `lib/suppliers/`.
  Components and pages never import from the supplier layer directly.
```

---

## Env Vars

| Variable | Phase 1 Value | Phase 2 Value |
|----------|--------------|--------------|
| `SUPPLIER_ADAPTER` | `mock` | `ss-activewear` |

---

## Open for Later Issues

- `#162` — `SSActivewearAdapter` (requires S&S credentials + #160 Route Handlers + #161 Redis)
- `#161` — `UpstashCacheStore` implementation (replaces `InMemoryCacheStore` in registry)
- Future: `_resetSupplierAdapter` test helper → remove when proper DI container exists
