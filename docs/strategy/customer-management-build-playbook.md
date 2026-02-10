---
title: "Customer Management — Build Playbook"
description: "Step-by-step instructions for running parallel Claude Code sessions with GitButler to build the Customer Management vertical"
category: strategy
status: active
phase: 1
created: 2026-02-10
last-verified: 2026-02-10
depends-on:
  - docs/breadboards/customer-management-breadboard.md
  - docs/strategy/customer-management-scope-definition.md
---

# Customer Management — Build Playbook

## Overview

This playbook tells you exactly what to do, when, and what to paste into each Claude Code session to build the Customer Management vertical using parallel sessions with GitButler.

**Structure**: 3 waves, 5 sessions total, 1 quality gate.

```
Wave 1:  [Session 1: Foundation] ──── merge PR ────┐
                                                     │
Wave 2:  [Session 2: List Page]  ───┐               │
         [Session 3: Detail Page] ──┤── merge PRs ──┤
         [Session 4: Quoting Fix] ──┘               │
                                                     │
Wave 3:  [Session 5: Quality Gate] ── merge PR ─── DONE
```

---

## Why 3 Waves (Not All Parallel)?

**GitButler virtual branches have file-level ownership.** If Branch A edits `lib/constants.ts`, Branch B cannot touch that file until A merges. This means:

- **Wave 1** must go first because it creates/modifies the shared foundation files (`schemas/`, `constants.ts`, `mock-data.ts`) that every other session imports from.
- **Wave 2** sessions can run in parallel because they each create **new files only** in non-overlapping directories. Zero file conflicts.
- **Wave 3** runs after everything merges to audit the complete picture.

---

## File Ownership Map

This is why the sessions are split the way they are — **zero file overlaps** between Wave 2 sessions:

| File | Session 1 | Session 2 | Session 3 | Session 4 |
|------|:---------:|:---------:|:---------:|:---------:|
| `lib/schemas/*.ts` | WRITE | read | read | read |
| `lib/constants.ts` | WRITE | read | read | read |
| `lib/mock-data.ts` | WRITE | read | read | read |
| `lib/schemas/__tests__/*.ts` | WRITE | — | — | — |
| `components/features/LifecycleBadge.tsx` | CREATE | read | read | read |
| `components/features/HealthBadge.tsx` | CREATE | read | read | — |
| `components/features/TypeTagBadges.tsx` | CREATE | read | read | — |
| `components/features/CustomerQuickStats.tsx` | CREATE | read | read | — |
| `components/features/AddCustomerModal.tsx` | — | WRITE | — | — |
| `components/features/ArtworkGallery.tsx` | — | — | CREATE | — |
| `components/features/NotesPanel.tsx` | — | — | CREATE | — |
| `components/features/CustomerCombobox.tsx` | — | — | — | WRITE |
| `app/(dashboard)/customers/page.tsx` | — | CREATE | — | — |
| `app/(dashboard)/customers/_components/*` | — | CREATE | — | — |
| `app/(dashboard)/customers/[id]/page.tsx` | — | — | CREATE | — |
| `app/(dashboard)/customers/[id]/_components/*` | — | — | CREATE | — |

**WRITE** = modifies existing file (owns it). **CREATE** = new file. **read** = imports only (no ownership).

---

## Wave 1: Foundation

### When to Run

**Now.** This is the first thing. Nothing else can start until this merges.

### How to Create the Session

Open a new terminal and run:

```bash
claude
```

### Prompt to Paste

> **Note**: Session 1 already ran without subagent delegation and hit context compaction. The prompt below has been revised for reference — future Foundation sessions should follow this pattern.

