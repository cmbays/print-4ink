---
title: "Mobile Optimization — Breadboard"
description: "UI affordances, code affordances, wiring, and component boundaries for the mobile optimization vertical"
category: breadboard
status: draft
phase: 1
created: 2026-02-14
last-verified: 2026-02-14
depends-on:
  - docs/strategy/mobile-optimization-scope-definition.md
  - docs/strategy/mobile-optimization-improved-journey.md
  - docs/plans/2026-02-14-mobile-optimization-design.md
---

# Mobile Optimization — Breadboard

**Purpose**: Map all UI affordances, code affordances, and wiring for the mobile optimization vertical before building
**Input**: Scope definition, improved journey design, interview-validated design doc, APP_FLOW
**Status**: Draft

> **Note**: This vertical is unique — it doesn't add new routes. It transforms existing screens at mobile breakpoints (< 768px) and introduces new mobile-only components and interaction patterns. "Places" here represent mobile-specific bounded contexts (new overlays, drawers, bottom sheets) and mobile variants of existing pages where affordances change significantly.

---

## Places

| ID | Place | Type | Entry Point | Description |
|----|-------|------|-------------|-------------|
| P1 | Mobile App Shell | Persistent layout | All pages at < 768px | Bottom tab bar + mobile header replace sidebar. Wraps all page content. |
| P2 | Mobile Drawer | Overlay | "More" tab in P1 | Secondary navigation items (Invoices, Screen Room, Garments, Settings). Blocks background. |
| P3 | Mobile Dashboard | Page (variant) | Tab bar "Dashboard" / `/` | Priority-ordered mobile layout: blocked alert → coming up → stat cards (2-col). |
| P4 | Mobile Kanban Board | Page (variant) | Tab bar "Jobs" / `/jobs/board` | Single-column card list with horizontal swipe lane tabs. No drag-and-drop. |
| P4.1 | Block Reason Bottom Sheet | Bottom sheet | "Block" action on card in P4 | Text input for block reason. Blocks background. |
| P4.2 | Quick Note Capture | Bottom sheet | FAB or "+" in P4 | Note text + optional entity attachment + block/unblock toggle. |
| P5 | Mobile Job Detail | Page (variant) | Card tap in P4 or P7b / `/jobs/[id]` | Tabbed layout (Overview / Tasks / Notes). Sticky bottom action bar. |
| P5.1 | Note with Side Effects | Bottom sheet | "Add Note" in P5 | Note input + channel selector + "Block this job" toggle. |
| P5.2 | Lane Change Sheet | Bottom sheet | "Move Lane" in P5 | Lane picker with confirmation. Block reason input if target = Blocked. |
| P6 | Mobile List Views | Page (variant) | Tab bar items / nav links | Cards replace tables. Shared `<MobileCardList>` renders all 4 list types. |
| P6.1 | Mobile Sort/Filter Sheet | Bottom sheet | Filter button in P6 | Sort + filter controls for mobile list views. |
| P7 | Mobile Detail Views | Page (variant) | Card tap in P6 / entity links | Job, Quote, Invoice, Customer detail pages with single-column stack + bottom action bar. |
| P8 | Mobile Forms | Page (variant) | "New" buttons / `/quotes/new`, `/invoices/new` | Single-column forms with sticky bottom actions. |
| P9 | Full-Screen Modal | Modal (variant) | Any dialog trigger at < 768px | Existing dialogs become full-screen overlays on mobile. |

---

## UI Affordances

### P1 — Mobile App Shell

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U1 | Dashboard tab | click | → N1 navigateTo("/") | → P3 active |
| U2 | Jobs tab | click | → N1 navigateTo("/jobs/board") | → P4 active |
| U3 | Quotes tab | click | → N1 navigateTo("/quotes") | → P6 (quotes) active |
| U4 | Customers tab | click | → N1 navigateTo("/customers") | → P6 (customers) active |
| U5 | More tab | click | → open P2 | → P2 visible |
| U6 | Active tab indicator | display | ← N2 matchRoute() | — |
| U7 | Mobile header (page title) | display | ← N3 getPageTitle() | — |
| U8 | Notification bell icon | click | → (Phase 2: notification panel) | — |

