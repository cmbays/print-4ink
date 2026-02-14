---
title: "Mobile Optimization — Implementation Plan"
subtitle: "25-task implementation plan across 4 sprints for the mobile optimization vertical"
date: 2026-02-14
phase: 1
vertical: mobile-optimization
verticalSecondary: [jobs, quoting, customer-management, invoicing, dashboard]
stage: implementation-planning
tags: [plan, build]
sessionId: "0ba68ef8-1b02-40be-a039-2c63d6d15cd1"
branch: "session/0214-mobile-impl-plan"
status: complete
---

## Summary

Created a comprehensive implementation plan for the mobile optimization vertical, translating the breadboard's 25 build steps into 25 bite-sized tasks with exact file paths, code snippets, acceptance criteria, and commit points. Three research agents explored the codebase in parallel to identify existing responsive patterns and gaps.

## Key Findings from Codebase Research

### What Already Exists
- **3 of 4 list views** (Jobs, Invoices, Customers) already have `md:hidden` mobile card views
- **Job detail** already has responsive grid (`grid-cols-1 lg:grid-cols-3`)
- **`sheet.tsx`** component available for drawers/bottom sheets
- **`dialog.tsx`** already has mobile-friendly `max-w-[calc(100%-2rem)]`
- **`CapacitySummaryBar`** exists on the board
- **`NotesFeed`** component exists for job notes
- Framer Motion already installed (for swipe gestures)

### What's Missing (Zero Responsive Infrastructure)
- No mobile design tokens (`--mobile-nav-height`, `--mobile-touch-target`, etc.)
- No `useIsMobile` hook or viewport detection
- No responsive classes on dashboard layout (`grid-cols-4` hardcoded)
- No bottom tab bar, mobile header, or mobile drawer
- No bottom sheet component
- Sidebar fixed at `w-60` with no responsive hiding
- `touch-none` on Kanban drag cards conflicts with mobile scrolling
- Quotes list is the only list missing mobile cards

## Plan Structure

| Sprint | Tasks | Duration | Focus |
|--------|-------|----------|-------|
| Sprint 1 | Tasks 1-9 | ~1 week | Foundation: tokens, hooks, BottomTabBar, MobileDrawer, MobileHeader, layout integration, touch audit, BottomSheet, MobileCardList |
| Sprint 2 | Tasks 10-14 | ~1 week | High-Value: MobileKanbanBoard, CapacitySummary, NoteCapture with side effects, MobileDashboard, LaneSelector |
| Sprint 3 | Tasks 15-18 | ~1 week | Lists + Forms: Quotes mobile cards, polish existing cards, MobileFilterSheet, form mobile layouts |
| Sprint 4 | Tasks 19-25 | ~1 week | Detail Views + Polish: BottomActionBar, all detail mobile layouts, FullScreenModal, desktop regression |

## New Components (12 total)

| Component | File Path | Sprint |
|-----------|-----------|--------|
| `BottomTabBar` | `components/layout/bottom-tab-bar.tsx` | 1 |
| `MobileDrawer` | `components/layout/mobile-drawer.tsx` | 1 |
| `MobileHeader` | `components/layout/mobile-header.tsx` | 1 |
| `BottomSheet` | `components/ui/bottom-sheet.tsx` | 1 |
| `MobileCardList` | `components/ui/mobile-card-list.tsx` | 1 |
| `MobileKanbanBoard` | `app/(dashboard)/jobs/board/_components/MobileKanbanBoard.tsx` | 2 |
| `MobileLaneTabBar` | `app/(dashboard)/jobs/board/_components/MobileLaneTabBar.tsx` | 2 |
| `CapacitySummary` | `components/features/CapacitySummary.tsx` | 2 |
| `NoteCapture` | `components/features/NoteCapture.tsx` | 2 |
| `LaneSelector` | `components/features/LaneSelector.tsx` | 2 |
| `MobileFilterSheet` | `components/features/MobileFilterSheet.tsx` | 3 |
| `BottomActionBar` | `components/layout/bottom-action-bar.tsx` | 4 |
| `FullScreenModal` | `components/ui/full-screen-modal.tsx` | 4 |

## Risk Areas

1. **Mobile Kanban swipe (Task 10)** — Highest complexity; may need a spike for touch gesture handling with Framer Motion
2. **Dashboard layout client component (Task 6)** — Converting server component to client for drawer state could affect server component children
3. **BottomActionBar z-index (Task 19)** — Positioning above BottomTabBar requires careful layering

## Artifacts

- [Implementation plan](https://github.com/cmbays/print-4ink/blob/main/docs/plans/2026-02-14-mobile-optimization-implementation.md)
- [Breadboard](https://github.com/cmbays/print-4ink/blob/main/docs/breadboards/mobile-optimization-breadboard.md)
- [Design doc](https://github.com/cmbays/print-4ink/blob/main/docs/plans/2026-02-14-mobile-optimization-design.md)
- [Interview session](https://github.com/cmbays/print-4ink/blob/main/knowledge-base/src/content/sessions/2026-02-14-mobile-optimization-interview.md)