```
You are the ORCHESTRATOR for the Customer Management data foundation. Do NOT build everything yourself — use the Task tool to delegate file creation to subagents. You coordinate, verify backwards compatibility, and commit.

## Why Subagents
This session creates 10+ files (schemas, constants, mock data, tests, components). Generating all that code in one context window causes compaction. Instead, spawn subagents for independent file groups — each gets its own context window.

## Branch Setup
Create branch: `but branch new session/0210-customer-foundation`

## What to Read First
1. `docs/strategy/customer-management-scope-definition.md` — full scope with schema specs
2. `docs/breadboards/customer-management-breadboard.md` — affordance map and component list
3. `lib/schemas/customer.ts` — current 7-field schema to expand
4. `lib/mock-data.ts` — current mock data to expand
5. `lib/constants.ts` — current constants to expand
6. `CLAUDE.md` — coding standards, design system, quality checklist

## Step 1: Read Specs (YOU do this)
Read these yourself for orchestration context — but skim, don't memorize:
1. `docs/strategy/customer-management-scope-definition.md` — "Expanded Customer Schema" section + "Mock Data Requirements"
2. `lib/schemas/customer.ts` — current 7-field schema
3. `lib/constants.ts` — current constants structure
4. `CLAUDE.md` — coding standards (skim)

## Step 2: Spawn Subagents for Independent Work
Use the Task tool with `subagent_type: "general-purpose"`. Launch groups in parallel where possible.

### Parallel Group 1 (launch together — no dependencies between them):

**Subagent: New Schemas** — create `contact.ts`, `address.ts`, `group.ts`, `note.ts` in `lib/schemas/`

### 1. New Schemas (`lib/schemas/`)
Create these new schema files following Zod-first patterns (see existing schemas for format):
- `contact.ts` — id, name, email?, phone?, role (ordering|art-approver|billing|owner|other), isPrimary, notes?, groupId?
- `address.ts` — id, label, street, street2?, city, state, zip, country (default "US"), isDefault, type (billing|shipping)
- `group.ts` — id, name, customerId
- `note.ts` — id, content, createdAt, createdBy, isPinned, channel (phone|email|text|social|in-person|null), entityType (customer|quote|artwork|job), entityId

### 2. Expand Customer Schema (`lib/schemas/customer.ts`)
Rewrite from 7 fields to the full schema defined in the scope definition's "Expanded Customer Schema" section. Key fields: company, lifecycleStage, healthStatus, isArchived, typeTags[], contacts[], groups[], billingAddress?, shippingAddresses[], paymentTerms, pricingTier, discountPercentage?, taxExempt, taxExemptCertExpiry?, referredByCustomerId?, createdAt, updatedAt.

**CRITICAL — Backwards Compatibility**: The existing quoting code (QuoteDetailView, QuotesDataTable) reads `customer.name` and `customer.company` from mock data. You MUST either:
- Keep `name` as a top-level convenience field (= primary contact name), OR
- Update all quoting code that reads `customer.name` to use the new contact structure
The safer approach is keeping `name` as a denormalized field alongside `contacts[]`. The quoting combobox uses its own `CustomerOption` interface so it's not affected.

### 3. Expand Constants (`lib/constants.ts`)
Add ALL new label/color maps:
- `LIFECYCLE_STAGE_LABELS` and `LIFECYCLE_STAGE_COLORS` (prospect: cyan, new: neutral, repeat: green, contract: amber)
- `HEALTH_STATUS_LABELS` and `HEALTH_STATUS_COLORS` (active: none, potentially-churning: amber, churned: red)
- `CUSTOMER_TYPE_TAG_LABELS` and `CUSTOMER_TYPE_TAG_COLORS` (retail, sports-school, corporate, storefront-merch, wholesale)
- `CONTACT_ROLE_LABELS` (ordering, art-approver, billing, owner, other)
- `PAYMENT_TERMS_LABELS` (cod, upfront, net-15, net-30, net-60)
- `PRICING_TIER_LABELS` (standard, preferred, contract, wholesale)
- `NOTE_CHANNEL_LABELS` (phone, email, text, social, in-person)

### 4. Expand Mock Data (`lib/mock-data.ts`)
Create 10 customers per the scope definition's Mock Data Requirements table. Each with:
- Full contact records with roles
- Addresses (billing + shipping)
- Lifecycle stages across all 4 states
- Health statuses (at least 1 potentially-churning, 1 churned)
- Type tags (1-2 per customer)
- Referral relationships (at least 2 chains)
- Notes (at least 2 per customer: 1 pinned, 1 regular)
Export new arrays: `contacts`, `customerGroups`, `customerNotes`, `customerAddresses`
Keep existing customers (River City, Lonestar, Thompson, Sunset 5K, Lakeside) but expand them. Add 5 new ones per scope definition.

### 5. Tests (`lib/schemas/__tests__/`)
- Update `customer.test.ts` for expanded schema
- Create `contact.test.ts`, `address.test.ts`, `group.test.ts`, `note.test.ts`
- Update `mock-data.test.ts` for new data: validate all customers parse, referential integrity (contactIds, groupIds, referredByCustomerId all resolve), at least 1 customer per lifecycle stage, at least 1 per health status

### 6. Shared Badge Components (`components/features/`)
Build these small display components:
- `LifecycleBadge.tsx` — renders lifecycle stage as colored badge (uses constants). Props: `stage`, optional `className`.
- `HealthBadge.tsx` — renders health status badge. Only visible when NOT "active". Props: `status`, optional `className`.
- `TypeTagBadges.tsx` — renders array of type tag badges. Props: `tags: string[]`, optional `className`.
- `CustomerQuickStats.tsx` — renders a row of key stats. Props: `stats: { lifetimeRevenue, totalOrders, avgOrderValue, lastOrderDate, referralCount? }`, optional `variant: "bar" | "header"` for list vs detail layouts.

### 7. Verify Build
Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
ALL must pass before committing.

## Commit & PR
- Commit to `session/0210-customer-foundation`
- Push: `but push session/0210-customer-foundation`
- Open PR: Target `main`, title: "feat: Customer Management foundation — schemas, mock data, shared components"
- Let the human know you're done so they can merge.

## Quality Standards
- Zod-first types (no separate interfaces)
- Semantic design tokens only (text-action, not text-cyan-400)
- All badge components must have hover states and ARIA labels
- Mobile-friendly: badges must be readable at small sizes
- Follow existing component patterns (look at StatusBadge.tsx for reference)
```

### After Session 1 Completes

1. Review the PR
2. Merge it: `gh pr merge <number> --squash --delete-branch`
3. Wait for CI to pass on main
4. Then proceed to Wave 2

---

## Context Management Strategy

### Why Sessions Compacted Before (and How We Fix It)