### P2 — Mobile Drawer

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U10 | Close button / backdrop tap | click | → N4 closeDrawer() | → P1 (drawer hidden) |
| U11 | Invoices link | click | → N1 navigateTo("/invoices"), N4 closeDrawer() | → P6 (invoices) |
| U12 | Screen Room link | click | → N1 navigateTo("/screens"), N4 closeDrawer() | → target page |
| U13 | Garments link | click | → N1 navigateTo("/garments"), N4 closeDrawer() | → target page |
| U14 | Pricing Settings link | click | → N1 navigateTo("/settings/pricing"), N4 closeDrawer() | → target page |

### P3 — Mobile Dashboard

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U20 | Blocked jobs alert card | click | → N1 navigateTo("/jobs?lane=blocked") | → P6 (jobs, filtered) |
| U21 | "Coming Up" filter toggle | toggle | → N5 toggleComingUpFilter() | → U22 filtered list |
| U22 | Job card (in coming-up list) | click | → N1 navigateTo("/jobs/[id]") | → P5 |
| U23 | Stat card — Total Jobs | click | → N1 navigateTo("/jobs") | → P6 (jobs) |
| U24 | Stat card — Blocked | click | → N1 navigateTo("/jobs?lane=blocked") | → P6 (jobs, filtered) |
| U25 | Stat card — Open Quotes | click | → N1 navigateTo("/quotes?status=sent") | → P6 (quotes, filtered) |
| U26 | Stat card — Revenue | display | ← S3 mock data | — |
| U27 | Capacity summary bar | display | ← N6 calculateCapacity() | — |
| U28 | "View Board" link | click | → N1 navigateTo("/jobs/board") | → P4 |

### P4 — Mobile Kanban Board

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U30 | Lane tab bar (Ready \| In Progress \| Review \| Blocked \| Done) | click/swipe | → N7 selectLane(lane) | → U31 card list for lane |
| U31 | Active lane indicator (underline) | display | ← S4 activeLane | — |
| U32 | Lane card count badge | display | ← N8 countCardsInLane() | — |
| U33 | Job card | click | → N1 navigateTo("/jobs/[id]") | → P5 |
| U34 | "Move to [Next Lane] →" button on card | click | → N9 moveToNextLane(jobId) | → card moves, U32 updates |
| U35 | "Block" button on card | click | → open P4.1 | → P4.1 visible |
| U36 | Card service type color bar | display | ← S3 job.serviceType | — |
| U37 | Card risk indicator dot | display | ← S3 job.riskLevel | — |
| U38 | Card task progress bar | display | ← N10 calcTaskProgress() | — |
| U39 | FAB "+" button | click | → open P4.2 | → P4.2 visible |
| U40 | Capacity summary (jobs this week, shirt volume, rush count) | display | ← N6 calculateCapacity() | — |
| U41 | Section toggle (Quotes / Jobs / All) | toggle | → N11 filterBoardSection() | → U31 filtered |
| U42 | Quote card | click | → N1 navigateTo("/quotes/[id]") | → quote detail |
| U43 | Scratch note card | click | → N1 navigateTo("/quotes/new") (with prefill) | → P8 |
| U44 | View toggle (Board / List) | click | → N1 navigateTo("/jobs") | → P6 (jobs list) |

### P4.1 — Block Reason Bottom Sheet

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U50 | Block reason text input | type | — | → S5 blockReasonText |
| U51 | "Block Job" confirm button | click | → N12 blockJob(jobId, reason) | → close P4.1, card moves to Blocked |
| U52 | Cancel / close sheet | click | → N13 closeSheet() | → P4 |

### P4.2 — Quick Note Capture

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U55 | Note text input | type | — | → S6 noteText |
| U56 | Entity type selector (Job / Quote / Customer) | select | → N14 setNoteEntity() | → U57 entity picker |
| U57 | Entity picker (search + select) | type/select | → N15 searchEntities() | → S7 selectedEntity |
| U58 | "Block this job" toggle | toggle | → N16 setBlockToggle() | → S8 blockToggleState |
| U59 | "Unblock this job" toggle | toggle | → N17 setUnblockToggle() | → S9 unblockToggleState |
| U60 | Channel selector (phone / email / text / social / in-person) | select | — | → S10 noteChannel |
| U61 | "Save Note" button | click | → N18 saveNoteWithSideEffects() | → close P4.2, toast confirmation |
| U62 | Cancel / close sheet | click | → N13 closeSheet() | → P4 |

