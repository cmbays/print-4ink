---
title: 'Garment Mockup Engine — Breadboard'
subtitle: 'Affordance mapping for the SVG mockup composition engine before implementation'
date: 2026-02-14
phase: 1
pipelineName: garments
pipelineType: vertical
products: []
domains: [garments]
tools: []
stage: breadboard
tags: [plan, decision]
sessionId: 'fdf6daba-01b3-4d39-81c8-9c5a44f2b0e6'
branch: 'session/0214-mockup-design'
status: complete
---

## What This Session Did

Produced a formal breadboard document (`docs/breadboards/mockup-engine-breadboard.md`) for the garment mockup engine — a horizontal capability that composites artwork onto garment templates using SVG + `feColorMatrix` + `mix-blend-mode: multiply`.

This is the breadboarding step between design/planning and implementation in the vertical build chain.

## Places Mapped

The mockup engine integrates into **4 existing Places** in Phase 1 (no new routes):

| Place        | Route          | Mockup Size    | Key Integration                                                                |
| ------------ | -------------- | -------------- | ------------------------------------------------------------------------------ |
| Quote Detail | `/quotes/[id]` | sm (64-80px)   | Replace `ArtworkPreview` with `GarmentMockupThumbnail` per print location      |
| Job Detail   | `/jobs/[id]`   | md (280-320px) | Add "What We're Printing" section with `GarmentMockupCard` + front/back toggle |
| Kanban Board | `/jobs/board`  | xs (40-48px)   | Add `GarmentMockupThumbnail` to each `JobBoardCard`                            |
| Root Layout  | `layout.tsx`   | n/a            | Hosts `MockupFilterProvider` (per-page, not global)                            |

**Deferred to Phase 2**: Quote creation live preview, customer approval page, invoice detail, screen room.

## Integration Gaps Found

Breadboarding revealed **4 gaps** not addressed in the original implementation plan:

### Gap 1: Location String Normalization

Quote mock data uses `"Front"`, `"Back"`, `"Left Sleeve"`. Job mock data uses `"Front Center"`, `"Back Full"`, `"Left Chest"`. Mockup engine expects kebab-case `"front-chest"`, `"full-back"`. Need `PRINT_POSITION_ALIASES` lookup.

### Gap 2: Job Artwork-to-Location Mapping

Job schema has flat `artworkIds[]` but `printLocations[]` has no per-location `artworkId`. Phase 1 workaround: assume 1:1 order mapping. Phase 2: add `artworkId` to `jobPrintLocationSchema`.

### Gap 3: JobCard View Model Missing Garment Data

`board-card.ts`'s `JobCard` has no garment category, color hex, or artwork URL. Need 3 optional fields: `garmentCategory`, `garmentColorHex`, `primaryArtworkUrl`. Populated during mock data card projection.

### Gap 4: MockupFilterProvider Placement

Root `layout.tsx` is a server component. Decision: per-page rendering instead of global. Each page renders its own `MockupFilterProvider` with just its garment colors.

## Decisions Made

| Decision                                          | Rationale                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Per-page MockupFilterProvider (not global)        | Root layout is server component; avoids unused filter SVGs on non-mockup pages             |
| Extend JobCard view model (not resolve at render) | 30+ cards on Kanban — per-card resolution is messy; 3 extra projected fields is clean      |
| Defer quote creation live preview                 | Highest integration risk (RHF state binding); core value delivered by other 3 integrations |
| 1:1 artwork-to-location mapping for Phase 1       | Covers common case; Phase 2 adds proper per-location artworkId                             |

## Artifacts

- Breadboard document: `docs/breadboards/mockup-engine-breadboard.md`
- Design document: `docs/plans/2026-02-14-garment-mockup-design.md`
- Implementation plan: `docs/plans/2026-02-14-garment-mockup-impl-plan.md`

## What's Next

Update the implementation plan with gap fixes (new Task 2A for aliases, update Task 5 for JobCard extension, update Tasks 11-13 for normalization), then execute the plan.

<div class="gary-question" data-question-id="garments-q1" data-pipeline="garments" data-status="answered">
  <p class="gary-question-text">What mockup tool do you currently use? What do you like/dislike about it?</p>
  <p class="gary-question-context">Helps us understand what baseline quality to target and which workflows to replicate</p>
  <div class="gary-answer" data-answered-date="2026-02-14">Manual mockup process. Quote approved → mockup created → mockup approved → work committed → garments ordered. No dedicated mockup tool — creates images manually and shares via email.</div>
</div>

<div class="gary-question" data-question-id="garments-q2" data-pipeline="garments" data-status="answered">
  <p class="gary-question-text">Do customers ever need to reposition artwork themselves, or do you always set the position?</p>
  <p class="gary-question-context">Determines whether Phase 1's auto-place model is sufficient or if we need interactive editing sooner</p>
  <div class="gary-answer" data-answered-date="2026-02-14">Gary sets positions. Customers approve/reject. Auto-place model sufficient for Phase 1.</div>
</div>

<div class="gary-question" data-question-id="garments-q3" data-pipeline="garments" data-status="unanswered">
  <p class="gary-question-text">Which 5 garment styles do you use most?</p>
  <p class="gary-question-context">Prioritizes which SVG templates to create first and which S&S API SKUs to calibrate</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>