Session 1 (Foundation) hit context limits because a single agent tried to: read 6 large documents, generate 4 schema files, rewrite the customer schema, expand constants, generate 500+ lines of mock data, write 5+ test files, and build 4 components. All that generated code sat in one context window.

**The fix**: Each session prompt now instructs the agent to **delegate heavy work to subagents or teammates**, keeping the orchestrating agent's context lean. The orchestrator reads specs, coordinates, and verifies — it never holds hundreds of lines of generated code.

### Subagents (`Task` tool) vs Teams (`TeamCreate`)

| | Subagents | Teams |
|---|---|---|
| **Best for** | Discrete, independent chunks that return results | Longer-running parallel work on multi-file features |
| **Coordination** | Orchestrator sequences everything | Agents message each other, shared task list |
| **Context** | Each gets own window, result flows back | Each gets own window, persistent until shutdown |
| **Overhead** | Low — fire and get result | Higher — setup, messaging, shutdown protocol |
| **Sweet spot** | "Write this one component given these inputs" | "Build this whole feature area with 3+ files" |

| Session | Strategy | Rationale |
|---------|----------|-----------|
| 2 (Customer List) | **Subagents** | 4 independent components, orchestrator integrates into page shell |
| 3 (Customer Detail) | **Team** | 7 tabs + 4 modals across 12+ files — teammates build feature areas in parallel |
| 4 (Quoting Fix) | **Neither** | Single file, low complexity, no delegation needed |
| 5 (Quality Gate) | **Subagents** | Parallel read-only audits, orchestrator aggregates findings + fixes |

---

## Wave 2: Parallel Page Sessions

### When to Run

**After Wave 1 PR is merged to main.** All 3 sessions can start at the same time.

### How to Create the Sessions

Open 3 separate terminal tabs/windows. In each, run `claude` and paste the corresponding prompt.

---

### Session 2: Customer List Page (Subagent Strategy)

```
You are the ORCHESTRATOR for the Customer List page (/customers). Do NOT build all components yourself — use the Task tool to delegate component building to subagents. You coordinate, integrate, verify, and commit.

## Why Subagents
Each component (SmartViewTabs, DataTable, StatsBar, Modal) is independent with well-defined inputs/outputs. Subagents each get their own context window, so generated code doesn't pile up in yours. You stay lean — read specs, spawn builders, assemble the page, verify.

## Branch Setup
Create branch: `but branch new session/0210-customer-list`

## Step 1: Read Specs (YOU do this — not subagents)
Read these files yourself so you understand the full picture for orchestration:
1. `CLAUDE.md` — design system, quality checklist, coding standards
2. `docs/strategy/customer-management-scope-definition.md` — ONLY the "Customer List Page" section
3. `docs/breadboards/customer-management-breadboard.md` — ONLY the P1 (Customer List) section
4. `app/(dashboard)/quotes/page.tsx` — reference for page layout pattern (how the quotes list is structured)
5. `lib/schemas/customer.ts` — the expanded customer schema (skim for field names)
6. `lib/constants.ts` — the new constant maps (skim for export names)

Do NOT read the full scope definition or full breadboard — only the Customer List sections. Save context.

## Step 2: Create Page Shell (YOU do this)
Build `app/(dashboard)/customers/page.tsx` yourself — it's a small server component that imports mock data and composes the child components. This gives you the integration point.

## Step 3: Spawn Subagents IN PARALLEL (4 agents)
Use the Task tool with `subagent_type: "general-purpose"` for each. Launch all 4 in a single message for parallel execution.

**Subagent A — SmartViewTabs**:
```
Build the SmartViewTabs component at `app/(dashboard)/customers/_components/SmartViewTabs.tsx`.

Read these files first:
- `CLAUDE.md` (design system section only)
- `lib/constants.ts` (for lifecycle stage constants)

Requirements:
- 5 tabs/chips: All, Prospects, Top Customers, Needs Attention, Seasonal
- Wired to URL param `?view=all|prospects|top|attention|seasonal` using useSearchParams
- Active tab highlighted with action color
- Mobile: horizontal scroll with overflow-x-auto, no wrapping
- "use client" directive (uses hooks)
- Semantic tokens only (text-action, bg-elevated, etc.)
- Keyboard navigable, ARIA roles for tablist/tab
- Export SmartViewTabs as default export
```

**Subagent B — CustomersDataTable** (the largest component):
```
Build the CustomersDataTable component at `app/(dashboard)/customers/_components/CustomersDataTable.tsx`.

Read these files first:
- `CLAUDE.md` (design system section only)
- `app/(dashboard)/quotes/_components/QuotesDataTable.tsx` (reference pattern — follow this structure)
- `lib/schemas/customer.ts` (customer type fields)
- `lib/constants.ts` (lifecycle, health, type tag constants)
- `components/features/LifecycleBadge.tsx`
- `components/features/HealthBadge.tsx`
- `components/features/TypeTagBadges.tsx`