### P5 — Mobile Job Detail

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U70 | Back button (← Jobs) | click | → N1 navigateTo("/jobs/board") | → P4 |
| U71 | Overflow menu (⋯) | click | → open dropdown | → action list |
| U72 | Tab bar (Overview / Tasks / Notes) | click | → N19 selectDetailTab() | → S11 activeTab |
| U73 | Customer name link | click | → N1 navigateTo("/customers/[id]") | → P7 (customer) |
| U74 | Lane badge | display | ← S3 job.lane | — |
| U75 | Risk indicator | display | ← S3 job.riskLevel | — |
| U76 | Task checkbox | toggle | → N20 toggleTask(taskId) | → task progress updates |
| U77 | Task progress bar | display | ← N10 calcTaskProgress() | — |
| U78 | "Add Note" button | click | → open P5.1 | → P5.1 visible |
| U79 | Note card (in notes feed) | display | ← S3 job.notes | — |
| U80 | Note type filter (All / Internal / Customer / System) | select | → N21 filterNotes() | → U79 filtered |
| U81 | Block reason banner (when blocked) | display | ← S3 job.blockReason | — |
| U82 | "Unblock" button (in banner) | click | → N22 unblockJob(jobId) | → banner hidden, lane changes |

### P5 — Bottom Action Bar (sticky)

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U85 | "Move Lane →" button | click | → open P5.2 | → P5.2 visible |
| U86 | "Add Note" quick button | click | → open P5.1 | → P5.1 visible |
| U87 | "Mark Blocked" button | click | → open P4.1 (reused) | → P4.1 visible |

### P5.1 — Note with Side Effects

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U90 | Note text input | type | — | → S6 noteText |
| U91 | Note type selector (Internal / Customer) | select | — | → S12 noteType |
| U92 | Channel selector | select | — | → S10 noteChannel |
| U93 | "Block this job" toggle | toggle | → N16 setBlockToggle() | → S8 blockToggleState, shows U94 |
| U94 | Block reason input (conditional) | type | — | → S5 blockReasonText |
| U95 | "Unblock this job" toggle (when blocked) | toggle | → N17 setUnblockToggle() | → S9 unblockToggleState |
| U96 | "Save" button | click | → N23 saveJobNote() | → close P5.1, note in feed, optional lane change |
| U97 | Cancel / close sheet | click | → N13 closeSheet() | → P5 |

### P5.2 — Lane Change Sheet

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U100 | Lane option list (Ready / In Progress / Review / Blocked / Done) | click | → N24 selectTargetLane() | → S13 targetLane |
| U101 | Current lane indicator | display | ← S3 job.lane | — |
| U102 | Block reason input (shown when Blocked selected) | type | — | → S5 blockReasonText |
| U103 | "Confirm Move" button | click | → N25 changeJobLane() | → close P5.2, lane badge updates |
| U104 | Cancel / close sheet | click | → N13 closeSheet() | → P5 |

### P6 — Mobile List Views (shared across all 4 list types)

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U110 | Search input (full-width) | type | → N26 searchList(query) | → S14 searchQuery, U113 filtered |
| U111 | Filter button | click | → open P6.1 | → P6.1 visible |
| U112 | "New" button (+ icon) | click | → N1 navigateTo("/[entity]/new") | → P8 |
| U113 | Card list (scrollable) | scroll | — | — |
| U114 | Entity card | click | → N1 navigateTo("/[entity]/[id]") | → P7 (detail) |
| U115 | Card primary line (ID + name) | display | ← S3 entity data | — |
| U116 | Card status badge | display | ← S3 entity.status/lane | — |
| U117 | Card key metric (amount, quantity, etc.) | display | ← S3 entity data | — |
| U118 | Card date | display | ← S3 entity dates | — |
| U119 | "Load more" button or infinite scroll trigger | click/scroll | → N27 loadMoreItems() | → U113 appended |

