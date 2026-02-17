import { z } from "zod";
import { pricingTierEnum } from "./customer";

// ---------------------------------------------------------------------------
// DTF Film Types
// ---------------------------------------------------------------------------

export const dtfFilmTypeEnum = z.enum([
  "standard",
  "glossy",
  "metallic",
  "glow",
]);

// ---------------------------------------------------------------------------
// DTF Rush Turnaround
// ---------------------------------------------------------------------------

export const dtfRushTurnaroundEnum = z.enum([
  "standard",
  "2-day",
  "next-day",
  "same-day",
]);

// ---------------------------------------------------------------------------
// DTF Sheet Size Tier
// ---------------------------------------------------------------------------

export const dtfSheetTierSchema = z.object({
  width: z.literal(22), // fixed 22" width
  length: z.number().positive(),
  retailPrice: z.number().nonnegative(),
  contractPrice: z.number().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// DTF Rush Fees
// ---------------------------------------------------------------------------

export const dtfRushFeeSchema = z.object({
  turnaround: dtfRushTurnaroundEnum,
  percentageUpcharge: z.number().min(0).max(200),
  flatFee: z.number().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// DTF Film Type Multipliers
// ---------------------------------------------------------------------------

export const dtfFilmTypeSchema = z.object({
  type: dtfFilmTypeEnum,
  multiplier: z.number().positive(), // standard=1.0, metallic=1.3, glow=1.5
});

// ---------------------------------------------------------------------------
// DTF Customer Tier Discounts
// ---------------------------------------------------------------------------

export const dtfCustomerTierDiscountSchema = z.object({
  tier: pricingTierEnum,
  discountPercent: z.number().min(0).max(100),
});

// ---------------------------------------------------------------------------
// DTF Cost Configuration (for margin calculations)
// ---------------------------------------------------------------------------

export const dtfCostConfigSchema = z.object({
  filmCostPerSqFt: z.number().nonnegative(),
  inkCostPerSqIn: z.number().nonnegative(),
  powderCostPerSqFt: z.number().nonnegative(),
  laborRatePerHour: z.number().nonnegative(),
  equipmentOverheadPerSqFt: z.number().nonnegative(),
});

// ---------------------------------------------------------------------------
// DTF Pricing Template
// ---------------------------------------------------------------------------

export const dtfPricingTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  serviceType: z.literal("dtf"),
  sheetTiers: z.array(dtfSheetTierSchema),
  rushFees: z.array(dtfRushFeeSchema),
  filmTypes: z.array(dtfFilmTypeSchema),
  customerTierDiscounts: z.array(dtfCustomerTierDiscountSchema),
  costConfig: dtfCostConfigSchema,
  isDefault: z.boolean().default(false),
  isIndustryDefault: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DTFFilmType = z.infer<typeof dtfFilmTypeEnum>;
export type DTFRushTurnaround = z.infer<typeof dtfRushTurnaroundEnum>;
export type DTFSheetTier = z.infer<typeof dtfSheetTierSchema>;
export type DTFRushFee = z.infer<typeof dtfRushFeeSchema>;
export type DTFFilmTypeConfig = z.infer<typeof dtfFilmTypeSchema>;
export type DTFCustomerTierDiscount = z.infer<typeof dtfCustomerTierDiscountSchema>;
export type DTFCostConfig = z.infer<typeof dtfCostConfigSchema>;
export type DTFPricingTemplate = z.infer<typeof dtfPricingTemplateSchema>;
