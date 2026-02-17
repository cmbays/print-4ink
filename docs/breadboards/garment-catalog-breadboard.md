---
title: 'Garment Catalog & Customer Screen Intelligence — Breadboard'
description: 'UI affordances, code affordances, wiring, and component boundaries for the Garment Catalog vertical, Customer Screen Intelligence, Customer Favorites, and cross-vertical linking'
category: breadboard
status: draft
phase: 1
created: 2026-02-14
last-verified: 2026-02-14
depends-on:
  - knowledge-base/src/content/sessions/2026-02-14-screen-garment-discovery.md
  - docs/APP_FLOW.md
---

# Garment Catalog & Customer Screen Intelligence — Breadboard

**Purpose**: Map all UI affordances, code affordances, and wiring for the combined build: Garment Catalog page, Customer Screen Intelligence tab, Customer Favorites, cross-vertical linking, and user settings foundation.
**Input**: Discovery session (2026-02-14), APP_FLOW, existing schemas and components
**Status**: Draft

**Scope note**: Screen Room was dropped as a standalone vertical. Screen data becomes derived customer intelligence on the Customer Detail page. This breadboard covers the Garment Catalog as the primary new build, plus the Customer Screens tab, favorites system, and cross-linking polish.

---

## Places

| ID   | Place                               | Type      | Entry Point                                                                | Description                                                                                               |
| ---- | ----------------------------------- | --------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P1   | Garment Catalog                     | Page      | `/garments` (sidebar link)                                                 | Card grid / table view of all garments in the library with category tabs, filters, search                 |
| P1.1 | Garment Detail Drawer               | Drawer    | Click garment card/row in P1                                               | Side drawer showing full garment details: size/color matrix, specs, linked jobs, enable/disable, favorite |
| P2   | Customer Detail — Screens Tab       | Tab panel | "Screens" tab in existing Customer Detail (`/customers/[id]`)              | Auto-populated screen records derived from completed jobs for this customer                               |
| P2.1 | Reclaim Screen Confirmation         | Dialog    | "Reclaim" button on a screen row in P2                                     | Confirmation dialog before removing a screen record                                                       |
| P3   | Customer Detail — Favorites context | Tab panel | Existing tabs in Customer Detail (Quotes, Jobs, Artwork) + new Screens tab | Inline star icons on garments and colors wherever they appear in the customer context                     |

**Note on P3**: Favorites are not a Place themselves — they are inline affordances (star icons) that appear across multiple existing Places. The star is contextual: it shows on garment/color references in P1.1 (catalog drawer), P2 (screens tab), and wherever garments/colors surface in quotes, jobs, and customer pages. The "Favorites context" entry is listed to capture the wiring, not as a new navigable Place.

### Cross-Linking Places (existing pages, new affordances only)

