/**
 * Shelf-packing algorithm for DTF gang sheet layout.
 *
 * Places design rectangles onto fixed-width sheets using a "shelf" approach:
 * designs are placed left-to-right in rows (shelves), wrapping to the next
 * row when horizontal space is exhausted, and starting a new sheet when
 * vertical space exceeds DTF_MAX_SHEET_LENGTH.
 *
 * All coordinates are in inches. Pixel conversion happens in the canvas
 * rendering layer.
 */

import { DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN, DTF_MAX_SHEET_LENGTH } from '@domain/constants/dtf'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  shape?: 'box' | 'round'
}

// ---------------------------------------------------------------------------
// Algorithm
// ---------------------------------------------------------------------------

/**
 * Pack designs onto fixed-width sheets using a shelf-based algorithm.
 *
 * 1. Expand designs by quantity (Tiger x50 → 50 individual placements).
 * 2. Sort expanded list by height descending for better shelf utilization.
 * 3. Place left-to-right in shelves, wrapping vertically, then to new sheets.
 *
 * @param designs  Array of design specs with quantity.
 * @param sheetWidth  Fixed sheet width in inches (default 22).
 * @param margin  Spacing between designs and from edges in inches (default 1).
 * @returns Array of packed sheets, each with positioned designs and usedHeight.
 */
export function shelfPack(
  designs: DesignInput[],
  sheetWidth: number = DTF_SHEET_WIDTH,
  margin: number = DTF_DEFAULT_MARGIN
): PackedSheet[] {
  // --- Step 0: Guard against quantity overflow ---
  const MAX_PLACEMENTS = 5000
  const totalPlacements = designs.reduce((sum, d) => sum + d.quantity, 0)
  if (totalPlacements > MAX_PLACEMENTS) {
    throw new Error(
      `Total placements (${totalPlacements}) exceeds maximum of ${MAX_PLACEMENTS}. Reduce quantities.`
    )
  }

  // --- Step 1: Expand by quantity ---
  const expanded: Array<{
    id: string
    width: number
    height: number
    label: string
    shape: 'box' | 'round'
  }> = []

  for (const design of designs) {
    for (let i = 0; i < design.quantity; i++) {
      expanded.push({
        id: `${design.id}-${i}`,
        width: design.width,
        height: design.height,
        label: design.label,
        shape: design.shape ?? 'box',
      })
    }
  }

  if (expanded.length === 0) {
    return []
  }

  // --- Step 1b: Validate dimensions fit on a sheet ---
  const maxDesignWidth = sheetWidth - 2 * margin
  const maxDesignHeight = DTF_MAX_SHEET_LENGTH - 2 * margin
  for (const item of expanded) {
    if (item.width > maxDesignWidth) {
      throw new Error(
        `Design "${item.label}" (${item.width}" wide) exceeds usable sheet width of ${maxDesignWidth}"`
      )
    }
    if (item.height > maxDesignHeight) {
      throw new Error(
        `Design "${item.label}" (${item.height}" tall) exceeds max sheet height of ${maxDesignHeight}"`
      )
    }
  }

  // --- Step 2: Sort by height descending, width descending as tiebreaker ---
  expanded.sort((a, b) => b.height - a.height || b.width - a.width)

  // --- Step 3: Place designs using shelf algorithm ---
  const sheets: PackedSheet[] = []
  let currentSheet: PackedDesign[] = []
  let currentX = margin
  let currentShelfY = margin
  let tallestInCurrentShelf = 0

  function finalizeSheet() {
    if (currentSheet.length > 0) {
      const usedHeight = currentShelfY + tallestInCurrentShelf + margin
      sheets.push({
        designs: currentSheet,
        usedHeight,
      })
    }
  }

  function startNewSheet() {
    finalizeSheet()
    currentSheet = []
    currentX = margin
    currentShelfY = margin
    tallestInCurrentShelf = 0
  }

  for (const item of expanded) {
    // Check if design fits horizontally on current shelf (only wrap if shelf has items)
    if (currentX > margin && currentX + item.width + margin > sheetWidth) {
      // Current shelf is full — start a new shelf
      currentShelfY += tallestInCurrentShelf + margin
      currentX = margin
      tallestInCurrentShelf = 0
    }

    // Check if design fits vertically on current sheet
    if (currentShelfY + item.height + margin > DTF_MAX_SHEET_LENGTH) {
      // Current sheet is full — start a new sheet
      startNewSheet()
    }

    // Place the design
    currentSheet.push({
      id: item.id,
      x: currentX,
      y: currentShelfY,
      width: item.width,
      height: item.height,
      label: item.label,
      shape: item.shape,
    })

    // Advance horizontal cursor
    currentX += item.width + margin

    // Track tallest design in the current shelf
    if (item.height > tallestInCurrentShelf) {
      tallestInCurrentShelf = item.height
    }
  }

  // Finalize the last sheet
  finalizeSheet()

  return sheets
}