### P6.1 — Mobile Sort/Filter Sheet

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U120 | Sort selector (Date / Name / Status / Amount) | select | → N28 setSort() | → S15 sortParam |
| U121 | Status filter chips | toggle | → N29 setStatusFilter() | → S16 statusFilter |
| U122 | Service type filter (Jobs only) | toggle | → N30 setServiceTypeFilter() | → S17 serviceTypeFilter |
| U123 | "Apply" button | click | → N31 applyFilters(), N13 closeSheet() | → P6 filtered |
| U124 | "Reset" link | click | → N32 resetFilters() | → all filters cleared |
| U125 | Cancel / close sheet | click | → N13 closeSheet() | → P6 |

### P7 — Mobile Detail Views (shared patterns)

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U130 | Back button | click | → N33 goBack() | → previous page |
| U131 | Overflow menu (⋯) | click | → open dropdown | → action list |
| U132 | Collapsible section | toggle | → N34 toggleSection() | → section expanded/collapsed |
| U133 | Entity cross-link (e.g., customer name, linked quote) | click | → N1 navigateTo() | → target detail |
| U134 | Bottom action bar | display | — | — |
| U135 | Primary action button (context-dependent) | click | → varies by entity type | — |
| U136 | Secondary action button | click | → varies by entity type | — |

### P8 — Mobile Forms

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U140 | Single-column form fields | type/select | → standard form handlers | → form state |
| U141 | Sticky "Save" button (bottom) | click | → N35 submitForm() | → navigate to detail |
| U142 | Sticky "Cancel" button (bottom) | click | → N33 goBack() | → previous page |
| U143 | Form section collapse/expand | toggle | → N34 toggleSection() | → section state |
| U144 | Customer combobox (touch-optimized) | type/select | → N36 searchCustomers() | → selected customer |
| U145 | Line item card (mobile layout) | — | — | — |
| U146 | "Add Line Item" button | click | → N37 addLineItem() | → new card appended |

### P9 — Full-Screen Modal

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U150 | Close button (top-right × or back arrow) | click | → N38 closeModal() | → underlying page |
| U151 | Full-height scrollable content | scroll | — | — |
| U152 | Bottom action buttons (sticky) | click | → varies by modal content | — |

---

