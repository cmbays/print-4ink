---
title: "Garment Catalog & Screen Intelligence — Vertical Discovery"
subtitle: "4-agent research team + owner interview reshapes scope: drop Screen Room vertical, go deep on Garment Catalog, derive screen data from jobs"
date: 2026-02-14
phase: 1
pipelineName: garments
pipelineType: vertical
products: [garments, screens]
tools: []
stage: research
tags: [research, decision]
sessionId: "screen-garment-discovery-2026-02-14"
branch: "main"
status: complete
---

## Summary

Ran a 4-agent parallel research team to perform vertical discovery on the two remaining Phase 1 verticals: Screen Room and Garment Catalog. The ROADMAP described both as "simple" builds. Research found Screen Room is a blue ocean (zero competitors) and Garment Catalog UX is universally mediocre.

**Key outcome: Owner interview pivoted the strategy.** Screen Room dropped as a standalone vertical. Screen data becomes customer-level intelligence derived from jobs. Garment Catalog becomes the primary build with deeper scope: global library, customer favorites, enable/disable scoping, image propagation, and supplier API-ready architecture.

## Research Phase (4 Parallel Agents)

| Agent | Focus | Key Finding |
|-------|-------|-------------|
| **competitor-analyst** | 9 competitors (6 direct + 3 adjacent) | Screen room = blue ocean. Zero competitors offer it. |
| **ux-researcher** | UI/UX from manufacturing + wholesale catalog tools | 20 design decisions identified. Table+Kanban for screens, card grid for garments. |
| **user-researcher** | Project data + industry forums | Schema gaps: `jobId` required on screens (bug), 3 vs 7 burn states, raw IDs on Job Detail. |
| **devils-advocate** | Challenge "simple" assumption | 2 showstoppers, 15 risks. 10hrs unrealistic — empirical data says 14-20hrs for full scope. |

**112KB of research across 4 reports.** Full reports archived at `/tmp/discovery-*.md`.

## Interview Decisions

### Decision 1: Drop Screen Room Vertical

**Context**: Research found zero competitors offer screen room management, and customers don't ask for it. The synergy question — "does standalone screen management software create value connected to the rest of the app?" — didn't have a compelling answer for a 1-3 person shop.

**Decision**: No `/screens` page. Instead, screen data becomes **derived customer intelligence** from completed jobs.

**Rationale**:
- For small shops, software-based screen tracking adds friction that exceeds the visibility gained
- The physical 4-cart system (Speed/Take/Clean/Drying) works because it's zero-friction
- The valuable parts of screen management (job readiness, repeat order reuse) are job metadata and customer intelligence, not a standalone vertical
- A whiteboard in the screen room may genuinely be more efficient than a software page

### Decision 2: Screen Data as Customer Intelligence

**Design**: When a job completes, we know what screens were used (artwork + colors + mesh = screen record). This data auto-populates on the **Customer Detail page** as a new "Screens" tab.

**UX flow**:
- Screens auto-appear from completed jobs — zero operator effort to add
- Screens are assumed to exist until manually removed/retired by the operator
- When creating a quote for a repeat customer with existing screens: "You've used this screen before for [artwork]. Still have it? Apply a discount on screen setup."
- Smart reuse detection reduces costs (emulsion, film, burn time)

**Schema**: Screens become a derived record — artwork reference, colors, mesh count, job link, date created. No lifecycle states, no manual tracking.

### Decision 3: Garment Catalog as Global Library

**Design**: The garment catalog is a **global library for the app** — not just a page, but a data foundation that surfaces throughout quotes, jobs, customer pages, and anywhere garments appear.

**Core concept**:
- Supplier API-ready architecture (mock data now, S&S/SanMar/AlphaBroder feeds in Phase 2+)
- Well-organized browsing: categories (tees, hoodies, hats, etc.), brands, search
- **Images are critical** and must propagate everywhere — quotes, jobs, customer pages all show garment images from the catalog
- Note: S&S Activewear acquired AlphaBroder (Aug 2024) — fewer APIs to integrate, but build vendor-agnostically

### Decision 4: Enable/Disable Scoping

**Design**: Garments can be enabled or disabled to control what shows up as options in the quoting flow and other selection UIs.

**UX principle**: Optional configuration. If the shop owner never touches enable/disable, nothing breaks — all garments remain available. But if they want to curate their catalog down to the 30 styles they actually sell, they can.

