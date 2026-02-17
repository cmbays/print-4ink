---
title: 'Color Preference System — Breadboard'
description: 'UI affordances, code affordances, wiring, and vertical slices for the hierarchical color preference system (Global → Brand → Customer)'
category: breadboard
status: reviewed
phase: 1
created: 2026-02-15
last-verified: 2026-02-15
depends-on:
  - docs/shaping/colors/shaping.md
  - docs/shaping/colors/frame.md
  - docs/shaping/colors/spike-brand-detail-view.md
  - docs/plans/2026-02-15-color-preference-system-design.md
  - docs/breadboards/garment-catalog-breadboard.md
---

# Color Preference System — Breadboard

**Purpose**: Map all UI affordances, code affordances, and wiring for the color preference system — visual swatch filtering, favorites-first garment cards, three-level hierarchical favorites (Global → Brand → Customer), live inheritance with override preservation, and removal confirmation with selective propagation.

**Input**: Shaping doc (Shape A selected — entity-owned favorites with live inheritance), design doc (approved), spike (brand detail drawer pattern), existing garment catalog breadboard.

**Status**: Reviewed (BB Reflection complete — 4 wiring fixes applied, 6 design clarifications added)

**Integration note**: This breadboard modifies the existing Garment Catalog (P1, P1.1 from garment-catalog-breadboard.md) and adds new Places for color management. Cross-references to the garment breadboard are noted with `[GB:X]` notation where X is the original affordance ID.

---

## Places

| #    | Place                             | Type                        | Entry Point                                    | Description                                                        |
| ---- | --------------------------------- | --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| P1   | Garment Catalog                   | Page (existing, modified)   | `/garments` sidebar                            | Swatch filter replaces text dropdown; cards show favorites + count |
| P1.1 | Garment Detail Drawer             | Drawer (existing, modified) | Click garment card/row in P1                   | Favorites section at top, full palette below, scroll fix           |
| P1.2 | Brand Detail Drawer               | Drawer (NEW)                | Click brand name in P1                         | Brand info + color favorites with inherit/customize toggle         |
| P2   | Settings — Colors                 | Page (NEW)                  | `/settings/colors` sidebar                     | Global favorite color management with flat/grouped display         |
| P3   | Customer Detail — Preferences Tab | Tab panel (NEW)             | "Preferences" tab in `/customers/[id]`         | Customer favorites across 3 independent axes                       |
| P4   | Removal Confirmation Dialog       | Dialog (NEW)                | Remove parent-level favorite that has children | Impact preview + selective propagation                             |

**Blocking test notes:**