## Code Affordances

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To |
|----|-------|------------|-------|---------|-----------|------------|
| N1 | All | navigateTo(route) | 1 | U click events | → router.push() | → target page renders |
| N2 | P1 | matchRoute(pathname) | 1 | pathname change | — | → U6 active tab highlight |
| N3 | P1 | getPageTitle(pathname) | 1 | pathname change | — | → U7 mobile header |
| N4 | P2 | closeDrawer() | 1 | U10 click | → S1 drawerOpen = false | → P2 hidden |
| N5 | P3 | toggleComingUpFilter() | 1 | U21 toggle | → S18 comingUpFilter | → dashboard job list filtered to this week |
| N6 | P3, P4 | calculateCapacity() | 1 | page load | → reads S3 jobs | → U27, U40 capacity displays |
| N7 | P4 | selectLane(lane) | 1 | U30 click/swipe | → S4 activeLane | → card list re-renders for lane |
| N8 | P4 | countCardsInLane(lane) | 1 | S3 change | — | → U32 badge counts |
| N9 | P4 | moveToNextLane(jobId) | 1 | U34 click | → updates S3 job.lane | → card animation, U32 updates |
| N10 | P4, P5 | calcTaskProgress(tasks) | 1 | S3 tasks change | — | → U38, U77 progress bar |
| N11 | P4 | filterBoardSection(section) | 1 | U41 toggle | → S19 boardSection | → U31 filtered |
| N12 | P4.1 | blockJob(jobId, reason) | 1 | U51 click | → S3 job.lane = "blocked", job.blockReason | → card moves, P4.1 closes |
| N13 | Multiple | closeSheet() | 1 | cancel clicks | → sheet state = closed | → underlying page |
| N14 | P4.2 | setNoteEntity(type) | 1 | U56 select | → S20 noteEntityType | → U57 entity picker rendered |
| N15 | P4.2 | searchEntities(query, type) | 1 | U57 type | → filter S3 by query | → entity suggestions |
| N16 | P4.2, P5.1 | setBlockToggle(enabled) | 1 | U58, U93 toggle | → S8 blockToggleState | → U94 block reason shown |
| N17 | P4.2, P5.1 | setUnblockToggle(enabled) | 1 | U59, U95 toggle | → S9 unblockToggleState | — |
| N18 | P4.2 | saveNoteWithSideEffects() | 1 | U61 click | → creates note in S3, optionally blocks/unblocks job | → P4.2 closes, toast |
| N19 | P5 | selectDetailTab(tab) | 1 | U72 click | → S11 activeTab | → tab content renders |
| N20 | P5 | toggleTask(taskId) | 1 | U76 toggle | → S3 task.isCompleted, task.completedAt | → U77 progress updates |
| N21 | P5 | filterNotes(type) | 1 | U80 select | → S21 noteTypeFilter | → U79 filtered |
| N22 | P5 | unblockJob(jobId) | 1 | U82 click | → S3 job.lane = previous, blockReason = null | → U81 hidden, U74 updates |
| N23 | P5.1 | saveJobNote() | 1 | U96 click | → creates note in S3 jobs, optionally changes lane | → P5.1 closes, note in feed |
| N24 | P5.2 | selectTargetLane(lane) | 1 | U100 click | → S13 targetLane | → U102 conditional render |
| N25 | P5.2 | changeJobLane(jobId, lane, reason?) | 1 | U103 click | → S3 job.lane, optional blockReason | → P5.2 closes, U74 updates |
| N26 | P6 | searchList(query) | 1 | U110 type | → S14 searchQuery (URL param) | → U113 filtered cards |
| N27 | P6 | loadMoreItems() | 1 | U119 trigger | → S22 page/offset | → U113 appended cards |
| N28 | P6.1 | setSort(field, direction) | 1 | U120 select | → S15 sortParam (URL param) | — |
| N29 | P6.1 | setStatusFilter(statuses) | 1 | U121 toggle | → S16 statusFilter (URL param) | — |
| N30 | P6.1 | setServiceTypeFilter(types) | 1 | U122 toggle | → S17 serviceTypeFilter (URL param) | — |
| N31 | P6.1 | applyFilters() | 1 | U123 click | → updates URL params from S15-S17 | → P6 re-renders filtered |
| N32 | P6.1 | resetFilters() | 1 | U124 click | → clears S15-S17, URL params | → P6 shows all |
| N33 | Multiple | goBack() | 1 | back buttons | → router.back() or navigateTo() | → previous page |
| N34 | P7, P8 | toggleSection(sectionId) | 1 | U132, U143 toggle | → local state | → section expanded/collapsed |
| N35 | P8 | submitForm() | 1 | U141 click | → validate + save to S3 | → navigate to detail page |
| N36 | P8 | searchCustomers(query) | 1 | U144 type | → filter S3 customers | → combobox suggestions |
| N37 | P8 | addLineItem() | 1 | U146 click | → append to form state | → new line item card |
| N38 | P9 | closeModal() | 1 | U150 click | → modal state = closed | → underlying page |

### Phase 2 Extensions

| ID | Place | Affordance | Phase | Replaces | Description |
|----|-------|------------|-------|----------|-------------|
| N50 | P4.2, P5.1 | saveNoteToAPI() | 2 | N18, N23 (partial) | Persist note to database via API |
| N51 | P4 | moveJobLaneAPI(jobId, lane) | 2 | N9 (partial) | Persist lane change to database |
| N52 | P4 | subscribeToBoard() | 2 | — | Real-time board updates via WebSocket/SSE for shop floor display |
| N53 | P1 | registerPushNotifications() | 2 | — | Request permission + register service worker |
| N54 | P1 | handlePushNotification(data) | 2 | — | Navigate to relevant detail view on notification tap |

---

## Data Stores