### Decision 5: Customer-Level Favorites

**Design**: Inline, contextual favoriting of garments AND colors per customer.

**UX flow**:
- Star icon on garments and colors **wherever you encounter them** — on a quote, job, customer page, catalog
- Not a settings page — it's "I'm touching this thing and working on it, and I remember this customer always orders this"
- Favorites float to the top of selection lists when building a quote for that customer
- Optional auto-detection: "This customer has ordered Gildan 5000 Black 3 times" → suggest favoriting

**Schema addition**: Customer-level `favoriteGarments` (garment IDs) and `favoriteColors` (per-garment color IDs).

### Decision 6: User Settings Pattern

**Architecture established**:
- **Page-level preferences**: Settings that affect only one area live on that page (gear icon, toggle). Example: "Show wholesale prices" on the garment catalog.
- **Global settings** (`/settings`): Settings that affect multiple areas. Example: currency format, date format, default view modes.
- **Rule of thumb**: If toggling it would surprise you on another page, it's global. If it only matters here, it's local.
- Garment catalog price visibility → page-level preference (toggle on the catalog page)

### Decision 7: Build First, Demo All (Option A)

**Decision**: Build the Garment Catalog and customer screen intelligence, then demo all verticals to Gary together. Gary won't know exactly what he wants from abstract questions — he needs something concrete to react to.

### Decision 8: Cross-Linking Polish

