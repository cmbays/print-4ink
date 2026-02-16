---
title: "Garment Catalog & Customer Screen Intelligence — Breadboard"
subtitle: "Mapped all places, affordances, wiring, component boundaries, and build order for the combined Garment Catalog + Customer Screens + Favorites + Cross-linking build"
date: 2026-02-14
phase: 1
pipeline: garments
pipelineType: vertical
products: [garments]
tools: []
stage: breadboarding
tags: [plan, decision]
sessionId: "3c426af7-3332-4681-bc90-9c5c4d58d74e"
branch: "session/0214-garment-breadboard"
status: complete
---

## Summary

Produced the breadboard document for the combined Garment Catalog build — the last major shaping artifact before implementation planning. This follows directly from the discovery session that dropped Screen Room as a standalone vertical and redefined it as customer-level screen intelligence.

**Output**: `docs/breadboards/garment-catalog-breadboard.md`

## What Was Mapped

### Places (5 new + 3 existing modified)

| ID | Place | Type |
|----|-------|------|
| P1 | Garment Catalog (`/garments`) | Page |
| P1.1 | Garment Detail Drawer | Drawer |
| P2 | Customer Detail — Screens Tab | Tab panel |
| P2.1 | Reclaim Screen Confirmation | Dialog |
| P3 | Customer Favorites (cross-context inline stars) | Cross-context |
| P4-P6 | Dashboard, Customer Jobs, Invoice Detail | Existing (cross-link updates) |

### Affordance Counts

- **~40 UI affordances** across catalog browsing, garment detail, customer screens, favorites, and cross-linking
- **23 code affordances** — all Phase 1 client-side (URL params, mock data filters, derived data, localStorage)
- **12 data stores** — URL state, React state, mock data, localStorage

### Component Boundaries

- **12 new components**: GarmentCatalogPage, Toolbar, Card, TableRow, DetailDrawer, GarmentImage (shared), FavoriteStar (shared), CustomerScreensTab, ScreenRecordRow, ReclaimScreenDialog, plus compact ColorSwatch variant
- **5 existing components modified**: CustomerTabs (add Screens tab), ColorSwatchPicker (compact mode), CustomerJobsTable (clickable links), Dashboard job rows, Invoice Detail linked job

### Build Order (20 steps)

1. Schema updates (garment `isEnabled`/`isFavorite`, customer favorites fields, simplified screen schema)
2. Lookup helpers (`getGarmentById`, `getColorById`)
3. Expand mock data (5 → 15+ garments)
4-6. Shared components (GarmentImage, FavoriteStar, ColorSwatch compact)
7-11. Garment Catalog page (toolbar → cards → table → drawer → orchestration)
12-14. Customer Screens tab (derived data → tab component → CustomerTabs update)
15-16. Customer favorites integration
17-19. Cross-linking (#65, #66, #68)
20. Fix Job Detail raw garment/color ID display

## Key Design Decisions

1. **Garment Detail as side drawer** (not page) — keeps browse context visible, Linear-style
2. **Favorites as inline stars** (not settings page) — "I'm touching this thing and working on it" pattern
3. **Screen records as derived data** — `deriveScreensFromJobs()` extracts screen info from completed jobs, no manual entry
4. **Page-level price toggle** — localStorage-based, first implementation of the settings pattern decided in discovery
5. **URL state for all filters** — category, search, brand, color family, view mode all in URL params (shareable, bookmarkable)

## Scope Coverage

All 20 CORE features from the discovery session mapped to specific affordances. Verified in the Scope Coverage table in the breadboard document.

## Phase 2 Extensions Identified

- Server-side search against supplier catalog
- Persist enable/disable and favorites to database
- Screen reuse prompt during quoting ("You've used this screen before — apply discount?")
- Auto-detect favorites from order history
- Live stock availability from supplier APIs

## Next Steps

1. **Implementation planning** — Sequence the 20 build steps into concrete implementation tasks with time estimates
2. **Schema work** — Customer favorites, garment `isEnabled`, lookup helpers, mock data expansion
3. **Build** — Execute per implementation plan
4. **Quality gate** — 10-category audit per standards

## Artifacts

| File | Description |
|------|-------------|
| `docs/breadboards/garment-catalog-breadboard.md` | Full breadboard with places, affordances, wiring, component boundaries, build order |

## Resume Command

```bash
claude --resume 3c426af7-3332-4681-bc90-9c5c4d58d74e
```
