---
title: "IMPLEMENTATION_PLAN"
description: "Sequenced build steps for Phase 1. Each step references PRD features and APP_FLOW routes. Check current step before starting work."
category: canonical
status: active
phase: 1
last_updated: 2026-02-07
last_verified: 2026-02-07
current_step: 0
depends_on:
  - docs/PRD.md
  - docs/APP_FLOW.md
---

# Screen Print Pro — Implementation Plan

**Current Step**: Step 0 (complete) — Scaffold + Dashboard MVP

---

## Build Principles

1. **Vertical slices**: Build one complete screen at a time, not horizontal layers
2. **Shared components first**: Build reusable pieces before the pages that use them
3. **Dependencies respected**: Don't build a detail page before its list page
4. **User review checkpoints**: Pause for feedback after major milestones
5. **One step per session**: Reference step number in session prompts

---

## Step 0: Project Scaffold (COMPLETE)

**Status**: Done
**What was built**:
- Next.js 16.1.6 scaffold with Tailwind v4, shadcn/ui
- Dashboard layout shell (sidebar + topbar + main area)
- Dashboard page with summary cards and job sections
- Zod schemas, constants, mock data
- Documentation framework

**Files**:
- `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`
- `components/layout/sidebar.tsx`, `components/layout/topbar.tsx`
- `lib/schemas/*.ts`, `lib/constants.ts`, `lib/mock-data.ts`
- All `docs/*.md` files

---

## Step 1: Shared Layout Polish

**PRD**: Supports all features (navigation backbone)
**APP_FLOW**: Sidebar, breadcrumbs, topbar

**Tasks**:
- [ ] Polish sidebar: add section dividers, active state animation
- [ ] Polish topbar: add search input (global, filters to sidebar nav suggestions), user avatar placeholder
- [ ] Create `Breadcrumb` wrapper component using shadcn/ui breadcrumb
- [ ] Wire breadcrumbs into dashboard layout (reads route segments)
- [ ] Create shared `PageHeader` component (title + subtitle + optional action button)
- [ ] Create shared `DataTable` component wrapper around TanStack Table + shadcn/ui Table
- [ ] Create shared `StatusBadge` component (maps production state → color)
- [ ] Create shared `PriorityBadge` component (maps priority → color)
- [ ] Create shared `EmptyState` component (icon + message + optional action)

**Output**: Reusable components in `components/features/` and `components/ui/`

---

## Step 2: Jobs List Page

**PRD**: F2 (Jobs List)
**APP_FLOW**: `/jobs` — sortable, filterable table
**Depends on**: Step 1 (DataTable, StatusBadge, PriorityBadge, PageHeader)

**Tasks**:
- [ ] Create `app/(dashboard)/jobs/page.tsx`
- [ ] Implement DataTable with columns: Job #, Title, Customer, Status, Priority, Due Date
- [ ] Add toolbar: search input, status filter dropdown
- [ ] Add view toggle tabs: "List" (active) | "Board" (links to `/jobs/board`)
- [ ] Row click navigates to `/jobs/[id]`
- [ ] Empty state when no jobs match filter/search
- [ ] URL state for search query and status filter

**Output**: Working jobs list at `/jobs`

---

## Step 3: Job Detail Page

**PRD**: F3 (Job Detail)
**APP_FLOW**: `/jobs/[id]` — full job view with timeline
**Depends on**: Step 2 (jobs route exists)

**Tasks**:
- [ ] Create `app/(dashboard)/jobs/[id]/page.tsx`
- [ ] Build job header: number, title, status badge, priority badge, due date
- [ ] Build status timeline component: visual 6-step progression with current state highlighted
- [ ] Build print locations section: table with position, color count, artwork approved badge
- [ ] Build garments section: card per garment with SKU, style, brand, color, size breakdown
- [ ] Build customer info card with link to `/customers/[id]`
- [ ] Handle invalid job ID (404-style message with link back to `/jobs`)
- [ ] Breadcrumb: Dashboard > Jobs > J-1024