| ID  | Place                      | Type            | New Affordance                                               |
| --- | -------------------------- | --------------- | ------------------------------------------------------------ |
| P4  | Dashboard                  | Page (existing) | Job rows become clickable links to `/jobs/[id]` (#65)        |
| P5  | Customer Detail — Jobs Tab | Tab (existing)  | Job rows become clickable links to `/jobs/[id]` (#66)        |
| P6  | Invoice Detail             | Page (existing) | Linked job display with clickable link to `/jobs/[id]` (#68) |

---

## UI Affordances

### P1 — Garment Catalog (`/garments`)

| ID  | Affordance                                                        | Control     | Wires Out                     | Returns To                               |
| --- | ----------------------------------------------------------------- | ----------- | ----------------------------- | ---------------------------------------- |
| U1  | Category Tabs (All, T-Shirts, Fleece, Outerwear, Pants, Headwear) | click       | → N1 filterByCategory()       | → P1 filtered garment grid               |
| U2  | Search Input (typeahead)                                          | type        | → N2 searchGarments()         | → P1 filtered garment grid               |
| U3  | Brand Filter Dropdown                                             | select      | → N3 filterByBrand()          | → P1 filtered garment grid               |
| U4  | Color Family Filter Dropdown                                      | select      | → N4 filterByColorFamily()    | → P1 filtered garment grid               |
| U5  | Active Filter Pills (removable)                                   | click       | → N5 removeFilter()           | → P1 updated filters                     |
| U6  | Clear All Filters link                                            | click       | → N6 clearAllFilters()        | → P1 unfiltered grid                     |
| U7  | View Toggle (Grid / Table)                                        | click       | → N7 toggleView()             | → P1 re-rendered in alternate view       |
| U8  | Garment Card (grid view)                                          | click       | → open P1.1 drawer            | → P1.1 Garment Detail Drawer             |
| U9  | Garment Row (table view)                                          | click       | → open P1.1 drawer            | → P1.1 Garment Detail Drawer             |
| U10 | Enable/Disable Toggle (table view)                                | toggle      | → N8 toggleGarmentEnabled()   | → garment card/row updates enabled state |
| U11 | Favorite Star (on card/row)                                       | click       | → N9 toggleGlobalFavorite()   | → star fills/unfills                     |
| U12 | Show/Hide Wholesale Prices Toggle (page-level setting)            | toggle      | → N10 togglePriceVisibility() | → cards/rows show/hide price column      |
| U13 | Garment Image Thumbnail (on card)                                 | — (display) | —                             | —                                        |
| U14 | Color Swatch Row (on card, compact)                               | — (display) | —                             | —                                        |
| U15 | Enabled/Disabled Badge (on card)                                  | — (display) | —                             | —                                        |

### P1.1 — Garment Detail Drawer

| ID  | Affordance                                     | Control      | Wires Out                   | Returns To                                             |
| --- | ---------------------------------------------- | ------------ | --------------------------- | ------------------------------------------------------ |
| U20 | Close Drawer button (X)                        | click        | → close P1.1                | → P1                                                   |
| U21 | Garment Hero Image                             | — (display)  | —                           | —                                                      |
| U22 | Brand / SKU / Name header                      | — (display)  | —                           | —                                                      |
| U23 | Category Badge                                 | — (display)  | —                           | —                                                      |
| U24 | Base Price display                             | — (display)  | —                           | shown/hidden per U12 setting                           |
| U25 | Color Swatch Grid (full, interactive)          | click swatch | → N11 selectColor()         | → U26 highlights selected, U27 updates                 |
| U26 | Selected Color Name + Hex display              | — (display)  | —                           | —                                                      |
| U27 | Size/Price Matrix Table                        | — (display)  | —                           | columns: size name, price adjustment, final price      |
| U28 | Enable/Disable Toggle                          | toggle       | → N8 toggleGarmentEnabled() | → toggle state + P1 card/row updates                   |
| U29 | Favorite Star (global level)                   | click        | → N9 toggleGlobalFavorite() | → star fills/unfills                                   |
| U30 | Favorite Star per Color                        | click        | → N12 toggleColorFavorite() | → star fills/unfills on swatch                         |
| U31 | Linked Jobs Table                              | — (display)  | —                           | lists jobs using this garment, with job # and customer |
| U32 | Linked Job Row                                 | click        | → navigateTo(`/jobs/[id]`)  | → Job Detail page                                      |
| U33 | Product Specs section (weight, fabric, origin) | — (display)  | —                           | Phase 2: from supplier API                             |

### P2 — Customer Detail — Screens Tab

| ID  | Affordance                                   | Control     | Wires Out                  | Returns To                                          |
| --- | -------------------------------------------- | ----------- | -------------------------- | --------------------------------------------------- |
| U40 | "Screens" Tab Trigger                        | click       | → N13 switchToScreensTab() | → P2 panel visible                                  |
| U41 | Screen Count Badge (on tab)                  | — (display) | —                          | shows count of active screens                       |
| U42 | Screen Record Row                            | — (display) | —                          | artwork name, colors, mesh count, date, linked job  |
| U43 | Linked Job Link (in screen row)              | click       | → navigateTo(`/jobs/[id]`) | → Job Detail page                                   |
| U44 | Artwork Name (in screen row)                 | — (display) | —                          | —                                                   |
| U45 | Color Swatches (in screen row)               | — (display) | —                          | ink colors used for this screen                     |
| U46 | Mesh Count Badge                             | — (display) | —                          | —                                                   |
| U47 | Date Created display                         | — (display) | —                          | —                                                   |
| U48 | "Reclaim" Button (per screen row)            | click       | → open P2.1 confirmation   | → P2.1 dialog                                       |
| U49 | Empty State ("No screens for this customer") | — (display) | —                          | shown when customer has no derived screens          |
| U50 | Screen Reuse Hint (Phase 2)                  | — (display) | —                          | "This screen was used X times" — future enhancement |

### P2.1 — Reclaim Screen Confirmation

| ID  | Affordance                                     | Control     | Wires Out             | Returns To                                |
| --- | ---------------------------------------------- | ----------- | --------------------- | ----------------------------------------- |
| U55 | Confirmation message ("Reclaim this screen?")  | — (display) | —                     | —                                         |
| U56 | Screen details summary (artwork, colors, mesh) | — (display) | —                     | —                                         |
| U57 | "Reclaim" Confirm button                       | click       | → N14 reclaimScreen() | → close P2.1, screen removed from P2 list |
| U58 | "Cancel" button                                | click       | → close P2.1          | → P2 unchanged                            |

### P3 — Customer Favorites (inline, cross-context)

| ID  | Affordance                                         | Control     | Wires Out                             | Returns To                                     |
| --- | -------------------------------------------------- | ----------- | ------------------------------------- | ---------------------------------------------- |
| U60 | Favorite Star on garment (Customer Detail context) | click       | → N15 toggleCustomerGarmentFavorite() | → star fills/unfills                           |
| U61 | Favorite Star on color (Customer Detail context)   | click       | → N16 toggleCustomerColorFavorite()   | → star fills/unfills                           |
| U62 | Favorites Float indicator                          | — (display) | —                                     | favorited items sort to top in selection lists |

### P4 — Dashboard Cross-Links (#65)

| ID  | Affordance                                  | Control | Wires Out                  | Returns To   |
| --- | ------------------------------------------- | ------- | -------------------------- | ------------ |
| U70 | Clickable Job Row (Needs Attention section) | click   | → navigateTo(`/jobs/[id]`) | → Job Detail |
| U71 | Clickable Job Row (In Progress section)     | click   | → navigateTo(`/jobs/[id]`) | → Job Detail |

### P5 — Customer Detail Jobs Tab Cross-Links (#66)

| ID  | Affordance        | Control | Wires Out                  | Returns To   |
| --- | ----------------- | ------- | -------------------------- | ------------ |
| U75 | Clickable Job Row | click   | → navigateTo(`/jobs/[id]`) | → Job Detail |

### P6 — Invoice Detail Cross-Links (#68)

| ID  | Affordance                   | Control | Wires Out                  | Returns To   |
| --- | ---------------------------- | ------- | -------------------------- | ------------ |
| U80 | Linked Job Display with Link | click   | → navigateTo(`/jobs/[id]`) | → Job Detail |

---

## Code Affordances

| ID  | Place    | Affordance                                                  | Phase | Trigger                   | Wires Out                                | Returns To                                   |
| --- | -------- | ----------------------------------------------------------- | ----- | ------------------------- | ---------------------------------------- | -------------------------------------------- |
| N1  | P1       | filterByCategory(category)                                  | 1     | U1 tab click              | → update S1 category param               | → P1 grid re-renders with filtered garments  |
| N2  | P1       | searchGarments(query)                                       | 1     | U2 type (debounced 300ms) | → update S2 search param                 | → P1 grid re-renders with matched garments   |
| N3  | P1       | filterByBrand(brand)                                        | 1     | U3 select                 | → update S3 brand param                  | → P1 grid re-renders                         |
| N4  | P1       | filterByColorFamily(family)                                 | 1     | U4 select                 | → update S4 color family param           | → P1 grid re-renders                         |
| N5  | P1       | removeFilter(filterKey)                                     | 1     | U5 pill click             | → clear one param from S1-S4             | → P1 grid re-renders                         |
| N6  | P1       | clearAllFilters()                                           | 1     | U6 click                  | → clear S1-S4                            | → P1 full unfiltered grid                    |
| N7  | P1       | toggleView(mode)                                            | 1     | U7 click                  | → update S5 view mode                    | → P1 re-renders in grid or table             |
| N8  | P1, P1.1 | toggleGarmentEnabled(garmentId)                             | 1     | U10, U28 toggle           | → update garment in S8                   | → garment enabled state toggles in UI        |
| N9  | P1, P1.1 | toggleGlobalFavorite(garmentId)                             | 1     | U11, U29 click            | → update garment in S8                   | → star state toggles                         |
| N10 | P1       | togglePriceVisibility()                                     | 1     | U12 toggle                | → update S6 localStorage                 | → prices show/hide across P1                 |
| N11 | P1.1     | selectColor(colorId)                                        | 1     | U25 swatch click          | → update S7 selected color               | → U26 name updates, U27 matrix highlights    |
| N12 | P1.1     | toggleColorFavorite(garmentId, colorId)                     | 1     | U30 click                 | → update garment-color favorite in S8    | → star toggles on swatch                     |
| N13 | P2       | switchToScreensTab()                                        | 1     | U40 click                 | —                                        | → P2 tab content renders                     |
| N14 | P2       | reclaimScreen(screenId)                                     | 1     | U57 confirm click         | → remove screen from S9                  | → P2 list updates, screen disappears         |
| N15 | P3       | toggleCustomerGarmentFavorite(customerId, garmentId)        | 1     | U60 click                 | → update S10 customer favorites          | → star toggles                               |
| N16 | P3       | toggleCustomerColorFavorite(customerId, garmentId, colorId) | 1     | U61 click                 | → update S10 customer favorites          | → star toggles                               |
| N17 | P1       | getFilteredGarments()                                       | 1     | S1-S4 change              | → read S8, apply S1-S4 filters           | → returns filtered garment array for display |
| N18 | P2       | deriveScreensFromJobs(customerId)                           | 1     | P2 render                 | → read S11 jobs, extract screen data     | → returns screen records for display         |
| N19 | P1       | getLinkedJobs(garmentId)                                    | 1     | P1.1 render               | → read S11 jobs, filter by garmentId     | → returns jobs using this garment            |
| N20 | P1       | getBrandsFromCatalog()                                      | 1     | P1 render                 | → read S8, extract unique brands         | → populates U3 brand filter options          |
| N21 | P1       | getColorFamiliesFromCatalog()                               | 1     | P1 render                 | → read S8 + S12 colors, extract families | → populates U4 color family filter options   |
| N22 | P1       | getGarmentById(id)                                          | 1     | any component             | → read S8 by id                          | → returns single garment (lookup helper)     |
| N23 | P1       | getColorById(id)                                            | 1     | any component             | → read S12 by id                         | → returns single color (lookup helper)       |

---

## Data Stores

| ID  | Place    | Store                                  | Type                               | Read By                    | Written By                                     |
| --- | -------- | -------------------------------------- | ---------------------------------- | -------------------------- | ---------------------------------------------- | ---------------- |
| S1  | P1       | URL `?category=` param                 | URL state                          | N1, N17                    | N1 (tab click)                                 |
| S2  | P1       | URL `?q=` param                        | URL state                          | N2, N17                    | N2 (search input)                              |
| S3  | P1       | URL `?brand=` param                    | URL state                          | N3, N17                    | N3 (brand select)                              |
| S4  | P1       | URL `?colorFamily=` param              | URL state                          | N4, N17                    | N4 (color family select)                       |
| S5  | P1       | URL `?view=grid                        | table` param                       | URL state                  | N7                                             | N7 (view toggle) |
| S6  | P1       | `localStorage: garment-show-prices`    | localStorage                       | N10, U24                   | N10 (toggle)                                   |
| S7  | P1.1     | Selected color in drawer               | React state                        | U26, U27                   | N11 (swatch click)                             |
| S8  | P1, P1.1 | Garment catalog array                  | Mock data (Phase 1) / DB (Phase 2) | N8, N9, N17, N19, N20, N22 | N8 (enable/disable), N9 (favorite)             |
| S9  | P2       | Customer screen records (derived)      | Mock data (Phase 1) / DB (Phase 2) | N14, U42-U47               | N14 (reclaim removes), N18 (derives from jobs) |
| S10 | P2, P3   | Customer favorites (garments + colors) | Mock data (Phase 1) / DB (Phase 2) | N15, N16, U60-U62          | N15, N16 (toggle)                              |
| S11 | P2, P1.1 | Jobs array                             | Mock data (existing)               | N18, N19                   | — (read-only in this vertical)                 |
| S12 | P1, P1.1 | Colors array                           | Mock data (existing)               | N21, N23, U25, U45         | — (read-only)                                  |

---

## Wiring Verification

- [x] Every U has at least one Wires Out or Returns To (display-only affordances have "—" which is valid — they receive data, not interaction wiring)
- [x] Every N has a trigger (from a U or another N or render lifecycle)
- [x] Every S has at least one reader and one writer (S11, S12 are read-only existing stores — valid)
- [x] No dangling wire references — all N/S/U/P references exist in tables
- [x] Every CORE feature from scope definition has corresponding affordances (verified in Scope Coverage below)

---

## Component Boundaries

| Component             | Place(s)         | Contains Affordances         | Location                                                                 | Shared?                                                                                      |
| --------------------- | ---------------- | ---------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| GarmentCatalogPage    | P1               | U1-U15, layout orchestration | `app/(dashboard)/garments/page.tsx`                                      | No                                                                                           |
| GarmentCatalogToolbar | P1               | U1-U7, U12                   | `app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx`         | No                                                                                           |
| GarmentCard           | P1               | U8, U11, U13-U15             | `app/(dashboard)/garments/_components/GarmentCard.tsx`                   | No                                                                                           |
| GarmentTableRow       | P1               | U9, U10, U11                 | `app/(dashboard)/garments/_components/GarmentTableRow.tsx`               | No                                                                                           |
| GarmentDetailDrawer   | P1.1             | U20-U33                      | `app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx`           | No                                                                                           |
| GarmentImage          | P1, P1.1, P5     | U13, U21                     | `components/features/GarmentImage.tsx`                                   | Yes — renders garment image with fallback, used across catalog, quotes, jobs, customer pages |
| ColorSwatchRow        | P1, P1.1         | U14, U25, U30                | Extends existing `components/features/ColorSwatchPicker.tsx`             | Yes — already exists, add compact variant + favorite star                                    |
| FavoriteStar          | P1, P1.1, P2, P3 | U11, U29, U30, U60, U61      | `components/features/FavoriteStar.tsx`                                   | Yes — inline star toggle reusable across all contexts                                        |
| CustomerScreensTab    | P2               | U40-U50                      | `app/(dashboard)/customers/[id]/_components/CustomerScreensTab.tsx`      | No                                                                                           |
| ScreenRecordRow       | P2               | U42-U48                      | `app/(dashboard)/customers/[id]/_components/ScreenRecordRow.tsx`         | No                                                                                           |
| ReclaimScreenDialog   | P2.1             | U55-U58                      | `app/(dashboard)/customers/[id]/_components/ReclaimScreenDialog.tsx`     | No                                                                                           |
| CustomerTabs (update) | P2, P3           | U40 (add Screens tab)        | `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx` (existing) | No — add tab, pass screen data                                                               |

### Existing Components Modified

| Component                 | Change                                         | Why                                    |
| ------------------------- | ---------------------------------------------- | -------------------------------------- |
| `CustomerTabs.tsx`        | Add "Screens" tab trigger + content            | New screen intelligence tab            |
| `ColorSwatchPicker.tsx`   | Add compact mode + optional favorite star prop | Reuse in garment cards and screen rows |
| `CustomerJobsTable.tsx`   | Make job rows clickable links (#66)            | Cross-linking requirement              |
| Dashboard job rows        | Wrap in `<Link>` to `/jobs/[id]` (#65)         | Cross-linking requirement              |
| Invoice Detail linked job | Add clickable link to `/jobs/[id]` (#68)       | Cross-linking requirement              |

---

## Build Order

| #   | Component/Screen                                                                                                                                                           | Depends On                                                         | Blocks                                            | Est. Complexity |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- | --------------- |
| 1   | Schema updates: `garmentCatalogSchema` add `isEnabled`, `isFavorite`; `customerSchema` add `favoriteGarments`, `favoriteColors`; simplify `screenSchema` to derived record | Nothing                                                            | Everything below                                  | Low             |
| 2   | Lookup helpers: `getGarmentById()`, `getColorById()` in `lib/helpers/`                                                                                                     | Schema updates (#1)                                                | Garment cards, screen rows, job detail fix        | Low             |
| 3   | Expand mock garment data (5 → 15+ garments across all categories with images)                                                                                              | Schema updates (#1)                                                | Garment Catalog page                              | Medium          |
| 4   | `GarmentImage` shared component                                                                                                                                            | Nothing                                                            | Garment cards, drawer, cross-vertical propagation | Low             |
| 5   | `FavoriteStar` shared component                                                                                                                                            | Nothing                                                            | Garment cards, drawer, customer favorites         | Low             |
| 6   | `ColorSwatchPicker` compact variant + favorite star integration                                                                                                            | `FavoriteStar` (#5)                                                | Garment cards, drawer, screen rows                | Low             |
| 7   | `GarmentCatalogToolbar` (category tabs, search, filters, view toggle, price toggle)                                                                                        | Schema (#1), mock data (#3)                                        | Garment Catalog page                              | Medium          |
| 8   | `GarmentCard` (grid view card with image, swatches, enable badge, favorite star)                                                                                           | `GarmentImage` (#4), `ColorSwatchRow` (#6), `FavoriteStar` (#5)    | Garment Catalog page                              | Medium          |
| 9   | `GarmentTableRow` (table view row with enable toggle)                                                                                                                      | `FavoriteStar` (#5)                                                | Garment Catalog page                              | Low             |
| 10  | `GarmentDetailDrawer` (side drawer with full details)                                                                                                                      | `ColorSwatchPicker` (#6), `FavoriteStar` (#5), lookup helpers (#2) | Garment Catalog page                              | High            |
| 11  | `GarmentCatalogPage` (orchestration: toolbar + grid/table + drawer)                                                                                                        | Toolbar (#7), Card (#8), Row (#9), Drawer (#10)                    | Nothing                                           | Medium          |
| 12  | Derived screen data mock + `deriveScreensFromJobs()` helper                                                                                                                | Lookup helpers (#2), existing job mock data                        | Customer Screens Tab                              | Medium          |
| 13  | `CustomerScreensTab` + `ScreenRecordRow` + `ReclaimScreenDialog`                                                                                                           | Derived screen data (#12), `ColorSwatchRow` (#6)                   | Customer Detail update                            | Medium          |
| 14  | Update `CustomerTabs` to include Screens tab                                                                                                                               | `CustomerScreensTab` (#13)                                         | Nothing                                           | Low             |
| 15  | Customer favorites schema + mock data                                                                                                                                      | Schema updates (#1)                                                | Favorites integration                             | Low             |
| 16  | Customer favorites integration (stars in catalog drawer, customer context)                                                                                                 | `FavoriteStar` (#5), favorites data (#15)                          | Nothing                                           | Medium          |
| 17  | Cross-linking: Dashboard job rows (#65)                                                                                                                                    | Nothing                                                            | Nothing                                           | Low             |
| 18  | Cross-linking: Customer Detail job rows (#66)                                                                                                                              | Nothing                                                            | Nothing                                           | Low             |
| 19  | Cross-linking: Invoice Detail linked job (#68)                                                                                                                             | Nothing                                                            | Nothing                                           | Low             |
| 20  | Fix Job Detail raw garment/color ID display                                                                                                                                | Lookup helpers (#2), `GarmentImage` (#4)                           | Nothing                                           | Low             |

---

## Scope Coverage

Verify every CORE feature from the discovery session scope is represented:

| Scope Feature                                    | Affordances                                     | Covered?         |
| ------------------------------------------------ | ----------------------------------------------- | ---------------- |
| Garment Catalog card grid with images            | U8, U13, U14, U15                               | Yes              |
| Table toggle for management view                 | U7, U9, U10                                     | Yes              |
| Category tabs                                    | U1                                              | Yes              |
| Brand/color/size filters + search                | U2, U3, U4, U5, U6                              | Yes              |
| Enable/disable per garment                       | U10, U28, N8                                    | Yes              |
| Detail drawer with size/color matrix             | U20-U33, P1.1                                   | Yes              |
| Page-level price visibility toggle               | U12, N10, S6                                    | Yes              |
| Expanded mock data (15+ garments)                | Build Order #3                                  | Yes              |
| Customer favorites (garments + colors)           | U60, U61, U62, N15, N16, S10                    | Yes              |
| Inline star from any context                     | U11, U29, U30, U60, U61, FavoriteStar component | Yes              |
| Favorites float to top in selection lists        | U62 (display), Phase 2 quoting integration      | Yes (foundation) |
| Customer Screens tab                             | U40-U50, P2                                     | Yes              |
| Auto-populated from completed jobs               | N18, S9, S11                                    | Yes              |
| Screens persist until manually reclaimed         | U48, U57, N14, P2.1                             | Yes              |
| Cross-linking: Dashboard → Jobs (#65)            | U70, U71                                        | Yes              |
| Cross-linking: Customer → Jobs (#66)             | U75                                             | Yes              |
| Cross-linking: Invoice → Job (#68)               | U80                                             | Yes              |
| Lookup helpers (getGarmentById, getColorById)    | N22, N23                                        | Yes              |
| Fix Job Detail raw ID display                    | Build Order #20                                 | Yes              |
| User settings foundation (page-level preference) | U12, N10, S6                                    | Yes              |

---

## Phase 2 Extensions

Code affordances that will be added in Phase 2:

| ID     | Place    | Affordance                         | Replaces                | Description                                                                                   |
| ------ | -------- | ---------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| N2-P2  | P1       | searchGarments() via API           | N2 (client-side filter) | Server-side full-text search against supplier catalog                                         |
| N8-P2  | P1, P1.1 | toggleGarmentEnabled() via API     | N8 (mock data update)   | Persist enable/disable to database                                                            |
| N14-P2 | P2       | reclaimScreen() via API            | N14 (mock data update)  | Persist screen reclaim to database, log audit trail                                           |
| N15-P2 | P3       | toggleCustomerFavorite() via API   | N15 (mock data)         | Persist favorites to customer record in database                                              |
| N24    | P2       | screenReusePrompt()                | — (new)                 | When creating a quote for a customer with existing screens, detect reuse and suggest discount |
| N25    | P2       | autoDetectFavorites()              | — (new)                 | "This customer ordered Gildan 5000 Black 3 times" → suggest favoriting                        |
| N26    | P1       | fetchSupplierCatalog()             | S8 mock data            | Pull real garment data from S&S Activewear / SanMar API                                       |
| N27    | P1.1     | checkLiveStock(garmentId, colorId) | — (new)                 | Real-time stock availability from supplier warehouse                                          |

---

## Related Documents

- `knowledge-base/src/content/sessions/2026-02-14-screen-garment-discovery.md` (scope decisions, research)
- `docs/APP_FLOW.md` (routes and navigation)
- `CLAUDE.md` (design system, quality checklist)
- `docs/breadboards/quoting-breadboard.md` (reference — garment selection in quotes will consume favorites)
- `docs/breadboards/customer-management-breadboard.md` (reference — Customer Detail page structure)
