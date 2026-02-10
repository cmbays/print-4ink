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

```
Build the data foundation for the Customer Management vertical. This session creates all schemas, constants, mock data, and shared badge/stats components that every other session depends on.

## Branch Setup
Create branch: `but branch new session/0210-customer-foundation`

## What to Read First
1. `docs/strategy/customer-management-scope-definition.md` — full scope with schema specs
2. `docs/breadboards/customer-management-breadboard.md` — affordance map and component list
3. `lib/schemas/customer.ts` — current 7-field schema to expand
4. `lib/mock-data.ts` — current mock data to expand
5. `lib/constants.ts` — current constants to expand
6. `CLAUDE.md` — coding standards, design system, quality checklist

## What to Build (in this order)

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

## Wave 2: Parallel Page Sessions

### When to Run

**After Wave 1 PR is merged to main.** All 3 sessions can start at the same time.

### How to Create the Sessions

Open 3 separate terminal tabs/windows. In each, run `claude` and paste the corresponding prompt.

---

### Session 2: Customer List Page

```
Build the Customer List page (/customers) for the Customer Management vertical.

## Branch Setup
Create branch: `but branch new session/0210-customer-list`

## What to Read First
1. `docs/breadboards/customer-management-breadboard.md` — P1 (Customer List) affordances U1-U16, code affordances N1-N7/N31/N33
2. `docs/strategy/customer-management-scope-definition.md` — "Customer List Page" section with acceptance criteria and quality checklist
3. `lib/schemas/customer.ts` — expanded customer schema (just merged)
4. `lib/mock-data.ts` — expanded mock data with 10 customers (just merged)
5. `lib/constants.ts` — new lifecycle/health/tag constants (just merged)
6. `components/features/LifecycleBadge.tsx` — shared badge (just merged)
7. `components/features/HealthBadge.tsx` — shared badge (just merged)
8. `components/features/TypeTagBadges.tsx` — shared badges (just merged)
9. `components/features/CustomerQuickStats.tsx` — shared stats component (just merged)
10. `app/(dashboard)/quotes/page.tsx` — reference for page layout pattern
11. `app/(dashboard)/quotes/_components/QuotesDataTable.tsx` — reference for DataTable pattern
12. `CLAUDE.md` — design system, quality checklist, mobile requirements
13. `memory/mobile-strategy.md` — mobile-specific rules for customer list

## What to Build

### 1. Customer List Page (`app/(dashboard)/customers/page.tsx`)
Server component shell. Imports mock data, passes to client components.

### 2. SmartViewTabs (`app/(dashboard)/customers/_components/SmartViewTabs.tsx`)
5 tabs/chips: All, Prospects, Top Customers, Needs Attention, Seasonal.
- Wired to URL param `?view=all|prospects|top|attention|seasonal`
- Active tab highlighted
- Mobile: horizontal scroll

### 3. CustomersDataTable (`app/(dashboard)/customers/_components/CustomersDataTable.tsx`)
Full-featured data table:
- Columns: Company, Primary Contact, Type Tags, Lifecycle Stage, Health, Last Order, Lifetime Revenue
- Global search (URL param `?q=`): searches company, contact name, email, phone
- Type tag filter chips (URL param `?tags=`)
- Lifecycle filter (URL param `?lifecycle=`)
- Sortable columns (URL params `?sort=`, `?dir=`)
- "Show Archived" toggle (URL param `?archived=true`)
- Click row → navigate to `/customers/[id]`
- Smart view filtering logic (N33):
  - Prospects: lifecycleStage === "prospect"
  - Top Customers: sorted by lifetime revenue (computed from linked quotes)
  - Needs Attention: healthStatus === "potentially-churning"
  - Seasonal: customers with mock seasonal tags
- Empty state: "No customers yet — they'll appear here when you create your first quote"
- **Mobile**: Table collapses to card list on screens < 768px. Each card shows company, primary contact, lifecycle badge, health badge, last order. Touch targets ≥ 44px.

### 4. CustomerListStatsBar (`app/(dashboard)/customers/_components/CustomerListStatsBar.tsx`)
Quick stats row at top: Total Customers, Active This Month, Total Revenue (YTD), Prospects count.
Computed from mock data. Uses `CustomerQuickStats` variant="bar".
**Mobile**: Stacks to 2x2 grid.

