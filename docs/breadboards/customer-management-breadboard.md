---
title: "Customer Management — Breadboard"
description: "UI affordances, code affordances, wiring, and component boundaries for the Customer Management vertical"
category: breadboard
status: complete
phase: 1
created: 2026-02-10
last-verified: 2026-02-10
depends-on:
  - docs/strategy/customer-management-scope-definition.md
---

# Customer Management — Breadboard

**Purpose**: Map all UI affordances, code affordances, and wiring for the Customer Management vertical before building
**Input**: Scope definition (complete), APP_FLOW, existing quoting components
**Status**: Complete

---

## Places

| ID | Place | Type | Entry Point | Description |
|----|-------|------|-------------|-------------|
| P1 | Customer List | Page | `/customers` | Browse, search, filter customers with smart views |
| P1.1 | Add Customer Modal | Modal | "Add Customer" button in P1 | Quick-create customer with minimal fields |
| P2 | Customer Detail | Page | `/customers/[id]` | Full customer dashboard with tabbed sections |
| P2.1 | Add Customer Modal | Modal | "Add Customer" from sidebar nav or other contexts | Same modal as P1.1, reused component |
| P2.2 | Add Contact Sheet | Modal | "Add Contact" button in P2 Contacts tab | Create new contact within a company |
| P2.3 | Add Group Sheet | Modal | "Add Group" button in P2 Contacts tab | Create group within a company |
| P2.4 | Edit Customer Sheet | Modal | "Edit Customer" button in P2 header | Edit company profile, addresses, financial details |
| P2.5 | Archive Confirmation Dialog | Modal | "Archive" button in P2 header | Confirm customer archival |
| P2.6 | Add Note Inline | Subplace | Quick-add input in P2 Notes tab | Inline note creation (not a modal — stays in context) |

**Blocking test notes**:
- Tabs within P2 (Activity, Quotes, Jobs, Artwork, Contacts, Details, Notes) are NOT separate Places — they're local state within the same bounded context. The user can see the header and switch tabs freely.
- The Add Contact Sheet and Add Group Sheet are modals (block interaction with P2 while open).
- The quick-add note input in the Notes tab is NOT a Place — it's inline within P2.

---

## UI Affordances

### P1 — Customer List

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U1 | Search input | type | → N1 filterCustomers() | → P1 table rows |
| U2 | Smart view tab: All | click | → N2 setSmartView("all") | → P1 table rows |
| U3 | Smart view tab: Prospects | click | → N2 setSmartView("prospects") | → P1 table rows |
| U4 | Smart view tab: Top Customers | click | → N2 setSmartView("top") | → P1 table rows |
| U5 | Smart view tab: Needs Attention | click | → N2 setSmartView("attention") | → P1 table rows |
| U6 | Smart view tab: Seasonal | click | → N2 setSmartView("seasonal") | → P1 table rows |
| U7 | Type tag filter chips | click | → N3 toggleTagFilter(tag) | → P1 table rows |
| U8 | Lifecycle stage filter | click | → N4 toggleLifecycleFilter(stage) | → P1 table rows |
| U9 | Column sort header | click | → N5 toggleSort(column) | → P1 table rows |
| U10 | Customer row | click | → N6 navigateTo(`/customers/${id}`) | → P2 |
| U11 | "Add Customer" button (primary CTA) | click | → open P1.1 | |
| U12 | "Show Archived" toggle | toggle | → N7 toggleArchived() | → P1 table rows |
| U13 | Quick stats bar | display | ← S4 computed stats | |
| U14 | Lifecycle badge (per row) | display | ← S3 customer data | |
| U15 | Health indicator (per row) | display | ← S3 customer data | |
| U16 | Type tag badges (per row) | display | ← S3 customer data | |

### P1.1 — Add Customer Modal

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U20 | Company Name input | type | → S5 form state | |
| U21 | Contact Name input | type | → S5 form state | |
| U22 | Email input | type | → S5 form state | |
| U23 | Phone input | type | → S5 form state | |
| U24 | Type Tag multi-select | select | → S5 form state | |
| U25 | "Save Customer" button | click | → N8 saveNewCustomer() | → close P1.1, select new customer in P1 |
| U26 | "Cancel" button | click | → close P1.1 | |
| U27 | Validation error messages | display | ← N9 validateCustomer() | |

