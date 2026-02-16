---
shaping: true
---

# DTF Gang Sheet Builder — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| **R0** | **Gary can create DTF film-only quotes with auto-arranged gang sheet layouts in SPP** | Core goal |
| **R1** | **Quoting architecture supports multiple service types** | Must-have |
| R1.1 | A single quote can contain screen print + DTF + embroidery as separate tabs/steps | Must-have |
| R1.2 | Switching tabs preserves all entered data (no data loss) | Must-have |
| R1.3 | Each service type has a "complete" confirmation; quote can't finalize until all are done | Must-have |
| R1.4 | Existing screen print quote flow is minimally changed (remove per-line-item service type selector, move to tabs) | Must-have |
| **R2** | **DTF line items follow content-first workflow** | Must-have |
| R2.1 | User picks images, sets size + quantity per image; each combination is a line item | Must-have |
| R2.2 | Standalone size presets in line item form (3 categories: small/medium/large + custom entry); NOT tied to artwork schema | Must-have |
| R2.3 | Split/Combine toggle controls whether line items share sheets or get individual sheets | Must-have |
| **R3** | **Sheet optimization calculates cheapest arrangement** | Must-have |
| R3.1 | System auto-calculates optimal sheet size(s) from line items | Must-have |
| R3.2 | Optimizes for minimum total cost, not just minimum waste (may split across 2 smaller sheets if cheaper) | Must-have |
| R3.3 | Enforces DTF spacing standards: 1/2" minimum margin, 1" recommended between designs and from edges | Must-have |
| **R4** | **Visual confirmation of gang sheet layout** | Must-have |
| R4.1 | Read-only canvas showing design positions on 22"-wide sheet(s) | Must-have |
| R4.2 | Space utilization indicator (percentage of sheet used) | Must-have |
| R4.3 | Multi-sheet pagination when designs span multiple sheets | Must-have |
| **R5** | **Production integration for DTF jobs** | |
| R5.1 | Multi-service-type quotes spawn sibling jobs per service type, linked together | Out (separate vertical) |
| R5.2 | Shipping gate: all sibling jobs must reach Review before any can move to Done | Out (separate vertical) |
| R5.3 | DTF jobs use simplified production steps: Gang sheet prepared > DTF printed > QC passed > Shipped | Must-have |
| **R6** | **Demo-ready for Feb 21 with mock data** | Must-have |

---

## Decision Points Log

| # | Decision | Outcome | Date |
|---|----------|---------|------|
| 1 | Content-first vs container-first | Content-first (interview) | 2026-02-15 |
| 2 | DTF film-only vs DTF+Press for demo scope | Film-only only (DTF+Press backlogged) | 2026-02-15 |
| 3 | Interactive vs read-only canvas for demo | Read-only (interactive is Phase 2) | 2026-02-15 |
| 4 | Cost optimization vs space optimization | Cost optimization (cheaper > less waste) | 2026-02-15 |
| 5 | Shape selection | **Shape D** — Tabs + full DTF experience, defer sibling jobs | 2026-02-15 |
| 6 | Sibling jobs + shipping gate scope | Out — separate vertical after demo | 2026-02-15 |
| 7 | Artwork size templates approach | Standalone presets in line item form, NOT tied to artwork schema. Artwork model overhaul is a separate future effort. | 2026-02-15 |
| 8 | Requirement statuses finalized | R1-R4 Must-have, R5.1-R5.2 Out, R5.3 Must-have | 2026-02-15 |

---

## Existing System Context

### Quote Schema (current)

- `quoteLineItemSchema` has `serviceType` per line item (screen-print | dtf | embroidery)
- No concept of service-type-level grouping or tabs
- DTF line items use same garment-oriented schema (garmentId, colorId, sizes, printLocationDetails)
- This doesn't fit DTF film-only: no garment, no sizes record, no print locations

### DTF Pricing Schema (current)

- `dtfSheetTierSchema`: width=22 (fixed), length, retailPrice, contractPrice
- `dtfPricingTemplateSchema`: sheetTiers array, rushFees, filmTypes, customerTierDiscounts, costConfig
- Sheet tiers already exist with pricing data — the builder consumes these

### Key Gap

The quote line item schema is garment-oriented. DTF film-only line items are image-oriented (image + size + quantity, no garment). The quote needs either:
- A separate DTF line item schema alongside the existing one
- A polymorphic line item that adapts per service type

---

## A: Full Three Waves (Complete Interview Vision)

