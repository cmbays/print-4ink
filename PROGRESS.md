# Screen Print Pro — Progress

## Current State

**Phase**: 1 — Mockup with mock data
**Last Updated**: 2026-02-12
**Status**: Quoting + Customer Management + Invoicing + Price Matrix verticals built and demo-ready. Price Matrix fully implemented: pricing engine, 2 editors (Screen Print + DTF), Power Grid spreadsheet, sandbox mode, cost config, tag-template mapping.

## What's Built

<details><summary>Infrastructure</summary>

- Next.js 16.1.6 scaffold (App Router, TypeScript, Turbopack)
- Tailwind v4 with design tokens in `globals.css` (`@theme inline`)
- shadcn/ui components (24 primitives)
- Fonts: Inter + JetBrains Mono via `next/font`, dark mode default
- Vitest (314 tests, 14 test files), GitHub Actions CI
- Layout shell: sidebar (7 nav links incl. Invoices) + per-page Topbar breadcrumbs + main content area
- Dashboard: summary cards, "Needs Attention", "In Progress" sections
</details>

<details><summary>Data Layer (13 Zod schemas)</summary>

- Schemas: job, quote, customer, garment, screen, color, artwork, contact, group, address, note, invoice, credit-memo
- Constants: production states, priorities, burn status, quote status, invoice status, payment methods, credit memo reasons, lifecycle, health, type tags, payment terms, pricing tiers
- Mock data: 10 customers, 13 contacts, 2 groups, 20 addresses, 21 notes, 6 jobs, 6 quotes, 5 screens, 42 colors, 5 garments, 8 artworks, 8 invoices, 11 payments, 2 credit memos
- Reverse lookup helpers: getCustomerQuotes/Jobs/Contacts/Notes/Artworks/Invoices, getInvoicePayments/CreditMemos, getQuoteInvoice
- Financial arithmetic: big.js via `lib/helpers/money.ts` (money, round2, toNumber, formatCurrency)
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