Requirements:
- Props: `customers: Customer[]`, `view: string` (from URL param)
- Columns: Company, Primary Contact, Type Tags, Lifecycle Stage, Health, Last Order, Lifetime Revenue
- Global search (URL param `?q=`): searches company, contact name, email, phone
- Type tag filter chips (URL param `?tags=`)
- Lifecycle filter (URL param `?lifecycle=`)
- Sortable columns (URL params `?sort=`, `?dir=`)
- "Show Archived" toggle (URL param `?archived=true`)
- Click row → navigate to `/customers/[id]` using useRouter
- Smart view filtering logic:
  - All: no filter (but hide archived unless toggle on)
  - Prospects: lifecycleStage === "prospect"
  - Top Customers: sorted by lifetime revenue descending
  - Needs Attention: healthStatus === "potentially-churning"
  - Seasonal: customers with mock seasonal type tags
- Empty state: "No customers yet — they'll appear here when you create your first quote"
- Mobile (< 768px): Table collapses to card list. Each card shows company, primary contact, lifecycle badge, health badge, last order. Touch targets >= 44px.
- "use client" directive
- Semantic tokens only, Lucide icons, ARIA labels, keyboard navigable
```

**Subagent C — CustomerListStatsBar**:
```
Build the CustomerListStatsBar component at `app/(dashboard)/customers/_components/CustomerListStatsBar.tsx`.

Read these files first:
- `CLAUDE.md` (design system section only)
- `components/features/CustomerQuickStats.tsx` (the shared stats component to use)
- `lib/schemas/customer.ts` (customer type)

Requirements:
- Props: `customers: Customer[]`
- Compute from mock data: Total Customers, Active This Month (not archived, not churned), Total Revenue (YTD, sum from linked quotes), Prospects count
- Use CustomerQuickStats component with variant="bar"
- Mobile: stacks to 2x2 grid
- "use client" directive
- Semantic tokens only
```

**Subagent D — AddCustomerModal Enhancement**:
```
Enhance the existing AddCustomerModal at `components/features/AddCustomerModal.tsx`.

Read these files first:
- `components/features/AddCustomerModal.tsx` (current implementation — read carefully)
- `CLAUDE.md` (design system section only)
- `lib/constants.ts` (for CUSTOMER_TYPE_TAG_LABELS, LIFECYCLE_STAGE_LABELS)
- `lib/schemas/customer.ts` (expanded schema)

Changes to make:
- Company Name becomes REQUIRED (was optional)
- Rename "Name" field to "Contact Name"
- Email OR Phone required (not both — validate at least one is provided)
- Add Type Tag multi-select using the starter set from CUSTOMER_TYPE_TAG_LABELS
- Remove the old single "Customer Type" dropdown (new/repeat/contract), replace with type tag multi-select
- Add `lifecycleStage` prop: default "new", but "prospect" when passed explicitly
- Keep the form completable in < 30 seconds — don't over-complicate
- Semantic tokens only, Lucide icons, ARIA labels
- Keep the existing onSave callback interface, just expand the data shape
```

## Step 4: Integrate (YOU do this)
After all 4 subagents complete:
1. Review each file they created for consistency
2. Wire them into page.tsx — import and compose
3. Make sure props flow correctly between components
4. Fix any TypeScript errors from mismatched interfaces

## Step 5: Verify Build (YOU do this)
Run: `npx tsc --noEmit && npm run lint && npm run build`
ALL must pass. If anything fails, fix it yourself — don't spawn more subagents for small fixes.

## Step 6: Commit & PR
- Stage all new/modified files
- Commit to `session/0210-customer-list`
- Push: `but push session/0210-customer-list`
- Open PR targeting `main`: "feat: Customer List page — smart views, search, filters, stats"
- Let the human know you're done.
```

---

### Session 3: Customer Detail Page (Team Strategy)

```
You are the TEAM LEAD for the Customer Detail page (/customers/[id]). This is the largest feature — a header, 7 tabs, and 4 modals across 12+ files. You will use TeamCreate to spawn teammates who build feature areas in parallel, while you build the page shell and coordinate.

## Why a Team (not subagents)
Subagents are good for single-file components. But here, each teammate builds a multi-file feature area (e.g., "artwork gallery + contacts hierarchy" = 2 complex components that share design patterns). Teammates can message each other if they discover interface issues, and they persist across multiple turns — important for complex components that may need iteration.

## Branch Setup
Create branch: `but branch new session/0210-customer-detail`

## Step 1: Read Specs (YOU do this)
Read these files yourself:
1. `CLAUDE.md` — design system, quality checklist
2. `docs/strategy/customer-management-scope-definition.md` — skim the "Customer Detail Dashboard" overview, CORE features, and PERIPHERAL features
3. `docs/breadboards/customer-management-breadboard.md` — skim the P2 section for the component list
4. `app/(dashboard)/quotes/[id]/page.tsx` — reference for detail page pattern
5. `lib/schemas/customer.ts` — expanded schema (field names and types)

Do NOT read every line of the scope definition. Skim for structure, then give teammates targeted instructions.

## Step 2: Build Page Shell + Header + Tab Container (YOU do this)
Build these yourself — they're the integration backbone:

1. `app/(dashboard)/customers/[id]/page.tsx` — Server component. Read customer ID from params, find in mock data, 404 if not found.
2. `app/(dashboard)/customers/[id]/_components/CustomerDetailHeader.tsx` — Company name (large), primary contact (name, email click-to-copy, phone click-to-copy), LifecycleBadge, HealthBadge (only if not "active"), TypeTagBadges, CustomerQuickStats (variant="header"), action buttons: "New Quote" (primary CTA → `/quotes/new?customer={id}`), "Edit Customer", "Archive". Breadcrumb: Dashboard > Customers > {company}. Mobile: stats wrap, actions stack full-width.
3. `app/(dashboard)/customers/[id]/_components/CustomerTabs.tsx` — Tab shell using shadcn Tabs. 7 tabs: Activity, Quotes, Jobs, Artwork, Contacts, Details, Notes. Default: Activity (but Notes for prospects). Mobile: horizontal scroll. Each tab renders its child component.

## Step 3: Create Team and Spawn Teammates
Use `TeamCreate` to create team `customer-detail-build`. Then use the `Task` tool with `team_name: "customer-detail-build"` and `subagent_type: "general-purpose"` to spawn 3 teammates.

Create tasks with `TaskCreate` FIRST, then spawn teammates and assign tasks.

**Tasks to create:**

Task 1: "Build simple tabs: Activity, Quotes, Jobs"
Task 2: "Build complex tabs: Artwork Gallery, Contact Hierarchy"
Task 3: "Build Notes, Details, and all Modals"

**Teammate "tabs-simple"** — Activity, Quotes, Jobs tabs:
```
You are a teammate on the customer-detail-build team. Check your assigned tasks with TaskList, claim one with TaskUpdate, and build it.

