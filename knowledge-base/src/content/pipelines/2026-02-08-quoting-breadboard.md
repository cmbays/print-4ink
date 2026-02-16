---
title: "Quoting Breadboard"
subtitle: "Visual blueprint mapping all Places, UI affordances, code affordances, and wiring for the Quoting vertical. Produced by the breadboarding skill as input to the frontend-builder agent."
date: 2026-02-08
phase: 1
vertical: quoting
verticalSecondary: []
stage: breadboarding
tags: [plan, build]
sessionId: "09b70260-83ac-4830-9b02-ed8c0683f699"
branch: "feat/quoting-discovery"
status: complete
---

| Metric | Value |
|--------|-------|
| Places | 7 |
| UI Affordances | 65 |
| Code Affordances | 32 |
| Data Stores | 18 |

## Places & Navigation Flow

### How users move through the Quoting vertical

Pages (rectangles) are routes. Modals/popovers (rounded) block interaction with the parent Place. Shared components (dashed cyan) feed into multiple Places and will be reusable across future verticals.

```mermaid
flowchart TD
    P1["P1: Quotes List\n/quotes"]
    P2["P2: New Quote Form\n/quotes/new"]
    P21["P2.1: Customer\nCreation Modal"]
    P22["P2.2: Color Swatch\nPicker"]
    P3["P3: Quote Detail\n/quotes/[id]"]
    P31["P3.1: Email\nPreview Modal"]
    P4["P4: Edit Quote\n/quotes/[id]/edit"]

    P1 -- "New Quote btn" --> P2
    P1 -- "Row click" --> P3
    P1 -- "Quick Edit" --> P4
    P1 -- "Duplicate" --> P2

    P2 -- "Add Customer" --> P21
    P21 -- "Save + close" --> P2
    P2 -- "Pick color" --> P22
    P22 -- "Select + close" --> P2
    P2 -- "Save Draft" --> P3
    P2 -- "Save & Send" --> P3

    P3 -- "Edit Quote" --> P4
    P3 -- "Duplicate" --> P2
    P3 -- "Send to Customer" --> P31
    P31 -- "Send / Cancel" --> P3
    P4 -- "Update Quote" --> P3

    SC1([ColorSwatchPicker]):::shared -.-> P22
    SC2([CustomerCombobox]):::shared -.-> P2
    SC3([StatusBadge]):::shared -.-> P1
    SC3 -.-> P3

    classDef shared fill:#164e63,stroke:#22d3ee,color:#22d3ee
```

## New Quote Form — Pricing Data Flow

### How user inputs flow through the calculation chain

Every calculation is instant and client-side — never blocks input. This is the #1 improvement over Print Life (which blocks on every quantity change). The pricing formula is simplified for Phase 1; Phase 2 will read from a configurable pricing matrix.

```mermaid
flowchart TD
    subgraph inputs ["User Inputs (per line item)"]
        GARM["Garment Combobox"]
        SIZES["Size Qty Inputs\nXS S M L XL 2XL 3XL"]
        LOCS["Location Checkboxes\nFront Back L/R Sleeve"]
        COLCOUNT["Color Count\nper location"]
    end

    subgraph calc ["Calculation Chain"]
        N32["calculateUnitPrice\nbase + colors x $0.50 + locs x $0.25"]
        N10["sumSizeQtys\ntotal quantity"]
        N11["calculateLineTotal\nunitPrice x totalQty"]
    end

    subgraph totals ["Pricing Summary"]
        N16["calculateSubtotal\nsum of all line totals"]
        SETUP["Setup Fees\nuser input"]
        TOTAL["Grand Total\nauto-calc OR manual override"]
    end

    GARM --> N32
    LOCS --> N32
    COLCOUNT --> N32
    SIZES --> N10
    N32 --> N11
    N10 --> N11
    N11 -->|"per line item"| N16
    SETUP --> N16
    N16 --> TOTAL

    classDef input fill:#1c1c1f,stroke:#a1a1aa,color:#fafafa
    classDef calcNode fill:#164e63,stroke:#22d3ee,color:#cffafe
    classDef totalNode fill:#052e16,stroke:#34d399,color:#d1fae5

    class GARM,SIZES,LOCS,COLCOUNT,SETUP input
    class N32,N10,N11,N16 calcNode
    class TOTAL totalNode
```

## Places

| ID | Place | Type | Entry Point |
|----|-------|------|-------------|
| P1 | Quotes List | Page | `/quotes` |
| P2 | New Quote Form | Page | `/quotes/new` |
| P2.1 | Customer Creation Modal | Modal | "Add New Customer" in P2 |
| P2.2 | Color Swatch Picker | Popover | Color field in P2 line item |
| P3 | Quote Detail | Page | `/quotes/[id]` |
| P3.1 | Email Preview Modal | Modal | "Send to Customer" in P3 |
| P4 | Edit Quote Form | Page | `/quotes/[id]/edit` |

## Shared Components (Reusable)

Built first, used across verticals.

| Component | Used In | Location |
|-----------|---------|----------|
| **ColorSwatchPicker** | P2.2 (Quote Form color selection) | `components/features/` |
| **CustomerCombobox** | P2, P4 (customer selection) | `components/features/` |
| **StatusBadge** | P1, P3 (quote status display) | `components/features/` |

## Build Order

Dependency-ordered execution plan:

1. **Schema Updates** (Low) — Update quote.ts (new statuses, richer line items), new color.ts, garment catalog variant. Blocks everything.
2. **Mock Data Expansion** (Medium) — 40 colors with S&S-aligned fields, 6+ garment styles, 6 quotes with full line items. Blocks all UI.
3. **Shared Components** (Medium) — ColorSwatchPicker + CustomerCombobox + StatusBadge. Can run in parallel. Block the Quote Form.
4. **Quotes List Page** (Medium) — P1: DataTable with filters, search, sort, quick actions. Can run in parallel with step 5.
5. **QuoteForm + Pricing** (High) — Core form component: LineItemRow, PricingSummary, pricing calculations. Heart of the vertical.
6. **New Quote + Edit Quote Pages** (Medium) — P2 + P4: Wire QuoteForm into page routes with Customer Modal integration.
7. **Quote Detail + Email Preview** (Medium) — P3 + P3.1: Read-only view with action buttons and email mockup modal.

**Critical path:** Schemas → Mock Data → ColorSwatchPicker → QuoteForm → New Quote page

## Key Design Decisions

### Single-page form, not a wizard

Print Life forces 6 sequential steps. We use one scrollable page with 4 collapsible sections. Users only interact with what they need.

### Instant pricing (never block input)

Print Life's #1 friction: recalculation blocks typing. Our N32 → N11 → N16 chain runs synchronously on every keystroke with zero delay.

### Color swatch picker as popover (P2.2)

Inline grids per line item would consume too much vertical space. Popover opens on click, blocks form, closes on selection. Passes the blocking test = its own Place.

### QuoteForm shared between New + Edit

P2 and P4 use the same component. P4 calls N31 (loadQuoteForEdit) on mount to pre-fill. Reduces build effort and ensures consistency.

## Artifacts

Full breadboard document (tables + diagrams): `docs/breadboards/quoting-breadboard.md`

Contains: Places, UI Affordances (65), Code Affordances (32), Data Stores (18), Wiring Verification, Component Boundaries, Build Order, Scope Coverage, Phase 2 Extensions. Mermaid diagrams render on GitHub.
