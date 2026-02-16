---
title: "Customer List Page"
subtitle: "Smart views, search, filters, stats bar, responsive table — the /customers browse experience"
date: 2026-02-10
phase: 1
pipelineName: customer-management
pipelineType: vertical
products: [customers]
tools: []
stage: build
tags: [feature, build]
sessionId: "b11a4feb-edb5-44ec-89a2-cedd0cb9c591"
branch: "session/0210-customer-list"
status: complete
---

## Build Overview

| Stat | Value |
|------|-------|
| Components | 4 |
| Smart Views | 5 |
| Table Columns | 7 |
| Tests Pass | 264 |

Built the Customer List page (`/customers`) using an orchestrator pattern with 4 parallel subagents. Each component was built independently with well-defined interfaces, then integrated and verified.

## Components Built

### SmartViewTabs

5 filterable view chips: All Customers, Prospects, Top Customers, Needs Attention, Seasonal. URL-driven via `?view=`. Keyboard navigable (arrow keys, Home/End). ARIA tablist/tab roles. Mobile: horizontal scroll with hidden scrollbar.

### CustomersDataTable

7 sortable columns: Company, Primary Contact, Type Tags, Lifecycle, Health, Last Order, Revenue. **Desktop:** Full table with clickable sort headers. **Mobile:** Card list layout below 768px. Global search (`?q=`), type tag filter chips (`?tags=`), lifecycle filter (`?lifecycle=`), archived toggle (`?archived=`), column sort (`?sort=`, `?dir=`). Revenue computed from accepted quote totals. Row click navigates to `/customers/[id]`. Empty state with contextual messaging. Result count footer. "Clear all" filter reset.

### CustomerListStatsBar

4 metric cards: Total Customers, Active, Revenue YTD, Prospects. 2x2 grid on mobile, 4-column on desktop. Revenue computed from accepted quotes in current year.

### AddCustomerModal (Enhanced)

Breaking interface update: Company is now **required** (was optional). "Name" renamed to "Contact Name". Email OR phone required (was email-only). Customer Type: multi-select pill buttons replacing single dropdown. New `lifecycleStage` prop: defaults to "new" from customer list, "prospect" from quoting. Updated QuoteForm caller to match new interface.

## Smart View Logic

- **All Customers** — Default view, all non-archived
- **Prospects** — lifecycleStage === "prospect"
- **Top Customers** — Sorted by lifetime revenue descending
- **Needs Attention** — healthStatus === "potentially-churning"
- **Seasonal** — Customers with sports/school type tag

## URL State Architecture

All filters are URL-driven for shareability and back/forward navigation:

- `?view=` — Smart view tab (all, prospects, top, attention, seasonal)
- `?q=` — Global search (debounced 300ms)
- `?tags=` — Type tag filters (comma-separated)
- `?lifecycle=` — Lifecycle stage filter
- `?sort=` / `?dir=` — Column sorting
- `?archived=true` — Show archived customers

## Integration Fixes

- **QuoteForm interface update** — Updated `handleAddNewCustomer` callback to match new AddCustomerModal signature (company required, email optional, typeTags array, lifecycleStage)
- **CustomerTypeTag import** — Added to QuoteForm imports
- **Lint warning fix** — Wrapped `activeTags` in useMemo to stabilize dependency array

## Verification

- **tsc --noEmit** — 0 errors
- **npm run lint** — 0 errors (3 warnings in non-critical code)
- **npm test** — 264 tests passing (12 files)
- **npm run build** — Success, `/customers` renders as static page