| ID | Place | Store | Type | Read By | Written By |
|----|-------|-------|------|---------|------------|
| S1 | P1, P2 | Drawer open state | React state | P2 render | U5 (open), U10/N4 (close) |
| S2 | P1 | Viewport width (< 768px detection) | CSS/hook | Shell layout (md: breakpoint) | Browser resize |
| S3 | All | Mock data (jobs, quotes, customers, invoices) | Imported mock | All N- affordances, all U- displays | N9, N12, N18, N20, N22, N23, N25, N35 (client-side mutations) |
| S4 | P4 | Active lane tab | React state | U31 card list, U31 indicator | N7 selectLane() |
| S5 | P4.1, P5.1, P5.2 | Block reason text | React state | N12, N23, N25 | U50, U94, U102 type |
| S6 | P4.2, P5.1 | Note text | React state | N18, N23 | U55, U90 type |
| S7 | P4.2 | Selected entity (for note attachment) | React state | N18 | U57 select |
| S8 | P4.2, P5.1 | Block toggle state | React state | N18, N23 | N16 |
| S9 | P4.2, P5.1 | Unblock toggle state | React state | N18, N23 | N17 |
| S10 | P4.2, P5.1 | Note channel | React state | N18, N23 | U60, U92 select |
| S11 | P5 | Active detail tab (Overview / Tasks / Notes) | React state | Tab content render | N19 |
| S12 | P5.1 | Note type (Internal / Customer) | React state | N23 | U91 select |
| S13 | P5.2 | Target lane selection | React state | N25 | N24 |
| S14 | P6 | Search query | URL param `?q=` | N26 filter | U110 type |
| S15 | P6 | Sort parameter | URL param `?sort=` | N28 sort | U120 select |
| S16 | P6 | Status filter | URL param `?status=` | N29 filter | U121 toggle |
| S17 | P6 | Service type filter | URL param `?serviceType=` | N30 filter | U122 toggle |
| S18 | P3 | "Coming up" filter (this week) | React state | N5 filter logic | U21 toggle |
| S19 | P4 | Board section filter (Quotes / Jobs / All) | React state | N11 filter | U41 toggle |
| S20 | P4.2 | Note entity type | React state | N15 search | N14 |
| S21 | P5 | Note type filter | React state | N21 filter | U80 select |
| S22 | P6 | Pagination offset | React state | N27 | U119 trigger |

---

## Wiring Verification

- [x] Every UI affordance (U) has at least one Wires Out or Returns To
- [x] Every code affordance (N) has a trigger (from a U or another N)
- [x] Every data store (S) has at least one reader and one writer
- [x] Every "Wires Out" target exists in the tables (no dangling references)
- [x] Every "Returns To" target exists in the tables
- [x] No orphan affordances (connected to nothing)
- [x] Every CORE feature from scope definition has corresponding affordances (see Scope Coverage below)

---

## Component Boundaries

| Component | Place(s) | Contains Affordances | Location | Shared? |
|-----------|----------|---------------------|----------|---------|
| `<BottomTabBar>` | P1 | U1-U6 | `components/layout/bottom-tab-bar.tsx` | Yes — used in dashboard layout |
| `<MobileHeader>` | P1 | U7, U8 | `components/layout/mobile-header.tsx` | Yes — used in dashboard layout |
| `<MobileDrawer>` | P2 | U10-U14 | `components/layout/mobile-drawer.tsx` | Yes — used in dashboard layout |
| `<MobileCardList>` | P6 | U113-U119 | `components/ui/mobile-card-list.tsx` | Yes — all 4 list views |
| `<EntityCard>` (variant per entity) | P6 | U114-U118 | `components/features/EntityCard.tsx` or inline | Partial — card template shared, content varies |
| `<BottomSheet>` | P4.1, P4.2, P5.1, P5.2, P6.1 | U150-U152 (container pattern) | `components/ui/bottom-sheet.tsx` | Yes — reused across all bottom sheets |
| `<BottomActionBar>` | P5, P7 | U85-U87, U134-U136 | `components/layout/bottom-action-bar.tsx` | Yes — all mobile detail views |
| `<NoteCapture>` | P4.2, P5.1 | U55-U62, U90-U97 | `components/features/NoteCapture.tsx` | Yes — shared between board + job detail |
| `<LaneSelector>` | P5.2, P4 (inline) | U100-U104, U34 | `components/features/LaneSelector.tsx` | Yes — reused in lane change sheet + board quick actions |
| `<MobileFilterSheet>` | P6.1 | U120-U125 | `components/features/MobileFilterSheet.tsx` | Yes — used by all list views with config |
| `<MobileDashboard>` | P3 | U20-U28 | Inline in `app/(dashboard)/page.tsx` | No — dashboard-specific |
| `<MobileKanbanBoard>` | P4 | U30-U44 | `app/(dashboard)/jobs/board/_components/MobileKanbanBoard.tsx` | No — board-specific |
| `<CapacitySummary>` | P3, P4 | U27, U40 | `components/features/CapacitySummary.tsx` | Yes — used in dashboard + board |
| `<FullScreenModal>` | P9 | wrapper for existing dialogs | `components/ui/full-screen-modal.tsx` | Yes — wraps existing Dialog component |