Build everything from the 3-wave plan: multi-service tabs, DTF line items, cost optimization, bin-packing, visual canvas, sibling jobs, shipping gate.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Service type tab navigation in quote builder** | |
| A1.1 | Tab bar component at top of `/quotes/new` with service type icons | |
| A1.2 | Tab state preservation: each tab's form data lives in parent state, tabs switch views without unmounting | |
| A1.3 | Per-tab completion badge (checkmark when service type section is valid) | |
| A1.4 | "Add service type" button to enable additional tabs on existing draft | |
| **A2** | **DTF line item builder** | |
| A2.1 | DTF-specific line item schema: artworkId + width + height + quantity (no garment) | |
| A2.2 | Line item form: artwork picker, size template dropdown (custom labels), quantity input | |
| A2.3 | Dynamic line item list: add/remove/reorder | |
| **A3** | **Sheet optimization algorithm** | |
| A3.1 | Shelf-packing: place designs left-to-right, top-to-bottom with 1" margins on 22"-wide sheet | |
| A3.2 | Cost comparison: evaluate 1 sheet at tier N vs. 2 sheets at lower tiers, pick cheapest | |
| A3.3 | Consume existing `dtfSheetTierSchema` pricing data | |
| **A4** | **Read-only visual canvas** | |
| A4.1 | SVG element scaled to viewport, 22" width, variable height per sheet | |
| A4.2 | Design thumbnails as positioned rectangles with image preview | |
| A4.3 | Spacing indicators and sheet boundary visualization | |
| A4.4 | Multi-sheet tabs when designs span multiple sheets | |
| **A5** | **Sibling job creation** | |
| A5.1 | When multi-service quote is accepted, create one job per service type | ⚠️ |
| A5.2 | Jobs linked via `siblingJobIds` array | ⚠️ |
| A5.3 | Shipping gate: block transition to Done if any sibling is pre-Review | ⚠️ |
| **A6** | **DTF production steps** | |
| A6.1 | Simplified step set for DTF jobs: Gang sheet prepared > DTF printed > QC passed > Shipped | |
| A6.2 | Job card displays DTF-specific steps instead of screen print steps | |
| **A7** | **Artwork model update** | |
| A7.1 | Artwork schema extended with service-type-specific metadata | ⚠️ |
| A7.2 | DTF artwork: size templates array (label + width + height) | ⚠️ |
| A7.3 | Screen print artwork: positioning metadata (placement + distance from collar) | ⚠️ |

**Risk**: 7 major parts across 3 waves in 6 days. A5 (sibling jobs) and A7 (artwork model) both have flagged unknowns. High scope risk.

---

## B: DTF-Only Quote Flow (Bypass Multi-Service Architecture)

Skip service type tabs entirely. Create a dedicated DTF quote entry point. The existing `/quotes/new` stays untouched for screen print. All 6 days focus on the DTF experience.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | **DTF quote entry point** | |
| B1.1 | "New DTF Quote" button on Quotes List, routes to `/quotes/new?type=dtf` | |
| B1.2 | DTF quote form replaces the standard form when `type=dtf` query param present | |
| **B2** | **DTF line item builder** (same as A2) | |
| B2.1 | DTF-specific line item schema: artworkId + width + height + quantity | |
| B2.2 | Line item form: artwork picker, size template dropdown, quantity input | |
| B2.3 | Dynamic line item list: add/remove/reorder | |
| **B3** | **Sheet optimization algorithm** (same as A3) | |
| B3.1 | Shelf-packing with 1" margins on 22"-wide sheet | |
| B3.2 | Cost comparison across sheet tiers | |
| B3.3 | Consume existing `dtfSheetTierSchema` pricing data | |
| **B4** | **Read-only visual canvas** (same as A4) | |
| B4.1 | SVG canvas showing arranged designs | |
| B4.2 | Design thumbnails, spacing indicators, sheet boundary | |
| B4.3 | Multi-sheet tabs | |
| **B5** | **DTF production steps** (same as A6) | |
| B5.1 | Simplified DTF steps on job cards | |

**Risk**: Doesn't support mixed quotes (screen print + DTF in one quote). Gary confirmed he needs this. Creates a separate DTF silo that must be refactored later to integrate with multi-service tabs.

---

## C: Tabs + DTF Core, Defer Canvas and Sibling Jobs

Build the service type tab architecture and DTF line item builder with cost optimization, but defer the visual canvas and sibling job creation. The demo shows: "I can create DTF quotes with proper line items, and the system calculates the optimal sheet configuration and price."

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **C1** | **Service type tab navigation** (same as A1) | |
| C1.1 | Tab bar at top of `/quotes/new` | |
| C1.2 | Tab state preservation | |
| C1.3 | Per-tab completion badge | |
| C1.4 | Add service type button | |
| **C2** | **DTF line item builder** (same as A2) | |
| C2.1 | DTF-specific line item schema | |
| C2.2 | Line item form with artwork picker, size template, quantity | |
| C2.3 | Dynamic line item list | |
| **C3** | **Sheet optimization algorithm** (same as A3) | |
| C3.1 | Shelf-packing with 1" margins | |
| C3.2 | Cost comparison across tiers | |
| C3.3 | Consume existing pricing data | |
| **C4** | **Sheet calculation results (text, not canvas)** | |
| C4.1 | Summary card: "2 sheets: 22x48 ($X) + 22x24 ($Y) = $Total" | |
| C4.2 | Per-sheet breakdown listing which designs are on each sheet | |
| C4.3 | Space utilization percentage per sheet | |
| **C5** | **DTF production steps** (same as A6) | |
| C5.1 | Simplified DTF steps on job cards | |