**Output**: Full job detail view at `/jobs/[id]`

---

## --- CHECKPOINT 1: Review with User ---

**What to review**: Dashboard, Jobs List, Job Detail
**Questions for user**:
- Does the jobs list show the right columns? Need anything added/removed?
- Is the job detail layout clear? Two-column vs. single-column?
- Is the status timeline visualization intuitive?
- Any missing information on the job detail page?

---

## Step 4: Kanban Board

**PRD**: F4 (Kanban Board)
**APP_FLOW**: `/jobs/board` — drag-and-drop columns
**Depends on**: Step 2 (view toggle exists)

**Tasks**:
- [ ] Create `app/(dashboard)/jobs/board/page.tsx`
- [ ] Build Kanban layout: 6 horizontal columns (one per production state)
- [ ] Build job cards: job number, title, customer, due date, priority badge
- [ ] Implement dnd-kit drag between columns
- [ ] Update mock data status on drop (client-side state via useState)
- [ ] Column headers with job count
- [ ] Card click navigates to `/jobs/[id]`
- [ ] "List" toggle links back to `/jobs`
- [ ] Framer Motion enter/exit animations for cards

**Output**: Interactive Kanban board at `/jobs/board`

---

## Step 5: Quotes List + Detail

**PRD**: F5 (Quotes List), F6 (Quote Detail)
**APP_FLOW**: `/quotes`, `/quotes/[id]`
**Depends on**: Step 1 (DataTable, PageHeader)

**Tasks**:
- [ ] Create `app/(dashboard)/quotes/page.tsx`
- [ ] Implement DataTable: Quote #, Customer, Status, Line Items count, Total, Date
- [ ] Add toolbar: search, status filter, "New Quote" button
- [ ] Row click navigates to `/quotes/[id]`
- [ ] Create `app/(dashboard)/quotes/[id]/page.tsx`
- [ ] Build quote header: number, status badge, date
- [ ] Build customer info card
- [ ] Build line items table: description, qty, colors, locations, unit price, total
- [ ] Build summary section: subtotal, setup fees, grand total
- [ ] Handle invalid quote ID

**Output**: Quotes list + detail pages

---

## Step 6: New Quote Form

**PRD**: F7 (New Quote Form)
**APP_FLOW**: `/quotes/new`
**Depends on**: Step 5 (quotes route exists)

**Tasks**:
- [ ] Create `app/(dashboard)/quotes/new/page.tsx` (client component)
- [ ] Customer selector dropdown (populated from mock customers)
- [ ] Dynamic line items: add/remove rows with React Hook Form field arrays
- [ ] Per-line fields: description, quantity, color count, locations
- [ ] Auto-calculate: unit price (mock formula), line total, subtotal
- [ ] Setup fees input
- [ ] Grand total (subtotal + setup fees, read-only)
- [ ] "Save as Draft" button: validates, adds to mock data, navigates to detail
- [ ] "Cancel" button: navigates to `/quotes`
- [ ] Form validation with Zod schema + error messages

**Output**: Working quote creation form

---

## --- CHECKPOINT 2: Review with User ---

**What to review**: Kanban Board, Quotes List/Detail, New Quote Form
**Questions for user**:
- Does the Kanban board feel right? Card info sufficient?
- Is the quote form missing any fields?
- Is the pricing formula reasonable? (Placeholder for now)
- Does the line item add/remove flow feel smooth?

---

## Step 7: Customers List + Detail

**PRD**: F8 (Customers List), F9 (Customer Detail)
**APP_FLOW**: `/customers`, `/customers/[id]`
**Depends on**: Step 1 (DataTable, PageHeader)

