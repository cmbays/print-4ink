---
title: "Garments Vertical — Breadboard"
description: "UI affordances, code affordances, wiring, and component boundaries for the Garments vertical — consolidates catalog, mockup engine, customer intelligence, and interview-driven enhancements"
category: breadboard
status: draft
phase: 1
created: 2026-02-15
last-verified: 2026-02-15
depends-on:
  - knowledge-base/src/content/sessions/2026-02-14-screen-garment-discovery.md
  - knowledge-base/src/content/sessions/2026-02-15-garments-interview.md
  - docs/breadboards/garment-catalog-breadboard.md
  - docs/breadboards/mockup-engine-breadboard.md
  - docs/APP_FLOW.md
---

# Garments Vertical — Breadboard

**Purpose**: Consolidated breadboard for the full Garments vertical — catalog browsing, mockup engine integration, customer screen intelligence, customer favorites, and interview-driven enhancements (weight/fabric filters, customer-supplied garments).
**Input**: Discovery research (2026-02-14), requirements interview (2026-02-15), APP_FLOW, existing implementation
**Status**: Draft

**Relationship to prior breadboards**: This document supersedes `garment-catalog-breadboard.md` and references `mockup-engine-breadboard.md` (horizontal capability, not repeated here). The catalog breadboard was used for the initial build (PR #109). This breadboard adds interview findings and defines the remaining work.

---

## Build Status Legend

Throughout this document, affordances and components are tagged:

- **[BUILT]** — Implemented in PR #109 or prior work
- **[NEW]** — Not yet built, surfaced from the 2026-02-15 interview
- **[MOCKUP]** — Covered by `mockup-engine-breadboard.md` (separate build)
- **[POLISH]** — Exists but needs refinement before demo

---

## Places

| ID | Place | Type | Entry Point | Description | Status |
|----|-------|------|-------------|-------------|--------|
| P1 | Garment Catalog | Page | `/garments` (sidebar link) | Card grid / table view of all garments with category tabs, filters, search | [BUILT] |
| P1.1 | Garment Detail Drawer | Drawer | Click garment card/row in P1 | Side drawer: size/color matrix, specs, linked jobs, enable/disable, favorite | [BUILT] |
| P2 | Customer Detail — Screens Tab | Tab panel | "Screens" tab in `/customers/[id]` | Auto-populated screen records derived from completed jobs | [BUILT] |
| P2.1 | Reclaim Screen Confirmation | Dialog | "Reclaim" button in P2 | Confirmation before removing a screen record | [BUILT] |
| P3 | Customer Favorites | Inline affordances | Star icons across P1, P1.1, P2, customer pages | Inline garment/color favoriting per customer context | [BUILT] |
| P4 | Mockup Engine — Quote Detail | Integration | `/quotes/[id]` | Garment mockup thumbnails per print location | [MOCKUP] |
| P5 | Mockup Engine — Job Detail | Integration | `/jobs/[id]` | "What We're Printing" mockup card with front/back toggle | [MOCKUP] |
| P6 | Mockup Engine — Kanban Board | Integration | `/jobs/board` | Thumbnail mockups on job cards | [MOCKUP] |

**Cross-Linking Places** (existing pages, affordances added in garment catalog build):

| ID | Place | Type | New Affordance | Status |
|----|-------|------|----------------|--------|
| P7 | Dashboard | Page (existing) | Job rows clickable to `/jobs/[id]` | [BUILT] |
| P8 | Customer Detail — Jobs Tab | Tab (existing) | Job rows clickable to `/jobs/[id]` | [BUILT] |
| P9 | Invoice Detail | Page (existing) | Linked job display with clickable link | [BUILT] |

---

## UI Affordances

### P1 — Garment Catalog (`/garments`)

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U1 | Category Tabs (All, T-Shirts, Fleece, Outerwear, Pants, Headwear) | click | → N1 filterByCategory() | → P1 filtered grid | [BUILT] |
| U2 | Search Input (typeahead) | type | → N2 searchGarments() | → P1 filtered grid | [BUILT] |
| U3 | Brand Filter Dropdown | select | → N3 filterByBrand() | → P1 filtered grid | [BUILT] |
| U4 | Color Family Filter Dropdown | select | → N4 filterByColorFamily() | → P1 filtered grid | [BUILT] |
| U5 | Active Filter Pills (removable) | click | → N5 removeFilter() | → P1 updated filters | [BUILT] |
| U6 | Clear All Filters link | click | → N6 clearAllFilters() | → P1 unfiltered grid | [BUILT] |
| U7 | View Toggle (Grid / Table) | click | → N7 toggleView() | → P1 re-rendered in alternate view | [BUILT] |
| U8 | Garment Card (grid view) | click | → open P1.1 drawer | → P1.1 | [BUILT] |
| U9 | Garment Row (table view) | click | → open P1.1 drawer | → P1.1 | [BUILT] |
| U10 | Enable/Disable Toggle (table view) | toggle | → N8 toggleGarmentEnabled() | → card/row updates enabled state | [BUILT] |
| U11 | Favorite Star (on card/row) | click | → N9 toggleGlobalFavorite() | → star fills/unfills | [BUILT] |
| U12 | Show/Hide Wholesale Prices Toggle | toggle | → N10 togglePriceVisibility() | → cards/rows show/hide price | [BUILT] |
| U13 | Garment Image Thumbnail (on card) | — (display) | — | — | [BUILT] |
| U14 | Color Swatch Row (on card, compact) | — (display) | — | — | [BUILT] |
| U15 | Enabled/Disabled Badge (on card) | — (display) | — | — | [BUILT] |
| U16 | **Weight Filter Dropdown** | select | → N24 filterByWeight() | → P1 filtered grid | [NEW] |
| U17 | **Fabric Type Filter Dropdown** | select | → N25 filterByFabricType() | → P1 filtered grid | [NEW] |
| U18 | **Weight Badge (on card)** | — (display) | — | Shows garment weight (e.g., "5.3 oz") | [NEW] |
| U19 | **Fabric Type Badge (on card)** | — (display) | — | Shows fabric (e.g., "100% Cotton") | [NEW] |

### P1.1 — Garment Detail Drawer

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U20 | Close Drawer button (X) | click | → close P1.1 | → P1 | [BUILT] |
| U21 | Garment Hero Image | — (display) | — | — | [BUILT] |
| U22 | Brand / SKU / Name header | — (display) | — | — | [BUILT] |
| U23 | Category Badge | — (display) | — | — | [BUILT] |
| U24 | Base Price display | — (display) | — | shown/hidden per U12 setting | [BUILT] |
| U25 | Color Swatch Grid (full, interactive) | click swatch | → N11 selectColor() | → U26 highlights selected, U27 updates | [BUILT] |
| U26 | Selected Color Name + Hex display | — (display) | — | — | [BUILT] |
| U27 | Size/Price Matrix Table | — (display) | — | columns: size, price adjustment, final price | [BUILT] |
| U28 | Enable/Disable Toggle | toggle | → N8 toggleGarmentEnabled() | → toggle state + P1 card/row updates | [BUILT] |
| U29 | Favorite Star (global level) | click | → N9 toggleGlobalFavorite() | → star fills/unfills | [BUILT] |
| U30 | Favorite Star per Color | click | → N12 toggleColorFavorite() | → star fills/unfills on swatch | [BUILT] |
| U31 | Linked Jobs Table | — (display) | — | lists jobs using this garment | [BUILT] |
| U32 | Linked Job Row | click | → navigateTo(`/jobs/[id]`) | → Job Detail page | [BUILT] |
| U33 | Product Specs section (weight, fabric, origin) | — (display) | — | Phase 2: from supplier API | [BUILT] |
| U34 | **Weight display** | — (display) | — | Shows `weight` field (e.g., "5.3 oz") | [NEW] |
| U35 | **Fabric Type display** | — (display) | — | Shows `fabricType` field (e.g., "100% Ring-Spun Cotton") | [NEW] |

### P2 — Customer Detail — Screens Tab

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U40 | "Screens" Tab Trigger | click | → N13 switchToScreensTab() | → P2 panel visible | [BUILT] |
| U41 | Screen Count Badge (on tab) | — (display) | — | shows count of active screens | [BUILT] |
| U42 | Screen Record Row | — (display) | — | artwork name, colors, mesh count, date, linked job | [BUILT] |
| U43 | Linked Job Link (in screen row) | click | → navigateTo(`/jobs/[id]`) | → Job Detail page | [BUILT] |
| U44 | Artwork Name (in screen row) | — (display) | — | — | [BUILT] |
| U45 | Color Swatches (in screen row) | — (display) | — | ink colors used | [BUILT] |
| U46 | Mesh Count Badge | — (display) | — | — | [BUILT] |
| U47 | Date Created display | — (display) | — | — | [BUILT] |
| U48 | "Reclaim" Button (per screen row) | click | → open P2.1 confirmation | → P2.1 dialog | [BUILT] |
| U49 | Empty State ("No screens for this customer") | — (display) | — | — | [BUILT] |

### P2.1 — Reclaim Screen Confirmation

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U55 | Confirmation message | — (display) | — | — | [BUILT] |
| U56 | Screen details summary | — (display) | — | — | [BUILT] |
| U57 | "Reclaim" Confirm button | click | → N14 reclaimScreen() | → close P2.1, screen removed | [BUILT] |
| U58 | "Cancel" button | click | → close P2.1 | → P2 unchanged | [BUILT] |

### P3 — Customer Favorites (inline, cross-context)

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U60 | Favorite Star on garment (Customer Detail context) | click | → N15 toggleCustomerGarmentFavorite() | → star fills/unfills | [BUILT] |
| U61 | Favorite Star on color (Customer Detail context) | click | → N16 toggleCustomerColorFavorite() | → star fills/unfills | [BUILT] |
| U62 | Favorites Float indicator | — (display) | — | favorited items sort to top in selection lists | [BUILT] |

### P7 — Dashboard Cross-Links

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U70 | Clickable Job Row (Needs Attention) | click | → navigateTo(`/jobs/[id]`) | → Job Detail | [BUILT] |
| U71 | Clickable Job Row (In Progress) | click | → navigateTo(`/jobs/[id]`) | → Job Detail | [BUILT] |

### P8 — Customer Detail Jobs Tab Cross-Links

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U75 | Clickable Job Row | click | → navigateTo(`/jobs/[id]`) | → Job Detail | [BUILT] |

### P9 — Invoice Detail Cross-Links

| ID | Affordance | Control | Wires Out | Returns To | Status |
|----|------------|---------|-----------|------------|--------|
| U80 | Linked Job Display with Link | click | → navigateTo(`/jobs/[id]`) | → Job Detail | [BUILT] |

---

## Code Affordances

### Catalog Filtering & State (P1)

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To | Status |
|----|-------|------------|-------|---------|-----------|------------|--------|
| N1 | P1 | filterByCategory(category) | 1 | U1 tab click | → update S1 `?category=` | → P1 re-renders filtered | [BUILT] |
| N2 | P1 | searchGarments(query) | 1 | U2 type (debounced 300ms) | → update S2 `?q=` | → P1 re-renders filtered | [BUILT] |
| N3 | P1 | filterByBrand(brand) | 1 | U3 select | → update S3 `?brand=` | → P1 re-renders | [BUILT] |
| N4 | P1 | filterByColorFamily(family) | 1 | U4 select | → update S4 `?colorFamily=` | → P1 re-renders | [BUILT] |
| N5 | P1 | removeFilter(filterKey) | 1 | U5 pill click | → clear one of S1-S4 | → P1 re-renders | [BUILT] |
| N6 | P1 | clearAllFilters() | 1 | U6 click | → clear S1-S4 | → P1 full unfiltered grid | [BUILT] |
| N7 | P1 | toggleView(mode) | 1 | U7 click | → update S5 `?view=` | → P1 re-renders grid or table | [BUILT] |
| N24 | P1 | **filterByWeight(range)** | 1 | U16 select | → update S13 `?weight=` | → P1 re-renders filtered | [NEW] |
| N25 | P1 | **filterByFabricType(type)** | 1 | U17 select | → update S14 `?fabric=` | → P1 re-renders filtered | [NEW] |
| N26 | P1 | **getWeightRanges()** | 1 | P1 render | → read S8, compute weight buckets | → populates U16 options | [NEW] |
| N27 | P1 | **getFabricTypes()** | 1 | P1 render | → read S8, extract unique fabric types | → populates U17 options | [NEW] |

### Garment Data Operations

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To | Status |
|----|-------|------------|-------|---------|-----------|------------|--------|
| N8 | P1, P1.1 | toggleGarmentEnabled(garmentId) | 1 | U10, U28 toggle | → update garment in S8 | → enabled state toggles | [BUILT] |
| N9 | P1, P1.1 | toggleGlobalFavorite(garmentId) | 1 | U11, U29 click | → update garment in S8 | → star state toggles | [BUILT] |
| N10 | P1 | togglePriceVisibility() | 1 | U12 toggle | → update S6 localStorage | → prices show/hide | [BUILT] |
| N11 | P1.1 | selectColor(colorId) | 1 | U25 swatch click | → update S7 selected color | → U26, U27 update | [BUILT] |
| N12 | P1.1 | toggleColorFavorite(garmentId, colorId) | 1 | U30 click | → update S8 | → star toggles on swatch | [BUILT] |
| N17 | P1 | getFilteredGarments() | 1 | S1-S4 + S13-S14 change | → read S8, apply all filters | → returns filtered array | [BUILT] (extend for [NEW] filters) |
| N19 | P1.1 | getLinkedJobs(garmentId) | 1 | P1.1 render | → read S11, filter by garmentId | → linked jobs list | [BUILT] |
| N20 | P1 | getBrandsFromCatalog() | 1 | P1 render | → read S8, extract brands | → populates U3 | [BUILT] |
| N21 | P1 | getColorFamiliesFromCatalog() | 1 | P1 render | → read S8 + S12, extract families | → populates U4 | [BUILT] |
| N22 | P1 | getGarmentById(id) | 1 | any component | → read S8 by id | → single garment | [BUILT] |
| N23 | P1 | getColorById(id) | 1 | any component | → read S12 by id | → single color | [BUILT] |

### Customer Screen Intelligence (P2)

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To | Status |
|----|-------|------------|-------|---------|-----------|------------|--------|
| N13 | P2 | switchToScreensTab() | 1 | U40 click | — | → P2 tab content renders | [BUILT] |
| N14 | P2 | reclaimScreen(screenId) | 1 | U57 confirm | → remove screen from S9 | → P2 list updates | [BUILT] |
| N18 | P2 | deriveScreensFromJobs(customerId) | 1 | P2 render | → read S11, extract screen data | → screen records | [BUILT] |

### Customer Favorites (P3)

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To | Status |
|----|-------|------------|-------|---------|-----------|------------|--------|
| N15 | P3 | toggleCustomerGarmentFavorite(customerId, garmentId) | 1 | U60 click | → update S10 | → star toggles | [BUILT] |
| N16 | P3 | toggleCustomerColorFavorite(customerId, garmentId, colorId) | 1 | U61 click | → update S10 | → star toggles | [BUILT] |

### Customer-Supplied Garment Support [NEW]

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To | Status |
|----|-------|------------|-------|---------|-----------|------------|--------|
| N28 | Quote form | **toggleCustomerSupplied(lineItemIndex)** | 1.5 | Quote line item toggle | → update S15 customerSupplied flag | → pricing recalculates (skip garment cost) | [NEW] |
| N29 | Quote form | **calculateCustomerSuppliedTotal(lineItem)** | 1.5 | N28 toggle or qty change | → skip garment cost, keep decoration cost, add handling fee | → line total updates | [NEW] |
| N30 | Job detail | **displayCustomerSuppliedBadge(garmentDetails)** | 1.5 | Job detail render | → check customerSupplied flag | → show "Customer-Supplied" badge | [NEW] |

---

## Data Stores

| ID | Place | Store | Type | Read By | Written By | Status |
|----|-------|-------|------|---------|------------|--------|
| S1 | P1 | URL `?category=` | URL state | N1, N17 | N1 (tab click) | [BUILT] |
| S2 | P1 | URL `?q=` | URL state | N2, N17 | N2 (search input) | [BUILT] |
| S3 | P1 | URL `?brand=` | URL state | N3, N17 | N3 (brand select) | [BUILT] |
| S4 | P1 | URL `?colorFamily=` | URL state | N4, N17 | N4 (color family select) | [BUILT] |
| S5 | P1 | URL `?view=grid|table` | URL state | N7 | N7 (view toggle) | [BUILT] |
| S6 | P1 | `localStorage: garment-show-prices` | localStorage | N10, U24 | N10 (toggle) | [BUILT] |
| S7 | P1.1 | Selected color in drawer | React state | U26, U27 | N11 (swatch click) | [BUILT] |
| S8 | P1, P1.1 | Garment catalog array | Mock data (Phase 1) / DB (Phase 2) | N8, N9, N17, N19-N23, N26, N27 | N8, N9 | [BUILT] |
| S9 | P2 | Customer screen records (derived) | Mock data (Phase 1) | N14, U42-U47 | N14 (reclaim), N18 (derives) | [BUILT] |
| S10 | P2, P3 | Customer favorites (garments + colors) | Mock data (Phase 1) | N15, N16, U60-U62 | N15, N16 | [BUILT] |
| S11 | P2, P1.1 | Jobs array | Mock data (existing) | N18, N19 | — (read-only) | [BUILT] |
| S12 | P1, P1.1 | Colors array | Mock data (existing) | N21, N23, U25, U45 | — (read-only) | [BUILT] |
| S13 | P1 | **URL `?weight=`** | URL state | N24, N17 | N24 (weight select) | [NEW] |
| S14 | P1 | **URL `?fabric=`** | URL state | N25, N17 | N25 (fabric select) | [NEW] |
| S15 | Quote form | **customerSupplied flag per line item** | React state (RHF) | N28, N29 | N28 (toggle) | [NEW] |

---

## Wiring Verification

- [x] Every U has at least one Wires Out or Returns To (display-only affordances have "—" which is valid)
- [x] Every N has a trigger (from a U or another N or render lifecycle)
- [x] Every S has at least one reader and one writer (S11, S12 are read-only existing stores)
- [x] No dangling wire references — all N/S/U/P references exist in tables
- [x] Every CORE feature from scope definition has corresponding affordances (see Scope Coverage below)

---

## Component Boundaries

### Shared Components

| Component | Place(s) | Contains Affordances | Location | Status |
|-----------|----------|---------------------|----------|--------|
| GarmentImage | P1, P1.1, and cross-vertical | U13, U21 | `components/features/GarmentImage.tsx` | [BUILT] |
| FavoriteStar | P1, P1.1, P2, P3 | U11, U29, U30, U60, U61 | `components/features/FavoriteStar.tsx` | [BUILT] |
| ColorSwatchPicker | P1, P1.1 | U14, U25, U30 | `components/features/ColorSwatchPicker.tsx` | [BUILT] |

### Vertical-Specific Components

| Component | Place(s) | Contains Affordances | Location | Status |
|-----------|----------|---------------------|----------|--------|
| GarmentCatalogPage | P1 | U1-U19, layout orchestration | `app/(dashboard)/garments/page.tsx` | [BUILT] (extend for [NEW]) |
| GarmentCatalogToolbar | P1 | U1-U7, U12, U16, U17 | `app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx` | [BUILT] (extend for [NEW]) |
| GarmentCard | P1 | U8, U11, U13-U15, U18, U19 | `app/(dashboard)/garments/_components/GarmentCard.tsx` | [BUILT] (extend for [NEW]) |
| GarmentTableRow | P1 | U9, U10, U11 | `app/(dashboard)/garments/_components/GarmentTableRow.tsx` | [BUILT] |
| GarmentDetailDrawer | P1.1 | U20-U35 | `app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx` | [BUILT] (extend for [NEW]) |
| CustomerScreensTab | P2 | U40-U50 | `app/(dashboard)/customers/[id]/_components/CustomerScreensTab.tsx` | [BUILT] |
| ScreenRecordRow | P2 | U42-U48 | `app/(dashboard)/customers/[id]/_components/ScreenRecordRow.tsx` | [BUILT] |
| ReclaimScreenDialog | P2.1 | U55-U58 | `app/(dashboard)/customers/[id]/_components/ReclaimScreenDialog.tsx` | [BUILT] |

### Mockup Engine Components (separate breadboard)

| Component | Place(s) | Location | Status |
|-----------|----------|----------|--------|
| GarmentMockup | P4, P5, P6 | `components/features/mockup/GarmentMockup.tsx` | [MOCKUP] |
| GarmentMockupCard | P5 | `components/features/mockup/GarmentMockupCard.tsx` | [MOCKUP] |
| GarmentMockupThumbnail | P4, P6 | `components/features/mockup/GarmentMockupThumbnail.tsx` | [MOCKUP] |
| MockupFilterProvider | P4, P5, P6 (per-page) | `components/features/mockup/MockupFilterProvider.tsx` | [MOCKUP] |

> Full mockup engine affordances, wiring, and build order are in `docs/breadboards/mockup-engine-breadboard.md`. Not duplicated here.

---

## Schema Changes Required [NEW]

### 1. Garment Catalog Schema — Add `weight` and `fabricType`

**File**: `lib/schemas/garment.ts`
**Rationale**: Interview D1 — shop owner recommends garments primarily by fabric feel/weight. These must be first-class filter facets.

```typescript
// Add to garmentCatalogSchema
weight: z.number().positive().optional(), // oz per sq yd (e.g., 5.3)
fabricType: z.string().optional(), // e.g., "100% Ring-Spun Cotton", "50/50 Cotton-Poly"
```

**Mock data impact**: Extend all 15+ garment catalog entries with realistic weight/fabricType values. Reference S&S Activewear product data for accuracy.

### 2. Quote Line Item Schema — Add `customerSupplied` flag

**File**: `lib/schemas/quote.ts`
**Rationale**: Interview D2 — customer-supplied garments happen ~1x/month. When true: skip garment cost, still capture garment info for production, allow optional handling fee.

```typescript
// Add to quoteLineItemSchema
customerSupplied: z.boolean().default(false),
handlingFee: z.number().nonnegative().default(0), // flat fee when customer-supplied
```

**Pricing impact**: When `customerSupplied === true`, `unitPrice` excludes garment cost. `handlingFee` replaces garment material cost in the line total calculation. Uses `big.js` for all arithmetic per CLAUDE.md financial rules.

### 3. Weight Range Helper

**File**: `lib/helpers/garment-helpers.ts`
**Rationale**: Weight filter needs sensible buckets, not raw numbers. Buckets: "Lightweight (< 4 oz)", "Midweight (4-6 oz)", "Heavyweight (> 6 oz)".

```typescript
export const WEIGHT_RANGES = [
  { label: "Lightweight (< 4 oz)", min: 0, max: 4 },
  { label: "Midweight (4-6 oz)", min: 4, max: 6 },
  { label: "Heavyweight (> 6 oz)", min: 6, max: Infinity },
] as const;

export function getWeightRange(weight: number): string { ... }
```

---

## Build Order — Remaining Work [NEW]

This build order covers only the **new** work identified by the 2026-02-15 interview. All items from the original garment-catalog-breadboard build order are complete.

| # | Task | Depends On | Blocks | Est. Complexity | Parallelization |
|---|------|------------|--------|-----------------|-----------------|
| 1 | Schema: Add `weight`, `fabricType` to `garmentCatalogSchema` | Nothing | 2, 3, 4 | Low | -- |
| 2 | Mock data: Add `weight`, `fabricType` values to all garment catalog entries | #1 | 3, 4 | Low | Can run with #1 if schema change is trivial |
| 3 | Helper: `WEIGHT_RANGES` constant + `getWeightRange()` + `getFabricTypes()` | #1 | 4 | Low | Can run with #2 |
| 4 | UI: Add Weight + Fabric Type filter dropdowns to `GarmentCatalogToolbar` | #1, #2, #3 | 5 | Medium | -- |
| 5 | UI: Add weight/fabric badges to `GarmentCard` + display in `GarmentDetailDrawer` | #1, #2 | Nothing | Low | Can run with #4 |
| 6 | UI: Extend `getFilteredGarments()` to include weight + fabric filters | #1, #4 | Nothing | Low | Can run with #5 |
| 7 | Schema: Add `customerSupplied`, `handlingFee` to `quoteLineItemSchema` | Nothing | 8, 9 | Low | Can run with #1-6 |
| 8 | Mock data: Add 1-2 customer-supplied quote examples | #7 | 9 | Low | -- |
| 9 | UI: Customer-supplied toggle + handling fee in quote line item (Phase 1.5 — when quote form is next touched) | #7, #8 | Nothing | Medium | Deferred |
| 10 | Tests: Schema validation for new fields (`weight`, `fabricType`, `customerSupplied`, `handlingFee`) | #1, #7 | Nothing | Low | Can run with any |

### Parallelization Windows

```
Window A (schema + data): Tasks #1, #2, #3 can execute concurrently after schema is defined
Window B (UI filters):    Tasks #4, #5, #6 can execute concurrently after data is available
Window C (customer-supplied): Tasks #7, #8 are independent of Window A/B
Window D (tests):         Task #10 can run in parallel with any UI work
```

### Deferred Work

| Task | Why Deferred | When |
|------|-------------|------|
| Customer-supplied garment UI in quote form (#9) | Quote form is a separate vertical (quoting). Schema foundation can be laid now, UI integration happens when quote form is next modified. | Phase 1.5 or Quoting v2 |
| Mockup composition polish (D3) | Has its own breadboard (`mockup-engine-breadboard.md`) and implementation plan. Not part of this build. | Separate session |
| API auto-refresh (S&S + SanMar) | Phase 2 — requires real API keys and dealer account | Phase 2 |
| Screen reclamation dashboard | Phase 2 — needs real usage data to be useful | Phase 2 |
| Auto-detect favorites from order history | Phase 2 — needs real order volume | Phase 2 |

---

## Scope Coverage

Verify every feature from the interview requirements matrix is represented:

| Feature | Priority | Affordances | Covered? | Status |
|---------|----------|-------------|----------|--------|
| Garment images propagated everywhere | P0 | GarmentImage component, U13, U21 | Yes | [BUILT] |
| Fast search/filter/browse | P0 | U1-U7, N1-N7, N17 | Yes | [BUILT] |
| Customer favorites (garment + color) | P1 | U60-U62, N15-N16, S10 | Yes | [BUILT] |
| Mockup composition engine | P0 | See `mockup-engine-breadboard.md` | Yes | [MOCKUP] |
| Enable/disable scoping | P2 | U10, U28, N8 | Yes | [BUILT] |
| Weight/fabric type filters | P1 | U16-U19, N24-N27, S13-S14 | Yes | [NEW] |
| Customer-supplied garment flag | P2 | N28-N30, S15 (schema foundation) | Yes (schema) | [NEW] |
| Customer Screens tab | — | U40-U50, N13-N14, N18 | Yes | [BUILT] |
| Screen reclaim flow | — | U48, U55-U58, N14, P2.1 | Yes | [BUILT] |
| Cross-linking (Dashboard, Customer, Invoice) | — | U70-U80 | Yes | [BUILT] |
| Inline stars from any context | — | FavoriteStar component | Yes | [BUILT] |
| Page-level price visibility | — | U12, N10, S6 | Yes | [BUILT] |

---

## Phase 2 Extensions

Code affordances that will be added in Phase 2:

| ID | Place | Affordance | Replaces | Description |
|----|-------|------------|----------|-------------|
| N2-P2 | P1 | searchGarments() via API | N2 (client-side) | Server-side full-text search against supplier catalog |
| N8-P2 | P1, P1.1 | toggleGarmentEnabled() via API | N8 (mock data) | Persist enable/disable to database |
| N14-P2 | P2 | reclaimScreen() via API | N14 (mock data) | Persist reclaim to DB with audit trail |
| N15-P2 | P3 | toggleCustomerFavorite() via API | N15 (mock data) | Persist favorites to customer record in DB |
| N31 | P2 | screenReusePrompt() | — (new) | Detect screen reuse during quoting, suggest discount |
| N32 | P2 | autoDetectFavorites() | — (new) | "Ordered Gildan 5000 Black 3 times" → suggest favorite |
| N33 | P1 | fetchSupplierCatalog() | S8 mock data | Pull garment data from S&S Activewear / SanMar API |
| N34 | P1.1 | checkLiveStock(garmentId, colorId) | — (new) | Real-time stock availability from supplier warehouse |
| N35 | P1 | filterByWeight() via API | N24 (client-side) | Server-side weight range filtering |
| N36 | P1 | filterByFabricType() via API | N25 (client-side) | Server-side fabric type filtering |

---

## Related Documents

- `docs/breadboards/garment-catalog-breadboard.md` — Original catalog breadboard (superseded by this document for scope, still valid for original build reference)
- `docs/breadboards/mockup-engine-breadboard.md` — Mockup composition engine (separate horizontal capability)
- `knowledge-base/src/content/sessions/2026-02-14-screen-garment-discovery.md` — Research + scope decisions
- `knowledge-base/src/content/sessions/2026-02-15-garments-interview.md` — Requirements interview (source of [NEW] items)
- `docs/APP_FLOW.md` — Routes and navigation
- `CLAUDE.md` — Design system, quality checklist
- `docs/breadboards/quoting-breadboard.md` — Garment selection in quotes consumes favorites + customer-supplied flow
- `docs/breadboards/customer-management-breadboard.md` — Customer Detail page structure
