# Color Preference System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Build hierarchical color preference system (Global → Brand → Customer) with visual swatch filtering, favorites-first display, live inheritance, and removal confirmation — all Phase 1 mock data.

**Architecture:** Entity-owned favorites with read-time inheritance resolution. Each entity (global, brand, customer) owns a `favoriteColorIds[]` array. Shared helpers walk the hierarchy at render time. Four reusable components (FavoritesColorSection, InheritanceToggle, InheritanceDetail, ColorFilterGrid) compose into 6 places across 4 waves.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, shadcn/ui, Zod schemas, React state + URL params, Vitest.

---

## Wave 0: Foundation (serial — 1 session)

> All downstream waves depend on Wave 0. Schemas, mock data, helpers, and shared components must be merged before any feature work begins.

### Task 0.1: Schemas + Types

**Files:**
- `lib/schemas/color-preferences.ts` — NEW
- `lib/schemas/customer.ts` — MODIFY
- `lib/schemas/__tests__/color-preferences.test.ts` — NEW

**Steps:**
1. Create `lib/schemas/color-preferences.ts` with:
   - `brandPreferenceSchema`: `{ brandName, inheritMode: 'inherit' | 'customize', favoriteColorIds[], explicitColorIds[], removedInheritedColorIds[] }`
   - `customerPreferenceSchema`: `{ inheritMode, favoriteColorIds[], favoriteBrandNames[], favoriteGarmentIds[] }`
   - `inheritanceModeSchema`: `z.enum(['inherit', 'customize'])`
   - `displayPreferenceSchema`: `z.enum(['flat', 'grouped'])`
   - `propagationConfigSchema`: `{ autoPropagate: z.boolean() }`
   - Export all derived types
2. Evolve `customerSchema.favoriteColors` from `z.record(z.string(), z.array(z.string()))` to `z.array(z.string())` (customer-level, not per-garment)
3. Add `favoriteBrandNames: z.array(z.string()).default([])` to customer schema
4. Write tests: schema validation for all new types, customer schema backward compat

### Task 0.2: Mock Data

**Files:**
- `lib/mock-data.ts` — MODIFY

**Steps:**
1. Update `colors` array: ensure 5 `isFavorite: true` colors remain (Black, White, Navy, Royal Blue, Red) — these map to S2 global favorites
2. Add `brandPreferences` mock map:
   - Gildan: `inheritMode: 'customize'`, adds Sport Grey + Heather Athletic, removes none
   - Bella+Canvas: `inheritMode: 'inherit'` (uses global defaults)
   - Comfort Colors: `inheritMode: 'customize'`, adds Seafoam + Butter, removes Red
3. Update customer mock data:
   - Customer 1 (Trinity Lutheran): `favoriteColors: ['clr-black', 'clr-forest-green']`, `favoriteBrandNames: ['Gildan']`
   - Customer 2 (Blue Ridge): `favoriteColors: ['clr-royal', 'clr-white']`, `favoriteBrandNames: ['Bella+Canvas']`
   - Customer 7 (Westside Sports): `favoriteColors: ['clr-red', 'clr-white']`, `favoriteBrandNames: []`
4. Add `autoPropagationConfig: { autoPropagate: true }` to settings mock data
5. Add `displayPreference: 'flat'` to settings mock data

### Task 0.3: Shared Helpers

**Files:**
- `lib/helpers/color-preferences.ts` — NEW
- `lib/helpers/__tests__/color-preferences.test.ts` — NEW

**Steps:**
1. `resolveEffectiveFavorites(entityType, entityId)` — N19:
   - Walks: global (S2 — colors with `isFavorite`) → brand overrides (S3) → customer overrides (S4)
   - Returns `colorIds[]` (empty `[]` when all levels empty — R5 graceful degradation)
   - `entityType: 'global' | 'brand' | 'customer'`
2. `getInheritanceChain(entityType, entityId)` — N20:
   - Returns `{ globalDefaults: string[], addedAtLevel: string[], removedAtLevel: string[] }`
3. `propagateAddition(level, colorId)` — N22:
   - If autoPropagation disabled (S8=false): no-op
   - If enabled: find children without explicit removal → append colorId
4. `getImpactPreview(level, colorId)` — N21:
   - Returns `{ supplierCount, customerCount, suppliers: string[], customers: string[] }`
