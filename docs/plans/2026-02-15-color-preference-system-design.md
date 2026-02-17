# Color Preference System — Design Document

**Date**: 2026-02-15
**Issue**: #169 (Garment color filter: poor UX, can't see available colors per product)
**Scope**: Full system design; incremental build starting with UX fixes
**Status**: Approved

---

## Problem Statement

The garment catalog color filter uses a text-based dropdown that doesn't match the visual swatch UX used elsewhere in the app (quotes). Garment cards show only 8 of N available colors, which is misleading when combined with color filtering. Beyond these immediate UX issues, shops need a structured way to manage color preferences at multiple levels: global shop defaults, supplier/brand preferences, and customer-specific favorites.

## Design Decisions

### 1. Data Model — Entity-Owned Favorites (Approach A)

Each entity owns its own favorite color list. No centralized preference store.

```
Global (shop settings)
  └─ favoriteColorIds: string[]

Brand/Supplier preferences
  └─ brandName: string
  └─ favoriteColorIds: string[]

Customer preferences
  └─ favoriteColorIds: string[]
  └─ favoriteBrands: string[]
  └─ favoriteGarmentIds: string[]
```

The existing `isFavorite` boolean on the color schema becomes the global shop favorite — same data, renamed conceptually.

**Why this approach**: Mirrors how shop owners think ("our go-to Gildan colors" vs "ACME Corp's preferred colors"). Each entity is self-contained and independently manageable.

### 2. Inheritance Model — Live Inheritance with Override Preservation

Based on UX research across Figma, Unity, Google Workspace, CrashPlan, and CSS cascade patterns.

**Core behavior**: Lower levels inherit from higher levels. When the parent changes, children update automatically — except for properties the child explicitly customized.

| Action at Parent   | Inheriting children (no customization) | Customized children                             |
| ------------------ | -------------------------------------- | ----------------------------------------------- |
| **Add a color**    | Appears automatically                  | Appears automatically (additive is always safe) |
| **Remove a color** | Removed automatically                  | Notification only — no auto-removal             |

**Per-item tracking**: The system tracks which colors at each level are inherited vs. explicitly set. A customer might accept 8 of 10 global colors and add 2 custom ones. The 8 inherited colors stay in sync; the 2 custom ones are independent.

**Global config setting**: "When adding new global/supplier favorites, automatically add to all customers?" (Yes = default, No = only for uncustomized customers).

### 3. UI Architecture — Single-Layer Thinking + Progressive Disclosure

**Core principle**: At any screen, the user thinks in one layer. Inheritance details are hidden by default.

#### Where each level lives

| Level        | Location                              | Starting state                                    |
| ------------ | ------------------------------------- | ------------------------------------------------- |
| **Global**   | Settings > Colors (new screen)        | Empty — pick shop go-to colors                    |
| **Supplier** | Garments section, brand/supplier view | Pre-populated with global favorites               |
| **Customer** | Customer detail, Preferences tab      | Pre-populated from preferred supplier (or global) |

#### Interaction pattern at each level

Two sections:

1. **Favorites** — just color swatches grouped together at the top. Tap to remove.
2. **All Colors** — full palette below. Tap to add to favorites.

No star overlays on individual swatches. The grouping IS the indication — if it's in the Favorites section, it's a favorite.

#### Section-level inheritance toggle (Beth Meyer pattern)

Each level below global gets a toggle:

- **"Use [Parent] colors"** (inherit) — read-only view of inherited favorites
- **"Customize colors"** (override) — full editable palette, starts with inherited set

#### Progressive disclosure for inheritance details

Below the main sections, a collapsible detail view:

```
> View color settings details

  Global Defaults (4 colors)
  [Black] [White] [Navy] [Sport Grey]

  Changes at this level
  Added:   [Heather Athletic] [Mauve]
  Removed: [x Sport Grey] <- tap to restore
```

