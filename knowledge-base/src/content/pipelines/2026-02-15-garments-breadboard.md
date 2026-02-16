---
title: "Garments Vertical — Consolidated Breadboard"
subtitle: "Comprehensive affordance mapping incorporating catalog build, mockup engine, and interview-driven enhancements"
date: 2026-02-15
phase: 1
pipeline: garments
pipelineType: vertical
products: [garments]
tools: []
stage: breadboarding
tags: [plan]
sessionId: "0ba68ef8-1b02-40be-a039-2c63d6d15cd1"
branch: "session/0215-garments-breadboard"
status: complete
---

## What This Session Did

Produced a consolidated breadboard document (`docs/breadboards/garments-breadboard.md`) that maps the full Garments vertical — merging the existing garment catalog build (PR #109) with new requirements from the 2026-02-15 owner interview.

This breadboard supersedes `garment-catalog-breadboard.md` as the canonical reference for garments scope. The mockup engine breadboard (`mockup-engine-breadboard.md`) remains separate as a horizontal capability.

## Key Differences from Original Breadboard

The original garment-catalog-breadboard was used for the initial build (20 build steps, PR #109). This consolidated version:

1. **Tags every affordance as [BUILT], [NEW], [MOCKUP], or [POLISH]** — makes it immediately clear what remains
2. **Adds weight/fabric type filters** (interview D1) — 4 new UI affordances (U16-U19), 4 new code affordances (N24-N27), 2 new data stores (S13-S14)
3. **Adds customer-supplied garment support** (interview D2) — 3 new code affordances (N28-N30), 1 new data store (S15), schema additions to `quoteLineItemSchema`
4. **Defines a 10-task build order** for remaining work only (the original 20 tasks are complete)
5. **References the mockup engine breadboard** without duplicating it

## Places Mapped

9 Places (6 built, 3 from mockup engine):

| Place | Status |
|-------|--------|
| Garment Catalog (`/garments`) | Built |
| Garment Detail Drawer | Built |
| Customer Screens Tab | Built |
| Reclaim Screen Dialog | Built |
| Customer Favorites (inline) | Built |
| Mockup — Quote Detail | Separate breadboard |
| Mockup — Job Detail | Separate breadboard |
| Mockup — Kanban Board | Separate breadboard |

Plus 3 cross-linking places (Dashboard, Customer Jobs, Invoice Detail) — all built.

## New Schema Requirements

### `garmentCatalogSchema` additions
- `weight: z.number().positive().optional()` — garment weight in oz (e.g., 5.3)
- `fabricType: z.string().optional()` — fabric composition (e.g., "100% Ring-Spun Cotton")

### `quoteLineItemSchema` additions
- `customerSupplied: z.boolean().default(false)` — skip garment cost when true
- `handlingFee: z.number().nonnegative().default(0)` — flat fee for customer-supplied

### New helper
- `WEIGHT_RANGES` constant with 3 buckets: Lightweight (<4 oz), Midweight (4-6 oz), Heavyweight (>6 oz)

## Build Order Summary (10 tasks)

| Window | Tasks | Complexity |
|--------|-------|------------|
| A: Schema + data | #1-3 (weight/fabric schema, mock data, helpers) | Low |
| B: UI filters | #4-6 (toolbar dropdowns, card badges, filter logic) | Low-Medium |
| C: Customer-supplied | #7-8 (schema + mock data) | Low |
| D: Tests | #10 (schema validation) | Low |
| Deferred | #9 (customer-supplied UI in quote form) | Medium — deferred to quoting v2 |

## Decisions

### D1: Weight as numeric, not categorical
Storing raw weight (e.g., 5.3 oz) rather than pre-categorized buckets. The `WEIGHT_RANGES` helper converts to display-friendly labels. This preserves precision for future API data without category mapping drift.

### D2: Customer-supplied schema now, UI later
The `customerSupplied` and `handlingFee` fields are added to the schema in this cycle. The UI integration into the quote form is deferred to when the quoting vertical is next touched — avoids cross-vertical scope creep.

### D3: Breadboard consolidation over replacement
Rather than deleting `garment-catalog-breadboard.md`, the new `garments-breadboard.md` supersedes it. The original remains as a build reference for PR #109. The new doc clearly tags every affordance with its build status.

## Open Questions

<div class="gary-question" data-question-id="garments-q3" data-vertical="garments" data-status="unanswered">
  <p class="gary-question-text">Which 5 garment styles do you use most?</p>
  <p class="gary-question-context">Prioritizes which SVG templates to create first and which S&S API SKUs to calibrate</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

<div class="gary-question" data-question-id="garments-q6" data-vertical="garments" data-status="unanswered">
  <p class="gary-question-text">When a customer supplies their own garments, do you have a standard handling fee, or is it always negotiated per-job?</p>
  <p class="gary-question-context">Determines whether we need a configurable default handling fee or just per-line-item override</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>

## Artifacts

- Breadboard document: `docs/breadboards/garments-breadboard.md`
- Related: `docs/breadboards/garment-catalog-breadboard.md` (original, now superseded)
- Related: `docs/breadboards/mockup-engine-breadboard.md` (horizontal capability)
