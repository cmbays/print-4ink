# Screen Print Pro — Progress

## Current State

**Phase**: 1 — Mockup with mock data
**Last Updated**: 2026-02-11
**Status**: Both verticals (Quoting + Customer Management) built, polished, and UI-aligned. Ready for demo.

## What's Built

<details><summary>Infrastructure</summary>

- Next.js 16.1.6 scaffold (App Router, TypeScript, Turbopack)
- Tailwind v4 with design tokens in `globals.css` (`@theme inline`)
- shadcn/ui components (24 primitives)
- Fonts: Inter + JetBrains Mono via `next/font`, dark mode default
- Vitest (266 tests, 12 test files), GitHub Actions CI
- Layout shell: sidebar (6 nav links) + per-page Topbar breadcrumbs + main content area
- Dashboard: summary cards, "Needs Attention", "In Progress" sections
</details>

<details><summary>Data Layer (11 Zod schemas)</summary>

- Schemas: job, quote, customer, garment, screen, color, artwork, contact, group, address, note
- Constants: production states, priorities, burn status, quote status, lifecycle, health, type tags, payment terms, pricing tiers
- Mock data: 10 customers, 13 contacts, 2 groups, 20 addresses, 21 notes, 6 jobs, 6 quotes, 5 screens, 42 colors, 5 garments, 8 artworks
- Reverse lookup helpers: getCustomerQuotes/Jobs/Contacts/Notes/Artworks
</details>

<details><summary>Quoting Vertical (PRs #13, #14, #20, #44 — all merged)</summary>

- Quotes List (`/quotes`) — DataTable with ColumnHeaderMenu sort + inline status filters, search, archive toggle, clickable rows
- New Quote Form (`/quotes/new`) — Single-page: CustomerCombobox, LineItemRows, ColorSwatchPicker, PricingSummary, ArtworkLibrary, CollapsibleSections, ReviewSheet
- Quote Detail (`/quotes/[id]`) — Read-only view with pricing breakdown, notes, actions
- Reusable: StatusBadge, EmailPreviewModal, ArtworkUploadModal, ArtworkAssignmentPicker, ArtworkPreview, QuoteDetailView, QuoteActions
- Sticky header, tooltip system, pricing formula display, per-location decoration fees, quote archiving (`isArchived` schema field)
</details>

<details><summary>Customer Management (PRs #24, #33, #35, #44 — all merged)</summary>

- Customer List (`/customers`) — SmartViewTabs, CustomersDataTable (desktop + mobile), StatsBar, ColumnHeaderMenu (sort + inline filters)
- Customer Detail (`/customers/[id]`) — 7 tabs: Overview, Contacts, Groups, Addresses, Notes, Quotes, Activity
- Badge components: LifecycleBadge, HealthBadge, TypeTagBadges, CustomerQuickStats
- AddCustomerModal (Save & View Details with generated UUID), AddContactSheet (custom roles), AddGroupSheet
- ActivityTimeline with interactive quotes/notes links
- Zod enum-derived sort/filter types with `.catch()` fallback
</details>

<details><summary>Cross-Vertical UI Consistency (PR #44 — merged)</summary>

- Aligned Quotes and Customers list pages: same column patterns, sticky headers, inline search, icon-only archive toggle with tooltip
- Moved Topbar from shared layout to per-page for breadcrumb customization ("Dashboard" root label)
- Quotes: removed action menu column, reordered columns (Total far right), replaced status tabs with ColumnHeaderMenu filters
- Added quote archive support: `isArchived` schema field, URL param toggle, "Archived" badge
- Fixed `updateParam` truthy check, removed `role="link"` from table rows (accessibility)
</details>

<details><summary>Agent & Skill Infrastructure</summary>

- 5 agents: frontend-builder, requirements-interrogator, design-auditor, feature-strategist, doc-sync
- 8 skills: vertical-discovery, breadboarding, screen-builder, quality-gate, pre-build-interrogator, design-audit, feature-strategy, doc-sync
</details>

## Deferred Tech Debt (GitHub Issues)

- [ ] **#15** — Migrate forms to React Hook Form + Zod
- [ ] **#16** — Replace local LineItemRow interfaces with schema-derived types
- [ ] **#17** — Sync garment category filter with URL query params
- [ ] **#18** — Extract shared formatCurrency/formatDate to lib/utils

## Next Actions

1. Demo both verticals to user (4Ink owner), collect final feedback
2. Iterate on feedback (target: 8+ rating on Clarity, Speed, Polish, Value)
3. Address deferred tech debt (#15-#18) as needed
4. Move to Invoicing vertical

## Document Map

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | AI operating rules, design system, coding standards |
| `PROGRESS.md` | This file — current state and what's next |
| `docs/HISTORY.md` | Archived session logs and completed feature details |
| `docs/AGENTS.md` | Agent registry, orchestration patterns |
| `docs/TECH_STACK.md` | Tool choices, versions, decision context |
| `docs/PRD.md` | Features, scope, acceptance criteria |
| `docs/APP_FLOW.md` | Screens, routes, navigation paths |
| `.claude/plans/vertical-by-vertical-strategy.md` | Master strategy (methodology, timeline, success criteria) |
| `docs/strategy/quoting-scope-definition.md` | Quoting scope + acceptance criteria |
| `docs/strategy/screen-print-pro-journey-quoting.md` | Improved journey design |
| `docs/strategy/STRATEGY_README.md` | Index of all strategy docs |

## Key Design Requirements

- Instant client-side pricing — never block input
- S&S-style dense color swatch grid (white text overlay, search, favorites)
- Single-page form (no multi-step wizard)
- Price override (editable grand total)
- Hybrid approval workflow (UI in Phase 1, backend in Phase 2)
- Quote statuses: Draft, Sent, Accepted, Declined, Revised
- Duplicate Quote for reuse
- Internal + customer-facing notes
