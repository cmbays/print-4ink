# Garment Mockup Engine — Breadboard

> **Scope**: Horizontal capability across Quoting, Jobs, Kanban, Invoicing, Screen Room
> **Design doc**: `docs/plans/2026-02-14-garment-mockup-design.md`
> **Impl plan**: `docs/plans/2026-02-14-garment-mockup-impl-plan.md`
> **Phase**: 1 (SVG Composition) — no backend, mock data only

---

## Overview

The mockup engine is NOT a vertical — it's a reusable rendering component that integrates into existing Places. No new routes are created. The engine adds visual affordances (garment + artwork composites) to existing screens.

**Core rendering chain**: garmentCategory + colorHex + artworkPlacements[] → SVG composition with feColorMatrix tinting + multiply blend artwork overlay.

---

## Places

Mockups appear in existing Places — they don't create new ones. No new routes.

| ID | Place | Route | Mockup Size | Phase |
|----|-------|-------|-------------|-------|
| P1 | Quote Detail View | `/quotes/[id]` | sm (64-80px) per print location | 1 |
| P2 | Quote Creation (preview panel) | `/quotes/new` | md (280-320px) live preview | 1 |
| P3 | Job Detail Page | `/jobs/[id]` | md (280-320px) with front/back toggle | 1 |
| P4 | Kanban Board (Job Cards) | `/jobs/board` | xs (40-48px) thumbnail per card | 1 |
| P5 | Customer Approval Page | `/approval/[token]` | lg (400-600px) with zoom | 2 |
| P6 | Invoice Detail | `/invoices/[id]` | sm (64-80px) reference | 2 |
| P7 | Screen Room | `/screens` | sm (64-80px) artwork reference | 2 |
| P8 | Root Layout | `layout.tsx` | — (hosts MockupFilterProvider) | 1 |

---

## UI Affordances

### P1: Quote Detail View (`/quotes/[id]`)

**Current state**: `ArtworkPreview` renders a 48px flat color square with artwork thumbnail overlay per print location. Lives at `QuoteDetailView.tsx:199`.

| ID | Affordance | Control | Wires Out | Returns To |
|----|-----------|---------|-----------|------------|
| U1 | Garment mockup thumbnail (per print location) | — (display) | — | Replaces `ArtworkPreview`, shows garment silhouette + color + artwork |
| U2 | Mockup thumbnail click-to-expand | click | → open expanded mockup modal (Phase 2) | — |

**Data resolution per line item**:
- `item.garmentId` → `garmentCatalog.find()` → `baseCategory` (for template)
- `item.colorId` → `allColors.find()` → `hex` (for tinting)
- `item.printLocationDetails[].artworkId` → `artworkMap.get()` → `thumbnailUrl` (for overlay)
- `item.printLocationDetails[].location` → print zone position name

### P2: Quote Creation — Preview Panel (`/quotes/new`)

**Current state**: No live preview panel exists. User builds line items blind.

| ID | Affordance | Control | Wires Out | Returns To |
|----|-----------|---------|-----------|------------|
| U3 | Live mockup preview panel | — (display) | Reacts to form state changes | Shows current line item mockup |
| U4 | Print location segmented toggle | click | → N2 switchMockupView() | → U3 re-renders with selected view |
| U5 | Line item tab selector | click | → N3 selectLineItem() | → U3 shows selected line item mockup |

**Note**: This is the most interactive integration. The mockup updates live as the user changes garment, color, and print locations in the form. Phase 1 can defer this — it's the hardest to integrate correctly with the existing New Quote Form's React Hook Form state.

### P3: Job Detail Page (`/jobs/[id]`)

**Current state**: `JobDetailsSection` shows garment info as text (brand, style, color, sizes). No visual mockup. Lives at `JobDetailPage.tsx:336`.

| ID | Affordance | Control | Wires Out | Returns To |
|----|-----------|---------|-----------|------------|
| U6 | "What We're Printing" mockup card | — (display) | — | Shows garment with artwork overlays |
| U7 | Front/Back view toggle (segmented) | click | → N4 setActiveView() | → U6 re-renders with selected view |
| U8 | Artwork presence dot indicators (on tabs) | — (display) | — | Shows which views have artwork |