### P2 — Customer Detail

**Header (always visible)**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U30 | Company name (heading) | display | ← S3 customer data | |
| U31 | Primary contact: name, email, phone | display | ← S3 customer data | |
| U32 | Email click-to-copy | click | → N10 copyToClipboard(email) | → toast "Copied" |
| U33 | Phone click-to-copy | click | → N10 copyToClipboard(phone) | → toast "Copied" |
| U34 | Lifecycle stage badge | display | ← S3 customer data | |
| U35 | Health indicator badge | display | ← S3 customer data (only when not Active) | |
| U36 | Type tag badges | display | ← S3 customer data | |
| U37 | Quick stats row (revenue, orders, AOV, last order, referrals) | display | ← N11 computeCustomerStats() | |
| U38 | "New Quote" button (primary CTA) | click | → N12 navigateToNewQuote(customerId) | → `/quotes/new?customer=${id}` |
| U39 | "Edit Customer" button | click | → open P2.4 | |
| U40 | "Archive" button | click | → open P2.5 | |
| U41 | Breadcrumb: Dashboard > Customers > {name} | click | → N6 navigateTo() | → `/` or `/customers` |
| U42 | Tab selector | click | → N13 setActiveTab(tab) | → tab content area |

**Activity Tab**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U50 | Activity timeline (reverse-chronological) | display | ← N14 buildActivityTimeline() | |
| U51 | Timeline item: quote link | click | → N6 navigateTo(`/quotes/${id}`) | → `/quotes/[id]` |
| U52 | Timeline item: job link | click | → N6 navigateTo(`/jobs/${id}`) | → `/jobs/[id]` (Phase 2) |