5. Write comprehensive tests for all 4 helpers:
   - N19: global-only, brand-inherit, brand-customize, customer-inherit, customer-customize, zero-favorites fallback
   - N20: chain at each level
   - N22: propagation with/without config, respects explicit removals
   - N21: impact counts at global and brand levels

### Task 0.4: Shared Components

**Files:**
- `components/features/ColorSwatchPicker.tsx` — MODIFY
- `components/features/FavoritesColorSection.tsx` — NEW
- `components/features/InheritanceToggle.tsx` — NEW
- `components/features/InheritanceDetail.tsx` — NEW

**Steps:**
1. **ColorSwatchPicker** — add `multiSelect` mode:
   - New props: `multiSelect?: boolean`, `selectedColorIds?: string[]`, `onToggleColor?: (colorId: string) => void`
   - When `multiSelect=true`: click toggles colorId in/out of `selectedColorIds[]`; renders check/ring indicator
   - Existing single-select behavior unchanged when `multiSelect=false`
2. **FavoritesColorSection** — reusable two-section layout:
   - Props: `favorites: Color[]`, `allColors: Color[]`, `onToggle: (colorId: string) => void`, `readOnly?: boolean`, `showBadges?: boolean`, `badgeData?: Map<string, 'inherited' | 'added'>`
   - Top section: "Favorites (N)" heading + favorite swatches (click to remove)
   - Bottom section: "All Colors (N)" heading + full palette (click to add)
   - Single `ScrollArea` wrapping both sections (fixes drawer scroll bug)
   - Empty state: "No favorites set" with muted text
3. **InheritanceToggle** — Beth Meyer toggle:
   - Props: `parentLabel: string`, `mode: 'inherit' | 'customize'`, `onChange: (mode) => void`
   - Two-state toggle: "Use [parentLabel] colors" / "Customize colors"
   - Visual: segmented control or toggle button group
4. **InheritanceDetail** — progressive disclosure chain:
   - Props: `chain: { globalDefaults: string[], addedAtLevel: string[], removedAtLevel: string[] }`, `onRestore?: (colorId: string) => void`
   - Collapsible via `<Collapsible>` from shadcn/ui
   - Shows: "Global Defaults (N)" → "Added at this level" → "Removed at this level" with restore action

### Task 0.5: Navigation

**Files:**
- `components/layout/sidebar.tsx` — MODIFY
- `lib/constants/navigation.ts` — MODIFY
- `docs/APP_FLOW.md` — MODIFY

**Steps:**
1. Add `/settings/colors` to `SIDEBAR_SETTINGS_ORDER` after `/settings/pricing`
2. Add nav item to `SECONDARY_NAV`: `{ label: "Color Settings", href: "/settings/colors", icon: Palette }`
3. Update `APP_FLOW.md` screen inventory with new route

---

## Wave 1: Catalog UX + Global Settings (parallel — 3 sessions)

> V1, V2, V3 build on different file sets. No merge conflicts expected.

### Task 1.1: V1 — Swatch Filter + Honest Cards (Session A)

**Files:**
- `app/(dashboard)/garments/_components/ColorFilterGrid.tsx` — NEW
- `app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx` — MODIFY
- `app/(dashboard)/garments/_components/GarmentCard.tsx` — MODIFY
- `app/(dashboard)/garments/page.tsx` — MODIFY

**Steps:**
1. Create `ColorFilterGrid` component:
   - Wraps `ColorSwatchPicker` in `multiSelect` mode with compact layout
   - Renders in toolbar position where color family dropdown was
   - Shows popular/favorite colors first, then all by family
   - Selected colors stored in URL param `?colors=id1,id2`
2. Replace `<Select>` color family filter in `GarmentCatalogToolbar` with `<ColorFilterGrid>`:
   - Remove `colorFamily` URL param and `filterByColorFamily()`
   - Add `colors` URL param and `filterByColors(colorIds[])`
   - Active filter pills (U2) show selected color swatches with X to remove
   - "Clear colors" link (U3) resets `?colors=`
3. Modify `GarmentCard`:
   - Pass resolved favorites from `resolveEffectiveFavorites('global')` to card
   - Show only favorite colors in compact swatches (U4) — instead of first 8
   - Add "N colors available" count badge (U5) showing total color count
   - Make brand name clickable: `onBrandClick` prop (stub, wired in Wave 2)
