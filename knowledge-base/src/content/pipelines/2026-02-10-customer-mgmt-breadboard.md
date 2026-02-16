---
title: "Customer Management Breadboard"
subtitle: "Interactive visualization of Places, Components, Wiring, and Build Order for the Customer Management vertical"
date: 2026-02-10
phase: 1
pipelineName: customer-management
pipelineType: vertical
products: [customers, quotes, jobs]
tools: []
stage: breadboard
tags: [plan, build]
sessionId: "69497710-9bb5-46d9-8e49-949cda0e9d65"
branch: "session/0209-customer-mgmt-discovery"
status: complete
---

| Stat | Value |
|------|-------|
| Places | 9 |
| UI Affordances | 102 |
| Code Affordances | 33 |
| Components | 21 |

## Place Map

Pages are bounded contexts where affordances live. Modals block what's behind them, creating sub-Places. Arrows show primary navigation paths.

## Pages

### P1 — Customer List

**Route:** `/customers`

Browse, search, filter with 5 smart views (All, Prospects, Top, Needs Attention, Seasonal). Quick stats bar, type tag filters, sortable columns.

- 16 UI affordances · 7 code affordances

### P2 — Customer Detail

**Route:** `/customers/[id]`

Full customer dashboard. Header with stats + lifecycle badge + actions. 7 tabs: Activity, Quotes, Jobs, Artwork, Contacts, Details, Notes.

- 73 UI affordances · 23 code affordances

## Modals & Sub-Places

**From Customer List (P1):**

### P1.1 — Add Customer Modal

Quick-create: company, contact, email/phone, type tags. < 30 seconds.

- 8 UI · 2 code

**From Customer Detail (P2):**

### P2.2 — Add Contact

Name, email, phone, role, group assignment, primary flag.

- 8 UI

### P2.3 — Add Group

Group name within company.

- 3 UI

### P2.4 — Edit Customer

Full profile: tags, payment terms, pricing, tax, addresses, referral, lifecycle override.

- 13 UI

### P2.5 — Archive Confirm

Confirmation dialog before archiving.

- 3 UI

## Cross-Vertical Navigation

```text
P1 Customer List
  click row → P2 /customers/[id]
  click Add Customer → P1.1 Add Customer Modal

P2 Customer Detail
  click "New Quote" → /quotes/new?customer={id}
  click quote row → /quotes/[id]
  click job row → /jobs/[id]
  click "Copy as New" → /quotes/new?from={quoteId}
  click referrer → P2 /customers/[referrerId]
  click "Archive" → P1 /customers
  breadcrumb → P1 /customers or / dashboard
```

## P2 Tab Structure

| Tab | Notes | Affordances |
|-----|-------|-------------|
| Activity | Default tab | 3 |
| Quotes | | 3 |
| Jobs | | 2 |
| Artwork | | 7 |
| Contacts | | 7 |
| Details | | 8 |
| Notes | Default for Prospects | 8 |

## Component Map

Components are grouped by reusability. Shared components live in `components/features/` and are reused across verticals. Vertical-specific components live under `app/(dashboard)/customers/`. Existing components are already built.

### Existing (Enhance)

- **AddCustomerModal** — `components/features/` — Used in: P1.1, Quoting — Needs: type tags, lifecycle auto-set, company required
- **CustomerCombobox** — `components/features/` — Used in: Quoting, P2.4 — Needs: lifecycle badge, enriched display
- **StatusBadge** — `components/features/` — Used in: P2 Quotes tab — Reuse as-is for quote status display

### New Shared Components (Reusable Across Verticals)

- **LifecycleBadge** — `components/features/` — Used in: P1, P2, Quoting — Prospect(cyan) New(white) Repeat(green) Contract(amber)
- **HealthBadge** — `components/features/` — Used in: P1, P2 — Only shows when not Active
- **TypeTagBadges** — `components/features/` — Used in: P1, P2, P2.4 — Display + edit (multi-select) modes
- **CustomerQuickStats** — `components/features/` — Used in: P1 (bar), P2 (header) — Revenue, orders, AOV, last order
- **ArtworkGallery** — `components/features/` — Used in: P2 Artwork tab — Smart-sorted thumbnails, badges, tooltips
- **NotesPanel** — `components/features/` — Used in: P2 Notes tab — Quick-add, pin, channel tags. Reusable for any entity.

### Customer List Page Components

- **SmartViewTabs** — `app/.../customers/_components/` — Used in: P1 — All, Prospects, Top, Needs Attention, Seasonal
- **CustomersDataTable** — `app/.../customers/_components/` — Used in: P1 — Extends shared table pattern
- **CustomerListStatsBar** — `app/.../customers/_components/` — Used in: P1 — Total, Active, Revenue YTD, Prospects

### Customer Detail Page Components

