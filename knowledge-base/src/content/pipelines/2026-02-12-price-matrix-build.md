---
title: "Price Matrix Build"
subtitle: "Full implementation of the pricing engine vertical — schemas, editors, Power Grid, sandbox mode, and the useSpreadsheetEditor data grid widget"
date: 2026-02-12
phase: 1
pipeline: price-matrix
pipelineType: vertical
products: [pricing, quotes]
tools: []
stage: build
tags: [feature, build, learning]
sessionId: "c564ffea-778c-43d0-a35f-2bb32431d23b"
branch: "session/0211-price-matrix-build"
status: complete
---

## At a Glance

| Stat | Value |
|------|-------|
| Files Changed | 29 |
| Lines Added | 8,552 |
| Commits | 10 |
| Build Phases | 5 |

The complete Price Matrix vertical built across 5 phases: foundation schemas and pricing engine, three parallel editor builds, advanced features (sandbox, power grid, cost config), cross-vertical integration, and final polish. The crown jewel is `useSpreadsheetEditor`, a 777-line reusable hook powering the Power Grid's Excel-like editing UX.

## Build Timeline

```text
PHASE A — Foundation (db27e22)

  Zod schemas → Pricing engine (568 LOC) → Mock data → Pricing Hub

PHASE B — Editors (8eb4bf0)

  [Parallel] Setup Wizard + Screen Print Editor + DTF Editor
  15 new files, +3,672 lines

PHASE C — Advanced Features (166e9bc)

  [Parallel] Sandbox Mode + Power Grid + Cost Config
  6 new files, +1,400 lines

PHASE D — Integration (c6eca5a)

  [Parallel] Tag-Template Mapper + Matrix Peek Sheet + big.js migration

PHASE E — Polish (5810ddd)

  Power Grid UX refinements, CodeRabbit review fixes, a11y improvements
```

## What Was Built

### Pricing Hub

Template cards with service type tabs (Screen Print / DTF), search filter, and a "Create New Template" call-to-action. The entry point for all pricing configuration. Each card shows the template name, service type, last-modified date, and active/draft status.

`/settings/pricing`

### Setup Wizard

4-step guided flow: name and service type, quantity tiers, color pricing, review and create. Industry-standard defaults pre-filled at every step (standard break points at 12/24/48/72/144+, $25/screen setup, $0.50/color-hit base rate). A new shop owner can have pricing configured in under 5 minutes.

### Screen Print Editor

Simple Mode with 5 editing sections: ColorPricingGrid (quantity tiers x color counts), QuantityTierEditor (add/remove break points), LocationUpchargeEditor (front/back/sleeve/pocket), GarmentTypePricingEditor (t-shirt/hoodie/polo markup), and SetupFeeEditor (per-screen + bulk waiver). Real-time margin indicators (green/yellow/red) on every price cell with cost breakdown tooltips.

`/settings/pricing/screen-print/[id]`

### DTF Editor

DTFSheetTierEditor for sheet-size-based pricing with DTFPricingCalculator for customer discounts and rush fees. Supports multiple sheet sizes (8.5x11 through 24x36), film type surcharges, and volume discount tiers.

`/settings/pricing/dtf/[id]`

### Power Grid

TanStack Table spreadsheet with inline cell editing, keyboard navigation (arrow keys, Tab, Enter, Escape), cell selection with visual highlight, and column sorting. Toggle between Simple Mode and Power Mode via a switch in the editor header. Built on the `useSpreadsheetEditor` hook.

### Sandbox Mode

Toggle to enter experimental pricing mode. Make changes without affecting live prices. A ComparisonView modal shows side-by-side diff of current vs. proposed values with percentage change indicators. Apply all changes or discard and revert.

### Cost Configuration Sheet

Configure garment cost, ink cost per color, and overhead rate. These values feed margin calculations across all price cells in real time. Changes propagate instantly to margin indicators throughout the editor.

