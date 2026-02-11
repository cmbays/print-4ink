import type {
  PricingTemplate,
  CostConfig,
  MarginBreakdown,
  MarginIndicator,
  QuantityTier,
  ScreenPrintMatrix,
} from "./schemas/price-matrix";
import type {
  DTFPricingTemplate,
  DTFCostConfig,
  DTFRushTurnaround,
  DTFFilmType,
} from "./schemas/dtf-pricing";
import type { PricingTier } from "./schemas/customer";
import type { GarmentCategory } from "./schemas/garment";

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
  const totalCost =
    costs.garmentCost + costs.inkCost + costs.overheadCost + (costs.laborCost ?? 0);
  const profit = revenue - totalCost;
  const percentage = revenue > 0 ? (profit / revenue) * 100 : 0;

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

/** Get additional cost per piece for color count. */
export function getColorUpcharge(
  matrix: ScreenPrintMatrix,
  colorCount: number
): number {
  // Colors = 1 means base rate (no upcharge from additional colors)
  // Each additional color adds the per-hit rate
  const colorConfig = matrix.colorPricing.find((c) => c.colors === colorCount);
  if (colorConfig) return colorConfig.ratePerHit * colorCount;

  // If exact match not found, find highest configured and extrapolate
  const maxConfig = matrix.colorPricing.reduce(
    (max, c) => (c.colors > max.colors ? c : max),
    matrix.colorPricing[0]
  );
  if (!maxConfig) return 0;
  return maxConfig.ratePerHit * colorCount;
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
  return config ? 1 + config.baseMarkup / 100 : 1;
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

  let totalSetup = perScreenFee * totalScreens;

  // Apply reorder discount
  if (isReorder && reorderDiscountPercent > 0) {
    totalSetup *= 1 - reorderDiscountPercent / 100;
  }

  return Math.round(totalSetup * 100) / 100;
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
  const locationUpcharge = locations.reduce(
    (sum, loc) => sum + getLocationUpcharge(matrix, loc),
    0
  );

  // Garment type multiplier
  const garmentMultiplier = getGarmentTypeMultiplier(matrix, garmentCategory);

  // Final price per piece
  const pricePerPiece =
    Math.round((basePrice + colorUpcharge + locationUpcharge) * garmentMultiplier * 100) / 100;

  // Cost calculation for margin
  const garmentCost =
    costConfig.garmentCostSource === "catalog"
      ? 0 // Will be filled from garment catalog at call site
      : (costConfig.manualGarmentCost ?? 0);
  const inkCost = costConfig.inkCostPerHit * colorCount * locations.length;
  const overheadCost = pricePerPiece * (costConfig.shopOverheadRate / 100);
  // Labor: amortize hourly rate to per-piece (~30 sec per piece for screen print)
  const laborCost = costConfig.laborRate
    ? costConfig.laborRate * (30 / 3600)
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
 */
export function calculateCellMargin(
  tierIndex: number,
  colorCount: number,
  template: PricingTemplate,
  garmentBaseCost: number
): MarginBreakdown {
  const { matrix, costConfig } = template;

  const basePrice = getBasePriceForTier(matrix, tierIndex);
  const colorUpcharge = getColorUpcharge(matrix, colorCount);
  const revenue = basePrice + colorUpcharge;

  const garmentCost =
    costConfig.garmentCostSource === "catalog"
      ? garmentBaseCost
      : (costConfig.manualGarmentCost ?? 0);
  const inkCost = costConfig.inkCostPerHit * colorCount;
  const overheadCost = revenue * (costConfig.shopOverheadRate / 100);

  // Labor: amortize hourly rate to per-piece (~30 sec per piece)
  const laborCost = costConfig.laborRate
    ? costConfig.laborRate * (30 / 3600)
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
 * Returns a 2D array: rows = quantity tiers, columns = color counts (1–8).
 */
export function buildFullMatrixData(
  template: PricingTemplate,
  garmentBaseCost: number
): {
  tierLabel: string;
  cells: { price: number; margin: MarginBreakdown }[];
}[] {
  const { matrix } = template;
  const maxColors = 8;

  return matrix.quantityTiers.map((tier, tierIndex) => {
    const cells = Array.from({ length: maxColors }, (_, i) => {
      const colorCount = i + 1;
      const basePrice = getBasePriceForTier(matrix, tierIndex);
      const colorUpcharge = getColorUpcharge(matrix, colorCount);
      const price = Math.round((basePrice + colorUpcharge) * 100) / 100;
      const margin = calculateCellMargin(tierIndex, colorCount, template, garmentBaseCost);
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

  const avgMargin = allMargins.reduce((sum, m) => sum + m, 0) / allMargins.length;
  return getMarginIndicator(avgMargin);
}

// ---------------------------------------------------------------------------
// DTF Price Calculation
// ---------------------------------------------------------------------------

/** Calculate area of a DTF sheet in square feet. */
function dtfSheetAreaSqFt(width: number, length: number): number {
  return (width * length) / 144; // sq inches to sq feet
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
  const areaSqIn = width * length;

  const filmCost = costConfig.filmCostPerSqFt * areaSqFt;
  const inkCost = costConfig.inkCostPerSqIn * areaSqIn;
  const powderCost = costConfig.powderCostPerSqFt * areaSqFt;
  // Estimate labor: ~2 min per sq ft
  const laborCost = costConfig.laborRatePerHour * (areaSqFt * 2) / 60;
  const equipmentCost = costConfig.equipmentOverheadPerSqFt * areaSqFt;

  const totalCost = filmCost + inkCost + powderCost + laborCost + equipmentCost;

  return {
    filmCost: Math.round(filmCost * 100) / 100,
    inkCost: Math.round(inkCost * 100) / 100,
    powderCost: Math.round(powderCost * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
    equipmentCost: Math.round(equipmentCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
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
  let basePrice = sheetTier.retailPrice;
  if (
    customerTier === "contract" &&
    sheetTier.contractPrice !== undefined
  ) {
    basePrice = sheetTier.contractPrice;
  }

  // Apply customer tier discount
  const tierDiscount = template.customerTierDiscounts.find(
    (d) => d.tier === customerTier
  );
  if (tierDiscount && tierDiscount.discountPercent > 0) {
    basePrice *= 1 - tierDiscount.discountPercent / 100;
  }

  // Apply rush fee
  const rushFee = template.rushFees.find((r) => r.turnaround === rushType);
  if (rushFee) {
    basePrice *= 1 + rushFee.percentageUpcharge / 100;
    if (rushFee.flatFee) basePrice += rushFee.flatFee;
  }

  // Apply film type multiplier
  const filmConfig = template.filmTypes.find((f) => f.type === filmType);
  if (filmConfig) {
    basePrice *= filmConfig.multiplier;
  }

  const price = Math.round(basePrice * 100) / 100;

  // Calculate production cost for margin
  const prodCost = calculateDTFProductionCost(
    sheetTier.width,
    sheetTier.length,
    template.costConfig
  );

  const margin = calculateMargin(price, {
    garmentCost: 0, // no garment for DTF (it's a transfer)
    inkCost: prodCost.inkCost,
    overheadCost:
      prodCost.filmCost +
      prodCost.powderCost +
      prodCost.equipmentCost,
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
    overheadCost:
      prodCost.filmCost +
      prodCost.powderCost +
      prodCost.equipmentCost,
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

  const avgMargin =
    margins.reduce((sum, m) => sum + m.percentage, 0) / margins.length;
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
  return Math.round(basePrice * (1 - discountPercentage / 100) * 100) / 100;
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
  let marginDeltaSum = 0;

  origData.forEach((origRow, rowIdx) => {
    const propRow = propData[rowIdx];
    if (!propRow) return;

    origRow.cells.forEach((origCell, colIdx) => {
      const propCell = propRow.cells[colIdx];
      if (!propCell) return;

      totalCells++;
      if (origCell.price !== propCell.price) {
        changedCells++;
        marginDeltaSum += propCell.margin.percentage - origCell.margin.percentage;
      }
    });
  });

  return {
    changedCells,
    totalCells,
    avgMarginChange: changedCells > 0 ? marginDeltaSum / changedCells : 0,
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
  return `${Math.round(value * 10) / 10}%`;
}
