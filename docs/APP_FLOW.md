# Screen Print Pro — App Flow

> Every screen, route, and navigation path. The authoritative reference for how users move through the app.

**Last Updated**: 2026-02-07
**Last Verified**: 2026-02-07

---

## Tool Overview

**Name**: Screen Print Pro
**Purpose**: Production management for a screen-printing shop — track jobs from quote to shipment
**Primary User**: Shop owner/operator (Chris at 4Ink)
**Entry Point**: Opens app in browser, lands on Dashboard (`/`)

---

## Screen Inventory

| # | Screen | Route | Description | PRD Feature |
|---|--------|-------|-------------|-------------|
| 1 | Dashboard | `/` | Production overview: blocked, in-progress, shipped | F1 |
| 2 | Jobs List | `/jobs` | Sortable/filterable table of all jobs | F2 |
| 3 | Job Detail | `/jobs/[id]` | Full job view: customer, garments, artwork, timeline | F3 |
| 4 | Kanban Board | `/jobs/board` | Drag-and-drop production board | F4 |
| 5 | Quotes List | `/quotes` | Table of quotes with status | F5 |
| 6 | Quote Detail | `/quotes/[id]` | Full quote breakdown | F6 |
| 7 | New Quote | `/quotes/new` | Create quote with dynamic line items | F7 |
| 8 | Customers List | `/customers` | Searchable customer table | F8 |
| 9 | Customer Detail | `/customers/[id]` | Customer info + linked jobs/quotes | F9 |
| 10 | Screen Room | `/screens` | Screen inventory with burn status | F10 |
| 11 | Garment Catalog | `/garments` | Browse garment styles by brand | F11 |

---

## Navigation Map

### Sidebar (persistent, always visible)

```
Dashboard       /
Jobs            /jobs
Quotes          /quotes
Customers       /customers
Screen Room     /screens
Garments        /garments
```

Active state: highlighted background when route matches (exact for `/`, prefix for others).

### Breadcrumb Trails

| Current Screen | Breadcrumb |
|----------------|------------|
| Dashboard | (none — root) |
| Jobs List | Dashboard > Jobs |
| Job Detail | Dashboard > Jobs > J-1024 |
| Kanban Board | Dashboard > Jobs > Board |
| Quotes List | Dashboard > Quotes |
| Quote Detail | Dashboard > Quotes > Q-2048 |
| New Quote | Dashboard > Quotes > New Quote |
| Customers List | Dashboard > Customers |
| Customer Detail | Dashboard > Customers > River City Brewing Co. |
| Screen Room | Dashboard > Screen Room |
| Garment Catalog | Dashboard > Garments |

### Cross-Links (navigation between related entities)

```
Dashboard
  ├── [click blocked job]     → /jobs/[id]
  ├── [click in-progress job] → /jobs/[id]
  └── [click shipped job]     → /jobs/[id]

Job Detail (/jobs/[id])
  ├── [click customer name]   → /customers/[customerId]
  ├── [click linked quote]    → /quotes/[quoteId]
  └── [back to list]          → /jobs

Quote Detail (/quotes/[id])
  ├── [click customer name]   → /customers/[customerId]
  └── [back to list]          → /quotes

Customer Detail (/customers/[id])
  ├── [click job row]         → /jobs/[jobId]
  ├── [click quote row]       → /quotes/[quoteId]
  └── [back to list]          → /customers

Screen Room (/screens)
  └── [click linked job]      → /jobs/[jobId]
```

---

## User Journeys

### Journey 1: Morning Status Check

**Goal**: Understand shop state in 5 seconds
**Trigger**: Shop owner opens app at start of day
**Prerequisites**: None

#### Flow

1. **Land on Dashboard** (`/`)
   - System shows: Summary cards (Blocked, In Progress, Shipped, Total)
   - System shows: "Needs Attention" section with blocked jobs
   - System shows: "In Progress" section with active jobs
   - User scans in 5 seconds: "1 blocked, 3 in progress, 1 shipped"

2. **Check blocked job**
   - User clicks blocked job row
   - System navigates to `/jobs/[id]`
   - User sees: which artwork approvals are pending
   - User knows: "I need to follow up with Sarah on the Lacrosse jersey artwork"

3. **Return to dashboard**
   - User clicks "Jobs" in breadcrumb or sidebar
   - Back to overview

#### Success State
- User knows shop state without scrolling or clicking more than once

---

### Journey 2: Find and Review a Job

**Goal**: Look up a specific job and see its full status
**Trigger**: Customer calls asking about their order

#### Flow

1. **Navigate to Jobs List** (`/jobs`)
   - User clicks "Jobs" in sidebar

2. **Search for job**
   - User types job number or customer name in search
   - Table filters in real-time
   - User sees matching row

3. **Open Job Detail** (`/jobs/[id]`)
   - User clicks job row
   - System shows full detail: customer, garments with sizes, print locations with artwork status, production state, priority, due date
   - Status timeline shows progression: design -> approval -> burning -> (current)

