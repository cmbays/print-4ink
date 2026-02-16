---
title: "Strategic Pivot: Vertical-by-Vertical"
subtitle: "Moving from linear 10-step implementation plan to user-validated vertical development focused on 4Ink's core pain points."
date: 2026-02-08
phase: 1
pipelineName: meta
pipelineType: horizontal
products: []
tools: [knowledge-base]
stage: plan
tags: [plan, decision]
sessionId: "7b394c57-f392-4fb2-87da-1583c256b010"
branch: "main"
status: complete
---

## The Pivot: Why and What Changed

**Old Plan (Linear 10 Steps):** Build all 11 screens in order (Dashboard -> Jobs -> Quotes -> Customers -> Screen Room -> Garments), no user feedback until end.

**New Plan (Vertical-by-Vertical):** Build 3-5 complete user workflows that demonstrate 10x better UX vs Print Life, with fast feedback loops after each vertical.

### Why We Pivoted

- **User Validation:** 4Ink feedback was specific ("Quoting is painful, invoicing is painful, pricing is broken, reporting doesn't work") not generic
- **Fast Feedback:** Complete vertical -> user demo -> iterate, before moving to next vertical
- **Depth > Breadth:** 3 excellent verticals that demonstrate 10x better UX will impress user more than 11 mediocre screens
- **Tested Methodology:** Pilot on Quoting, then scale repeatable process to 4 more verticals
- **Aligned Scope:** Original plan included Jobs/Screen Room/Garments that user didn't mention

### What Verticals Are We Building?

| Vertical | Status | Notes |
|----------|--------|-------|
| **Quoting** | Discovery planning | PILOT VERTICAL |
| **Invoicing** | Pending | "Invoice generation is tedious" |
| **Customer Management** | Pending | "Customer tracking is poor" |
| **Pricing Matrix** | Pending | "Pricing is inflexible" |
| **Reporting** | Stretch goal | "Print Life's reporting is broken" |

---

## The Methodology: 4-Phase Approach (per Vertical)

### Phase 1: Discovery (2-3 days)

Deeply understand Print Life's current experience and 4Ink's pain points.

- **Print Life Analysis:** Screenshot review + trial walkthrough
- **User Interview:** 30-45 min with Chris covering workflow -> pain points -> wishlist
- **Journey Mapping:** Document steps, identify friction points, rate severity

### Phase 2: Scope Definition (1 day)

Define CORE (must-have), PERIPHERAL (shown but non-functional), INTERCONNECTIONS (minimal representations).

### Phase 3: Build Execution (2-4 days)

Implement with design system adherence and quality gates.

### Phase 4: Demo & Iteration (1 day)

User rates Clarity, Speed, Polish, Value (target 8+ average).

---

## Quoting Vertical: Pilot Plan

### CORE (Building)

- **Quotes List** (`/quotes`) -- Browse, filter by status, search
- **Quote Detail** (`/quotes/[id]`) -- Full breakdown, action buttons
- **New Quote Form** (`/quotes/new`) -- Dynamic line items, real-time pricing

### PERIPHERAL (Shown, not functional)

- Customer creation modal, artwork upload placeholder, PDF download, email preview

### INTERCONNECTIONS (Minimal)

- Customer dropdown, pricing formula, "Convert to Invoice" button, quote totals

### Key Targets

| Metric | Print Life | Our Target |
|--------|-----------|------------|
| Simple Quote Time | 3-5 min | 2-3 min |
| Complex Quote Time | 8-12 min | 5-7 min |
| Simple Quote Clicks | 13-20 | 10-12 |
| Complex Quote Clicks | 25-35 | 18-25 |

---

## Documents Created

- `.claude/plans/vertical-by-vertical-strategy.md` -- Master strategy document
- `docs/strategy/quoting-discovery-interview-questions.md` -- 25+ question interview guide
- `docs/competitive-analysis/print-life-quoting-analysis.md` -- Feature analysis template
- `docs/competitive-analysis/print-life-journey-quoting.md` -- Journey map template
- `docs/strategy/quoting-scope-definition.md` -- CORE/PERIPHERAL/INTERCONNECTIONS spec
- `docs/strategy/STRATEGY_README.md` -- Navigation guide for all strategy docs

---

## Blocking Dependencies

**Cannot build Quoting until:** Discovery phase complete (user interview + Print Life trial)

**Cannot proceed to Invoicing until:** Quoting user-validated (8+ rating)

## Success Criteria

- User rates Clarity, Speed, Polish, Value as 8+ (average)
- User identifies specific time savings or friction reduction
- User says "yes, this is better than Print Life"
- Quality gate audit: Zero Critical issues, <3 High issues

---

## How This Differs from Original Plan

| Aspect | Original (10 Steps) | New (Vertical-by-Vertical) |
|--------|---------------------|----------------------------|
| **Approach** | Linear: Steps 1-10 in order | Iterative: Complete vertical -> feedback -> next |
| **User Feedback** | After all 11 screens | After each vertical |
| **Focus** | All screens | 4-5 complete workflows |
| **Validation** | Assumed features from PRD | Based on 4Ink's stated pain points |
| **Scope** | Everything at once | CORE + PERIPHERAL + INTERCONNECTIONS per vertical |