### 5. AddCustomerModal Enhancement (`components/features/AddCustomerModal.tsx`)
Enhance the existing modal:
- Company Name becomes REQUIRED (was optional)
- Contact Name (was "Name")
- Email OR Phone required (not both — don't force data entry)
- Add Type Tag multi-select (from starter set)
- Lifecycle auto-set: "prospect" when triggered from a context that implies lead status, "new" otherwise
- Remove the old single "Customer Type" dropdown (new/repeat/contract), replace with type tag multi-select
- Keep < 30 seconds to complete
- "Needs Details" visual indicator concept: add a subtle incomplete-data badge to customers with minimal fields

### 6. Verify Build
Run: `npx tsc --noEmit && npm run lint && npm run build`

## Design Requirements
- Philosophy: "Linear Calm + Raycast Polish + Neobrutalist Delight"
- Semantic tokens only (text-action, bg-elevated, border-border)
- Lifecycle badges: Prospect (cyan/action), New (neutral), Repeat (green/success), Contract (amber/warning)
- Health badges: Active (hidden), Potentially Churning (amber pulse), Churned (red)
- Monochrome base, status colors for meaning only
- "5-second rule": User understands the page state in 5 seconds
- All interactive elements: hover, focus-visible, active, disabled states
- Lucide icons only, consistent sizes (16/20/24px)
- Keyboard navigable, ARIA labels, 4.5:1 contrast minimum

## Commit & PR
- Commit to `session/0210-customer-list`
- Push: `but push session/0210-customer-list`
- Open PR targeting `main`: "feat: Customer List page — smart views, search, filters, stats"
- Let the human know you're done.
```

---

### Session 3: Customer Detail Page

```
Build the Customer Detail page (/customers/[id]) for the Customer Management vertical. This is the largest session — the heart of the vertical with a header, 7 tabs, and 4 modals.

## Branch Setup
Create branch: `but branch new session/0210-customer-detail`

## What to Read First
1. `docs/breadboards/customer-management-breadboard.md` — P2 (Customer Detail) ALL affordances, plus P2.2-P2.6 modals
2. `docs/strategy/customer-management-scope-definition.md` — "Customer Detail Dashboard" + all CORE feature sections (hierarchy, lifecycle, health, notes, artwork, referral) + PERIPHERAL sections (tax, addresses, stats, payment, pricing)
3. `lib/schemas/*.ts` — all schemas (just merged)
4. `lib/mock-data.ts` — full expanded mock data (just merged)
5. `components/features/LifecycleBadge.tsx` — (just merged)
6. `components/features/HealthBadge.tsx` — (just merged)
7. `components/features/TypeTagBadges.tsx` — (just merged)
8. `components/features/CustomerQuickStats.tsx` — (just merged)
9. `app/(dashboard)/quotes/[id]/page.tsx` — reference for detail page pattern
10. `app/(dashboard)/quotes/_components/QuoteDetailView.tsx` — reference for detail layout
11. `CLAUDE.md` — design system, quality checklist, mobile requirements
12. `memory/mobile-strategy.md` — mobile-specific rules for customer detail

## What to Build

### Page Shell
`app/(dashboard)/customers/[id]/page.tsx` — Server component. Reads customer ID from params, finds customer in mock data, 404 if not found.

### CustomerDetailHeader
Company name (large), primary contact (name, email click-to-copy, phone click-to-copy), lifecycle badge, health badge (only if not Active), type tag badges, quick stats row (revenue, orders, AOV, last order, referrals), action buttons: "New Quote" (primary CTA → `/quotes/new?customer={id}`), "Edit Customer" (→ EditCustomerSheet), "Archive" (→ ArchiveDialog). Breadcrumb: Dashboard > Customers > {company name}.
**Mobile**: Stats wrap to 2 rows. Action buttons stack full-width.

### CustomerTabs
Tab shell using shadcn Tabs. 7 tabs: Activity (default), Quotes, Jobs, Artwork, Contacts, Details, Notes.
**Adaptive default**: If customer lifecycle is "prospect", default to Notes tab instead of Activity (N32).
**Mobile**: Tabs become horizontal scroll.

### Activity Tab — ActivityTimeline
Reverse-chronological timeline merging: quotes (created, sent, accepted, declined), jobs (started, completed), notes. Each item has timestamp, icon, description, and link to the entity. Build from mock data by aggregating quotes/jobs/notes for this customer.

### Quotes Tab — CustomerQuotesTable
Table: Quote #, Status (use existing StatusBadge), Total, Date. Click row → `/quotes/[id]`. "Copy as New" action per row (→ `/quotes/new?from={quoteId}`). This reuses the existing quoting functionality.

### Jobs Tab — CustomerJobsTable
Table: Job #, Status, Due Date. Click row → `/jobs/[id]`. Simple display from mock jobs data.

### Artwork Tab — ArtworkGallery (`components/features/ArtworkGallery.tsx`)
This is a SHARED component — create it in `components/features/` for reuse.
- Thumbnail grid (CSS grid, responsive)
- Smart sort: volume outliers first → seasonal relevance → recent usage → alphabetical
- Per-artwork: thumbnail placeholder (colored rectangle with initials since we have no real images), name, color count, last used, total orders badge
- Hover tooltip: metadata + notes (if artwork has notes in mock data)
- Sort toggle: Smart / Alphabetical / Chronological
- "Use in New Quote" action per artwork
- Visual badges: "Top seller" (highest order count), "In season" (mock seasonal tag)
- **Mobile**: 2-column grid. Tap instead of hover for details.
- Empty state: "No artwork yet — artwork will appear here from quotes"

### Contacts Tab — ContactHierarchy
Company → Group → Contact tree view.
- Contact cards: name, role badge, email, phone, primary star indicator
- "Add Contact" button (→ AddContactSheet)
- "Add Group" button (appears when 2+ contacts exist — progressive disclosure)
- "Set as Primary" action per contact
- Simple default: most customers have 1 contact, no groups. Keep it clean.
- **Mobile**: Stack contacts vertically, full-width cards.

### Details Tab — CustomerDetailsPanel
Read-only display (edit via EditCustomerSheet):
- Billing address
- Shipping addresses (named, with default flag)
- Tax exempt status + certificate expiry + mock "Upload Certificate" placeholder
- Payment terms
- Pricing tier + discount %
- "Referred by" (link to referrer's detail page)
- "Edit" button → opens EditCustomerSheet

### Notes Tab — NotesPanel (`components/features/NotesPanel.tsx`)
This is a SHARED component — create it in `components/features/` for reuse across any entity.
Props: `entityType`, `entityId`, `notes[]`, `onAddNote`, `onTogglePin`.
- Quick-add input at top (always visible)
- Channel tag selector (phone/email/text/social/in-person) — optional
- Pinned notes section (top, visually distinct)
- All notes list (reverse chronological)
- Pin/unpin toggle per note
- Channel tag + timestamp display per note
- **Mobile**: Quick-add input stays accessible. Note cards full-width.

### Modals

**AddContactSheet** (`P2.2`): Sheet with name, email, phone, role selector, group selector (optional), "Set as Primary" checkbox. Save → adds to customer contacts (client state). Cancel → closes.

**AddGroupSheet** (`P2.3`): Sheet with group name. Save → adds to customer groups. Cancel → closes.

**EditCustomerSheet** (`P2.4`): Sheet with full profile edit: company name, type tags (multi-select), payment terms, pricing tier, discount %, tax exempt toggle, tax cert expiry, billing address, shipping addresses (add/edit/remove with named labels + default flag), "Referred by" customer selector, lifecycle override (promote to Contract). Save → updates customer (client state). Cancel → closes.

**ArchiveDialog** (`P2.5`): Confirmation dialog. "Are you sure you want to archive {company}? Archived customers are hidden from the main list but can be restored." Archive → sets isArchived=true, navigates to `/customers`. Cancel → closes.

### Invalid Customer
If customer ID not found in mock data, show "Customer not found" with link back to `/customers`.

### Verify Build
Run: `npx tsc --noEmit && npm run lint && npm run build`

## Design Requirements
Same as Session 2 plus:
- Activity timeline: use a subtle vertical line with node indicators
- Artwork gallery: this is the "aesthetic showpiece" — beautiful grid, consistent thumbnails
- Notes panel: clean list, timestamps subtle, pinned notes visually distinct with a different background
- Contact hierarchy: clean indentation or card-based layout
- All empty states must be designed (each tab has its own inviting empty state)
- Tabs keyboard navigable with proper ARIA roles

## Commit & PR
- Commit to `session/0210-customer-detail`
- Push: `but push session/0210-customer-detail`
- Open PR targeting `main`: "feat: Customer Detail page — header, 7 tabs, artwork gallery, notes, contacts"
- Let the human know you're done.
```

---

### Session 4: Quoting Interconnection

```
Enhance the existing CustomerCombobox to show lifecycle badges and richer customer context, connecting the Customer Management data to the Quoting vertical.

## Branch Setup
Create branch: `but branch new session/0210-quoting-interconnection`

## What to Read First
1. `docs/breadboards/customer-management-breadboard.md` — Step 13 (Quoting Interconnection) and the Quoting interconnection section in scope definition
2. `docs/strategy/customer-management-scope-definition.md` — "Quoting: Customer Selection (Enhanced)" interconnection section
3. `components/features/CustomerCombobox.tsx` — current implementation to enhance
4. `components/features/LifecycleBadge.tsx` — badge component to use (just merged)
5. `lib/schemas/customer.ts` — expanded schema (just merged)
6. `lib/mock-data.ts` — expanded mock data (just merged)
7. `app/(dashboard)/quotes/new/page.tsx` — quote form that uses the combobox
8. `app/(dashboard)/quotes/_components/QuoteForm.tsx` — how the combobox is wired
9. `CLAUDE.md` — coding standards

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
Also verify: navigate to `/quotes/new` — the customer combobox should still work correctly with the expanded data.

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
Run a comprehensive quality gate audit on the Customer Management vertical, then fix any issues found.

## Branch Setup
Create branch: `but branch new session/0210-customer-quality-gate`

## What to Read First
1. `CLAUDE.md` — quality checklist (the definitive checklist)
2. `.claude/skills/quality-gate/SKILL.md` — full audit protocol
3. `docs/strategy/customer-management-scope-definition.md` — acceptance criteria for every feature
4. `docs/breadboards/customer-management-breadboard.md` — verify all affordances are implemented
5. `memory/mobile-strategy.md` — mobile requirements
6. All files in `app/(dashboard)/customers/` — the built pages
7. All new files in `components/features/` — shared components

## Audit Process

### Step 1: Build Verification
Run ALL of these and report results:
- `npx tsc --noEmit` (type check)
- `npm run lint` (ESLint)
- `npm test` (Vitest — all schema tests)
- `npm run build` (production build)
Any failure = automatic audit failure. Fix before proceeding.

### Step 2: Visual Audit (per screen)
For `/customers` and `/customers/[id]`, audit these 10 categories:

1. **Visual Hierarchy**: Primary action most prominent? Status colors for meaning only?
2. **Spacing/Layout**: All Tailwind tokens? No hardcoded px? Consistent padding?
3. **Typography**: Max 3-4 sizes? Inter for UI, JetBrains Mono for code only?
4. **Color Usage**: Monochrome base? Status colors meaningful? Semantic tokens only?
5. **Interactive States**: All elements have hover, focus-visible, active, disabled?
6. **Icons**: Lucide only? Consistent sizes (16/20/24)?
7. **Motion**: Design tokens? Respects prefers-reduced-motion?
8. **Empty/Error States**: All tabs have designed empty states? 404 handled?
9. **Accessibility**: ARIA labels? 4.5:1 contrast? Keyboard navigable? Tab order logical?
10. **Density (Jobs Filter)**: Can anything be removed without losing meaning?

### Step 3: Scope Coverage Audit
Walk through every CORE feature in the scope definition and verify it has a working implementation:
- [ ] Customer List with smart views
- [ ] Customer Detail with all 7 tabs
- [ ] Company → Group → Contact hierarchy
- [ ] Lifecycle badges (all 4 stages visible in mock data)
- [ ] Health detection (churning customer visible in Needs Attention view)
- [ ] Type tags (filterable, multi-tag)
- [ ] Quick Add Customer modal
- [ ] Notes panel (add, pin, channel tags)
- [ ] Artwork gallery (smart sorted, badges)
- [ ] Referral tracking (referred-by visible)

### Step 4: Mobile Audit
Check both pages at mobile breakpoints (375px, 414px):
- [ ] Tables collapse to card lists
- [ ] Touch targets ≥ 44px
- [ ] Stats bars stack appropriately
- [ ] Tabs scroll horizontally
- [ ] Forms are full-width
- [ ] Artwork grid is 2-column
- [ ] No horizontal overflow

### Step 5: Cross-Vertical Verification
- [ ] "New Quote" from customer detail navigates correctly
- [ ] "Copy as New" from quotes tab works
- [ ] Customer combobox in quote form shows lifecycle badges
- [ ] Existing quoting pages still render correctly (no regressions)
- [ ] Dashboard still works

### Step 6: Fix Everything
Fix all failures and warnings. Group fixes by category. Commit incrementally with descriptive messages.

### Step 7: Final Build
Run all checks again: `npx tsc --noEmit && npm run lint && npm test && npm run build`
ALL must pass.

## Commit & PR
- Commit fixes to `session/0210-customer-quality-gate`
- Push: `but push session/0210-customer-quality-gate`
- Open PR: "fix: Customer Management quality gate — audit fixes and polish"
- Include the audit report (pass/warn/fail per category) in the PR description.
```

---

## Quick Reference Card

| Wave | Session | Branch Name | Trigger | Estimated Complexity |
|------|---------|-------------|---------|---------------------|
| 1 | Foundation | `session/0210-customer-foundation` | Start now | High (schemas + mock data + badges) |
| 2 | Customer List | `session/0210-customer-list` | After Wave 1 merges | High |
| 2 | Customer Detail | `session/0210-customer-detail` | After Wave 1 merges | Very High |
| 2 | Quoting Fix | `session/0210-quoting-interconnection` | After Wave 1 merges | Low-Medium |
| 3 | Quality Gate | `session/0210-customer-quality-gate` | After Wave 2 merges | Medium |

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
