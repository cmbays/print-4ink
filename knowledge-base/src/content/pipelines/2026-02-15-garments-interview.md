---
title: "Garments Vertical — Requirements Interview"
subtitle: "Structured interview validates catalog design, confirms mockup quality as demo showpiece, surfaces customer-supplied garment and screen cost intelligence needs"
date: 2026-02-15
phase: 1
pipelineName: garments
pipelineType: vertical
products: [garments, customers, screens]
tools: []
stage: interview
tags: [decision, research]
sessionId: "0ba68ef8-1b02-40be-a039-2c63d6d15cd1"
branch: "session/0214-garments-interview"
status: complete
---

## Summary

Conducted a structured requirements interview to validate the garment catalog design decisions made during the 4-agent research phase. The interview confirmed our core architecture is correct and surfaced several new insights about workflow, priorities, and edge cases.

**Key outcome**: Mockup visual quality is the #1 demo showpiece. Images are non-negotiable table stakes. Customer favorites are the competitive differentiator. PrintLife's API-driven auto-refresh sets the expectation bar for Phase 2.

## Interview Findings

### Catalog Size & Selection

- **10-30 active styles** in a typical month — validates our 15+ mock data expansion
- **Shop owner recommends garments** (customers don't specify) — makes catalog browsing UX critical
- Selection factors (in priority order): fabric feel/weight → price/budget → print method compatibility → color/size availability
- **Gap identified**: Current filters focus on category/brand/color. Need **weight** and **fabric type** as filter facets since those are the primary recommendation drivers.

### Suppliers & Sourcing

- **S&S Activewear + SanMar** are the two distributors used
- Stocks **core styles + extras** from previous orders/events — light inventory awareness could be valuable in Phase 2
- Orders placed through distributor websites (not automated) — Phase 2 API ordering would be a significant upgrade
- **PrintLife already has API integration** with auto-refreshing garment data — this is the baseline expectation, not a wow feature

### PrintLife Competitive Intelligence

| PrintLife Does Well | PrintLife Does Poorly |
|--------------------|--------------------|
| Auto-updated pricing from distributors | Hard to browse/find styles |
| Real-time color/size availability | Can't save customer favorites |

**Our strategy**: Match PrintLife on API data (Phase 2), beat them on browsing UX and customer favorites (Phase 1 differentiators).

### Additional PrintLife Pain Points (from quoting flow)

- **Color picker**: Too much white space between swatches. Gary preferred our tighter layout.
- **Premature recalculation**: Fields recalculate before user can tab to next input. Must debounce or recalc on blur, not keystroke. (Quoting-only issue, not catalog.)
- **Multi-screen flow**: PrintLife requires back-and-forth between screens during quoting. User wants single continuous flow with progressive disclosure.
- **Switching inertia**: Gary is comfortable with PrintLife. Our polish bar must be high enough to overcome switching friction.

### Repeat Customer Patterns

Two primary reorder patterns:
1. **Same garments, different designs** — locked into a blank, new artwork each time
2. **Same styles, rotating color set** — stick with a style, pick from their known palette per design

**Recall method**: Memory first, then looking up old quotes/invoices as backup.

Maps perfectly to our two-level favorites: garment-level stars + per-garment color stars.

### Customer-Supplied Garments

- Happens **~once per month** — not common but needs support
- Pricing varies: ranges from same print price (no garment markup) to adding a flat handling fee, depending on contract
- **Schema implication**: Need a "customer-supplied" flag on garment line items that skips cost lookup but captures garment info for production settings

### Screen Retention & Cost

- Screen retention is **customer-dependent** — regulars kept longer, one-offs reclaimed fast
- Physical storage space is **not** a constraint
- **Cost of idle screens IS** a constraint — capital tied up in stored screens matters
- Insight: A screen reclamation dashboard showing idle screens (not reused in X months) could save money

### Feature Priority Stack

| Priority | Feature | Role |
|----------|---------|------|
| 1 | **Garment images everywhere** | Non-negotiable table stakes — PrintLife already does this |
| 2 | **Fast garment lookup** | Must BEAT PrintLife, not just match |
| 3 | **Customer favorites** | THE differentiator — what PrintLife can't do |
| 4 | **Enable/disable scoping** | Important when API data arrives (Phase 2) |

### Mockup Requirements

Two-layer image system:
1. **Product photos + color-matched swatches** — In catalog and garment references. Photo updates when swatch is selected.
2. **Realistic mockup composition** — Artwork overlaid on colored garment at correct print location. Must be color-accurate.

**Critical in both customer-facing AND internal use.** The mockup should be live during quote building:
- Pick garment → see image
- Pick color → image updates
- Add artwork → design overlays
- Review tab → full mockup visible
- Send to customer → same mockup

### Demo Showpiece

**The #1 wow moment for Gary**: Seeing a realistic mockup of his design on a colored garment. The mockup composition engine's visual quality is the highest-leverage thing to polish for the demo.

## Decisions

### D1: Weight/Fabric Filters Needed

Current catalog filters are category/brand/color. Since the owner recommends garments primarily by **fabric feel and weight**, these need to become first-class filter facets. Add to schema and filter UI.

### D2: Customer-Supplied Garment Support

Add a `customerSupplied` boolean flag to garment line items in quotes/jobs. When true:
- Skip garment cost in pricing
- Still capture garment info (style, fabric type, weight) for production
- Allow optional flat handling fee

### D3: Mockup Quality is Demo Priority

The mockup composition engine's output quality is the #1 thing to polish before the Gary demo. A realistic design-on-colored-garment mockup is the moment that sells the product.

### D4: API Integration is Expectation, Not Innovation

PrintLife already has auto-refreshing garment data via API. Our Phase 2 API integration (S&S + SanMar) is matching expectations, not exceeding them. Our differentiation comes from browsing UX and customer favorites.

## Gary Questions

<div class="gary-question" data-question-id="garments-q4" data-pipeline="garments" data-status="unanswered">
  <p class="gary-question-text">Do you place garment orders through the S&S/SanMar websites, or does PrintLife handle ordering for you?</p>
  <p class="gary-question-context">Confirms the ordering workflow and whether a "one-click order from quote" feature would save significant time in Phase 2.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="garments-q5" data-pipeline="garments" data-status="unanswered">
  <p class="gary-question-text">Would a screen reclamation dashboard — showing which stored screens haven't been reused in 6+ months — help you decide which to reclaim?</p>
  <p class="gary-question-context">Screen storage cost (not space) is a real constraint. A dashboard flagging idle screens could reduce tied-up capital and inform reclamation decisions.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="garments-q6" data-pipeline="garments" data-status="unanswered">
  <p class="gary-question-text">When a customer supplies their own garments, do you have a standard handling fee, or is it always negotiated per-job?</p>
  <p class="gary-question-context">Determines whether we need a configurable default handling fee for customer-supplied garments or just a flexible per-line-item override in the quoting system.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="garments-q7" data-pipeline="garments" data-status="unanswered">
  <p class="gary-question-text">How many garment styles do you stock on-site vs. order per-job? And do you track on-hand quantities in any system today?</p>
  <p class="gary-question-context">Light inventory awareness (what's on the shelf before ordering) surfaced as a potential Phase 2 feature. Knowing current tracking methods determines whether this is a pain point worth solving.</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

| ID | Question | Status |
|----|----------|--------|
| garments-q4 | Garment ordering method (website vs PrintLife integration) | unanswered |
| garments-q5 | Screen reclamation dashboard value | unanswered |
| garments-q6 | Customer-supplied garment handling fee standardization | unanswered |
| garments-q7 | On-site stock quantities and tracking method | unanswered |

## Requirements Matrix

| Feature | Priority | Phase | Complexity | Status | Notes |
|---------|----------|-------|------------|--------|-------|
| Garment images propagated everywhere | P0 | 1 | Medium | Built | Needs polish for demo |
| Fast search/filter/browse | P0 | 1 | Medium | Built | Validated as must-beat-PrintLife |
| Customer favorites (garment + color) | P1 | 1 | Medium | Built | Differentiator vs PrintLife |
| Mockup composition (design on garment) | P0 | 1 | High | Built | Demo showpiece — polish priority |
| Color-accurate mockups (garment color) | P0 | 1 | Medium | Built | Critical for internal and customer-facing |
| Enable/disable scoping | P2 | 1 | Low | Built | Important when API data arrives |
| Weight/fabric type filters | P1 | 1.5 | Low | Not built | New — primary recommendation drivers |
| Customer-supplied garment flag | P2 | 1.5 | Low | Not built | ~1x/month use case, schema addition |
| API auto-refresh (S&S + SanMar) | P1 | 2 | High | Not started | Matching PrintLife baseline |
| Screen reclamation intelligence | P3 | 2 | Medium | Not started | Cost-saving insight dashboard |
| Light inventory awareness | P3 | 2 | Medium | Not started | "What's on the shelf" before ordering |
| One-click garment ordering | P3 | 2+ | High | Not started | Order from quote via API |

## Cross-Vertical Implications

- **Quoting**: Premature recalculation bug to avoid. Single-page flow with progressive disclosure. Customer favorites surface during garment selection.
- **Customer Management**: Favorites stored per-customer. Screens tab shows derived screen intelligence with reclaim status.
- **Jobs**: Mockup images flow to job detail. Customer-supplied garment flag affects job cost calculation.
- **Screen Room**: Validated as customer-level intelligence, not standalone vertical. Cost of idle screens is the key insight.

## Next Steps

1. **Demo prep**: Polish mockup composition engine visual quality — this is the hero moment
2. **Schema addition**: Add weight/fabricType to garment schema for filter facets
3. **Schema addition**: Add customerSupplied flag to quote/job garment line items
4. **Verify**: Image propagation works correctly across all surfaces (catalog → quote → job → customer)
5. **Breadboard update**: Incorporate weight/fabric filters and customer-supplied flow into garment catalog breadboard
