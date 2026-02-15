# Screen Print Pro — Progress

## Current State

**Phase**: 1 — Mockup with mock data
**Last Updated**: 2026-02-15
**Status**: 7 verticals built and demo-ready (Quoting, Customer Management, Invoicing, Price Matrix, Jobs, Garments, Mobile Optimization). **Project configs centralized** — verticals, stages, and tags consolidated from 7+ duplicated locations into 3 canonical JSON files at `config/` (PR #195, closes #190). All KB components, pages, Zod schema, `work.sh`, and CLAUDE.md import from config. 4 code dedup fixes (sidebar nav, StatusBadge, BoardFilterBar, SetupWizard). **Mobile polish complete** — MobileFilterSheet integrated on all 4 list views, customer tab grouping, scroll-to-error, 529 tests across 26 files (PR #167, closes #151-#156). **Mobile pricing fully responsive** — pricing list (PR #175) and screen-print editor (PR #174) mobile-adapted with MobileToolsSheet drill-down, sticky columns, BottomActionBar. Screen Intelligence Integration merged (PR #115). Garment Mockup Engine fully designed, breadboarded, and planned (16-task TDD plan ready for execution). Garments vertical breadboard consolidated (PR #173). Knowledge base on Astro 5.3 with 37+ session docs. PM foundation established (Shape Up methodology, ROADMAP.md, cool-down skill, GitHub label taxonomy). DevX vertical: `work` CLI with `--yolo`/`--claude-args` flags (PR #176), 7 `work clean` bugfixes merged (PRs #168, #172, #178-#182), 8 agents, 14 skills, session orchestration. All 3 demo-blocking bugs resolved (#128, #129, #138 — all closed).

## What's Built

<details><summary>Infrastructure</summary>

- Next.js 16.1.6 scaffold (App Router, TypeScript, Turbopack)
- Tailwind v4 with design tokens in `globals.css` (`@theme inline`)
- shadcn/ui components (24 primitives)
- Fonts: Inter + JetBrains Mono via `next/font`, dark mode default
- Vitest (529 tests, 26 test files), GitHub Actions CI
- Layout shell: sidebar (8 nav links incl. Jobs + Invoices) + per-page Topbar breadcrumbs + main content area
- Dashboard: summary cards, "Needs Attention", "In Progress" sections
</details>

<details><summary>Data Layer (15 Zod schemas)</summary>

- Schemas: job, quote, customer, garment, screen, color, artwork, contact, group, address, note, invoice, credit-memo, board-card, scratch-note, customer-screen
- Constants: production states, priorities, burn status, quote status, invoice status, payment methods, credit memo reasons, lifecycle, health, type tags, payment terms, pricing tiers
- Mock data: 10 customers, 13 contacts, 2 groups, 20 addresses, 21 notes, 6 jobs, 6 quotes, 5 screens, 42 colors, 17 garments, 8 artworks, 8 invoices, 11 payments, 2 credit memos
- Reverse lookup helpers: getCustomerQuotes/Jobs/Contacts/Notes/Artworks/Invoices, getInvoicePayments/CreditMemos, getQuoteInvoice, getGarmentById, getColorById
- Screen helpers: deriveScreensFromJobs (derives customer screen records from completed jobs)
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

- 8 agents: frontend-builder, requirements-interrogator, design-auditor, feature-strategist, doc-sync, secretary (Ada), finance-sme, build-reviewer
- 14 skills: vertical-discovery, breadboarding, screen-builder, quality-gate, pre-build-interrogator, design-audit, feature-strategy, doc-sync, cool-down, implementation-planning, one-on-one, build-session-protocol, and more
- DevX vertical (PRs #92, #94, #96, #100, #103, #108): `work` CLI (Zellij orchestration), session registry, KDL layout generator, 8 prompts
</details>

<details><summary>Mobile Optimization Sprint 3+4 — Shared Components, Form Layouts, Detail Views (PR #148 — merged)</summary>

- **3-wave parallel agent build**: Wave 1 (4 agents): shared components. Wave 2 (4 agents): detail page layouts. Wave 3 (3 agents): code/design/security review.
- **Shared components built**:
  - `MobileFilterSheet` — Configurable sort/filter bottom sheet with chip toggles, focus-visible rings, conditional render for state reset
  - `BottomActionBar` — Fixed bottom bar at z-40 (above content, below nav), positioned above BottomTabBar with safe area padding
  - `FullScreenModal` — Mobile-first modal using `useIsMobile()` (Dialog on desktop, full Sheet on mobile), sr-only DialogHeader for Radix a11y
- **Form layout updates**: QuoteForm and InvoiceForm action buttons converted to sticky bottom bars on mobile (`sticky bottom-0 z-10`), Cancel as `variant="link"`, touch targets enforced
- **Detail view mobile layouts**:
  - Job Detail — Mobile tabbed layout (Overview/Tasks/Notes), lane-aware BottomActionBar (hidden for done, "Unblock" for blocked, "Move Lane" otherwise)
  - Quote Detail — Status-aware BottomActionBar (accepted: View Jobs + Create Invoice, draft: Edit + Send, fallback: Copy as New), spacer standardization with `pb-20 md:pb-0`
  - Invoice Detail — Status-aware BottomActionBar with `hasActions` guard (prevents empty bar), conditional buttons for edit/send/record payment/send reminder
  - Customer Detail — Mobile tab bar with 9 tabs in scrollable `TabsList`, sticky header, touch target enforcement
- **Review findings**: 9 issues found by 3 review agents, all fixed. 6 remaining items filed as GitHub issues (#151-#156)
- **Merge conflict resolution**: Adopted `shadow-brutal` / `shadow-brutal-sm` semantic tokens from main (replaced inline `shadow-[4px_4px_0px]`)
- 11 files changed, +608/-87 lines, 4 commits, squash-merged as `a3e70ba`
</details>

<details><summary>Mobile Polish — Filter Sheets, Tab Grouping, Scroll-to-Error (PR #167 — merged)</summary>

- **MobileFilterSheet integration** (#152): All 4 list views (Quotes, Invoices, Customers, Jobs) now have mobile filter bottom sheets with sort options and filter chips
- **Customer tab grouping** (#155): 9 tabs split into 5 primary + "More" dropdown with 4 secondary tabs on mobile
- **Scroll-to-error** (#156): Forms auto-scroll to first validation error on submit, respects `prefers-reduced-motion`
- **Unit tests** (#151): Contract tests for mobile components + behavioral tests for scroll-to-error utility
- **New components**: `MoneyAmount` (currency display), `JobCardBody` / `QuoteCardBody` (shared card layouts), `entities.ts` constants
- **Review fixes**: 4-agent design review caught broken sticky header bg token, missing aria-hidden, touch target violations, double-close bug, DRY issues
- Closes #151, #152, #155, #156
- 529 tests passing, 18 commits, +1324/-650 lines, 47 files changed
</details>

<details><summary>Pricing Mobile Responsive (PRs #174, #175 — merged)</summary>

- **Pricing list** (PR #175): Mobile responsive header/tabs/search, canonical `SERVICE_TYPE_ICONS` exported from ServiceTypeBadge, badge wrap fix, mobile action menu always visible (no hover on touch)
- **Screen-print editor** (PR #174): 8 desktop-only action buttons replaced with BottomActionBar (Tools + Save) on mobile. `MobileToolsSheet` — drill-down bottom sheet (Level 1 tool list → Level 2 editor detail) with labeled icons and descriptions. `MatrixPreviewSelector` stacks vertically with horizontal scroll for location toggles. Sticky first column on `ColorPricingGrid` and `PowerModeGrid` with shadow scroll hint. Sandbox mode banner stacks vertically with mobile BottomActionBar. Zero desktop regression.
- 5 files changed in #174 (+425/-19), 3 files in #175 (+54/-48)
</details>

<details><summary>DevX — work CLI Enhancements (PRs #176, #178-#182 — merged)</summary>

- **PR #176**: `--yolo` flag (auto-accept permissions) and `--claude-args` flag (pass arbitrary args to Claude CLI)
- **PR #178**: `work clean` resilient to partial state (missing worktree, missing session, missing branch)
- **PR #179**: Fix zsh arithmetic error in `work clean` grep -c
- **PR #180**: Prevent zsh NOMATCH error on worktree glob fallback
- **PR #181**: Use `find` for worktree glob, strip ANSI from zellij output
- **PR #182**: Exact topic matching in `work clean` branch lookup (prevents substring matches)
</details>

<details><summary>Config Centralization & Code Dedup (PR #195 — merged)</summary>

- **Closes #190**: Shared concepts (verticals, stages, tags) were duplicated in 7+ locations and had drifted out of sync
- **3 canonical config files** at `config/`: `verticals.json` (12 entries), `stages.json` (9 entries with `workAlias`/`pipeline` flags), `tags.json` (6 entries with colors)
- **9 KB consumer migrations**: `content.config.ts`, `Sidebar.astro`, `DocCard.astro`, `VerticalHealth.astro`, `index.astro`, `[vertical].astro`, `[stage].astro` — all import from config
- **work.sh**: `VALID_VERTICALS` read dynamically via `python3 -c` with guards for missing file, missing python3, and malformed JSON
- **4 code dedup fixes**: sidebar.tsx (nav from `navigation.ts` Map lookup with explicit error throws), StatusBadge.tsx (imports from `lib/constants.ts`), BoardFilterBar.tsx (`SERVICE_TYPE_ICONS` from ServiceTypeBadge), SetupWizard.tsx (`ServiceType` from schema)
- **Bugfixes found during audit**: `dtf-gang-sheet` and `devx` missing from 4 KB UI files, `mobile-optimization` missing from stage detail page, `polish` stage missing from VerticalHealth, invalid `vertical: infrastructure` in session doc
- **CLAUDE.md**: Inline vertical/stage/tag lists replaced with config file references
- **Zod schema**: All stages (including `cooldown` with `pipeline: false`) valid for session frontmatter — pipeline filtering done in display components only
- **3-agent parallel review**: Code reviewer (CodeRabbit), build verifier (tsc + tests + builds), silent failure hunter. All findings addressed before merge.
- 19 files changed (3 new, 16 modified), net -100 lines, 529 tests passing
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

<details><summary>Garment Mockup Engine — Design, Breadboard & Plan (PR #102 — merged)</summary>

- **Design document**: SVG composition engine using `feColorMatrix` color tinting + `<image>` artwork overlay + `<clipPath>` print zone masking + `mix-blend-mode: multiply` fabric texture blending. Zero external dependencies — all browser-native SVG/CSS.
- **Breadboard**: 8 Places (4 Phase 1), 10 UI Affordances, 12 Code Affordances, 7 Data Stores. Maps integration into Quote Detail, Job Detail, Kanban Board, and Root Layout.
- **Implementation plan**: 16-task TDD plan with parallelization windows (Tasks 1-4 concurrent, Tasks 11-13 concurrent)
- **4 integration gaps found and resolved during breadboarding**:
  - Location string normalization: `PRINT_POSITION_ALIASES` lookup + `normalizePosition()` fallback (quote "Front" / job "Front Center" → engine "front-chest")
  - Job artwork-to-location: 1:1 order mapping (`artworkIds[0]` → `printLocations[0]`). Phase 2 adds per-location `artworkId`.
  - JobCard view model: 3 optional fields (`garmentCategory`, `garmentColorHex`, `primaryArtworkUrl`) for Kanban thumbnails
  - MockupFilterProvider: Per-page rendering (root layout is server component)
- **Component architecture**: Stable interface (`<GarmentMockup garmentCategory colorHex artworkPlacements[] view size />`) designed to scale from SVG → Photo → Canvas → 3D
- **Starts with t-shirts only** (2 SVG templates: front + back). Expand to other categories after core is proven.
- Artifacts: `docs/plans/2026-02-14-garment-mockup-design.md`, `docs/plans/2026-02-14-garment-mockup-impl-plan.md`, `docs/breadboards/mockup-engine-breadboard.md`
- KB: `2026-02-14-garment-mockup-breadboard.md`, `2026-02-14-garment-mockup-impl-plan.md`
</details>

<details><summary>Mobile Optimization Sprint 1 — Navigation Shell (PR #101 — merged)</summary>

- **8 mobile CSS design tokens** in `@theme inline`: `--mobile-nav-height`, `--mobile-header-height`, `--mobile-touch-target`, `--mobile-bottom-safe-area`, `--mobile-card-gap`, `--mobile-sheet-max-height`, `--mobile-fab-size`, `--shadow-brutal-sm`
- **Custom utilities**: `pb-safe` (safe area padding), `scrollbar-none` (hide scrollbar, keep scroll)
- **Viewport**: `viewport-fit=cover` export for notched device support
- **`useIsMobile` hook**: `useSyncExternalStore`-based viewport detection (SSR-safe, React 19 compatible)
- **Shared nav constants**: `NavItem` interface, `PRIMARY_NAV` (4 items), `SECONDARY_NAV` (4 items) in `lib/constants/navigation.ts`
- **BottomTabBar**: 5-tab fixed bottom nav (Dashboard, Jobs, Quotes, Customers, More) with active states, focus-visible rings, touch targets >= 44px
- **MobileDrawer**: Left sheet with secondary nav links (Invoices, Screen Room, Garments, Settings)
- **MobileHeader**: Dynamic page title from pathname matching + notification bell placeholder (disabled, Phase 2)
- **MobileShell**: Client wrapper managing drawer state — dashboard layout stays server component
- **Layout integration**: Sidebar hidden on mobile (`hidden md:flex`), MobileShell wraps content, zero desktop regression
- **Touch target audit**: All mobile interactive elements verified >= 44px (`min-h-(--mobile-touch-target)`)
- **BottomSheet**: Reusable bottom sheet component (side=bottom, rounded top, drag handle, 85vh max, safe area)
- **MobileCardList**: Generic card list container with empty state, `md:hidden`, mobile-card-gap token
- Key decisions: CSS-first responsive (`md:hidden`/`hidden md:block`), per-component touch targets (not global), `useSyncExternalStore` over `useState`+`useEffect`, `label` field in NavItem (sidebar adopts in Sprint 4)
- 12 commits, 9 tasks across 3 batches, 2 CodeRabbit review rounds (all legitimate issues fixed, false positives documented)
</details>

<details><summary>Garment Catalog & Customer Screens (PR #109 — merged)</summary>

- **Discovery + Breadboard**: Garment catalog breadboard mapped ~40 UI affordances, 23 code affordances, 12 data stores across 4 places
- **18-task build** via subagent-driven development with two-stage review (spec + quality)
- **Schemas**: Extended `garmentCatalogSchema` (isEnabled, isFavorite), extended `customerSchema` (favoriteGarments, favoriteColors), new `customerScreenSchema`
- **Helpers**: `getGarmentById()`, `getColorById()` in `garment-helpers.ts`, `deriveScreensFromJobs()` in `screen-helpers.ts` — all with tests
- **Mock data expanded**: 5 → 17 garments across all categories (t-shirts, fleece, outerwear, pants, headwear)
- **Shared components**: `GarmentImage` (shirt icon placeholder, sm/md/lg), `FavoriteStar` (inline toggle with a11y), `ColorSwatchPicker` compact mode
- **Garment Catalog** (`/garments`) — Grid/table toggle, category tabs, search, brand/color family filters, price toggle (localStorage), detail drawer (Sheet) with size/price matrix, linked jobs, favorites
- **Customer Screens tab** — Derived from completed jobs, color swatches, mesh count badges, linked job links, reclaim workflow with confirmation dialog
- **Customer favorites** — FavoriteStar toggles on catalog page and drawer, favoriteGarments/favoriteColors on customer schema
- **Job Detail polish** — Replaced raw IDs (`gc-002`, `clr-black`) with resolved garment names + GarmentImage + color swatches
- **Cross-linking**: Dashboard, CustomerJobsTable, InvoiceDetailView already had working links (verified, no changes needed)
- 434 tests passing, 17 commits, CodeRabbit review: 13 issues fixed across 12 files (Tailwind tokens, breakpoints, touch targets, a11y, sort mutation)
</details>

<details><summary>Garments Vertical — Consolidated Breadboard (PR #173 — merged)</summary>

- **Consolidated breadboard**: `docs/breadboards/garments-breadboard.md` supersedes `garment-catalog-breadboard.md`, merges catalog build + mockup engine + interview findings
- **Every affordance tagged**: [BUILT], [NEW], [MOCKUP], or [POLISH] — remaining work immediately visible
- **New from interview (D1)**: Weight/fabric type filters — 4 UI affordances (U16-U19), 4 code affordances (N24-N27), 2 URL state stores (S13-S14). Schema adds `weight` (numeric oz) and `fabricType` (string) to `garmentCatalogSchema`
- **New from interview (D2)**: Customer-supplied garment support — 3 code affordances (N28-N30), 1 data store (S15). Schema adds `customerSupplied` boolean + `handlingFee` to `quoteLineItemSchema`
- **10-task build order** with 4 parallelization windows: A (schema+data), B (UI filters), C (customer-supplied schema), D (tests)
- **Deferred**: Customer-supplied garment UI in quote form (to quoting v2), API auto-refresh, screen reclamation dashboard
- KB: `2026-02-15-garments-breadboard.md`
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

<details><summary>Worktree & Permissions Policy Update (PR #118)</summary>

- **Worktree policy**: Removed artificial worktree limit (was max 4/6 — contradictory). No cap on concurrent worktrees; user handles batch cleanup.
- **Ownership rule**: Agents must NEVER remove worktrees they didn't create — prevents disruption of concurrent sessions.
- **Push-after-commit**: Workflow changed from separate commit/push steps to combined commit+push after every logical chunk. Work is always on remote as insurance against worktree loss.
- **Implementation planning skill**: Removed wave size cap (was "max 4 parallel sessions per wave") — size waves by dependency graph, not worktree count.
- **Permissions (global settings.json)**: Added 51 Bash allows (system info, file ops, TUI tools, dev tools), 14 new denies (destructive git, worktree removal, process killing), broad Read/Write/Edit, `uv` over `pip`.
</details>

<details><summary>Price Matrix Polish + Demo Bug Fixes (PR #157 — merged)</summary>

- **Progressive disclosure layout**: Sub-editors (Qty Tiers, Garments, Locations, Setup Fees) converted from inline Cards to Popovers. Sticky header with all action buttons in one row.
- **WithTooltip DRY wrapper** (`components/ui/with-tooltip.tsx`): Self-contained tooltip component with built-in `TooltipProvider`. Descriptive tooltips on all 17+ editor buttons.
- **Quantity Tier Editor rewrite**: Removed custom label editing — labels auto-derived from min/max. Gap detection warns about uncovered quantity ranges with exact missing numbers. Overlap detection. Deferred validation (focus tracking suppresses red borders while typing). Red error indicator on Qty Tiers button when issues exist.
- **Color pricing fix** (#138): Rate now applies uniformly to all colors including first. Formula: `base + (ratePerHit × colorCount)`. Previously 1-color had `ratePerHit=0`, causing 1→2 color jump to be double expected.
- **Sandbox crash fix**: `WithTooltip` made self-contained with own `TooltipProvider` — no longer crashes when used outside grouped button bars.
- **Matrix preview selectors**: Garment category combobox + location chip bar for previewing pricing with different garment/location combinations.
- **PowerModeGrid external manual edit**: Spreadsheet supports toggling manual cell editing on/off.
- 22 files changed, 5 commits, all 516 tests passing
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
- [x] **#151** — Unit tests for mobile shared components *(closed by PR #167)*
- [x] **#152** — Integrate MobileFilterSheet into list views *(closed by PR #167)*
- [ ] **#153** — Extract hardcoded toast messages to constants
- [ ] **#154** — Fix pre-existing lint errors in garments/page.tsx and PowerModeGrid (React 19 compiler)
- [x] **#155** — Customer detail tab grouping for 9-tab mobile bar *(closed by PR #167)*
- [x] **#156** — Mobile scroll-to-error on form validation *(closed by PR #167)*

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
- [ ] **#196** — Rename pipeline stages to shorter, consistent slugs + add `shape` step (deferred to pipeline architecture session)

## Next Actions

1. **Onboarding Wizards** (#145) — Guided first-time experience for Gary demo. 3 journeys: view job board, close invoice, create customer.
2. **DTF Gang Sheet Builder** (#144) — New vertical, direct user request. Full pipeline: discovery → build.
3. **Gary demo** (Feb 21) — First real user feedback session. All 7 verticals + mobile.
4. **Garment Mockup Engine — Execute 16-task plan** — Design, breadboard, and plan complete (PR #102). Execute via `superpowers:executing-plans` against `docs/plans/2026-02-14-garment-mockup-impl-plan.md`.
5. **Garments — Weight/fabric filters + customer-supplied schema** — 10-task build order from consolidated breadboard (PR #173). Schema additions, filter UI, mock data. See `docs/breadboards/garments-breadboard.md`.
6. **Update IMPLEMENTATION_PLAN.md** (#87) — plan is stale, shows Step 0 complete when 6 verticals are built
7. Create vertical BRIEFs (#89) — enables cool-down skill and structured feedback capture
8. Address deferred tech debt (#15-#18, #70-#78, #151-#156) as needed

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
| `docs/plans/2026-02-14-garment-mockup-design.md` | Garment mockup engine design (SVG composition architecture) |
| `docs/plans/2026-02-14-garment-mockup-impl-plan.md` | 16-task TDD plan with breadboard gap fixes |
| `docs/breadboards/mockup-engine-breadboard.md` | Mockup engine breadboard (8 places, 10 UI + 12 code affordances) |
| `docs/breadboards/garments-breadboard.md` | Consolidated garments vertical breadboard (9 places, 80+ affordances, 10-task build order) |
| `knowledge-base/src/content/sessions/` | 37 Markdown session docs (Astro KB, replaces `for_human/`) |

## Key Design Requirements

- Instant client-side pricing — never block input
- S&S-style dense color swatch grid (white text overlay, search, favorites)
- Single-page form (no multi-step wizard)
- Price override (editable grand total)
- Hybrid approval workflow (UI in Phase 1, backend in Phase 2)
- Quote statuses: Draft, Sent, Accepted, Declined, Revised
- Duplicate Quote for reuse
- Internal + customer-facing notes
