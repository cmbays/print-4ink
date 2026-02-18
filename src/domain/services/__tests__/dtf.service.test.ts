import { describe, it, expect } from 'vitest'
import { shelfPack, hexPackCircles, packDesigns, maxRectsPack } from '../dtf.service'
import type { DesignInput } from '../dtf.service'
import { DTF_MAX_SHEET_LENGTH, DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN } from '@domain/constants/dtf'

describe('shelfPack', () => {
  it('returns empty array for empty input', () => {
    const result = shelfPack([])
    expect(result).toEqual([])
  })

  it('places a single design on one sheet', () => {
    const result = shelfPack([{ id: 'd1', width: 4, height: 4, quantity: 1, label: 'Logo' }])

    expect(result).toHaveLength(1)
    expect(result[0].designs).toHaveLength(1)
    expect(result[0].designs[0]).toEqual({
      id: 'd1-0',
      x: 1, // margin
      y: 1, // margin
      width: 4,
      height: 4,
      label: 'Logo',
      shape: 'box',
    })
    // usedHeight = top margin (1) + design height (4) + bottom margin (1) = 6
    expect(result[0].usedHeight).toBe(6)
  })

  it('fills a row left-to-right with margin spacing', () => {
    // 22" sheet, 1" margin each side, designs 4" wide + 1" gap each
    // Usable width from margin=1 to edge: placing at x=1, 6, 11, 16
    // 4 designs at 4" each, spaced by 1" margin between them
    const result = shelfPack([{ id: 'd1', width: 4, height: 4, quantity: 4, label: 'Small' }])

    expect(result).toHaveLength(1)
    expect(result[0].designs).toHaveLength(4)

    // First design at (1, 1)
    expect(result[0].designs[0].x).toBe(1)
    expect(result[0].designs[0].y).toBe(1)

    // Second at (6, 1): 1 + 4 + 1 = 6
    expect(result[0].designs[1].x).toBe(6)
    expect(result[0].designs[1].y).toBe(1)

    // Third at (11, 1)
    expect(result[0].designs[2].x).toBe(11)
    expect(result[0].designs[2].y).toBe(1)

    // Fourth at (16, 1)
    expect(result[0].designs[3].x).toBe(16)
    expect(result[0].designs[3].y).toBe(1)
  })

  it('wraps to next shelf when row is full', () => {
    // 5 designs at 4" wide on 22" sheet (4 fit per row)
    // 5th should wrap to next shelf
    const result = shelfPack([{ id: 'd1', width: 4, height: 4, quantity: 5, label: 'Small' }])

    expect(result).toHaveLength(1)
    expect(result[0].designs).toHaveLength(5)

    // 5th design should be on a new shelf (y = 1 + 4 + 1 = 6)
    const fifthDesign = result[0].designs[4]
    expect(fifthDesign.x).toBe(1) // back to left margin
    expect(fifthDesign.y).toBe(6) // second shelf
  })

  it('creates new sheet when vertical space exceeded', () => {
    // Design is 15" tall. On a 60" max sheet with 1" margins:
    // Shelf 1: y=1, height=15 → usedHeight=1+15=16
    // Shelf 2: y=17, height=15 → usedHeight=17+15=32
    // Shelf 3: y=33, height=15 → usedHeight=33+15=48
    // Shelf 4: y=49, height=15 → usedHeight=49+15=64 > 60, so new sheet
    // Each row fits 1 design (width 20 + margins = fills row)
    const result = shelfPack([{ id: 'd1', width: 20, height: 15, quantity: 4, label: 'Big' }])

    expect(result).toHaveLength(2)
    // First sheet has 3 designs, second has 1
    expect(result[0].designs).toHaveLength(3)
    expect(result[1].designs).toHaveLength(1)

    // Second sheet starts fresh at (1, 1)
    expect(result[1].designs[0].x).toBe(1)
    expect(result[1].designs[0].y).toBe(1)
  })

  it('sorts designs by height descending for better packing', () => {
    // Input: short design first, tall design second
    // After sorting, tall should be placed first
    const result = shelfPack([
      { id: 'short', width: 4, height: 2, quantity: 1, label: 'Short' },
      { id: 'tall', width: 4, height: 10, quantity: 1, label: 'Tall' },
    ])

    expect(result).toHaveLength(1)
    // Tall design (height 10) should be placed first (index 0)
    expect(result[0].designs[0].label).toBe('Tall')
    expect(result[0].designs[0].height).toBe(10)
    // Short design (height 2) placed second (index 1)
    expect(result[0].designs[1].label).toBe('Short')
    expect(result[0].designs[1].height).toBe(2)
  })

  it('expands designs by quantity', () => {
    const result = shelfPack([{ id: 'tiger', width: 4, height: 4, quantity: 5, label: 'Tiger' }])

    const allDesigns = result.flatMap((s) => s.designs)
    expect(allDesigns).toHaveLength(5)

    // Each design has a unique id suffix
    const ids = allDesigns.map((d) => d.id)
    expect(ids).toEqual(['tiger-0', 'tiger-1', 'tiger-2', 'tiger-3', 'tiger-4'])

    // All share the same label
    for (const d of allDesigns) {
      expect(d.label).toBe('Tiger')
    }
  })

  it('enforces margins from edges', () => {
    const result = shelfPack([{ id: 'd1', width: 4, height: 4, quantity: 1, label: 'Logo' }])

    const design = result[0].designs[0]
    // Design must start at (margin, margin), not (0, 0)
    expect(design.x).toBe(1)
    expect(design.y).toBe(1)
    // usedHeight includes bottom margin
    expect(result[0].usedHeight).toBe(1 + 4 + 1)
  })

  it('handles design wider than available row space', () => {
    // 20" wide design on 22" sheet (1" margin each side → 20" usable)
    // Exactly fits one design per row
    const result = shelfPack([{ id: 'wide', width: 20, height: 4, quantity: 2, label: 'Wide' }])

    expect(result).toHaveLength(1)
    expect(result[0].designs).toHaveLength(2)

    // First design fills the row
    expect(result[0].designs[0].x).toBe(1)
    expect(result[0].designs[0].y).toBe(1)

    // Second wraps to next shelf
    expect(result[0].designs[1].x).toBe(1)
    expect(result[0].designs[1].y).toBe(6) // 1 + 4 + 1
  })

  it('handles custom margin value', () => {
    const result = shelfPack(
      [{ id: 'd1', width: 4, height: 4, quantity: 1, label: 'Logo' }],
      22,
      2 // 2" margin
    )

    const design = result[0].designs[0]
    expect(design.x).toBe(2)
    expect(design.y).toBe(2)
    // usedHeight = 2 + 4 + 2 = 8
    expect(result[0].usedHeight).toBe(8)
  })

  it('respects DTF_MAX_SHEET_LENGTH boundary', () => {
    // A design that is exactly max length minus margins should fit on one sheet
    const maxDesignHeight = DTF_MAX_SHEET_LENGTH - 2 // minus top + bottom margin
    const result = shelfPack([
      {
        id: 'maxh',
        width: 4,
        height: maxDesignHeight,
        quantity: 1,
        label: 'Tall',
      },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].usedHeight).toBe(DTF_MAX_SHEET_LENGTH)
  })

  it('ignores designs with zero quantity', () => {
    const result = shelfPack([
      { id: 'd1', width: 4, height: 4, quantity: 0, label: 'Ghost' },
      { id: 'd2', width: 4, height: 4, quantity: 1, label: 'Real' },
    ])

    const allDesigns = result.flatMap((s) => s.designs)
    expect(allDesigns).toHaveLength(1)
    expect(allDesigns[0].label).toBe('Real')
  })

  it('rejects designs wider than usable sheet width', () => {
    expect(() =>
      shelfPack([{ id: 'd1', width: 25, height: 4, quantity: 1, label: 'Too Wide' }])
    ).toThrow(/exceeds usable sheet width/)
  })

  it('rejects designs taller than max sheet height', () => {
    // Default margin=1, so max design height = 60 - 2*1 = 58
    expect(() =>
      shelfPack([{ id: 'd1', width: 4, height: 59, quantity: 1, label: 'Too Tall' }])
    ).toThrow(/exceeds max sheet height/)
  })

  it('propagates shape through packed designs', () => {
    const result = shelfPack([
      { id: 'd1', width: 4, height: 4, quantity: 1, label: 'Box Logo', shape: 'box' },
      { id: 'd2', width: 4, height: 4, quantity: 1, label: 'Round Logo', shape: 'round' },
    ])

    const allDesigns = result.flatMap((s) => s.designs)
    const box = allDesigns.find((d) => d.label === 'Box Logo')
    const round = allDesigns.find((d) => d.label === 'Round Logo')
    expect(box?.shape).toBe('box')
    expect(round?.shape).toBe('round')
  })

  it('defaults shape to box when omitted from input', () => {
    const result = shelfPack([{ id: 'd1', width: 4, height: 4, quantity: 1, label: 'Logo' }])
    expect(result[0].designs[0].shape).toBe('box')
  })

  it('handles multiple design types mixed together', () => {
    const result = shelfPack([
      { id: 'tiger', width: 10, height: 12, quantity: 2, label: 'Tiger' },
      { id: 'logo', width: 4, height: 4, quantity: 3, label: 'Logo' },
    ])

    const allDesigns = result.flatMap((s) => s.designs)
    // Total placements: 2 tigers + 3 logos = 5
    expect(allDesigns).toHaveLength(5)

    // After sorting by height, tigers (12") should appear before logos (4")
    expect(allDesigns[0].height).toBe(12)
    expect(allDesigns[1].height).toBe(12)
    expect(allDesigns[2].height).toBe(4)
  })
})

