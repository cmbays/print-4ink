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

import {
  DTF_SHEET_WIDTH,
  DTF_DEFAULT_MARGIN,
  DTF_MAX_SHEET_LENGTH,
} from "@/lib/dtf/dtf-constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PackedDesign {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface PackedSheet {
  designs: PackedDesign[];
  usedHeight: number;
}

export interface DesignInput {
  id: string;
  width: number;
  height: number;
  quantity: number;
  label: string;
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
  // --- Step 1: Expand by quantity ---
  const expanded: Array<{
    id: string;
    width: number;
    height: number;
    label: string;
  }> = [];

  for (const design of designs) {
    for (let i = 0; i < design.quantity; i++) {
      expanded.push({
        id: `${design.id}-${i}`,
        width: design.width,
        height: design.height,
        label: design.label,
      });
    }
  }

  if (expanded.length === 0) {
    return [];
  }

  // --- Step 1b: Validate dimensions fit on a sheet ---
  const maxDesignWidth = sheetWidth - 2 * margin;
  const maxDesignHeight = DTF_MAX_SHEET_LENGTH - 2 * margin;
  for (const item of expanded) {
    if (item.width > maxDesignWidth) {
      throw new Error(
        `Design "${item.label}" (${item.width}" wide) exceeds usable sheet width of ${maxDesignWidth}"`
      );
    }
    if (item.height > maxDesignHeight) {
      throw new Error(
        `Design "${item.label}" (${item.height}" tall) exceeds max sheet height of ${maxDesignHeight}"`
      );
    }
  }

  // --- Step 2: Sort by height descending, width descending as tiebreaker ---
  expanded.sort((a, b) => b.height - a.height || b.width - a.width);

  // --- Step 3: Place designs using shelf algorithm ---
  const sheets: PackedSheet[] = [];
  let currentSheet: PackedDesign[] = [];
  let currentX = margin;
  let currentShelfY = margin;
  let tallestInCurrentShelf = 0;

  function finalizeSheet() {
    if (currentSheet.length > 0) {
      const usedHeight = currentShelfY + tallestInCurrentShelf + margin;
      sheets.push({
        designs: currentSheet,
        usedHeight,
      });
    }
  }

  function startNewSheet() {
    finalizeSheet();
    currentSheet = [];
    currentX = margin;
    currentShelfY = margin;
    tallestInCurrentShelf = 0;
  }

  for (const item of expanded) {
    // Check if design fits horizontally on current shelf (only wrap if shelf has items)
    if (currentX > margin && currentX + item.width + margin > sheetWidth) {
      // Current shelf is full — start a new shelf
      currentShelfY += tallestInCurrentShelf + margin;
      currentX = margin;
      tallestInCurrentShelf = 0;
    }

    // Check if design fits vertically on current sheet
    if (currentShelfY + item.height + margin > DTF_MAX_SHEET_LENGTH) {
      // Current sheet is full — start a new sheet
      startNewSheet();
    }

    // Place the design
    currentSheet.push({
      id: item.id,
      x: currentX,
      y: currentShelfY,
      width: item.width,
      height: item.height,
      label: item.label,
    });

    // Advance horizontal cursor
    currentX += item.width + margin;

    // Track tallest design in the current shelf
    if (item.height > tallestInCurrentShelf) {
      tallestInCurrentShelf = item.height;
    }
  }

  // Finalize the last sheet
  finalizeSheet();

  return sheets;
}