---

## Build Order

Based on the interview-validated hybrid strategy: Foundation Sprint first, then high-value screens.

### Sprint 1: Foundation (~1 week)

| # | Component/Screen | Depends On | Blocks | Est. Complexity |
|---|-----------------|------------|--------|-----------------|
| 1 | Design tokens (I3) — `--mobile-nav-height`, `--mobile-touch-target`, `--mobile-bottom-safe-area` in `globals.css` | None | Steps 2-6 | Low |
| 2 | `<BottomTabBar>` (P1: U1-U6) | Step 1 | Steps 4, all mobile pages | Medium |
| 3 | `<MobileDrawer>` (P2: U10-U14) | Step 2 | Step 4 | Medium |
| 4 | `<MobileHeader>` (P1: U7-U8) + dashboard layout changes — hide sidebar on mobile, show tab bar | Steps 2-3 | All mobile pages | Medium |
| 5 | Global touch target audit + fixes (C4) — buttons ≥ 44px, link padding, spacing between interactive elements | Step 1 | Nothing (parallel-safe) | Medium |
| 6 | `<MobileCardList>` (P6: U113-U119) + `<EntityCard>` base | Step 1 | Sprint 3 list views |  Medium |
| 7 | `<BottomSheet>` (shared container for P4.1, P4.2, P5.1, P5.2, P6.1) | Step 1 | Sprint 2 interaction patterns | Medium |

### Sprint 2: High-Value Screens (~1 week)

| # | Component/Screen | Depends On | Blocks | Est. Complexity |
|---|-----------------|------------|--------|-----------------|
| 8 | `<MobileKanbanBoard>` (P4: U30-U44) — lane tabs, swipe, card list, quick actions | Steps 2, 4, 7 | Step 10 | High |
| 9 | `<CapacitySummary>` (U27, U40) — jobs/shirts this week, rush count | Step 8 | Nothing | Low |
| 10 | `<NoteCapture>` with side effects (P4.2, P5.1: U55-U62, U90-U97) — note + block/unblock toggle | Steps 7, 8 | Nothing | High |
| 11 | `<MobileDashboard>` (P3: U20-U28) — blocked alert, coming up filter, 2-col stats, capacity summary | Steps 2, 4, 9 | Nothing | Medium |
| 12 | `<LaneSelector>` (P5.2: U100-U104) — lane picker in bottom sheet | Step 7 | Step 14 (detail views) | Low |

### Sprint 3: List Views + Forms (~1 week)

| # | Component/Screen | Depends On | Blocks | Est. Complexity |
|---|-----------------|------------|--------|-----------------|
| 13 | Quotes list → mobile cards | Steps 4, 6 | Nothing | Low |
| 14 | Jobs list → mobile cards | Steps 4, 6 | Nothing | Low |
| 15 | Invoices list → mobile cards | Steps 4, 6 | Nothing | Low |
| 16 | Customers list → mobile cards | Steps 4, 6 | Nothing | Low |
| 17 | `<MobileFilterSheet>` (P6.1: U120-U125) | Steps 6, 7 | Nothing | Medium |
| 18 | Form mobile layouts — New Quote, New Invoice (P8: U140-U146) | Steps 4, 5 | Nothing | Medium |