When you start, read:
- `CLAUDE.md` (design system section)
- `lib/schemas/customer.ts`, `lib/schemas/artwork.ts`
- `lib/mock-data.ts` (customer, quotes, jobs, notes arrays)
- `components/features/StatusBadge.tsx` (reference for badge pattern)

Build these 3 components in `app/(dashboard)/customers/[id]/_components/`:

**ActivityTimeline.tsx**: Props: `customerId: string`. Reverse-chronological timeline merging quotes (created/sent/accepted/declined), jobs (started/completed), and notes for this customer. Each item: timestamp, Lucide icon, description, link to entity. Use a subtle vertical line with node indicators. Empty state: "No activity yet".

**CustomerQuotesTable.tsx**: Props: `customerId: string`. Table: Quote #, Status (StatusBadge), Total, Date. Click row → `/quotes/[id]`. "Copy as New" action per row. Build from mock quotes filtered by customerId. Empty state: "No quotes yet — create one with the button above".

**CustomerJobsTable.tsx**: Props: `customerId: string`. Table: Job #, Status, Due Date. Click row → `/jobs/[id]`. Build from mock jobs filtered by customerId. Empty state: "No jobs yet — jobs are created from accepted quotes".

Rules: "use client", semantic tokens only, Lucide icons, mobile-responsive (tables → card list on mobile), ARIA labels, keyboard navigable.

When done, mark your task completed with TaskUpdate and send a message to the team lead.
```

**Teammate "tabs-complex"** — Artwork Gallery + Contact Hierarchy:
```
You are a teammate on the customer-detail-build team. Check your assigned tasks with TaskList, claim one with TaskUpdate, and build it.

When you start, read:
- `CLAUDE.md` (design system section)
- `lib/schemas/customer.ts` (contacts, groups fields)
- `lib/schemas/artwork.ts`
- `lib/mock-data.ts` (customers, artworks arrays)
- `lib/constants.ts` (CONTACT_ROLE_LABELS)

Build these 2 components:

**ArtworkGallery.tsx** — CREATE in `components/features/` (SHARED component for reuse).
Props: `artworks: Artwork[]`, optional `customerId: string`.
- CSS grid thumbnail layout (responsive: 4-col desktop, 2-col mobile)
- Thumbnail placeholder: colored rectangle with artwork initials (no real images)
- Per-artwork: name, color count, last used date, total orders badge
- Sort toggle: Smart (volume outliers → seasonal → recent → alpha) / Alphabetical / Chronological
- "Use in New Quote" action per artwork
- Visual badges: "Top seller" (highest order count), "In season" (mock seasonal tag)
- Hover tooltip: metadata + notes. Mobile: tap instead of hover.
- Empty state: "No artwork yet — artwork will appear here from quotes"
- This is the "aesthetic showpiece" — make it beautiful. Consistent thumbnails, clean grid, polished transitions.

**ContactHierarchy.tsx** — CREATE in `app/(dashboard)/customers/[id]/_components/`.
Props: `customer: Customer` (has contacts, groups).
- Company → Group → Contact tree/card view
- Contact cards: name, role badge (from CONTACT_ROLE_LABELS), email, phone, primary star indicator
- "Add Contact" button (opens sheet — use a placeholder onClick for now, team lead will wire modals)
- "Add Group" button (appears when 2+ contacts exist — progressive disclosure)
- "Set as Primary" action per contact
- Simple default: most customers have 1 contact, no groups. Don't over-design the tree for the common case.
- Mobile: stack contacts vertically, full-width cards. Touch targets >= 44px.
- Empty state: "No contacts yet — add your first contact"

Rules: "use client", semantic tokens only, Lucide icons, ARIA labels, keyboard navigable.

