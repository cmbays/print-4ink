---
title: 'Screen Print Pro — Improved Jobs & Production Journey'
description: 'Redesigned production workflow addressing all friction points with universal board, capacity awareness, and quality gates'
category: strategy
status: complete
phase: 1
vertical: jobs-production
created: 2026-02-12
last-verified: 2026-02-12
depends-on:
  - docs/competitive-analysis/jobs-vertical-synthesis.md
  - docs/competitive-analysis/jobs-journey-map.md
---

# Screen Print Pro — Improved Jobs & Production Journey

**Purpose**: Design the production management experience for Screen Print Pro, addressing all 12 friction points from the current journey map
**Input**: Competitive analysis synthesis, journey map, user interview (12 questions)
**Status**: Complete — ready for scope definition and build

---

## Design Principles (From Discovery)

1. **Board is the single source of truth** — no separate dashboards, Today is a filter
2. **Universal lanes, not per-service lanes** — Ready/In Progress/Review/Blocked/Done works for all service types
3. **Service type is the primary visual** — color + icon, instantly scannable across the board
4. **Capacity awareness at the point of commitment** — help Gary make confident delivery date decisions
5. **Guardrails, not gates** — quality checkpoints that help without burdening
6. **Cards are command centers** — task checklists, action buttons, history feed, links to related entities
7. **Quick capture over forced structure** — scratch notes for lightweight logging
8. **Inferred intelligence** — productivity tracking from state transitions, not manual logging
9. **Conservative warnings only** — flag overbooking only when highly confident, never false positives
10. **Two horizontal sections** — Quotes row and Jobs row share the same vertical lanes

---

## Board Architecture

### Layout

