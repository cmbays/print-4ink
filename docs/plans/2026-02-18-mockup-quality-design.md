# Mockup Quality — Design Document

> **Date**: 2026-02-18
> **Status**: Approved
> **Phase**: Phase 1
> **Extends**: `2026-02-14-garment-mockup-design.md` (SVG Composition Engine)
> **Scope**: Garment mockup templates + gang sheet canvas visual polish + click-to-expand + sizing alignment

---

## Problem

The current garment mockup implementation uses SVG polygon outlines that look unrealistic — customers cannot evaluate artwork placement from vector outlines. The gang sheet canvas shows grey margin overlays that imply designs are crowded together (misleading — the 1" margin is already enforced in the algorithm). Mockup sizes across the app are inconsistent and several key contexts (invoice, quote slide-out) have no mockup at all.

Additionally, the `feColorMatrix` tinting chain is dead code now that we're moving to photo templates — photos are pre-generated in target colors, not recolored at render time.

---

## Goals

1. **Photo templates** — replace SVG polygons with Gemini-generated PNG ghost mannequin images, processed through `rembg` for transparent backgrounds
2. **Minimal tinting change** — remove the `filter` attribute on the `<image>` element (one line); defer full dead-code cleanup to post-demo ticket #511
3. **Print zone recalibration** — add a `debug` prop to `GarmentMockup`, use Playwright screenshot to visually align `PRINT_ZONES['t-shirts']` with new templates
4. **Safe zone visual** — replace grey margin overlays on gang sheet canvas with a dashed amber boundary at 1" from edges
5. **Box/Round shape** — add `shape` field to `DtfLineItem` with a segmented toggle; render circles/ellipses in the canvas
6. **Click-to-expand modal** — wrap `GarmentMockup` in a shadcn `Dialog` for in-app fullscreen review
7. **Sizing alignment** — standardize mockup sizes across all app contexts per approved table

---

## Out of Scope (Post-Demo — Issue #511)

- Deleting `MockupFilterProvider`, `feColorMatrix` SVG filter definitions, and the `colorHex` prop
- Removing the `filter` attribute from the `<defs>` block
- Additional garment colorways or styles beyond the 4 provided images

---

## Architecture

The existing `GarmentMockup` SVG composition engine is the correct foundation. No rendering layer change is needed. All changes are additive or minimal line edits.

```
public/mockup-templates/
  t-shirts-front-white.png   ← rembg-processed, transparent background
  t-shirts-back-white.png
  t-shirts-front-black.png
  t-shirts-back-black.png

src/domain/constants/print-zones.ts
  PRINT_ZONES['t-shirts']   ← recalibrate x/y/width/height after template swap

src/domain/entities/dtf-line-item.ts
  + shape: z.enum(['box', 'round']).default('box')

src/domain/entities/dtf-sheet-calculation.ts
  canvasDesignSchema + shape field (propagated from line item)

src/features/quotes/components/mockup/
  GarmentMockup.tsx          ← remove filter attr (1 line); add debug prop
  GarmentMockupModal.tsx     ← NEW: shadcn Dialog wrapper
  MockupFilterProvider.tsx   ← untouched (cleanup deferred to #511)

src/app/(dashboard)/quotes/_components/
  GangSheetCanvas.tsx        ← dashed amber safe zone + ellipse rendering
  DtfLineItemRow.tsx         ← Box/Round segmented toggle
```

---

## Section 1 — Photo Templates

### Image Pipeline

Four Gemini-generated ghost mannequin images are in `tmp/inbox/`:
| File | Colorway | View |
|---|---|---|
| `Gemini_Generated_Image_eegat2eega.png` | White | Front |
| `Gemini_Generated_Image_rz18oirz18.png` | White | Back |
| `Gemini_Generated_Image_y6ow7ty6ow.png` | Black | Front |
| `Gemini_Generated_Image_g2ausag2au.png` | Black | Back |

**Processing pipeline:**

```bash
pip3 install rembg[cli]
rembg p -i tmp/inbox/ -o tmp/outbox/
```

`rembg` removes the background (and any Gemini watermark/text artifacts since they appear outside the shirt silhouette). Output PNGs go to `public/mockup-templates/` with clean names.

**Why `rembg` not manual masking**: ML model handles fabric edge anti-aliasing automatically, produces consistent transparent PNGs, and processes all 4 images in one command.

### Template Selection Logic

`GarmentMockup` receives a `templatePath` prop (already exists). The mock data layer supplies the path. For Phase 1, the mapping is:

- White shirts → `t-shirts-front-white.png` / `t-shirts-back-white.png`
- Black shirts → `t-shirts-front-black.png` / `t-shirts-back-black.png`
- Other colors → fall back to white template (acceptable for demo)

### Minimal Tinting Change

Remove `filter={...}` from the garment `<image>` element in `GarmentMockup.tsx`. This is a one-attribute deletion — the feColorMatrix infrastructure stays in place for cleanup in #511.

**Before:**

```tsx
<image href={templatePath} filter={`url(#${filterId})`} ... />
```

**After:**

```tsx
<image href={templatePath} ... />
```

---

## Section 2 — Print Zone Recalibration

### Debug Prop

Add `debug?: boolean` prop to `GarmentMockup`. When true, render the print zone boundary as a dashed amber rectangle overlay on the SVG. This is a dev-only visual — not exposed in production UI.

```tsx
{
  debug && (
    <rect
      x={zone.x}
      y={zone.y}
      width={zone.width}
      height={zone.height}
      fill="none"
      stroke="amber"
      strokeWidth={1}
      strokeDasharray="4 2"
      className="pointer-events-none"
    />
  )
}
```

### Calibration Method

1. Render `<GarmentMockup debug templatePath="t-shirts-front-white.png" />` in a test page
2. Take Playwright screenshot
3. Visually adjust `PRINT_ZONES['t-shirts']['front-chest']` x/y/width/height values
4. Re-screenshot until the dashed box aligns with the realistic print area on the shirt photo

Current values (need adjustment):

```ts
'front-chest': { x: 28, y: 18, width: 44, height: 35 }
```

The `y: 18` is too high — artwork appears near the collar. Expect `y` to increase to ~22–26 after calibration.

---

## Section 3 — Gang Sheet Canvas Visual Polish

### Safe Zone Boundary (Replace Grey Overlays)

The current grey overlay rectangles flush against the first design are visually misleading — they look like designs are crammed together. The 1" margin is already enforced algorithmically.

**Replace with**: A single dashed amber rectangle inset 1" from all four sheet edges. This communicates "safe zone" — designs that cross this line are clipped by the printer.

```tsx
// Safe zone rect (amber dashed, 1" inset on all sides)
<rect
  x={margin * scale}
  y={margin * scale}
  width={(sheetWidth - 2 * margin) * scale}
  height={(sheetHeight - 2 * margin) * scale}
  fill="none"
  stroke="var(--warning)" // amber token
  strokeWidth={1}
  strokeDasharray="6 3"
  className="pointer-events-none"
/>
```

Remove the existing grey overlay rendering code entirely.

### Circle / Oval Shape Rendering

When a design has `shape: 'round'`, render an `<ellipse>` instead of a `<rect>`. The ellipse fits inside the design's bounding box (cx/cy at center, rx = width/2, ry = height/2).

```tsx
{design.shape === 'round' ? (
  <ellipse
    cx={(design.x + design.width / 2) * scale}
    cy={(design.y + design.height / 2) * scale}
    rx={(design.width / 2) * scale}
    ry={(design.height / 2) * scale}
    fill={color}
    stroke={...}
  />
) : (
  <rect ... />
)}
```

Circle = equal width/height. Oval = unequal. Same rendering path handles both.

---

## Section 4 — Box / Round Shape on Line Item

### Schema Changes

**`dtf-line-item.ts`:**

```ts
export const dtfShapeEnum = z.enum(['box', 'round'])
export const dtfLineItemSchema = z.object({
  ...existing fields...
  shape: dtfShapeEnum.default('box'),
})
```

**`dtf-sheet-calculation.ts`** (`canvasDesignSchema`):

```ts
shape: z.enum(['box', 'round']).default('box'),
```

**`dtf.service.ts`** (`PackedDesign`, `DesignInput`): add `shape` field, propagate through `shelfPack`.

### UI — Segmented Toggle in DtfLineItemRow

Add a segmented toggle (two buttons styled as a pill) alongside the size preset dropdown. Labels: "Box" and "Round". Clicking sets `shape` on the line item.

```
[ Box | Round ]
```

The toggle uses the existing `onUpdate(item.id, 'shape', value)` pattern. No new state management needed.

---

## Section 5 — Click-to-Expand Modal

### GarmentMockupModal Component

New `GarmentMockupModal.tsx` wraps the existing `GarmentMockup` in a shadcn `Dialog`:

```tsx
export function GarmentMockupModal({ children, ...mockupProps }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <GarmentMockup size="lg" {...mockupProps} />
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
          <Button variant="ghost" size="sm">
            Front →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

Trigger = the thumbnail itself (cursor-pointer, subtle ring on hover). No separate button needed.

### Quote Slide-Out Review

Add a `<GarmentMockup size="lg" />` to the quote slide-out panel. This is a new addition — no mockup currently exists there.

---

## Section 6 — Sizing Alignment

Approved sizing table across all app contexts:

| Context                | Size | Change           | Notes                       |
| ---------------------- | ---- | ---------------- | --------------------------- |
| Kanban card            | `xs` | none             | Gets click-to-modal trigger |
| Job card (expanded)    | `md` | bump from `xs`   | More room in expanded state |
| Quote slide-out review | `lg` | **new addition** | Customer approval context   |
| Job detail page        | `lg` | none             | Gets click-to-modal         |
| Invoice                | `md` | **new addition** | Professional appearance     |
| Garments browse card   | `md` | none             | Inline — click-to-modal     |

---

## Implementation Slices

### V1 — Photo Templates + Tinting (Foundation)

- Process 4 images through `rembg`
- Copy to `public/mockup-templates/`
- Remove `filter` attribute from `GarmentMockup.tsx`
- Add `debug` prop
- Recalibrate `PRINT_ZONES['t-shirts']`

### V2 — Gang Sheet Canvas Polish

- Replace grey overlays with dashed amber safe zone
- Propagate `shape` field through `DtfLineItem` → `canvasDesignSchema` → `shelfPack`
- Add Box/Round segmented toggle in `DtfLineItemRow`
- Render ellipse for `shape: 'round'` in `GangSheetCanvas`

### V3 — Click-to-Expand + Sizing

- Build `GarmentMockupModal`
- Update sizing in Kanban card, job card, job detail, garments browse card
- Add mockup to quote slide-out review
- Add mockup to invoice page

---

## Quality Checks

- [ ] `rembg` output has clean transparent backgrounds (verify in browser)
- [ ] Artwork rendered with `mix-blend-mode: multiply` (already in implementation)
- [ ] Print zone visible in debug mode and hidden in production
- [ ] Safe zone dashes use `text-warning` amber token (not hardcoded color)
- [ ] Ellipse rendering is visually centered in bounding box
- [ ] Box/Round toggle updates `sizePreset` correctly in mock data layer
- [ ] Click-to-expand uses shadcn `Dialog` (z-50, proper backdrop)
- [ ] All new sizes match the approved sizing table
- [ ] Mobile: all touch targets ≥ 44px, click-to-expand works on touch
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes (schema tests cover new `shape` field)

---

## Linked Issues

- #505 — Garment Mockup Quality (epic)
- #506 — Gang Sheet Canvas (separate session)
- #507 — Asset pipeline / garment templates
- #511 — Post-demo cleanup (dead code removal)