4. **Check artwork status**
   - Print locations section shows approved/pending per location
   - User tells customer: "Front is approved, back needs your sign-off"

#### Success State
- User found job and answered customer question in <30 seconds

#### Error States
| Condition | User Sees | Recovery |
|-----------|-----------|----------|
| No search results | "No jobs match your search" | Clear search, browse full list |
| Job not found (bad URL) | 404 page | Link back to jobs list |

---

### Journey 3: Move Jobs Through Production (Kanban)

**Goal**: Visually manage production flow by dragging jobs between stages
**Trigger**: Job completes a production stage

#### Flow

1. **Navigate to Kanban Board** (`/jobs/board`)
   - User clicks "Jobs" in sidebar, then switches to "Board" view tab
   - OR direct sidebar link if space allows

2. **View production columns**
   - System shows 6 columns: Design, Approval, Burning, Press, Finishing, Shipped
   - Each column has job cards showing: job number, title, customer, due date, priority badge

3. **Drag job to next stage**
   - User drags "J-1027" from Burning → Press
   - Card animates to new column
   - Status updates in mock data (client-side only)

4. **Verify new state**
   - Card appears in Press column
   - Card count updates in column headers

#### Success State
- Job visually moved, shop state updated

---

### Journey 4: Create a New Quote

**Goal**: Build a quote for a customer inquiry
**Trigger**: Customer requests pricing

#### Flow

1. **Navigate to Quotes** (`/quotes`)
   - User clicks "Quotes" in sidebar

2. **Click "New Quote"** button
   - System navigates to `/quotes/new`

3. **Select customer**
   - User picks customer from dropdown (existing customers)

4. **Add line items**
   - User clicks "Add Line Item"
   - Fills in: description, quantity, color count, locations
   - System auto-calculates unit price and line total
   - User can add multiple line items

5. **Set setup fees**
   - User enters setup fee amount

6. **Review totals**
   - System shows: subtotal (sum of line items), setup fees, grand total

7. **Save quote**
   - User clicks "Save as Draft"
   - System navigates to `/quotes/[new-id]` (quote detail)
   - Toast: "Quote Q-2051 created"

#### Success State
- Quote saved with accurate pricing, visible in quotes list

#### Error States
| Condition | User Sees | Recovery |
|-----------|-----------|----------|
| Missing required fields | Red validation on empty fields | Fill in required fields |
| No line items | "Add at least one line item" | Add a line item |

---

### Journey 5: View Customer History

**Goal**: See all jobs and quotes for a customer
**Trigger**: Customer calls, or owner reviewing account

#### Flow

1. **Navigate to Customers** (`/customers`)
   - User clicks "Customers" in sidebar

2. **Find customer**
   - User searches or scrolls the customer table

3. **Open Customer Detail** (`/customers/[id]`)
   - User clicks customer row
   - System shows: contact info, linked jobs table (with status/priority), linked quotes table (with status/total)

4. **Jump to related entity**
   - User clicks a job row → navigates to `/jobs/[id]`
   - OR clicks a quote row → navigates to `/quotes/[id]`

#### Success State
- User sees complete customer relationship in one view

---

### Journey 6: Check Screen Room

**Goal**: See which screens need burning before production can start
**Trigger**: Before starting a production run

#### Flow

1. **Navigate to Screen Room** (`/screens`)
   - User clicks "Screen Room" in sidebar

2. **Filter by status**
   - User filters to "Pending" burn status
   - Table shows screens that need burning

3. **Check linked job**
   - User sees job number linked to each screen
   - User clicks job link → navigates to `/jobs/[id]`

#### Success State
- User knows exactly which screens to burn and for which jobs

---

## State Definitions

### Empty States

| Screen | Condition | Message | Action |
|--------|-----------|---------|--------|
| Dashboard — Blocked | No blocked jobs | "All clear — no blocked jobs" | None needed |
| Jobs List | No jobs exist | "No jobs yet. Jobs will appear here." | (Phase 2: "Create Job" button) |
| Quotes List | No quotes exist | "No quotes yet." | "New Quote" button |
| Customer Detail — Jobs | Customer has no jobs | "No jobs for this customer" | None |
| Customer Detail — Quotes | Customer has no quotes | "No quotes for this customer" | None |
| Screen Room | No screens | "No screens tracked yet" | None |
| Search results | No matches | "No results for '[query]'" | Clear search |

### Loading States

Not applicable for Phase 1 (mock data is synchronous). Design loading skeleton patterns for Phase 2.

### Error States

| Condition | Screen | Shows | Recovery |
|-----------|--------|-------|----------|
| Invalid route | Any | 404 page: "Page not found" | Link to Dashboard |
| Invalid job ID | `/jobs/[id]` | "Job not found" | Link to Jobs list |
| Invalid quote ID | `/quotes/[id]` | "Quote not found" | Link to Quotes list |
| Invalid customer ID | `/customers/[id]` | "Customer not found" | Link to Customers list |