```text
                 Ready          In Progress       Review         Blocked         Done
              ┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
  Quotes      │ [scratch]   │ [drafting]   │ [customer    │ [waiting on  │ [accepted →  │
              │ [new leads] │ [building]   │  reviewing]  │  customer]   │  auto-clear] │
              ├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
  Jobs        │ [approved,  │ [screen prep]│ [QC check]   │ [blanks not  │ [shipped,    │
              │  not started│ [printing]   │ [customer    │  arrived]    │  awaiting    │
              │  yet]       │ [embroidery] │  sign-off]   │ [art issue]  │  payment]    │
              └─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Lane Definitions

| Lane            | Meaning                                 | Quote Context                         | Job Context                                 |
| --------------- | --------------------------------------- | ------------------------------------- | ------------------------------------------- |
| **Ready**       | Logged, not started yet                 | Phone call noted, need to build quote | Quote accepted, need to prep for production |
| **In Progress** | Actively being worked on                | Drafting/building the quote           | Screens being burned, shirts being printed  |
| **Review**      | Quality gate / approval pending         | Customer reviewing our quote          | QC check before shipping, customer sign-off |
| **Blocked**     | External dependency — nothing we can do | Waiting on customer decision/info     | Blanks not arrived, waiting on art approval |
| **Done**        | Work complete, still tracking           | Accepted → auto-generates Job card    | Shipped, may still need payment             |

### Review Lane

Configurable via settings (enabled by default). When enabled:

- Jobs MUST pass through Review before Done
- Review = quality checkpoint (QC checklist completed)
- Can also be used for customer sign-off on completed work
- If disabled, cards go directly from In Progress → Done

### Board-Level Controls

- **Time horizon selector**: 1 week / 2 weeks / 1 month (default: 2 weeks)
- **Filters**: Today | Service Type | Quotes vs Jobs | Risk Level
- **Capacity summary bar** (above board): Rush orders count, total quantity, due date distribution
- **What-if date picker**: Select potential due date → see work landscape between now and then

---

## Card Design

### Card (Closed — On Board)

```text
┌──────────────────────────────────┐
│ 🟢 Screen Printing    [JD]      │  ← Service type color + icon, Assignee initials
│                                  │
│ Acme Corp — Company Tees         │  ← Customer + Job nickname
│ 200 shirts · 2 locations         │  ← Quantity + complexity indicator
│                                  │
│ Due: Feb 14 ●                    │  ← Due date, risk dot (green/orange/red)
│ ████████░░ 6/8 tasks             │  ← Task completion progress bar
└──────────────────────────────────┘
```

**Visual encoding:**

- **Service type**: Card left-border color + small icon (🖨️ Screen, 🎨 DTF, 🧵 Embroidery)
- **Quantity**: Plain number + unit (shirts, hats, transfers)
- **Complexity**: Location count, screen count — shown as "2 locations" or "4 screens"
- **Due date**: Text date. Color-coded dot ONLY when at risk:
  - No dot = on track (> 3 days buffer)
  - 🟡 Orange = getting tight (estimated work ≈ remaining time)
  - 🔴 Red = at risk (estimated work > remaining time) or overdue
- **Task progress**: Mini progress bar showing completed/total canonical tasks
- **Assignee**: Initials badge in top-right corner (future-proofed, optional)

### Card (Open — Detail View / Command Center)

```text
┌──────────────────────────────────────────────────────────┐
│ ← Back to Board                                    [···] │
│                                                          │
│ 🟢 SCREEN PRINTING                    Lane: In Progress  │
│ ══════════════════════════════════════════════════════════│
│                                                          │
│ Acme Corp — Company Tees                    Job #1024    │
│ John Smith · john@acme.com · (555) 123-4567             │
│                                                          │
│ ┌──────────────┬──────────────┬──────────────┐          │
│ │ Due: Feb 14  │ Start: Feb 10│ Created: Feb 8│          │
│ │ ● On Track   │              │              │          │
│ └──────────────┴──────────────┴──────────────┘          │
│                                                          │
│ QUICK ACTIONS                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐       │
│ │ Move Lane → │ │ Mark Blocked│ │ View Invoice  │       │
│ └─────────────┘ └─────────────┘ └──────────────┘       │
│                                                          │
│ ── TASKS ──────────────────────────────────────────────  │
│ ☑ Art files received                                     │
│ ☑ Screens burned (4 screens, 230 mesh)                   │
│ ☐ Blanks received (expected Feb 12)                      │
│ ☐ Press run complete                                     │
│ ☐ QC inspection passed                                   │
│ ☐ Packed and labeled                                     │
│                                                          │
│ ── DETAILS ────────────────────────────────────────────  │
│ Quantity: 200 shirts                                     │
│ Garments: Gildan 5000 Black (S:10, M:50, L:80, XL:40, 2XL:20) │
│ Locations: Front (4-color), Back (1-color)               │
│ Screens: 5 total                                         │
│                                                          │
│ ── NOTES & HISTORY ────────────────────────────────────  │
│ [Internal] Feb 11 — Gary: Using 230 mesh for detail work │
│ [Customer] Feb 10 — John: Can we add pocket print?       │
│ [System]   Feb 9  — Quote #Q-1024 accepted               │
│ [Internal] Feb 8  — Gary: New lead from phone call       │
│                                                          │
│ ── LINKED ─────────────────────────────────────────────  │
│ Quote: #Q-1024 ($1,840.00)  │  Invoice: #INV-1024       │
│ Customer: Acme Corp          │  Files: 3 attached         │
└──────────────────────────────────────────────────────────┘
```

**Key features of detail view:**

- **Quick Actions**: Move lane, mark blocked, view invoice — one-click operations
- **Task checklist**: Canonical tasks per service type + custom tasks. Completing all tasks makes card eligible for next lane.
- **Notes feed**: Chronological feed mixing internal notes, customer messages, and system events. Each note tagged with visibility (internal/customer/system).
- **Linked entities**: Direct links to quote, invoice, customer record, attached files
- **Block reason**: When blocked, shows why and provides "Unblock" action

---

## Card Lifecycle

### Quote Lifecycle

```text
ENTRY: Quick capture (scratch note) or "New Quote" button

1. SCRATCH NOTE → Ready lane (Quotes row)
   • Minimum: just a text note ("John called, 200 black tees, wants by Friday")
   • Action button: "Create Quote from this"

2. BUILDING QUOTE → In Progress lane
   • Gary builds the quote using the quote form
   • Quote is in draft mode
   • Action button: "Send to Customer" (Phase 2: actual send. Phase 1: marks as sent)

