import Big from "big.js";
import type {
  PricingTemplate,
  MarginBreakdown,
  MarginIndicator,
  QuantityTier,
  ScreenPrintMatrix,
} from "@/lib/schemas/price-matrix";
import type {
  DTFPricingTemplate,
  DTFCostConfig,
  DTFRushTurnaround,
  DTFFilmType,
} from "@/lib/schemas/dtf-pricing";
import type { PricingTier } from "@/lib/schemas/customer";
import type { GarmentCategory } from "@/lib/schemas/garment";
import { money as bigMoney, round2, toNumber } from "@/lib/helpers/money";

// Local wrapper: pricing-engine uses money() → number throughout.
// Main's money() returns Big, so wrap with round2 + toNumber.
function money(value: number | Big): number {
  return toNumber(round2(bigMoney(value)));
}

// ---------------------------------------------------------------------------
// Margin thresholds (from breadboard: ≥30% healthy, 15–30% caution, <15% unprofitable)
// ---------------------------------------------------------------------------

const MARGIN_THRESHOLDS = {
  healthy: 30,
  caution: 15,
} as const;

// ---------------------------------------------------------------------------
// Margin Calculation — shared by both SP and DTF
// ---------------------------------------------------------------------------

export function getMarginIndicator(percentage: number): MarginIndicator {
  if (percentage >= MARGIN_THRESHOLDS.healthy) return "healthy";
  if (percentage >= MARGIN_THRESHOLDS.caution) return "caution";
  return "unprofitable";
}

export function calculateMargin(
  revenue: number,
  costs: {
    garmentCost: number;
    inkCost: number;
    overheadCost: number;
    laborCost?: number;
  }
): MarginBreakdown {
  const totalCost = money(
    new Big(costs.garmentCost)
      .plus(costs.inkCost)
      .plus(costs.overheadCost)
      .plus(costs.laborCost ?? 0)
  );
  const profit = money(new Big(revenue).minus(totalCost));
  const percentage = revenue > 0
    ? Number(new Big(profit).div(revenue).times(100).round(2))
    : 0;

  return {
    revenue,
    garmentCost: costs.garmentCost,
    inkCost: costs.inkCost,
    overheadCost: costs.overheadCost,
    laborCost: costs.laborCost,
    totalCost,
    profit,
    percentage,
    indicator: getMarginIndicator(percentage),
  };
}

// ---------------------------------------------------------------------------
// Screen Print Price Calculation
// ---------------------------------------------------------------------------

/** Find which quantity tier a quantity falls into. Returns tier index or -1. */
export function findQuantityTierIndex(
  tiers: QuantityTier[],
  qty: number
): number {
  return tiers.findIndex(
    (tier) => qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty)
  );
}

/** Get base price per piece for a given quantity tier. */
export function getBasePriceForTier(
  matrix: ScreenPrintMatrix,
  tierIndex: number
): number {
  return matrix.basePriceByTier[tierIndex] ?? 0;
}

/** Get color upcharge per piece for a given color count. */
export function getColorUpcharge(
  matrix: ScreenPrintMatrix,
  colorCount: number
): number {
  // Every color (including the first) applies the per-hit rate.
  // Total color cost = ratePerHit × colorCount.
  const colorConfig = matrix.colorPricing.find((c) => c.colors === colorCount);
  if (colorConfig) {
    return money(new Big(colorConfig.ratePerHit).times(colorCount));
  }

  // If exact match not found, find highest configured and extrapolate
  const maxConfig = matrix.colorPricing.reduce(
    (max, c) => (c.colors > max.colors ? c : max),
    matrix.colorPricing[0]
  );
  if (!maxConfig) return 0;
  return money(new Big(maxConfig.ratePerHit).times(colorCount));
}

/** Get location upcharge for a specific print location. */
export function getLocationUpcharge(
  matrix: ScreenPrintMatrix,
  location: string
): number {
  const config = matrix.locationUpcharges.find((l) => l.location === location);
  return config?.upcharge ?? 0;
}