---

## Page-Level Details

### Dashboard (`/`)

**Layout**: Full width within main content area
**Sections** (top to bottom):
1. Page header: "Dashboard" + subtitle
2. Summary cards row: Blocked, In Progress, Shipped, Total Jobs (4 columns)
3. "Needs Attention" card — blocked jobs with action badges
4. "In Progress" card — active jobs with status + priority

**Key Actions**:
- Click any job row → `/jobs/[id]`

---

### Jobs List (`/jobs`)

**Layout**: Full width table with toolbar
**Toolbar**: Search input, status filter dropdown, view toggle (List | Board)
**Table Columns**: Job #, Title, Customer, Status, Priority, Due Date
**Sorting**: Click column headers
**Filtering**: Status dropdown (All, Design, Approval, Burning, Press, Finishing, Shipped)

**Key Actions**:
- Click row → `/jobs/[id]`
- Click "Board" toggle → `/jobs/board`
- Search → filters table in real-time

---

### Job Detail (`/jobs/[id]`)

**Layout**: Two-column on large screens, stacked on medium
**Left Column**:
- Job header: number, title, status badge, priority badge
- Status timeline: visual progression through 6 states
- Print locations: table with position, color count, artwork approved (yes/no badge)

**Right Column**:
- Customer card: name, company, link to customer detail
- Garments card: list with SKU, style, brand, color, size breakdown
- Due date card

**Key Actions**:
- Click customer name → `/customers/[customerId]`
- Back button / breadcrumb → `/jobs`

---

### Kanban Board (`/jobs/board`)

**Layout**: Horizontal scrollable columns
**Columns**: Design | Approval | Burning | Press | Finishing | Shipped
**Cards**: Job number, title, customer name, due date, priority badge
**Interaction**: Drag card between columns to change status

**Key Actions**:
- Drag card → update status (client-side)
- Click card → `/jobs/[id]`
- "List" toggle → `/jobs`

---

### Quotes List (`/quotes`)

**Layout**: Full width table with toolbar
**Toolbar**: Search input, status filter, "New Quote" button (primary CTA)
**Table Columns**: Quote #, Customer, Status, Line Items, Total, Date

**Key Actions**:
- Click row → `/quotes/[id]`
- Click "New Quote" → `/quotes/new`

---

### Quote Detail (`/quotes/[id]`)

**Layout**: Single column
**Sections**:
- Quote header: number, status badge, date
- Customer info card
- Line items table: description, qty, colors, locations, unit price, total
- Summary: subtotal, setup fees, grand total

**Key Actions**:
- Click customer name → `/customers/[customerId]`
- Back → `/quotes`

---

### New Quote (`/quotes/new`)

**Layout**: Form, single column
**Sections**:
- Customer selector (dropdown)
- Line items (dynamic, add/remove rows)
- Setup fees input
- Totals (auto-calculated, read-only)
- Actions: "Save as Draft", "Cancel"

**Key Actions**:
- "Save as Draft" → creates quote, navigates to `/quotes/[new-id]`
- "Cancel" → navigates to `/quotes`

---

### Customers List (`/customers`)

**Layout**: Full width table
**Toolbar**: Search input
**Table Columns**: Name, Company, Email, Phone

**Key Actions**:
- Click row → `/customers/[id]`

---

### Customer Detail (`/customers/[id]`)

**Layout**: Single column with stacked sections
**Sections**:
- Customer header: name, company, contact info
- Jobs table: linked jobs with status, priority, due date
- Quotes table: linked quotes with status, total, date

**Key Actions**:
- Click job row → `/jobs/[jobId]`
- Click quote row → `/quotes/[quoteId]`
- Back → `/customers`

---

### Screen Room (`/screens`)

**Layout**: Full width table
**Toolbar**: Burn status filter dropdown
**Table Columns**: Screen ID, Mesh Count, Emulsion Type, Burn Status, Linked Job

**Key Actions**:
- Click job link → `/jobs/[jobId]`
- Filter by burn status

---

### Garment Catalog (`/garments`)

**Layout**: Grouped list or table
**Grouping**: By brand
**Fields**: SKU, Style, Brand, Color

**Key Actions**:
- Expand/click to see which jobs use this garment

---

## Keyboard Shortcuts (Phase 2)

Planned for Phase 2 iteration:

| Key | Action | Context |
|-----|--------|---------|
| `/` | Focus search | Global |
| `Esc` | Close modal/dialog | When modal open |
| `?` | Show keyboard shortcuts | Global |

---

## Related Documents

- `docs/PRD.md` — Features and acceptance criteria
- `docs/IMPLEMENTATION_PLAN.md` — Build order
- `docs/reference/APP_FLOW_STANDARD.md` — Template this doc follows
- `CLAUDE.md` — AI operating rules
