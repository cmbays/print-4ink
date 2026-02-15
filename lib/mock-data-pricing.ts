import type { PricingTemplate } from "@/lib/schemas/price-matrix";
import type { DTFPricingTemplate } from "@/lib/schemas/dtf-pricing";
import type { TagTemplateMapping } from "@/lib/schemas/tag-template-mapping";

// ---------------------------------------------------------------------------
// Template IDs (stable — referenced by tag mappings and quote line items)
// ---------------------------------------------------------------------------

export const SP_TEMPLATE_IDS = {
  standard: "aa1b2c3d-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  contract: "ab2c3d4e-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  schoolsNonProfit: "ac3d4e5f-a7b8-4c9d-ae1f-2a3b4c5d6e7f",
} as const;

export const DTF_TEMPLATE_IDS = {
  retail: "ad4e5f6a-b8c9-4d0e-8f1a-2b3c4d5e6f7a",
  contract: "ae5f6a7b-c9d0-4e1f-9a2b-3c4d5e6f7a8b",
} as const;

// ---------------------------------------------------------------------------
// Shared timestamp for mock data consistency
// ---------------------------------------------------------------------------

const MOCK_CREATED = "2025-01-15T09:00:00.000Z";
const MOCK_UPDATED = "2025-02-01T14:30:00.000Z";

// ---------------------------------------------------------------------------
// Screen Print — Standard Template
// ---------------------------------------------------------------------------

export const spStandardTemplate: PricingTemplate = {
  id: SP_TEMPLATE_IDS.standard,
  name: "Standard Screen Print",
  serviceType: "screen-print",
  pricingTier: "standard",
  isDefault: true,
  isIndustryDefault: true,
  createdAt: MOCK_CREATED,
  updatedAt: MOCK_UPDATED,
  matrix: {
    quantityTiers: [
      { minQty: 12, maxQty: 23, label: "12–23" },
      { minQty: 24, maxQty: 47, label: "24–47" },
      { minQty: 48, maxQty: 71, label: "48–71" },
      { minQty: 72, maxQty: 143, label: "72–143" },
      { minQty: 144, maxQty: null, label: "144+" },
    ],
    basePriceByTier: [14.0, 11.0, 8.5, 7.0, 5.5],
    priceOverrides: {},
    maxColors: 8,
    colorPricing: [
      { colors: 1, ratePerHit: 0 },
      { colors: 2, ratePerHit: 1.5 },
      { colors: 3, ratePerHit: 1.5 },
      { colors: 4, ratePerHit: 1.5 },
      { colors: 5, ratePerHit: 1.5 },
      { colors: 6, ratePerHit: 1.5 },
      { colors: 7, ratePerHit: 1.5 },
      { colors: 8, ratePerHit: 1.5 },
    ],
    locationUpcharges: [
      { location: "front", upcharge: 0 },
      { location: "back", upcharge: 2.0 },
      { location: "left-sleeve", upcharge: 1.5 },
      { location: "right-sleeve", upcharge: 1.5 },
      { location: "pocket", upcharge: 1.0 },
    ],
    garmentTypePricing: [
      { garmentCategory: "t-shirts", baseMarkup: 0 },
      { garmentCategory: "fleece", baseMarkup: 35 },
      { garmentCategory: "outerwear", baseMarkup: 50 },
      { garmentCategory: "headwear", baseMarkup: 25 },
      { garmentCategory: "pants", baseMarkup: 30 },
    ],
    setupFeeConfig: {
      perScreenFee: 25,
      bulkWaiverThreshold: 144,
      reorderDiscountWindow: 6,
      reorderDiscountPercent: 50,
    },
  },
  costConfig: {
    garmentCostSource: "catalog",
    inkCostPerHit: 0.35,
    shopOverheadRate: 15,
    laborRate: 25,
  },
};

// ---------------------------------------------------------------------------
// Screen Print — Contract Template (10–15% lower than standard)
// ---------------------------------------------------------------------------

