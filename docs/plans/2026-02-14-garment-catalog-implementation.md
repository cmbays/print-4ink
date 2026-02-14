# Garment Catalog & Customer Screen Intelligence — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Garment Catalog vertical with category browsing, detail drawer, enable/disable, favorites, plus Customer Screens tab (derived from jobs), customer favorites integration, and fix raw garment/color ID display on Job Detail.

**Architecture:** Phase 1 mock data UI. All state is client-side (React state, URL params, localStorage). Schemas extended with additive fields. Shared components (`GarmentImage`, `FavoriteStar`) built for cross-vertical reuse. Garment Catalog uses sheet (drawer) for detail view, URL state for filters.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui (Sheet, Tabs, Switch, Select, Badge, Input), Lucide React icons, Zod schemas, Vitest

**Breadboard:** `docs/breadboards/garment-catalog-breadboard.md` — the source of truth for all affordances and wiring.

---

## Pre-Build Notes

### Cross-Linking Already Complete

Issues #65, #66, #68 from the breadboard build order (steps 17-19) are **already implemented**:
- **#65 Dashboard job rows** — `app/(dashboard)/page.tsx:100-104,140-144` wraps job rows in `<Link href={/jobs/${id}}>`
- **#66 Customer Detail job rows** — `app/(dashboard)/customers/[id]/_components/CustomerJobsTable.tsx:54-59,84-85` already has clickable links
- **#68 Invoice Detail linked job** — `app/(dashboard)/invoices/_components/InvoiceDetailView.tsx:152-162` already shows linked job with clickable link

These tasks are omitted from this plan.

### Key File Locations

| Area | Path |
|------|------|
| Garment schema | `lib/schemas/garment.ts` |
| Customer schema | `lib/schemas/customer.ts` |
| Screen schema | `lib/schemas/screen.ts` |
| Color schema | `lib/schemas/color.ts` |
| Job schema | `lib/schemas/job.ts` |
| Mock data | `lib/mock-data.ts` |
| Garment tests | `lib/schemas/__tests__/garment.test.ts` |
| Customer tests | `lib/schemas/__tests__/customer.test.ts` |
| Screen tests | `lib/schemas/__tests__/screen.test.ts` |
| Mock data tests | `lib/schemas/__tests__/mock-data.test.ts` |
| Existing helpers | `lib/helpers/` (format.ts, money.ts, job-utils.ts, etc.) |
| Color swatch picker | `components/features/ColorSwatchPicker.tsx` |
| Customer tabs | `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx` |
| Customer detail page | `app/(dashboard)/customers/[id]/page.tsx` |
| Job detail page | `app/(dashboard)/jobs/[id]/page.tsx` |
| Job details section | `app/(dashboard)/jobs/_components/JobDetailsSection.tsx` |
| shadcn/ui components | `components/ui/` (sheet.tsx, tabs.tsx, switch.tsx, select.tsx, badge.tsx, input.tsx, etc.) |

### Raw ID Bug (Task 17)

`app/(dashboard)/jobs/_components/JobDetailsSection.tsx:41-44` currently renders:
```tsx
<p className="text-sm text-foreground">
  {gd.garmentId}         // shows "gc-002" instead of "Gildan Heavy Cotton Tee"
  <span className="ml-2 text-xs text-muted-foreground">
    {gd.colorId}         // shows "clr-black" instead of "Black"
  </span>
</p>
```

### Design System Reference