4. Update `garments/page.tsx` filter logic:
   - Replace `filterByColorFamily` with `getFilteredGarmentsByColors(colorIds[])` (N23)
   - Reads `?colors=` param, filters garments that have ANY matching colorId in their palette
   - Import `resolveEffectiveFavorites` from helpers

**Demo**: "Click color swatches to filter; cards show favorites + count"

### Task 1.2: V2 — Drawer Favorites + Scroll Fix (Session B)

**Files:**
- `app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx` — MODIFY

**Steps:**
1. Replace single `ColorSwatchPicker` with `FavoritesColorSection`:
   - Compute favorites via `resolveEffectiveFavorites('global')` (Phase 1 always global context)
   - Pass resolved favorites + all garment colors to FavoritesColorSection
   - Wire `onToggle` to `toggleDrawerFavorite(colorId)` (N3)
2. Fix scroll bug:
   - Remove any inner `ScrollArea` from color picker section
   - Ensure drawer's outer `ScrollArea` wraps both favorites and all-colors sections
   - Verify scrolling works with 60+ colors
3. Wire N3 `toggleDrawerFavorite`:
   - Accept `{context, contextId}` prop from parent (Phase 1: always `{context: 'global'}`)
   - Toggle color's `isFavorite` in mock data (writes S2)
   - Update UI immediately (optimistic)
4. Add brand name link (U16): clickable, calls `onBrandClick` prop (stub, wired in Wave 2)
5. Keep existing functionality: selected color display (U14), size/price matrix (U15)

**Demo**: "Open drawer: favorites at top, full palette below, scrolls correctly"

### Task 1.3: V3 — Global Favorites Page (Session C)

**Files:**
- `app/(dashboard)/settings/colors/page.tsx` — NEW
- `app/(dashboard)/settings/colors/layout.tsx` — NEW (optional, for breadcrumb)

**Steps:**
1. Create `SettingsColorsPage`:
   - Page header "Colors" with breadcrumb (Settings > Colors)
   - Use `FavoritesColorSection` for the main favorites/all-colors layout
   - Wire N4 `toggleGlobalFavorite(colorId)` — toggles `isFavorite` on color in mock data (S2)
   - N4 removal path: if removing and children exist → stub P4 wire (→ V6)
   - N4 addition path: if adding and S8=true → stub N22 wire (→ V6)
2. Display preference toggle (U40):
   - N5 `setDisplayPreference(mode)` — stores in localStorage (S5)
   - Flat grid (default) vs grouped by family
   - When grouped: show family headers (U43) from color.family values
3. Search input (U41):
   - N6 `searchColors(query)` — debounced 300ms, filters palette by name or family
   - Min 2 chars to trigger
4. Auto-propagation config (U42):
   - N10 `setAutoPropagation(enabled)` — toggles S8 mock boolean
   - Label: "Automatically add new favorites to all brands and customers"
   - Default: true
5. Favorites count in heading (U36): dynamic count of colors with `isFavorite: true`

**Demo**: "Settings > Colors: tap swatches to set shop-wide favorites"

---

## Wave 2: Brand Hierarchy (serial — 1 session)

> V4 wires into V1's brand name links (U6, U7) and V2's drawer brand link (U16). Must merge after Wave 1.

### Task 2.1: V4 — Brand Detail Drawer

**Files:**
- `app/(dashboard)/garments/_components/BrandDetailDrawer.tsx` — NEW
- `app/(dashboard)/garments/_components/GarmentCard.tsx` — MODIFY (wire brand click)
- `app/(dashboard)/garments/_components/GarmentCatalogToolbar.tsx` — MODIFY (wire brand click)
- `app/(dashboard)/garments/_components/GarmentDetailDrawer.tsx` — MODIFY (wire brand click)
- `app/(dashboard)/garments/page.tsx` — MODIFY (drawer state + handler)

**Steps:**
1. Create `BrandDetailDrawer`:
   - Sheet/drawer with brand name + garment count header (U21)
   - Close button (U20)
   - `InheritanceToggle` (U22): "Use global colors" / "Customize colors"
   - When inheriting: `FavoritesColorSection` in readOnly mode showing global defaults
   - When customizing: editable FavoritesColorSection with per-color badges (U25)
   - `InheritanceDetail` (U26-U28): progressive disclosure with restore action
   - Brand garment list (U29): mini-cards of garments from this brand