/** Get garment type markup multiplier (1.0 = no markup). */
export function getGarmentTypeMultiplier(
  matrix: ScreenPrintMatrix,
  garmentCategory: GarmentCategory
): number {
  const config = matrix.garmentTypePricing.find(
    (g) => g.garmentCategory === garmentCategory
  );
  return config ? Number(new Big(1).plus(new Big(config.baseMarkup).div(100))) : 1;
}

/** Calculate total setup fees for a job. */
export function calculateSetupFees(
  matrix: ScreenPrintMatrix,
  totalScreens: number,
  quantity: number,
  isReorder: boolean
): number {
  const { perScreenFee, bulkWaiverThreshold, reorderDiscountPercent } =
    matrix.setupFeeConfig;

  // Waive setup for bulk orders
  if (quantity >= bulkWaiverThreshold && bulkWaiverThreshold > 0) return 0;

  let totalSetup = new Big(perScreenFee).times(totalScreens);

  // Apply reorder discount
  if (isReorder && reorderDiscountPercent > 0) {
    totalSetup = totalSetup.times(new Big(1).minus(new Big(reorderDiscountPercent).div(100)));
  }

  return money(totalSetup);
}

/**
 * Calculate screen print price per piece.
 * This is the main calculation: base price + color upcharge + location upcharges,
 * multiplied by garment type factor.
 */
export function calculateScreenPrintPrice(
  qty: number,
  colorCount: number,
  locations: string[],
  garmentCategory: GarmentCategory,
  template: PricingTemplate
): { pricePerPiece: number; margin: MarginBreakdown } {
  const { matrix, costConfig } = template;

  const tierIndex = findQuantityTierIndex(matrix.quantityTiers, qty);
  const basePrice = tierIndex >= 0 ? getBasePriceForTier(matrix, tierIndex) : 0;

  // Color upcharge (total for all colors on primary location)
  const colorUpcharge = getColorUpcharge(matrix, colorCount);

  // Location upcharges (sum of all secondary locations)
  const locationUpcharge = money(
    locations.reduce(
      (sum, loc) => sum.plus(getLocationUpcharge(matrix, loc)),
      new Big(0)
    )
  );

  // Garment type multiplier
  const garmentMultiplier = getGarmentTypeMultiplier(matrix, garmentCategory);

  // Final price per piece
  const pricePerPiece = money(
    new Big(basePrice).plus(colorUpcharge).plus(locationUpcharge).times(garmentMultiplier)
  );

  // Cost calculation for margin
  const garmentCost =
    costConfig.garmentCostSource === "catalog"
      ? 0 // Will be filled from garment catalog at call site
      : (costConfig.manualGarmentCost ?? 0);
  const inkCost = money(
    new Big(costConfig.inkCostPerHit).times(colorCount).times(locations.length)
  );
  const overheadCost = money(
    new Big(pricePerPiece).times(new Big(costConfig.shopOverheadRate).div(100))
  );
  // Labor: amortize hourly rate to per-piece (~30 sec per piece for screen print)
  const laborCost = costConfig.laborRate
    ? money(new Big(costConfig.laborRate).times(30).div(3600))
    : undefined;

  const margin = calculateMargin(pricePerPiece, {
    garmentCost,
    inkCost,
    overheadCost,
    laborCost,
  });

  return { pricePerPiece, margin };
}

/**
 * Calculate cell-level margin for a specific quantity tier + color count combination.
 * Used by the matrix grid to show margin indicators per cell.
 *
 * Optional `garmentCategory` and `locations` apply the full pricing formula:
 *   (base + colorUpcharge + locationUpcharge) × garmentMultiplier
 * When omitted, only base + colorUpcharge is used (backwards compatible).
 */