export const spContractTemplate: PricingTemplate = {
  id: SP_TEMPLATE_IDS.contract,
  name: "Contract Screen Print",
  serviceType: "screen-print",
  pricingTier: "contract",
  isDefault: false,
  isIndustryDefault: false,
  createdAt: MOCK_CREATED,
  updatedAt: MOCK_UPDATED,
  matrix: {
    quantityTiers: [
      { minQty: 12, maxQty: 23, label: "12–23" },
      { minQty: 24, maxQty: 47, label: "24–47" },
      { minQty: 48, maxQty: 71, label: "48–71" },
      { minQty: 72, maxQty: 143, label: "72–143" },
      { minQty: 144, maxQty: null, label: "144+" },
    ],
    // ~12% lower across the board
    basePriceByTier: [12.25, 9.5, 7.25, 6.0, 4.75],
    priceOverrides: {},
    maxColors: 8,
    colorPricing: [
      { colors: 1, ratePerHit: 0 },
      { colors: 2, ratePerHit: 1.3 },
      { colors: 3, ratePerHit: 1.3 },
      { colors: 4, ratePerHit: 1.3 },
      { colors: 5, ratePerHit: 1.3 },
      { colors: 6, ratePerHit: 1.3 },
      { colors: 7, ratePerHit: 1.3 },
      { colors: 8, ratePerHit: 1.3 },
    ],
    locationUpcharges: [
      { location: "front", upcharge: 0 },
      { location: "back", upcharge: 1.75 },
      { location: "left-sleeve", upcharge: 1.25 },
      { location: "right-sleeve", upcharge: 1.25 },
      { location: "pocket", upcharge: 0.85 },
    ],
    garmentTypePricing: [
      { garmentCategory: "t-shirts", baseMarkup: 0 },
      { garmentCategory: "fleece", baseMarkup: 35 },
      { garmentCategory: "outerwear", baseMarkup: 50 },
      { garmentCategory: "headwear", baseMarkup: 25 },
      { garmentCategory: "pants", baseMarkup: 30 },
    ],
    setupFeeConfig: {
      perScreenFee: 20,
      bulkWaiverThreshold: 72,
      reorderDiscountWindow: 6,
      reorderDiscountPercent: 50,
    },
  },
  costConfig: {
    garmentCostSource: "catalog",
    inkCostPerHit: 0.35,
    shopOverheadRate: 15,
    laborRate: 25,
  },
};

// ---------------------------------------------------------------------------
// Screen Print — Schools/Non-Profit Template (~8–12% lower than standard)
// ---------------------------------------------------------------------------

export const spSchoolsTemplate: PricingTemplate = {
  id: SP_TEMPLATE_IDS.schoolsNonProfit,
  name: "Schools & Non-Profit Screen Print",
  serviceType: "screen-print",
  pricingTier: "schools",
  isDefault: false,
  isIndustryDefault: false,
  createdAt: MOCK_CREATED,
  updatedAt: MOCK_UPDATED,
  matrix: {
    quantityTiers: [
      { minQty: 12, maxQty: 23, label: "12–23" },
      { minQty: 24, maxQty: 47, label: "24–47" },
      { minQty: 48, maxQty: 71, label: "48–71" },
      { minQty: 72, maxQty: 143, label: "72–143" },
      { minQty: 144, maxQty: null, label: "144+" },
    ],
    // ~10% lower than standard
    basePriceByTier: [12.75, 10.0, 7.75, 6.35, 5.0],
    priceOverrides: {},
    maxColors: 8,
    colorPricing: [
      { colors: 1, ratePerHit: 0 },
      { colors: 2, ratePerHit: 1.35 },
      { colors: 3, ratePerHit: 1.35 },
      { colors: 4, ratePerHit: 1.35 },
      { colors: 5, ratePerHit: 1.35 },
      { colors: 6, ratePerHit: 1.35 },
      { colors: 7, ratePerHit: 1.35 },
      { colors: 8, ratePerHit: 1.35 },
    ],
    locationUpcharges: [
      { location: "front", upcharge: 0 },
      { location: "back", upcharge: 1.75 },
      { location: "left-sleeve", upcharge: 1.35 },
      { location: "right-sleeve", upcharge: 1.35 },
      { location: "pocket", upcharge: 0.9 },
    ],
    garmentTypePricing: [
      { garmentCategory: "t-shirts", baseMarkup: 0 },
      { garmentCategory: "fleece", baseMarkup: 35 },
      { garmentCategory: "outerwear", baseMarkup: 50 },
      { garmentCategory: "headwear", baseMarkup: 25 },
      { garmentCategory: "pants", baseMarkup: 30 },
    ],
    setupFeeConfig: {
      perScreenFee: 20,
      bulkWaiverThreshold: 144,
      reorderDiscountWindow: 6,
      reorderDiscountPercent: 50,
    },
  },
  costConfig: {
    garmentCostSource: "catalog",
    inkCostPerHit: 0.35,
    shopOverheadRate: 15,
    laborRate: 25,
  },
};

// ---------------------------------------------------------------------------
// DTF — Retail Template (4Ink actual prices)
// ---------------------------------------------------------------------------

