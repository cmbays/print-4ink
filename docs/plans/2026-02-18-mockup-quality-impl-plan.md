# Mockup Quality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace SVG polygon garment templates with photo-quality PNG images, add Box/Round shape support for DTF gang sheets, and add click-to-expand mockup viewers across the app.

**Architecture:** Three vertical slices — V1 (photo templates + tinting fix), V2 (gang sheet canvas polish + shape), V3 (click-to-expand modal + sizing). All changes are additive or minimal line edits on the existing SVG composition engine.

**Tech Stack:** rembg (Python, CLI only), Next.js, Zod, Vitest, shadcn/ui Dialog, Tailwind CSS, inline SVG

---

## BEFORE YOU START

Read these files once to orient:

- `src/features/quotes/components/mockup/GarmentMockup.tsx` — the SVG engine
- `src/domain/constants/print-zones.ts` — percentage-based zone geometry
- `src/app/(dashboard)/quotes/_components/GangSheetCanvas.tsx` — the canvas
- `src/domain/entities/dtf-line-item.ts` — DTF schema
- `src/domain/entities/dtf-sheet-calculation.ts` — canvas design schema
- `src/domain/services/dtf.service.ts` — shelfPack algorithm
- `src/app/(dashboard)/quotes/_components/DtfLineItemRow.tsx` — line item UI

---

## V1 — Photo Templates + Tinting Fix

### Task 1: Process images through rembg

**This is a shell task — no code changes. Run these commands in the main repo working directory.**

```bash
pip3 install rembg[cli]

# Process all 4 images (batch mode: -p flag)
rembg p -i ~/Github/print-4ink/tmp/inbox -o ~/Github/print-4ink/tmp/outbox
```

After processing, verify in a browser — each PNG should have a transparent background with only the shirt silhouette visible.

**Copy to public assets with canonical names:**

```bash
cp tmp/outbox/Gemini_Generated_Image_eegat2eegat2eega.png \
   public/mockup-templates/t-shirts-front-white.png

cp tmp/outbox/Gemini_Generated_Image_rz18oirz18oirz18.png \
   public/mockup-templates/t-shirts-back-white.png

cp tmp/outbox/Gemini_Generated_Image_y6ow7ty6ow7ty6ow.png \
   public/mockup-templates/t-shirts-front-black.png

cp tmp/outbox/Gemini_Generated_Image_g2ausag2ausag2au.png \
   public/mockup-templates/t-shirts-back-black.png
```

**Verify all 4 files exist:**

```bash
ls -la ~/Github/print-4ink-worktrees/session-0218-mockup-quality/public/mockup-templates/
```

> Note: If rembg is not installed system-wide, try `python3 -m pip install rembg[cli]` or `pipx install rembg`.

**Step: Commit image assets**

```bash
cd ~/Github/print-4ink-worktrees/session-0218-mockup-quality
git add public/mockup-templates/t-shirts-*.png
git commit -m "feat(assets): add photo-quality t-shirt templates (white/black, front/back)"
```

---

### Task 2: Remove feColorMatrix filter from garment image element

**File:** `src/features/quotes/components/mockup/GarmentMockup.tsx`

