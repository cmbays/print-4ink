/**
 * Cost optimization for DTF gang sheets.
 *
 * Takes packed sheet layouts from shelfPack() and assigns the cheapest
 * sheet tier that accommodates each sheet's usedHeight. All monetary
 * arithmetic uses big.js to avoid IEEE 754 floating-point errors.
 */

import type { DTFSheetTier } from "@/lib/schemas/dtf-pricing";
import type { CanvasDesign } from "@/lib/schemas/dtf-sheet-calculation";
import type { PackedSheet } from "./shelf-pack";
import { money, round2, toNumber } from "@/lib/helpers/money";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizedSheetResult {
  tier: DTFSheetTier;
  designs: CanvasDesign[];
  utilization: number;
  cost: number;
}

export interface SheetCalculationResult {
  sheets: OptimizedSheetResult[];
  totalCost: number;
  totalSheets: number;
}

// ---------------------------------------------------------------------------
// Algorithm
// ---------------------------------------------------------------------------

/**
 * Assign the cheapest tier to each packed sheet and compute costs.
 *
 * @param packedSheets  Output from shelfPack().
 * @param tiers  Available sheet tiers sorted by length ascending internally.
 * @param _splitMode  Reserved for future "split" mode (not used in tier selection).
 * @returns Optimized sheets with tier assignments, utilization, and total cost.
 */
export function optimizeCost(
  packedSheets: PackedSheet[],
  tiers: DTFSheetTier[],
  _splitMode: "combine" | "split" = "combine"
): SheetCalculationResult {
  if (packedSheets.length === 0) {
    return { sheets: [], totalCost: 0, totalSheets: 0 };
  }

  // Sort tiers by length ascending so we always pick the smallest fit first
  const sortedTiers = [...tiers].sort((a, b) => a.length - b.length);

  let runningTotal = money(0);
  const optimizedSheets: OptimizedSheetResult[] = [];

  for (const packedSheet of packedSheets) {
    // Find the smallest tier that fits the used height
    let selectedTier = sortedTiers.find(
      (tier) => tier.length >= packedSheet.usedHeight
    );

    // Fallback: if no tier fits, use the largest available tier
    if (!selectedTier) {
      selectedTier = sortedTiers[sortedTiers.length - 1];
    }

    // Calculate total design area for utilization (geometry, not monetary — raw JS math OK)
    const totalDesignArea = packedSheet.designs.reduce(
      (sum, d) => sum + d.width * d.height,
      0
    );
    const tierArea = selectedTier.width * selectedTier.length;
    const utilization =
      tierArea > 0
        ? toNumber(
            round2(money(totalDesignArea).div(tierArea).times(100))
          )
        : 0;

    // Cost = tier retail price (big.js for precision)
    const sheetCost = round2(money(selectedTier.retailPrice));
    runningTotal = runningTotal.plus(sheetCost);

    optimizedSheets.push({
      tier: selectedTier,
      designs: packedSheet.designs,
      utilization,
      cost: toNumber(sheetCost),
    });
  }

  return {
    sheets: optimizedSheets,
    totalCost: toNumber(round2(runningTotal)),
    totalSheets: optimizedSheets.length,
  };
}