**Decision**: Include cross-vertical linking (#65, #66, #68) in this build to make the demo feel connected:
- #65: Dashboard job rows → clickable to `/jobs/[id]`
- #66: Customer Detail job rows → clickable to `/jobs/[id]`
- #68: Invoice Detail → linked job display with link

**Deferred**: #67 (Quote → Create Job) is a separate feature — too complex for this scope.

## Competitive Landscape Summary

### Screen Room: Blue Ocean (Validated, Then Pivoted)

Zero of 9 competitors offer dedicated screen room management:
- **PrintLife**: No screen features
- **Printavo**: Can store mesh info as reference, no tracking
- **ShopVOX**: Visual production boards, no screen management
- **Teesom**: Claims "#1 Screen Printing Software" — zero screen room features
- **YoPrint**: Modern UI, no screen tracking
- **DecoNetwork**: Production calendar, no screen management
- **OnSite/ShopWorx**: Closest — stores screen data as **job metadata** (not tracked assets)
- **Katana MRP**: Best pattern source (serial tracking, bin locations, BOM linking)

**Conclusion**: Blue ocean confirmed, but the owner interview revealed that standalone screen management doesn't synergize enough with the app for a small shop. The valuable part (screen reuse intelligence) is better served as customer-level data.

### Garment Catalog: Differentiate on UX

All competitors have vendor catalog integration. None have a **delightful browsing experience**.

| Competitor | Strength to Learn From |
|------------|----------------------|
| **Teesom** | Best live vendor integration (real-time stock, vendor swapping, unified codes) |
| **InkSoft** | Best catalog browsing UX (visual, category-organized, recommended products) |
| **YoPrint** | Best modern UI (sets the design bar for the market) |
| **ShopVOX** | Best purchase order workflow (auto-PO, cross-order consolidation, 8+ vendors) |
| **S&S Activewear** | Category-first nav, color swatches, warehouse-level stock — the catalog UX to beat |

## Final Build Scope

### What We're Building

**1. Garment Catalog (`/garments`)**
- Responsive card grid with product images, color swatches, brand/style info
- Table toggle for management view
- Category tabs (tees, hoodies, hats, etc.) + brand/color/size filters + typeahead search
- Enable/disable per garment (scoping what surfaces as options)
- Detail drawer with size/color matrix, product specs, linked jobs
- Page-level preference: show/hide wholesale prices
- Supplier API-ready data architecture
- Expanded mock data (15+ garments across all categories)

**2. Customer Favorites**
- Schema: `favoriteGarments` + `favoriteColors` per customer
- Inline star icon on garments/colors from any context (quote, job, customer page, catalog)
- Favorites float to top of selection lists in quote builder
- Future: auto-detection from order history

**3. Customer Screens Tab**
- New tab on Customer Detail page
- Auto-populated from completed jobs (artwork + colors + mesh + date + job link)
- Screens persist until manually removed
- Foundation for smart reuse prompts in quoting (Phase 2 logic)

**4. Cross-Vertical Linking (#65, #66, #68)**
- Dashboard → Jobs clickable links
- Customer Detail → Jobs clickable links
- Invoice Detail → Job linked display

**5. User Settings Foundation**
- Page-level preference pattern (local toggle)
- Garment catalog price visibility as first implementation

**6. Schema + Data Fixes**
- Customer schema: add favorites fields
- Garment catalog schema: add `isEnabled` field
- Create `getGarmentById()`, `getColorById()` lookup helpers
- Fix Job Detail raw garment/color ID display
- Expand mock garment data (5 → 15+ across all categories)
- Simplify screen schema to derived record for customer intelligence

### What We're NOT Building
- ~~Screen Room vertical~~ (`/screens`) — replaced by customer-level screen intelligence
- ~~Screen lifecycle management~~ — no states, no tracking, derived data only
- ~~Quote-to-Job conversion~~ (#67) — separate feature
- ~~Vendor API integration~~ — Phase 2+ (architecture-ready only)

## UX Architecture Decisions

### Garment Catalog
- **Primary view**: Card grid (visual browsing with images + swatches)
- **Secondary view**: Table toggle (management, bulk operations)
- **Organization**: Category-first → brand grouping within categories
- **Detail**: Side drawer (Linear-style, keeps browse context visible)
- **Filters**: Category tabs + faceted filters + active filter pills + URL state
- **Images**: Critical — propagate to quotes, jobs, customer pages
- **Design layers**: Linear Calm base (monochrome cards), Raycast Polish (smooth transitions, glass drawer), Neobrutalist accent (bold CTA shadow, spring card hover)

### Settings Pattern
- **Page-level**: Gear icon or toggle on the page, stored in localStorage
- **Global**: Future `/settings` page for cross-cutting preferences
- **First implementation**: "Show wholesale prices" toggle on garment catalog

## Risk Assessment (Updated Post-Interview)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Job Detail shows raw garment/color IDs | High | Fix with lookup helpers as part of this build |
| Mock data too sparse (5 garments) | Medium | Expand to 15+ across all categories |
| Customer favorites schema touches existing customer vertical | Medium | Additive fields only, no breaking changes |
| Image propagation requires component updates across verticals | Medium | Create shared GarmentImage component, update incrementally |
| Enable/disable scoping affects quote builder garment selection | Medium | Filter at the data layer, quote builder consumes filtered list |
| Screen-as-derived-data needs clear job completion hook | Low | Phase 1 mock data, Phase 2 real job completion triggers |

## Gary Interview Questions (Retained for Demo)

### Garment Catalog
1. How many different garment styles do you regularly use?
2. Do customers pick the garment, or do you recommend?
3. Do you stock blanks or order per-job?
4. Which vendors do you use most?
5. How do you currently look up garment pricing?
6. When building a quote, how do you pick the garment?
7. Would you want to curate which garments show up as options?

### Customer Favorites
8. Do repeat customers tend to order the same garments and colors?
9. How do you remember what they usually order? (Memory, notes, old quotes?)

### Screen Reuse
10. Do you keep screens for repeat customers, or always reclaim?
11. How do you know if you still have a customer's screen?
12. Would a "you've used this before" prompt during quoting be useful?

## Next Steps

1. **Breadboarding** — Map all places, affordances, wiring for the Garment Catalog build
2. **Schema work** — Customer favorites, garment `isEnabled`, lookup helpers, mock data expansion
3. **Build** — Garment Catalog pages + Customer Screens tab + cross-linking + settings foundation
4. **Quality gate** — 10-category audit per existing standards
5. **Demo prep** — All 7 verticals (5 existing + garment catalog + customer screens) ready for Gary

## Research Artifacts

| File | Size | Content |
|------|------|---------|
| `/tmp/discovery-competitor-analysis.md` | 30KB | 9-competitor breakdown, feature matrix, market gaps, pricing |
| `/tmp/discovery-ux-best-practices.md` | 42KB | UI patterns from 25+ tools, recommendations, anti-patterns |
| `/tmp/discovery-user-needs.md` | 20KB | User workflows, schema analysis, pain points, interview questions |
| `/tmp/discovery-devils-advocate.md` | 20KB | Assumptions challenged, risks, revised scope, time estimates |
