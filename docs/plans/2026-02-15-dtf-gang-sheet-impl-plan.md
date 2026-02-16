# DTF Gang Sheet Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Build the DTF Gang Sheet Builder vertical — tabs, line items, sheet optimization algorithm, visual canvas, and DTF production steps — for the Feb 21 demo.

**Architecture:** Extends the existing quoting system (P2 / QuoteForm) with service-type tabs. DTF line items, sheet calculation, and canvas are new subplaces within P2. All state lives in QuoteForm (lifted from P2.4) so tab switching preserves data. Algorithm modules are pure functions in `lib/dtf/`.

**Tech Stack:** React state (no global store), Zod schemas, shadcn/ui components, SVG for canvas, big.js for cost arithmetic, Vitest for algorithm unit tests.

**Breadboard:** `docs/breadboards/dtf-gang-sheet-breadboard.md` (28 UI, 17 code, 9 data stores, 5 vertical slices)
**Shaping:** `docs/shaping/dtf-gang-sheet/shaping.md` (Shape D selected, 16 requirements)

---

## Wave 0: Foundation (Serial)

All sessions in this wave run one at a time. Establishes schemas, types, constants, and mock data that everything else depends on.

### Task 0.1: DTF Schemas, Constants & Mock Data

**Files to create/modify:**
- `lib/schemas/dtf-line-item.ts` — NEW: Zod schema for DTF line items
- `lib/dtf/dtf-constants.ts` — NEW: DTF_SIZE_PRESETS, DTF_TASK_TEMPLATE, DTF_SHEET_WIDTH
- `lib/mock-data.ts` — MODIFY: add DTF sheet tier mock data (consumes `dtfSheetTierSchema`)
- `lib/schemas/dtf-line-item.test.ts` — NEW: schema validation tests

**Steps:**

1. **Read** `docs/breadboards/dtf-gang-sheet-breadboard.md` sections: Data Stores (S21, S22, S25, S26), Code Affordances (N53)
2. **Read** `lib/schemas/dtf-pricing.ts` — understand existing `dtfSheetTierSchema`
3. **Read** `lib/schemas/quote.ts` — understand existing `serviceTypeEnum`, `quoteLineItemSchema`

4. **Create `lib/schemas/dtf-line-item.ts`:**
   ```
   dtfLineItemSchema = z.object({
     id: z.string().uuid(),
     artworkName: z.string(),           // Phase 1: free text
     sizePreset: z.enum(["small", "medium", "large", "custom"]),
     width: z.number().positive(),       // inches
     height: z.number().positive(),      // inches
     quantity: z.number().int().positive(),
   })
   ```
   Export type `DtfLineItem = z.infer<typeof dtfLineItemSchema>`

5. **Create `lib/schemas/dtf-sheet-calculation.ts`:**
   ```
   sheetCalculationSchema — matches S22 shape:
   {
     sheets: [{ tier: DTFSheetTier, designs: positioned[], utilization: number }],
     totalCost: number,
     totalSheets: number,
   }
   canvasLayoutSchema — matches S24 shape:
   {
     sheetWidth: number, sheetHeight: number,
     designs: [{ id, x, y, width, height, label }],
     margins: number,
   }
   ```

6. **Create `lib/dtf/dtf-constants.ts`:**
   - `DTF_SIZE_PRESETS` (S26): `[{label:'Small/Collectibles', shortLabel:'Small', width:4, height:4}, ...]`
   - `DTF_TASK_TEMPLATE` (N53): `[{name:'Gang sheet prepared'}, {name:'DTF printed'}, {name:'QC passed'}, {name:'Shipped'}]`
   - `DTF_SHEET_WIDTH = 22` (inches, fixed)
   - `DTF_DEFAULT_MARGIN = 1` (inches, recommended spacing)

7. **Modify `lib/mock-data.ts`:**
   - Add `dtfSheetTiers: DTFSheetTier[]` mock data with realistic pricing:
     - 22x12" ($8.99), 22x24" ($14.99), 22x36" ($19.99), 22x48" ($24.99), 22x60" ($29.99)
   - Export as named constant

