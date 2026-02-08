# breadboarding

Map a vertical's screens into UI affordances, code affordances, and wiring before building. Shows what users can do, how it works underneath, and how components connect — in one view. Produces a buildable blueprint that the frontend-builder agent consumes.

Adapted from Ryan Singer's [shaping-skills/breadboarding](https://github.com/rjs/shaping-skills) methodology for Screen Print Pro's vertical-by-vertical development workflow.

## Trigger

Use **after scope definition and before build execution** for each vertical. Specifically:

- After `docs/strategy/{vertical}-scope-definition.md` is complete
- After `docs/strategy/screen-print-pro-journey-{vertical}.md` is complete
- Before briefing the frontend-builder agent

Also use when:
- A screen has 3+ interactive sections with cross-wiring (e.g., New Quote Form)
- You need to plan component boundaries before building
- You want to identify which shared components to build first

## Core Concepts

See `reference/concepts.md` for full definitions. Quick summary:

- **Place**: A bounded context where specific affordances become available (page, modal, expanded section). If you can't interact with what's behind it, it's a new Place.
- **UI Affordance (U)**: Something the user sees and interacts with — button, input, dropdown, swatch grid, badge.
- **Code Affordance (N)**: A function, handler, computation, or subscription that executes when triggered. Phase 1: client-side calculations, state updates, URL param changes. Phase 2: API calls, database queries, real-time subscriptions.
- **Data Store (S)**: State that persists and gets read/written — URL params, form state, mock data, localStorage.
- **Wiring**: Control flow (what triggers what) and data flow (where output goes).

## Phase Awareness

### Phase 1 (Current — Mock Data)

Focus on **UI affordances** and **client-side code affordances**:
- Form state management (React state, URL params)
- Client-side calculations (pricing formulas)
- Navigation (router pushes, link clicks)
- UI state transitions (expand/collapse, modal open/close, filter/search)
- Mock data reads (import from `lib/mock-data.ts`)

Code affordances are lightweight: `useState`, `useSearchParams`, inline calculations, `cn()` conditionals.

### Phase 2 (Future — Real Backend)

Add **server-side code affordances** and **real data stores**:
- API route handlers (`app/api/`)
- Database queries (Prisma/Drizzle)
- Server actions
- Real-time subscriptions (WebSocket, SSE)
- Authentication/authorization checks
- External service calls (email, PDF generation, S&S API)

The breadboard structure scales — Phase 2 adds N-rows and S-rows without changing the U-rows.

## Workflow

### Step 1: Read Inputs

Read these files (do NOT skip any):

1. `docs/strategy/{vertical}-scope-definition.md` — CORE/PERIPHERAL/INTERCONNECTIONS
2. `docs/strategy/screen-print-pro-journey-{vertical}.md` — redesigned flow with sections
3. `docs/APP_FLOW.md` — routes, page structure, navigation
4. `lib/schemas/` — Zod schemas for relevant data types
5. `lib/mock-data.ts` — available data shapes
6. `components/features/` — existing shared components
7. `components/ui/` — available shadcn/ui primitives

### Step 2: Identify Places

List every bounded context the user visits in this vertical. Use the **blocking test**: if you can't interact with elements behind something, it's a new Place.

**Creates a new Place**:
- A page route (`/quotes`, `/quotes/new`, `/quotes/[id]`)
- A modal dialog (Customer Creation Modal, Email Preview Modal)
- A full-screen overlay or wizard step

**Does NOT create a new Place** (local state within a Place):
- Accordion expand/collapse
- Dropdown open/close
- Tooltip hover
- Inline edit toggle
- Filter panel show/hide

Use hierarchical IDs: `P1` for a page, `P1.1` for a modal within that page.

**Output**: Places table.

```markdown
| ID | Place | Type | Entry Point |
|----|-------|------|-------------|
| P1 | Quotes List | Page | `/quotes` |
| P2 | New Quote Form | Page | `/quotes/new` |
| P2.1 | Customer Creation Modal | Modal | "Add New Customer" link in P2 |
| P2.2 | Color Swatch Picker | Subplace | Garment color field in P2 |
| P3 | Quote Detail | Page | `/quotes/[id]` |
| P3.1 | Email Preview Modal | Modal | "Send to Customer" button in P3 |
```

### Step 3: Map UI Affordances

For each Place, list every interactive element the user can see and act on. Be concrete — name actual UI elements, not abstractions.

**Control types**:
- `click` — button, link, row, checkbox, swatch
- `type` — text input, number input, textarea
- `select` — dropdown/combobox selection
- `toggle` — checkbox, switch, accordion
- `drag` — drag-and-drop (Phase 2: Kanban)

**Output**: UI Affordances table.

```markdown
| ID | Place | Affordance | Control | Wires Out | Returns To |
|----|-------|------------|---------|-----------|------------|
| U1 | P2 | Customer Combobox | type | → filter customer list | → selected customer display |
| U2 | P2 | "Add New Customer" link | click | → open P2.1 | |
| U3 | P2 | Garment Combobox | select | → load colors for U5 | → set line item garment |
```

Rules:
- Every affordance gets a unique ID (U1, U2, ...)
- Every affordance belongs to exactly one Place
- Name the actual thing ("Customer Combobox"), not an abstraction ("input field")
- Wires Out = what it triggers (control flow)
- Returns To = where its output feeds (data flow)

### Step 4: Map Code Affordances

For each UI affordance's "Wires Out", identify the code mechanism that executes.

