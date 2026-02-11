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
Create these new schema files following Zod-first patterns (see existing schemas for format):
- `contact.ts` — id, name, email?, phone?, role (ordering|art-approver|billing|owner|other), isPrimary, notes?, groupId?
- `address.ts` — id, label, street, street2?, city, state, zip, country (default "US"), isDefault, type (billing|shipping)
- `group.ts` — id, name, customerId
- `note.ts` — id, content, createdAt, createdBy, isPinned, channel (phone|email|text|social|in-person|null), entityType (customer|quote|artwork|job), entityId

**Subagent: Expand Customer Schema** — rewrite `lib/schemas/customer.ts`
Rewrite from 7 fields to the full schema defined in the scope definition's "Expanded Customer Schema" section. Key fields: company, lifecycleStage, healthStatus, isArchived, typeTags[], contacts[], groups[], billingAddress?, shippingAddresses[], paymentTerms, pricingTier, discountPercentage?, taxExempt, taxExemptCertExpiry?, referredByCustomerId?, createdAt, updatedAt.
**CRITICAL — Backwards Compatibility**: Keep `name` as a top-level convenience field (= primary contact name) alongside `contacts[]`.

**Subagent: Expand Constants** — edit `lib/constants.ts`
Add ALL new label/color maps: LIFECYCLE_STAGE_LABELS/COLORS, HEALTH_STATUS_LABELS/COLORS, CUSTOMER_TYPE_TAG_LABELS/COLORS, CONTACT_ROLE_LABELS, PAYMENT_TERMS_LABELS, PRICING_TIER_LABELS, NOTE_CHANNEL_LABELS.

### Sequential Group 2 (after Group 1 completes — depends on schemas):

**Subagent: Mock Data** — expand `lib/mock-data.ts`
Create 10 customers with full contacts, addresses, lifecycle stages, health statuses, type tags, referral relationships, and notes. Export new arrays: contacts, customerGroups, customerNotes, customerAddresses.

**Subagent: Badge Components** — create 4 files in `components/features/`
Build LifecycleBadge.tsx, HealthBadge.tsx, TypeTagBadges.tsx, CustomerQuickStats.tsx.

### Sequential Group 3 (after Group 2 — depends on mock data):

**Subagent: Tests** — create/update files in `lib/schemas/__tests__/`
Update customer.test.ts, create contact/address/group/note tests, update mock-data.test.ts.

## Step 3: Verify Build (YOU do this)
Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
ALL must pass before committing.

## Step 4: Commit & PR
- Commit to `session/0210-customer-foundation`
- Push: `but push session/0210-customer-foundation`
- Open PR: Target `main`, title: "feat: Customer Management foundation — schemas, mock data, shared components"
- Let the human know you're done so they can merge.

## Quality Standards
- Zod-first types (no separate interfaces)
- Semantic design tokens only (text-action, not raw Tailwind palette colors)
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

````
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
Build the SmartViewTabs component at `app/(dashboard)/customers/_components/SmartViewTabs.tsx`.
Read `CLAUDE.md` (design system section only) and `lib/constants.ts` (for lifecycle stage constants).
Requirements: 5 tabs/chips (All, Prospects, Top Customers, Needs Attention, Seasonal). Wired to URL param `?view=`. Active tab highlighted. Mobile: horizontal scroll. "use client". Semantic tokens only. ARIA tablist/tab roles. Keyboard navigable.

**Subagent B — CustomersDataTable** (the largest component):
Build the CustomersDataTable component at `app/(dashboard)/customers/_components/CustomersDataTable.tsx`.
Read `CLAUDE.md`, `app/(dashboard)/quotes/_components/QuotesDataTable.tsx` (reference pattern), `lib/schemas/customer.ts`, `lib/constants.ts`, `components/features/LifecycleBadge.tsx`, `HealthBadge.tsx`, `TypeTagBadges.tsx`.
Requirements: Props `customers: Customer[]`, `view: string`. Columns: Company, Primary Contact, Type Tags, Lifecycle, Health, Last Order, Revenue. Global search (`?q=`), tag filter chips (`?tags=`), lifecycle filter (`?lifecycle=`), sortable columns (`?sort=`, `?dir=`), archived toggle (`?archived=true`). Row click → `/customers/[id]`. Smart view filtering. Mobile: card list < 768px. Empty state.

**Subagent C — CustomerListStatsBar**:
Build at `app/(dashboard)/customers/_components/CustomerListStatsBar.tsx`.
Read `CLAUDE.md`, `components/features/CustomerQuickStats.tsx`, `lib/schemas/customer.ts`.
Requirements: Props `customers: Customer[]`. Compute: Total, Active, Revenue YTD, Prospects. Use CustomerQuickStats variant="bar". Mobile: 2x2 grid.

**Subagent D — AddCustomerModal Enhancement**:
Enhance existing `components/features/AddCustomerModal.tsx`.
Read the current file, `CLAUDE.md`, `lib/constants.ts`, `lib/schemas/customer.ts`.
Changes: Company REQUIRED, rename "Name" to "Contact Name", email OR phone required, type tag multi-select (replace old dropdown), `lifecycleStage` prop (default "new", "prospect" when passed). Keep < 30 seconds to complete.

## Step 4: Integrate (YOU do this)
After all 4 subagents complete:
1. Review each file for consistency
2. Wire them into page.tsx
3. Fix any TypeScript errors from mismatched interfaces

## Step 5: Verify Build (YOU do this)
Run: `npx tsc --noEmit && npm run lint && npm run build`
ALL must pass. Fix small issues yourself.

## Step 6: Commit & PR
- Commit to `session/0210-customer-list`
- Push: `but push session/0210-customer-list`
- Open PR targeting `main`: "feat: Customer List page — smart views, search, filters, stats"
- Let the human know you're done.
````