When done, mark your task completed with TaskUpdate and send a message to the team lead.
```

**Teammate "notes-modals"** — Notes, Details, and all Modals:
```
You are a teammate on the customer-detail-build team. Check your assigned tasks with TaskList, claim one with TaskUpdate, and build it.

When you start, read:
- `CLAUDE.md` (design system section)
- `lib/schemas/customer.ts` (full schema — you need all fields for edit sheet)
- `lib/schemas/note.ts`
- `lib/mock-data.ts` (customers, customerNotes arrays)
- `lib/constants.ts` (NOTE_CHANNEL_LABELS, PAYMENT_TERMS_LABELS, PRICING_TIER_LABELS, CUSTOMER_TYPE_TAG_LABELS)
- `components/ui/sheet.tsx`, `components/ui/dialog.tsx` (shadcn primitives)

Build these components:

**NotesPanel.tsx** — CREATE in `components/features/` (SHARED component for reuse across entities).
Props: `entityType: string`, `entityId: string`, `notes: Note[]`, `onAddNote?: (note) => void`, `onTogglePin?: (noteId) => void`.
- Quick-add input at top (always visible) with optional channel tag selector (phone/email/text/social/in-person)
- Pinned notes section at top (visually distinct background)
- All notes list (reverse chronological)
- Pin/unpin toggle per note
- Channel tag badge + relative timestamp display per note
- Mobile: quick-add stays accessible, note cards full-width
- Empty state: "No notes yet — add your first note above"

**CustomerDetailsPanel.tsx** — in `app/(dashboard)/customers/[id]/_components/`.
Props: `customer: Customer`, `onEdit?: () => void`.
Read-only display: billing address, shipping addresses (named, default flag), tax exempt + cert expiry, payment terms, pricing tier + discount %, "Referred by" (link to `/customers/{referrerId}`). "Edit" button calls onEdit.

**AddContactSheet.tsx** — in `app/(dashboard)/customers/[id]/_components/`.
Sheet with: name, email, phone, role selector (from CONTACT_ROLE_LABELS), group selector (optional), "Set as Primary" checkbox. Save callback, cancel closes.

**AddGroupSheet.tsx** — in `app/(dashboard)/customers/[id]/_components/`.
Sheet with: group name. Save callback, cancel closes.

**EditCustomerSheet.tsx** — in `app/(dashboard)/customers/[id]/_components/`.
Sheet with full profile edit: company name, type tags (multi-select), payment terms, pricing tier, discount %, tax exempt toggle, tax cert expiry (date picker), billing address, shipping addresses (add/edit/remove with named labels + default flag), "Referred by" customer selector, lifecycle override (promote to Contract). Save callback, cancel closes. This is the most complex form — keep it organized with sections.

**ArchiveDialog.tsx** — in `app/(dashboard)/customers/[id]/_components/`.
Confirmation dialog: "Are you sure you want to archive {company}? Archived customers are hidden from the main list but can be restored." Archive button (destructive style), Cancel button.

Rules: "use client", semantic tokens only, Lucide icons, ARIA labels, all form fields keyboard navigable.

When done, mark your task completed with TaskUpdate and send a message to the team lead.
```

## Step 4: Integrate (YOU do this, after all teammates finish)
1. Read each file the teammates created
2. Wire tab content components into CustomerTabs.tsx
3. Wire modal open/close state: header actions → EditCustomerSheet/ArchiveDialog, contact tab → AddContactSheet/AddGroupSheet
4. Fix any TypeScript errors from mismatched interfaces between components
5. Test that the page compiles and all tabs render

## Step 5: Verify Build (YOU do this)
Run: `npx tsc --noEmit && npm run lint && npm run build`
Fix any issues.

## Step 6: Shutdown Team
Send shutdown_request to all teammates. Then TeamDelete.

## Step 7: Commit & PR
- Stage all new files
- Commit to `session/0210-customer-detail`
- Push: `but push session/0210-customer-detail`
- Open PR targeting `main`: "feat: Customer Detail page — header, 7 tabs, artwork gallery, notes, contacts"
- Let the human know you're done.
```

---

### Session 4: Quoting Interconnection (No Delegation Needed)