- **CustomerDetailHeader** — `app/.../customers/[id]/_components/` — Used in: P2 — Company, contact, badges, stats, actions
- **ActivityTimeline** — `app/.../customers/[id]/_components/` — Used in: P2 Activity tab — Reverse-chronological merged events
- **CustomerQuotesTable** — `app/.../customers/[id]/_components/` — Used in: P2 Quotes tab — Quote #, status, total, Copy as New
- **CustomerJobsTable** — `app/.../customers/[id]/_components/` — Used in: P2 Jobs tab — Job #, status, due date
- **ContactHierarchy** — `app/.../customers/[id]/_components/` — Used in: P2 Contacts tab — Company → Group → Contact tree
- **CustomerDetailsPanel** — `app/.../customers/[id]/_components/` — Used in: P2 Details tab — Addresses, tax, payment, pricing, referral
- **EditCustomerSheet** — `app/.../customers/[id]/_components/` — Used in: P2.4 — Full profile edit form
- **AddContactSheet** — `app/.../customers/[id]/_components/` — Used in: P2.2
- **AddGroupSheet** — `app/.../customers/[id]/_components/` — Used in: P2.3

## Build Order

Build phases flow top-to-bottom. Steps within a phase can run in parallel. Phases B, C, and D can all run in parallel once Phase A completes.

### Phase A — Foundation + Shared Components

All steps in this phase can run in parallel (after steps 1-2 complete as the base)

1. Schemas (contact, address, group, note, expanded customer) — Medium
2. Mock Data Expansion (10 customers, contacts, notes, addresses) — High

After 1-2 complete:

3. LifecycleBadge — Low
4. HealthBadge — Low
5. TypeTagBadges — Low
6. NotesPanel (shared) — Medium
7. ArtworkGallery (shared) — High
8. AddCustomerModal (enhanced) — Low-Med
9. CustomerQuickStats — Low

### Phase B — Customer List Page

Can start as soon as Phase A schemas + badges are ready.

10. Customer List (/customers) — High

### Phase C — Customer Detail Page

Largest phase — header + 7 tabs + 4 modals.

11. Customer Detail + All Sub-components — Very High

### Phase D — Interconnections

Enhance existing quoting combobox.

13. Quoting Interconnection — Low-Med

## Dependency Graph Summary

```text
Step 1 Schemas → blocks everything
Step 2 Mock Data → blocks all display components
Steps 3-9 Shared Components → run in parallel, block pages
Step 10 Customer List → needs 1-5, 8-9
Step 11 Customer Detail → needs 1-9 (all shared components)
Step 13 Quoting → needs 1-3 only (schemas, data, LifecycleBadge)
```

## Data Flow

Shows where state lives and how it flows between affordances. Color indicates state type.

**State Types:**

- URL State — filters, search, sort
- React State — form inputs, tab selection
- Mock Data — imported, mutated in-memory
- Derived — computed from other stores

### URL State — Persists across page refreshes, shareable

**S1 — Customer List Params**

`?q` · `?view` · `?tags` · `?lifecycle` · `?sort` · `?dir` · `?archived`

- Readers: N1, N2, N3, N4, N5, N7, N33
- Writers: U1 search, U2-U6 tabs, U7 tags, U8 lifecycle, U9 sort, U12 archive

### React State — Component-local, resets on navigation

**S2 — Active Tab** — P2 tab selection

- Readers: U42, tab content
- Writers: N13 setActiveTab, N32 (defaults: "notes" for Prospects, "activity" otherwise)

**S5 — Add Customer Form** — P1.1 form inputs

- Readers: U20-U24, N9 validate
- Writers: U20-U24 typing, N8 reset

**S6 — Artwork View** — sort mode, selected artwork

- Readers: U65, U69
- Writers: N19 sort, N21 select

**S7 — Note Draft** — content + channel tag

- Readers: U95, U96
- Writers: U95 type, U96 select, N23 clear

**S8 — Contact Form** — P2.2 inputs

**S9 — Group Form** — P2.3 inputs

**S10 — Edit Customer Form** — P2.4 full profile edit

- Readers: U125-U135, N29
- Writers: U125-U135 inputs, P2.4 mount (pre-fill)

### Mock Data — Imported from lib/mock-data.ts, mutated in-memory (Phase 1)

**S3 — All Mock Data**

customers · contacts · groups · notes · quotes · jobs · artworks

- Readers: N1, N11, N14-N18, N24-N25, all display affordances
- Writers: N8 (add customer), N22 (set primary), N23 (add note), N26 (pin), N27-N30 (CRUD)

### Derived — Computed from other stores, not persisted

**S4 — Quick Stats**

Total customers, Active this month, YTD revenue, Prospect count

- Readers: U13 stats bar
- Writers: N31 (recomputed when S3 changes)

## Key Data Flows

**Search & Filter Flow:**
U1 type query → S1 ?q param → N1 filterCustomers() → Table rows update

**Add Customer Flow:**
U25 click Save → N9 validate → N8 saveNewCustomer() → S3 add to mock data → Close modal, update list

**Note Creation Flow:**
U95 type note + U96 select channel → S7 draft state → U97 click Add → N23 addNote() → S3 add to notes → Prepend to list, clear draft

**Cross-Vertical: New Quote from Customer:**
U38 click "New Quote" → N12 navigateToNewQuote() → /quotes/new?customer={id} → Quote form auto-selects customer