---

### Session 3: Customer Detail Page (Team Strategy)

````
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
- Task 1: "Build simple tabs: Activity, Quotes, Jobs"
- Task 2: "Build complex tabs: Artwork Gallery, Contact Hierarchy"
- Task 3: "Build Notes, Details, and all Modals"

**Teammate "tabs-simple"** — Activity, Quotes, Jobs tabs:
Read `CLAUDE.md` (design system), `lib/schemas/customer.ts`, `lib/schemas/artwork.ts`, `lib/mock-data.ts`, `components/features/StatusBadge.tsx`.
Build in `app/(dashboard)/customers/[id]/_components/`:
- ActivityTimeline.tsx: Reverse-chronological timeline merging quotes/jobs/notes. Vertical line with node indicators. Empty state.
- CustomerQuotesTable.tsx: Table with Quote #, Status, Total, Date. "Copy as New" action. Empty state.
- CustomerJobsTable.tsx: Table with Job #, Status, Due Date. Empty state.
All: "use client", semantic tokens, Lucide icons, mobile card lists, ARIA labels.

**Teammate "tabs-complex"** — Artwork Gallery + Contact Hierarchy:
Read `CLAUDE.md`, `lib/schemas/customer.ts`, `lib/schemas/artwork.ts`, `lib/mock-data.ts`, `lib/constants.ts`.
Build:
- `components/features/ArtworkGallery.tsx` (SHARED): CSS grid thumbnails, sort toggle (Smart/Alpha/Chrono), "Use in New Quote", badges ("Top seller", "In season"). The aesthetic showpiece. Mobile: 2-col.
- `app/(dashboard)/customers/[id]/_components/ContactHierarchy.tsx`: Company → Group → Contact tree. Role badges, primary star, Add Contact/Group buttons. Mobile: stacked cards.

**Teammate "notes-modals"** — Notes, Details, and all Modals:
Read `CLAUDE.md`, `lib/schemas/customer.ts`, `lib/schemas/note.ts`, `lib/mock-data.ts`, `lib/constants.ts`, `components/ui/sheet.tsx`, `components/ui/dialog.tsx`.
Build:
- `components/features/NotesPanel.tsx` (SHARED): Quick-add, pinned section, channel tags, pin toggle.
- `app/(dashboard)/customers/[id]/_components/CustomerDetailsPanel.tsx`: Read-only display of all customer fields.
- `app/(dashboard)/customers/[id]/_components/AddContactSheet.tsx`: Name, email, phone, role, group, primary.
- `app/(dashboard)/customers/[id]/_components/AddGroupSheet.tsx`: Group name.
- `app/(dashboard)/customers/[id]/_components/EditCustomerSheet.tsx`: Full profile edit with sections.
- `app/(dashboard)/customers/[id]/_components/ArchiveDialog.tsx`: Confirmation dialog.

## Step 4: Integrate (YOU do this, after all teammates finish)
1. Wire tab content into CustomerTabs.tsx
2. Wire modal state: header → EditCustomerSheet/ArchiveDialog, contacts → AddContactSheet/AddGroupSheet
3. Fix TypeScript errors from interface mismatches

## Step 5: Verify Build (YOU do this)
Run: `npx tsc --noEmit && npm run lint && npm run build`

## Step 6: Shutdown Team
Send shutdown_request to all teammates. Then TeamDelete.

## Step 7: Commit & PR
- Commit to `session/0210-customer-detail`
- Push: `but push session/0210-customer-detail`
- Open PR targeting `main`: "feat: Customer Detail page — header, 7 tabs, artwork gallery, notes, contacts"
- Let the human know you're done.
````

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

````
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
Audit `/customers` page. Read all files in `app/(dashboard)/customers/` plus `CLAUDE.md` quality checklist. Check 10 categories (Visual Hierarchy, Spacing, Typography, Color, Interactive States, Icons, Motion, Empty States, Accessibility, Density) — PASS/WARN/FAIL each. Also check mobile: card list collapse, touch targets, stats stacking, tab scroll, no overflow.

**Subagent B — Visual Audit: Customer Detail**:
Audit `/customers/[id]` page. Read all files in `app/(dashboard)/customers/[id]/` plus `components/features/ArtworkGallery.tsx`, `NotesPanel.tsx`, `CLAUDE.md`. Same 10 categories. Also check: all 7 tabs have empty states, timeline treatment, gallery aesthetics, notes distinction, modal forms, 404 page. Mobile checks for all sections.

**Subagent C — Scope Coverage Audit**:
Read `docs/strategy/customer-management-scope-definition.md` and `docs/breadboards/customer-management-breadboard.md`. Verify every CORE feature is IMPLEMENTED/PARTIAL/MISSING: smart views, 7 tabs, contact hierarchy, lifecycle badges, health detection, type tags, add customer modal, notes panel, artwork gallery, referral tracking.

**Subagent D — Cross-Vertical Verification**:
Read all quoting files and dashboard. Verify: CustomerCombobox renders, lifecycle badges show, quote detail pages work, dashboard works, no broken imports. Check navigation links: "New Quote", "Copy as New", "View Customer".

## Step 3: Aggregate Findings (YOU do this)
Collect all 4 reports. Summarize PASS/WARN/FAIL counts. Prioritize fixes (FAIL first).

## Step 4: Fix Everything (YOU do this)
Fix all FAILs and WARNs. Minimal, targeted edits.

## Step 5: Final Build (YOU do this)
Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
ALL must pass.

## Step 6: Commit & PR
- Commit to `session/0210-customer-quality-gate`
- Push: `but push session/0210-customer-quality-gate`
- Open PR: "fix: Customer Management quality gate — audit fixes and polish"
- Include audit report in PR description.
- Let the human know you're done.
````

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