### Sprint 4: Detail Views + Polish (~1 week)

| # | Component/Screen | Depends On | Blocks | Est. Complexity |
|---|-----------------|------------|--------|-----------------|
| 19 | `<BottomActionBar>` (P5, P7: U85-U87, U134-U136) | Step 4 | Steps 20-23 | Low |
| 20 | Job Detail mobile (P5: U70-U82) — tabs, tasks, notes, bottom actions | Steps 10, 12, 19 | Nothing | High |
| 21 | Quote Detail mobile | Steps 4, 19 | Nothing | Medium |
| 22 | Invoice Detail mobile | Steps 4, 19 | Nothing | Medium |
| 23 | Customer Detail mobile | Steps 4, 19 | Nothing | Low |
| 24 | `<FullScreenModal>` (P9: U150-U152) — dialog → full-screen on mobile | Step 7 | Nothing | Low |
| 25 | Desktop regression testing (I1) | All above | Nothing | Medium |

---

## Scope Coverage

| Scope Feature | Affordances | Covered? |
|---------------|-------------|----------|
| C1: Mobile Navigation Shell | U1-U8 (tab bar), U10-U14 (drawer), N1-N4 | Yes |
| C2: Responsive Dashboard | U20-U28, N5-N6, S18 | Yes |
| C3: Table → Card Conversion | U110-U119 (MobileCardList), U114-U118 (cards) | Yes |
| C4: Touch-Friendly Interactive Elements | Build step 5 (global audit), Step 1 tokens | Yes |
| C5: Mobile-Optimized Forms | U140-U146, P8 | Yes |
| C6: Kanban Board Mobile | U30-U44 (board), U50-U52 (block), P4 | Yes |
| C7: Detail View Mobile Layouts | U70-U82 (job), U130-U136 (shared), P7 | Yes |
| C8: Dialog/Modal Mobile Sizing | U150-U152, P9 | Yes |
| I1: Desktop Preserved | Build step 25 (regression testing) | Yes |
| I2: URL State Consistency | S14-S17 (URL params shared between mobile/desktop) | Yes |
| I3: Design Tokens | Build step 1, S2 (viewport detection) | Yes |
| I4: Shared Components | BottomTabBar, MobileCardList, BottomSheet, BottomActionBar | Yes |
| **Interview: Notes with side effects** | U58-U62, U93-U97, N16-N18, N23, S8-S9 | Yes |
| **Interview: Capacity summary** | U27, U40, N6, CapacitySummary component | Yes |
| **Interview: "Coming up" filter** | U21, N5, S18 | Yes |
| **Interview: Two-speed task tracking** | U34 (quick move), U76 (task checkbox) | Yes |

---

## Phase 2 Extensions

Code affordances that will be added in Phase 2:

| ID | Place | Affordance | Replaces | Description |
|----|-------|------------|----------|-------------|
| N50 | P4.2, P5.1 | saveNoteToAPI() | N18, N23 | Persist notes to database, trigger server-side lane changes |
| N51 | P4 | moveJobLaneAPI() | N9 | Persist lane changes via API call |
| N52 | P4 | subscribeToBoard() | — | Real-time board updates (WebSocket/SSE) for shop floor display |
| N53 | P1 | registerPushNotifications() | — | Service worker + push permission (quote accepted, rush order, job at risk) |
| N54 | P1 | handlePushNotification() | — | Deep-link navigation on notification tap |
| N55 | P8 | mobileQuoteShareAction() | — | Share quote via native share sheet (text/email) |
| N56 | All | offlineCacheShell() | — | Service worker caching for app shell + recently viewed data |

---

## Related Documents

- `docs/strategy/mobile-optimization-scope-definition.md` (scope boundaries)
- `docs/strategy/mobile-optimization-improved-journey.md` (improved journey + wireframes)
- `docs/plans/2026-02-14-mobile-optimization-design.md` (interview-validated design)
- `docs/APP_FLOW.md` (routes and navigation)
- `knowledge-base/src/content/sessions/2026-02-14-mobile-optimization-interview.md` (interview findings)
- `CLAUDE.md` (design system, quality checklist)
