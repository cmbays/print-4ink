# Auth Session Design — `verifySession()` for the DAL

**Issue**: #362
**Status**: Implemented (Phase 1 stub; Phase 2 migration path documented)
**Last updated**: 2026-02-17

---

## 1. The Problem

The current `middleware.ts` does a **binary cookie check** — it only verifies that the `demo-access` cookie is present, then trusts all requests downstream unconditionally. This is the exact pattern flagged by [CVE-2025-29927](https://nextjs.org/blog/security-nextjs-server-components-actions) as insufficient: middleware runs on the CDN edge and can be bypassed.

The fix is a `verifySession()` function that runs **inside the server trust boundary** (Server Components and Server Actions), decoupled from middleware.

---

## 2. Session Type

```ts
// lib/auth/session.ts
type UserRole = 'owner' | 'operator';

type Session = {
  userId: string;   // Phase 2: Supabase Auth UUID
  role: UserRole;   // Drives UI permissions and future DAL row filtering
  shopId: string;   // Phase 2: Used for RLS row filtering
};
```

**Design choices:**

| Choice | Rationale |
|--------|-----------|
| `userId` as string, not UUID type | Supabase returns UUID strings; stable across mock and real auth |
| `role: 'owner' \| 'operator'` | Screen Print Pro is a single-shop tool. `owner` = Gary (full access). `operator` = future employee (read + limited write). |
| `shopId` included | Multi-tenancy safety valve. Even if we never add a second shop, the field prevents queries from ever returning cross-shop data in Phase 2 RLS policies. |
| Returns `Session \| null` (not throw) | Callers distinguish "unauthenticated user" from "server error" cleanly. |

---

## 3. 4-Layer Defense-in-Depth

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1 — Middleware (edge)                                │
│  Runs on CDN. Redirects obviously unauthenticated requests  │
│  to /demo-login. NOT a security boundary (can be bypassed). │
│  Exists for UX, not security.                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 2 — verifySession() (server trust boundary)          │
│  Runs inside Server Components and Server Actions.          │
│  Cannot be bypassed — no client-side path to this code.     │
│  Returns Session | null. Callers redirect or 401 on null.   │
│  Wrapped in React cache() → at most 1 verification/render.  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 3 — DAL (AUTHENTICATED functions)                    │
│  Phase 2: DAL functions for authenticated domains call      │
│  verifySession() before returning data. Returns early if    │
│  session is null. This is the last application-level check. │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 4 — Row-Level Security (Supabase / PostgreSQL)       │
│  Phase 2: RLS policies enforce shopId isolation at the DB   │
│  level. Even if Layer 3 is bypassed by a bug, the DB        │
│  query only returns rows where shop_id = auth.uid().        │
└─────────────────────────────────────────────────────────────┘
```

**Phase 1 status:**
- Layer 1: ✅ Implemented (`middleware.ts`)
- Layer 2: ✅ Implemented (`lib/auth/session.ts` — Phase 1 stub)
- Layer 3: 📋 Classified (comments added to all DAL domain files; enforcement deferred to Phase 2)
- Layer 4: ⬜ Phase 2 (requires Supabase + schema)

---

## 4. DAL Function Classification

### PUBLIC — no `verifySession()` required

These domains contain reference/catalog data with no PII or financial content. In Phase 2, public functions may be safe to expose to unauthenticated customer-facing requests (e.g., a customer browsing garment options for a quote request).

| Domain | Functions | Rationale |
|--------|-----------|-----------|
| `dal/garments.ts` | `getGarmentCatalog`, `getGarmentById`, `getAvailableBrands` | Product catalog — no customer data |
| `dal/colors.ts` | `getColors`, `getColorById` | Reference data — no customer data |

> **Note:** `getGarmentCatalogMutable` and `getColorsMutable` are write-path helpers — classify as AUTHENTICATED when mutations are implemented.

### AUTHENTICATED — `verifySession()` required in Phase 2

| Domain | Sensitivity | Functions |
|--------|-------------|-----------|
| `dal/customers.ts` | PII (name, email, address, phone) | All |
| `dal/quotes.ts` | Financial (pricing, discounts) | All |
| `dal/invoices.ts` | Financial (payment records) | All |
| `dal/jobs.ts` | Operational + links to customer orders | All |
| `dal/screens.ts` | Operational (shop process data) | All |
| `dal/artworks.ts` | Intellectual property (artwork files) | All |
| `dal/settings.ts` | Configuration + pricing data | All |

---

## 5. Phase 2 Migration Plan

### Step 1 — Supabase Auth setup

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Set environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # server-only, never expose to client
```

### Step 2 — Replace `verifySession()` internals

In `lib/auth/session.ts`, replace the demo-access cookie block:

```ts
import { createServerClient } from '@supabase/ssr';

const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { getAll: () => cookieStore.getAll() } },
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return null;

const { data: member } = await supabase
  .from('shop_members')
  .select('role, shop_id')
  .eq('user_id', user.id)
  .single();

if (!member) return null;

return { userId: user.id, role: member.role, shopId: member.shop_id };
```

**Zero consumer changes** — `Session` shape is identical; all callers of `verifySession()` continue to work.

### Step 3 — Wire verifySession() into AUTHENTICATED DAL functions

```ts
// Example: lib/dal/_providers/supabase/customers.ts
import { verifySession } from '@/lib/auth/session';

export async function getCustomers(): Promise<Customer[]> {
  const session = await verifySession();
  if (!session) return [];  // or throw new DalError('UNAUTHORIZED', ...)

  // Supabase RLS filters by shopId automatically via auth.uid()
  const { data } = await supabase.from('customers').select('*');
  return data ?? [];
}
```

### Step 4 — Replace middleware.ts

Once real auth is wired, update `middleware.ts` to verify the Supabase session token rather than the demo-access cookie. The [Next.js Supabase docs](https://supabase.com/docs/guides/auth/server-side/nextjs) provide a reference implementation.

### Step 5 — Enable RLS policies

```sql
-- Example: customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_member_access" ON customers
  FOR ALL
  USING (shop_id = (
    SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
  ));
```

---

## 6. React `cache()` rationale

`verifySession()` is wrapped in React `cache()`:

```ts
export const verifySession = cache(async (): Promise<Session | null> => { ... });
```

Without `cache()`, a page that calls 7 DAL functions from authenticated domains would invoke `verifySession()` 7 times — 7 separate DB round-trips in Phase 2. With `cache()`, the first call fetches the session; subsequent calls within the same render pass return the memoized result instantly.

`cache()` scope is **per request** (React resets it between requests), so there is no cross-request data leakage.

---

## 7. Implementation Files

| File | Change |
|------|--------|
| `lib/auth/session.ts` | New — Session type, verifySession() stub, Phase 2 migration JSDoc |
| `lib/dal/garments.ts` | Classification comment: PUBLIC |
| `lib/dal/colors.ts` | Classification comment: PUBLIC |
| `lib/dal/customers.ts` | Classification comment: AUTHENTICATED |
| `lib/dal/quotes.ts` | Classification comment: AUTHENTICATED |
| `lib/dal/invoices.ts` | Classification comment: AUTHENTICATED |
| `lib/dal/jobs.ts` | Classification comment: AUTHENTICATED |
| `lib/dal/screens.ts` | Classification comment: AUTHENTICATED |
| `lib/dal/artworks.ts` | Classification comment: AUTHENTICATED |
| `lib/dal/settings.ts` | Classification comment: AUTHENTICATED |
