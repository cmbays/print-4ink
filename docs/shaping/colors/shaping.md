---
shaping: true
---

# Color Preference System — Shaping

## Requirements (R)

| ID     | Requirement                                                                                                                                   | Status       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **R0** | **Visual color filtering** — filter garments by color using swatches, not text dropdown                                                       | Core goal    |
| **R1** | **Honest garment card colors** — show favorited colors + total count, not arbitrary first-N subset                                            | Must-have    |
| **R2** | **Three-level favorites hierarchy**                                                                                                           | Must-have    |
| R2.1   | Global shop-level favorites (go-to colors regardless of supplier)                                                                             | Must-have    |
| R2.2   | Supplier/brand-level favorites (palette preferences per supplier)                                                                             | Must-have    |
| R2.3   | Customer-level favorites with independent axes (colors, brands, garments — each optional)                                                     | Must-have    |
| **R3** | **Safe inheritance behavior**                                                                                                                 | Must-have    |
| R3.1   | Additive changes auto-propagate to children                                                                                                   | Must-have    |
| R3.2   | Child customizations preserved through parent changes                                                                                         | Must-have    |
| R3.3   | Removal at parent requires confirmation with downstream impact visibility                                                                     | Must-have    |
| R3.4   | Selective propagation on removal (choose which children affected)                                                                             | Must-have    |
| **R4** | **Non-technical usability** — single-layer thinking, no inheritance jargon, shop owners understand it                                         | Must-have    |
| **R5** | **Graceful degradation** — each level optional, system works from 0 to 3 levels configured                                                    | Must-have    |
| **R6** | **Entity-context editing** — edit favorites where the entity lives (settings for global, garments for supplier, customer detail for customer) | Must-have    |
| **R7** | **Configurable swatch display** — flat grid default (Sammar-style), grouped by family as user preference                                      | Nice-to-have |
| **R8** | **Full palette access** — all colors accessible per garment via detail drawer, scroll bug fixed                                               | Must-have    |

---

## Shape A: Entity-Owned Favorites with Live Inheritance

Each entity owns its own `favoriteColorIds[]`. Inheritance computed at read time by walking the hierarchy. Figma-model live inheritance: additions auto-propagate, removals confirmed. Beth Meyer toggle at each level for inherit/customize.