**Data resolution**:
- `job.garmentDetails[0].garmentId` → `garmentCatalog.find()` → `baseCategory`
- `job.garmentDetails[0].colorId` → `allColors.find()` → `hex`
- `job.printLocations[]` → position + colorCount (no artworkId on Job — need to resolve via `job.artworkIds` + source quote)
- `job.artworkIds` → `artworks.find()` → `thumbnailUrl`

**Gap identified**: Job's `printLocations[].position` maps to print zone, but Job schema has NO `artworkId` per location — only a flat `artworkIds[]` array. For Phase 1, we can assume artwork[0] goes to the first print location. For Phase 2, the Job schema should mirror Quote's `printLocationDetails[].artworkId` pattern.

### P4: Kanban Board — Job Cards (`/jobs/board`)

**Current state**: `JobBoardCard` shows text-only: customer name, title, quantity, progress bar, due date, risk dot. No visual. Lives at `JobBoardCard.tsx`.

| ID | Affordance | Control | Wires Out | Returns To |
|----|-----------|---------|-----------|------------|
| U9 | Mockup thumbnail (xs, 40-48px) | — (display) | — | Visual identifier on left side of card |

**Data resolution gap**: `JobCard` view model (`board-card.ts`) has NO garment category, color hex, or artwork data. Options:
1. **Extend `JobCard` schema** with `garmentCategory`, `garmentColorHex`, `primaryArtworkUrl` fields (view model projection)
2. **Resolve at render time** from full `Job` + mock data via `card.id`

Recommend option 1: extend the view model. Resolving at render time for 30+ cards is messy. The board page already projects jobs into cards — adding 3 more fields is trivial.

### P8: Root Layout (`layout.tsx`)

| ID | Affordance | Control | Wires Out | Returns To |
|----|-----------|---------|-----------|------------|
| U10 | MockupFilterProvider (hidden SVG defs) | — (invisible) | — | Provides shared feColorMatrix filters for all mockup instances |

**Approach options**:
- **Option A**: Global provider in `layout.tsx` with all known colors from mock data (simple, works for Phase 1)
- **Option B**: Per-page provider with only that page's garment colors (more precise, avoids unused filters)
- **Recommend B** for production but **A is fine for Phase 1** with mock data (finite color set).

Actually, looking at `layout.tsx` — it's a server component. `MockupFilterProvider` is a client component (`"use client"` + `useMemo`). We can't put it directly in the server layout. Options:
- Add it inside the `(dashboard)/layout.tsx` which may already be a client component, or
- Each page that uses mockups renders its own `MockupFilterProvider` locally (per-page approach)
- **Recommend per-page**: each integration page (QuoteDetail, JobDetail, Board) renders its own `MockupFilterProvider` with just its colors. Simpler, no layout changes, no wasted filters.

---

## Code Affordances

All Phase 1 — client-side only (mock data, React state, inline computation).

### Data Resolution (shared across all integration points)

| ID | Affordance | Trigger | Wires Out | Returns To | Phase |
|----|-----------|---------|-----------|------------|-------|
| N1 | resolveGarmentCategory(garmentId) | U1, U6, U9 render | → garmentCatalog.find() | → GarmentCategory string | 1 |
| N2 | resolveColorHex(colorId) | U1, U6, U9 render | → allColors.find() | → hex string | 1 |
| N3 | resolveArtworkUrl(artworkId) | U1, U6, U9 render | → artworkMap.get() | → thumbnailUrl string | 1 |
| N4 | hexToColorMatrix(hex) | MockupFilterProvider render | → pure math | → 20-value SVG matrix string | 1 |
| N5 | getZoneForPosition(category, view, position) | GarmentMockup render | → PRINT_ZONES lookup | → {x, y, width, height} percentages | 1 |

### Component-Specific Logic

| ID | Affordance | Trigger | Wires Out | Returns To | Phase |
|----|-----------|---------|-----------|------------|-------|
| N6 | setActiveView(view) | U7 click (front/back toggle) | → setState | → GarmentMockupCard re-render | 1 |
| N7 | viewHasArtwork(view) | GarmentMockupCard render | → check artworkPlacements against view's zones | → boolean (for dot indicator) | 1 |
| N8 | collectColors(lineItems/garmentDetails) | Page render | → iterate items, resolve colorIds | → string[] for MockupFilterProvider | 1 |
| N9 | buildArtworkPlacements(printLocationDetails, artworkMap) | U1, U6 render | → map locations to {artworkUrl, position} | → ArtworkPlacement[] | 1 |

