# Screen Print Pro — Progress

## Current State

**Phase**: 1 — Mockup with mock data
**Last Updated**: 2026-02-11
**Status**: Quoting + Customer Management verticals built and demo-ready. Price Matrix research complete (36 features prioritized). Invoicing vertical research complete — 19 key decisions captured, ready for breadboarding and build.

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

<details><summary>Price Matrix Research (PR #45 — merged)</summary>

- 4-agent research team: industry practices, competitor analysis, integration mapping, UX patterns
- 10 competitors analyzed across 7 criteria (capabilities, satisfaction, ease, flexibility, simplicity, integration, automation)
- PrintLife baseline: 74% (26/35) — strong automation (5/5) + simplicity (5/5), weak flexibility (2/5)
- Top competitors tied at 74%: YoPrint (breakless pricing), Teesom (max flexibility), PriceIt (best integration)
- 36 features prioritized: 12 P0, 14 P1, 10 P2
- Integration architecture: pricing as centralized engine consumed by Customer, Quoting, Invoicing, Reporting, Production
- UX strategy: Simple Mode wizard (5-min setup) + Power Mode grid (TanStack Table inline editing)
- 10x differentiators: real-time margin indicators, what-if scenarios, progressive disclosure
- Research docs: `docs/research/01-industry-practices.md`, `02-competitor-analysis.md`, `03-integration-map.md`, `04-ux-patterns.md`, `price-matrix-research.md`
- For-human summary: `for_human/2026-02-10-price-matrix-research.html`
</details>

<details><summary>Invoicing Vertical Research (PR #46 — merged)</summary>

- 5-agent research team: industry practices, competitor analysis (PrintLife focus), integration architecture, UX patterns, legal/compliance
- 6 competitors analyzed: PrintLife, Printavo, shopVOX, DecoNetwork, InkSoft, GraphicsFlow
- User interview captured 19 critical business decisions
- Key decisions: single invoice with partial payments (not two invoices), Square payment processing (4Ink's existing), customer portal as separate vertical, smart deposit defaults (tier + history + contract), configurable line items (itemized vs bundled toggle), QB-matching invoice numbers
- Integration map: schema dependencies for 5 existing verticals + 4 future ones, build order (Phase 1a–1e, 19 steps)
- UX patterns: 3 screen designs (list, detail, new), 7 reusable components + 6 new, status badge tokens, user journeys
- Compliance: tax treatment (IN 7%, KY 6%), required invoice elements, 7-year retention, PCI via tokenized Square, credit memo workflow
- Research docs: `docs/spikes/invoicing-{industry-practices,competitor-analysis,integration-map,ux-patterns,compliance,decisions}.md`
- For-human summary: `for_human/2026-02-10-invoicing-vertical-research.html`
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

1. Demo Quoting + Customer Management to user (4Ink owner), collect final feedback
2. Iterate on feedback (target: 8+ rating on Clarity, Speed, Polish, Value)
3. **Invoicing vertical**: Breadboard UI from research docs, build Phase 1a (schema + mock data), then Phase 1b–1e (list, detail, quote-to-invoice, payments, customer integration)
4. **Price Matrix vertical**: Run vertical-discovery skill, breadboard UI, build Phase 1a (P0 engine + wizard + quote integration)
5. Address deferred tech debt (#15-#18) as needed

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
| `docs/research/price-matrix-research.md` | Price Matrix synthesis report (P0/P1/P2 features) |
| `for_human/2026-02-10-price-matrix-research.html` | Price Matrix research summary for humans |
| `docs/spikes/invoicing-decisions.md` | 19 invoicing decisions from user interview |
| `docs/spikes/invoicing-integration-map.md` | Invoicing schema dependencies + build order |
| `for_human/2026-02-10-invoicing-vertical-research.html` | Invoicing research summary for humans |

## Key Design Requirements

- Instant client-side pricing — never block input
- S&S-style dense color swatch grid (white text overlay, search, favorites)
- Single-page form (no multi-step wizard)
- Price override (editable grand total)
- Hybrid approval workflow (UI in Phase 1, backend in Phase 2)
- Quote statuses: Draft, Sent, Accepted, Declined, Revised
- Duplicate Quote for reuse
- Internal + customer-facing notes