**Quotes Tab**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U55 | Quotes table (Quote #, Status, Total, Date) | display | ← N15 getCustomerQuotes() | |
| U56 | Quote row | click | → N6 navigateTo(`/quotes/${id}`) | → `/quotes/[id]` |
| U57 | "Copy as New" action (per row) | click | → N16 duplicateQuote(quoteId) | → `/quotes/new?from=${id}` |

**Jobs Tab**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U60 | Jobs table (Job #, Status, Due Date, Total) | display | ← N17 getCustomerJobs() | |
| U61 | Job row | click | → N6 navigateTo(`/jobs/${id}`) | → `/jobs/[id]` |

**Artwork Tab**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U65 | Artwork thumbnail grid | display | ← N18 getSmartSortedArtwork() | |
| U66 | Artwork thumbnail hover tooltip (metadata + notes) | hover | ← S3 artwork data | |
| U67 | Sort toggle: Smart / Alphabetical / Chronological | click | → N19 setArtworkSort(mode) | → U65 reorder |
| U68 | "Use in New Quote" action (per artwork) | click | → N20 navigateToNewQuoteWithArtwork(artworkId) | → `/quotes/new?customer=${id}&artwork=${artId}` |
| U69 | Artwork detail click | click | → N21 showArtworkDetail(artworkId) | → expanded view with linked quotes/jobs |
| U70 | Volume badge ("Top seller") | display | ← N18 smart sort metadata | |
| U71 | Season badge ("In season") | display | ← N18 smart sort metadata | |

**Contacts Tab**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U75 | Company → Group → Contact hierarchy view | display | ← S3 customer data (contacts, groups) | |
| U76 | Contact card (name, role badge, email, phone) | display | ← S3 contact data | |
| U77 | "Add Contact" button | click | → open P2.2 | |
| U78 | "Add Group" button (appears when 2+ contacts exist) | click | → open P2.3 | |
| U79 | Primary contact star indicator | display | ← S3 contact.isPrimary | |
| U80 | Contact role badge | display | ← S3 contact.role | |
| U81 | Set as primary action (per contact) | click | → N22 setPrimaryContact(contactId) | → U79 updates |

**Details Tab**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U85 | Billing address display | display | ← S3 customer data | |
| U86 | Shipping addresses list (named, with default flag) | display | ← S3 customer data | |
| U87 | Tax exempt status + certificate expiry | display | ← S3 customer data | |
| U88 | Payment terms display | display | ← S3 customer data | |
| U89 | Pricing tier + discount % | display | ← S3 customer data | |
| U90 | "Referred by" display (link to referrer) | display / click | ← S3 customer data → N6 navigateTo() | → referrer's P2 |
| U91 | "Edit" button (opens P2.4) | click | → open P2.4 | |
| U92 | "Upload Certificate" area (mock placeholder) | display | ← placeholder, non-functional | |

**Notes Tab**

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U95 | Quick-add note input | type | → S7 note draft state | |
| U96 | Channel tag selector (phone/email/text/social/in-person) | select | → S7 note draft state | |
| U97 | "Add Note" button (or Enter key) | click | → N23 addNote() | → prepend to U99 |
| U98 | Pinned notes section (top) | display | ← N24 getPinnedNotes() | |
| U99 | All notes list (reverse chronological) | display | ← N25 getCustomerNotes() | |
| U100 | Pin/unpin toggle (per note) | click | → N26 togglePin(noteId) | → moves between U98/U99 |
| U101 | Channel tag display (per note) | display | ← S3 note data | |
| U102 | Timestamp display (per note) | display | ← S3 note data | |

### P2.2 — Add Contact Sheet

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U110 | Contact Name input | type | → S8 contact form state | |
| U111 | Email input | type | → S8 contact form state | |
| U112 | Phone input | type | → S8 contact form state | |
| U113 | Role selector (ordering/art-approver/billing/owner/other) | select | → S8 contact form state | |
| U114 | Group selector (optional, from existing groups) | select | → S8 contact form state | |
| U115 | "Set as Primary" checkbox | toggle | → S8 contact form state | |
| U116 | "Save Contact" button | click | → N27 saveContact() | → close P2.2, update U75 |
| U117 | "Cancel" button | click | → close P2.2 | |

### P2.3 — Add Group Sheet

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U120 | Group Name input | type | → S9 group form state | |
| U121 | "Save Group" button | click | → N28 saveGroup() | → close P2.3, update U75 |
| U122 | "Cancel" button | click | → close P2.3 | |

### P2.4 — Edit Customer Sheet

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U125 | Company name input | type | → S10 edit form state | |
| U126 | Type tag multi-select | select | → S10 edit form state | |
| U127 | Payment terms selector | select | → S10 edit form state | |
| U128 | Pricing tier selector | select | → S10 edit form state | |
| U129 | Discount % input | type | → S10 edit form state | |
| U130 | Tax exempt toggle | toggle | → S10 edit form state | |
| U131 | Tax cert expiry date | type | → S10 edit form state | |
| U132 | Billing address fields | type | → S10 edit form state | |
| U133 | Shipping addresses (add/edit/remove, named, default flag) | type/click | → S10 edit form state | |
| U134 | "Referred by" customer selector | select | → S10 edit form state | |
| U135 | Lifecycle stage override (promote to Contract) | select | → S10 edit form state | |
| U136 | "Save" button | click | → N29 saveCustomerEdits() | → close P2.4, update P2 |
| U137 | "Cancel" button | click | → close P2.4 | |

### P2.5 — Archive Confirmation Dialog

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U140 | Confirmation message | display | | |
| U141 | "Archive" button | click | → N30 archiveCustomer() | → navigate to `/customers` |
| U142 | "Cancel" button | click | → close P2.5 | |

---

## Code Affordances

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To |
|----|-------|------------|-------|---------|-----------|------------|
| N1 | P1 | filterCustomers(query) | 1 | U1 type | → filter S3 customers | → P1 table rows |
| N2 | P1 | setSmartView(view) | 1 | U2-U6 click | → update S1 ?view param | → P1 table rows (filtered by view logic) |
| N3 | P1 | toggleTagFilter(tag) | 1 | U7 click | → update S1 ?tags param | → P1 table rows |
| N4 | P1 | toggleLifecycleFilter(stage) | 1 | U8 click | → update S1 ?lifecycle param | → P1 table rows |
| N5 | P1 | toggleSort(column) | 1 | U9 click | → update S1 ?sort, ?dir params | → P1 table rows |
| N6 | Global | navigateTo(route) | 1 | U10, U41, U51, U52, U56, U61, U90 click | → router.push(route) | → target page |
| N7 | P1 | toggleArchived() | 1 | U12 toggle | → update S1 ?archived param | → P1 table rows |
| N8 | P1.1 | saveNewCustomer(data) | 1 | U25 click | → add to S3 mock data (client state) | → close P1.1, new row in P1 |
| N9 | P1.1 | validateCustomer(data) | 1 | U25 click (before N8) | → validate form state | → U27 error messages or proceed to N8 |
| N10 | P2 | copyToClipboard(text) | 1 | U32, U33 click | → navigator.clipboard.writeText() | → toast notification |
| N11 | P2 | computeCustomerStats(customerId) | 1 | P2 mount | → aggregate quotes/jobs from S3 | → U37 stats display |
| N12 | P2 | navigateToNewQuote(customerId) | 1 | U38 click | → router.push(`/quotes/new?customer=${id}`) | → `/quotes/new` with pre-selected customer |
| N13 | P2 | setActiveTab(tab) | 1 | U42 click | → update S2 activeTab state | → tab content re-render |
| N14 | P2 | buildActivityTimeline(customerId) | 1 | Activity tab mount | → merge & sort quotes/jobs/notes from S3 | → U50 timeline items |
| N15 | P2 | getCustomerQuotes(customerId) | 1 | Quotes tab mount | → filter S3 quotes by customerId | → U55 table rows |
| N16 | P2 | duplicateQuote(quoteId) | 1 | U57 click | → router.push(`/quotes/new?from=${quoteId}`) | → `/quotes/new` with copied data |
| N17 | P2 | getCustomerJobs(customerId) | 1 | Jobs tab mount | → filter S3 jobs by customerId | → U60 table rows |
| N18 | P2 | getSmartSortedArtwork(customerId) | 1 | Artwork tab mount | → sort artwork by volume → season → recency | → U65 thumbnail grid |
| N19 | P2 | setArtworkSort(mode) | 1 | U67 click | → update S6 artwork sort mode | → U65 reorder |
| N20 | P2 | navigateToNewQuoteWithArtwork(artId) | 1 | U68 click | → router.push with customer + artwork params | → `/quotes/new` |
| N21 | P2 | showArtworkDetail(artworkId) | 1 | U69 click | → update S6 selectedArtworkId | → expanded artwork panel with linked quotes |
| N22 | P2 | setPrimaryContact(contactId) | 1 | U81 click | → update S3 contacts (set one primary, unset others) | → U79 star updates |
| N23 | P2 | addNote(content, channel) | 1 | U97 click | → add to S3 notes (client state) | → prepend to U99, clear S7 |
| N24 | P2 | getPinnedNotes(customerId) | 1 | Notes tab mount | → filter S3 notes: isPinned=true | → U98 pinned list |
| N25 | P2 | getCustomerNotes(customerId) | 1 | Notes tab mount | → filter S3 notes by entityType=customer, entityId | → U99 notes list |
| N26 | P2 | togglePin(noteId) | 1 | U100 click | → update S3 note.isPinned | → moves between U98/U99 |
| N27 | P2.2 | saveContact(data) | 1 | U116 click | → add to S3 customer.contacts | → close P2.2, update U75 |
| N28 | P2.3 | saveGroup(data) | 1 | U121 click | → add to S3 customer.groups | → close P2.3, update U75 |
| N29 | P2.4 | saveCustomerEdits(data) | 1 | U136 click | → update S3 customer record | → close P2.4, refresh P2 header/details |
| N30 | P2.5 | archiveCustomer(customerId) | 1 | U141 click | → set S3 customer.isArchived=true | → navigate to `/customers` |
| N31 | P1 | computeQuickStats() | 1 | P1 mount | → aggregate S3 customers | → U13 stats bar (total, active, revenue, prospects) |
| N32 | P2 | getDefaultTab(lifecycle) | 1 | P2 mount | → if lifecycle=prospect return "notes", else "activity" | → S2 initial activeTab |
| N33 | P1 | applySmartViewFilter(view, customers) | 1 | N2 triggers | → smart view filtering logic | → filtered customer list |

---

## Data Stores

| ID | Place | Store | Type | Read By | Written By |
|----|-------|-------|------|---------|------------|
| S1 | P1 | URL params (?q, ?view, ?tags, ?lifecycle, ?sort, ?dir, ?archived) | URL state | N1, N2, N3, N4, N5, N7, N33 | N1, N2, N3, N4, N5, N7 |
| S2 | P2 | Active tab | React state | N13, U42, tab content | N13 setActiveTab, N32 initial |
| S3 | Global | Mock data (customers, contacts, groups, notes, quotes, jobs, artworks) | Mock data (imported, mutated in-memory) | N1, N11, N14, N15, N17, N18, N24, N25, all displays | N8, N22, N23, N26, N27, N28, N29, N30 |
| S4 | P1 | Computed quick stats | Derived (computed from S3) | U13 | N31 (recomputed on S3 change) |
| S5 | P1.1 | Add Customer form state | React state | U20-U24, N9 | U20-U24 input, N8 reset |
| S6 | P2 | Artwork view state (sort mode, selected artwork) | React state | U65, U69 | N19, N21 |
| S7 | P2 | Note draft state (content, channel) | React state | U95, U96 | U95 type, U96 select, N23 clear |
| S8 | P2.2 | Contact form state | React state | U110-U115 | U110-U115 input, N27 reset |
| S9 | P2.3 | Group form state | React state | U120 | U120 input, N28 reset |
| S10 | P2.4 | Edit Customer form state | React state | U125-U135 | U125-U135 input, P2.4 mount (pre-fill), N29 reset |

---

## Wiring Verification

- [x] Every U has at least one Wires Out or Returns To
- [x] Every N has a trigger (from a U or page mount)
- [x] Every S has at least one reader and one writer
- [x] No dangling wire references
- [x] Every CORE feature from scope definition has corresponding affordances (see Scope Coverage below)

---

## Component Boundaries

| Component | Place(s) | Contains Affordances | Location | Shared? |
|-----------|----------|---------------------|----------|---------|
| **LifecycleBadge** | P1, P2, Quoting | U14, U34 | `components/features/LifecycleBadge.tsx` | Yes — used in customer list, detail, quote form |
| **HealthBadge** | P1, P2 | U15, U35 | `components/features/HealthBadge.tsx` | Yes — used in customer list and detail |
| **TypeTagBadges** | P1, P2, P2.4 | U16, U36 | `components/features/TypeTagBadges.tsx` | Yes — display + edit modes |
| **CustomerQuickStats** | P1, P2 | U13, U37 | `components/features/CustomerQuickStats.tsx` | Yes — list bar variant + detail header variant |
| **SmartViewTabs** | P1 | U2-U6 | `app/(dashboard)/customers/_components/SmartViewTabs.tsx` | No — customer list specific |
| **CustomersDataTable** | P1 | U1, U7-U10, U12, U14-U16 | `app/(dashboard)/customers/_components/CustomersDataTable.tsx` | No — extends shared table pattern |
| **CustomerListStatsBar** | P1 | U13 | `app/(dashboard)/customers/_components/CustomerListStatsBar.tsx` | No — list-specific quick stats |
| **AddCustomerModal** (enhanced) | P1.1, P2.1 | U20-U27 | `components/features/AddCustomerModal.tsx` | Yes — already exists, needs enhancement |
| **CustomerDetailHeader** | P2 | U30-U41 | `app/(dashboard)/customers/[id]/_components/CustomerDetailHeader.tsx` | No — detail-specific |
| **CustomerTabs** | P2 | U42 | `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx` | No — detail-specific tab shell |
| **ActivityTimeline** | P2 | U50-U52 | `app/(dashboard)/customers/[id]/_components/ActivityTimeline.tsx` | No — could become shared if jobs get timelines |
| **CustomerQuotesTable** | P2 | U55-U57 | `app/(dashboard)/customers/[id]/_components/CustomerQuotesTable.tsx` | No — detail-specific |
| **CustomerJobsTable** | P2 | U60-U61 | `app/(dashboard)/customers/[id]/_components/CustomerJobsTable.tsx` | No — detail-specific |
| **ArtworkGallery** | P2 | U65-U71 | `components/features/ArtworkGallery.tsx` | Yes — reusable for artwork management vertical |
| **ContactHierarchy** | P2 | U75-U81 | `app/(dashboard)/customers/[id]/_components/ContactHierarchy.tsx` | No — detail-specific |
| **CustomerDetailsPanel** | P2 | U85-U92 | `app/(dashboard)/customers/[id]/_components/CustomerDetailsPanel.tsx` | No — detail-specific |
| **NotesPanel** | P2 | U95-U102 | `components/features/NotesPanel.tsx` | Yes — reusable for any entity with notes |
| **AddContactSheet** | P2.2 | U110-U117 | `app/(dashboard)/customers/[id]/_components/AddContactSheet.tsx` | No — customer-specific |
| **AddGroupSheet** | P2.3 | U120-U122 | `app/(dashboard)/customers/[id]/_components/AddGroupSheet.tsx` | No — customer-specific |
| **EditCustomerSheet** | P2.4 | U125-U137 | `app/(dashboard)/customers/[id]/_components/EditCustomerSheet.tsx` | No — detail-specific |
| **ArchiveDialog** | P2.5 | U140-U142 | `app/(dashboard)/customers/[id]/_components/ArchiveDialog.tsx` | No — detail-specific |

---

## Build Order

| # | Component/Screen | Depends On | Blocks | Est. Complexity |
|---|-----------------|------------|--------|-----------------|
| 1 | **Schemas** (contact, address, group, note, expanded customer) | Zod, existing schemas | Everything — all components import types | Medium |
| 2 | **Mock data expansion** (10 customers with contacts, groups, notes, addresses, lifecycle, health) | Step 1 schemas | All display components | High |
| 3 | **LifecycleBadge** | Nothing (just Badge + constants) | Customer list, detail, quoting interconnection | Low |
| 4 | **HealthBadge** | Nothing | Customer list, detail | Low |
| 5 | **TypeTagBadges** | Nothing | Customer list, detail | Low |
| 6 | **NotesPanel** (shared) | Step 1 note schema, Step 2 mock notes | Customer detail Notes tab | Medium |
| 7 | **ArtworkGallery** (shared) | Step 1 schemas, Step 2 mock artwork data | Customer detail Artwork tab | High |
| 8 | **AddCustomerModal** (enhanced) | Step 1 schemas, existing modal | Customer list, quoting interconnection | Low-Medium |
| 9 | **CustomerQuickStats** | Step 1 schemas, Step 2 mock data | Customer list stats bar, detail header | Low |
| 10 | **Customer List page** (`/customers`) | Steps 1-5, 8-9 (schemas, mock data, badges, modal, stats) | Nothing (but P2 cross-links to it) | High |
| 11 | **Customer Detail page** (`/customers/[id]`) | Steps 1-9 (all shared components + schemas) | Nothing | Very High |
| 12 | **Customer Detail sub-components** (Contacts tab, Details tab, Activity timeline, Quotes/Jobs tables, modals) | Step 11 page shell | Nothing — built as part of step 11 | Included in step 11 |
| 13 | **Quoting interconnection** (enhanced combobox with lifecycle badges, auto-load context) | Steps 1-3 (schemas, mock data, LifecycleBadge) | Nothing | Low-Medium |

**Parallelizable work**:
- Steps 3-5 (LifecycleBadge, HealthBadge, TypeTagBadges) can all run in parallel
- Steps 6-7 (NotesPanel, ArtworkGallery) can run in parallel after Step 2
- Step 8 (AddCustomerModal enhancement) can run in parallel with steps 3-7
- Step 10 (Customer List) and Step 13 (Quoting interconnection) can start as soon as their deps are ready

**Recommended team strategy**:
- **Phase A** (parallel): Steps 1-2 first (schemas + mock data — foundation), then Steps 3-9 in parallel
- **Phase B** (after A): Step 10 (Customer List page)
- **Phase C** (after A): Step 11-12 (Customer Detail page + all sub-components)
- **Phase D** (after A): Step 13 (Quoting interconnection)
- Phases B, C, D can run in parallel once Phase A completes

---

## Scope Coverage

| Scope Feature | Affordances | Covered? |
|---------------|-------------|----------|
| Customer List Page (smart views, search, filters, stats) | U1-U16, N1-N7, N31, N33, S1, S4 | Yes |
| Customer Detail Dashboard (header + tabs + adaptive) | U30-U42, N10-N14, N32, S2 | Yes |
| Company → Group → Contact hierarchy | U75-U81, N22, N27, N28, P2.2, P2.3 | Yes |
| Customer Lifecycle (auto-progression, badges) | U14, U34, N32, LifecycleBadge, S3 lifecycle field | Yes |
| Customer Health Detection (churning, needs attention) | U5, U15, U35, N33 (smart view filter), HealthBadge | Yes |
| Customer Type Tags (starter set, multi-tag, filter) | U7, U16, U24, U36, U126, TypeTagBadges | Yes |
| Quick Add Customer (modal, minimal fields) | U20-U27, N8, N9, P1.1 | Yes |
| Customer Notes (contextual, pinned, channel-tagged) | U95-U102, N23-N26, S7, NotesPanel | Yes |
| Smart Artwork Gallery (volume-sorted, season-aware) | U65-U71, N18-N21, S6, ArtworkGallery | Yes |
| Referral Tracking (basic) | U90, U134, S3 referredByCustomerId | Yes |
| Tax Exempt Tracking (peripheral) | U87, U92, U130-U131 | Yes |
| Multiple Shipping Addresses (peripheral) | U86, U133 | Yes |
| Customer Statistics (peripheral) | U13, U37, N11, N31, CustomerQuickStats | Yes |
| Reorder / Copy as New (peripheral) | U57, N16 (leverages existing quoting feature) | Yes |
| Payment Terms (peripheral) | U88, U127 | Yes |
| Pricing Tier / Discount (peripheral) | U89, U128-U129 | Yes |
| Quoting interconnection (enhanced combobox) | Step 13, existing CustomerCombobox + LifecycleBadge | Yes |
| Invoicing preparation (schema fields) | Step 1 schema expansion (paymentTerms, pricingTier, etc.) | Yes |
| Artwork library interconnection | U65-U71 (same ArtworkGallery) | Yes |

---

## Phase 2 Extensions

Code affordances that will be added in Phase 2:

| ID | Place | Affordance | Replaces | Description |
|----|-------|------------|----------|-------------|
| N8-P2 | P1.1 | createCustomer(data) API call | N8 (client state) | POST to /api/customers |
| N14-P2 | P2 | fetchActivityTimeline(customerId) | N14 (mock aggregation) | Server-side timeline query |
| N15-P2 | P2 | fetchCustomerQuotes(customerId) | N15 (mock filter) | Server query with pagination |
| N18-P2 | P2 | fetchSmartSortedArtwork(customerId) | N18 (client sort) | Server-side smart ranking with real usage data |
| N23-P2 | P2 | createNote(data) API call | N23 (client state) | POST to /api/notes |
| N34 | P2 | Communication auto-import | New | Email, SMS integration for auto-logging |
| N35 | P1 | exportCSV() | New | Download customer list as CSV |
| N36 | P2.4 | Google Maps address autocomplete | Manual address entry | Address suggestion from Google Places API |
| N37 | P1 | Configurable lifecycle thresholds | Hardcoded defaults | Settings page reads custom thresholds |

---

## Related Documents

- `docs/strategy/customer-management-scope-definition.md` (scope boundaries)
- `docs/APP_FLOW.md` (routes and navigation)
- `docs/competitive-analysis/customer-management-competitive-analysis.md` (9-competitor analysis)
- `docs/research/customer-management-research.md` (industry research)
- `memory/mobile-strategy.md` (responsive design requirements)
- `CLAUDE.md` (design system, quality checklist)