export function calculateCellMargin(
  tierIndex: number,
  colorCount: number,
  template: PricingTemplate,
  garmentBaseCost: number,
  garmentCategory?: GarmentCategory,
  locations?: string[]
): MarginBreakdown {
  const { matrix, costConfig } = template;
  const overrides = matrix.priceOverrides ?? {};
  const colIndex = colorCount - 1;
  const overrideKey = `${tierIndex}-${colIndex}`;
  const overridePrice = overrides[overrideKey];

  // Location upcharge: sum of all selected locations' upcharges
  const locationUpcharge = locations
    ? money(locations.reduce((sum, loc) => sum.plus(getLocationUpcharge(matrix, loc)), new Big(0)))
    : 0;

  // Garment type multiplier
  const garmentMultiplier = garmentCategory
    ? getGarmentTypeMultiplier(matrix, garmentCategory)
    : 1;

  let revenue: number;
  if (overridePrice !== undefined) {
    // For overrides, still apply garment multiplier + location upcharge on top
    revenue = money(new Big(overridePrice).plus(locationUpcharge).times(garmentMultiplier));
  } else {
    const basePrice = getBasePriceForTier(matrix, tierIndex);
    const colorUpcharge = getColorUpcharge(matrix, colorCount);
    revenue = money(
      new Big(basePrice).plus(colorUpcharge).plus(locationUpcharge).times(garmentMultiplier)
    );
  }

  const garmentCost =
    costConfig.garmentCostSource === "catalog"
      ? garmentBaseCost
      : (costConfig.manualGarmentCost ?? 0);
  // Ink cost: per hit × colors × number of locations (minimum 1)
  const locationCount = locations ? Math.max(locations.length, 1) : 1;
  const inkCost = money(new Big(costConfig.inkCostPerHit).times(colorCount).times(locationCount));
  const overheadCost = money(
    new Big(revenue).times(new Big(costConfig.shopOverheadRate).div(100))
  );

  // Labor: amortize hourly rate to per-piece (~30 sec per piece)
  const laborCost = costConfig.laborRate
    ? money(new Big(costConfig.laborRate).times(30).div(3600))
    : undefined;

  return calculateMargin(revenue, {
    garmentCost,
    inkCost,
    overheadCost,
    laborCost,
  });
}

/**
 * Build the full pricing matrix data for the grid view.
 * Returns a 2D array: rows = quantity tiers, columns = color counts (1–maxColors).
 *
 * Optional `garmentCategory` and `locations` apply the full pricing formula.
 * When omitted, only base + colorUpcharge is used (backwards compatible).
 */
export function buildFullMatrixData(
  template: PricingTemplate,
  garmentBaseCost: number,
  garmentCategory?: GarmentCategory,
  locations?: string[]
): {
  tierLabel: string;
  cells: { price: number; margin: MarginBreakdown }[];
}[] {
  const { matrix } = template;
  const maxColors = matrix.maxColors ?? 8;

  const overrides = matrix.priceOverrides ?? {};

  // Location upcharge: sum of all selected locations' upcharges
  const locationUpcharge = locations
    ? money(locations.reduce((sum, loc) => sum.plus(getLocationUpcharge(matrix, loc)), new Big(0)))
    : 0;

  // Garment type multiplier
  const garmentMultiplier = garmentCategory
    ? getGarmentTypeMultiplier(matrix, garmentCategory)
    : 1;

  return matrix.quantityTiers.map((tier, tierIndex) => {
    const cells = Array.from({ length: maxColors }, (_, i) => {
      const colorCount = i + 1;
      const overrideKey = `${tierIndex}-${i}`;
      const overridePrice = overrides[overrideKey];

      let price: number;
      if (overridePrice !== undefined) {
        price = money(new Big(overridePrice).plus(locationUpcharge).times(garmentMultiplier));
      } else {
        const basePrice = getBasePriceForTier(matrix, tierIndex);
        const colorUpcharge = getColorUpcharge(matrix, colorCount);
        price = money(
          new Big(basePrice).plus(colorUpcharge).plus(locationUpcharge).times(garmentMultiplier)
        );
      }

      const margin = calculateCellMargin(
        tierIndex, colorCount, template, garmentBaseCost, garmentCategory, locations
      );
      return { price, margin };
    });

    return { tierLabel: tier.label, cells };
  });
}