| Part   | Mechanism                                                                                                   | Flag |
| ------ | ----------------------------------------------------------------------------------------------------------- | :--: |
| **A1** | **Visual swatch filter**                                                                                    |      |
| A1.1   | Replace text color-family dropdown in `GarmentCatalogToolbar` with swatch grid (multi-select)               |      |
| A1.2   | Reuse `ColorSwatchPicker` in compact multi-select mode; filter state in URL params                          |      |
| **A2** | **Favorites-first garment cards**                                                                           |      |
| A2.1   | `GarmentCard` shows favorited colors only (resolved from entity's favorites)                                |      |
| A2.2   | "N colors available" count badge on card                                                                    |      |
| A2.3   | `GarmentDetailDrawer`: favorites section at top + full scrollable palette below                             |      |
| A2.4   | Fix drawer scroll bug (currently truncates color list)                                                      |      |
| **A3** | **Global favorites** (Settings > Colors)                                                                    |      |
| A3.1   | New `/settings/colors` route and page                                                                       |      |
| A3.2   | Flat swatch grid with tap-to-toggle favorites; maps to existing `isFavorite` on Color schema                |      |
| A3.3   | Display preference toggle: flat grid (default) / grouped by family                                          |      |
| **A4** | **Supplier/brand favorites** (Garments > Brand drawer)                                                      |      |
| A4.1   | Brand detail drawer triggered by clicking brand name on cards or toolbar (see `spike-brand-detail-view.md`) |      |
| A4.2   | Beth Meyer toggle: "Use global colors" / "Customize colors"                                                 |      |
| A4.3   | When customizing: favorites section (editable) + all colors section below                                   |      |
| A4.4   | Per-item tracking: inherited-from-global vs explicitly-set at brand level                                   |      |
| **A5** | **Customer color preferences** (Customer > Preferences tab)                                                 |      |
| A5.1   | New Preferences tab on customer detail view                                                                 |      |
| A5.2   | Beth Meyer toggle: "Use [supplier/global] colors" / "Customize colors"                                      |      |
| A5.3   | Independent axes: favorite colors, favorite brands, favorite garments (each optional)                       |      |
| **A6** | **Inheritance propagation engine**                                                                          |      |
| A6.1   | Additive auto-propagation: new parent favorites flow to all non-customized children                         |      |
| A6.2   | Per-item inheritance tracking at each level (inherited vs explicit)                                         |      |
| A6.3   | Global config setting: "Auto-add new favorites to all customers?" (default: yes)                            |      |
| **A7** | **Removal confirmation with selective propagation**                                                         |      |
| A7.1   | Impact count preview when removing parent-level favorite: "2 suppliers and 5 customers have this color"     |      |
| A7.2   | Three-option dialog: "Remove everywhere" / "Remove from [level] only" / "Cancel"                            |      |
| A7.3   | "Customize selections" progressive disclosure with per-entity checkboxes                                    |      |

### Build Phase Mapping

| Parts  | Design Doc Phase               | Scope                                                              |
| ------ | ------------------------------ | ------------------------------------------------------------------ |
| A1, A2 | Phase 1 — UX Fixes             | Mockup with existing mock data                                     |
| A3     | Phase 2 — Global Favorites     | New settings screen                                                |
| A4     | Phase 3 — Supplier Favorites   | New brand detail view + inheritance                                |
| A5     | Phase 4 — Customer Preferences | New preferences tab + independent axes                             |
| A6, A7 | Cross-cutting                  | Built incrementally across Phases 2-4; mocked in Phase 1 if needed |

---

## Shape B: Centralized Preference Store

Single `preferences` table with scoped entries. All color preferences stored in one place, queried by entity context.

| Part   | Mechanism                                                                              | Flag |
| ------ | -------------------------------------------------------------------------------------- | :--: |
| **B1** | Preferences table: `{ entityType, entityId, scope, preferenceType, valueIds[] }`       |      |
| **B2** | Query engine: resolve applicable preferences for any entity by walking scope hierarchy |  ⚠️  |
| **B3** | Admin UI: filtered views of centralized store by entity context                        |      |
| **B4** | Inheritance via query: find parent-scope entries, merge with child overrides           |  ⚠️  |
| **B5** | Propagation via batch update: modify child rows when parent scope changes              |      |

**Why rejected** (interview D2): Over-abstract. Exposes implementation concepts (entityType, scope, preferenceType) that don't match how shop owners think. "Our Gildan favorites" becomes "preference rows where entityType=brand AND entityId=gildan AND preferenceType=color" — the indirection adds cognitive load without user benefit.

---

## Shape C: Cascading Profiles with CSS-style Override

Each level has a preference profile with specificity rules. Most-specific profile wins. Per-property override tracking with cascade resolution.

| Part   | Mechanism                                                                             | Flag |
| ------ | ------------------------------------------------------------------------------------- | :--: |
| **C1** | Profile schema: `{ level, priority, colorIds[], overrideFlags[] }`                    |      |
| **C2** | Cascade resolver: compute effective preferences by walking hierarchy with specificity |  ⚠️  |
| **C3** | Override markers: visual indicators showing which level each preference came from     |      |
| **C4** | Profile editor: edit any level's profile with real-time cascade preview               |  ⚠️  |
| **C5** | Cascade debug view: full inheritance chain visualization per color                    |      |

**Why rejected** (interview D2): Too complex for non-technical users. CSS cascade is powerful but even developers struggle with specificity. Selective propagation (R3.4) breaks the cascade model — you can't selectively remove a color from some children without adding per-entity override rules that compound specificity. The debug view (C5) is a smell: if users need to debug the system, the system is too complex.

---

## Fit Check

| Req | Requirement                                      | Status       | A   | B   | C   |
| --- | ------------------------------------------------ | ------------ | --- | --- | --- |
| R0  | Visual color filtering — swatches not text       | Core goal    | ✅  | ✅  | ✅  |
| R1  | Honest garment card colors — favorites + count   | Must-have    | ✅  | ✅  | ✅  |
| R2  | Three-level favorites hierarchy                  | Must-have    | ✅  | ✅  | ✅  |
| R3  | Safe inheritance behavior                        | Must-have    | ✅  | ✅  | ❌  |
| R4  | Non-technical usability — single-layer thinking  | Must-have    | ✅  | ❌  | ❌  |
| R5  | Graceful degradation — each level optional       | Must-have    | ✅  | ✅  | ✅  |
| R6  | Entity-context editing — edit where entity lives | Must-have    | ✅  | ✅  | ✅  |
| R7  | Configurable swatch display — flat/grouped       | Nice-to-have | ✅  | ✅  | ✅  |
| R8  | Full palette access via detail drawer            | Must-have    | ✅  | ✅  | ✅  |

**Notes:**

- C fails R3: Selective propagation (R3.4) breaks the cascade model. Removing a parent color from specific children requires per-entity override rules that compound specificity, defeating the simplicity goal.
- B fails R4: Centralized store abstractions (entityType, scope, preferenceType) leak through admin interfaces. Debugging becomes "which rows affect this entity?" instead of "what's on this entity's favorites list?"
- C fails R4: Cascade specificity is inherently technical. Needing a debug view (C5) to understand behavior is a usability failure for shop owners.

**Selected: Shape A** — only shape that passes all requirements. Entity-owned data matches the shop owner's mental model. Live inheritance provides the propagation behavior without exposing cascade complexity.

---

## Decision Points Log

| #   | Decision                  | Outcome                                                             | Rationale                                                                        |
| --- | ------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| D1  | Data model approach       | A (entity-owned) over B (centralized) and C (cascading)             | Interview D2: mirrors how shop owners think; each entity self-contained          |
| D2  | Inheritance model         | Live inheritance with override preservation (Figma model)           | UX research: industry consensus across Figma, Unity, Google Workspace, CrashPlan |
| D3  | Inheritance control UX    | Beth Meyer toggle ("Use parent colors" / "Customize")               | Interview D7: simple binary choice non-technical users understand                |
| D4  | Favorite indication       | Section grouping, not star overlays                                 | Interview D8: "just have the color swatches in a favorites section"              |
| D5  | Propagation asymmetry     | Additive = auto, removal = confirm                                  | UX research: NNg guidelines + industry consensus (low-risk vs high-risk)         |
| D6  | Removal UX                | Three-option dialog + "Customize selections" progressive disclosure | Interview D9: selective propagation with per-entity checkboxes                   |
| D7  | Swatch display default    | Flat grid (Sammar-style)                                            | Interview D10: Gary's explicit preference                                        |
| D8  | Where each level lives    | Global→Settings, Supplier→Garments, Customer→Customer detail        | Interview D11: "edit where you'd naturally go for that entity"                   |
| D9  | Brand detail view pattern | Drawer in garments section (consistent with garment detail)         | Spike A4.1: no existing sub-routing; drawer matches P1.1 pattern                 |
| D10 | Customer preference axes  | Independent (colors, brands, garments each optional)                | Interview D14: "If I just want a favorite garment type, I can do that"           |
| D11 | Level requirement         | None — each level optional                                          | Interview D12: graceful degradation from 0 to 3 levels                           |
| D12 | Auto-propagation default  | Configurable setting, default yes                                   | Interview D13: new favorites flow everywhere, customers can remove individually  |
