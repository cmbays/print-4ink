import { z } from "zod";
import { garmentCategoryEnum } from "./garment";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const marginIndicatorEnum = z.enum(["healthy", "caution", "unprofitable"]);

export const editorModeEnum = z.enum(["simple", "power"]);

export const printLocationEnum = z.enum([
  "front",
  "back",
  "left-sleeve",
  "right-sleeve",
  "pocket",
]);

// ---------------------------------------------------------------------------
// Quantity Tiers
// ---------------------------------------------------------------------------

export const quantityTierSchema = z.object({
  minQty: z.number().int().positive(),
  maxQty: z.number().int().positive().nullable(), // null = unlimited (e.g., 144+)
  label: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Color Pricing — per-color hit rate by quantity tier
// ---------------------------------------------------------------------------

export const colorPricingSchema = z.object({
  colors: z.number().int().min(1).max(8),
  ratePerHit: z.number().nonnegative(), // additional cost per color hit
});

// ---------------------------------------------------------------------------
// Location Upcharges
// ---------------------------------------------------------------------------

export const locationUpchargeSchema = z.object({
  location: printLocationEnum,
  upcharge: z.number().nonnegative(), // flat upcharge per piece
});

// ---------------------------------------------------------------------------
// Garment Type Pricing
// ---------------------------------------------------------------------------

export const garmentTypePricingSchema = z.object({
  garmentCategory: garmentCategoryEnum,
  baseMarkup: z.number().nonnegative(), // percentage markup over t-shirt base
  setupFeeOverride: z.number().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// Setup Fee Configuration
// ---------------------------------------------------------------------------

export const setupFeeConfigSchema = z.object({
  perScreenFee: z.number().nonnegative(), // fee per screen/color
  bulkWaiverThreshold: z.number().int().nonnegative(), // qty above which setup is waived
  reorderDiscountWindow: z.number().int().nonnegative(), // months within which reorder gets discounted setup
  reorderDiscountPercent: z.number().min(0).max(100), // discount percentage for reorders
});

// ---------------------------------------------------------------------------
// Cost Configuration (for margin calculations)
// ---------------------------------------------------------------------------

export const costConfigSchema = z
  .object({
    garmentCostSource: z.enum(["catalog", "manual"]),
    manualGarmentCost: z.number().nonnegative().optional(), // used when source is "manual"
    inkCostPerHit: z.number().nonnegative(),
    shopOverheadRate: z.number().nonnegative(), // percentage of revenue
    laborRate: z.number().nonnegative().optional(), // per hour (optional)
  })
  .refine(
    (data) =>
      data.garmentCostSource !== "manual" ||
      (data.manualGarmentCost !== undefined && data.manualGarmentCost >= 0),
    { message: "Manual garment cost is required when source is 'manual'", path: ["manualGarmentCost"] }
  );

// ---------------------------------------------------------------------------
// Screen Print Matrix — the core pricing data structure
// ---------------------------------------------------------------------------

export const screenPrintMatrixSchema = z
  .object({
    quantityTiers: z.array(quantityTierSchema),
    colorPricing: z.array(colorPricingSchema),
    locationUpcharges: z.array(locationUpchargeSchema),
    garmentTypePricing: z.array(garmentTypePricingSchema),
    setupFeeConfig: setupFeeConfigSchema,
    // Base price grid: quantity tier index → base price per piece
    basePriceByTier: z.array(z.number().nonnegative()),
    // Per-cell price overrides: key = "tierIndex-colIndex", value = price.
    // When set, the override takes precedence over basePriceByTier + colorUpcharge.
    // Power mode sets these when the user explicitly types a value into a cell.
    priceOverrides: z.record(z.string(), z.number().nonnegative()).default({}),
    // Max number of color columns shown in the pricing matrix (1–12, default 8).
    maxColors: z.number().int().min(1).max(12).default(8),
  })
  .refine(
    (data) => data.basePriceByTier.length === data.quantityTiers.length,
    { message: "basePriceByTier must have the same length as quantityTiers" }
  );

// ---------------------------------------------------------------------------
// Pricing Template — wraps a matrix with metadata
// ---------------------------------------------------------------------------

export const pricingTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  serviceType: z.literal("screen-print"),
  pricingTier: z.string().min(1), // e.g., "standard", "contract", "schools"
  matrix: screenPrintMatrixSchema,
  costConfig: costConfigSchema,
  isDefault: z.boolean().default(false),
  isIndustryDefault: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Margin Breakdown
// ---------------------------------------------------------------------------

export const marginBreakdownSchema = z.object({
  revenue: z.number().nonnegative(),
  garmentCost: z.number().nonnegative(),
  inkCost: z.number().nonnegative(),
  overheadCost: z.number().nonnegative(),
  laborCost: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative(),
  profit: z.number(),
  percentage: z.number(),
  indicator: marginIndicatorEnum,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MarginIndicator = z.infer<typeof marginIndicatorEnum>;
export type EditorMode = z.infer<typeof editorModeEnum>;
export type PrintLocation = z.infer<typeof printLocationEnum>;
export type QuantityTier = z.infer<typeof quantityTierSchema>;
export type ColorPricing = z.infer<typeof colorPricingSchema>;
export type LocationUpcharge = z.infer<typeof locationUpchargeSchema>;
export type GarmentTypePricing = z.infer<typeof garmentTypePricingSchema>;
export type SetupFeeConfig = z.infer<typeof setupFeeConfigSchema>;
export type CostConfig = z.infer<typeof costConfigSchema>;
export type ScreenPrintMatrix = z.infer<typeof screenPrintMatrixSchema>;
export type PricingTemplate = z.infer<typeof pricingTemplateSchema>;
export type MarginBreakdown = z.infer<typeof marginBreakdownSchema>;