### Tag-Template Mapper

Map customer type tags (retail, wholesale, sports-school, corporate, storefront-merch) to pricing templates. When quoting a customer with tag "sports-school", the school pricing template auto-applies. Configured from the Pricing Hub.

### Matrix Peek Sheet

Read-only pricing preview accessible as a slide-in sheet from the Quote Detail page. Shows the pricing matrix relevant to the current quote's service type and customer tag, with a link to open the full editor.

## The useSpreadsheetEditor Widget

The crown jewel of the build — a reusable 777-line React hook that powers the Power Grid. It manages all keyboard, mouse, clipboard, and edit state for a TanStack Table-based spreadsheet.

### Architecture

```text
React Context (SpreadsheetContext)
  |
  +-- selectedCell    — which cell has focus
  +-- editingCell     — which cell is in edit mode
  +-- editValue       — current input value
  +-- handlers        — onCellClick, onCellDblClick, onKeyDown, onBlur
  |
PriceCell (extracted component)
  |
  Reads state from Context, NOT from column defs
  Column defs are module-level and stable (never recreated)
  |
TanStack Table
  |
  Stable column defs = no cell DOM recreation on state change
```

### Key Patterns

### 1. Stable Column Defs

**Problem:** Column defs that depend on interaction state cause cell DOM recreation on every keystroke, unmounting the edit input and losing focus.

**Fix:** React Context + extracted PriceCell component. Column defs stay module-level and never change.

TanStack Table uses column defs as a dependency for memoization. If the column def array identity changes, all cells re-render from scratch. When interaction state (selectedCell, editValue) was included in column def closures, every keystroke triggered a full table remount.

### 2. requestAnimationFrame Race Condition

**Problem:** mouseDown schedules rAF to focus the wrapper div. If dblclick fires before the rAF callback, the rAF steals focus from the edit input.

**Fix:** Ref mirror (editingCellRef) checked inside the rAF callback. If a cell entered edit mode between mouseDown and rAF execution, the focus call is skipped.

The sequence: mouseDown fires, schedules rAF. dblclick fires (same event chain), enters edit mode, focuses the input. rAF callback runs, calls wrapper.focus(), stealing focus from the input. The ref mirror breaks this cycle.

### 3. skipNextBlur Pattern

**Problem:** Keyboard commit (Enter/Tab) triggers a blur event on the input, causing a double-commit.

**Fix:** Set skipNextBlur.current = true before the keyboard commit. The blur handler checks this ref and skips its commit logic.

Enter/Tab both commit the edit value and move selection. The commit changes state, which causes the input to unmount, which fires blur. Without the skipNextBlur guard, the value would be committed twice.

### 4. editInputKeyDown Isolation

**Problem:** Keyboard events on the wrapper div interfere with text editing in the input field.

**Fix:** Attach editInputKeyDown directly to the input element with e.stopPropagation(). Handles Tab/Enter/Escape/Arrows in edit mode.

The wrapper div handles arrow key navigation for cell selection. When an input is active, arrow keys should move the cursor within the text, not change the selected cell. Stopping propagation at the input level prevents the wrapper handler from seeing these events.

### How to Reuse

```ts
const {
  selectedCell, editingCell, editValue,
  handleCellClick, handleCellDoubleClick,
  handleKeyDown, handleBlur, handleEditChange,
  setEditingCell, setEditValue
} = useSpreadsheetEditor({
  data,          // T[] — row data
  columns,       // ColumnDef[] — stable, module-level
  onCellChange,  // (rowIndex, colKey, value) => void
})
```

## Key Learnings

**Financial arithmetic:** Never use JavaScript floating-point (`+`, `-`, `*`, `/`) for monetary calculations. IEEE 754 causes silent errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). Use `big.js` via the `lib/helpers/money.ts` wrapper: `money()`, `round2()`, `toNumber()`. Schema invariants use `Big.eq()` for exact comparison.

### TanStack Table Column Def Stability