8. **Write tests** in `lib/schemas/__tests__/dtf-line-item.test.ts`:
   - Valid DTF line item parses
   - Rejects zero/negative width, height, quantity
   - Size preset enum validation
   - Sheet calculation schema validates

9. **Run `npm test`** to verify all tests pass

**Produces:** DTF type system consumed by all subsequent waves.

---

## Wave 1: Tab Architecture (Serial)

Modifies QuoteForm.tsx — the most-modified file. Must run alone to avoid merge conflicts.

### Task 1.1: Service Type Tab Bar + QuoteForm State Lift

**Files to create/modify:**
- `app/(dashboard)/quotes/_components/ServiceTypeTabBar.tsx` — NEW
- `app/(dashboard)/quotes/_components/QuoteForm.tsx` — MODIFY: add tab state, wrap SP content, lift DTF state
- `components/ui/tabs.tsx` — verify shadcn tabs component exists (install if needed)

**Steps:**

1. **Read** breadboard V1 section (Tab Architecture), Connection Points table, reflection note on state placement
2. **Read** `QuoteForm.tsx` fully — understand current state, line items section structure
3. **Read** existing shadcn/ui tabs component

4. **Add state to QuoteForm** (S19, S20):
   - `const [activeServiceTab, setActiveServiceTab] = useState<ServiceType>("screen-print")`
   - `const [enabledServiceTypes, setEnabledServiceTypes] = useState<ServiceType[]>(["screen-print"])`
   - **CRITICAL (R1.2):** Also add DTF state placeholders here (NOT in DtfTabContent):
     - `const [dtfLineItems, setDtfLineItems] = useState<DtfLineItem[]>([])`
     - `const [sheetCalculation, setSheetCalculation] = useState<SheetCalculation | null>(null)`
     - `const [splitMode, setSplitMode] = useState<"combine" | "split">("combine")`
     - `const [canvasLayout, setCanvasLayout] = useState<CanvasLayout[] | null>(null)`
     - `const [activeSheetIndex, setActiveSheetIndex] = useState(0)`

5. **Create `ServiceTypeTabBar.tsx`** (U66-U70, N40-N42):
   - Props: `activeTab`, `enabledTypes`, `onTabSwitch`, `onAddType`, `tabValidation: Record<ServiceType, boolean>`
   - Renders horizontal tab bar with service type icons (Monitor for SP, Layers for DTF, Scissors for Embroidery)
   - Active tab underline indicator (U68)
   - Completion badges (U69) — checkmark icon when `tabValidation[type]` is true
   - "Add Service Type" dropdown (U70) — shows only types not in `enabledTypes`
   - Design: match existing shadcn/ui Tabs styling but custom (tab bar sits between customer picker and line items)

6. **Modify QuoteForm.tsx layout:**
   - Insert `<ServiceTypeTabBar>` between customer picker section and line items section
   - Wrap existing line items in `{activeServiceTab === "screen-print" && (<ScreenPrintContent />)}`
   - Add `{activeServiceTab === "dtf" && (<div className="text-muted-foreground text-center py-12">DTF content — coming in next wave</div>)}`
   - Embroidery shows "Coming soon" disabled state

7. **Update PricingSummary integration:**
   - N16 (calculateSubtotal) must now sum SP subtotal + DTF subtotal
   - Pass DTF subtotal (from sheetCalculation?.totalCost || 0) to PricingSummary

8. **Verify:** Tab switching preserves all SP form data (R1.2). Opening DTF tab and switching back doesn't lose SP line items.

**Produces:** Working tab navigation. DTF tab shows placeholder. SP form works identically to before.

---

## Wave 2: Parallel Feature Build

Three independent sessions. V2 and V5 touch different areas of the codebase. V3-algo is pure functions with no UI.

### Task 2.1: DTF Line Items + Size Presets (V2)