```
Enhance the existing CustomerCombobox to show lifecycle badges and richer customer context, connecting the Customer Management data to the Quoting vertical.

This is a small, focused session — a single file modification. No subagents or teams needed.

## Branch Setup
Create branch: `but branch new session/0210-quoting-interconnection`

## What to Read First
1. `components/features/CustomerCombobox.tsx` — current implementation (read carefully, this is your primary file)
2. `components/features/LifecycleBadge.tsx` — badge component to use
3. `lib/schemas/customer.ts` — expanded schema (for type imports)
4. `lib/mock-data.ts` — expanded mock data (for testing)
5. `app/(dashboard)/quotes/_components/QuoteForm.tsx` — how the combobox is wired into the quote form
6. `CLAUDE.md` — coding standards (skim design system section)

Only read the scope definition if you need clarification: `docs/strategy/customer-management-scope-definition.md` — "Quoting: Customer Selection (Enhanced)" section.

## What to Build

### Enhanced CustomerCombobox (`components/features/CustomerCombobox.tsx`)
This is the ONLY file you modify. Changes:

1. **Update `CustomerOption` interface**: Add `lifecycleStage` field (import type from customer schema)
2. **Lifecycle badge in dropdown**: Show LifecycleBadge next to each customer name in the dropdown list (replaces the old `tag` badge)
3. **Enriched selected display**: When a customer is selected, the info card below the combobox should show:
   - Company name (prominent)
   - Primary contact name + role badge
   - Email + phone
   - Lifecycle badge + type tag badges
   - "View Customer" link (→ `/customers/{id}` in new tab)
4. **Search enhancement**: Also search by lifecycle stage and type tags (e.g., typing "contract" shows contract customers)
5. **Auto-tag from quoting context**: When `AddCustomerModal` is opened from the quote form, the new customer should auto-tag as "prospect" lifecycle stage

### Update Quote Components if Needed
If the expanded `CustomerOption` interface requires changes to `QuoteForm.tsx` or `QuoteDetailView.tsx` to pass the new fields, make those minimal changes. Keep changes to quoting code as small as possible — this is a surgical interconnection update, not a quoting rebuild.

### Verify Build
Run: `npx tsc --noEmit && npm run lint && npm run build`

## Commit & PR
- Commit to `session/0210-quoting-interconnection`
- Push: `but push session/0210-quoting-interconnection`
- Open PR targeting `main`: "feat: Enhanced CustomerCombobox with lifecycle badges and enriched context"
- Let the human know you're done.
```

---

### After Wave 2 Completes