2. Wire N7 `setBrandInheritMode(brand, mode)`:
   - Toggle between 'inherit' and 'customize' in S3 brand preferences map
   - When switching to customize: copy current effective favorites as starting set
3. Wire N8 `toggleBrandFavorite(brand, colorId)`:
   - Update S3 brand preferences → favoriteColorIds
   - Track in explicitColorIds vs removedInheritedColorIds
   - Addition + S8=true → stub N22 (→ V6)
   - Removal + children → stub P4 (→ V6)
4. Wire N9 `restoreInheritedColor(brand, colorId)`:
   - Remove from removedInheritedColorIds in S3
   - Color reappears as inherited
5. Wire N24 `getBrandGarments(brandName)`:
   - Filter garment catalog by brand name
6. Wire N25 `openBrandDrawer(brandName)`:
   - Set drawer state in garments page
   - Connect to brand name clicks: U6 (GarmentCard), U7 (toolbar), U16 (detail drawer)
7. Wire N20 `getInheritanceChain('brand', brandName)` for disclosure section

**Demo**: "Click 'Gildan' → drawer → toggle customize → add Sport Grey"

---

## Wave 3: Customer + Removal (parallel — 2 sessions)

> V5 and V6 touch different files. V5 modifies customer pages; V6 modifies settings page and brand drawer.

### Task 3.1: V5 — Customer Preferences (Session A)

**Files:**
- `app/(dashboard)/customers/[id]/_components/CustomerPreferencesTab.tsx` — NEW
- `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx` — MODIFY

**Steps:**
1. Create `CustomerPreferencesTab`:
   - Color Preferences section (U51-U55):
     - `InheritanceToggle` (U52): dynamic label — "Use [primary brand] colors" if brand favorites set, else "Use global colors"
     - `FavoritesColorSection` (U53/U54): editable when customize, readOnly when inherit
     - `InheritanceDetail` (U55): color chain disclosure
   - Favorite Brands section (U56-U57):
     - Brand chips: tap to toggle brand favorites
     - Source: unique brands from garment catalog
     - Wire N14 `toggleCustomerBrandFavorite(customerId, brand)`
   - Favorite Garments section (U58-U59):
     - Garment mini-cards: compact card with image, brand, style name
     - Tap to toggle garment favorites
     - Wire N15 `toggleCustomerGarmentFavorite(customerId, garmentId)`
   - Empty states (U60): per-axis messages when no favorites set
2. Wire N11 `switchToPreferencesTab()`:
   - Load customer preferences from mock data (S4)
3. Wire N12 `setCustomerInheritMode(customerId, mode)`:
   - Toggle in customer mock data
4. Wire N13 `toggleCustomerColorFavorite(customerId, colorId)`:
   - Update customer.favoriteColors array
5. Update `CustomerTabs`:
   - Add "Preferences" tab trigger (U50)
   - Render `CustomerPreferencesTab` when selected
   - Tab order: Overview | Quotes | Jobs | Artwork | Screens | **Preferences**

**Demo**: "Customer > Preferences: set ACME Corp's colors, brands, garments"

### Task 3.2: V6 — Inheritance Engine + Removal Dialog (Session B)

**Files:**
- `components/features/RemovalConfirmationDialog.tsx` — NEW
- `app/(dashboard)/settings/colors/page.tsx` — MODIFY (make P4 stubs live)
- `app/(dashboard)/garments/_components/BrandDetailDrawer.tsx` — MODIFY (make P4 stubs live)

**Steps:**
1. Create `RemovalConfirmationDialog` (P4):
   - Color swatch + name display (U65)
   - Impact count message (U66): "N suppliers and N customers have this color"
   - Three action buttons:
     - "Remove everywhere" (U67) → N16 `removeFromAll(level, colorId)`
     - "Remove from [level] only" (U68) → N17 `removeFromLevelOnly(level, colorId)`
     - "Cancel" (U69) → close dialog
   - "Customize selections" progressive disclosure (U70):
     - Per-entity checkboxes (U71): suppliers and customers
     - "Apply to selected (N)" button (U72) → N18 `removeFromSelected(level, colorId, entityIds[])`
2. Wire N21 `getImpactPreview(level, colorId)`:
   - Called on dialog open
   - Computes S7 (transient impact data)
   - Feeds U66 impact count