**Files to create/modify:**
- `app/(dashboard)/quotes/_components/DtfTabContent.tsx` — NEW
- `app/(dashboard)/quotes/_components/DtfLineItemRow.tsx` — NEW
- `app/(dashboard)/quotes/_components/QuoteForm.tsx` — MODIFY: wire DtfTabContent into DTF tab slot

**Steps:**

1. **Read** breadboard V2 section (DTF Line Items + Presets), UI affordances U71-U81, code affordances N43-N46, N54-N56
2. **Read** `lib/dtf/dtf-constants.ts` for DTF_SIZE_PRESETS
3. **Read** `lib/schemas/dtf-line-item.ts` for DtfLineItem type
4. **Read** existing `LineItemRow.tsx` for design pattern reference

5. **Create `DtfLineItemRow.tsx`** (U73-U80, N45-N46 per row):
   - Props: `item: DtfLineItem`, `onUpdate`, `onRemove`, `canRemove: boolean`
   - Artwork name text input (U73) — free text in Phase 1
   - Artwork thumbnail placeholder (U74) — grey box with ImageIcon
   - Size preset dropdown (U75) — Select component with DTF_SIZE_PRESETS + "Custom" option
   - Custom width/height inputs (U76, U77) — shown conditionally when preset = "custom"
   - Dimensions display (U78) — shows resolved "W" x H""
   - Quantity input (U79) — integer >= 1
   - Remove button (U80) — shown when canRemove=true (more than 1 row)
   - N46 resolveDimensions: when preset changes (not custom), auto-set width/height from DTF_SIZE_PRESETS

6. **Create `DtfTabContent.tsx`** (container for U71-U81):
   - Props: `lineItems`, `setLineItems`, `sheetCalculation`, `splitMode`, `setSplitMode`, `canvasLayout`, `activeSheetIndex`, `setActiveSheetIndex`, `setSheetCalculation`, `setCanvasLayout`
   - N43 addDtfLineItem: append `{id: crypto.randomUUID(), artworkName:'', width:0, height:0, quantity:1, sizePreset:'small'}` — then call resolveDimensions for default preset
   - N44 removeDtfLineItem: splice from array, trigger recalculation if sheetCalculation exists
   - "Add Design" button (U72)
   - DTF subtotal display (U81) — shows sheetCalculation?.totalCost or "--" if not calculated
   - Placeholder sections for Sheet Calculation and Canvas (filled in Wave 3/4)

7. **Wire into QuoteForm.tsx:**
   - Replace DTF tab placeholder with `<DtfTabContent>` passing lifted state as props
   - N54 calculateDtfSubtotal: `sheetCalculation?.totalCost ?? 0`
   - N55 mergeQuoteData: combine SP lineItems + DTF lineItems in save handler
   - N56 validateDtfTab: check >= 1 line item, each has artworkName + valid dimensions + qty >= 1
   - Wire N41 validateTabCompletion: SP tab uses existing validation; DTF tab uses N56

8. **Verify:** Add 3 designs with different sizes. Switch tabs — DTF data preserved. Subtotal shows $0 until calculation (Wave 3).

### Task 2.2: DTF Production Steps (V5)

**Files to create/modify:**
- `lib/dtf/dtf-constants.ts` — already has DTF_TASK_TEMPLATE from Wave 0
- Job card component(s) — MODIFY: conditional task rendering based on serviceType

**Steps:**

1. **Read** breadboard V5 section (DTF Production Steps), N53 getDtfTaskTemplate
2. **Read** `lib/dtf/dtf-constants.ts` for DTF_TASK_TEMPLATE
3. **Read** `lib/schemas/job.ts` for jobTaskSchema
4. **Find** existing job card component(s) that render task badges

5. **Implement N53** `getDtfTaskTemplate()`:
   - Utility function in `lib/dtf/dtf-constants.ts`
   - Returns task objects matching `jobTaskSchema` shape with DTF-specific labels
   - When `job.serviceType === "dtf"`, use DTF template instead of SP template