1. Review each PR (Session 2, 3, 4)
2. Merge them one at a time (order doesn't matter — no file conflicts)
3. After all 3 merge, verify the build passes on main: `npm run build`
4. Proceed to Wave 3

---

## Wave 3: Quality Gate

### When to Run

**After all Wave 2 PRs are merged to main.**

### Prompt to Paste

```
You are the ORCHESTRATOR for the Customer Management quality gate audit. Use the Task tool to run audit checks in parallel via subagents, then aggregate findings and fix issues yourself.

## Why Subagents
The audit has 5 independent inspection areas. Running them in parallel via subagents saves time and keeps your context lean — you only see the findings summary, not hundreds of lines of component source code.

## Branch Setup
Create branch: `but branch new session/0210-customer-quality-gate`

## Step 1: Build Verification (YOU do this first)
Run ALL of these and report results:
- `npx tsc --noEmit` (type check)
- `npm run lint` (ESLint)
- `npm test` (Vitest — all schema tests)
- `npm run build` (production build)
Any failure = stop and fix before proceeding to audits.

## Step 2: Spawn Audit Subagents IN PARALLEL (4 agents)
Use the Task tool with `subagent_type: "general-purpose"` for each. Launch all 4 in a single message.

**Subagent A — Visual Audit: Customer List**:
```
Audit the Customer List page (`/customers`) for visual quality.

Read ALL files in `app/(dashboard)/customers/` and these references:
- `CLAUDE.md` (quality checklist section)
- `components/features/LifecycleBadge.tsx`, `HealthBadge.tsx`, `TypeTagBadges.tsx`, `CustomerQuickStats.tsx`

Check these 10 categories and report PASS/WARN/FAIL for each:
1. Visual Hierarchy: Primary action most prominent? Status colors for meaning only?
2. Spacing/Layout: All Tailwind tokens? No hardcoded px? Consistent padding?
3. Typography: Max 3-4 sizes? Inter for UI only?
4. Color Usage: Monochrome base? Semantic tokens only (no text-cyan-400, shadow-cyan-400)?
5. Interactive States: All elements have hover, focus-visible, active, disabled?
6. Icons: Lucide only? Consistent sizes (16/20/24)?
7. Motion: Respects prefers-reduced-motion?
8. Empty/Error States: Empty state designed? Inviting message?
9. Accessibility: ARIA labels? 4.5:1 contrast? Keyboard navigable? Tab order?
10. Density: Can anything be removed without losing meaning?

Also check mobile responsiveness:
- Table collapses to card list at < 768px?
- Touch targets >= 44px?
- Stats bar stacks to 2x2 grid?
- Smart view tabs scroll horizontally?
- No horizontal overflow?

Return a structured report: category, rating, specific issues found (with file:line references).
```

**Subagent B — Visual Audit: Customer Detail**:
```
Audit the Customer Detail page (`/customers/[id]`) for visual quality.

Read ALL files in `app/(dashboard)/customers/[id]/` and these shared components:
- `components/features/ArtworkGallery.tsx`
- `components/features/NotesPanel.tsx`
- `CLAUDE.md` (quality checklist section)

Check the same 10 categories as the list page audit (Visual Hierarchy, Spacing, Typography, Color, Interactive States, Icons, Motion, Empty/Error States, Accessibility, Density) — report PASS/WARN/FAIL for each.

Additionally check:
- All 7 tabs have designed empty states
- Activity timeline has proper visual treatment (vertical line, node indicators)
- Artwork gallery: beautiful grid, consistent thumbnails, sort toggle works
- Notes panel: pinned notes visually distinct, timestamps subtle
- Contact hierarchy: clean layout, role badges, primary star
- All modals/sheets: proper form layout, save/cancel actions
- 404 page: "Customer not found" with link back

Mobile checks for detail page:
- Stats wrap to 2 rows?
- Actions stack full-width?
- Tabs scroll horizontally?
- Artwork grid is 2-column?
- Contact cards full-width?
- Note cards full-width?
- All touch targets >= 44px?

Return a structured report with file:line references for each issue.
```

**Subagent C — Scope Coverage Audit**:
```
Verify every CORE feature from the scope definition is implemented.

Read:
- `docs/strategy/customer-management-scope-definition.md` (focus on CORE features and acceptance criteria)
- `docs/breadboards/customer-management-breadboard.md` (affordance list — verify each has implementation)

Then read all implementation files in `app/(dashboard)/customers/` and `components/features/` to verify.

Check each feature — report IMPLEMENTED/PARTIAL/MISSING:
- [ ] Customer List with smart views (All, Prospects, Top, Attention, Seasonal)
- [ ] Customer Detail with all 7 tabs (Activity, Quotes, Jobs, Artwork, Contacts, Details, Notes)
- [ ] Company → Group → Contact hierarchy
- [ ] Lifecycle badges (all 4 stages: prospect, new, repeat, contract)
- [ ] Health detection (churning customer in Needs Attention view)
- [ ] Type tags (filterable, multi-tag display)
- [ ] Quick Add Customer modal (enhanced with type tags)
- [ ] Notes panel (add, pin, channel tags)
- [ ] Artwork gallery (smart sort, badges, responsive grid)
- [ ] Referral tracking (referred-by visible on detail page)

For any PARTIAL/MISSING, describe specifically what's missing.

Return a structured report.
```

**Subagent D — Cross-Vertical Verification**:
```
Verify the Customer Management vertical doesn't break existing functionality.

Read and check:
1. `app/(dashboard)/quotes/new/page.tsx` and `app/(dashboard)/quotes/_components/QuoteForm.tsx` — does the CustomerCombobox still render?
2. `components/features/CustomerCombobox.tsx` — does it show lifecycle badges?
3. `app/(dashboard)/quotes/[id]/page.tsx` and related components — do existing quote detail pages still render?
4. `app/(dashboard)/page.tsx` (dashboard) — does it still work?
5. Check all imports across quoting files — any broken references to old customer schema fields?

For each, report: PASS/FAIL with specific issue description.

Also verify:
- "New Quote" link from customer detail navigates to `/quotes/new?customer={id}`
- "Copy as New" action generates correct URL
- "View Customer" link from combobox generates correct URL

Return a structured report.
```

## Step 3: Aggregate Findings (YOU do this)
Collect all 4 audit reports. Create a summary:
- Count of PASS / WARN / FAIL per category
- Prioritized list of issues to fix (FAIL first, then WARN)

## Step 4: Fix Everything (YOU do this)
Fix all FAILs and as many WARNs as reasonable. Group fixes by category. Make minimal, targeted edits — don't refactor working code.

## Step 5: Final Build (YOU do this)
Run all checks: `npx tsc --noEmit && npm run lint && npm test && npm run build`
ALL must pass.

## Step 6: Commit & PR
- Commit fixes to `session/0210-customer-quality-gate`
- Push: `but push session/0210-customer-quality-gate`
- Open PR: "fix: Customer Management quality gate — audit fixes and polish"
- Include the aggregated audit report (pass/warn/fail per category) in the PR description.
- Let the human know you're done.
```

---

## Quick Reference Card

| Wave | Session | Branch Name | Strategy | Trigger | Complexity |
|------|---------|-------------|----------|---------|------------|
| 1 | Foundation | `session/0210-customer-foundation` | Subagents | Start now | High |
| 2 | Customer List | `session/0210-customer-list` | Subagents (4) | After Wave 1 merges | High |
| 2 | Customer Detail | `session/0210-customer-detail` | **Team** (3 mates) | After Wave 1 merges | Very High |
| 2 | Quoting Fix | `session/0210-quoting-interconnection` | Direct (no delegation) | After Wave 1 merges | Low |
| 3 | Quality Gate | `session/0210-customer-quality-gate` | Subagents (4 audits) | After Wave 2 merges | Medium |

## Merge Checklist

Before merging each PR:

- [ ] CI passes (tsc, lint, test, build)
- [ ] Quickly scan the diff for obvious issues
- [ ] No files outside the session's ownership zone (see File Ownership Map)
- [ ] Merge with squash: `gh pr merge <number> --squash --delete-branch`

## Troubleshooting

**"but stage" fails with ownership conflict**: A file is claimed by another virtual branch. Check `but status` — if two branches touch the same file, one session went outside its lane. Fix by moving the change to the correct branch or merging the conflicting branch first.

**Build fails after merging Wave 2**: The sessions were built against the Wave 1 main. If two Wave 2 sessions both import a new component and use it slightly differently, there could be type mismatches. Fix in the Quality Gate session.

**Customer schema breaks quoting**: Wave 1's schema changes may affect quoting code. The Foundation session is responsible for keeping backwards compatibility. If quoting breaks after Wave 1 merges, fix it before starting Wave 2.