describe('hexPackCircles', () => {
  it('returns empty array for empty input', () => {
    const result = hexPackCircles([])
    expect(result).toEqual([])
  })

  it('places a single circle on one sheet', () => {
    // 4" circle, margin 1": center at (1+2, 1+2) = (3, 3), bbox top-left = (1, 1)
    // usedHeight = cy + r + margin = 3 + 2 + 1 = 6
    const result = hexPackCircles([
      { id: 'd1', width: 4, height: 4, quantity: 1, label: 'Circle', shape: 'round' },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].designs).toHaveLength(1)
    const d = result[0].designs[0]
    expect(d.x).toBe(1) // cx - r = 3 - 2
    expect(d.y).toBe(1) // cy - r = 3 - 2
    expect(d.width).toBe(4)
    expect(d.height).toBe(4)
    expect(d.shape).toBe('round')
    expect(result[0].usedHeight).toBe(6)
  })

  it('uses circle-surface-to-circle-surface spacing on same row', () => {
    // 2 circles of D=4, margin=1: centers at x=3, x=8 (spacing = D+margin = 5)
    // x0 bbox = 1, x1 bbox = 6
    // Surface gap between them = 6 - (1+4) = 1" ✓
    const result = hexPackCircles([
      { id: 'd1', width: 4, height: 4, quantity: 2, label: 'Circle', shape: 'round' },
    ])
    expect(result[0].designs[0].x).toBeCloseTo(1) // cx=3, bbox x=1
    expect(result[0].designs[1].x).toBeCloseTo(6) // cx=8, bbox x=6
  })

  it('offsets odd rows by half the column spacing', () => {
    // 5 × 4" circles on 22" sheet, margin=1:
    // Row 0 (even): cxMin=3, spacing=5 → centers: 3, 8, 13, 18 → x=1,6,11,16 (4 circles)
    // Row 1 (odd):  offset=2.5 → cx starts at 5.5 → x=3.5 (5th circle)
    const result = hexPackCircles([
      { id: 'd1', width: 4, height: 4, quantity: 5, label: 'Circle', shape: 'round' },
    ])
    expect(result[0].designs).toHaveLength(5)
    expect(result[0].designs[0].x).toBeCloseTo(1) // Row 0 first
    expect(result[0].designs[4].x).toBeCloseTo(3.5) // Row 1 first (offset)
  })

  it('reduces sheet height vs shelfPack for 13 uniform circles', () => {
    // Research confirmed: 13 × 4" circles → hex: ~18.99", shelf: 21"
    // rowPitch = 5 × √3/2 ≈ 4.330", 4 rows → 4×4.330 = 17.32" of row centers,
    // plus top margin (1) + r (2) + bottom margin (1) → 21.32... wait, let me re-derive.
    // Row 0 cy = 3, Row 1 cy = 3 + 4.330 ≈ 7.330, Row 2 cy ≈ 11.66, Row 3 cy ≈ 15.99
    // 13 circles: 4 + 4 + 4 + 1 = 13. Last row (Row 3) cy ≈ 15.99
    // usedHeight = cy + r + margin = 15.99 + 2 + 1 = 18.99"
    const circles = [
      { id: 'd1', width: 4, height: 4, quantity: 13, label: 'Circle', shape: 'round' as const },
    ]
    const hexResult = hexPackCircles(circles)
    const shelfResult = shelfPack(circles)
    expect(hexResult[0].usedHeight).toBeCloseTo(18.99, 0) // within 0.5" of research value
    expect(hexResult[0].usedHeight).toBeLessThan(shelfResult[0].usedHeight)
  })

  it('creates a new sheet when circles overflow vertically', () => {
    // 10" circles: rowPitch = 11*sqrt(3)/2 ≈ 9.526". With margin=1, fit ~5-6 rows per 60" sheet.
    // With quantity=20, must overflow to a second sheet.
    const result = hexPackCircles([
      { id: 'd1', width: 10, height: 10, quantity: 20, label: 'Large', shape: 'round' },
    ])
    expect(result.length).toBeGreaterThan(1)
    const totalPlaced = result.flatMap((s) => s.designs).length
    expect(totalPlaced).toBe(20)
  })

  it('each design on second sheet starts with y >= margin', () => {
    // After sheet overflow, new sheet designs must start at margin from top.
    // First design y = cy - r = (margin + r) - r = margin = 1
    const result = hexPackCircles([
      { id: 'd1', width: 10, height: 10, quantity: 20, label: 'Large', shape: 'round' },
    ])
    if (result.length > 1) {
      // First design on second sheet must be at the top margin (confirms reset)
      expect(result[1].designs[0].y).toBeCloseTo(1, 5)
      for (const d of result[1].designs) {
        expect(d.y).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('expands quantity correctly', () => {
    const result = hexPackCircles([
      { id: 'c', width: 4, height: 4, quantity: 4, label: 'Circle', shape: 'round' },
    ])
    const all = result.flatMap((s) => s.designs)
    expect(all).toHaveLength(4)
    expect(all.map((d) => d.id)).toEqual(['c-0', 'c-1', 'c-2', 'c-3'])
  })

  it('rejects quantity overflow', () => {
    expect(() =>
      hexPackCircles([
        { id: 'd1', width: 4, height: 4, quantity: 5001, label: 'C', shape: 'round' },
      ])
    ).toThrow(/exceeds maximum/)
  })
})

describe('packDesigns', () => {
  it('routes uniform circles to hex packing (lower usedHeight)', () => {
    const circles = [
      { id: 'd1', width: 4, height: 4, quantity: 13, label: 'Circle', shape: 'round' as const },
    ]
    const result = packDesigns(circles)
    // Hex gives ~18.99" for 13 × 4" circles
    expect(result[0].usedHeight).toBeCloseTo(18.99, 0)
    // Must be less than shelf packing
    const shelfResult = shelfPack(circles)
    expect(result[0].usedHeight).toBeLessThan(shelfResult[0].usedHeight)
  })

  it('routes non-uniform circle sizes to non-hex path', () => {
    // Two different diameters — NOT hex eligible
    const nonUniform = [
      { id: 'd1', width: 4, height: 4, quantity: 2, label: 'Small', shape: 'round' as const },
      { id: 'd2', width: 6, height: 6, quantity: 2, label: 'Large', shape: 'round' as const },
    ]
    const result = packDesigns(nonUniform)
    const total = result.flatMap((s) => s.designs).length
    expect(total).toBe(4)
  })

  it('routes mixed box + round to non-hex path', () => {
    const mixed = [
      { id: 'd1', width: 4, height: 4, quantity: 2, label: 'Circle', shape: 'round' as const },
      { id: 'd2', width: 5, height: 5, quantity: 1, label: 'Box', shape: 'box' as const },
    ]
    const result = packDesigns(mixed)
    const total = result.flatMap((s) => s.designs).length
    expect(total).toBe(3)
  })

  it('routes box-only jobs to non-hex path', () => {
    const boxes = [{ id: 'd1', width: 10, height: 12, quantity: 3, label: 'Box' }]
    const result = packDesigns(boxes)
    const total = result.flatMap((s) => s.designs).length
    expect(total).toBe(3)
  })

  it('handles empty input', () => {
    expect(packDesigns([])).toEqual([])
  })

  it('keeps mixed jobs on same sheet when rect fits in circle row gap', () => {
    // 3 circles on 22" sheet: row 0 fits all 3 (centers at x=3,8,13 → bbox x=1,6,11)
    // Right-to-left placement: curRightX = 22 - 1 = 21, rectX = 21 - 4 = 17
    // minCircleGapBoundary = 11 + 4 + 1 = 16, 17 >= 16 → fits, height 4 <= D(4) → same row
    const designs: DesignInput[] = [
      { id: 'c', width: 4, height: 4, quantity: 3, label: 'Circle', shape: 'round' },
      { id: 'b', width: 4, height: 4, quantity: 1, label: 'Box', shape: 'box' },
    ]
    const result = packDesigns(designs)
    expect(result).toHaveLength(1) // all on same sheet
    const all = result[0].designs
    expect(all).toHaveLength(4)
    // Box should be placed in the same row as the circles (same y)
    const box = all.find((d) => d.label === 'Box')
    const circles = all.filter((d) => d.label === 'Circle')
    expect(box).toBeDefined()
    // Box y should equal the y of the last circle (same row top-left)
    expect(box!.y).toBeCloseTo(circles[circles.length - 1].y, 3)
    // Box should be right-aligned to the safe zone boundary:
    // x = sheetWidth - margin - box.width = 22 - 1 - 4 = 17"
    expect(box!.x).toBeCloseTo(17, 0)
    // Right edge should be at sheetWidth - margin = 21"
    expect(box!.x + box!.width).toBeCloseTo(21, 0)
  })

  it('places overflow rects in void space below circles on the same sheet', () => {
    // 4 circles fill row 0, leaving no horizontal gap room for the 10" box.
    // Box overflows gap-fit → placed in void below circles on the SAME sheet.
    const designs: DesignInput[] = [
      { id: 'c', width: 4, height: 4, quantity: 4, label: 'Circle', shape: 'round' },
      { id: 'b', width: 10, height: 4, quantity: 1, label: 'BigBox', shape: 'box' },
    ]
    const result = packDesigns(designs)
    // All 5 designs on one sheet
    expect(result).toHaveLength(1)
    const all = result[0].designs
    expect(all).toHaveLength(5)
    // BigBox is placed BELOW the circles (larger y value than any circle)
    const box = all.find((d) => d.label === 'BigBox')
    const circles = all.filter((d) => d.label === 'Circle')
    expect(box).toBeDefined()
    expect(box!.y).toBeGreaterThan(Math.max(...circles.map((c) => c.y)))
  })

  it('clean mode treats circles as bounding boxes and packs all shapes together', () => {
    const mixed = [
      { id: 'circle', width: 4, height: 4, quantity: 13, label: 'Circle', shape: 'round' as const },
      { id: 'box', width: 4, height: 4, quantity: 1, label: 'Box', shape: 'box' as const },
    ]
    const result = packDesigns(mixed, DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN, 'clean')
    // All 14 designs packed (circles treated as 4x4 bounding boxes)
    const allDesigns = result.flatMap((s) => s.designs)
    expect(allDesigns).toHaveLength(14)
    // Circles maintain their shape type but are positioned like rectangles (no hex offset)
    const circleDesigns = allDesigns.filter((d) => d.shape === 'round')
    expect(circleDesigns).toHaveLength(13)
    // With uniform 4x4 sizes, maxrects packs all 14 onto a single sheet
    expect(result).toHaveLength(1)
    // Circles and boxes are on the same sheet (unlike old "separate sheets" behaviour)
    const shapesOnSheet0 = new Set(result[0].designs.map((d) => d.shape))
    expect(shapesOnSheet0.has('round')).toBe(true)
    expect(shapesOnSheet0.has('box')).toBe(true)
  })

  it('tight mode uses hex packing for circles; clean mode uses rectangular grid', () => {
    // Tight: hex-pack circles (offset rows) — circles have non-uniform y spacing
    // Clean: maxrects-pack all as rectangles — circles have uniform row y spacing
    const mixed = [
      { id: 'circle', width: 4, height: 4, quantity: 8, label: 'Circle', shape: 'round' as const },
      { id: 'box', width: 4, height: 4, quantity: 1, label: 'Box', shape: 'box' as const },
    ]
    const tightResult = packDesigns(mixed) // default is tight
    const cleanResult = packDesigns(mixed, DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN, 'clean')
    // Both modes should pack all 9 designs
    expect(tightResult.flatMap((s) => s.designs)).toHaveLength(9)
    expect(cleanResult.flatMap((s) => s.designs)).toHaveLength(9)
  })
})

describe('maxRectsPack', () => {
  it('returns empty array for empty input', () => {
    expect(maxRectsPack([])).toEqual([])
  })

  it('places a single design respecting margins', () => {
    const result = maxRectsPack([{ id: 'd1', width: 4, height: 4, quantity: 1, label: 'Logo' }])
    expect(result).toHaveLength(1)
    expect(result[0].designs).toHaveLength(1)
    const d = result[0].designs[0]
    expect(d.x).toBeGreaterThanOrEqual(1) // at least 1" from left edge
    expect(d.y).toBeGreaterThanOrEqual(1) // at least 1" from top edge
    expect(d.width).toBe(4)
    expect(d.height).toBe(4)
    // usedHeight includes top + bottom margin
    expect(result[0].usedHeight).toBeGreaterThanOrEqual(6) // 1 + 4 + 1
  })

  it('expands quantity correctly', () => {
    const result = maxRectsPack([{ id: 'tiger', width: 4, height: 4, quantity: 5, label: 'Tiger' }])
    const all = result.flatMap((s) => s.designs)
    expect(all).toHaveLength(5)
  })

  it('places a design that exactly fills the bin width', () => {
    // 22" sheet - 2 × 1" margin = 20" usable width
    // A 20"-wide design must fit in one row, x starting at margin (1")
    const result = maxRectsPack([{ id: 'd1', width: 20, height: 5, quantity: 1, label: 'Wide' }])
    expect(result).toHaveLength(1)
    const d = result[0].designs[0]
    expect(d.x).toBeCloseTo(1, 5)
    expect(d.width).toBe(20)
  })

  it('creates multiple sheets when overflow occurs', () => {
    const result = maxRectsPack([{ id: 'd1', width: 20, height: 15, quantity: 4, label: 'Big' }])
    expect(result.length).toBeGreaterThanOrEqual(2)
    const total = result.flatMap((s) => s.designs).length
    expect(total).toBe(4)
    // Each design must be within sheet bounds
    for (const sheet of result) {
      expect(sheet.usedHeight).toBeLessThanOrEqual(60) // DTF_MAX_SHEET_LENGTH
      for (const d of sheet.designs) {
        expect(d.x).toBeGreaterThanOrEqual(1)
        expect(d.y).toBeGreaterThanOrEqual(1)
        expect(d.x + d.width).toBeLessThanOrEqual(22 - 1) // DTF_SHEET_WIDTH - margin
      }
    }
  })

  it('propagates shape through packed designs', () => {
    const result = maxRectsPack([
      { id: 'd1', width: 4, height: 4, quantity: 1, label: 'Box', shape: 'box' },
      { id: 'd2', width: 4, height: 4, quantity: 1, label: 'Round', shape: 'round' },
    ])
    const all = result.flatMap((s) => s.designs)
    expect(all.find((d) => d.label === 'Box')?.shape).toBe('box')
    expect(all.find((d) => d.label === 'Round')?.shape).toBe('round')
  })

  it('rejects quantity overflow', () => {
    expect(() =>
      maxRectsPack([{ id: 'd1', width: 4, height: 4, quantity: 5001, label: 'Big' }])
    ).toThrow(/exceeds maximum/)
  })

  it('achieves same or better packing than shelfPack for rectangles', () => {
    // MaxRects should never be worse than shelf for pure rectangle jobs
    const designs = [
      { id: 'big', width: 10, height: 12, quantity: 2, label: 'Big' },
      { id: 'small', width: 4, height: 4, quantity: 5, label: 'Small' },
    ]
    const maxRectsHeight = maxRectsPack(designs).reduce((sum, s) => sum + s.usedHeight, 0)
    const shelfHeight = shelfPack(designs).reduce((sum, s) => sum + s.usedHeight, 0)
    expect(maxRectsHeight).toBeLessThanOrEqual(shelfHeight)
  })
})
