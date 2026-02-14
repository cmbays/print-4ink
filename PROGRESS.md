# Screen Print Pro — Progress

## Current State

**Phase**: 1 — Mockup with mock data
**Last Updated**: 2026-02-14
**Status**: 5 verticals built and demo-ready (Quoting, Customer Management, Invoicing, Price Matrix, Jobs). Mobile Optimization vertical registered and research phase complete. Knowledge base on Astro 5.3 with 33 session docs. PM foundation established (Shape Up methodology, ROADMAP.md, cool-down skill, GitHub label taxonomy).

## What's Built

<details><summary>Infrastructure</summary>

- Next.js 16.1.6 scaffold (App Router, TypeScript, Turbopack)
- Tailwind v4 with design tokens in `globals.css` (`@theme inline`)
- shadcn/ui components (24 primitives)
- Fonts: Inter + JetBrains Mono via `next/font`, dark mode default
- Vitest (414 tests, 17 test files), GitHub Actions CI
- Layout shell: sidebar (8 nav links incl. Jobs + Invoices) + per-page Topbar breadcrumbs + main content area
- Dashboard: summary cards, "Needs Attention", "In Progress" sections
</details>

<details><summary>Data Layer (15 Zod schemas)</summary>

- Schemas: job, quote, customer, garment, screen, color, artwork, contact, group, address, note, invoice, credit-memo, board-card, scratch-note
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
</details>