// ---------------------------------------------------------------------------
// Template Health — aggregate margin indicator for a template
// ---------------------------------------------------------------------------

export function calculateTemplateHealth(
  template: PricingTemplate,
  garmentBaseCost: number
): MarginIndicator {
  const matrixData = buildFullMatrixData(template, garmentBaseCost);
  const allMargins = matrixData.flatMap((row) =>
    row.cells.map((cell) => cell.margin.percentage)
  );

  if (allMargins.length === 0) return "caution";

  const avgMargin = Number(
    allMargins.reduce((sum, m) => sum.plus(m), new Big(0)).div(allMargins.length).round(2)
  );
  return getMarginIndicator(avgMargin);
}

// ---------------------------------------------------------------------------
// DTF Price Calculation
// ---------------------------------------------------------------------------

/** Calculate area of a DTF sheet in square feet. */
function dtfSheetAreaSqFt(width: number, length: number): number {
  return Number(new Big(width).times(length).div(144)); // sq inches to sq feet
}

/** Calculate DTF production cost for a sheet. */
export function calculateDTFProductionCost(
  width: number,
  length: number,
  costConfig: DTFCostConfig
): {
  filmCost: number;
  inkCost: number;
  powderCost: number;
  laborCost: number;
  equipmentCost: number;
  totalCost: number;
} {
  const areaSqFt = dtfSheetAreaSqFt(width, length);
  const areaSqIn = Number(new Big(width).times(length));

  const filmCost = money(new Big(costConfig.filmCostPerSqFt).times(areaSqFt));
  const inkCost = money(new Big(costConfig.inkCostPerSqIn).times(areaSqIn));
  const powderCost = money(new Big(costConfig.powderCostPerSqFt).times(areaSqFt));
  // Estimate labor: ~2 min per sq ft
  const laborCost = money(
    new Big(costConfig.laborRatePerHour).times(areaSqFt).times(2).div(60)
  );
  const equipmentCost = money(new Big(costConfig.equipmentOverheadPerSqFt).times(areaSqFt));

  // Total from already-rounded components so display is consistent
  const totalCost = money(
    new Big(filmCost).plus(inkCost).plus(powderCost).plus(laborCost).plus(equipmentCost)
  );

  return { filmCost, inkCost, powderCost, laborCost, equipmentCost, totalCost };
}

/**
 * Calculate DTF price for a sheet.
 */
export function calculateDTFPrice(
  sheetLength: number,
  customerTier: PricingTier,
  rushType: DTFRushTurnaround,
  filmType: DTFFilmType,
  template: DTFPricingTemplate
): { price: number; margin: MarginBreakdown } {
  // Find sheet tier
  const sheetTier = template.sheetTiers.find((t) => t.length === sheetLength);
  if (!sheetTier) {
    return {
      price: 0,
      margin: calculateMargin(0, {
        garmentCost: 0,
        inkCost: 0,
        overheadCost: 0,
      }),
    };
  }

  // Base price (use contract price if available and customer is contract tier)
  let basePrice = new Big(sheetTier.retailPrice);
  if (
    customerTier === "contract" &&
    sheetTier.contractPrice !== undefined
  ) {
    basePrice = new Big(sheetTier.contractPrice);
  }

  // Apply customer tier discount
  const tierDiscount = template.customerTierDiscounts.find(
    (d) => d.tier === customerTier
  );
  if (tierDiscount && tierDiscount.discountPercent > 0) {
    basePrice = basePrice.times(
      new Big(1).minus(new Big(tierDiscount.discountPercent).div(100))
    );
  }

  // Apply rush fee
  const rushFee = template.rushFees.find((r) => r.turnaround === rushType);
  if (rushFee) {
    basePrice = basePrice.times(
      new Big(1).plus(new Big(rushFee.percentageUpcharge).div(100))
    );
    if (rushFee.flatFee) basePrice = basePrice.plus(rushFee.flatFee);
  }

  // Apply film type multiplier
  const filmConfig = template.filmTypes.find((f) => f.type === filmType);
  if (filmConfig) {
    basePrice = basePrice.times(filmConfig.multiplier);
  }

  const price = money(basePrice);

  // Calculate production cost for margin
  const prodCost = calculateDTFProductionCost(
    sheetTier.width,
    sheetTier.length,
    template.costConfig
  );

  const margin = calculateMargin(price, {
    garmentCost: 0, // no garment for DTF (it's a transfer)
    inkCost: prodCost.inkCost,
    overheadCost: money(
      new Big(prodCost.filmCost).plus(prodCost.powderCost).plus(prodCost.equipmentCost)
    ),
    laborCost: prodCost.laborCost,
  });

  return { price, margin };
}