**Risk**: No visual canvas means Gary can't visually confirm the arrangement. The "wow" factor of seeing designs arranged on a sheet is missing. The cost calculation story is there but it's less tangible without the visual.

---

## D: Tabs + Full DTF Experience, Defer Sibling Jobs

Build service type tab architecture + complete DTF workflow including visual canvas. Defer sibling jobs and shipping gate (production integration). Demo shows the full quote-to-layout flow, but doesn't show what happens when the quote becomes jobs.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **D1** | **Service type tab navigation** (same as A1) | |
| D1.1 | Tab bar at top of `/quotes/new` | |
| D1.2 | Tab state preservation | |
| D1.3 | Per-tab completion badge | |
| D1.4 | Add service type button | |
| **D2** | **DTF line item builder** (same as A2) | |
| D2.1 | DTF-specific line item schema | |
| D2.2 | Line item form with artwork picker, size template, quantity | |
| D2.3 | Dynamic line item list | |
| **D3** | **Sheet optimization algorithm** (same as A3) | |
| D3.1 | Shelf-packing with 1" margins | |
| D3.2 | Cost comparison across tiers | |
| D3.3 | Consume existing pricing data | |
| **D4** | **Read-only visual canvas** (same as A4) | |
| D4.1 | SVG canvas showing arranged designs | |
| D4.2 | Design thumbnails, spacing indicators, sheet boundary | |
| D4.3 | Multi-sheet tabs | |
| **D5** | **DTF production steps** (same as A6) | |
| D5.1 | Simplified DTF steps on job cards | |
| **D6** | **Standalone DTF size presets** | |
| D6.1 | 3 preset size categories in line item form: "Small/Collectibles" (4x4"), "Medium/Pocket" (6x6"), "Large/Shirts" (10x12") + custom entry | |
| D6.2 | Size selector is a property of the line item, not the artwork — user picks artwork, then picks size separately | |

**Why not sibling jobs?** Sibling job creation (A5) has 3 flagged unknowns and requires changes to the job schema, Kanban board, and job detail page. It's architecturally significant but invisible to the quoting demo flow. Gary won't be demoing "accept quote and watch jobs appear" — he'll be demoing "build a DTF quote and see the gang sheet layout." Sibling jobs are a separate vertical after the demo.

**Why standalone size presets instead of artwork schema integration?** Instead of a full artwork model update with service-type-specific metadata (A7, 3 flagged unknowns), D6 provides standalone size presets in the DTF line item form. The artwork picker shows customer artwork, but size is selected separately — it's a line item property, not an artwork property. Later, a separate effort updates the artwork schema to store DTF size templates per artwork item, then the line item form pulls presets from artwork metadata instead of hardcoded options. No rework needed — just changing where the dropdown options come from.

---

## Fit Check

| Req | Requirement | Status | A | B | C | D |
|-----|-------------|--------|---|---|---|---|
| **R0** | Gary can create DTF film-only quotes with auto-arranged gang sheet layouts in SPP | Core goal | ✅ | ✅ | ✅ | ✅ |
| **R1** | Quoting architecture supports multiple service types | Must-have | | | | |
| R1.1 | Single quote can contain screen print + DTF + embroidery as separate tabs | Must-have | ✅ | ❌ | ✅ | ✅ |
| R1.2 | Switching tabs preserves all entered data | Must-have | ✅ | ❌ | ✅ | ✅ |
| R1.3 | Per-service-type completion confirmation; can't finalize until all done | Must-have | ✅ | ❌ | ✅ | ✅ |
| R1.4 | Existing screen print flow minimally changed | Must-have | ✅ | ✅ | ✅ | ✅ |
| **R2** | DTF line items follow content-first workflow | Must-have | | | | |
| R2.1 | User picks images, sets size + quantity; each = line item | Must-have | ✅ | ✅ | ✅ | ✅ |
| R2.2 | Standalone size presets in line item form (3 categories + custom); NOT tied to artwork schema | Must-have | ✅ | ✅ | ✅ | ✅ |
| R2.3 | Split/Combine toggle for multi-sheet control | Must-have | ✅ | ✅ | ✅ | ✅ |
| **R3** | Sheet optimization calculates cheapest arrangement | Must-have | | | | |
| R3.1 | Auto-calculate optimal sheet size(s) | Must-have | ✅ | ✅ | ✅ | ✅ |
| R3.2 | Cost optimization over space optimization | Must-have | ✅ | ✅ | ✅ | ✅ |
| R3.3 | DTF spacing standards enforced (1/2" min, 1" recommended) | Must-have | ✅ | ✅ | ✅ | ✅ |
| **R4** | Visual confirmation of gang sheet layout | Must-have | | | | |
| R4.1 | Read-only canvas showing design positions on 22"-wide sheet(s) | Must-have | ✅ | ✅ | ❌ | ✅ |
| R4.2 | Space utilization indicator | Must-have | ✅ | ✅ | ✅ | ✅ |
| R4.3 | Multi-sheet pagination | Must-have | ✅ | ✅ | ❌ | ✅ |
| **R5** | Production integration for DTF jobs | | | | | |
| R5.1 | Multi-service quotes spawn sibling jobs per service type | Out (separate vertical) | — | — | — | — |
| R5.2 | Shipping gate for sibling jobs | Out (separate vertical) | — | — | — | — |
| R5.3 | DTF jobs use simplified production steps | Must-have | ✅ | ✅ | ✅ | ✅ |
| **R6** | Demo-ready for Feb 21 with mock data | Must-have | ❌ | ✅ | ✅ | ✅ |

**Notes:**
- B fails R1.1-R1.3: Deliberately bypasses multi-service architecture. Creates a separate DTF silo.
- C fails R4.1, R4.3: No visual canvas — shows text-based sheet breakdown only.
- A fails R6: 7 major parts + flagged unknowns in 6 days is not realistic. High risk of incomplete demo.
- R5.1, R5.2 marked Out — sibling jobs and shipping gate are a separate vertical after demo.
- D's size presets (D6) are standalone in the line item form. Artwork schema integration is a separate future effort.

---

## Selected Shape: D

**Shape D: Tabs + Full DTF Experience, Defer Sibling Jobs**

D passes all Must-have requirements (R0-R4, R5.3, R6). It delivers the full demo experience — multi-service tabs, content-first DTF line items, cost optimization, and visual canvas — without the production integration that requires a separate vertical.

### Deferred to Separate Verticals

| Deferred Item | Vertical | Why Separate |
|---------------|----------|--------------|
| Sibling jobs (R5.1) | Jobs/Production | Requires job schema changes, Kanban board updates, job detail page changes |
| Shipping gate (R5.2) | Jobs/Production | Depends on sibling jobs; production-side concern |
| Artwork model overhaul | Artwork/Customer | Schema change + UI across multiple screens; D6 standalone presets sufficient for demo |
| DTF+Press service type | DTF Phase 2 | Different workflow (garment selection + pressing); needs own spike |

### Shape D Parts (Selected)

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **D1** | **Service type tab navigation** | |
| D1.1 | Tab bar at top of `/quotes/new` | |
| D1.2 | Tab state preservation | |
| D1.3 | Per-tab completion badge | |
| D1.4 | Add service type button | |
| **D2** | **DTF line item builder** | |
| D2.1 | DTF-specific line item schema | |
| D2.2 | Line item form with artwork picker, size preset, quantity | |
| D2.3 | Dynamic line item list | |
| **D3** | **Sheet optimization algorithm** | |
| D3.1 | Shelf-packing with 1" margins | |
| D3.2 | Cost comparison across tiers | |
| D3.3 | Consume existing pricing data | |
| **D4** | **Read-only visual canvas** | |
| D4.1 | SVG canvas showing arranged designs | |
| D4.2 | Design thumbnails, spacing indicators, sheet boundary | |
| D4.3 | Multi-sheet tabs | |
| **D5** | **DTF production steps** | |
| D5.1 | Simplified DTF steps on job cards | |
| **D6** | **Standalone DTF size presets** | |
| D6.1 | 3 preset size categories: "Small/Collectibles" (4x4"), "Medium/Pocket" (6x6"), "Large/Shirts" (10x12") + custom entry | |
| D6.2 | Size selector is a property of the line item, not the artwork | |

No flagged unknowns (⚠️). All mechanisms are concretely understood.

---

## Shape Comparison Summary (for reference)

| Shape | Scope | Demo Impact | Risk | Refactor Cost Later |
|-------|-------|-------------|------|---------------------|
| **A** | Everything | Highest (if finished) | Very high — 7 parts, 6 flags, 6 days | None |
| **B** | DTF only, no tabs | High for DTF, misses integration story | Low | High — must rebuild into tabs later |
| **C** | Tabs + DTF math, no canvas | Medium — numbers without visuals | Low | Low — add canvas layer later |
| **D** | Tabs + full DTF + canvas | High — the visual layout is the "wow" | Medium | Low — add sibling jobs later |