3. Wire N16 `removeFromAll(level, colorId)`:
   - Remove from all entities at and below the specified level
   - Update S2/S3/S4 in mock data
4. Wire N17 `removeFromLevelOnly(level, colorId)`:
   - Remove from specified level only
   - Children retain their explicit customizations
5. Wire N18 `removeFromSelected(level, colorId, entityIds[])`:
   - Remove from selected entities only
   - Update matching entries in S2/S3/S4
6. Make N22 `propagateAddition` live:
   - Update N4 in SettingsColorsPage: on ADD → call propagateAddition('global', colorId)
   - Update N8 in BrandDetailDrawer: on ADD → call propagateAddition('brand', colorId)
7. Make N4→P4 live in SettingsColorsPage:
   - On REMOVE: call getImpactPreview → if children > 0, open RemovalConfirmationDialog
8. Make N8→P4 live in BrandDetailDrawer:
   - On REMOVE: call getImpactPreview → if children > 0, open RemovalConfirmationDialog

**Demo**: "Remove global color → '5 customers affected' → choose targets"

---

## Dependency Graph

```
Wave 0: Foundation (serial)
  colors-foundation
       │
       ├─────────────────────┐─────────────────────┐
       ▼                     ▼                      ▼
Wave 1: (parallel)
  colors-swatch-filter   colors-drawer-favorites   colors-global-settings
  (V1)                   (V2)                      (V3)
       │                     │                      │
       └─────────────────────┴──────────────────────┘
                             │
                             ▼
Wave 2: (serial)
                    colors-brand-drawer
                    (V4)
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
Wave 3: (parallel)
           colors-customer-prefs   colors-removal-dialog
           (V5)                    (V6)
```

## Session Count

| Wave | Sessions | Parallel? | Topics |
|------|----------|-----------|--------|
| 0 | 1 | serial | colors-foundation |
| 1 | 3 | parallel | colors-swatch-filter, colors-drawer-favorites, colors-global-settings |
| 2 | 1 | serial | colors-brand-drawer |
| 3 | 2 | parallel | colors-customer-prefs, colors-removal-dialog |
| **Total** | **7** | | |

## Key Integration Points

1. **FavoritesColorSection** (Wave 0) is used in V2 (drawer), V3 (settings), V4 (brand drawer), V5 (customer prefs)
2. **InheritanceToggle** (Wave 0) is used in V4 (brand) and V5 (customer)
3. **resolveEffectiveFavorites** (Wave 0) is called by V1 (cards), V2 (drawer), V4 (brand), V5 (customer)
4. **Brand name click → openBrandDrawer** chain: V1 creates clickable brand names with `onBrandClick` stub; V4 provides actual handler
5. **RemovalConfirmationDialog** (V6) modifies V3's settings page and V4's brand drawer to make P4 stubs live
6. **Customer schema change** (Wave 0) affects V5's customer preferences and existing customer mock data

## File Conflict Matrix

| | V1 | V2 | V3 | V4 | V5 | V6 |
|---|---|---|---|---|---|---|
| GarmentCatalogToolbar | W | | | W | | |
| GarmentCard | W | | | W | | |
| GarmentDetailDrawer | | W | | W | | |
| garments/page.tsx | W | | | W | | |
| settings/colors/page.tsx | | | W | | | W |
| BrandDetailDrawer | | | | W | | W |
| CustomerTabs | | | | | W | |
| CustomerPreferencesTab | | | | | W | |

W = writes to file. Sessions within the same wave must NOT share W's.
- Wave 1 (V1, V2, V3): no shared files
- Wave 3 (V5, V6): no shared files

## Breadboard Reference

Primary input: `docs/breadboards/color-preference-breadboard.md`
Shaping: `docs/shaping/colors/shaping.md`
Design: `docs/plans/2026-02-15-color-preference-system-design.md`

## Quality Checklist (per session)

- [ ] Read breadboard doc before building
- [ ] Use design system tokens (no hardcoded colors/spacing)
- [ ] Mobile responsive (md: breakpoint, 44px touch targets)
- [ ] Keyboard navigable, ARIA labels
- [ ] Empty/loading/error states
- [ ] Tests for schemas and helpers
- [ ] Commit + push after each logical chunk
- [ ] KB session doc created