- **Cards**: `bg-elevated`, `border border-border`, `rounded-lg`
- **Text**: `text-foreground` (87% opacity), `text-muted-foreground` (60%)
- **Actions**: `text-action` (Niji blue #2ab9ff)
- **Status colors**: `text-success` (green), `text-warning` (gold), `text-error` (red)
- **Spacing**: 8px scale via Tailwind (p-2, p-3, p-4, gap-3, gap-4)
- **Responsive**: `md:` breakpoint (768px), `hidden md:block` / `md:hidden`
- **Touch targets**: 44px minimum on mobile

---

## Task 1: Schema Updates

Add `isEnabled` and `isFavorite` to garment catalog schema. Add `favoriteGarments` and `favoriteColors` to customer schema. Add `customerScreenSchema` for derived screen records.

**Files:**
- Modify: `lib/schemas/garment.ts`
- Modify: `lib/schemas/customer.ts`
- Create: `lib/schemas/customer-screen.ts`
- Test: `lib/schemas/__tests__/garment.test.ts`
- Test: `lib/schemas/__tests__/customer.test.ts`
- Test: `lib/schemas/__tests__/customer-screen.test.ts`

**Step 1: Write failing tests for new garment fields**

Add to `lib/schemas/__tests__/garment.test.ts`:

```typescript
// Inside "garmentCatalogSchema" describe block, add:

it("accepts isEnabled field", () => {
  const result = garmentCatalogSchema.parse({ ...validCatalog, isEnabled: true });
  expect(result.isEnabled).toBe(true);
});

it("defaults isEnabled to true", () => {
  const result = garmentCatalogSchema.parse(validCatalog);
  expect(result.isEnabled).toBe(true);
});

it("accepts isFavorite field", () => {
  const result = garmentCatalogSchema.parse({ ...validCatalog, isFavorite: true });
  expect(result.isFavorite).toBe(true);
});

it("defaults isFavorite to false", () => {
  const result = garmentCatalogSchema.parse(validCatalog);
  expect(result.isFavorite).toBe(false);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run lib/schemas/__tests__/garment.test.ts`
Expected: FAIL — `isEnabled` and `isFavorite` not in schema yet

**Step 3: Add isEnabled and isFavorite to garmentCatalogSchema**

In `lib/schemas/garment.ts`, add to `garmentCatalogSchema`:

```typescript
export const garmentCatalogSchema = z.object({
  id: z.string(),
  brand: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  baseCategory: garmentCategoryEnum,
  basePrice: z.number().nonnegative(),
  availableColors: z.array(z.string()),
  availableSizes: z.array(garmentSizeSchema),
  isEnabled: z.boolean().default(true),
  isFavorite: z.boolean().default(false),
});
```

**Step 4: Run garment tests to verify they pass**

Run: `npm test -- --run lib/schemas/__tests__/garment.test.ts`
Expected: PASS

**Step 5: Write failing tests for new customer fields**

Add to `lib/schemas/__tests__/customer.test.ts`:

```typescript
// Inside "customerSchema" describe block, add:

it("accepts favoriteGarments field", () => {
  const result = customerSchema.parse({
    ...validCustomer,
    favoriteGarments: ["gc-001", "gc-002"],
  });
  expect(result.favoriteGarments).toEqual(["gc-001", "gc-002"]);
});

it("defaults favoriteGarments to empty array", () => {
  const result = customerSchema.parse(validCustomer);
  expect(result.favoriteGarments).toEqual([]);
});

it("accepts favoriteColors field", () => {
  const result = customerSchema.parse({
    ...validCustomer,
    favoriteColors: { "gc-001": ["clr-black", "clr-white"] },
  });
  expect(result.favoriteColors).toEqual({ "gc-001": ["clr-black", "clr-white"] });
});

it("defaults favoriteColors to empty object", () => {
  const result = customerSchema.parse(validCustomer);
  expect(result.favoriteColors).toEqual({});
});
```

**Step 6: Run customer tests to verify they fail**

Run: `npm test -- --run lib/schemas/__tests__/customer.test.ts`
Expected: FAIL

**Step 7: Add favoriteGarments and favoriteColors to customerSchema**

In `lib/schemas/customer.ts`, add before the `// Metadata` comment:

```typescript
  // Garment favorites
  favoriteGarments: z.array(z.string()).default([]),
  favoriteColors: z.record(z.string(), z.array(z.string())).default({}),
```

**Step 8: Run customer tests to verify they pass**

Run: `npm test -- --run lib/schemas/__tests__/customer.test.ts`
Expected: PASS

**Step 9: Create customerScreenSchema**

Create `lib/schemas/customer-screen.ts`:

```typescript
import { z } from "zod";

export const customerScreenSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  jobId: z.string(),
  artworkName: z.string(),
  colorIds: z.array(z.string()),
  meshCount: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

export type CustomerScreen = z.infer<typeof customerScreenSchema>;
```

**Step 10: Write tests for customerScreenSchema**

Create `lib/schemas/__tests__/customer-screen.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { customerScreenSchema } from "../customer-screen";

describe("customerScreenSchema", () => {
  const valid = {
    id: "cs-001",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    jobId: "f1a00001-e5f6-4a01-8b01-0d1e2f3a4b01",
    artworkName: "River City Logo",
    colorIds: ["clr-black", "clr-white"],
    meshCount: 160,
    createdAt: "2026-01-15T10:00:00Z",
  };

  it("accepts a valid customer screen record", () => {
    expect(customerScreenSchema.parse(valid)).toEqual(valid);
  });

  it("rejects zero mesh count", () => {
    expect(() => customerScreenSchema.parse({ ...valid, meshCount: 0 })).toThrow();
  });

  it("rejects empty colorIds", () => {
    const result = customerScreenSchema.parse({ ...valid, colorIds: [] });
    expect(result.colorIds).toEqual([]);
  });

  it("rejects empty artworkName", () => {
    expect(() => customerScreenSchema.parse({ ...valid, artworkName: "" })).toThrow();
  });
});
```

**Step 11: Run customer-screen tests**

Run: `npm test -- --run lib/schemas/__tests__/customer-screen.test.ts`
Expected: PASS

**Step 12: Run all tests to confirm no regressions**

Run: `npm test -- --run`
Expected: All pass. Mock data tests may fail if they validate garment catalog entries against the new schema — fix by ensuring defaults apply.

**Step 13: Commit**

```bash
git add lib/schemas/garment.ts lib/schemas/customer.ts lib/schemas/customer-screen.ts lib/schemas/__tests__/garment.test.ts lib/schemas/__tests__/customer.test.ts lib/schemas/__tests__/customer-screen.test.ts
git commit -m "feat: add isEnabled/isFavorite to garment, favorites to customer, customer-screen schema"
```

---

## Task 2: Lookup Helpers

Create `getGarmentById()` and `getColorById()` helpers. These are used by Job Detail (fix raw IDs), garment cards, screen rows, and drawer.

**Files:**
- Create: `lib/helpers/garment-helpers.ts`
- Test: `lib/helpers/__tests__/garment-helpers.test.ts`

**Step 1: Write failing tests**

Create `lib/helpers/__tests__/garment-helpers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getGarmentById, getColorById } from "../garment-helpers";

describe("getGarmentById", () => {
  it("finds garment by ID", () => {
    const result = getGarmentById("gc-001");
    expect(result).not.toBeNull();
    expect(result?.brand).toBe("Bella+Canvas");
  });

  it("returns null for unknown ID", () => {
    expect(getGarmentById("gc-999")).toBeNull();
  });
});

describe("getColorById", () => {
  it("finds color by ID", () => {
    const result = getColorById("clr-black");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Black");
  });

  it("returns null for unknown ID", () => {
    expect(getColorById("clr-999")).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run lib/helpers/__tests__/garment-helpers.test.ts`
Expected: FAIL — module not found

**Step 3: Implement helpers**

Create `lib/helpers/garment-helpers.ts`:

```typescript
import { garmentCatalog, colors } from "@/lib/mock-data";
import type { GarmentCatalog } from "@/lib/schemas/garment";
import type { Color } from "@/lib/schemas/color";

export function getGarmentById(id: string): GarmentCatalog | null {
  return garmentCatalog.find((g) => g.id === id) ?? null;
}

export function getColorById(id: string): Color | null {
  return colors.find((c) => c.id === id) ?? null;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run lib/helpers/__tests__/garment-helpers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/helpers/garment-helpers.ts lib/helpers/__tests__/garment-helpers.test.ts
git commit -m "feat: add getGarmentById and getColorById lookup helpers"
```

---

## Task 3: Expand Mock Garment Data

Expand from 5 to 15+ garments across all categories (t-shirts, fleece, outerwear, pants, headwear).

**Files:**
- Modify: `lib/mock-data.ts`

**Step 1: Add 10+ new garment catalog entries**

Add entries after `gc-005` in the `garmentCatalog` array in `lib/mock-data.ts`. Cover all categories. Use realistic S&S/SanMar brands and SKUs. Some should have `isEnabled: false` and `isFavorite: true` to exercise the new fields. Include:

| ID | Brand | SKU | Name | Category |
|----|-------|-----|------|----------|
| gc-006 | Gildan | 5000B | Heavy Cotton Youth Tee | t-shirts |
| gc-007 | Bella+Canvas | 3501 | Unisex Jersey Long Sleeve Tee | t-shirts |
| gc-008 | Gildan | 18000 | Heavy Blend Crewneck Sweatshirt | fleece |
| gc-009 | Independent Trading Co. | SS4500 | Midweight Hooded Sweatshirt | fleece |
| gc-010 | Port Authority | J317 | Core Soft Shell Jacket | outerwear |
| gc-011 | Columbia | 1568 | Ascender Softshell Jacket | outerwear |
| gc-012 | Gildan | 18400 | Heavy Blend Open Bottom Sweatpants | pants |
| gc-013 | Champion | RW10 | Reverse Weave Jogger | pants |
| gc-014 | Yupoong | 6089 | Classic Snapback Cap | headwear |
| gc-015 | Richardson | 112 | Trucker Cap | headwear |
| gc-016 | Port & Company | PC61 | Essential Tee | t-shirts |
| gc-017 | Nike | NKBQ5233 | Dri-FIT Cotton/Poly Tee | t-shirts |

Set `gc-010` and `gc-011` to `isEnabled: false` (outerwear not currently offered). Set `gc-001` and `gc-002` to `isFavorite: true` (most popular). Give outerwear and fleece larger size price adjustments. Give headwear only S/M/L/XL or One Size.

**Step 2: Run all tests**

Run: `npm test -- --run`
Expected: PASS — mock data validation should pass with new schema defaults

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat: expand garment catalog from 5 to 17 garments across all categories"
```

---

## Task 4: GarmentImage Shared Component

Shared component that renders a garment placeholder image with brand/SKU text fallback. Phase 1 uses generated placeholders. Phase 2 will pull from supplier API.

**Files:**
- Create: `components/features/GarmentImage.tsx`

**Step 1: Build the component**

Create `components/features/GarmentImage.tsx`:

```tsx
"use client";

import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

interface GarmentImageProps {
  brand: string;
  sku: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-10 w-10",
  md: "h-20 w-20",
  lg: "h-40 w-40",
} as const;

const ICON_SIZES = { sm: 16, md: 32, lg: 48 } as const;

export function GarmentImage({
  brand,
  sku,
  name,
  size = "md",
  className,
}: GarmentImageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md bg-surface text-muted-foreground",
        SIZE_CLASSES[size],
        className,
      )}
      role="img"
      aria-label={`${brand} ${sku} — ${name}`}
    >
      <Shirt size={ICON_SIZES[size]} aria-hidden="true" />
      {size !== "sm" && (
        <span className="mt-1 text-center text-[10px] leading-tight">
          {sku}
        </span>
      )}
    </div>
  );
}
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/features/GarmentImage.tsx
git commit -m "feat: add GarmentImage shared component with size variants"
```

---

## Task 5: FavoriteStar Shared Component

Reusable inline star toggle. Used across catalog cards, drawer, customer context.

**Files:**
- Create: `components/features/FavoriteStar.tsx`

**Step 1: Build the component**

Create `components/features/FavoriteStar.tsx`:

```tsx
"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteStarProps {
  isFavorite: boolean;
  onToggle: () => void;
  label?: string;
  size?: number;
  className?: string;
}

