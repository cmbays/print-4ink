---
title: "Jobs Implementation Plan"
subtitle: "5-wave build strategy with 35 files, dependency-ordered waves, parallel Wave 4, quality gates, and 8-risk register"
date: 2026-02-11
phase: 1
vertical: jobs
verticalSecondary: []
stage: implementation-planning
tags: [plan]
sessionId: "6df58e54-e1a6-4bef-ae1d-549e6e72ebf7"
branch: "session/0211-jobs-vertical"
status: complete
---

## At a Glance

| Stat | Value |
|------|-------|
| Waves | 5 (with 4A/4B parallel) |
| Total Files | 35 |
| Quality Gate | 19-point checklist |
| Risks Tracked | 8 |

**Source:** `docs/strategy/jobs-implementation-plan.md`

## Wave Summary

| Wave | Name | Objective | Files |
|------|------|-----------|-------|
| 1 | Foundation | Schema + Constants + Mock Data + Tests | 8 |
| 2 | Board Core | Static Board Layout + Card Components + Filters | 13 |
| 3 | Board DnD | Drag-and-Drop + Dialogs + Scratch Note Capture | 3 |
| 4A | Job Detail | Command Center -- 7 sections, full interactivity | 11 |
| 4B | Jobs List | DataTable with sort/filter/search/quick actions | 2 |
| 5 | Integration | Cross-vertical wiring, dashboard, polish, audit | -- |

Each wave produces a demoable checkpoint, isolates risk, and allows quality gates between phases. Wave 4 parallelizes two independent screens.

## PR Strategy

Waves merge to `main` independently, in strict order:

**Wave 1 -> Wave 2 -> Wave 3 -> Wave 4A + 4B (either order) -> Wave 5**

Waves 4A and 4B create different files and can merge in either order. Wave 5 must merge last since it touches files from all previous waves.

## Risk Register

| # | Risk | L | I | Mitigation |
|---|------|---|---|------------|
| 1 | dnd-kit 2-section board complexity | M | H | Spike if stuck >2h. Fallback: single-section. Composite droppable IDs. |
| 2 | Board performance with many cards | L | M | 15-20 max mock cards. useMemo + React.memo. Virtualize in Phase 2. |
| 3 | Cross-vertical breakage from schema changes | M | H | Keep old productionStateEnum exported. Full build after Wave 1. |
| 4 | Schema migration breaks existing tests | M | L | Rewrite job.test.ts in Wave 1 before UI work. |
| 5 | Task state management complexity | M | M | Simple array on job state. No separate store. Pure functional updates. |
| 6 | Wave 4 parallel merge conflicts | L | L | 4A and 4B create different files. No shared file modifications. |
| 7 | shadcn/ui progress component missing | L | L | Check in Wave 2. Install if needed, or build div-based bar. |
| 8 | dnd-kit package not in project | L | L | Check package.json at Wave 3 start. npm install if needed. |

## Quality Gate Protocol

Every wave runs a 19-point checklist across 5 categories:

- **Build Checks** (automated): TypeScript, ESLint, Build, Tests
- **Visual Checks** (manual): Card design, board layout, detail sections, table columns, responsive
- **Cross-Link Checks** (manual): Route references, breadcrumbs, cross-vertical links
- **Accessibility** (manual): ARIA labels, keyboard navigation, focus management
- **Design System** (manual): Color tokens only, Lucide icons only, Inter font, Tailwind spacing

Formal design audits at end of Wave 2 (board visual) and Wave 5 (final comprehensive).