6. **Modify job card rendering:**
   - Where task badges are rendered, check `job.serviceType`
   - If "dtf" → show: Gang sheet prepared, DTF printed, QC passed, Shipped
   - If "screen-print" → show existing steps (Screen burned, Press setup, etc.)

7. **Verify mock data:** Existing DTF jobs in mock-data.ts (J-1025, J-1031, J-1034) already have DTF-style tasks. Confirm they render correctly.

8. **Verify:** DTF job cards show simplified 4-step workflow. SP job cards unchanged.

### Task 2.3: Sheet Calculation Algorithm (V3-algo)

**Files to create/modify:**
- `lib/dtf/shelf-pack.ts` — NEW: N48 shelfPack algorithm
- `lib/dtf/cost-optimize.ts` — NEW: N49 optimizeCost algorithm
- `lib/dtf/__tests__/shelf-pack.test.ts` — NEW: unit tests
- `lib/dtf/__tests__/cost-optimize.test.ts` — NEW: unit tests

**Steps:**

1. **Read** breadboard V3 section (Sheet Calculation), algorithm details for N48 and N49
2. **Read** `lib/schemas/dtf-line-item.ts` for input types
3. **Read** `lib/schemas/dtf-pricing.ts` for DTFSheetTier type
4. **Read** `lib/dtf/dtf-constants.ts` for DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN

5. **Create `lib/dtf/shelf-pack.ts`** (N48):
   ```typescript
   interface PackedDesign { id: string; x: number; y: number; width: number; height: number; label: string; }
   interface PackedSheet { designs: PackedDesign[]; usedHeight: number; }

   export function shelfPack(
     designs: Array<{ id: string; width: number; height: number; quantity: number; label: string }>,
     sheetWidth: number = 22,
     margin: number = 1
   ): PackedSheet[]
   ```
   Algorithm:
   a. Expand designs by quantity (Tiger x50 → 50 individual placements)
   b. Sort by height descending (tallest first for better packing)
   c. Place left-to-right: `x + width + margin <= sheetWidth` → place; else new shelf
   d. Place top-to-bottom: `y + height + margin <= currentSheetMaxHeight` → place; else new sheet
   e. For "combine" mode: all designs on fewest sheets. For "split" mode: each design type gets own sheet(s).
   f. Track `usedHeight` per sheet for tier matching
   g. Return array of PackedSheet with positioned designs

6. **Create `lib/dtf/cost-optimize.ts`** (N49):
   ```typescript
   interface OptimizedSheet { tier: DTFSheetTier; designs: PackedDesign[]; utilization: number; cost: number; }
   interface SheetCalculationResult { sheets: OptimizedSheet[]; totalCost: number; totalSheets: number; }

   export function optimizeCost(
     packedSheets: PackedSheet[],
     tiers: DTFSheetTier[],
     splitMode: "combine" | "split"
   ): SheetCalculationResult
   ```
   Algorithm:
   a. Sort tiers by length ascending
   b. For each packed sheet, find smallest tier where `tier.length >= usedHeight`
   c. Calculate utilization: `(usedArea / tierArea) * 100`
   d. Compare options: could 2 smaller sheets be cheaper than 1 larger? Try splitting.
   e. **Use `big.js`** for all cost arithmetic (CRITICAL — financial calculations)
   f. Return optimized assignments with per-sheet cost and total

7. **Write comprehensive unit tests:**
   - `shelf-pack.test.ts`:
     - Single design fits on one sheet
     - Multiple designs fill rows correctly
     - Overflow to second sheet when vertical space exceeded
     - Split mode separates design types
     - Margins enforced (1" between designs, 1" from edges)
     - Edge case: design wider than sheet (should still place, flag warning)
     - Edge case: 0 designs → empty result
   - `cost-optimize.test.ts`:
     - Picks cheapest tier that fits
     - Splitting is cheaper scenario (2x 22x24 < 1x 22x48)
     - Splitting is more expensive scenario (keeps combined)
     - Utilization percentage calculated correctly
     - Uses big.js for cost totals (no floating-point errors)

8. **Run `npm test`** — all algorithm tests pass