**Tasks**:
- [ ] Create `app/(dashboard)/customers/page.tsx`
- [ ] Implement DataTable: Name, Company, Email, Phone
- [ ] Search input in toolbar
- [ ] Row click navigates to `/customers/[id]`
- [ ] Create `app/(dashboard)/customers/[id]/page.tsx`
- [ ] Customer header: name, company, full contact info
- [ ] Linked jobs table: job number, title, status, priority, due date (click → `/jobs/[id]`)
- [ ] Linked quotes table: quote number, status, total, date (click → `/quotes/[id]`)
- [ ] Empty states for no jobs / no quotes
- [ ] Handle invalid customer ID

**Output**: Customers list + detail with cross-linked entities

---

## Step 8: Screen Room

**PRD**: F10 (Screen Room)
**APP_FLOW**: `/screens`
**Depends on**: Step 1 (DataTable, PageHeader)

**Tasks**:
- [ ] Create `app/(dashboard)/screens/page.tsx`
- [ ] Implement DataTable: Screen ID (short), Mesh Count, Emulsion Type, Burn Status, Linked Job
- [ ] Burn status filter dropdown in toolbar
- [ ] Burn status badges with color coding
- [ ] Job link click → `/jobs/[id]`
- [ ] Empty state

**Output**: Screen room inventory page

---

## Step 9: Garment Catalog

**PRD**: F11 (Garment Catalog)
**APP_FLOW**: `/garments`
**Depends on**: Step 1 (PageHeader)

**Tasks**:
- [ ] Create `app/(dashboard)/garments/page.tsx`
- [ ] Extract unique garments from all jobs in mock data
- [ ] Group by brand
- [ ] Display: SKU, Style, Brand, Color
- [ ] Show which jobs use each garment (expandable or inline)
- [ ] Empty state

**Output**: Garment catalog page

---

## --- CHECKPOINT 3: Final Review ---

**What to review**: All 11 screens, full navigation, cross-links
**Verification**:
- [ ] All sidebar links work
- [ ] All breadcrumbs correct
- [ ] All cross-links (job → customer, quote → customer, screen → job) work
- [ ] All empty states display correctly
- [ ] All 404/not-found states handled
- [ ] Quality checklist from CLAUDE.md passes for each screen
- [ ] 3-click-max rule verified
- [ ] 5-second dashboard scan verified

---

## Step 10: Polish Pass

**Depends on**: All previous steps + Checkpoint 3 feedback

**Tasks**:
- [ ] Apply Framer Motion page transitions (layout animations between routes)
- [ ] Add hover/focus states to all interactive elements
- [ ] Verify color token usage (no off-palette colors)
- [ ] Verify typography scale (max 3-4 sizes per screen)
- [ ] Apply "Jobs Filter" methodology: remove elements that don't add meaning
- [ ] Test keyboard navigation flow
- [ ] Add ARIA labels where needed
- [ ] Verify contrast ratios (4.5:1 minimum)

**Output**: Polished, accessible Phase 1 mockup ready for user acceptance testing

---

## Summary

| Step | Feature | Route(s) | Status |
|------|---------|----------|--------|
| 0 | Scaffold + Dashboard | `/` | Done |
| 1 | Shared Components | (components) | Pending |
| 2 | Jobs List | `/jobs` | Pending |
| 3 | Job Detail | `/jobs/[id]` | Pending |
| -- | **Checkpoint 1** | | |
| 4 | Kanban Board | `/jobs/board` | Pending |
| 5 | Quotes List + Detail | `/quotes`, `/quotes/[id]` | Pending |
| 6 | New Quote Form | `/quotes/new` | Pending |
| -- | **Checkpoint 2** | | |
| 7 | Customers List + Detail | `/customers`, `/customers/[id]` | Pending |
| 8 | Screen Room | `/screens` | Pending |
| 9 | Garment Catalog | `/garments` | Pending |
| -- | **Checkpoint 3** | | |
| 10 | Polish Pass | All | Pending |

---

## Related Documents

- `docs/PRD.md` — Feature definitions and acceptance criteria
- `docs/APP_FLOW.md` — Routes and navigation paths
- `docs/TECH_STACK.md` — Tool choices
- `CLAUDE.md` — AI operating rules and quality checklist