/**
 * Hex offset packing for uniform-circle jobs.
 *
 * Uses circle-surface-to-circle-surface spacing: the `margin` parameter is the
 * minimum gap between printed circle surfaces, not between bounding boxes.
 *
 * Odd rows are offset by half the column spacing so circles nestle into the
 * gaps between the row above — hex close-packing geometry.
 *
 * Achieves ~9.6% height reduction vs shelfPack for typical circle jobs.
 *
 * @param designs  Should all have shape === 'round' and identical width === height.
 * @param sheetWidth  Fixed sheet width in inches.
 * @param margin  Minimum surface gap from edges and between designs, in inches.
 */
export function hexPackCircles(
  designs: DesignInput[],
  sheetWidth: number = DTF_SHEET_WIDTH,
  margin: number = DTF_DEFAULT_MARGIN
): PackedSheet[] {
  // --- Overflow guard ---
  const MAX_PLACEMENTS = 5000
  const totalPlacements = designs.reduce((sum, d) => sum + d.quantity, 0)
  if (totalPlacements > MAX_PLACEMENTS) {
    throw new Error(
      `Total placements (${totalPlacements}) exceeds maximum of ${MAX_PLACEMENTS}. Reduce quantities.`
    )
  }

  // --- Expand by quantity ---
  const expanded: Array<{
    id: string
    width: number
    height: number
    label: string
    shape: 'box' | 'round'
  }> = []
  for (const design of designs) {
    for (let i = 0; i < design.quantity; i++) {
      expanded.push({
        id: `${design.id}-${i}`,
        width: design.width,
        height: design.height,
        label: design.label,
        shape: design.shape ?? 'box',
      })
    }
  }

  if (expanded.length === 0) return []

  // --- Validate dimensions ---
  const D = expanded[0].width
  const r = D / 2
  const maxDesignWidth = sheetWidth - 2 * margin
  if (D > maxDesignWidth) {
    throw new Error(
      `Design "${expanded[0].label}" (${D}" wide) exceeds usable sheet width of ${maxDesignWidth}"`
    )
  }
  if (D > DTF_MAX_SHEET_LENGTH - 2 * margin) {
    throw new Error(
      `Design "${expanded[0].label}" (${D}" tall) exceeds max sheet height of ${DTF_MAX_SHEET_LENGTH - 2 * margin}"`
    )
  }

  // --- Hex geometry ---
  // Center-to-center spacing using surface-to-surface gap (margin = gap between circle edges)
  const colSpacing = D + margin // horizontal center-to-center
  const rowPitch = colSpacing * (Math.sqrt(3) / 2) // vertical center-to-center

  const cxMin = margin + r // leftmost center on even rows
  const cxMax = sheetWidth - margin - r // rightmost allowed center

  // --- Pack ---
  const sheets: PackedSheet[] = []
  let currentSheet: PackedDesign[] = []
  let lastPlacedCy = 0 // cy of the last row where items were actually placed
  let rowIndex = 0
  let placedCount = 0

  function finalizeSheet() {
    if (currentSheet.length > 0) {
      sheets.push({ designs: currentSheet, usedHeight: lastPlacedCy + r + margin })
      currentSheet = []
    }
  }

  while (placedCount < expanded.length) {
    const isOddRow = rowIndex % 2 === 1
    const xOffset = isOddRow ? colSpacing / 2 : 0
    const cy = margin + r + rowIndex * rowPitch

    // Does this row fit on the current sheet?
    if (cy + r + margin > DTF_MAX_SHEET_LENGTH) {
      finalizeSheet()
      rowIndex = 0
      lastPlacedCy = 0
      continue
    }

    // Place circles across this row
    let cx = cxMin + xOffset
    let placedInRow = 0
    while (cx <= cxMax && placedCount < expanded.length) {
      const item = expanded[placedCount]
      currentSheet.push({
        id: item.id,
        x: cx - r, // convert center → bbox top-left
        y: cy - r,
        width: D,
        height: D,
        label: item.label,
        shape: 'round',
      })
      cx += colSpacing
      placedCount++
      placedInRow++
    }

    // Only advance lastPlacedCy when items were placed (guards against empty odd rows)
    if (placedInRow > 0) {
      lastPlacedCy = cy
    }

    rowIndex++
  }

  finalizeSheet()
  return sheets
}

/**
 * Smart dispatcher for gang sheet packing.
 *
 * Routes uniform-circle jobs to hexPackCircles() for ~10% better utilization.
 * All other jobs (mixed shapes, non-uniform circles, rectangles) use shelfPack().
 *
 * This is the preferred entry point for all callers in Phase 1.
 * In Phase 2 the fallback will switch from shelfPack to maxRectsPack.
 */
export function packDesigns(
  designs: DesignInput[],
  sheetWidth: number = DTF_SHEET_WIDTH,
  margin: number = DTF_DEFAULT_MARGIN
): PackedSheet[] {
  if (designs.length === 0) return []

  const allRound = designs.every((d) => d.shape === 'round')
  const diameters = new Set(designs.map((d) => d.width))
  const allSameDiameter = diameters.size === 1 && designs.every((d) => d.width === d.height)

  if (allRound && allSameDiameter) {
    return hexPackCircles(designs, sheetWidth, margin)
  }

  return shelfPack(designs, sheetWidth, margin)
}