3. CUSTOMER REVIEWING → Review lane (or Blocked lane)
   • Review: if we think of it as "customer needs to review"
   • Blocked: if we think of it as "waiting on external action"
   • User choice — either lane works. Default: Blocked (since it's external)

4. ACCEPTED → Done lane
   • Customer accepts the quote
   • Quote card gets "New" badge until Gary acknowledges
   • Action button: "Create Invoice & Job"
   • Card auto-clears from Done after job is created

5. DECLINED → Done lane (with "Declined" badge, eventually archives)
```

### Job Lifecycle

```text
ENTRY: Created from accepted quote (manual gate — configurable)

1. PREP NEEDED → Ready lane (Jobs row)
   • Job created with canonical tasks for service type
   • Canonical tasks auto-populated (e.g., screen printing: burn screens, check blanks, etc.)
   • Gary reviews, adjusts tasks if needed

2. WORK IN PROGRESS → In Progress lane
   • Gary/team working through tasks
   • Task completion progress bar updates on card
   • Sub-stage indicator shows current phase (e.g., "Screen Prep" or "Printing")
   • DTF rush orders can enter here directly with minimal tasks

3. QUALITY CHECK → Review lane
   • All production tasks complete
   • QC checklist must pass before moving to Done
   • If QC fails → back to In Progress with note

4. EXTERNAL BLOCK → Blocked lane (at any time)
   • Blanks not arrived
   • Waiting on art revision from customer
   • Equipment issue requiring vendor service
   • Block reason captured, timestamp logged

5. COMPLETE → Done lane
   • Shipped or picked up by customer
   • May still be awaiting payment (tracked via linked invoice)
   • Card stays in Done until payment received, then archives
```

---

## Capacity Awareness

### What-If Date Picker (Key Feature)

When Gary is on a call and needs to commit a delivery date:

1. Opens the **what-if tool** (always accessible from board header)
2. Picks a potential due date (e.g., "5 days from now")
3. System shows:
   - **Work landscape**: All cards due between now and that date
   - **By service type**: X screen printing jobs (Y shirts), Z DTF orders, W embroidery
   - **Complexity summary**: Total locations, total screens
   - **Rush orders**: Count of rush-flagged items
   - **Risk items**: Count of cards in Blocked or at-risk state
4. Gary makes informed gut call: "Yeah, we can take that" or "That would need to be a rush order"

### Overbooking Warnings (Conservative)

- Only triggered when system is **highly confident** capacity is exceeded
- Based on: total quantity due in time window vs historical daily output average
- **Never false positive** — better to not warn than to cry wolf
- Visual: subtle warning banner at top of board, dismissible
- Example: "Heads up: 1,200 shirts due by Thursday. Your weekly average is 800."

### Daily Output Tracking (Inferred)

- When a job moves to Done, system records: quantity completed, date, service type
- Over time, builds: daily output, weekly average, monthly trends
- **Optional end-of-day summary** (settings toggle):
  - "Today: 5 jobs completed (450 shirts). 20% above your weekly average!"
  - Positive, celebratory tone. Never punitive.
- Data feeds capacity calculations and overbooking warnings

---

## Notification System

### Quote Accepted Flow

1. Customer accepts quote (Phase 1: Gary marks it manually. Phase 2: customer portal)
2. **Email notification** → configured notification email
3. **In-app notification bell** → badge count increments
4. Click notification → opens quote card detail
5. Quote card in Done lane gets "New" indicator
6. Gary clicks "Create Invoice & Job" when ready
7. Job card appears in Ready lane

### Other Notifications (In-App Bell)

| Event                          | Notification                                                 |
| ------------------------------ | ------------------------------------------------------------ |
| Quote accepted                 | "Quote #Q-1024 accepted by John Smith"                       |
| Card blocked for 2+ days       | "Job #1024 has been blocked for 2 days (blanks not arrived)" |
| Due date approaching + at risk | "Job #1024 due in 2 days — 3 tasks remaining"                |
| All tasks completed            | "Job #1024 — all tasks complete, ready for QC"               |

---

## Service Type Handling

### Universal Lanes, Different Task Templates

The board lanes are universal. What differs per service type is the **canonical task list** that auto-populates when a job is created:

**Screen Printing Tasks:**

1. ☐ Art files finalized
2. ☐ Film positives printed
3. ☐ Screens burned (mesh count: \_\_\_)
4. ☐ Screens registered on press
5. ☐ Blanks received and counted
6. ☐ Press run complete
7. ☐ QC inspection passed
8. ☐ Packed and labeled

**DTF Tasks:**

1. ☐ Art files finalized
2. ☐ Gang sheet prepared
3. ☐ DTF printed
4. ☐ Transfers pressed (if applicable)
5. ☐ QC inspection passed
6. ☐ Packed and labeled

**Embroidery Tasks:**

1. ☐ Art files finalized
2. ☐ Design digitized (stitch file created)
3. ☐ Digitizer machine set up
4. ☐ Blanks received and counted
5. ☐ Embroidery run complete
6. ☐ QC inspection passed
7. ☐ Packed and labeled

**Key**: Steps can be skipped (repeat customer = screens already exist), tasks can be manually added/removed per job. But the defaults ensure nothing gets forgotten.

---

## Friction Point Resolution Map

| #   | Friction Point               | Solution                                                   | Where It Lives                         |
| --- | ---------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| 1   | No quick capture             | Scratch notes in Ready lane                                | Board → "+" button → scratch note      |
| 2   | No capacity awareness        | What-if date picker + overbooking warnings                 | Board header tools                     |
| 3   | No quality gate              | Review lane with QC checklist                              | Review lane (configurable)             |
| 4   | Screen prep invisible        | Canonical task list for screen printing                    | Job card tasks                         |
| 5   | Wall calendar as SOT         | Board replaces wall calendar                               | Board is primary view                  |
| 6   | DTF interrupts               | DTF cards visible on same board with service type color    | Board with color-coded cards           |
| 7   | No "today" view              | Today filter on board (start-date based)                   | Board filter bar                       |
| 8   | No quote pipeline states     | Quotes row on board with lane states                       | Board upper section                    |
| 9   | No blocked visibility        | Blocked lane with reason tracking                          | Dedicated board lane                   |
| 10  | Communication outside system | Notes feed on card (internal + customer)                   | Card detail view                       |
| 11  | No production analytics      | Inferred daily output, weekly averages                     | Settings + optional end-of-day summary |
| 12  | Payment disconnected         | Linked invoice on job card, Done lane tracks payment state | Card detail → linked entities          |

---

## Screens Required (Build Scope)

### F2: Jobs List (alternative list view of the board)

- Sortable, filterable table of all cards
- Columns: Service Type, Customer, Job Name, Quantity, Due Date, Lane, Risk, Assignee
- Search by customer name, job name, or ID
- Useful for bulk operations and detailed filtering

### F3: Job Detail (card detail view)

- Full command center as designed above
- Task management, notes feed, quick actions, linked entities
- Accessible from board click or jobs list click

### F4: Production Board (primary view)

- Two-section layout (Quotes row + Jobs row)
- 5 universal lanes
- Card design with service type, quantity, due date, risk, tasks
- Drag-and-drop between lanes
- Filter bar (Today, Service Type, Quotes/Jobs, Risk)
- Capacity tools (what-if picker, summary stats)

### Settings: Board Configuration

- Enable/disable Review lane
- Configure service types (name, color, icon)
- Configure canonical task lists per service type
- Auto-invoice toggle (manual gate vs auto-generate)
- Sprint horizon (1 week / 2 weeks / 1 month)
- Notification preferences
- End-of-day summary toggle

---

## Phase 1 vs Phase 2

### Phase 1 (Building Now — Mock Data)

- Production Board with universal lanes, two sections
- Card design (closed + open detail view)
- Canonical task lists per service type
- Today filter
- Due date risk indicators
- Scratch note capture
- Quick actions (move lane, mark blocked)
- Notes feed (internal only — no customer portal yet)
- Jobs List (table view)
- Basic capacity summary (count of items, total quantity)
- Review lane with QC checklist

### Phase 2 (Future)

- Customer portal integration (real quote approval flow)
- Real notifications (email + in-app)
- What-if date picker with historical data
- Overbooking warnings based on tracked output
- End-of-day productivity summary
- Assignee management
- Drag-and-drop reordering within lanes
- Automation rules (task completion → lane transition)
- Production analytics dashboard

---

## Related Documents

- `docs/competitive-analysis/jobs-vertical-synthesis.md` — Competitive analysis
- `docs/competitive-analysis/jobs-journey-map.md` — Current journey friction map
- `docs/strategy/jobs-scope-definition.md` — Scope definition (next step)