/**
 * Calculate DTF tier margin for a specific sheet tier.
 * Used by the DTF editor to show per-tier margin indicators.
 */
export function calculateDTFTierMargin(
  sheetTier: { width: number; length: number; retailPrice: number },
  costConfig: DTFCostConfig
): MarginBreakdown {
  const prodCost = calculateDTFProductionCost(
    sheetTier.width,
    sheetTier.length,
    costConfig
  );

  return calculateMargin(sheetTier.retailPrice, {
    garmentCost: 0,
    inkCost: prodCost.inkCost,
    overheadCost: money(
      new Big(prodCost.filmCost).plus(prodCost.powderCost).plus(prodCost.equipmentCost)
    ),
    laborCost: prodCost.laborCost,
  });
}

/**
 * Calculate DTF template health — average margin across all sheet tiers.
 */
export function calculateDTFTemplateHealth(
  template: DTFPricingTemplate
): MarginIndicator {
  const margins = template.sheetTiers.map((tier) =>
    calculateDTFTierMargin(tier, template.costConfig)
  );

  if (margins.length === 0) return "caution";

  const avgMargin = Number(
    margins.reduce((sum, m) => sum.plus(m.percentage), new Big(0)).div(margins.length).round(2)
  );
  return getMarginIndicator(avgMargin);
}

// ---------------------------------------------------------------------------
// Customer Tier Discount (applied to any service type)
// ---------------------------------------------------------------------------

export function applyCustomerTierDiscount(
  basePrice: number,
  discountPercentage?: number
): number {
  if (!discountPercentage || discountPercentage <= 0) return basePrice;
  return money(
    new Big(basePrice).times(new Big(1).minus(new Big(discountPercentage).div(100)))
  );
}

// ---------------------------------------------------------------------------
// Comparison / Diff utilities (for sandbox mode)
// ---------------------------------------------------------------------------

export function calculateDiff(
  original: PricingTemplate,
  proposed: PricingTemplate
): {
  changedCells: number;
  totalCells: number;
  avgMarginChange: number;
} {
  const origData = buildFullMatrixData(original, 3.5); // default garment cost
  const propData = buildFullMatrixData(proposed, 3.5);

  let changedCells = 0;
  let totalCells = 0;
  let marginDeltaSum = new Big(0);

  origData.forEach((origRow, rowIdx) => {
    const propRow = propData[rowIdx];
    if (!propRow) return;

    origRow.cells.forEach((origCell, colIdx) => {
      const propCell = propRow.cells[colIdx];
      if (!propCell) return;

      totalCells++;
      if (!new Big(origCell.price).eq(new Big(propCell.price))) {
        changedCells++;
        marginDeltaSum = marginDeltaSum.plus(
          new Big(propCell.margin.percentage).minus(origCell.margin.percentage)
        );
      }
    });
  });

  return {
    changedCells,
    totalCells,
    avgMarginChange: changedCells > 0
      ? Number(marginDeltaSum.div(changedCells).round(2))
      : 0,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${Number(new Big(value).round(1))}%`;
}