**Produces:** Pure function modules with no UI dependencies. Fully unit-tested. Ready to wire into UI in Wave 3.

---

## Wave 3: Integration (Parallel within wave)

Two sessions that wire Wave 2 outputs into the QuoteForm.

### Task 3.1: Sheet Calculation UI (V3-UI)

**Depends on:** Task 2.1 (DtfTabContent exists), Task 2.3 (algorithms exist)

**Files to create/modify:**
- `app/(dashboard)/quotes/_components/SheetCalculationPanel.tsx` — NEW
- `app/(dashboard)/quotes/_components/DtfTabContent.tsx` — MODIFY: wire in SheetCalculationPanel

**Steps:**

1. **Read** breadboard V3 section, UI affordances U82-U87, code affordances N47, N50
2. **Read** `lib/dtf/shelf-pack.ts` and `lib/dtf/cost-optimize.ts` — understand input/output types
3. **Read** `lib/mock-data.ts` — get dtfSheetTiers mock data

4. **Create `SheetCalculationPanel.tsx`** (U82-U87, N47, N50):
   - Props: `lineItems: DtfLineItem[]`, `sheetCalculation`, `setSheetCalculation`, `splitMode`, `setSplitMode`, `setCanvasLayout`, `tiers: DTFSheetTier[]`
   - "Calculate Layout" button (U82) — primary action, calls N47
   - Split/Combine toggle (U83) — radio group, default Combine
   - N47 `calculateSheetLayout()`:
     a. Map lineItems to shelfPack input format
     b. Call `shelfPack(designs, 22, 1)`
     c. Call `optimizeCost(packedSheets, tiers, splitMode)`
     d. Set sheetCalculation state (S22)
     e. Set canvasLayout state (S24) from packed positions
     f. Trigger subtotal recalculation
   - N50 `recalculateOnChange()`: when splitMode toggles AND calculation exists, re-run N47
   - Results display:
     - Sheet result cards (U84) — each sheet: tier label, dimensions, design count, price
     - Total sheets count (U85)
     - Total DTF cost (U86) — formatted with `formatCurrency()`
     - Utilization badges (U87) — percentage per sheet, color-coded (green >70%, yellow 40-70%, red <40%)

5. **Wire into DtfTabContent.tsx:**
   - Import SheetCalculationPanel
   - Place below line items section
   - Pass all relevant state props
   - Disable Calculate button when < 1 valid line item

6. **Verify:** Add designs, click Calculate, see results. Toggle Split/Combine — recalculates. Subtotal updates in pricing summary.

### Task 3.2: Save/Validate Integration (V2-integration)

**Depends on:** Task 1.1 (tab state in QuoteForm), Task 2.1 (DTF line items)

**Files to modify:**
- `app/(dashboard)/quotes/_components/QuoteForm.tsx` — MODIFY: save handler, validation

**Steps:**

1. **Read** breadboard Connection Points, N55 mergeQuoteData, N56 validateDtfTab, N41 validateTabCompletion
2. **Read** QuoteForm.tsx save handlers (look for existing save/send logic)

3. **Implement N55 mergeQuoteData** in save handler:
   - When saving, combine: SP line items (existing S6) + DTF line items (S21) + sheet calculation (S22)
   - Phase 1: toast success with merged data summary

4. **Implement N56 validateDtfTab:**
   - At least 1 DTF line item
   - Each line item: artworkName not empty, width > 0, height > 0, quantity >= 1
   - Sheet calculation exists (layout has been calculated)
   - Return `{ valid: boolean, errors: string[] }`

5. **Implement N41 validateTabCompletion:**
   - For each enabled service type, run its validator
   - SP: existing validation (has garment, has sizes, etc.)
   - DTF: N56
   - Update tab badges (U69) based on results

6. **Wire validation into save flow:**
   - Can't save unless all enabled tabs pass validation
   - Show toast with specific tab that has errors
   - Scroll to first error in the active tab