<details><summary>Price Matrix Breadboard + Interview (PR #47 — merged)</summary>

- Owner interview: 30 decisions covering pricing dimensions, customer tiers, navigation, quote integration, what-if UX, template system
- DTF gang sheet pricing research: production costs ($0.10–$0.30/sq.in), industry pricing models, 4Ink competitive positioning
- PrintLife export research: confirmed no export capability exists — pivoted to wizard-first approach, CSV import deferred to Phase 2
- Breadboard: 8 places, 167 UI affordances, 80 code affordances, 14 data stores
- Places: Pricing Hub (`/settings/pricing`), Setup Wizard (5-step modal), Tag-Template Mapping, Screen Print Matrix Editor, Side-by-Side Comparison, Cost Configuration, DTF Matrix Editor, Matrix Peek Sheet (from quotes)
- Build order: 11 steps across 4 phases with 3 parallelization windows (up to 3 concurrent agents)
  - Phase A: Schemas → Pricing Engine → Mock Data → Shared Components → Sidebar → Hub (sequential)
  - Phase B: Wizard + SP Editor + DTF Editor (3 parallel agents)
  - Phase C: Sandbox/Comparison + Power Mode Grid + Cost Config Sheet (3 parallel agents)
  - Phase D: Matrix Peek Sheet + Tag-Template Mapping (2 parallel agents)
- Key decisions: Settings-first nav (not top-level sidebar), separate matrices for SP vs DTF, tag→template customer mapping, wizard over import
- Research docs: `docs/research/05-dtf-gang-sheet-pricing.md`, `06-owner-interview-findings.md`, `printlife-data-export-research.md`
- Breadboard: `docs/breadboards/price-matrix-breadboard.md`
- For-human summary: `for_human/2026-02-11-price-matrix-breadboard.html`
</details>

<details><summary>Price Matrix Build (PR #49 — merged)</summary>

- 5-phase build: Foundation → Editors → Advanced Features → Integration → Polish
- 29 files changed, 8,552 lines added, 10 commits
- **Schemas**: `price-matrix.ts` (161 lines), `dtf-pricing.ts` (107 lines), `tag-template-mapping.ts` (23 lines)
- **Pricing Engine**: `lib/pricing-engine.ts` (568 lines) — pure functions for SP + DTF price calculations, margin computation, cost breakdowns
- **Pricing Hub** (`/settings/pricing`) — Template cards with service type tabs (Screen Print / DTF), search, create new template CTA
- **Setup Wizard** — 4-step guided flow with industry defaults pre-filled (12/24/48/72/144+ tiers, $25/screen, $0.50/color-hit)
- **Screen Print Editor** (`/settings/pricing/screen-print/[id]`) — Simple Mode with 5 sections: ColorPricingGrid, QuantityTierEditor, LocationUpchargeEditor, GarmentTypePricingEditor, SetupFeeEditor. Real-time margin indicators (green/yellow/red)
- **DTF Editor** (`/settings/pricing/dtf/[id]`) — DTFSheetTierEditor + DTFPricingCalculator with sheet-size tiers, film types, customer discounts, rush fees
- **Power Grid** — TanStack Table spreadsheet with `useSpreadsheetEditor` hook (777 lines): inline cell editing, keyboard navigation (arrow keys, Tab, Enter, Escape), cell selection. React Context + stable column defs architecture to prevent DOM recreation
- **Sandbox Mode** — Toggle for experimental pricing. ComparisonView modal shows side-by-side diff of current vs. proposed values
- **Cost Configuration Sheet** — Slide-in panel for garment/ink/overhead costs feeding real-time margin calculations
- **Tag-Template Mapper** — Map customer type tags to pricing templates for auto-application during quoting
- **Matrix Peek Sheet** — Read-only pricing preview from Quote Detail page
- **big.js migration**: All monetary calculations use `lib/helpers/money.ts` wrapper
- **Dependency added**: `@tanstack/react-table`
- Key learnings: TanStack column def stability (Context pattern), rAF race conditions, skipNextBlur pattern, parallel agent builds
- CodeRabbit: 2 review rounds addressed (money helper, schema validation, a11y, maxColors consistency, input validation)
- For-human summary: `for_human/2026-02-12-price-matrix-build.html`
</details>

<details><summary>Invoicing Vertical Build (PRs #48, #50 — merged)</summary>

- Breadboard (PR #48): 9 places, 99 UI affordances, 44 code affordances, 13-step build order
- Full build (PR #50): 30 new files, 8 modified, 314 tests passing, 10/10 quality gate
- Schemas: `invoice.ts` (5 status enums, 6 sub-schemas, refinement invariant), `credit-memo.ts` (6 reasons, bounded totals)
- Helpers: `invoice-utils.ts` (status state machine, overdue computation, financial calculators, smart deposit, due date, quote→invoice conversion)
- Financial precision: all monetary calculations use big.js via `lib/helpers/money.ts` — zero floating-point
- Invoices List (`/invoices`) — StatsBar (4 cards), SmartViewTabs (5 views), DataTable with sort/search/batch ops, desktop+mobile, OverdueBadge with pulse
- Invoice Form (`/invoices/new`, `/invoices/[id]/edit`) — Customer selection, line items, pricing summary, deposit section, payment terms, review & send sheet
- Invoice Detail (`/invoices/[id]`) — Status-aware actions, payment ledger with running totals, reminder timeline, change diff panel, audit log, credit memo display
- Overlays: RecordPaymentSheet (amount validation, auto-transitions), SendReminderModal (email preview), VoidInvoiceDialog (destructive + permanent), CreateCreditMemoModal (line-item selection, bounded by total)
- Edit guard: non-draft invoices redirect to detail view
- Integration: Sidebar nav (Receipt icon), Customer detail Invoices tab, Quote "Create Invoice" button (accepted only)
- Quality gate: 10/10 categories pass (visual hierarchy, spacing, typography, color, interactive states, icons, motion, empty/error states, accessibility, density)
- CodeRabbit review: all 7 actionable issues + key nitpicks addressed (timezone-safe dates, shared formatCurrency, motion-reduce, aria labels, big.js version sync)
- For-human docs: `for_human/2026-02-11-invoicing-breadboard.html`, `for_human/2026-02-11-invoicing-build.html`
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
- [ ] **#18** — Extract shared formatCurrency/formatDate to lib/utils (invoicing done via `lib/helpers/money.ts`, quotes/customers still have local copies)

## Next Actions

1. Demo all 4 verticals (Quoting + Customer Management + Invoicing + Price Matrix) to user (4Ink owner), collect feedback
2. Iterate on feedback (target: 8+ rating on Clarity, Speed, Polish, Value)
3. Wire Matrix Peek Sheet into Quote Detail page for full pricing integration
4. Connect Tag-Template Mapper to Customer Management for auto-apply during quoting
5. Full 15-dimension design audit on Price Matrix screens
6. Address deferred tech debt (#15-#18) as needed

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
| `docs/breadboards/price-matrix-breadboard.md` | Price Matrix breadboard (8 places, 167 affordances, build order) |
| `docs/research/06-owner-interview-findings.md` | Price Matrix owner interview decisions (30 findings) |
| `for_human/2026-02-10-price-matrix-research.html` | Price Matrix research summary for humans |
| `for_human/2026-02-11-price-matrix-breadboard.html` | Price Matrix breadboard summary for humans |
| `for_human/2026-02-12-price-matrix-build.html` | Price Matrix build summary — architecture, learnings, useSpreadsheetEditor guide |
| `docs/spikes/invoicing-decisions.md` | 19 invoicing decisions from user interview |
| `docs/spikes/invoicing-integration-map.md` | Invoicing schema dependencies + build order |
| `docs/breadboards/invoicing-breadboard.md` | Invoicing breadboard (9 places, 99 UI + 44 code affordances) |
| `for_human/2026-02-10-invoicing-vertical-research.html` | Invoicing research summary for humans |
| `for_human/2026-02-11-invoicing-breadboard.html` | Invoicing breadboard summary for humans |
| `for_human/2026-02-11-invoicing-build.html` | Invoicing build summary for humans |

## Key Design Requirements

- Instant client-side pricing — never block input
- S&S-style dense color swatch grid (white text overlay, search, favorites)
- Single-page form (no multi-step wizard)
- Price override (editable grand total)
- Hybrid approval workflow (UI in Phase 1, backend in Phase 2)
- Quote statuses: Draft, Sent, Accepted, Declined, Revised
- Duplicate Quote for reuse
- Internal + customer-facing notes
