/**
 * DTF domain rules — consolidates cost optimization, constants, and validation.
 *
 * Cost optimization takes packed sheet layouts from shelfPack() and assigns
 * the cheapest sheet tier that accommodates each sheet's usedHeight. All
 * monetary arithmetic uses big.js to avoid IEEE 754 floating-point errors.
 */

import type { DTFSheetTier } from '@domain/entities/dtf-pricing'
import type { OptimizedSheet, SheetCalculation } from '@domain/entities/dtf-sheet-calculation'
import type { PackedSheet } from '@domain/services/dtf.service'
import type { DtfLineItem } from '@domain/entities/dtf-line-item'
import type { JobTask } from '@domain/entities/job'
import { money, round2, toNumber } from '@domain/lib/money'

import { DTF_DEFAULT_MARGIN } from '@domain/constants/dtf'

// Sheet constants live in @domain/constants/dtf — re-exported here for backward compatibility
export { DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN, DTF_MAX_SHEET_LENGTH } from '@domain/constants/dtf'

// ---------------------------------------------------------------------------
// DTF Size Presets (S26) — standalone presets, NOT artwork-tied
// ---------------------------------------------------------------------------

export const DTF_SIZE_PRESETS = [
  { label: 'Small / Collectibles', shortLabel: 'Small', width: 4, height: 4 },
  { label: 'Medium / Pocket', shortLabel: 'Medium', width: 6, height: 6 },
  { label: 'Large / Shirts', shortLabel: 'Large', width: 10, height: 12 },
] as const

export type DtfSizePresetConfig = (typeof DTF_SIZE_PRESETS)[number]

// ---------------------------------------------------------------------------
// DTF Task Template (N53) — production steps for DTF jobs
// ---------------------------------------------------------------------------

export const DTF_TASK_TEMPLATE = [
  { name: 'Gang sheet prepared' },
  { name: 'DTF printed' },
  { name: 'QC passed' },
  { name: 'Shipped' },
] as const

// ---------------------------------------------------------------------------
// DTF Task Template Factory
// ---------------------------------------------------------------------------

/** Generate DTF-specific production tasks matching jobTaskSchema shape. */
export function getDtfTaskTemplate(): JobTask[] {
  return DTF_TASK_TEMPLATE.map((t, i) => ({
    id: crypto.randomUUID(),
    label: t.name,
    isCompleted: false,
    isCanonical: true,
    sortOrder: i,
  }))
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Check if a single DTF line item has valid data for calculation.
 * Used by SheetCalculationPanel (filter + gate) and QuoteForm (tab validation).
 */
export function isValidDtfLineItem(item: DtfLineItem): boolean {
  return (
    item.artworkName.trim().length > 0 && item.width > 0 && item.height > 0 && item.quantity >= 1
  )
}

// ---------------------------------------------------------------------------
// Cost Optimization Algorithm
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
  _splitMode: 'combine' | 'split' = 'combine'
): SheetCalculation {
  if (packedSheets.length === 0) {
    return { sheets: [], totalCost: 0, totalSheets: 0 }
  }

  if (tiers.length === 0) {
    throw new Error('No sheet tiers configured. Cannot calculate cost. Check DTF pricing template.')
  }

  // Sort tiers by length ascending so we always pick the smallest fit first
  const sortedTiers = [...tiers].sort((a, b) => a.length - b.length)

  let runningTotal = money(0)
  const optimizedSheets: OptimizedSheet[] = []

  for (const packedSheet of packedSheets) {
    // Find the smallest tier that fits the used height
    let selectedTier = sortedTiers.find((tier) => tier.length >= packedSheet.usedHeight)

    // Fallback: if no tier fits, use the largest available tier
    if (!selectedTier) {
      selectedTier = sortedTiers[sortedTiers.length - 1]
    }

    // Calculate effective footprint for utilization:
    // Each design claims (width + margin) × (height + margin) of sheet space.
    // This accounts for the required gap around every design.
    const totalFootprintArea = packedSheet.designs.reduce(
      (sum, d) => sum + (d.width + DTF_DEFAULT_MARGIN) * (d.height + DTF_DEFAULT_MARGIN),
      0
    )
    const tierArea = selectedTier.width * selectedTier.length
    const rawUtilization = tierArea > 0 ? (totalFootprintArea / tierArea) * 100 : 0
    const utilization = Math.min(100, Math.round(rawUtilization))

    // Cost = tier retail price (big.js for precision)
    const sheetCost = round2(money(selectedTier.retailPrice))
    runningTotal = runningTotal.plus(sheetCost)

    optimizedSheets.push({
      tier: selectedTier,
      designs: packedSheet.designs,
      utilization,
      cost: toNumber(sheetCost),
    })
  }

  return {
    sheets: optimizedSheets,
    totalCost: toNumber(round2(runningTotal)),
    totalSheets: optimizedSheets.length,
  }
}