- P1.2 blocks P1 (drawer overlay, can't interact with catalog behind)
- P4 blocks the originating place (modal, must respond before returning)
- P3 does NOT block Customer Detail — it's a tab panel, same page context. Modeled as a Place because the available affordances change completely when switching tabs.

---

## UI Affordances

### P1 — Garment Catalog (modifications)

| #   | Place | Component             | Affordance                                        | Control | Wires Out | Returns To |
| --- | ----- | --------------------- | ------------------------------------------------- | ------- | --------- | ---------- |
| U1  | P1    | ColorFilterGrid       | Color swatch multi-select grid                    | click   | → N1      | —          |
| U2  | P1    | GarmentCatalogToolbar | Active color filter pills (removable)             | click   | → N2      | —          |
| U3  | P1    | GarmentCatalogToolbar | "Clear colors" link                               | click   | → N2      | —          |
| U4  | P1    | GarmentCard           | Favorite color swatches (favorites only, compact) | render  | —         | —          |
| U5  | P1    | GarmentCard           | "N colors available" count badge                  | render  | —         | —          |
| U6  | P1    | GarmentCard           | Brand name link                                   | click   | → N25     | —          |
| U7  | P1    | GarmentCatalogToolbar | Brand name link (when brand filter active)        | click   | → N25     | —          |

**Replaces:** `[GB:U4]` Color Family Filter Dropdown → U1 Color swatch multi-select grid.
**Modifies:** `[GB:U8]` Garment Card → adds U4 (favorites only) and U5 (count badge), existing compact swatches `[GB:U14]` now show favorites.

### P1.1 — Garment Detail Drawer (modifications)

| #   | Place | Component             | Affordance                                     | Control | Wires Out | Returns To |
| --- | ----- | --------------------- | ---------------------------------------------- | ------- | --------- | ---------- |
| U10 | P1.1  | GarmentDetailDrawer   | Favorites section heading with count           | render  | —         | —          |
| U11 | P1.1  | FavoritesColorSection | Favorite color swatches (tap to remove)        | click   | → N3      | —          |
| U12 | P1.1  | GarmentDetailDrawer   | "All Colors" section heading with count        | render  | —         | —          |
| U13 | P1.1  | GarmentDetailDrawer   | Full palette swatch grid (tap to add favorite) | click   | → N3      | —          |
| U14 | P1.1  | GarmentDetailDrawer   | Selected color name + hex display              | render  | —         | —          |
| U15 | P1.1  | GarmentDetailDrawer   | Size/price matrix (for selected color)         | render  | —         | —          |
| U16 | P1.1  | GarmentDetailDrawer   | Brand name link                                | click   | → N25     | —          |

**Replaces:** Single `[GB:U25]` ColorSwatchPicker → two-section layout (U11 favorites + U13 all colors). **Fixes:** Scroll bug by removing nested ScrollArea — drawer uses single ScrollArea wrapping both sections.

### P1.2 — Brand Detail Drawer (NEW)

| #   | Place | Component             | Affordance                                                           | Control | Wires Out                  | Returns To |
| --- | ----- | --------------------- | -------------------------------------------------------------------- | ------- | -------------------------- | ---------- |
| U20 | P1.2  | BrandDetailDrawer     | Close drawer button                                                  | click   | → close P1.2               | → P1       |
| U21 | P1.2  | BrandDetailDrawer     | Brand name + garment count header                                    | render  | —                          | —          |
| U22 | P1.2  | InheritanceToggle     | Beth Meyer toggle ("Use global colors" / "Customize colors")         | click   | → N7                       | —          |
| U23 | P1.2  | FavoritesColorSection | Favorites section (read-only when inherit; editable when customize)  | click   | → N8 (customize mode only) | —          |
| U24 | P1.2  | FavoritesColorSection | All Colors section (visible in customize mode)                       | click   | → N8                       | —          |
| U25 | P1.2  | FavoritesColorSection | Per-color inheritance badge ("inherited" / "added here")             | render  | —                          | —          |
| U26 | P1.2  | InheritanceDetail     | "View color settings details" disclosure toggle                      | click   | expands                    | —          |
| U27 | P1.2  | InheritanceDetail     | Inheritance chain: global defaults, added at brand, removed at brand | render  | —                          | —          |
| U28 | P1.2  | InheritanceDetail     | "Restore" action on removed inherited color                          | click   | → N9                       | —          |
| U29 | P1.2  | BrandDetailDrawer     | Brand garment list (garments from this brand)                        | render  | —                          | —          |

**Entry points** (per spike resolution): (1) Click brand name on any GarmentCard, (2) Click brand name in toolbar when brand filter active, (3) Future: dedicated "Brands" sub-tab.

### P2 — Settings — Colors (NEW)

| #   | Place | Component             | Affordance                                                             | Control | Wires Out | Returns To               |
| --- | ----- | --------------------- | ---------------------------------------------------------------------- | ------- | --------- | ------------------------ |
| U35 | P2    | SettingsColorsPage    | Page header "Colors" with breadcrumb                                   | render  | —         | —                        |
| U36 | P2    | SettingsColorsPage    | Favorites section heading with count                                   | render  | —         | —                        |
| U37 | P2    | FavoritesColorSection | Favorite color swatches (tap to remove)                                | click   | → N4      | → P4 (if children exist) |
| U38 | P2    | SettingsColorsPage    | "All Colors" section heading                                           | render  | —         | —                        |
| U39 | P2    | FavoritesColorSection | Full palette swatch grid (tap to add favorite)                         | click   | → N4      | —                        |
| U40 | P2    | SettingsColorsPage    | Display preference toggle (flat grid / grouped by family)              | click   | → N5      | —                        |
| U41 | P2    | SettingsColorsPage    | Search input (filter palette by name or family)                        | type    | → N6      | —                        |
| U42 | P2    | SettingsColorsPage    | Auto-propagation config toggle ("Add new favorites to all customers?") | click   | → N10     | —                        |
| U43 | P2    | SettingsColorsPage    | Color family group headers (visible in grouped mode)                   | render  | —         | —                        |

### P3 — Customer Detail — Preferences Tab (NEW)

| #   | Place | Component              | Affordance                                                              | Control | Wires Out              | Returns To         |
| --- | ----- | ---------------------- | ----------------------------------------------------------------------- | ------- | ---------------------- | ------------------ |
| U50 | P3    | CustomerTabs           | "Preferences" tab trigger                                               | click   | → N11                  | → P3 panel visible |
| U51 | P3    | CustomerPreferencesTab | Color Preferences section heading                                       | render  | —                      | —                  |
| U52 | P3    | InheritanceToggle      | Beth Meyer toggle ("Use [parent] colors" / "Customize colors")          | click   | → N12                  | —                  |
| U53 | P3    | FavoritesColorSection  | Favorite color swatches (editable when customize)                       | click   | → N13 (customize mode) | —                  |
| U54 | P3    | FavoritesColorSection  | All Colors section (visible when customize)                             | click   | → N13                  | —                  |
| U55 | P3    | InheritanceDetail      | Color inheritance detail disclosure                                     | click   | expands                | —                  |
| U56 | P3    | CustomerPreferencesTab | Favorite Brands section heading                                         | render  | —                      | —                  |
| U57 | P3    | CustomerPreferencesTab | Brand chips (tap to add/remove brand favorites)                         | click   | → N14                  | —                  |
| U58 | P3    | CustomerPreferencesTab | Favorite Garments section heading                                       | render  | —                      | —                  |
| U59 | P3    | CustomerPreferencesTab | Garment mini-cards (tap to add/remove garment favorites)                | click   | → N15                  | —                  |
| U60 | P3    | CustomerPreferencesTab | Empty state per axis ("No favorite colors set — using global defaults") | render  | —                      | —                  |

### P4 — Removal Confirmation Dialog (NEW)

| #   | Place | Component                 | Affordance                                                           | Control | Wires Out  | Returns To |
| --- | ----- | ------------------------- | -------------------------------------------------------------------- | ------- | ---------- | ---------- |
| U65 | P4    | RemovalConfirmationDialog | Color swatch + name being removed                                    | render  | —          | —          |
| U66 | P4    | RemovalConfirmationDialog | Impact count message ("2 suppliers and 5 customers have this color") | render  | —          | —          |
| U67 | P4    | RemovalConfirmationDialog | "Remove everywhere" button                                           | click   | → N16      | → close P4 |
| U68 | P4    | RemovalConfirmationDialog | "Remove from [level] only" button                                    | click   | → N17      | → close P4 |
| U69 | P4    | RemovalConfirmationDialog | "Cancel" button                                                      | click   | → close P4 | —          |
| U70 | P4    | RemovalConfirmationDialog | "Customize selections" disclosure toggle                             | click   | expands    | —          |
| U71 | P4    | RemovalConfirmationDialog | Per-entity checkboxes (suppliers and/or customers)                   | toggle  | —          | —          |
| U72 | P4    | RemovalConfirmationDialog | "Apply to selected (N)" button                                       | click   | → N18      | → close P4 |

---

## Code Affordances

| #   | Place | Component                 | Affordance                                             | Phase | Trigger                                    | Wires Out                                                                                                                          | Returns To                               |
| --- | ----- | ------------------------- | ------------------------------------------------------ | ----- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| N1  | P1    | ColorFilterGrid           | `filterByColors(colorIds[])`                           | 1     | U1 swatch click                            | → write S1                                                                                                                         | → P1 grid re-renders via N23             |
| N2  | P1    | GarmentCatalogToolbar     | `clearColorFilter()`                                   | 1     | U2 pill click, U3 click                    | → clear S1                                                                                                                         | → P1 grid re-renders via N23             |
| N3  | P1.1  | GarmentDetailDrawer       | `toggleDrawerFavorite(colorId)`                        | 1     | U11/U13 click                              | → resolve context from parent Place prop `{context, contextId}`: if global → write S2, if brand → write S3, if customer → write S4 | → U11, U13 update                        |
| N4  | P2    | SettingsColorsPage        | `toggleGlobalFavorite(colorId)`                        | 1     | U37/U39 click                              | → write S2; if ADDING & S8=true → N22; if REMOVING & children exist → N21 → P4                                                     | → U37, U39 update                        |
| N5  | P2    | SettingsColorsPage        | `setDisplayPreference(mode)`                           | 1     | U40 toggle                                 | → write S5                                                                                                                         | → P2 re-renders (flat/grouped)           |
| N6  | P2    | SettingsColorsPage        | `searchColors(query)`                                  | 1     | U41 type (debounced)                       | → reads S6, local filter                                                                                                           | → U39 filtered palette                   |
| N7  | P1.2  | BrandDetailDrawer         | `setBrandInheritMode(brand, mode)`                     | 1     | U22 toggle                                 | → write S3 (mode field)                                                                                                            | → P1.2 re-renders (read-only ↔ editable) |
| N8  | P1.2  | FavoritesColorSection     | `toggleBrandFavorite(brand, colorId)`                  | 1     | U23/U24 click                              | → write S3; if ADDING & S8=true → N22; if REMOVING & children exist → N21 → P4                                                     | → U23, U24 update                        |
| N9  | P1.2  | InheritanceDetail         | `restoreInheritedColor(brand, colorId)`                | 1     | U28 click                                  | → write S3 (re-inherit)                                                                                                            | → U27 updated chain                      |
| N10 | P2    | SettingsColorsPage        | `setAutoPropagation(enabled)`                          | 1     | U42 toggle                                 | → write S8                                                                                                                         | —                                        |
| N11 | P3    | CustomerTabs              | `switchToPreferencesTab()`                             | 1     | U50 click                                  | —                                                                                                                                  | → P3 panel renders                       |
| N12 | P3    | InheritanceToggle         | `setCustomerInheritMode(customerId, mode)`             | 1     | U52 toggle                                 | → write S4 (mode field)                                                                                                            | → P3 re-renders (read-only ↔ editable)   |
| N13 | P3    | FavoritesColorSection     | `toggleCustomerColorFavorite(customerId, colorId)`     | 1     | U53/U54 click                              | → write S4 (colorIds)                                                                                                              | → U53, U54 update                        |
| N14 | P3    | CustomerPreferencesTab    | `toggleCustomerBrandFavorite(customerId, brand)`       | 1     | U57 click                                  | → write S4 (brandNames)                                                                                                            | → U57 update                             |
| N15 | P3    | CustomerPreferencesTab    | `toggleCustomerGarmentFavorite(customerId, garmentId)` | 1     | U59 click                                  | → write S4 (garmentIds)                                                                                                            | → U59 update                             |
| N16 | P4    | RemovalConfirmationDialog | `removeFromAll(level, colorId)`                        | 1     | U67 click                                  | → write S2/S3/S4 (all entities at and below level)                                                                                 | → close P4, originating place updates    |
| N17 | P4    | RemovalConfirmationDialog | `removeFromLevelOnly(level, colorId)`                  | 1     | U68 click                                  | → write S2 or S3 (level only)                                                                                                      | → close P4, originating place updates    |
| N18 | P4    | RemovalConfirmationDialog | `removeFromSelected(level, colorId, entityIds[])`      | 1     | U72 click                                  | → write S2/S3/S4 (selected entities)                                                                                               | → close P4, originating place updates    |
| N19 | Cross | (shared helper)           | `resolveEffectiveFavorites(entityType, entityId)`      | 1     | N3, card render, tab render                | → reads S2, S3, S4 (hierarchy walk); returns `colorIds[]` (may be empty — fallback: `[]` when all levels empty)                    | → U4, U11, U23, U53                      |
| N20 | Cross | (shared helper)           | `getInheritanceChain(entityType, entityId)`            | 1     | U26/U55 expand                             | → reads S2, S3, S4                                                                                                                 | → U27, U55 (chain data)                  |
| N21 | P4    | RemovalConfirmationDialog | `getImpactPreview(level, colorId)`                     | 1     | P4 render (on open)                        | → reads S3, S4                                                                                                                     | → writes S7, → U66                       |
| N22 | Cross | (shared helper)           | `propagateAddition(level, colorId)`                    | 1     | N4 (add, if S8=true), N8 (add, if S8=true) | → reads S8; if S8=false: no-op; if S8=true: find children without explicit removal of this color → append to S3/S4                 | —                                        |
| N23 | P1    | GarmentCatalogPage        | `getFilteredGarmentsByColors(colorIds[])`              | 1     | S1 change                                  | → reads garment catalog, S6, S2                                                                                                    | → P1 grid renders                        |
| N24 | P1.2  | BrandDetailDrawer         | `getBrandGarments(brandName)`                          | 1     | P1.2 render                                | → reads garment catalog                                                                                                            | → U29                                    |
| N25 | P1    | (shared)                  | `openBrandDrawer(brandName)`                           | 1     | U6, U7, U16 click                          | —                                                                                                                                  | → P1.2 opens                             |

---

## Data Stores

| #   | Place | Store                     | Type                                         | Description                                                                                    | Read By                              | Written By                                                                 |
| --- | ----- | ------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| S1  | P1    | URL `?colors=id1,id2`     | URL state                                    | Selected color IDs for swatch filter                                                           | N1, N2, N23                          | N1 (swatch click), N2 (clear)                                              |
| S2  | P2    | Global favorite color IDs | Mock array (Phase 1), DB row (Phase 2)       | Shop-wide go-to colors. Maps to existing `isFavorite` on Color schema.                         | N4, N19, N20, N21, N22               | N4 (toggle), N16/N17/N18 (removal)                                         |
| S3  | P1.2  | Brand preferences map     | Mock map (Phase 1), DB table (Phase 2)       | `Map<brandName, { inheritMode, favoriteColorIds[], explicitIds[], removedInheritedIds[] }>`    | N7-N9, N19, N20, N21, N22, N24       | N7 (mode), N8 (toggle), N9 (restore), N16/N18 (removal), N22 (propagation) |
| S4  | P3    | Customer preferences      | Mock object (Phase 1), DB columns (Phase 2)  | `{ inheritMode, favoriteColorIds[], favoriteBrandNames[], favoriteGarmentIds[] }` per customer | N12-N15, N19, N20, N21               | N12 (mode), N13-N15 (toggle), N16/N18 (removal), N22 (propagation)         |
| S5  | P2    | Display preference        | localStorage                                 | `"flat"` or `"grouped"` — swatch layout mode                                                   | N5, P2 render                        | N5 (toggle)                                                                |
| S6  | Cross | Colors array              | Mock data (existing, read-only)              | 54 colors across 10 families. Source of truth for color metadata.                              | N1, N6, N19, N23, all swatch renders | — (read-only)                                                              |
| S7  | P4    | Impact preview data       | Transient (dialog scope)                     | `{ supplierCount, customerCount, suppliers[], customers[] }` — computed on dialog open         | U66, U71                             | N21 (compute on open)                                                      |
| S8  | P2    | Auto-propagation config   | Mock boolean (Phase 1), DB setting (Phase 2) | "Auto-add new favorites to all customers?" (default: true)                                     | N22                                  | N10 (toggle)                                                               |

---

## Component Boundaries

### New Components

| Component                 | Place(s)           | Location                                                | Purpose                                                              |
| ------------------------- | ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------- |
| ColorFilterGrid           | P1                 | `garments/_components/ColorFilterGrid.tsx`              | Multi-select swatch grid for toolbar filtering                       |
| FavoritesColorSection     | P1.1, P1.2, P2, P3 | `components/features/FavoritesColorSection.tsx`         | Reusable two-section layout: favorites swatches + all colors palette |
| InheritanceToggle         | P1.2, P3           | `components/features/InheritanceToggle.tsx`             | Beth Meyer "Use [parent] colors" / "Customize" toggle                |
| InheritanceDetail         | P1.2, P3           | `components/features/InheritanceDetail.tsx`             | Progressive disclosure: inheritance chain visualization              |
| BrandDetailDrawer         | P1.2               | `garments/_components/BrandDetailDrawer.tsx`            | Brand info + color favorites with inherit/customize                  |
| SettingsColorsPage        | P2                 | `app/(dashboard)/settings/colors/page.tsx`              | Global favorite color management                                     |
| CustomerPreferencesTab    | P3                 | `customers/[id]/_components/CustomerPreferencesTab.tsx` | Customer favorites: colors, brands, garments                         |
| RemovalConfirmationDialog | P4                 | `components/features/RemovalConfirmationDialog.tsx`     | Impact preview + selective propagation                               |

### Modified Components

| Component               | Change                                                                      | Why                                          |
| ----------------------- | --------------------------------------------------------------------------- | -------------------------------------------- |
| `GarmentCatalogToolbar` | Replace color family `<Select>` with `<ColorFilterGrid>`                    | A1.1 — swatch filter replaces text dropdown  |
| `GarmentCard`           | Pass resolved favorites to compact swatches + add count badge               | A2.1, A2.2 — favorites-first display         |
| `GarmentDetailDrawer`   | Replace single ColorSwatchPicker with `<FavoritesColorSection>`, fix scroll | A2.3, A2.4 — two-section layout + scroll fix |
| `ColorSwatchPicker`     | Add `multiSelect` mode (array of selected IDs, toggle behavior)             | A1.2 — reuse in filter grid                  |
| `CustomerTabs`          | Add "Preferences" tab trigger                                               | A5.1 — new tab                               |

### Shared Helpers (lib/)

| Helper                        | Location                           | Purpose                                                                      |
| ----------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `resolveEffectiveFavorites()` | `lib/helpers/color-preferences.ts` | Walk hierarchy: global → brand → customer, applying inheritance rules        |
| `getInheritanceChain()`       | `lib/helpers/color-preferences.ts` | Build chain visualization: what's inherited, what's explicit, what's removed |
| `propagateAddition()`         | `lib/helpers/color-preferences.ts` | Auto-add to inheriting children (respects auto-propagation config)           |
| `getImpactPreview()`          | `lib/helpers/color-preferences.ts` | Count affected entities for removal confirmation                             |

---

## Design Clarifications (from BB Reflection)

### N3 Context Resolution

P1.1 (GarmentDetailDrawer) receives a `{context: 'global' | 'brand' | 'customer', contextId?: string}` prop from its parent Place. N3 uses this to determine which store (S2/S3/S4) to write to. In Phase 1, the drawer is always opened from P1 (catalog) → context defaults to "global" → writes S2. In Phase 2, when opened from P1.2 (brand drawer) or P3 (customer tab), the context prop routes writes to S3/S4.

### Filter vs Favorites Independence

Color filter (S1) and favorites (N19) are independent systems. S1 affects which garments appear (N23), not which favorites show on cards (U4/U5). This separation keeps filter UI simple and favorite counts honest. Example: filtering by "Blue" shows only garments with blue in their palette, but each card still shows ALL of its favorited colors (including non-blue favorites).

### S5 Display Preference Scope

S5 (flat/grouped toggle) applies to P2 (Settings > Colors) only. FavoritesColorSection instances in other Places (P1.1, P1.2, P3) always render in compact flat mode. Grouped display is a settings-page feature per R7 (nice-to-have).

### U52 Label Computation

Beth Meyer toggle in P3 uses dynamic label: if customer has `favoriteBrandNames.length > 0`, shows "Use [primary brand] colors". Otherwise shows "Use global colors". This mirrors U22 in P1.2 which always shows "Use global colors" (brand inherits from global).

### Zero-Favorites Fallback (R5)

When N19 resolves effective favorites and all three levels (S2, S3, S4) have zero favorites, it returns `[]`. UI behavior: U4 renders an empty state or is hidden; U5 shows "N colors available" (total from garment's palette, not favorites count). This ensures graceful degradation per R5.

### P4 Single-Action Removal

Impact preview (U66, N21) counts ALL downstream children in one query. "Remove everywhere" (N16) removes from all levels in one action — no cascading dialogs. "Remove from [level] only" (N17) only updates the specified level's store; children's explicit customizations are preserved.

---

## Wiring Verification

- [x] Every U has at least one Wires Out or Returns To (display-only Us have "—" which is valid)
- [x] Every N has a trigger (U interaction, lifecycle render, or another N)
- [x] Every S has at least one reader and one writer (S6 is read-only existing data — valid)
- [x] No dangling wire references — all N/S/U/P references exist in tables
- [x] Every display U that shows data has a source (N19 feeds favorites to U4/U11/U23/U53; S6 feeds all palette renders)
- [x] Every CORE requirement from shaping has corresponding affordances (verified in Scope Coverage below)

---

## Scope Coverage

| Req  | Requirement                                     | Status       | Affordances                                                       | Covered? |
| ---- | ----------------------------------------------- | ------------ | ----------------------------------------------------------------- | -------- |
| R0   | Visual color filtering — swatches not text      | Core goal    | U1, U2, U3, N1, N2, N23, S1                                       | Yes      |
| R1   | Honest garment card colors — favorites + count  | Must-have    | U4, U5, N19                                                       | Yes      |
| R2   | Three-level favorites hierarchy                 | Must-have    | S2 (global), S3 (brand), S4 (customer)                            | Yes      |
| R2.1 | Global shop-level favorites                     | Must-have    | P2, U37, U39, N4, S2                                              | Yes      |
| R2.2 | Supplier/brand-level favorites                  | Must-have    | P1.2, U23, U24, N8, S3                                            | Yes      |
| R2.3 | Customer-level favorites with independent axes  | Must-have    | P3, U53-U59, N13-N15, S4                                          | Yes      |
| R3   | Safe inheritance behavior                       | Must-have    | N19, N20, N22                                                     | Yes      |
| R3.1 | Additive changes auto-propagate                 | Must-have    | N22, S8                                                           | Yes      |
| R3.2 | Child customizations preserved                  | Must-have    | N19 (per-item tracking in S3.explicitIds, S3.removedInheritedIds) | Yes      |
| R3.3 | Removal requires confirmation with impact       | Must-have    | P4, U66, N21, S7                                                  | Yes      |
| R3.4 | Selective propagation on removal                | Must-have    | U70-U72, N18                                                      | Yes      |
| R4   | Non-technical usability — single-layer thinking | Must-have    | U22/U52 (Beth Meyer toggle), U26/U55 (progressive disclosure)     | Yes      |
| R5   | Graceful degradation — each level optional      | Must-have    | N19 (hierarchy walk returns defaults when levels empty)           | Yes      |
| R6   | Entity-context editing                          | Must-have    | P2 (global→settings), P1.2 (brand→garments), P3 (customer→detail) | Yes      |
| R7   | Configurable swatch display — flat/grouped      | Nice-to-have | U40, U43, N5, S5                                                  | Yes      |
| R8   | Full palette access via detail drawer           | Must-have    | U12, U13, P1.1 scroll fix                                         | Yes      |

---

## Vertical Slices

### Slice Summary

| #   | Slice                               | Shape Parts    | Affordances                     | Demo                                                                   |
| --- | ----------------------------------- | -------------- | ------------------------------- | ---------------------------------------------------------------------- |
| V1  | Swatch filter + honest cards        | A1, A2.1, A2.2 | U1-U7, N1, N2, N19, N23         | "Click color swatches to filter; cards show favorites + count"         |
| V2  | Drawer favorites + scroll fix       | A2.3, A2.4     | U10-U16, N3                     | "Open drawer: favorites at top, full palette below, scrolls correctly" |
| V3  | Global favorites page               | A3             | U35-U43, N4-N6, N10, S2, S5, S8 | "Settings > Colors: tap swatches to set shop-wide favorites"           |
| V4  | Brand detail drawer                 | A4             | U20-U29, N7-N9, N25, S3         | "Click 'Gildan' → drawer opens → toggle to customize → add Sport Grey" |
| V5  | Customer preferences                | A5             | U50-U60, N11-N15, S4            | "Customer > Preferences: set ACME Corp's colors, brands, garments"     |
| V6  | Inheritance engine + removal dialog | A6, A7         | U65-U72, N16-N18, N20-N22, S7   | "Remove global color → see '5 customers affected' → choose targets"    |

**Parallelization windows:**

- V1 + V2 can run concurrently (different components, no data dependency)
- V3 must complete before V4 (brand drawer reads global favorites)
- V4 must complete before V5 (customer preferences inherit from brand)
- V6 depends on V3 + V4 (removal dialog needs the hierarchy to exist)

### V1: Swatch Filter + Honest Cards

**Demo**: "Filter garments by clicking color swatches in the toolbar. Garment cards show only favorited colors with a 'N colors available' count badge."

**Parts**: A1 (visual swatch filter), A2.1 (favorites-first cards), A2.2 (count badge)

| #   | Place | Component             | Affordance                        | Control | Wires Out               | Returns To |
| --- | ----- | --------------------- | --------------------------------- | ------- | ----------------------- | ---------- |
| U1  | P1    | ColorFilterGrid       | Color swatch multi-select grid    | click   | → N1                    | —          |
| U2  | P1    | GarmentCatalogToolbar | Active color filter pills         | click   | → N2                    | —          |
| U3  | P1    | GarmentCatalogToolbar | "Clear colors" link               | click   | → N2                    | —          |
| U4  | P1    | GarmentCard           | Favorite color swatches (compact) | render  | —                       | —          |
| U5  | P1    | GarmentCard           | "N colors available" count badge  | render  | —                       | —          |
| U6  | P1    | GarmentCard           | Brand name link                   | click   | → N25 (stub → V4)       | —          |
| U7  | P1    | GarmentCatalogToolbar | Brand name link                   | click   | → N25 (stub → V4)       | —          |
| N1  | P1    | ColorFilterGrid       | `filterByColors(colorIds[])`      | call    | → S1                    | → N23      |
| N2  | P1    | GarmentCatalogToolbar | `clearColorFilter()`              | call    | → S1                    | → N23      |
| N19 | Cross | (helper)              | `resolveEffectiveFavorites()`     | call    | → S2                    | → U4       |
| N23 | P1    | GarmentCatalogPage    | `getFilteredGarmentsByColors()`   | call    | → reads catalog, S6, S2 | → P1 grid  |
| S1  | P1    | URL `?colors=id1,id2` | state                             | —       | —                       | —          |

**Schema changes**: Extend `ColorSwatchPicker` with `multiSelect` prop; or create standalone `ColorFilterGrid` that wraps swatches in toggle mode.

### V2: Drawer Favorites + Scroll Fix

**Demo**: "Open a garment detail drawer. Favorites section appears at top with shop favorites. Full scrollable palette below. Color selection and size/price matrix work correctly."

**Parts**: A2.3 (drawer favorites/all sections), A2.4 (scroll fix)

| #   | Place | Component             | Affordance                              | Control | Wires Out                                                                                     | Returns To        |
| --- | ----- | --------------------- | --------------------------------------- | ------- | --------------------------------------------------------------------------------------------- | ----------------- |
| U10 | P1.1  | GarmentDetailDrawer   | Favorites section heading               | render  | —                                                                                             | —                 |
| U11 | P1.1  | FavoritesColorSection | Favorite color swatches (tap to remove) | click   | → N3                                                                                          | —                 |
| U12 | P1.1  | GarmentDetailDrawer   | "All Colors" heading + count            | render  | —                                                                                             | —                 |
| U13 | P1.1  | GarmentDetailDrawer   | Full palette (tap to add)               | click   | → N3                                                                                          | —                 |
| U14 | P1.1  | GarmentDetailDrawer   | Selected color name + hex               | render  | —                                                                                             | —                 |
| U15 | P1.1  | GarmentDetailDrawer   | Size/price matrix                       | render  | —                                                                                             | —                 |
| U16 | P1.1  | GarmentDetailDrawer   | Brand name link                         | click   | → N25 (stub → V4)                                                                             | —                 |
| N3  | P1.1  | GarmentDetailDrawer   | `toggleDrawerFavorite(colorId)`         | call    | → resolve context from `{context, contextId}` prop; Phase 1: always context=global → write S2 | → U11, U13 update |

**Scroll fix**: Remove inner `ScrollArea` from `FavoritesColorSection`. Drawer's single outer `ScrollArea` wraps both sections.

**Context prop**: P1.1 receives `{context: 'global', contextId?: string}` from parent. In Phase 1, context is always "global" (drawer opens from catalog). Phase 2 adds "brand" and "customer" contexts.

### V3: Global Favorites Page

**Demo**: "Navigate to Settings > Colors. Tap swatches to add/remove global favorites. Toggle between flat and grouped display. Search to find specific colors."

**Parts**: A3.1 (route + page), A3.2 (tap-to-toggle), A3.3 (display preference), A6.3 (auto-propagation config)

| #   | Place | Component               | Affordance                        | Control | Wires Out                                                                            | Returns To      |
| --- | ----- | ----------------------- | --------------------------------- | ------- | ------------------------------------------------------------------------------------ | --------------- |
| U35 | P2    | SettingsColorsPage      | Page header + breadcrumb          | render  | —                                                                                    | —               |
| U36 | P2    | SettingsColorsPage      | Favorites heading + count         | render  | —                                                                                    | —               |
| U37 | P2    | FavoritesColorSection   | Favorite swatches (tap to remove) | click   | → N4                                                                                 | —               |
| U38 | P2    | SettingsColorsPage      | "All Colors" heading              | render  | —                                                                                    | —               |
| U39 | P2    | FavoritesColorSection   | Full palette (tap to add)         | click   | → N4                                                                                 | —               |
| U40 | P2    | SettingsColorsPage      | Display toggle (flat/grouped)     | click   | → N5                                                                                 | —               |
| U41 | P2    | SettingsColorsPage      | Search input                      | type    | → N6                                                                                 | —               |
| U42 | P2    | SettingsColorsPage      | Auto-propagation toggle           | click   | → N10                                                                                | —               |
| U43 | P2    | SettingsColorsPage      | Color family group headers        | render  | —                                                                                    | —               |
| N4  | P2    | SettingsColorsPage      | `toggleGlobalFavorite(colorId)`   | call    | → S2; if ADDING & S8=true → N22 (stub → V6); if REMOVING & children → P4 (stub → V6) | → U37, U39      |
| N5  | P2    | SettingsColorsPage      | `setDisplayPreference(mode)`      | call    | → S5                                                                                 | → P2 re-renders |
| N6  | P2    | SettingsColorsPage      | `searchColors(query)`             | call    | local filter on S6                                                                   | → U39 filtered  |
| N10 | P2    | SettingsColorsPage      | `setAutoPropagation(enabled)`     | call    | → S8                                                                                 | —               |
| S2  | P2    | Global favorites        | array                             | —       | —                                                                                    | —               |
| S5  | P2    | Display preference      | localStorage                      | —       | —                                                                                    | —               |
| S8  | P2    | Auto-propagation config | mock boolean                      | —       | —                                                                                    | —               |

**Route addition**: Add `/settings/colors` to sidebar nav (after Pricing). Add to `APP_FLOW.md` screen inventory.

### V4: Brand Detail Drawer

**Demo**: "Click 'Gildan' on a garment card. Brand drawer opens showing inherited global colors. Toggle 'Customize colors' → add Sport Grey, remove White. View inheritance chain in disclosure section."

**Parts**: A4.1 (brand drawer), A4.2 (Beth Meyer toggle), A4.3 (favorites/all sections), A4.4 (per-item tracking)

| #   | Place | Component             | Affordance                    | Control | Wires Out                                                                            | Returns To        |
| --- | ----- | --------------------- | ----------------------------- | ------- | ------------------------------------------------------------------------------------ | ----------------- |
| U20 | P1.2  | BrandDetailDrawer     | Close button                  | click   | → close P1.2                                                                         | → P1              |
| U21 | P1.2  | BrandDetailDrawer     | Brand name + count header     | render  | —                                                                                    | —                 |
| U22 | P1.2  | InheritanceToggle     | Beth Meyer toggle             | click   | → N7                                                                                 | —                 |
| U23 | P1.2  | FavoritesColorSection | Favorites section             | click   | → N8                                                                                 | —                 |
| U24 | P1.2  | FavoritesColorSection | All Colors section            | click   | → N8                                                                                 | —                 |
| U25 | P1.2  | FavoritesColorSection | Per-color badges              | render  | —                                                                                    | —                 |
| U26 | P1.2  | InheritanceDetail     | Disclosure toggle             | click   | expands                                                                              | —                 |
| U27 | P1.2  | InheritanceDetail     | Chain: global + brand changes | render  | —                                                                                    | —                 |
| U28 | P1.2  | InheritanceDetail     | "Restore" action              | click   | → N9                                                                                 | —                 |
| U29 | P1.2  | BrandDetailDrawer     | Brand garment list            | render  | —                                                                                    | —                 |
| N7  | P1.2  | InheritanceToggle     | `setBrandInheritMode()`       | call    | → S3                                                                                 | → P1.2 re-renders |
| N8  | P1.2  | FavoritesColorSection | `toggleBrandFavorite()`       | call    | → S3; if ADDING & S8=true → N22 (stub → V6); if REMOVING & children → P4 (stub → V6) | → U23, U24        |
| N9  | P1.2  | InheritanceDetail     | `restoreInheritedColor()`     | call    | → S3                                                                                 | → U27             |
| N20 | Cross | (helper)              | `getInheritanceChain()`       | call    | → S2, S3                                                                             | → U27             |
| N24 | P1.2  | BrandDetailDrawer     | `getBrandGarments()`          | call    | → catalog data                                                                       | → U29             |
| N25 | P1    | (shared)              | `openBrandDrawer()`           | call    | —                                                                                    | → P1.2            |
| S3  | P1.2  | Brand preferences     | mock map                      | —       | —                                                                                    | —                 |

**Mock data**: Create `brandPreferences` array in mock data with 2-3 brands (Gildan, Bella+Canvas, Comfort Colors) showing inherit and customize modes.

### V5: Customer Preferences

**Demo**: "Open customer ACME Corp. Click Preferences tab. Toggle 'Customize colors' → add Royal Blue. Add Gildan to brand favorites. Add G5000 to garment favorites. Each axis works independently."

**Parts**: A5.1 (preferences tab), A5.2 (Beth Meyer toggle), A5.3 (independent axes)

| #   | Place | Component              | Affordance                        | Control | Wires Out | Returns To      |
| --- | ----- | ---------------------- | --------------------------------- | ------- | --------- | --------------- |
| U50 | P3    | CustomerTabs           | "Preferences" tab trigger         | click   | → N11     | → P3            |
| U51 | P3    | CustomerPreferencesTab | Color section heading             | render  | —         | —               |
| U52 | P3    | InheritanceToggle      | Beth Meyer toggle                 | click   | → N12     | —               |
| U53 | P3    | FavoritesColorSection  | Favorite swatches                 | click   | → N13     | —               |
| U54 | P3    | FavoritesColorSection  | All Colors section                | click   | → N13     | —               |
| U55 | P3    | InheritanceDetail      | Color inheritance disclosure      | click   | expands   | —               |
| U56 | P3    | CustomerPreferencesTab | Brands heading                    | render  | —         | —               |
| U57 | P3    | CustomerPreferencesTab | Brand chips                       | click   | → N14     | —               |
| U58 | P3    | CustomerPreferencesTab | Garments heading                  | render  | —         | —               |
| U59 | P3    | CustomerPreferencesTab | Garment mini-cards                | click   | → N15     | —               |
| U60 | P3    | CustomerPreferencesTab | Empty states                      | render  | —         | —               |
| N11 | P3    | CustomerTabs           | `switchToPreferencesTab()`        | call    | —         | → P3 renders    |
| N12 | P3    | InheritanceToggle      | `setCustomerInheritMode()`        | call    | → S4      | → P3 re-renders |
| N13 | P3    | FavoritesColorSection  | `toggleCustomerColorFavorite()`   | call    | → S4      | → U53, U54      |
| N14 | P3    | CustomerPreferencesTab | `toggleCustomerBrandFavorite()`   | call    | → S4      | → U57           |
| N15 | P3    | CustomerPreferencesTab | `toggleCustomerGarmentFavorite()` | call    | → S4      | → U59           |
| S4  | P3    | Customer preferences   | mock object                       | —       | —         | —               |

**Schema change**: Evolve `customerSchema.favoriteColors` from `Record<garmentId, colorId[]>` to `string[]` (customer-level, not per-garment). Add `favoriteBrandNames: string[]`. Existing `favoriteGarments: string[]` is already correct.

### V6: Inheritance Engine + Removal Dialog

**Demo**: "On Settings > Colors, remove a global favorite. Dialog shows '2 suppliers and 5 customers have this color.' Choose 'Remove everywhere' or use 'Customize selections' to pick specific entities."

**Parts**: A6.1 (auto-propagation), A6.2 (per-item tracking), A7.1-A7.3 (removal dialog)

| #   | Place | Component                 | Affordance                 | Control | Wires Out             | Returns To |
| --- | ----- | ------------------------- | -------------------------- | ------- | --------------------- | ---------- |
| U65 | P4    | RemovalConfirmationDialog | Color swatch + name        | render  | —                     | —          |
| U66 | P4    | RemovalConfirmationDialog | Impact count               | render  | —                     | —          |
| U67 | P4    | RemovalConfirmationDialog | "Remove everywhere"        | click   | → N16                 | → close P4 |
| U68 | P4    | RemovalConfirmationDialog | "Remove from [level] only" | click   | → N17                 | → close P4 |
| U69 | P4    | RemovalConfirmationDialog | "Cancel"                   | click   | → close P4            | —          |
| U70 | P4    | RemovalConfirmationDialog | "Customize selections"     | click   | expands               | —          |
| U71 | P4    | RemovalConfirmationDialog | Per-entity checkboxes      | toggle  | —                     | —          |
| U72 | P4    | RemovalConfirmationDialog | "Apply to selected (N)"    | click   | → N18                 | → close P4 |
| N16 | P4    | RemovalConfirmationDialog | `removeFromAll()`          | call    | → S2/S3/S4            | → close P4 |
| N17 | P4    | RemovalConfirmationDialog | `removeFromLevelOnly()`    | call    | → S2 or S3            | → close P4 |
| N18 | P4    | RemovalConfirmationDialog | `removeFromSelected()`     | call    | → S2/S3/S4 (selected) | → close P4 |
| N21 | P4    | RemovalConfirmationDialog | `getImpactPreview()`       | call    | → S3, S4              | → S7, U66  |
| N22 | Cross | (helper)                  | `propagateAddition()`      | call    | → S8, S3/S4           | —          |
| S7  | P4    | Impact preview data       | transient                  | —       | —                     | —          |

**Wires to earlier slices**: N4 (V3) and N8 (V4) conditionally wire to P4 when removing a color that has downstream children. This wire is a stub in V3/V4 and becomes live in V6.

---

## Phase 2 Extensions

Code affordances that will be added or replaced in Phase 2 (backend):

| ID     | Place | Affordance                                    | Replaces   | Description                                                                                               |
| ------ | ----- | --------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| N4-P2  | P2    | `toggleGlobalFavorite()` server action        | N4 (mock)  | Persist to `color_preferences` table via Drizzle                                                          |
| N8-P2  | P1.2  | `toggleBrandFavorite()` server action         | N8 (mock)  | New `brand_preferences` table: brandName, inheritMode, favoriteColorIds, explicitIds, removedInheritedIds |
| N13-P2 | P3    | `toggleCustomerColorFavorite()` server action | N13 (mock) | Update customer record in DB                                                                              |
| N19-P2 | Cross | `resolveEffectiveFavorites()` DAL function    | N19 (mock) | Drizzle query walking global → brand → customer with join                                                 |
| N22-P2 | Cross | `propagateAddition()` server action           | N22 (mock) | Batch update inheriting entities via Drizzle transaction                                                  |
| N26    | P1.2  | `fetchBrandCatalog(brand)`                    | — (new)    | Pull brand data from S&S Activewear API via SupplierAdapter                                               |
| N27    | P2    | `syncGlobalFavoritesFromSupplier()`           | — (new)    | Suggest favorites based on order history analysis                                                         |

---

## Quality Gate

- [x] Every Place passes the blocking test
- [x] Every R from shaping has corresponding affordances (scope coverage verified)
- [x] Every U has at least one Wires Out or Returns To
- [x] Every N has a trigger and either Wires Out or Returns To
- [x] Every S has at least one reader and one writer
- [x] No dangling wire references
- [x] Slices defined with demo statements
- [x] Phase indicators on code affordances
- [x] Parallelization windows documented for implementation planning

---

## Related Documents

- `docs/shaping/colors/shaping.md` — Shape A selected, 9 requirements, 12 decision log entries
- `docs/shaping/colors/frame.md` — Problem/outcome definition
- `docs/shaping/colors/spike-brand-detail-view.md` — Brand drawer navigation resolution
- `docs/plans/2026-02-15-color-preference-system-design.md` — Approved design document
- `docs/breadboards/garment-catalog-breadboard.md` — Existing garment catalog breadboard (integration reference)
- `knowledge-base/src/content/sessions/2026-02-15-colors-interview.md` — Interview decisions
- `knowledge-base/src/content/sessions/2026-02-15-colors-research.md` — UX research