### 4. Removal Confirmation with Selective Propagation

When removing a color from a parent level (global or supplier), the system shows downstream impact:

```
"Royal Blue will be removed from global favorites."
"2 suppliers and 5 customers currently have this color."

[Remove everywhere]  [Remove from global only]  [Cancel]

> Customize selections
  Suppliers
    [x] Gildan              [x] Bella Canvas

  Customers
    [x] ACME Corp           [x] Pete's Printing
    [x] Stadium Gear Co     [ ] Downtown Designs
    [x] Campus Athletics

    [Apply to selected (6)]
```

**Default path**: Remove everywhere or global only (simple, fast).
**Progressive disclosure**: "Customize selections" for granular control.

Additive changes (adding a new favorite) do NOT show a confirmation dialog — per NNg research, overusing confirmations trains users to click through blindly.

### 5. Swatch Display Preference

- **Default: flat grid** — mixed colors, neighboring colors look distinct (Gary's preferred Sammar-style layout)
- **Optional: grouped by color family** — user preference toggle in Settings
- Global display preference, not per-page

### 6. Garment Card Color Display

- Show **favorited colors only** in the Favorites section on each card
- Display count: "12 colors available"
- Tap card to open detail drawer with full color palette
- Card swatches are read-only (informational, not interactive for filtering)

### 7. Detail Drawer Fixes

- Fix scroll issue (currently can't scroll to see full color list)
- Show full color palette organized as: favorites section at top, all available colors below
- Each color shows: swatch, name, color code
- Favorite toggle per color (tap to add/remove from customer/supplier favorites depending on context)

## No Level Required

The system gracefully degrades:

| Shop complexity | Setup                      | What happens                                                   |
| --------------- | -------------------------- | -------------------------------------------------------------- |
| **Minimal**     | Set nothing                | All colors shown equally, no favorites                         |
| **Simple**      | Global favorites only      | Stars appear everywhere, inherited by all brands and customers |
| **Medium**      | Global + some brand tweaks | Brands inherit global + their adjustments                      |
| **Full**        | All three levels           | Complete cascade with customer-specific overrides              |

## Industry Context

Research confirmed that the promo/decorated apparel industry handles color preferences manually — physical color cards, job notes, tribal knowledge. No competitor (DecoNetwork, Printavo, InkSoft, GraphicsFlow) has a hierarchical color preference system. This is a differentiating feature.

## Research Sources

Key UX patterns referenced:

- **Figma component overrides** — live inheritance with per-property override preservation
- **Beth Meyer settings inheritance** — section-level inherit/customize toggle
- **Unity override bar** — visual indicators for inherited vs. overridden properties
- **CrashPlan push/lock** — soft vs. hard propagation controls
- **NNg confirmation dialogs** — only confirm for destructive actions
- **Baymard Institute** — flat swatch grids scan faster than grouped on mobile
- **Google Workspace OU settings** — "Inherited"/"Overridden" labeling

Full research report available in session context.

## Build Phases

### Phase 1 — UX Fixes (ticket from #169)

- Replace toolbar color family dropdown with visual swatch picker
- Fix garment card to show favorites only + "N colors available" count
- Fix detail drawer scroll bug
- Add flat/grouped display preference toggle

### Phase 2 — Global Color Favorites

- New Settings > Colors screen
- Global favorite management with swatch picker
- Garment cards and toolbar reflect global favorites

### Phase 3 — Supplier/Brand Favorites

- Brand detail view with inherit/customize toggle
- Inheritance from global with override tracking
- Progressive disclosure for inheritance details

### Phase 4 — Customer Preferences

- Customer Preferences tab with inherit/customize toggle
- Customer favorite colors, brands, and garments (independent axes)
- Selective propagation UI for parent-level changes
- Global config for auto-propagation behavior

### Phase 5 — Polish

- Impact count previews for all parent-level changes
- Per-color reset actions
- Notification system for downstream changes
