---
shaping: true
---

## A4.1 Spike: Brand Detail View Navigation

### Context

The interview decided supplier/brand color favorites live in the "garments section, brand/supplier view." This view doesn't exist — garments has no sub-routing, no brand detail page, and no brand schema. Brand is currently a denormalized string field on `garmentCatalogSchema`. We need to determine how a brand detail view integrates into the existing garments section.

### Goal

Identify the navigation pattern, entry points, and data model implications for a brand detail view in the garments section.

### Questions

| # | Question | Answer |
|---|----------|--------|
| **A4.1-Q1** | What routes exist under garments? Any sub-routing? | None. `app/(dashboard)/garments/` has only `page.tsx` and `_components/`. Garment detail uses a side drawer (`GarmentDetailDrawer`), not a route. |
| **A4.1-Q2** | How does the brand filter work? Can it navigate? | Stateless URL param filter (`?brand=Gildan`). Filters the catalog grid. No navigation to a brand view. |
| **A4.1-Q3** | Does the existing garment breadboard define brand-level places? | No. Breadboard defines P1 (catalog), P1.1 (garment detail drawer), P2 (customer screens), P3 (favorites). No brand places. |
| **A4.1-Q4** | Is there an existing brand/supplier schema? | No. Brand is a `z.string()` on `garmentCatalogSchema`. No entity, no ID, no dedicated schema. |
| **A4.1-Q5** | What precedent does Settings > Pricing set? | Pricing uses a template card hub with sub-routes (`/pricing/screen-print/[id]`). A Settings > Colors page would follow this pattern for global preferences, but brand preferences belong in garments per the interview decision. |

### Resolution

**Decision: Brand detail drawer in garments section (consistent with garment detail pattern).**

| Option | Description | Verdict |
|--------|-------------|---------|
| Brand detail **drawer** | Click brand name → drawer opens with brand info + color favorites. Consistent with garment detail drawer (P1.1). No new routes. | **Selected** |
| Brand detail **page** | New route `/garments/brands/[brand]`. More room but breaks the drawer-only pattern in garments. | Rejected — inconsistent |
| Settings > Brands | Move brand config to settings. Follows pricing pattern. | Rejected — contradicts interview ("go to the supplier tab") |
| Filter section header | When brand filter active, show brand settings inline above results. | Rejected — clutters catalog |

**Entry points** (how users reach the brand drawer):
1. Click brand name on any garment card
2. Click brand name in toolbar when brand filter is active
3. Future: dedicated "Brands" sub-tab in garments section

**Data model implications**:
- Phase 1 (mockup): Use existing `brand` string to group garments. Mock `BrandPreferences` with `{ brandName, favoriteColorIds[] }` array in mock data.
- Phase 2+ (backend): New `BrandSchema` with `id`, `name`, `logoUrl`, `favoriteColorIds[]`, `isActive`. Garment schema gains `brandId` foreign key.

**Flag resolved**: A4.1 is no longer ⚠️. Mechanism is understood — brand detail drawer accessed via brand name click, following the garment detail drawer pattern.