### Phase 2 Code Affordances

| ID | Affordance | Trigger | Phase |
|----|-----------|---------|-------|
| N10 | exportMockupToPng(svgRef) | "Download" button | 2 |
| N11 | fetchSupplierImage(sku, colorId) | Template selection | 2 |
| N12 | saveMockupRender(entityType, entityId) | Quote send / Job creation | 2 |

---

## Data Stores

| ID | Store | Type | Read By | Written By | Phase |
|----|-------|------|---------|------------|-------|
| S1 | PRINT_ZONES constant | Static constant (imported) | N5, GarmentMockup | — (immutable) | 1 |
| S2 | garmentCatalog (mock data) | Import from mock-data.ts | N1 (resolveGarmentCategory) | — (Phase 1 read-only) | 1 |
| S3 | allColors (mock data) | Import from mock-data.ts | N2 (resolveColorHex), N8 (collectColors) | — (Phase 1 read-only) | 1 |
| S4 | artworks (mock data) | Import from mock-data.ts / prop | N3 (resolveArtworkUrl), N9 (buildArtworkPlacements) | — (Phase 1 read-only) | 1 |
| S5 | activeView (GarmentMockupCard) | React useState | U6 (re-render), N6 (view logic) | U7 click (setActiveView) | 1 |
| S6 | mockupTemplates (mock data) | Import from mock-data.ts | Template path resolution | — (Phase 1 read-only) | 1 |
| S7 | SVG filter defs (MockupFilterProvider) | DOM (hidden SVG) | GarmentMockup filter reference | MockupFilterProvider render | 1 |

---

## Wiring Verification

- [x] Every UI affordance (U1-U10) has at least one Wires Out or Returns To
- [x] Every code affordance (N1-N9) has a trigger
- [x] Every data store (S1-S7) has at least one reader and one writer (or is immutable)
- [x] Every "Wires Out" target exists in the tables
- [x] Every "Returns To" target exists in the tables
- [x] No orphan affordances
- [x] Every CORE feature from the design doc has corresponding affordances:
  - Color tinting → N4 (hexToColorMatrix) + S7 (filter defs)
  - Artwork overlay → N9 (buildArtworkPlacements) + GarmentMockup render
  - Print zone masking → N5 (getZoneForPosition) + S1 (PRINT_ZONES)
  - Front/back toggle → U7 + N6 + N7
  - Size variants → GarmentMockup size prop
  - Quote detail integration → U1, P1
  - Job detail integration → U6-U8, P3
  - Kanban integration → U9, P4

---

## Component Boundaries

| Component | Place(s) | Contains Affordances | Shared? | File Path |
|-----------|----------|---------------------|---------|-----------|
| **GarmentMockup** | P1, P2, P3, P4 | Core SVG render, N5, print zone clipping, blend mode | Yes — core engine | `components/features/mockup/GarmentMockup.tsx` |
| **GarmentMockupCard** | P3 | U6, U7, U8, N6, N7, S5 | Yes — reusable interactive wrapper | `components/features/mockup/GarmentMockupCard.tsx` |
| **GarmentMockupThumbnail** | P1, P4 | Memo wrapper around GarmentMockup (xs/sm) | Yes — performance wrapper | `components/features/mockup/GarmentMockupThumbnail.tsx` |
| **MockupFilterProvider** | P1, P3, P4 (per-page) | U10, N4, N8, S7 | Yes — per-page SVG defs | `components/features/mockup/MockupFilterProvider.tsx` |
| **hexToColorMatrix** | MockupFilterProvider | N4 | Yes — pure utility | `lib/helpers/color-matrix.ts` |
| **PRINT_ZONES + helpers** | GarmentMockup | N5, S1 | Yes — constants | `lib/constants/print-zones.ts` |
| **mockupViewEnum + schemas** | GarmentMockup, GarmentMockupCard | Type definitions | Yes — schemas | `lib/schemas/mockup-template.ts` |

