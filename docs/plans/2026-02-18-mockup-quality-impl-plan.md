# Mockup Quality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace SVG polygon garment templates with photo-quality PNG images and add click-to-expand mockup viewers across the app.

**Architecture:** Two vertical slices — V1 (photo templates + tinting fix + zone recalibration), V2 (click-to-expand modal + sizing alignment). All changes are additive or minimal line edits on the existing SVG composition engine. DTF shape (Box/Round) is handled in a separate session.

**Tech Stack:** rembg (Python, CLI only), Next.js, shadcn/ui Dialog, Tailwind CSS, inline SVG

---

## BEFORE YOU START

Read these files once to orient:

- `src/features/quotes/components/mockup/GarmentMockup.tsx` — the SVG composition engine
- `src/domain/constants/print-zones.ts` — percentage-based zone geometry
- `src/features/quotes/components/mockup/GarmentMockupCard.tsx` — interactive front/back toggle
- `src/features/quotes/components/mockup/GarmentMockupThumbnail.tsx` — xs thumbnail wrapper
- `src/app/(dashboard)/quotes/_components/QuoteDetailView.tsx` — uses thumbnails in line items

---

## V1 — Photo Templates + Tinting Fix

### Task 1: Process images through rembg

**This is a shell task — no code changes. Run these commands from the project root.**

Four Gemini-generated t-shirt images are in `tmp/inbox/`. `rembg` removes the background (and any Gemini watermark artifacts since they sit outside the shirt silhouette), producing transparent PNGs.

```bash
pip3 install rembg[cli]

# Batch process all images
rembg p -i tmp/inbox -o tmp/outbox
```

After processing, open the output PNGs in a browser to confirm transparent backgrounds with clean shirt silhouettes.

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

**Verify:**

```bash
ls -la public/mockup-templates/t-shirts-*.png
```

> If rembg fails: try `python3 -m pip install rembg[cli]` or `pipx install rembg`.

**Commit:**

```bash
git add public/mockup-templates/t-shirts-*.png
git commit -m "feat(assets): add photo-quality t-shirt templates (white/black, front/back)"
```

---

### Task 2: Remove feColorMatrix filter from garment image element

**File:** `src/features/quotes/components/mockup/GarmentMockup.tsx`

**Context:** Line 116 applies a `filter` attribute that recolors the SVG polygon template via feColorMatrix. Photo templates are pre-generated in the correct color — no runtime tinting needed. Remove the attribute only; the `<defs>` block and `colorHex` prop stay for cleanup in issue #511.

**Step 1: Edit GarmentMockup.tsx**

Find lines 112–117:

```tsx
<image href={svgPath} width={viewBoxWidth} height={viewBoxHeight} filter={`url(#${filterId})`} />
```

Remove the `filter` prop:

```tsx
<image href={svgPath} width={viewBoxWidth} height={viewBoxHeight} />
```

**Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/features/quotes/components/mockup/GarmentMockup.tsx
git commit -m "feat(mockup): remove feColorMatrix filter from garment image element"
```

---

### Task 3: Add debug prop to GarmentMockup

**File:** `src/features/quotes/components/mockup/GarmentMockup.tsx`

The `debug` prop renders dashed amber overlays showing every print zone boundary for visual calibration. Never passed in production.

**Step 1: Add to `GarmentMockupProps` type** (after `viewBoxHeight?`):

```ts
/** Dev-only: renders dashed amber overlay showing print zone boundaries. */
debug?: boolean
```

**Step 2: Add to function signature** (with default `false`):

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

**Step 3: Add import for `getZonesForCategory`**

Current import line references `getZoneForPosition`. Extend it:

```ts
import { getZoneForPosition, getZonesForCategory } from '@domain/constants/print-zones'
```

**Step 4: Render debug overlays** — add after the `{resolvedPlacements.map(...)}` block, before the closing `</svg>`:

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

**Step 5: Type check**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/features/quotes/components/mockup/GarmentMockup.tsx
git commit -m "feat(mockup): add debug prop for print zone boundary overlay"
```

---

### Task 4: Recalibrate t-shirt print zones

**File:** `src/domain/constants/print-zones.ts`

**Context:** `front-chest` zone has `y: 18` — artwork appears near the collar with photo templates. Recalibrate by visual inspection using the debug prop.

**Step 1: Create a temporary calibration page**

Create `src/app/(dashboard)/debug-mockup/page.tsx`:

```tsx
import { GarmentMockup } from '@features/quotes/components/mockup/GarmentMockup'

export default function DebugMockupPage() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <h1 className="text-lg font-bold text-foreground">Print Zone Calibration</h1>
      <div className="flex flex-wrap gap-8">
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

**Step 2: Start dev server on a free port**

```bash
PORT=3009 npm run dev
```

Navigate to `http://localhost:3009/debug-mockup`.

**Step 3: Adjust `PRINT_ZONES['t-shirts']` in `print-zones.ts` (lines 93–103)**

Start with these estimates and iterate visually:

```ts
't-shirts': {
  front: [
    { position: 'front-chest', x: 28, y: 24, width: 44, height: 32 },  // y was 18
    { position: 'left-chest',  x: 54, y: 24, width: 16, height: 16 },  // y was 18
    { position: 'right-chest', x: 30, y: 24, width: 16, height: 16 },  // y was 18
    { position: 'full-front',  x: 22, y: 18, width: 56, height: 52 },  // y was 15
  ],
  back: [
    { position: 'full-back',   x: 22, y: 20, width: 56, height: 50 },
    { position: 'upper-back',  x: 25, y: 14, width: 50, height: 15 },  // y was 12
    { position: 'nape',        x: 42, y:  6, width: 16, height: 10 },  // y was 5
  ],
},
```

Adjust until each dashed amber box visually aligns with where ink would actually land on the shirt.

**Step 4: Delete the debug page**

```bash
rm -rf src/app/\(dashboard\)/debug-mockup
```

**Step 5: Run tests**

```bash
npm test
```

Expected: all pass.

**Step 6: Commit**

```bash
git add src/domain/constants/print-zones.ts
git commit -m "fix(zones): recalibrate t-shirt print zones for photo templates"
```

---

## V2 — Click-to-Expand Modal + Sizing

### Task 5: Build GarmentMockupModal component

**File to create:** `src/features/quotes/components/mockup/GarmentMockupModal.tsx`

**Step 1: Verify shadcn Dialog is installed**

```bash
ls src/shared/ui/primitives/dialog.tsx
```

If missing: `npx shadcn@latest add dialog`

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
 * Wraps any trigger element. On click, opens a full-size Dialog showing the
 * garment mockup with a front/back view toggle.
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

            {/* Front/Back view toggle */}
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

**Step 3: Export from mockup barrel**

Find `src/features/quotes/components/mockup/index.ts` (or wherever the barrel export lives). Add:

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

### Task 6: Wrap QuoteDetailView thumbnails + add lg mockup to slide-out

**File:** `src/app/(dashboard)/quotes/_components/QuoteDetailView.tsx`

> **Read the file first** before editing — understand the data shape. Look for how `garmentCategory`, `colorHex`, and `artworkPlacements` are sourced on quote line items and on any quote "detail" section.

**Step 1: Update imports**

```ts
import {
  MockupFilterProvider,
  GarmentMockupThumbnail,
  GarmentMockupModal,
  GarmentMockupCard,
} from '@features/quotes/components/mockup'
```

**Step 2: Wrap each `GarmentMockupThumbnail` in a modal trigger**

Find every `<GarmentMockupThumbnail ... />` and wrap it:

```tsx
<GarmentMockupModal
  garmentCategory={...same props...}
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

**Step 3: Add lg mockup to the slide-out review section**

Find the quote summary or review area in the slide-out panel. Add a `GarmentMockupCard` at size `lg` near the top of that section:

```tsx
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

Replace `mockupData` with whatever the actual variable/prop name is in this file.

**Step 4: Type check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/quotes/_components/QuoteDetailView.tsx
git commit -m "feat(quotes): click-to-expand thumbnails + lg mockup in slide-out review"
```

---

### Task 7: Add click-to-expand to job kanban cards

**File:** `src/app/(dashboard)/jobs/_components/JobCardBody.tsx`

> **Read the file first.** Find how garment/mockup data (garmentCategory, colorHex, artworkPlacements) is accessed from the job object.

**Step 1: Update import**

```ts
import { GarmentMockupThumbnail, GarmentMockupModal } from '@features/quotes/components/mockup'
```

**Step 2: Wrap the existing `GarmentMockupThumbnail`** with `GarmentMockupModal` using the same props.

**Step 3: Type check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/jobs/_components/JobCardBody.tsx
git commit -m "feat(jobs): add click-to-expand mockup modal to kanban job cards"
```

---

### Task 8: Add mockup to InvoiceDetailView

**File:** `src/app/(dashboard)/invoices/_components/InvoiceDetailView.tsx`

> **Read the file and `src/domain/entities/invoice.ts` first.** Look for a `mockup`, `garment`, or `job` field on the Invoice entity that carries garmentCategory/colorHex/artworkPlacements. If the invoice has a `jobId` reference, check the mock data layer for a lookup helper.

**Step 1: Import mockup components**

```ts
import { GarmentMockupCard } from '@features/quotes/components/mockup'
import type { GarmentCategory } from '@domain/entities/garment'
```

**Step 2: Add a `md`-size mockup** near the invoice header (alongside customer name / job reference):

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

> If the invoice entity has no mockup data at all, skip this task and note it as a follow-up. Do not fabricate data.

**Step 3: Type check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/invoices/_components/InvoiceDetailView.tsx
git commit -m "feat(invoices): add md-size garment mockup to invoice detail view"
```

---

### Task 9: Final verification + PR

**Step 1: Full test suite**

```bash
npm test
```

Expected: all pass.

**Step 2: Type check**

```bash
npx tsc --noEmit
```

**Step 3: Lint**

```bash
npm run lint
```

**Step 4: Build**

```bash
npm run build
```

**Step 5: Push**

```bash
git push -u origin session/0218-mockup-quality
```

**Step 6: Open PR**

```bash
gh pr create \
  --title "feat(mockup): photo templates, click-to-expand modal, zone recalibration" \
  --body "Resolves #505, #507. See design doc: docs/plans/2026-02-18-mockup-quality-design.md"
```

---

## Quick Reference

| Task | File                           | Key Change                                 |
| ---- | ------------------------------ | ------------------------------------------ |
| 1    | `public/mockup-templates/`     | 4 PNG assets via rembg                     |
| 2    | `GarmentMockup.tsx:116`        | Remove `filter=` prop                      |
| 3    | `GarmentMockup.tsx`            | Add `debug` prop + zone overlay            |
| 4    | `print-zones.ts:93`            | Recalibrate `y` values for photo templates |
| 5    | `GarmentMockupModal.tsx` (new) | shadcn Dialog wrapper                      |
| 6    | `QuoteDetailView.tsx`          | Wrap thumbnails in modal + lg slide-out    |
| 7    | `JobCardBody.tsx`              | Wrap thumbnail in modal                    |
| 8    | `InvoiceDetailView.tsx`        | Add md mockup                              |
| 9    | —                              | Test, lint, build, push, PR                |
