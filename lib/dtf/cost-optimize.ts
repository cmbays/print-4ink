/**
 * Cost optimization for DTF gang sheets.
 *
 * Takes packed sheet layouts from shelfPack() and assigns the cheapest
 * sheet tier that accommodates each sheet's usedHeight. All monetary
 * arithmetic uses big.js to avoid IEEE 754 floating-point errors.
 */

import type { DTFSheetTier } from "@/lib/schemas/dtf-pricing";
import type {
  OptimizedSheet,
  SheetCalculation,
} from "@/lib/schemas/dtf-sheet-calculation";
import type { PackedSheet } from "./shelf-pack";
import { money, round2, toNumber } from "@/lib/helpers/money";

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
): SheetCalculation {
  if (packedSheets.length === 0) {
    return { sheets: [], totalCost: 0, totalSheets: 0 };
  }

  if (tiers.length === 0) {
    throw new Error(
      "No sheet tiers configured. Cannot calculate cost. Check DTF pricing template."
    );
  }

  // Sort tiers by length ascending so we always pick the smallest fit first
  const sortedTiers = [...tiers].sort((a, b) => a.length - b.length);

  let runningTotal = money(0);
  const optimizedSheets: OptimizedSheet[] = [];

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
    const rawUtilization =
      tierArea > 0
        ? totalDesignArea / tierArea * 100
        : 0;
    const utilization = Math.min(100, Math.round(rawUtilization));

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