<details><summary>Jobs Vertical (PRs #58, #64, #77 — all merged)</summary>

- Discovery: 10-competitor analysis, user interviews, friction mapping, journey design
- Breadboard: 14 places, 126 UI affordances, 31 components, 5-wave build order
- **Schemas**: `board-card.ts` (JobCard, QuoteCard, ScratchNoteCard), `scratch-note.ts`
- **Helpers**: `job-utils.ts` (capacity summary, risk level, task progress, filtered cards), `board-projections.ts` (domain→view model), `board-dnd.ts` (drag ID parsing, droppable parsing)
- **Jobs Board** (`/jobs/board`) — Unified Kanban with 3 card types (jobs, quotes, scratch notes), dnd-kit drag-and-drop, BoardFilterBar (search + service type + priority + section toggles), capacity summary strip, lane glow animations
- **Jobs List** (`/jobs`) — DataTable with sort/search/status filter, view toggle to board, desktop+mobile
- **Job Detail** (`/jobs/[id]`) — Command center: status timeline, task checklist, print locations, garments, notes feed, customer info, related quote link
- **Card components**: JobBoardCard (task progress bar, risk-colored dates, invoice status, rush indicator), QuoteBoardCard (status badge, service type, notes tooltip), ScratchNoteCard (inline edit, create quote CTA)
- **Reusable**: TaskProgressBar, ServiceTypeBadge, BoardFilterBar, DraggableCard, DroppableLane
- Polish pass (PR #64): extracted pure functions from board page, DRY formatRelativeTime, structuredClone, CSS spring variables, accessibility (ARIA drag-drop, reduced motion), 100 new tests
- CodeRabbit fixes (PR #77): Tailwind token standardization, parseDragId null safety, UTC date fix, touch-none mobile, motion-safe animation gate
- GitHub issues created: #70-#76 (Zod-derived props, board extraction, accessibility, test coverage)
</details>

<details><summary>Knowledge Base — Astro Migration (PR #62 — merged)</summary>

- Replaced `for_human/` (25k lines of HTML/JS generator) with `knowledge-base/` powered by Astro 5.3
- 30 Markdown session docs with Zod-validated YAML frontmatter (build-time schema enforcement)
- 8 Astro components: Sidebar, DocCard, Pipeline, PhaseFilter, VerticalHealth, WorkflowChain, GaryQuestion, DecisionRecord
- 6 page templates generating 51 static pages: index, session detail, vertical overview, vertical/stage, gary-tracker, decisions
- Pagefind full-text search with highlighted snippets, sub-results, and tag facet filters
- Client-side filtering: vertical, phase, status filters with URL state sync
- Cross-vertical badges, pipeline stepper, workflow chains (auto-computed)
- Dark theme matching project design tokens (Niji palette)
- CodeRabbit review: 8 actionable issues fixed, remaining nitpicks tracked in #63
- Deleted: 43 HTML files, 1445-line generator script
</details>

<details><summary>Agent & Skill Infrastructure</summary>

- 5 agents: frontend-builder, requirements-interrogator, design-auditor, feature-strategist, doc-sync
- 9 skills: vertical-discovery, breadboarding, screen-builder, quality-gate, pre-build-interrogator, design-audit, feature-strategy, doc-sync, cool-down
</details>

<details><summary>Mobile Optimization Research (PR #90 — merged)</summary>

- **Vertical registered**: `mobile-optimization` slug added to KB schema, all vertical label maps, sidebar, CLAUDE.md
- **4-agent parallel research team**: Mobile UX best practices, competitor mobile landscape, current app audit, consumer mobile needs
- **Competitive analysis**: 6 direct competitors (Printavo, InkSoft, DecoNetwork, ShopVOX, Teesom, YoPrint) + 3 adjacent benchmarks (Jobber, ServiceTitan, Katana)
- **Key finding**: No screen print management tool has a working mobile experience. Printavo's native app doesn't reliably load. All others are basic responsive web. Biggest competitive gap in the market.
- **Journey map**: 4 user journeys with time metrics — morning status check (competitor: 45-90s → target: 5-10s), customer lookup, quick quote, status update
- **Scope definition**: 8 CORE features (Phase 1), 5 PERIPHERAL (Phase 2 PWA), 4 INTERCONNECTIONS, 18-step build order (~30-40 hours across 4 sprints)
- **CORE Phase 1**: Bottom tab bar navigation, responsive dashboard, table→card conversion, touch-friendly elements, mobile forms, Kanban mobile adaptation, detail view layouts, dialog/modal sizing
- **PERIPHERAL Phase 2**: PWA install + offline shell, push notifications, photo capture, mobile quoting calculator, swipe gestures
- **Mobile maturity roadmap**: Responsive web (Phase 1) → PWA (Phase 2) → Native app via React Native/Expo (Phase 3, when scale justifies)
- **Design inspiration**: Jobber (field service) not Printavo — adjacent industries solved B2B mobile years ago
- **10 interview questions for Gary** prepared, 3 tracked as Gary Questions in KB
- Research docs: `docs/competitive-analysis/mobile-optimization-competitive-analysis.md`, `mobile-optimization-journey-map.md`, `docs/strategy/mobile-optimization-improved-journey.md`, `mobile-optimization-scope-definition.md`
- KB session docs: `2026-02-14-mobile-optimization-kickoff.md`, `2026-02-14-mobile-optimization-research.md`
</details>

<details><summary>PM Foundation (PR #91 — merged)</summary>

- **Methodology**: Shape Up adapted for solo-dev-with-AI (Shaping → Betting → Building → Cool-down)
- **ROADMAP.md**: New canonical strategic planning document — vision, phases, vertical inventory, current bets, forward planning, information hierarchy
- **Cool-down skill**: 5-step cycle retrospective (Harvest → Synthesize → Shape Candidates → Update Artifacts → Present). Future: multi-team competitive variant.
- **GitHub label taxonomy**: 28 labels across 5 dimensions — vertical/* (9), type/* (7), priority/* (4), source/* (5), phase/* (3)
- **GitHub issues #80-89**: Tooling backlog — hookify, firecrawl integration, plugin cleanup, cool-down buildout, backend horizontal research, gh dash, Sentry, stale docs, code review workflow, vertical BRIEFs
- **Plugin cleanup**: Removed supabase-toolkit (keep official supabase) and project-management-suite (Linear-focused, not needed)
- **Design doc**: `docs/plans/2026-02-14-pm-foundation-design.md`
- Key decisions: GitHub Issues over Linear (already in workflow, less lock-in), 4-layer information hierarchy (ROADMAP → BRIEFs → Issues → KB), horizontal backend foundation before vertical backends in Phase 2
</details>

## Deferred Tech Debt (GitHub Issues)

- [ ] **#15** — Migrate forms to React Hook Form + Zod
- [ ] **#16** — Replace local LineItemRow interfaces with schema-derived types
- [ ] **#17** — Sync garment category filter with URL query params
- [ ] **#18** — Extract shared formatCurrency/formatDate to lib/utils (invoicing done via `lib/helpers/money.ts`, quotes/customers still have local copies)
- [ ] **#63** — KB: Remaining CodeRabbit review feedback (a11y, code quality, markdown lint, CI astro sync)
- [ ] **#70** — Derive JobBoardCardProps from Zod schema instead of explicit interface
- [ ] **#71** — Extract board lane config to constants
- [ ] **#72** — Add Storybook stories for board card components
- [ ] **#73** — Add keyboard-only drag-and-drop for board accessibility
- [ ] **#74** — Consolidate card type rendering in board page
- [ ] **#75** — Extract board page into smaller sub-components
- [ ] **#76** — Unify date formatting functions across codebase
- [ ] **#78** — Rename (dashboard) route group to avoid confusion with /dashboard page

## Tooling & Process Backlog (GitHub Issues)

- [ ] **#80** — Configure hookify to reduce permission fatigue (priority/now)
- [ ] **#81** — Integrate firecrawl into research/discovery skills
- [ ] **#83** — Build full cool-down skill implementation
- [ ] **#84** — Research: Backend horizontal foundation for Phase 2
- [ ] **#85** — Set up gh dash filters for vertical-based views
- [ ] **#86** — Activate Sentry error monitoring (Phase 2)
- [ ] **#87** — Update stale IMPLEMENTATION_PLAN.md (priority/now)
- [ ] **#88** — Integrate coderabbit/pr-review-toolkit into PR workflow
- [ ] **#89** — Create vertical BRIEF template + first BRIEF for quoting

## Next Actions

1. **Mobile Optimization — Interview Gary** — 10 questions prepared in scope definition, validate mobile usage assumptions
2. **Mobile Optimization — Breadboarding** — Map UI affordances for bottom tab bar, card components, mobile navigation shell
3. **Mobile Optimization — Build Phase 1** — Bottom tab bar → card list views → dashboard → forms → Kanban → detail views (~30-40 hours, 4 sprints)
4. **Configure hookify** (#80) — reduce permission fatigue across all sessions
5. **Update IMPLEMENTATION_PLAN.md** (#87) — plan is stale, shows Step 0 complete when 5 verticals are built
6. Demo all 5 verticals to Gary (4Ink owner), collect feedback
7. Build remaining verticals: Screen Room (`/screens`), Garment Catalog (`/garments`)
8. Create vertical BRIEFs (#89) — enables cool-down skill and structured feedback capture
9. Run first cool-down cycle to shape Phase 2 bets
10. Address deferred tech debt (#15-#18, #70-#78) as needed

## Document Map

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | AI operating rules, design system, coding standards |
| `docs/ROADMAP.md` | Vision, phases, bets, forward planning (Shape Up) |
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
| `docs/spikes/invoicing-decisions.md` | 19 invoicing decisions from user interview |
| `docs/spikes/invoicing-integration-map.md` | Invoicing schema dependencies + build order |
| `docs/breadboards/invoicing-breadboard.md` | Invoicing breadboard (9 places, 99 UI + 44 code affordances) |
| `docs/competitive-analysis/mobile-optimization-competitive-analysis.md` | Mobile competitor landscape (6 competitors + 3 benchmarks) |
| `docs/competitive-analysis/mobile-optimization-journey-map.md` | Mobile user journeys with time metrics |
| `docs/strategy/mobile-optimization-improved-journey.md` | Mobile experience design + component architecture |
| `docs/strategy/mobile-optimization-scope-definition.md` | Mobile CORE/PERIPHERAL/INTERCONNECTIONS + build order |
| `knowledge-base/src/content/sessions/` | 33 Markdown session docs (Astro KB, replaces `for_human/`) |

## Key Design Requirements

- Instant client-side pricing — never block input
- S&S-style dense color swatch grid (white text overlay, search, favorites)
- Single-page form (no multi-step wizard)
- Price override (editable grand total)
- Hybrid approval workflow (UI in Phase 1, backend in Phase 2)
- Quote statuses: Draft, Sent, Accepted, Declined, Revised
- Duplicate Quote for reuse
- Internal + customer-facing notes