export function FavoriteStar({
  isFavorite,
  onToggle,
  label = "favorite",
  size = 16,
  className,
}: FavoriteStarProps) {
  return (
    <button
      type="button"
      aria-label={isFavorite ? `Remove from ${label}` : `Add to ${label}`}
      aria-pressed={isFavorite}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-sm p-1 transition-colors",
        "hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-reduce:transition-none",
        isFavorite ? "text-warning" : "text-muted-foreground/40 hover:text-muted-foreground",
        className,
      )}
    >
      <Star
        size={size}
        className={cn(isFavorite && "fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/features/FavoriteStar.tsx
git commit -m "feat: add FavoriteStar shared component for inline favorite toggle"
```

---

## Task 6: ColorSwatchPicker Compact Variant

Add a `compact` mode to the existing `ColorSwatchPicker` that renders a simple row of small swatches without search, scroll area, or favorites section. Used in garment cards and screen record rows.

**Files:**
- Modify: `components/features/ColorSwatchPicker.tsx`

**Step 1: Add compact prop and compact rendering**

In `components/features/ColorSwatchPicker.tsx`:

1. Add `compact?: boolean` to `ColorSwatchPickerProps`
2. When `compact` is true, render a simple row of tiny swatches (no search, no ScrollArea, no favorites section, smaller swatches)
3. Limit display to first N colors with a "+X more" indicator

Add to the interface:
```typescript
interface ColorSwatchPickerProps {
  colors: Color[];
  selectedColorId?: string;
  onSelect: (colorId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (colorId: string) => void;
  compact?: boolean;
  maxCompactSwatches?: number;
}
```

Early return in the component when `compact` is true:
```tsx
if (compact) {
  const displayColors = colors.slice(0, maxCompactSwatches ?? 8);
  const remaining = colors.length - displayColors.length;
  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {displayColors.map((color) => (
          <Tooltip key={color.id}>
            <TooltipTrigger asChild>
              <div
                className="h-4 w-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {color.name}
            </TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <span className="ml-1 text-[10px] text-muted-foreground">
            +{remaining}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add components/features/ColorSwatchPicker.tsx
git commit -m "feat: add compact mode to ColorSwatchPicker for garment cards"
```

---

## Task 7: GarmentCatalogToolbar

Category tabs, search input, brand filter, color family filter, active filter pills, clear all, view toggle, price visibility toggle.

**Files:**
- Create: `app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx`

**Step 1: Build the toolbar component**

This is a `"use client"` component. It reads and writes URL search params for all filter state: `category`, `q`, `brand`, `colorFamily`, `view`. It also manages `localStorage` for `garment-show-prices`.

Props:
```typescript
interface GarmentCatalogToolbarProps {
  brands: string[];
  colorFamilies: string[];
  garmentCount: number;
}
```

The component uses:
- `useSearchParams()` and `useRouter()` from Next.js for URL state
- `Tabs` / `TabsList` / `TabsTrigger` from shadcn/ui for category tabs
- `Input` for search
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` for brand and color family dropdowns
- `Badge` for active filter pills (with X to remove)
- `Button` group for view toggle (grid/table icons)
- `Switch` for price visibility

Categories: `["all", "t-shirts", "fleece", "outerwear", "pants", "headwear"]`

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx
git commit -m "feat: add GarmentCatalogToolbar with filters, search, view toggle, price toggle"
```

---

## Task 8: GarmentCard

Grid view card showing garment image, brand, name, SKU, compact color swatches, enabled badge, favorite star, base price (conditional on price visibility).

**Files:**
- Create: `app/(dashboard)/garments/_components/GarmentCard.tsx`

**Step 1: Build the card component**

Props:
```typescript
interface GarmentCardProps {
  garment: GarmentCatalog;
  colors: Color[];
  showPrice: boolean;
  onToggleFavorite: (garmentId: string) => void;
  onClick: (garmentId: string) => void;
}
```

Uses: `GarmentImage` (size="md"), `ColorSwatchPicker` (compact mode), `FavoriteStar`, `Badge` for enabled/disabled state.

Card layout:
- Image top (full width)
- Brand + SKU line (muted)
- Name
- Compact color swatches
- Bottom row: price (if shown) + favorite star + enabled badge

The card is clickable (entire card opens the detail drawer).

Design: `bg-elevated border border-border rounded-lg p-3 hover:bg-surface transition-colors cursor-pointer`

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(dashboard)/garments/_components/GarmentCard.tsx
git commit -m "feat: add GarmentCard component for catalog grid view"
```

---

## Task 9: GarmentTableRow

Table view row showing brand, SKU, name, category, base price, enabled toggle, favorite star.

**Files:**
- Create: `app/(dashboard)/garments/_components/GarmentTableRow.tsx`

**Step 1: Build the table row component**

Props:
```typescript
interface GarmentTableRowProps {
  garment: GarmentCatalog;
  showPrice: boolean;
  onToggleEnabled: (garmentId: string) => void;
  onToggleFavorite: (garmentId: string) => void;
  onClick: (garmentId: string) => void;
}
```

Uses: `Switch` for enable/disable toggle, `FavoriteStar`, `Badge` for category. Row is clickable to open detail drawer.

Design: Standard table row with `hover:bg-muted/50 cursor-pointer transition-colors`.

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(dashboard)/garments/_components/GarmentTableRow.tsx
git commit -m "feat: add GarmentTableRow component for catalog table view"
```

---

## Task 10: GarmentDetailDrawer

Side drawer (using shadcn Sheet) showing full garment details: hero image, brand/SKU/name header, category badge, base price, interactive color swatch grid, selected color display, size/price matrix, enable/disable toggle, favorite star (global + per color), linked jobs table.

**Files:**
- Create: `app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx`

**Step 1: Build the drawer component**

Props:
```typescript
interface GarmentDetailDrawerProps {
  garment: GarmentCatalog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPrice: boolean;
  linkedJobs: Array<{ id: string; jobNumber: string; customerName: string }>;
  onToggleEnabled: (garmentId: string) => void;
  onToggleFavorite: (garmentId: string) => void;
  onToggleColorFavorite: (garmentId: string, colorId: string) => void;
}
```

Uses:
- `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` from shadcn/ui (opens from right, width ~480px)
- `GarmentImage` (size="lg") for hero
- `ColorSwatchPicker` (full mode with favorites) for color selection
- Local `useState` for selected color
- `Table` for size/price matrix
- `FavoriteStar` for global + per-color favorites
- `Switch` for enable/disable
- `Badge` for category
- Linked jobs as a simple list with `<Link>` to `/jobs/[id]`

Key interactions:
- Click swatch → select color → show color name + hex → update size/price matrix
- Size/price matrix: columns = [Size, Price Adjustment, Final Price]
- Final Price = basePrice + priceAdjustment (use `money()` helper from `lib/helpers/money.ts`)

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx
git commit -m "feat: add GarmentDetailDrawer with full details, color selection, price matrix"
```

---

## Task 11: GarmentCatalogPage Orchestration

The main `/garments` page that wires toolbar + grid/table view + drawer together. Handles all URL state, filtering, and mock data mutations.

**Files:**
- Create: `app/(dashboard)/garments/page.tsx`

**Step 1: Build the page**

This is a `"use client"` component. It:

1. Reads all URL params (`category`, `q`, `brand`, `colorFamily`, `view`)
2. Reads `localStorage` for `garment-show-prices` (default: `true`)
3. Filters `garmentCatalog` from mock data through `getFilteredGarments()`
4. Extracts unique brands and color families for filter dropdowns
5. Manages local state for garment catalog mutations (enable/disable, favorite toggle)
6. Manages selected garment ID for the drawer
7. Computes linked jobs for the selected garment via `getLinkedJobs()`
8. Renders `Topbar` with breadcrumbs, `GarmentCatalogToolbar`, grid or table of garments, `GarmentDetailDrawer`

Filter logic (`getFilteredGarments`):
- Category: match `baseCategory` (skip if "all")
- Search: case-insensitive match against `name`, `brand`, `sku`
- Brand: exact match
- Color family: check if garment has any color in that family (use `getColorById()` helper)

Grid: responsive CSS grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
Table: full-width table with columns

Import `Topbar` from `@/components/layout/topbar` for consistent page header.

**Step 2: Verify the page renders**

Run: `PORT=3001 npm run dev` and navigate to `http://localhost:3001/garments`
Expected: Garment catalog page with toolbar, grid of 15+ cards, working filters, drawer opens on card click

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/(dashboard)/garments/page.tsx
git commit -m "feat: add GarmentCatalogPage with toolbar, grid/table view, drawer, URL state filters"
```

---

## Task 12: Derived Screen Data Helper

Create `deriveScreensFromJobs()` that extracts screen records from completed jobs for a given customer.

**Files:**
- Create: `lib/helpers/screen-helpers.ts`
- Test: `lib/helpers/__tests__/screen-helpers.test.ts`

**Step 1: Write failing tests**

Create `lib/helpers/__tests__/screen-helpers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { deriveScreensFromJobs } from "../screen-helpers";
import { jobs } from "@/lib/mock-data";

describe("deriveScreensFromJobs", () => {
  it("returns screen records for a customer with completed jobs", () => {
    // Find a customer with at least one completed (done lane) job
    const doneJob = jobs.find((j) => j.lane === "done");
    if (!doneJob) return; // skip if no done jobs in mock data

    const screens = deriveScreensFromJobs(doneJob.customerId);
    expect(screens.length).toBeGreaterThan(0);
    expect(screens[0]).toHaveProperty("artworkName");
    expect(screens[0]).toHaveProperty("colorIds");
    expect(screens[0]).toHaveProperty("meshCount");
    expect(screens[0]).toHaveProperty("jobId");
  });

  it("returns empty array for customer with no jobs", () => {
    const screens = deriveScreensFromJobs("nonexistent-id");
    expect(screens).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run lib/helpers/__tests__/screen-helpers.test.ts`
Expected: FAIL

**Step 3: Implement the helper**

Create `lib/helpers/screen-helpers.ts`:

```typescript
import { jobs } from "@/lib/mock-data";
import type { CustomerScreen } from "@/lib/schemas/customer-screen";

export function deriveScreensFromJobs(customerId: string): CustomerScreen[] {
  const customerJobs = jobs.filter(
    (j) => j.customerId === customerId && j.lane === "done"
  );

  return customerJobs.flatMap((job) =>
    job.printLocations.map((loc, i) => ({
      id: `cs-${job.id}-${i}`,
      customerId,
      jobId: job.id,
      artworkName: `${job.title} — ${loc.position}`,
      colorIds: job.garmentDetails.map((gd) => gd.colorId),
      meshCount: loc.colorCount * 110, // rough estimate: 110 mesh per color
      createdAt: job.completedAt ?? job.createdAt,
    }))
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run lib/helpers/__tests__/screen-helpers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/helpers/screen-helpers.ts lib/helpers/__tests__/screen-helpers.test.ts
git commit -m "feat: add deriveScreensFromJobs helper for customer screen intelligence"
```

---

## Task 13: CustomerScreensTab + ScreenRecordRow + ReclaimScreenDialog

Tab panel showing derived screen records for a customer. Includes reclaim functionality.

**Files:**
- Create: `app/(dashboard)/customers/[id]/_components/CustomerScreensTab.tsx`
- Create: `app/(dashboard)/customers/[id]/_components/ScreenRecordRow.tsx`
- Create: `app/(dashboard)/customers/[id]/_components/ReclaimScreenDialog.tsx`

**Step 1: Build ScreenRecordRow**

A row displaying: artwork name, color swatches (compact), mesh count badge, date, linked job link, reclaim button.

```typescript
interface ScreenRecordRowProps {
  screen: CustomerScreen;
  onReclaim: (screenId: string) => void;
}
```

Uses: `ColorSwatchPicker` (compact), `Badge`, `Link` to `/jobs/[id]`, `Button` for reclaim. Import `getColorById` from helpers.

**Step 2: Build ReclaimScreenDialog**

Confirmation dialog before removing a screen. Shows screen summary (artwork, colors, mesh).

```typescript
interface ReclaimScreenDialogProps {
  screen: CustomerScreen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
```

Uses: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` from shadcn/ui. Two buttons: "Cancel" and "Reclaim" (destructive variant).

**Step 3: Build CustomerScreensTab**

Orchestrates the screen list. Calls `deriveScreensFromJobs()`, manages local state for reclaimed screens (filter out reclaimed IDs).

```typescript
interface CustomerScreensTabProps {
  customerId: string;
}
```

Shows:
- Empty state when no screens ("No screens for this customer")
- List of `ScreenRecordRow` components
- Manages reclaim dialog state

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add app/(dashboard)/customers/[id]/_components/CustomerScreensTab.tsx app/(dashboard)/customers/[id]/_components/ScreenRecordRow.tsx app/(dashboard)/customers/[id]/_components/ReclaimScreenDialog.tsx
git commit -m "feat: add CustomerScreensTab with screen records, reclaim dialog"
```

---

## Task 14: Update CustomerTabs to Include Screens Tab

Add "Screens" tab with count badge to the existing CustomerTabs component.

**Files:**
- Modify: `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx`

**Step 1: Add Screens tab**

In `CustomerTabs.tsx`:

1. Import `CustomerScreensTab`
2. Import `deriveScreensFromJobs` from helpers
3. Compute screen count: `const screens = deriveScreensFromJobs(customer.id)`
4. Add `TabsTrigger` for "screens" after "artwork" tab:
   ```tsx
   <TabsTrigger value="screens" className="px-2 text-xs sm:text-sm sm:px-3">
     Screens{screens.length > 0 && ` (${screens.length})`}
   </TabsTrigger>
   ```
5. Add `TabsContent` for screens:
   ```tsx
   <TabsContent value="screens" className="mt-4">
     <CustomerScreensTab customerId={customer.id} />
   </TabsContent>
   ```

**Step 2: Verify the tab renders**

Run dev server, navigate to a customer detail page. Verify "Screens" tab appears and shows derived screen records for customers with completed jobs.

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx
git commit -m "feat: add Screens tab to CustomerTabs with derived screen data"
```

---

## Task 15: Customer Favorites Mock Data

Populate `favoriteGarments` and `favoriteColors` on 2-3 existing customers in mock data.

**Files:**
- Modify: `lib/mock-data.ts`

**Step 1: Add favorites to customers**

In `lib/mock-data.ts`, add to existing customer objects:

- **River City Brewing** (repeat customer, uses gc-002 and gc-005):
  ```typescript
  favoriteGarments: ["gc-002", "gc-005"],
  favoriteColors: {
    "gc-002": ["clr-black", "clr-forest-green"],
    "gc-005": ["clr-black"],
  },
  ```

- **Lonestar Lacrosse** (contract, uses gc-001):
  ```typescript
  favoriteGarments: ["gc-001"],
  favoriteColors: {
    "gc-001": ["clr-royal", "clr-white"],
  },
  ```

- **TikTok Merch Co** (storefront, uses gc-004):
  ```typescript
  favoriteGarments: ["gc-004", "gc-001"],
  favoriteColors: {
    "gc-004": ["clr-red", "clr-white"],
  },
  ```

**Step 2: Run all tests**

Run: `npm test -- --run`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat: add customer favorites mock data for River City, Lonestar, TikTok Merch"
```

---

## Task 16: Customer Favorites Integration

Wire `FavoriteStar` into the garment catalog drawer for customer-context favoriting. For Phase 1, the global favorite toggle updates local state in the catalog page.

**Files:**
- Modify: `app/(dashboard)/garments/page.tsx` (ensure favorite toggles work)
- Modify: `app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx` (per-color stars)

**Step 1: Ensure global favorite toggle works in catalog page**

In `GarmentCatalogPage`, the `onToggleFavorite` handler should update the local garment catalog state by toggling `isFavorite` on the garment.

**Step 2: Ensure per-color favorite works in drawer**

In `GarmentDetailDrawer`, each color swatch in the interactive grid should have a small `FavoriteStar` overlay (visible on hover). The `onToggleColorFavorite` prop is called, and the parent page manages state.

For Phase 1, color favorites are cosmetic — they toggle a visual star but don't persist beyond page reload (same as all Phase 1 mock data mutations).

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add app/(dashboard)/garments/page.tsx app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx
git commit -m "feat: wire favorite star toggle for garments and per-color favorites"
```

---

## Task 17: Fix Job Detail Raw Garment/Color ID Display

Replace raw `garmentId` and `colorId` with resolved names using lookup helpers. Add `GarmentImage` thumbnail.

**Files:**
- Modify: `app/(dashboard)/jobs/_components/JobDetailsSection.tsx`

**Step 1: Import helpers and component**

Add imports:
```typescript
import { getGarmentById, getColorById } from "@/lib/helpers/garment-helpers";
import { GarmentImage } from "@/components/features/GarmentImage";
```

**Step 2: Replace raw IDs with resolved names**

In `JobDetailsSection.tsx`, replace lines 38-57 (the garment details map):

```tsx
{job.garmentDetails.map((gd) => {
  const garment = getGarmentById(gd.garmentId);
  const color = getColorById(gd.colorId);
  return (
    <div key={`${gd.garmentId}:${gd.colorId}`} className="flex items-start gap-3">
      {garment && (
        <GarmentImage brand={garment.brand} sku={garment.sku} name={garment.name} size="sm" />
      )}
      <div>
        <p className="text-sm text-foreground">
          {garment ? `${garment.brand} ${garment.sku}` : gd.garmentId}
          <span className="ml-2 text-xs text-muted-foreground">
            {color ? color.name : gd.colorId}
          </span>
          {color && (
            <span
              className="ml-1.5 inline-block h-3 w-3 rounded-sm align-middle"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
          )}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {Object.entries(gd.sizes).map(([size, count]) => (
            <span
              key={size}
              className="inline-flex items-center rounded bg-surface px-1.5 py-0.5 text-xs text-secondary-foreground"
            >
              {size}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
})}
```

Note: Keep the existing `<Shirt>` icon above this block, but remove it since `GarmentImage` replaces it. Move the `<Shirt>` icon logic into the garment detail map.

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Verify the fix**

Run dev server, navigate to any job detail page. The garment section should now show "Bella+Canvas 3001" + "Black" with a color swatch instead of "gc-001" + "clr-black".

**Step 5: Commit**

```bash
git add app/(dashboard)/jobs/_components/JobDetailsSection.tsx
git commit -m "fix: resolve raw garment/color IDs to names on Job Detail page"
```

---

## --- CHECKPOINT: Visual Review ---

At this point, all features should be functional. Run `PORT=3001 npm run dev` and verify:

1. `/garments` — Card grid with 15+ garments, category tabs filter correctly, search works, brand/color family filters work, view toggle switches between grid and table, price toggle shows/hides prices, drawer opens on card click
2. `/garments?view=table` — Table view with enable/disable toggles, favorite stars
3. Garment Detail Drawer — Full details, interactive color swatches, size/price matrix, linked jobs
4. `/customers/[id]` — "Screens" tab shows derived screen records for customers with completed jobs, reclaim works
5. `/jobs/[id]` — Garment section shows resolved names and images instead of raw IDs
6. All tests pass: `npm test -- --run`
7. Type check clean: `npx tsc --noEmit`
8. Build succeeds: `npm run build`

---

## Task 18: Final Build Verification & KB Session Doc

Run build, tests, and type check. Create KB session doc.

**Files:**
- Create: `knowledge-base/src/content/sessions/2026-02-14-garment-catalog-implementation-plan.md`

**Step 1: Run all verifications**

```bash
npm test -- --run
npx tsc --noEmit
npm run build
```

Expected: All pass

**Step 2: Create KB session doc**

Create `knowledge-base/src/content/sessions/2026-02-14-garment-catalog-implementation-plan.md`:

```yaml
---
title: "Garment Catalog & Screen Intelligence — Implementation Plan"
subtitle: "Sequenced 17-task plan from breadboard: schema, helpers, shared components, catalog page, customer screens, favorites, job detail fix"
date: 2026-02-14
phase: 1
vertical: garments
verticalSecondary: [screen-room, customer-management]
stage: implementation-planning
tags: [plan]
sessionId: "TBD"
branch: "session/0214-garment-breadboard"
status: complete
---
```

**Step 3: Commit everything**

```bash
git add knowledge-base/src/content/sessions/2026-02-14-garment-catalog-implementation-plan.md
git commit -m "docs: add garment catalog implementation plan KB session doc"
```

---

## Summary

| Task | What | Files | Depends On |
|------|------|-------|------------|
| 1 | Schema updates (garment isEnabled/isFavorite, customer favorites, customer-screen) | garment.ts, customer.ts, customer-screen.ts + tests | Nothing |
| 2 | Lookup helpers (getGarmentById, getColorById) | garment-helpers.ts + test | Task 1 |
| 3 | Expand mock garment data (5 → 17) | mock-data.ts | Task 1 |
| 4 | GarmentImage shared component | GarmentImage.tsx | Nothing |
| 5 | FavoriteStar shared component | FavoriteStar.tsx | Nothing |
| 6 | ColorSwatchPicker compact variant | ColorSwatchPicker.tsx | Nothing |
| 7 | GarmentCatalogToolbar | GarmentCatalogToolbar.tsx | Task 1, 3 |
| 8 | GarmentCard | GarmentCard.tsx | Task 4, 5, 6 |
| 9 | GarmentTableRow | GarmentTableRow.tsx | Task 5 |
| 10 | GarmentDetailDrawer | GarmentDetailDrawer.tsx | Task 2, 5, 6 |
| 11 | GarmentCatalogPage orchestration | garments/page.tsx | Task 7, 8, 9, 10 |
| 12 | deriveScreensFromJobs helper | screen-helpers.ts + test | Task 2 |
| 13 | CustomerScreensTab + ScreenRecordRow + ReclaimScreenDialog | 3 new components | Task 6, 12 |
| 14 | Update CustomerTabs (add Screens tab) | CustomerTabs.tsx | Task 13 |
| 15 | Customer favorites mock data | mock-data.ts | Task 1 |
| 16 | Customer favorites integration (stars in drawer) | page.tsx, GarmentDetailDrawer.tsx | Task 5, 15 |
| 17 | Fix Job Detail raw garment/color IDs | JobDetailsSection.tsx | Task 2, 4 |
| 18 | Final verification + KB doc | KB session doc | All above |

### Parallel Execution Opportunities

Tasks that can run in parallel (no shared dependencies):
- **Tasks 4, 5, 6** (shared components) — all independent
- **Tasks 7 + 12** (toolbar + screen helper) — independent after Task 1-3
- **Tasks 8, 9** (card + table row) — after shared components
- **Tasks 15 + 17** (favorites data + job detail fix) — independent after Task 1-2

### Cross-Linking Already Done

Issues #65, #66, #68 (breadboard steps 17-19) were already implemented:
- Dashboard job rows link to `/jobs/[id]` ✓
- Customer Detail job rows link to `/jobs/[id]` ✓
- Invoice Detail linked job displays with link ✓

---

## Related Documents

- `docs/breadboards/garment-catalog-breadboard.md` — Affordance map, wiring, build order
- `knowledge-base/src/content/sessions/2026-02-14-screen-garment-discovery.md` — Scope decisions
- `knowledge-base/src/content/sessions/2026-02-14-garment-catalog-breadboard.md` — Breadboarding session
- `CLAUDE.md` — Design system, quality checklist, coding standards
