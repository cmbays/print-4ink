---
title: "Garment Mockup Engine — Implementation Plan"
subtitle: "16-task TDD plan for SVG composition engine with breadboard gap fixes"
date: 2026-02-14
phase: 1
pipelineName: garments
pipelineType: vertical
products: [garments]
tools: []
stage: plan
tags: [plan, feature]
sessionId: "fdf6daba-01b3-4d39-81c8-9c5a44f2b0e6"
branch: "session/0214-mockup-design"
status: complete
---

## What This Session Did

Wrote a detailed TDD implementation plan (`docs/plans/2026-02-14-garment-mockup-impl-plan.md`) for the garment mockup engine, then revised it after breadboarding uncovered 4 integration gaps.

## Architecture

Inline SVG with `feColorMatrix` for color tinting + `<image>` for artwork overlay + `<clipPath>` for print zone masking + `mix-blend-mode: multiply` for fabric texture blending. Zero external dependencies — all browser-native SVG/CSS.

## Task Breakdown (16 tasks)

| # | Task | Type | Parallel? |
|---|------|------|-----------|
| 1 | MockupTemplate + PrintZone schemas | Schema + tests | Yes (with 2-4) |
| 2 | Print zone constants + aliases + normalizePosition | Constants + tests | Yes (with 1,3,4) |
| 3 | hexToColorMatrix utility | Utility + tests | Yes (with 1,2,4) |
| 4 | SVG garment templates (t-shirts front/back) | Assets | Yes (with 1-3) |
| 5 | Mock mockup template data | Mock data | After 1,4 |
| 5A | Extend JobCard view model with mockup fields | Schema + mock data | After 5 |
| 6 | MockupFilterProvider component | Component | After 3 |
| 7 | GarmentMockup core engine | Component | After 1-6 |
| 8 | GarmentMockupThumbnail (memo wrapper) | Component | After 7 |
| 9 | GarmentMockupCard (interactive wrapper) | Component | After 7 |
| 10 | Barrel export | Export | After 7-9 |
| 11 | Integration: QuoteDetailView | Integration | Yes (with 12-13) |
| 12 | Integration: Kanban Board | Integration | Yes (with 11,13) |
| 13 | Integration: Job Detail Page | Integration | Yes (with 11-12) |
| 14 | Type check + full test suite + build | Validation | After 11-13 |
| 15 | Push + PR | Ship | After 14 |

## Breadboard Gap Fixes (revision)

After breadboarding (`docs/breadboards/mockup-engine-breadboard.md`), 4 gaps were found and folded into the plan:

### Gap 1: Location String Normalization
- **Problem**: Quote mock data uses `"Front"`, `"Back"`. Job data uses `"Front Center"`, `"Back Full"`. Engine expects `"front-chest"`.
- **Fix**: Added `PRINT_POSITION_ALIASES` lookup + `normalizePosition()` helper to Task 2. Tests cover quote-style, job-style, and fallback kebab-casing.

### Gap 2: Job Artwork-to-Location Mapping
- **Problem**: Job schema has flat `artworkIds[]` but `printLocations[]` has no per-location `artworkId`.
- **Fix**: Task 13 uses 1:1 order mapping (`artworkIds[0]` → `printLocations[0]`, etc.). Phase 2 will add `artworkId` to `jobPrintLocationSchema`.

### Gap 3: JobCard View Model Missing Garment Data
- **Problem**: `board-card.ts` `JobCard` had no garment category, color hex, or artwork URL — Kanban can't render thumbnails.
- **Fix**: New **Task 5A** adds 3 optional fields (`garmentCategory`, `garmentColorHex`, `primaryArtworkUrl`) to `jobCardSchema` and populates them in mock data projection.

### Gap 4: MockupFilterProvider Placement
- **Problem**: Root `layout.tsx` is a server component; `MockupFilterProvider` is `"use client"`.
- **Fix**: Tasks 11-13 each render their own per-page `MockupFilterProvider` with just that page's garment colors.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| TDD with Vitest for schemas/utilities | Validates before integration; catches Zod edge cases |
| Start with t-shirts only (2 SVG templates) | Most common garment; expand to other categories after core is proven |
| Per-page MockupFilterProvider | Avoids layout changes; no wasted filter defs on non-mockup pages |
| Graceful degradation (optional mockup fields) | Cards/pages without garment data render normally, no crashes |
| Defer quote creation live preview | Highest risk integration (RHF state binding); not needed for core value |

## Artifacts

- Implementation plan: `docs/plans/2026-02-14-garment-mockup-impl-plan.md`
- Design document: `docs/plans/2026-02-14-garment-mockup-design.md`
- Breadboard: `docs/breadboards/mockup-engine-breadboard.md`

## What's Next

Execute the plan using subagent-driven development or a parallel session with `superpowers:executing-plans`.
