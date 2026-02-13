---
title: "Jobs Vertical Breadboard"
subtitle: "126 UI affordances, 34 code affordances, 28 data stores, and 31 components mapped across 10 places for the production board, jobs list, and job detail"
date: 2026-02-11
phase: 1
vertical: jobs
verticalSecondary: []
stage: breadboarding
tags: [plan, build]
sessionId: "6df58e54-e1a6-4bef-ae1d-549e6e72ebf7"
branch: "session/0211-jobs-vertical"
status: complete
---

## At a Glance

| Stat | Value |
|------|-------|
| Places | 10 |
| UI Affordances | 126 |
| Code Affordances | 34 |
| Data Stores | 28 |
| Components | 31 |

The breadboard maps every UI control, code function, and data store for 3 pages (Production Board, Jobs List, Job Detail) plus 7 sub-places (dialogs, popovers, inline inputs). Every CORE feature from the scope definition has corresponding affordances, verified via a scope coverage matrix.

**Source:** `docs/breadboards/jobs-breadboard.md`

## Places & Navigation

| Place | Route | Description |
|-------|-------|-------------|
| P1 | `/jobs/board` | Production Board -- 2-section x 5-lane Kanban |
| P1.1 | (inline) | Scratch Note Capture |
| P1.2 | (dialog) | Block Reason Input (Board) |
| P1.3 | (dialog) | Move Lane Dialog (Board) |
| P2 | `/jobs` | Jobs List -- DataTable with sort/filter/search |
| P3 | `/jobs/[id]` | Job Detail -- Command center with 7 sections |
| P3.1 | (dialog) | Block Reason Input (Detail) |
| P3.2 | (inline) | Add Custom Task |
| P3.3 | (inline) | Add Note |
| P3.4 | (dropdown) | Move Lane Dropdown |

## Board Layout (2-Section x 5-Lane)

```
             Ready       In Progress    Review       Blocked       Done
  Quotes   | cards...  |  cards...    | cards...  |  cards...    | cards...  |
  Jobs     | cards...  |  cards...    | cards...  |  cards...    | cards...  |
```

Cards within each lane-section are sorted by due date (ascending). Scratch notes always live in the Quotes > Ready cell.

## Component Boundaries (31 Components)

### Shared Components (Wave 2)
- `ServiceTypeBadge` -- Used in P1, P2, P3
- `RiskIndicator` -- Used in P1, P2, P3
- `LaneBadge` -- Used in P1, P2, P3
- `TaskProgressBar` -- Used in P1, P2, P3

### Board Components (Wave 2-3)
- `ProductionBoard` (page), `CapacitySummaryBar`, `BoardFilterBar`
- `BoardSection`, `BoardLane`, `JobBoardCard`, `QuoteBoardCard`, `ScratchNoteCard`
- `BlockReasonDialog`, `MoveLaneDialog`, `ScratchNoteCapture`

### Job Detail Components (Wave 4A)
- `JobDetailView` (page), `JobHeader`, `QuickActionsBar`
- `TaskChecklist`, `TaskItem`, `AddCustomTaskInput`
- `JobDetailsSection`, `NotesFeed`, `NoteItem`
- `LinkedEntitiesSection`, `BlockReasonBanner`

### Jobs List Components (Wave 4B)
- `JobsList` (page), `JobsDataTable`

## Key Data Flows

### Quote-to-Job Conversion
Quote data (customerId, serviceType, quantity, garment details, print locations) auto-inherits into a new Job. Canonical tasks auto-populate based on serviceType. Source quote is linked via `sourceQuoteId`.

### Lane State Machine
```
[*] --> ready (Job created)
ready --> in_progress (Start work)
in_progress --> review (Tasks complete, QC check)
in_progress --> blocked (External dependency)
review --> done (QC passed)
review --> in_progress (QC failed, return with note)
blocked --> in_progress (Unblocked)
done --> [*] (Archived after 7+ days)
```