Column defs that depend on React state cause cell DOM recreation on every render. The entire table remounts, unmounting inputs and losing focus. Solution: React Context for interaction state, extracted cell components that subscribe to context, module-level column defs that never change identity.

### requestAnimationFrame Race Conditions

mouseDown + rAF + dblclick is a dangerous sequence. The rAF callback can execute after the dblclick handler has already changed state (e.g., entered edit mode). Always use ref mirrors to check current state inside rAF callbacks rather than relying on the values captured at scheduling time.

### Parallel Agent Builds

Three agents edited `editor.tsx` concurrently in Phase B and again in Phase C. This worked because changes were in different sections of the file. Lesson: always identify and document conflict zones before assigning parallel work. If two agents need to touch the same function, serialize them.

### Radix Tooltip Hover Bugs

Adjacent tooltips (like margin indicators in a dense grid) need a single shared `<TooltipProvider>` with `skipDelayDuration={300}`, base `sideOffset >= 6`, `data-[state=closed]:pointer-events-none` on content, and `pointer-events-none` on the arrow. Do NOT use `disableHoverableContent` — it causes flickering on small targets.

### React 19: No setState in Effects

ESLint now flags `useEffect` to reset form state when a dialog opens. Instead, have the parent conditionally render the dialog (`{showDialog && <Dialog />}`) so React unmounts/remounts the component, naturally resetting all `useState` hooks. Cleaner and avoids the flash of stale state.

## File Map

| File | Purpose |
|------|---------|
| `lib/schemas/price-matrix.ts` | Zod schemas for SP pricing (161 lines) |
| `lib/schemas/dtf-pricing.ts` | Zod schemas for DTF pricing (107 lines) |
| `lib/schemas/tag-template-mapping.ts` | Tag-to-template mapping schema (23 lines) |
| `lib/pricing-engine.ts` | Pure pricing calculation functions (568 lines) |
| `lib/helpers/money.ts` | big.js wrapper for safe money math |
| `lib/hooks/useSpreadsheetEditor.ts` | Spreadsheet editing hook (777 lines) |
| `app/.../settings/pricing/page.tsx` | Pricing Hub page |
| `app/.../pricing/screen-print/[id]/editor.tsx` | Screen Print Editor (client component) |
| `app/.../pricing/dtf/[id]/dtf-editor-client.tsx` | DTF Editor (client component) |
| `app/.../pricing/_components/` | All shared pricing components |

## PR and Commits

| Hash | Description |
|------|-------------|
| db27e22 | **Phase A** — Schemas, pricing engine, mock data, hub page |
| 8eb4bf0 | **Phase B** — Setup Wizard, Screen Print and DTF editors (15 files, +3,672 lines) |
| 166e9bc | **Phase C** — Sandbox Mode, Power Grid, Cost Config (6 files, +1,400 lines) |
| c6eca5a | **Phase D** — Tag-Template Mapper, Matrix Peek Sheet, big.js migration |
| e95bffc | Quality gate fixes — lint errors, semantic colors, a11y, empty states |
| eba7a95 | Power Grid UX — remove sort, per-cell overrides, selection enhancements |
| 7f697be | Configurable max colors, compact header layout |
| 3e6a095 | Add tooltips to margin legend in Power Grid header |
| f204c34 | CodeRabbit review — money helper, schema validation, a11y, guards |
| 5810ddd | CodeRabbit round 2 — maxColors consistency, a11y, input validation |

## Next Steps

1. **Matrix Peek from Quote Detail** — Partially built; needs the Quote Detail page to be wired up for full integration testing
2. **Tag-Template Mapping** — Built and functional; needs the Customer Management vertical to test the auto-apply flow during quoting
3. **Quality gate** — Full 15-dimension design audit against the screen audit protocol
4. **User demo with 4Ink** — Walk through the 5-minute setup wizard, margin indicators, what-if sandbox, and Power Grid editing