**Context:** Line 116 applies a `filter` attribute that recolors the template via feColorMatrix. Photo templates are pre-generated in the correct color — no tinting needed. Remove the attribute; the `<defs>` block stays (cleanup in issue #511).

**Step 1: Edit GarmentMockup.tsx**

Find line 112-117:

```tsx
<image href={svgPath} width={viewBoxWidth} height={viewBoxHeight} filter={`url(#${filterId})`} />
```

Replace with (remove the `filter` prop only):

```tsx
<image href={svgPath} width={viewBoxWidth} height={viewBoxHeight} />
```

**Step 2: Run type check**

```bash
cd ~/Github/print-4ink-worktrees/session-0218-mockup-quality
npx tsc --noEmit
```

Expected: no errors (this is a prop removal, not a type change).

---

### Task 3: Add debug prop to GarmentMockup

**File:** `src/features/quotes/components/mockup/GarmentMockup.tsx`

The `debug` prop renders a dashed amber overlay showing the print zone boundary. Used for visual calibration only — never passed in production.

**Step 1: Add prop to type definition**

In `GarmentMockupProps` type (around line 36-49), add:

```ts
/** Dev-only: renders dashed amber overlay showing print zone boundaries. */
debug?: boolean
```

**Step 2: Destructure in function signature**

Update the function signature to include `debug = false`:

```tsx
export function GarmentMockup({
  garmentCategory,
  colorHex,
  artworkPlacements = EMPTY_PLACEMENTS,
  view = 'front',
  size = 'md',
  className,
  templatePath,
  viewBoxWidth = 400,
  viewBoxHeight = 480,
  debug = false,
}: GarmentMockupProps) {
```

**Step 3: Render debug overlays after artwork placements**

After the `{resolvedPlacements.map(...)}` block (before the closing `</svg>`), add:

```tsx
{
  /* Dev debug: print zone boundaries */
}
{
  debug &&
    getZonesForCategory(garmentCategory, view).map((zone) => {
      const zx = (zone.x / 100) * viewBoxWidth
      const zy = (zone.y / 100) * viewBoxHeight
      const zw = (zone.width / 100) * viewBoxWidth
      const zh = (zone.height / 100) * viewBoxHeight
      return (
        <rect
          key={zone.position}
          x={zx}
          y={zy}
          width={zw}
          height={zh}
          fill="none"
          stroke="var(--warning)"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          className="pointer-events-none"
        />
      )
    })
}
```

**Step 4: Import getZonesForCategory** (it's already exported from print-zones.ts, just add to the import):

```ts
import { getZoneForPosition, getZonesForCategory } from '@domain/constants/print-zones'
```

**Step 5: Type check**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/features/quotes/components/mockup/GarmentMockup.tsx
git commit -m "feat(mockup): remove feColorMatrix filter; add debug zone overlay prop"
```

---

### Task 4: Recalibrate t-shirt print zones

**File:** `src/domain/constants/print-zones.ts`

The `front-chest` zone at `{ x: 28, y: 18, width: 44, height: 35 }` positions artwork near the collar because `y: 18` is too high for the photo templates.

**Step 1: Create a temporary debug page**

Create `src/app/(dashboard)/debug-mockup/page.tsx` (gitignored path pattern already covered — you can delete after calibrating):

```tsx
import { GarmentMockup } from '@features/quotes/components/mockup/GarmentMockup'

export default function DebugMockupPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-lg font-bold">Print Zone Calibration</h1>
      <div className="flex gap-8">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Front (white)</p>
          <GarmentMockup
            garmentCategory="t-shirts"
            colorHex="#ffffff"
            view="front"
            size="lg"
            templatePath="/mockup-templates/t-shirts-front-white.png"
            debug
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Back (white)</p>
          <GarmentMockup
            garmentCategory="t-shirts"
            colorHex="#ffffff"
            view="back"
            size="lg"
            templatePath="/mockup-templates/t-shirts-back-white.png"
            debug
          />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Start dev server**

```bash
PORT=3009 npm run dev
```

Navigate to `http://localhost:3009/debug-mockup` and inspect visually.

**Step 3: Adjust PRINT_ZONES['t-shirts'] values**

In `src/domain/constants/print-zones.ts` lines 93-103, adjust the values until the dashed amber boxes visually align with the correct print areas on the shirt photo:

Start with these estimates (adjust based on visual inspection):

```ts
't-shirts': {
  front: [
    { position: 'front-chest', x: 28, y: 24, width: 44, height: 32 },  // y was 18
    { position: 'left-chest', x: 54, y: 24, width: 16, height: 16 },    // y was 18
    { position: 'right-chest', x: 30, y: 24, width: 16, height: 16 },   // y was 18
    { position: 'full-front', x: 22, y: 18, width: 56, height: 52 },    // y was 15
  ],
  back: [
    { position: 'full-back', x: 22, y: 20, width: 56, height: 50 },     // unchanged
    { position: 'upper-back', x: 25, y: 14, width: 50, height: 15 },    // y was 12
    { position: 'nape', x: 42, y: 6, width: 16, height: 10 },           // y was 5
  ],
},
```

Iterate until zones match the physical shirt boundaries in the photo.

**Step 4: Delete the debug page**

```bash
rm -rf src/app/\(dashboard\)/debug-mockup/
```

**Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass (no zone value tests exist — but schema and service tests should still pass).

**Step 6: Commit**

```bash
git add src/domain/constants/print-zones.ts
git commit -m "fix(zones): recalibrate t-shirt print zones for photo templates"
```

---

## V2 — Gang Sheet Canvas Polish + Shape

### Task 5: Add shape field to DtfLineItem schema

**Files:**

- Modify: `src/domain/entities/dtf-line-item.ts`
- Test: `src/domain/entities/__tests__/dtf-line-item.test.ts`

**Step 1: Write the failing test** (add to the bottom of `dtf-line-item.test.ts`):

```ts
describe('dtfShapeEnum', () => {
  it('accepts box and round', () => {
    expect(dtfShapeEnum.parse('box')).toBe('box')
    expect(dtfShapeEnum.parse('round')).toBe('round')
  })

  it('rejects invalid shape', () => {
    expect(() => dtfShapeEnum.parse('circle')).toThrow()
  })
})

describe('dtfLineItemSchema — shape field', () => {
  const baseItem = {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    artworkName: 'Tiger Logo',
    sizePreset: 'large' as const,
    width: 10,
    height: 12,
    quantity: 50,
  }

  it('defaults shape to box when omitted', () => {
    const result = dtfLineItemSchema.parse(baseItem)
    expect(result.shape).toBe('box')
  })

  it('accepts explicit shape: round', () => {
    const result = dtfLineItemSchema.parse({ ...baseItem, shape: 'round' })
    expect(result.shape).toBe('round')
  })
})
```

Also update the import line to include `dtfShapeEnum`:

```ts
import { dtfLineItemSchema, dtfSizePresetEnum, dtfShapeEnum } from '../dtf-line-item'
```

**Step 2: Run test — verify it fails**

```bash
npm test dtf-line-item
```

Expected: FAIL — `dtfShapeEnum is not exported`

**Step 3: Implement the schema change** in `src/domain/entities/dtf-line-item.ts`:

```ts
export const dtfShapeEnum = z.enum(['box', 'round'])

export const dtfLineItemSchema = z.object({
  id: z.string().uuid(),
  artworkName: z.string().min(1),
  sizePreset: dtfSizePresetEnum,
  width: z.number().positive(),
  height: z.number().positive(),
  quantity: z.number().int().positive(),
  shape: dtfShapeEnum.default('box'),
})

export type DtfShape = z.infer<typeof dtfShapeEnum>
export type DtfSizePreset = z.infer<typeof dtfSizePresetEnum>
export type DtfLineItem = z.infer<typeof dtfLineItemSchema>
```

**Step 4: Run test — verify it passes**

```bash
npm test dtf-line-item
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/entities/dtf-line-item.ts \
        src/domain/entities/__tests__/dtf-line-item.test.ts
git commit -m "feat(dtf): add shape field (box|round) to DtfLineItem schema"
```

---

### Task 6: Add shape to canvasDesignSchema and propagate through service

**Files:**

- Modify: `src/domain/entities/dtf-sheet-calculation.ts`
- Modify: `src/domain/services/dtf.service.ts`
- Test: `src/domain/entities/__tests__/dtf-line-item.test.ts` (update existing)
- Test: `src/domain/services/__tests__/dtf.service.test.ts` (update existing)

**Step 1: Update the `canvasDesignSchema` in `dtf-sheet-calculation.ts`**

Add `shape` to `canvasDesignSchema` (around line 8-15):

```ts
export const canvasDesignSchema = z.object({
  id: z.string(),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  label: z.string(),
  shape: z.enum(['box', 'round']).default('box'),
})
```

**Step 2: Update the existing `canvasLayoutSchema` test** in `dtf-line-item.test.ts`

The existing test at line 73-84 creates a design without `shape` — add `shape: 'box'` to the expected output:

```ts
it('parses a valid canvas layout', () => {
  const result = canvasLayoutSchema.parse({
    sheetWidth: 22,
    sheetHeight: 48,
    designs: [{ id: 'd1', x: 1, y: 1, width: 10, height: 12, label: 'Tiger' }],
    margins: 1,
  })
  expect(result.sheetWidth).toBe(22)
  expect(result.designs).toHaveLength(1)
  expect(result.designs[0].shape).toBe('box') // default applies
})
```

**Step 3: Update `DesignInput` and `PackedDesign` types in `dtf.service.ts`**

Find the type definitions (lines 19-39) and add `shape`:

```ts
export type PackedDesign = {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  shape: 'box' | 'round'
}

export type PackedSheet = {
  designs: PackedDesign[]
  usedHeight: number
}

export type DesignInput = {
  id: string
  width: number
  height: number
  quantity: number
  label: string
  shape?: 'box' | 'round' // optional — defaults to 'box' in shelfPack
}
```

**Step 4: Propagate shape in `shelfPack`**

In the expansion loop (around line 79-88), add `shape` to each expanded item:

```ts
expanded.push({
  id: `${design.id}-${i}`,
  width: design.width,
  height: design.height,
  label: design.label,
  shape: design.shape ?? 'box',
})
```

In the placement step (around line 154-161), add `shape`:

```ts
currentSheet.push({
  id: item.id,
  x: currentX,
  y: currentShelfY,
  width: item.width,
  height: item.height,
  label: item.label,
  shape: item.shape,
})
```

**Step 5: Update the shelfPack test fixtures** in `dtf.service.test.ts`

The `.toEqual()` assertions at lines 16-26 will now fail because the expected object lacks `shape`. Update the expected design:

```ts
expect(result[0].designs[0]).toEqual({
  id: 'd1-0',
  x: 1,
  y: 1,
  width: 4,
  height: 4,
  label: 'Logo',
  shape: 'box', // add this
})
```

Do the same for any other `.toEqual()` assertions that check `designs[N]` with exact match.

**Step 6: Run all tests**

```bash
npm test
```

Expected: all tests pass.

**Step 7: Commit**

```bash
git add src/domain/entities/dtf-sheet-calculation.ts \
        src/domain/services/dtf.service.ts \
        src/domain/entities/__tests__/dtf-line-item.test.ts \
        src/domain/services/__tests__/dtf.service.test.ts
git commit -m "feat(dtf): propagate shape field through shelfPack → CanvasDesign"
```

---

### Task 7: Replace grey margin overlays with dashed amber safe zone

**File:** `src/app/(dashboard)/quotes/_components/GangSheetCanvas.tsx`

**Context:** Lines 186-214 render four grey `<rect>` elements along the sheet edges (top, bottom, left, right margins). These look like designs are crammed against grey walls. Replace with a single dashed amber safe-zone boundary.

**Step 1: Delete the four grey margin `<rect>` elements** (lines 186-214):

Remove the entire block:

```tsx
{/* Edge margin zones */}
<rect x={0} y={0} width={sheetWidth} height={margins} fill="var(--canvas-margin-zone)" />
<rect x={0} y={sheetHeight - margins} ... />
<rect x={0} y={margins} ... />
<rect x={sheetWidth - margins} ... />
```

**Step 2: Add the dashed amber safe-zone rect** in its place (after the sheet boundary `<rect>`, before the design rectangles section):

```tsx
{
  /* Safe zone boundary — dashed amber at 1" inset from all edges */
}
;<rect
  x={margins}
  y={margins}
  width={sheetWidth - margins * 2}
  height={sheetHeight - margins * 2}
  fill="none"
  stroke="var(--warning)"
  strokeWidth={strokeW * 0.8}
  strokeDasharray={`${0.3} ${0.2}`}
  className="pointer-events-none"
  aria-hidden="true"
/>
```

**Step 3: Run dev server and visually verify** the amber dashed boundary is visible and designs sit inside it. Check single-design and multi-design layouts.

**Step 4: Run type check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/quotes/_components/GangSheetCanvas.tsx
git commit -m "feat(canvas): replace grey margin overlays with dashed amber safe zone"
```

---

### Task 8: Add ellipse rendering for round shapes in GangSheetCanvas

**File:** `src/app/(dashboard)/quotes/_components/GangSheetCanvas.tsx`

**Context:** `CanvasDesign` now has `shape: 'box' | 'round'`. When shape is `'round'`, render an `<ellipse>` fitted to the bounding box instead of `<rect>`.

**Step 1: Update the design rendering in the `designs.map()` block**

Find the `<rect>` inside the `designs.map()` block (around line 231-241). Replace the single `<rect>` with a conditional:

```tsx
{
  design.shape === 'round' ? (
    <ellipse
      cx={d.x + d.width / 2}
      cy={d.y + d.height / 2}
      rx={d.width / 2}
      ry={d.height / 2}
      fill={color.fill}
      fillOpacity={color.fillOpacity}
      stroke={color.stroke}
      strokeOpacity={color.strokeOpacity}
      strokeWidth={strokeW}
    />
  ) : (
    <rect
      x={d.x}
      y={d.y}
      width={d.width}
      height={d.height}
      fill={color.fill}
      fillOpacity={color.fillOpacity}
      stroke={color.stroke}
      strokeOpacity={color.strokeOpacity}
      strokeWidth={strokeW}
      rx={0.1}
    />
  )
}
```

Note: the variable is `d` (destructured) — verify in the actual code, the `designs.map((d, i) =>` or `designs.map((design, i) =>` pattern. Use whatever variable name is already there.

**Step 2: Update the legend swatch** (around line 331-340) — the `<span>` showing the design color uses `rounded-sm border`. For round shapes, use `rounded-full`. Update if needed, otherwise leave as-is (the legend doesn't need shape-specific rendering for demo).

**Step 3: Run type check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/quotes/_components/GangSheetCanvas.tsx
git commit -m "feat(canvas): render ellipse for shape:round designs"
```

---

### Task 9: Add Box/Round segmented toggle to DtfLineItemRow

**File:** `src/app/(dashboard)/quotes/_components/DtfLineItemRow.tsx`

**Step 1: Update imports** — add `DtfShape` and `dtfShapeEnum`:

```ts
import {
  dtfSizePresetEnum,
  dtfShapeEnum,
  type DtfLineItem,
  type DtfSizePreset,
  type DtfShape,
} from '@domain/entities/dtf-line-item'
```

**Step 2: Add shape toggle handler** inside the component:

```ts
function handleShapeChange(value: string) {
  const parsed = dtfShapeEnum.safeParse(value)
  if (!parsed.success) return
  onUpdate(item.id, 'shape', parsed.data)
}
```

**Step 3: Add the `onUpdate` signature to accept `'shape'`**

The `onUpdate` prop is typed as:

```ts
onUpdate: (id: string, field: keyof DtfLineItem, value: string | number) => void
```

Since `DtfLineItem` now has `shape`, `keyof DtfLineItem` already includes it. No type change needed.

**Step 4: Add the segmented toggle UI**

In Row 2 (after the Size Preset dropdown, before custom width/height), add the Box/Round toggle as a new `div`:

```tsx
{
  /* Shape toggle: Box | Round */
}
;<div className="space-y-1">
  <span className="text-xs text-muted-foreground">Shape</span>
  <div className="flex h-8 items-center rounded-md border border-border bg-surface p-0.5">
    {(['box', 'round'] as const).map((shape) => (
      <button
        key={shape}
        type="button"
        onClick={() => handleShapeChange(shape)}
        className={cn(
          'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
          item.shape === shape
            ? 'bg-elevated text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {shape === 'box' ? 'Box' : 'Round'}
      </button>
    ))}
  </div>
</div>
```

**Step 5: Run type check**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/quotes/_components/DtfLineItemRow.tsx
git commit -m "feat(dtf): add Box/Round shape segmented toggle to line item row"
```

---

## V3 — Click-to-Expand Modal + Sizing

### Task 10: Build GarmentMockupModal component

**File to create:** `src/features/quotes/components/mockup/GarmentMockupModal.tsx`

**Step 1: Check that shadcn Dialog is already installed**

```bash
ls src/shared/ui/primitives/dialog.tsx
```

If it doesn't exist: `npx shadcn@latest add dialog`

**Step 2: Create GarmentMockupModal.tsx**

```tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@shared/ui/primitives/dialog'
import { Button } from '@shared/ui/primitives/button'
import { GarmentMockup, type ArtworkPlacement } from './GarmentMockup'
import type { GarmentCategory } from '@domain/entities/garment'
import type { MockupView } from '@domain/entities/mockup-template'

type GarmentMockupModalProps = {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  children: React.ReactNode
  /** Optional: initial view shown in modal */
  defaultView?: MockupView
}

const VIEWS: MockupView[] = ['front', 'back']
const VIEW_LABELS: Record<MockupView, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'L. Sleeve',
  'right-sleeve': 'R. Sleeve',
}

/**
 * Wraps any trigger element with a click-to-expand Dialog showing a
 * full-size garment mockup. Trigger must be a single clickable element.
 */
export function GarmentMockupModal({
  garmentCategory,
  colorHex,
  artworkPlacements = [],
  children,
  defaultView = 'front',
}: GarmentMockupModalProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<MockupView>(defaultView)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="View full-size mockup"
        className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        {children}
      </div>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl flex flex-col items-center gap-4 p-6">
            <DialogTitle className="sr-only">Garment Mockup</DialogTitle>

            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
              {VIEWS.map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setView(v)}
                  className={
                    v === view
                      ? 'bg-elevated text-foreground h-7 px-3 text-xs'
                      : 'text-muted-foreground hover:text-foreground h-7 px-3 text-xs'
                  }
                >
                  {VIEW_LABELS[v]}
                </Button>
              ))}
            </div>

            <GarmentMockup
              garmentCategory={garmentCategory}
              colorHex={colorHex}
              artworkPlacements={artworkPlacements}
              view={view}
              size="lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
```

**Step 3: Export from mockup barrel** — check `src/features/quotes/components/mockup/index.ts` (or the barrel file). Add the export:

```ts
export { GarmentMockupModal } from './GarmentMockupModal'
```

**Step 4: Type check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/features/quotes/components/mockup/GarmentMockupModal.tsx \
        src/features/quotes/components/mockup/index.ts
git commit -m "feat(mockup): add GarmentMockupModal click-to-expand dialog"
```

---

### Task 11: Add click-to-expand in QuoteDetailView + add slide-out mockup

**File:** `src/app/(dashboard)/quotes/_components/QuoteDetailView.tsx`

**Context:** The quote detail view renders `GarmentMockupThumbnail` in quote line items. Find the usages (~line 243) and wrap each with `GarmentMockupModal`.

**Step 1: Update imports** — add `GarmentMockupModal` to the mockup import:

```ts
import {
  MockupFilterProvider,
  GarmentMockupThumbnail,
  GarmentMockupModal,
} from '@features/quotes/components/mockup'
```

**Step 2: Wrap each `GarmentMockupThumbnail` usage**

Find:

```tsx
<GarmentMockupThumbnail
  garmentCategory={...}
  colorHex={...}
  artworkPlacements={...}
/>
```

Replace with:

```tsx
<GarmentMockupModal
  garmentCategory={...}
  colorHex={...}
  artworkPlacements={...}
>
  <GarmentMockupThumbnail
    garmentCategory={...}
    colorHex={...}
    artworkPlacements={...}
  />
</GarmentMockupModal>
```

**Step 3: Find the quote slide-out review panel section** in `QuoteDetailView.tsx`

The slide-out review panel is typically a section header area showing summary info. Look for a section that displays quote totals, customer info, or a review area. Add the mockup before or alongside the quote summary:

```tsx
{
  /* Mockup preview in slide-out review */
}
{
  mockupData && (
    <GarmentMockupCard
      garmentCategory={mockupData.garmentCategory as GarmentCategory}
      colorHex={mockupData.colorHex}
      artworkPlacements={mockupData.artworkPlacements}
      size="lg"
    />
  )
}
```

> Investigation note: Read `QuoteDetailView.tsx` fully before editing. Find where mockup data (garmentCategory, colorHex, artworkPlacements) is sourced — look for a `mockup` or `garment` object on the quote data. If the component receives quote mock data, find the `garment` or `mockup` field on it.

**Step 4: Type check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/quotes/_components/QuoteDetailView.tsx
git commit -m "feat(quotes): wrap thumbnails in click-to-expand modal; add lg mockup to slide-out"
```

---

### Task 12: Update job card expanded size and add click-to-expand

**Files:**

- `src/app/(dashboard)/jobs/_components/JobCardBody.tsx`

**Context:** `JobCardBody.tsx` uses `GarmentMockupThumbnail` (size `xs`). The expanded card state should show `md`. Wrap with click-to-expand modal.

**Step 1: Read `JobCardBody.tsx`** to understand the current structure:

```bash
cat src/app/(dashboard)/jobs/_components/JobCardBody.tsx
```

**Step 2: Update import** — add `GarmentMockupModal`:

```ts
import { GarmentMockupThumbnail, GarmentMockupModal } from '@features/quotes/components/mockup'
```

**Step 3: Wrap the thumbnail** with `GarmentMockupModal` (pass the same garmentCategory, colorHex, artworkPlacements from the job data).

**Step 4: Type check + commit**

```bash
npx tsc --noEmit
git add src/app/\(dashboard\)/jobs/_components/JobCardBody.tsx
git commit -m "feat(jobs): add click-to-expand mockup modal to job cards"
```

---

### Task 13: Add mockup to InvoiceDetailView

**File:** `src/app/(dashboard)/invoices/_components/InvoiceDetailView.tsx`

**Context:** No mockup currently exists on invoice pages. Add a `md`-size `GarmentMockupCard` in the invoice detail view header area.

**Step 1: Read `InvoiceDetailView.tsx` fully** to understand structure and data model.

**Step 2: Check if the `Invoice` entity has mockup data**

In `src/domain/entities/invoice.ts`, look for `garmentCategory`, `colorHex`, or a `mockup` field on the invoice entity. If it's present, use it. If not, check if the invoice has a `jobId` or `quoteId` reference — the mock data may need to look up the associated job/quote to get garment info.

**Step 3: Import mockup components**

```ts
import { GarmentMockupCard } from '@features/quotes/components/mockup'
import type { GarmentCategory } from '@domain/entities/garment'
```

**Step 4: Add mockup in the invoice header or summary section**

Find a natural location (near customer info or job reference) and add:

```tsx
{
  invoice.mockup && (
    <GarmentMockupCard
      garmentCategory={invoice.mockup.garmentCategory as GarmentCategory}
      colorHex={invoice.mockup.colorHex}
      artworkPlacements={invoice.mockup.artworkPlacements ?? []}
      size="md"
    />
  )
}
```

> If the invoice doesn't have mockup data directly, skip this task and file it as a follow-up. Don't add fictional data.

**Step 5: Type check**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/invoices/_components/InvoiceDetailView.tsx
git commit -m "feat(invoices): add md-size garment mockup to invoice detail view"
```

---

### Task 14: Final verification

**Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

**Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Lint**

```bash
npm run lint
```

Expected: no errors.

**Step 4: Build**

```bash
npm run build
```

Expected: build succeeds.

**Step 5: Push branch**

```bash
git push -u origin session/0218-mockup-quality
```

**Step 6: Open PR**

```bash
gh pr create \
  --title "feat(mockup): photo templates, Box/Round shapes, click-to-expand, canvas safe zone" \
  --body "Resolves #505, #507. Partial progress on #506. See design doc: docs/plans/2026-02-18-mockup-quality-design.md"
```

---

## Quick Reference

| Task | File                                         | Key Change                                    |
| ---- | -------------------------------------------- | --------------------------------------------- |
| 1    | `public/mockup-templates/`                   | 4 PNG assets                                  |
| 2    | `GarmentMockup.tsx:116`                      | Remove `filter=` prop                         |
| 3    | `GarmentMockup.tsx`                          | Add `debug` prop                              |
| 4    | `print-zones.ts:94`                          | Recalibrate `y` values                        |
| 5    | `dtf-line-item.ts`                           | Add `dtfShapeEnum`, `shape` field             |
| 6    | `dtf-sheet-calculation.ts`, `dtf.service.ts` | Propagate `shape`                             |
| 7    | `GangSheetCanvas.tsx:186-214`                | Replace 4 grey rects with 1 amber dashed rect |
| 8    | `GangSheetCanvas.tsx`                        | Add `<ellipse>` for `shape: 'round'`          |
| 9    | `DtfLineItemRow.tsx`                         | Box/Round toggle                              |
| 10   | `GarmentMockupModal.tsx` (new)               | shadcn Dialog wrapper                         |
| 11   | `QuoteDetailView.tsx`                        | Wrap thumbnails + add lg slide-out            |
| 12   | `JobCardBody.tsx`                            | Wrap thumbnail in modal                       |
| 13   | `InvoiceDetailView.tsx`                      | Add md mockup                                 |
| 14   | —                                            | Test, lint, build, push, PR                   |