### Existing Components Affected

| Component | Change | Why |
|-----------|--------|-----|
| `QuoteDetailView.tsx` | Replace `ArtworkPreview` with `GarmentMockupThumbnail` | U1 — upgrade from flat color square to garment silhouette |
| `JobBoardCard.tsx` | Add `GarmentMockupThumbnail` on left side | U9 — visual identifier on Kanban cards |
| `JobDetailPage.tsx` | Add `GarmentMockupCard` above task checklist | U6-U8 — "What We're Printing" section |
| `board-card.ts` (schema) | Extend `jobCardSchema` with `garmentCategory`, `garmentColorHex`, `primaryArtworkUrl` | Data needed for U9 without per-card resolution |
| `mock-data.ts` | Add `mockupTemplates` array + extend job card projections | S6 + view model data |

### Components NOT Changed

| Component | Reason |
|-----------|--------|
| `ArtworkPreview.tsx` | Keep for backward compatibility until all usages migrated |
| `layout.tsx` | No changes — MockupFilterProvider is per-page, not global |
| `QuoteActions.tsx` | No mockup interaction |
| `ArtworkGallery.tsx` | Separate concern — art management, not mockup rendering |

---

## Data Resolution Patterns

### Quote Detail (P1) — resolution chain

```
QuoteLineItem
  ├── garmentId → garmentCatalog.find(g => g.id === garmentId) → .baseCategory → garmentCategory
  ├── colorId → allColors.find(c => c.id === colorId) → .hex → colorHex
  └── printLocationDetails[]
       ├── .location → position (e.g., "Front Chest" → needs normalization to "front-chest")
       └── .artworkId → artworkMap.get(artworkId) → .thumbnailUrl → artworkUrl
```

**Gap**: `printLocationDetails[].location` is a freeform string (e.g., "Front Chest"), while `PrintZone.position` expects kebab-case (e.g., "front-chest"). Need a normalization mapping or update existing data to use consistent position IDs.

### Job Detail (P3) — resolution chain

```
Job
  ├── garmentDetails[0]
  │    ├── .garmentId → garmentCatalog.find() → .baseCategory → garmentCategory
  │    └── .colorId → allColors.find() → .hex → colorHex
  ├── printLocations[]
  │    └── .position → already kebab-case from jobPrintLocationSchema
  └── artworkIds[] → artworks.find() per ID → .thumbnailUrl
```

**Gap**: Job's `printLocations[]` has `position` and `colorCount` but NO `artworkId`. The flat `artworkIds[]` array on the job doesn't specify which artwork goes where. For Phase 1, assume first artwork maps to first location. The impl plan should address this.

### Kanban Card (P4) — resolution chain

```
JobCard (view model)
  └── Currently has: serviceType, quantity, locationCount, colorCount
  └── NEEDS: garmentCategory, garmentColorHex, primaryArtworkUrl
```

**Resolution**: Extend `jobCardSchema` with optional fields populated during mock data projection.

---

## Integration Gaps & Decisions

### Gap 1: Location string normalization

**Problem**: Quote `printLocationDetails[].location` stores human-readable strings like "Front Chest". Mockup engine expects kebab-case position IDs like "front-chest".

**Decision**: Add a `PRINT_POSITION_ALIASES` lookup in `print-zones.ts` that maps common variations:
```
"Front Chest" → "front-chest"
"Left Chest" → "left-chest"
"Full Back" → "full-back"
```
This also serves as normalization for any future user input.

### Gap 2: Job artwork-to-location mapping

**Problem**: `Job.artworkIds` is a flat array. `Job.printLocations[]` has no `artworkId` field.

**Decision for Phase 1**: Iterate `artworkIds` in order, map to `printLocations` in order (1:1). If more locations than artworks, remaining locations render without artwork. This handles the common case (1-2 artworks, 1-2 locations).