Phase 1 code affordances are typically:
- `calculateLineTotal()` — pricing formula
- `filterByStatus(status)` — URL param update + array filter
- `addLineItem()` — append to form state array
- `updateSizeQty(size, qty)` — update nested form state
- `navigateTo(route)` — router push

**Output**: Code Affordances table.

```markdown
| ID | Place | Affordance | Trigger | Wires Out | Returns To |
|----|-------|------------|---------|-----------|------------|
| N1 | P2 | calculateLineTotal() | U-qty change | | → U-line-total display |
| N2 | P2 | filterCustomers(query) | U1 type | | → U1 dropdown options |
| N3 | P2.1 | saveNewCustomer(data) | U-save click | → add to mock data | → auto-select in U1, close P2.1 |
```

### Step 5: Map Data Stores

Identify state that persists and gets read/written. In Phase 1 these are primarily:

- URL search params (`?q=`, `?status=`)
- React form state (controlled inputs, line items array)
- Mock data imports (read-only in Phase 1)
- Computed values (derived from form state, not stored)

**Output**: Data Stores table.

```markdown
| ID | Place | Store | Type | Read By | Written By |
|----|-------|-------|------|---------|------------|
| S1 | P1 | URL ?status param | URL state | U-filter, N-filter | U-status-tabs click |
| S2 | P2 | Line Items array | React state | N-calculate, U-totals | U-add-item, U-remove-item, U-qty |
| S3 | P2 | Selected Customer | React state | U-customer-display | U1 select, N3 save |
```

### Step 6: Verify Wiring

Check completeness:

- [ ] Every UI affordance (U) has at least one Wires Out or Returns To
- [ ] Every code affordance (N) has a trigger (from a U or another N)
- [ ] Every data store (S) has at least one reader and one writer
- [ ] Every "Wires Out" target exists in the tables (no dangling references)
- [ ] Every "Returns To" target exists in the tables
- [ ] No orphan affordances (connected to nothing)
- [ ] Every CORE feature from scope definition has corresponding affordances

### Step 7: Identify Component Boundaries

Using the Places and affordance groups, identify natural component boundaries:

```markdown
## Component Boundaries

| Component | Place | Contains Affordances | Shared? |
|-----------|-------|---------------------|---------|
| CustomerCombobox | P2, P3 | U1, U2, N2 | Yes — reusable across verticals |
| ColorSwatchPicker | P2.2 | U5, U6, U7, N5, S4 | Yes — reusable |
| LineItemRow | P2 | U3, U4, U-qty, U-locations, N1 | No — quote-specific |
| PricingSummary | P2 | U-subtotal, U-setup, U-total, N-calc | No — quote-specific |
| QuotesDataTable | P1 | U-rows, U-filter, U-search, N-filter | Extends shared DataTable |
```

This directly maps to file structure:
- Shared → `components/features/`
- Vertical-specific → `app/(dashboard)/<route>/components/` or inline

### Step 8: Define Build Order

Using component boundaries and wiring dependencies, define the build order:

1. Build shared components first (no dependencies on vertical-specific code)
2. Build data/state layer (schemas, mock data extensions, stores)
3. Build screens in dependency order (components that others wire to → components that consume)

```markdown
## Build Order

| # | Component/Screen | Depends On | Blocks |
|---|-----------------|------------|--------|
| 1 | CustomerCombobox | shadcn Combobox, mock customers | New Quote Form |
| 2 | ColorSwatchPicker | mock colors data | New Quote Form |
| 3 | Quotes List page | DataTable (exists), mock quotes | Nothing |
| 4 | New Quote Form | CustomerCombobox, ColorSwatchPicker, pricing calc | Quote Detail |
| 5 | Quote Detail page | mock quotes | Email Preview Modal |
| 6 | Email Preview Modal | mock quote data | Nothing |
```

### Step 9: Write Breadboard Document

Use the template at `templates/breadboard-template.md` to produce the final document.

**Output file**: `docs/breadboards/{vertical}-breadboard.md`

## Quality Gate

Before marking a breadboard complete, verify:

- [ ] Every Place passes the blocking test
- [ ] Every CORE feature from scope definition has corresponding UI affordances
- [ ] Every UI affordance has wiring (Wires Out and/or Returns To)
- [ ] Every code affordance has a trigger
- [ ] Every data store has readers and writers
- [ ] No dangling wire references
- [ ] Component boundaries identified with shared/vertical-specific classification
- [ ] Build order defined with dependency chain
- [ ] Phase indicators (Phase 1/Phase 2) on code affordances where relevant

## Rules

- **Name actual things, not abstractions.** "Customer Combobox" not "search input." "calculateLineTotal()" not "pricing logic."
- **Every affordance must connect.** If it wires to nothing, it's either wrong or missing a connection.
- **Places are perceptual, not technical.** A modal is a Place because the user can't interact with what's behind it. A route parameter change is NOT a new Place if the layout stays the same.
- **Wiring is directional.** Wires Out = what I trigger (control flow). Returns To = where my output goes (data flow). These are different.
- **Don't model internals.** Skip framework plumbing (React reconciliation, Next.js routing internals). Wire directly from trigger to destination.
- **Phase-tag code affordances.** Mark each N-row as Phase 1 (client-side) or Phase 2 (server-side) so the breadboard grows incrementally.
- **The tables are the truth.** Any diagrams or prose are supplementary. If they contradict the tables, the tables win.