7. **Verify:** Try to save with incomplete DTF tab — blocked with error. Complete DTF tab — save succeeds. Mixed SP+DTF quote saves correctly.

---

## Wave 4: Visual Canvas (Serial)

### Task 4.1: Gang Sheet Canvas (V4)

**Depends on:** Task 3.1 (SheetCalculationPanel produces canvasLayout)

**Files to create/modify:**
- `app/(dashboard)/quotes/_components/GangSheetCanvas.tsx` — NEW
- `app/(dashboard)/quotes/_components/DtfTabContent.tsx` — MODIFY: wire in canvas

**Steps:**

1. **Read** breadboard V4 section (Visual Canvas), SVG structure from N51, affordances U88-U92
2. **Read** `lib/schemas/dtf-sheet-calculation.ts` for CanvasLayout type

3. **Create `GangSheetCanvas.tsx`** (U88-U92, N51-N52):
   - Props: `canvasLayout: CanvasLayout[]`, `activeSheetIndex`, `setActiveSheetIndex`, `sheetCalculation`
   - N52 `scaleToViewport()`: Calculate `pxPerInch = containerWidth / 22`. Use ResizeObserver on container.
   - N51 `generateCanvasSvg()`: Render SVG from canvasLayout[activeSheetIndex]:
     ```
     <svg viewBox="0 0 {scaledWidth} {scaledHeight}" className="w-full">
       <!-- Sheet boundary (U91) -->
       <rect class="sheet-border" stroke="border" fill="none" />
       <!-- Edge margin zones -->
       <rect class="margin-zone" fill="rgba(255,255,255,0.03)" />
       <!-- Design rectangles (U89) -->
       {designs.map(d => (
         <g transform={`translate(${d.x * scale}, ${d.y * scale})`}>
           <rect width={d.width * scale} height={d.height * scale}
                 fill="bg-surface" stroke="border" rx="4" />
           <text>{d.label}</text>
           <text className="dimensions">{d.width}" x {d.height}"</text>
         </g>
       ))}
       <!-- Spacing indicators (U90) -->
       <line stroke-dasharray="4 2" ... />
       <text>1"</text>
     </svg>
     ```
   - Multi-sheet tab bar (U92): Tabs labeled "Sheet 1", "Sheet 2", etc. Click switches activeSheetIndex.
   - Color-code design rectangles by design type (use a small palette of muted colors)
   - Show sheet dimensions label (e.g., "22" x 48"") in corner

4. **Wire into DtfTabContent.tsx:**
   - Show canvas below SheetCalculationPanel, only when canvasLayout exists
   - Pass activeSheetIndex state

5. **Styling:**
   - Canvas container: `bg-background border border-border rounded-lg p-4`
   - Design rectangles: muted fill colors (action/10, success/10, warning/10 cycling), border-border stroke
   - Spacing lines: dashed, text-muted-foreground
   - Sheet boundary: solid border-border
   - Responsive: SVG scales to container width via viewBox

6. **Verify:** After calculation, canvas appears. Shows designs positioned correctly. Multi-sheet tabs switch views. Resize window — canvas scales. Design labels readable.

---

## Summary

| Wave | Tasks | Sessions | Dependencies |
|------|-------|----------|--------------|
| 0 | 0.1: Schemas & constants | 1 (serial) | None |
| 1 | 1.1: Tab bar + state lift | 1 (serial) | Wave 0 |
| 2 | 2.1: Line items, 2.2: Prod steps, 2.3: Algorithm | 3 (parallel) | Wave 1 |
| 3 | 3.1: Calc UI, 3.2: Save/validate | 2 (parallel) | Wave 2 |
| 4 | 4.1: Canvas | 1 (serial) | Wave 3 |

**Total sessions:** 8
**Critical path:** 0.1 → 1.1 → 2.1 → 3.1 → 4.1 (5 sessions)
**Parallelization savings:** Wave 2 runs 3 sessions simultaneously; Wave 3 runs 2 simultaneously

**Demo target:** Feb 21 — full DTF quoting flow with visual gang sheet canvas