**Decision for Phase 2**: Add `artworkId` to `jobPrintLocationSchema` (mirrors quote's `printLocationDetailSchema`).

### Gap 3: JobCard view model enrichment

**Problem**: `JobCard` in `board-card.ts` has no garment/color/artwork fields.

**Decision**: Add 3 optional fields to `jobCardSchema`:
- `garmentCategory: garmentCategoryEnum.optional()`
- `garmentColorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()`
- `primaryArtworkUrl: z.string().optional()`

These are populated during mock data card projection. Cards without these fields render without mockup (graceful degradation).

### Gap 4: MockupFilterProvider placement

**Problem**: Root `layout.tsx` is a server component. MockupFilterProvider is `"use client"`.

**Decision**: Per-page rendering. Each page that shows mockups renders its own `MockupFilterProvider` with just its colors. This keeps the layout clean and avoids rendering filters for colors not on screen.

---

## Build Order

| # | Component/Task | Depends On | Blocks | Phase |
|---|---------------|------------|--------|-------|
| 1 | MockupTemplate + PrintZone schemas | — | 2, 5, 7 | 1 |
| 2 | Print zone constants + helpers | 1 | 7 | 1 |
| 3 | hexToColorMatrix utility | — | 6 | 1 |
| 4 | SVG garment templates (t-shirts front/back) | — | 5, 7 | 1 |
| 5 | Mock template data (mock-data.ts) | 1, 4 | 7 | 1 |
| 6 | MockupFilterProvider component | 3 | 7, 11, 12, 13 | 1 |
| 7 | **GarmentMockup** (core engine) | 1, 2, 3, 4, 5, 6 | 8, 9, 10 | 1 |
| 8 | GarmentMockupThumbnail (memo wrapper) | 7 | 11, 12 | 1 |
| 9 | GarmentMockupCard (interactive wrapper) | 7 | 13 | 1 |
| 10 | Barrel export (index.ts) | 7, 8, 9 | 11, 12, 13 | 1 |
| 11 | **Integration: QuoteDetailView** | 8, 10 | 14 | 1 |
| 12 | **Integration: Kanban Board** (extend JobCard + add thumbnail) | 8, 10 | 14 | 1 |
| 13 | **Integration: Job Detail Page** | 9, 10 | 14 | 1 |
| 14 | Validation pass (types, tests, build) | 11, 12, 13 | 15 | 1 |
| 15 | Push + PR | 14 | — | 1 |

Tasks 1-4 can run in parallel. Tasks 11-13 can run in parallel.

---

## Scope Coverage Check

| Design Doc Feature | Breadboard Coverage |
|--------------------|-------------------|
| SVG composition engine | U6, N4, N5, GarmentMockup component |
| feColorMatrix color tinting | N4 (hexToColorMatrix), U10 (MockupFilterProvider) |
| mix-blend-mode: multiply | GarmentMockup render (inline SVG style) |
| Pre-defined print zones | S1 (PRINT_ZONES), N5 (getZoneForPosition) |
| Size variants (xs/sm/md/lg) | GarmentMockup size prop, SIZE_CLASSES |
| Front/back view toggle | U7, N6, N7, S5 (GarmentMockupCard) |
| Dot indicators for artwork presence | U8, N7 (viewHasArtwork) |
| Quote detail integration | P1, U1 (replaces ArtworkPreview) |
| Quote creation live preview | P2, U3-U5 (Phase 1 can defer) |
| Job detail integration | P3, U6-U8 |
| Kanban board thumbnails | P4, U9 |
| Customer approval page | P5 (Phase 2) |
| Stable component interface | GarmentMockupProps stays same across maturity levels |
| Zero dependencies | All browser-native SVG/CSS, confirmed |

---

## Phase 1 Deferral Candidates

These are explicitly **not in Phase 1 scope** to keep the build focused:

| Feature | Why Defer | When |
|---------|-----------|------|
| Quote creation live preview (P2) | Complex RHF state integration, highest risk | Phase 1.5 or 2 |
| Customer approval page (P5) | New route, customer-facing auth | Phase 2 |
| Invoice/Screen Room mockups (P6, P7) | Low priority until core is proven | Phase 2 |
| SVG → PNG export | Needs canvas/Sharp, not needed for Phase 1 | Phase 2 |
| S&S Activewear API integration | Needs API key, dealer account | Phase 2 |
| Drag-to-nudge artwork positioning | Complex interaction, most jobs don't need it | Phase 2/3 |
| Additional garment templates (fleece, outerwear, etc.) | Start with t-shirts, add as needed | Phase 1.5 |