export const dtfRetailTemplate: DTFPricingTemplate = {
  id: DTF_TEMPLATE_IDS.retail,
  name: "DTF Retail",
  serviceType: "dtf",
  isDefault: true,
  isIndustryDefault: false,
  createdAt: MOCK_CREATED,
  updatedAt: MOCK_UPDATED,
  sheetTiers: [
    { width: 22, length: 24, retailPrice: 18 },
    { width: 22, length: 48, retailPrice: 27 },
    { width: 22, length: 76, retailPrice: 42 },
    { width: 22, length: 100, retailPrice: 57 },
    { width: 22, length: 136, retailPrice: 77 },
    { width: 22, length: 164, retailPrice: 92 },
    { width: 22, length: 194, retailPrice: 110 },
    { width: 22, length: 219, retailPrice: 124 },
    { width: 22, length: 240, retailPrice: 138 },
  ],
  rushFees: [
    { turnaround: "standard", percentageUpcharge: 0 },
    { turnaround: "2-day", percentageUpcharge: 25 },
    { turnaround: "next-day", percentageUpcharge: 50 },
    { turnaround: "same-day", percentageUpcharge: 75, flatFee: 15 },
  ],
  filmTypes: [
    { type: "standard", multiplier: 1.0 },
    { type: "glossy", multiplier: 1.1 },
    { type: "metallic", multiplier: 1.3 },
    { type: "glow", multiplier: 1.5 },
  ],
  customerTierDiscounts: [
    { tier: "standard", discountPercent: 0 },
    { tier: "preferred", discountPercent: 5 },
    { tier: "contract", discountPercent: 15 },
    { tier: "wholesale", discountPercent: 20 },
  ],
  costConfig: {
    filmCostPerSqFt: 0.45,
    inkCostPerSqIn: 0.008,
    powderCostPerSqFt: 0.15,
    laborRatePerHour: 22,
    equipmentOverheadPerSqFt: 0.2,
  },
};

// ---------------------------------------------------------------------------
// DTF — Contract Template (~15% lower than retail)
// ---------------------------------------------------------------------------

export const dtfContractTemplate: DTFPricingTemplate = {
  id: DTF_TEMPLATE_IDS.contract,
  name: "DTF Contract",
  serviceType: "dtf",
  isDefault: false,
  isIndustryDefault: false,
  createdAt: MOCK_CREATED,
  updatedAt: MOCK_UPDATED,
  sheetTiers: [
    { width: 22, length: 24, retailPrice: 18, contractPrice: 15.3 },
    { width: 22, length: 48, retailPrice: 27, contractPrice: 23.0 },
    { width: 22, length: 76, retailPrice: 42, contractPrice: 35.7 },
    { width: 22, length: 100, retailPrice: 57, contractPrice: 48.45 },
    { width: 22, length: 136, retailPrice: 77, contractPrice: 65.45 },
    { width: 22, length: 164, retailPrice: 92, contractPrice: 78.2 },
    { width: 22, length: 194, retailPrice: 110, contractPrice: 93.5 },
    { width: 22, length: 219, retailPrice: 124, contractPrice: 105.4 },
    { width: 22, length: 240, retailPrice: 138, contractPrice: 117.3 },
  ],
  rushFees: [
    { turnaround: "standard", percentageUpcharge: 0 },
    { turnaround: "2-day", percentageUpcharge: 25 },
    { turnaround: "next-day", percentageUpcharge: 50 },
    { turnaround: "same-day", percentageUpcharge: 75, flatFee: 15 },
  ],
  filmTypes: [
    { type: "standard", multiplier: 1.0 },
    { type: "glossy", multiplier: 1.1 },
    { type: "metallic", multiplier: 1.3 },
    { type: "glow", multiplier: 1.5 },
  ],
  customerTierDiscounts: [
    { tier: "standard", discountPercent: 0 },
    { tier: "preferred", discountPercent: 5 },
    { tier: "contract", discountPercent: 15 },
    { tier: "wholesale", discountPercent: 20 },
  ],
  costConfig: {
    filmCostPerSqFt: 0.45,
    inkCostPerSqIn: 0.008,
    powderCostPerSqFt: 0.15,
    laborRatePerHour: 22,
    equipmentOverheadPerSqFt: 0.2,
  },
};

// ---------------------------------------------------------------------------
// Convenience arrays
// ---------------------------------------------------------------------------

export const allScreenPrintTemplates: PricingTemplate[] = [
  spStandardTemplate,
  spContractTemplate,
  spSchoolsTemplate,
];

export const allDTFTemplates: DTFPricingTemplate[] = [
  dtfRetailTemplate,
  dtfContractTemplate,
];

// ---------------------------------------------------------------------------
// Tag → Template Mappings
// ---------------------------------------------------------------------------

export const tagTemplateMappings: TagTemplateMapping[] = [
  {
    customerTypeTag: "retail",
    screenPrintTemplateId: SP_TEMPLATE_IDS.standard,
    dtfTemplateId: DTF_TEMPLATE_IDS.retail,
  },
  {
    customerTypeTag: "sports-school",
    screenPrintTemplateId: SP_TEMPLATE_IDS.schoolsNonProfit,
    dtfTemplateId: DTF_TEMPLATE_IDS.contract,
  },
  {
    customerTypeTag: "corporate",
    screenPrintTemplateId: SP_TEMPLATE_IDS.standard,
    dtfTemplateId: DTF_TEMPLATE_IDS.retail,
  },
  {
    customerTypeTag: "storefront-merch",
    screenPrintTemplateId: SP_TEMPLATE_IDS.standard,
    dtfTemplateId: DTF_TEMPLATE_IDS.retail,
  },
  {
    customerTypeTag: "wholesale",
    screenPrintTemplateId: SP_TEMPLATE_IDS.contract,
    dtfTemplateId: DTF_TEMPLATE_IDS.contract,
  },
];
