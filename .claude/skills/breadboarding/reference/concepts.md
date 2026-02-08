# Breadboarding Concepts

Reference guide for the breadboarding methodology. Consult when producing or reviewing breadboard documents.

Source: Adapted from Ryan Singer's [shaping-skills/breadboarding](https://github.com/rjs/shaping-skills) for Screen Print Pro.

---

## The Three Elements

A breadboard maps a system using three types of interactive elements:

### UI Affordances (U)

Things users **see and interact with**. These are tangible entry points into the system.

**Examples**:
- Customer Combobox (type-ahead search input)
- "Save as Draft" button
- Status filter tabs (All | Draft | Sent | ...)
- Color swatch in the picker grid
- Quantity input for size "M"
- "Remove" link on a line item row

**NOT UI affordances** (these are layout/decoration, not interactive):
- Section headings
- Static labels
- Separator lines
- Background colors

### Code Affordances (N)

Functions, handlers, and computations that **execute when triggered**. Users don't see these directly, but they're the machinery that makes UI affordances work.

**Phase 1 examples** (client-side):
- `calculateLineTotal(garmentPrice, colors, locations, qty)` — pricing formula
- `filterQuotes(status, searchQuery)` — filter array + update URL params
- `addLineItem()` — append empty row to form state
- `updateSizeQty(lineIndex, size, qty)` — update nested form state
- `toggleFavoriteColor(colorId)` — add/remove from favorites list

**Phase 2 examples** (server-side):
- `createQuote(data)` — API route, writes to database
- `sendQuoteEmail(quoteId, recipientEmail)` — email service call
- `fetchCustomers(query)` — database query with search
- `generateQuotePDF(quoteId)` — PDF generation service

### Data Stores (S)

State that **persists and gets read/written**. Not ephemeral UI state like "is this dropdown open" — stores hold data that other affordances depend on.

**Examples**:
- URL search params (`?status=draft&q=brewery`) — persists across navigation
- Form state (line items array, selected customer) — persists during form session
- Mock data imports (quotes, customers, garments) — read-only in Phase 1
- Computed values (subtotal, grand total) — derived from form state
- Favorites list (starred colors) — persists across sessions (localStorage in Phase 2)

---

## Places

A **Place** is a bounded context where specific affordances become available. Places are perceptual boundaries, not technical ones.

### The Blocking Test

If you can't interact with elements **behind** something, you've entered a different Place.

**Creates a new Place** (blocks what's behind):
- A different page route (`/quotes` → `/quotes/new`)
- A modal dialog (background is dimmed/inert)
- A full-screen overlay
- A confirmation dialog

**Does NOT create a new Place** (local state change):
- Accordion expand/collapse (content behind is still interactive)
- Dropdown menu open (closes on outside click, content behind accessible)
- Tooltip hover
- Inline edit mode (surrounding content still accessible)
- Filter panel show/hide
- Tab switching within the same page

### Place Hierarchy

Use hierarchical IDs to show containment:

```
P1          — Quotes List page
P2          — New Quote Form page
P2.1        — Customer Creation Modal (within P2)
P2.2        — Color Swatch Picker (subplace within P2, if it has its own interaction mode)
P3          — Quote Detail page
P3.1        — Email Preview Modal (within P3)
P3.2        — Confirm Delete Dialog (within P3)
```

**Containment vs Wiring**: Containment answers "where does this live?" — P2.1 lives inside P2. Wiring answers "what does this trigger?" — U2 in P2 opens P2.1. These are different relationships.

---

## Wiring

Every affordance connects to other affordances through two types of flow:

### Wires Out (Control Flow)

What an affordance **triggers** when activated. This is the "what happens next" chain.

```
U-save-draft click → N-validateForm() → N-saveToMockData() → N-navigateTo(/quotes)
```

### Returns To (Data Flow)

Where an affordance's **output feeds**. This is the "where does the result go" chain.

```
N-calculateLineTotal() returns to → U-line-total-display, U-subtotal-display, U-grand-total-display
```

### Key Distinction

A single action can have both:

```
U-qty-input type
  Wires Out: → N-updateSizeQty(lineIndex, size, qty)    [control: triggers the calculation]
  Returns To: → U-total-qty-display, U-line-total        [data: calculation result feeds displays]
```

### Wiring Rules

1. **Every U must connect to something** — otherwise it's decorative, not an affordance
2. **Every N must have a trigger** — something (U or another N) must activate it
3. **Never wire to framework internals** — skip React reconciliation, Next.js routing plumbing. Wire directly from trigger to destination
4. **Side effects are stores** — if something writes to URL, localStorage, or external state, create a Store (S) for it

---

## Affordance Naming

Name actual things, not abstractions.

| Good | Bad |
|------|-----|
| Customer Combobox | search input |
| "Save as Draft" button | secondary action |
| Status filter tabs | filter mechanism |
| Color swatch square | color selector |
| `calculateLineTotal()` | pricing logic |
| `filterQuotes(status)` | filter function |

If you can't name it specifically, you probably don't understand the design yet. Go back to the scope definition or journey design.

---

## Component Boundaries

Affordance groupings naturally reveal component boundaries:

1. **Affordances in the same Place that share state** → likely one component
2. **Affordances that appear in multiple Places** → shared component in `components/features/`
3. **Affordances unique to one Place** → local component or inline in page

### Shared Component Indicators

A group of affordances should become a shared component when:
- They appear in 2+ Places or 2+ verticals
- They have their own internal state (e.g., ColorSwatchPicker has search, favorites, selection)
- They're complex enough to warrant their own file (5+ affordances)

### Vertical-Specific Component Indicators

Keep as local component when:
- Only used in one Place
- No internal state beyond what the parent manages
- Simple enough to be inline (1-3 affordances)

---

## Vertical Slicing with Breadboards

Breadboards enable slicing into demo-able increments. Each slice cuts vertically through all layers to deliver something clickable.

### Slice Rules

1. Each slice must show **observable UI changes** — something the user can see or click
2. Slices are ordered by **dependency** — build what others depend on first
3. A slice may wire to future slices — that's expected. Show the wire, note it's not yet implemented
4. Shared components come first — they unblock multiple slices

### Example Slice Plan

```
Slice 1: Quotes List (standalone, needs DataTable)
Slice 2: ColorSwatchPicker (shared component, blocks Slice 4)
Slice 3: CustomerCombobox (shared component, blocks Slice 4)
Slice 4: New Quote Form (depends on Slices 2-3)
Slice 5: Quote Detail + Email Modal (depends on mock quote data from Slice 4)
```
