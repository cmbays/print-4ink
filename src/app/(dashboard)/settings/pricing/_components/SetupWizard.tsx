"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shared/ui/primitives/dialog";
import { Button } from "@shared/ui/primitives/button";
import { Input } from "@shared/ui/primitives/input";
import { Label } from "@shared/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/primitives/select";
import { Checkbox } from "@shared/ui/primitives/checkbox";
import { Separator } from "@shared/ui/primitives/separator";
import { MarginIndicator } from "@/components/features/MarginIndicator";
import {
  Printer,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { money, toNumber } from "@domain/lib/money";
import { cn } from "@shared/lib/cn";
import { PRICING_TIER_LABELS, GARMENT_CATEGORY_LABELS } from "@domain/constants";
import {
  buildFullMatrixData,
  calculateDTFTierMargin,
  calculateScreenPrintPrice,
  calculateDTFPrice,
  formatCurrency,
  formatPercent,
} from "@domain/services/pricing.service";
import { spStandardTemplate, dtfRetailTemplate } from "@/lib/mock-data-pricing";
import type { PricingTemplate, QuantityTier, ScreenPrintMatrix, CostConfig } from "@domain/entities/price-matrix";
import type { DTFPricingTemplate, DTFSheetTier, DTFRushFee, DTFFilmTypeConfig, DTFCustomerTierDiscount, DTFCostConfig } from "@domain/entities/dtf-pricing";
import type { PricingTier } from "@domain/entities/customer";
import type { GarmentCategory } from "@domain/entities/garment";
import type { ServiceType } from "@domain/entities/quote";

interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: PricingTemplate | DTFPricingTemplate) => void;
}

// ---------------------------------------------------------------------------
// Default data factories
// ---------------------------------------------------------------------------

function defaultSPMatrix(): ScreenPrintMatrix {
  return {
    quantityTiers: [
      { minQty: 12, maxQty: 23, label: "12-23" },
      { minQty: 24, maxQty: 47, label: "24-47" },
      { minQty: 48, maxQty: 71, label: "48-71" },
      { minQty: 72, maxQty: 143, label: "72-143" },
      { minQty: 144, maxQty: null, label: "144+" },
    ],
    basePriceByTier: [14.0, 11.0, 8.5, 7.0, 5.5],
    priceOverrides: {},
    maxColors: 8,
    colorPricing: [
      { colors: 1, ratePerHit: 1.5 },
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
      { garmentCategory: "t-shirts" as GarmentCategory, baseMarkup: 0 },
      { garmentCategory: "fleece" as GarmentCategory, baseMarkup: 35 },
      { garmentCategory: "outerwear" as GarmentCategory, baseMarkup: 50 },
      { garmentCategory: "headwear" as GarmentCategory, baseMarkup: 25 },
      { garmentCategory: "pants" as GarmentCategory, baseMarkup: 30 },
    ],
    setupFeeConfig: {
      perScreenFee: 25,
      bulkWaiverThreshold: 144,
      reorderDiscountWindow: 6,
      reorderDiscountPercent: 50,
    },
  };
}

function defaultCostConfig(): CostConfig {
  return {
    garmentCostSource: "catalog",
    inkCostPerHit: 0.35,
    shopOverheadRate: 15,
    laborRate: 25,
  };
}

function defaultDTFSheetTiers(): DTFSheetTier[] {
  return [
    { width: 22, length: 24, retailPrice: 18 },
    { width: 22, length: 48, retailPrice: 27 },
    { width: 22, length: 76, retailPrice: 42 },
    { width: 22, length: 100, retailPrice: 57 },
    { width: 22, length: 136, retailPrice: 77 },
  ];
}

function defaultDTFRushFees(): DTFRushFee[] {
  return [
    { turnaround: "standard", percentageUpcharge: 0 },
    { turnaround: "2-day", percentageUpcharge: 25 },
    { turnaround: "next-day", percentageUpcharge: 50 },
    { turnaround: "same-day", percentageUpcharge: 75, flatFee: 15 },
  ];
}

function defaultDTFFilmTypes(): DTFFilmTypeConfig[] {
  return [
    { type: "standard", multiplier: 1.0 },
    { type: "glossy", multiplier: 1.1 },
    { type: "metallic", multiplier: 1.3 },
    { type: "glow", multiplier: 1.5 },
  ];
}

function defaultDTFCustomerDiscounts(): DTFCustomerTierDiscount[] {
  return [
    { tier: "standard", discountPercent: 0 },
    { tier: "preferred", discountPercent: 5 },
    { tier: "contract", discountPercent: 15 },
    { tier: "wholesale", discountPercent: 20 },
  ];
}

function defaultDTFCostConfig(): DTFCostConfig {
  return {
    filmCostPerSqFt: 0.45,
    inkCostPerSqIn: 0.008,
    powderCostPerSqFt: 0.15,
    laborRatePerHour: 22,
    equipmentOverheadPerSqFt: 0.2,
  };
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Service", "Basics", "Pricing", "Settings", "Preview"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6",
                  isCompleted ? "bg-action" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isActive && "bg-action text-white",
                  isCompleted && "bg-action/20 text-action",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="size-3" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs hidden sm:inline",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Service Type Selection
// ---------------------------------------------------------------------------

function ServiceTypeStep({
  value,
  onChange,
}: {
  value: ServiceType | null;
  onChange: (v: ServiceType) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the service type for this pricing template.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onChange("screen-print")}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "active:scale-[0.98]",
            value === "screen-print"
              ? "border-action bg-action/5"
              : "border-border hover:border-muted-foreground/40"
          )}
        >
          <Printer
            className={cn(
              "size-8",
              value === "screen-print" ? "text-action" : "text-muted-foreground"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">Screen Print</p>
            <p className="text-xs text-muted-foreground mt-1">
              Quantity tiers, color pricing, setup fees
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange("dtf")}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "active:scale-[0.98]",
            value === "dtf"
              ? "border-action bg-action/5"
              : "border-border hover:border-muted-foreground/40"
          )}
        >
          <Layers
            className={cn(
              "size-8",
              value === "dtf" ? "text-action" : "text-muted-foreground"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">DTF Transfer</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sheet sizes, film types, rush fees
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Template Basics
// ---------------------------------------------------------------------------

function BasicsStep({
  name,
  onNameChange,
  pricingTier,
  onPricingTierChange,
  useIndustryTemplate,
  onUseIndustryTemplateChange,
  serviceType,
}: {
  name: string;
  onNameChange: (v: string) => void;
  pricingTier: PricingTier;
  onPricingTierChange: (v: PricingTier) => void;
  useIndustryTemplate: boolean;
  onUseIndustryTemplateChange: (v: boolean) => void;
  serviceType: ServiceType;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          placeholder={
            serviceType === "screen-print"
              ? "e.g., Standard Screen Print"
              : "e.g., DTF Retail"
          }
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pricing-tier">Pricing Tier</Label>
        <Select value={pricingTier} onValueChange={(v) => onPricingTierChange(v as PricingTier)}>
          <SelectTrigger id="pricing-tier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PRICING_TIER_LABELS) as [PricingTier, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="flex items-center gap-3">
        <Checkbox
          id="use-industry"
          checked={useIndustryTemplate}
          onCheckedChange={(checked) =>
            onUseIndustryTemplateChange(checked === true)
          }
        />
        <div>
          <Label htmlFor="use-industry" className="cursor-pointer">
            Start from Industry Template
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-fills pricing and settings with{" "}
            {serviceType === "screen-print"
              ? "standard screen print"
              : "retail DTF"}{" "}
            industry defaults
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: SP Pricing
// ---------------------------------------------------------------------------

function SPPricingStep({
  quantityTiers,
  basePriceByTier,
  onTiersChange,
  onBasePricesChange,
}: {
  quantityTiers: QuantityTier[];
  basePriceByTier: number[];
  onTiersChange: (tiers: QuantityTier[]) => void;
  onBasePricesChange: (prices: number[]) => void;
}) {
  const addTier = () => {
    const lastTier = quantityTiers[quantityTiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQty ?? lastTier.minQty) + 1 : 1;
    onTiersChange([
      ...quantityTiers.map((t, i) =>
        i === quantityTiers.length - 1 && t.maxQty === null
          ? { ...t, maxQty: newMin - 1, label: `${t.minQty}-${newMin - 1}` }
          : t
      ),
      { minQty: newMin, maxQty: null, label: `${newMin}+` },
    ]);
    onBasePricesChange([...basePriceByTier, 0]);
  };

  const removeTier = (idx: number) => {
    if (quantityTiers.length <= 1) return;
    const newTiers = quantityTiers.filter((_, i) => i !== idx);
    // Make the last tier open-ended
    if (newTiers.length > 0) {
      const lastIdx = newTiers.length - 1;
      newTiers[lastIdx] = {
        ...newTiers[lastIdx],
        maxQty: null,
        label: `${newTiers[lastIdx].minQty}+`,
      };
    }
    onTiersChange(newTiers);
    onBasePricesChange(basePriceByTier.filter((_, i) => i !== idx));
  };

  const updateBasePrice = (idx: number, val: string) => {
    const num = parseFloat(val) || 0;
    const newPrices = [...basePriceByTier];
    newPrices[idx] = num;
    onBasePricesChange(newPrices);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Quantity Tiers & Base Prices</p>
          <p className="text-xs text-muted-foreground">
            Set quantity breakpoints and base price per piece (1 color, front only)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addTier}>
          <Plus className="size-3.5" />
          Add Tier
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border text-xs font-medium text-muted-foreground">
          <div className="bg-card px-3 py-2">Min Qty</div>
          <div className="bg-card px-3 py-2">Max Qty</div>
          <div className="bg-card px-3 py-2">Base Price</div>
          <div className="bg-card px-3 py-2 w-10" />
        </div>
        {quantityTiers.map((tier, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border"
          >
            <div className="bg-background px-2 py-1.5">
              <Input
                type="number"
                min={1}
                value={tier.minQty}
                onChange={(e) => {
                  const newTiers = [...quantityTiers];
                  newTiers[idx] = {
                    ...newTiers[idx],
                    minQty: parseInt(e.target.value) || 1,
                  };
                  // Update label
                  newTiers[idx].label = newTiers[idx].maxQty === null
                    ? `${newTiers[idx].minQty}+`
                    : `${newTiers[idx].minQty}-${newTiers[idx].maxQty}`;
                  onTiersChange(newTiers);
                }}
                className="h-7 text-xs"
              />
            </div>
            <div className="bg-background px-2 py-1.5">
              {tier.maxQty === null ? (
                <span className="flex h-7 items-center text-xs text-muted-foreground px-2">
                  Unlimited
                </span>
              ) : (
                <Input
                  type="number"
                  min={tier.minQty}
                  value={tier.maxQty}
                  onChange={(e) => {
                    const newTiers = [...quantityTiers];
                    newTiers[idx] = {
                      ...newTiers[idx],
                      maxQty: parseInt(e.target.value) || tier.minQty,
                    };
                    newTiers[idx].label = `${newTiers[idx].minQty}-${newTiers[idx].maxQty}`;
                    onTiersChange(newTiers);
                  }}
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="bg-background px-2 py-1.5">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={basePriceByTier[idx] ?? 0}
                  onChange={(e) => updateBasePrice(idx, e.target.value)}
                  className="h-7 text-xs pl-5"
                />
              </div>
            </div>
            <div className="bg-background flex items-center justify-center w-10">
              <button
                type="button"
                onClick={() => removeTier(idx)}
                disabled={quantityTiers.length <= 1}
                className="text-muted-foreground hover:text-error disabled:opacity-30 transition-colors"
                aria-label={`Remove tier ${tier.label}`}
              >
                <Minus className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: DTF Pricing
// ---------------------------------------------------------------------------

function DTFPricingStep({
  sheetTiers,
  onSheetTiersChange,
}: {
  sheetTiers: DTFSheetTier[];
  onSheetTiersChange: (tiers: DTFSheetTier[]) => void;
}) {
  const addTier = () => {
    const lastTier = sheetTiers[sheetTiers.length - 1];
    const newLength = lastTier ? lastTier.length + 24 : 24;
    onSheetTiersChange([
      ...sheetTiers,
      { width: 22, length: newLength, retailPrice: 0 },
    ]);
  };

  const removeTier = (idx: number) => {
    if (sheetTiers.length <= 1) return;
    onSheetTiersChange(sheetTiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Sheet Size Tiers</p>
          <p className="text-xs text-muted-foreground">
            Fixed 22&quot; width. Set length and retail price per sheet.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addTier}>
          <Plus className="size-3.5" />
          Add Tier
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border text-xs font-medium text-muted-foreground">
          <div className="bg-card px-3 py-2">Width</div>
          <div className="bg-card px-3 py-2">Length (in)</div>
          <div className="bg-card px-3 py-2">Retail Price</div>
          <div className="bg-card px-3 py-2 w-10" />
        </div>
        {sheetTiers.map((tier, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border"
          >
            <div className="bg-background flex items-center px-3 py-1.5">
              <span className="text-xs text-muted-foreground">22&quot;</span>
            </div>
            <div className="bg-background px-2 py-1.5">
              <Input
                type="number"
                min={1}
                value={tier.length}
                onChange={(e) => {
                  const newTiers = [...sheetTiers];
                  newTiers[idx] = {
                    ...newTiers[idx],
                    length: parseInt(e.target.value) || 1,
                  };
                  onSheetTiersChange(newTiers);
                }}
                className="h-7 text-xs"
              />
            </div>
            <div className="bg-background px-2 py-1.5">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={tier.retailPrice}
                  onChange={(e) => {
                    const newTiers = [...sheetTiers];
                    newTiers[idx] = {
                      ...newTiers[idx],
                      retailPrice: parseFloat(e.target.value) || 0,
                    };
                    onSheetTiersChange(newTiers);
                  }}
                  className="h-7 text-xs pl-5"
                />
              </div>
            </div>
            <div className="bg-background flex items-center justify-center w-10">
              <button
                type="button"
                onClick={() => removeTier(idx)}
                disabled={sheetTiers.length <= 1}
                className="text-muted-foreground hover:text-error disabled:opacity-30 transition-colors"
                aria-label={`Remove sheet tier ${tier.length}"`}
              >
                <Minus className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: SP Settings
// ---------------------------------------------------------------------------

function SPSettingsStep({
  matrix,
  onMatrixChange,
}: {
  matrix: ScreenPrintMatrix;
  onMatrixChange: (m: ScreenPrintMatrix) => void;
}) {
  const locationLabels: Record<string, string> = {
    front: "Front (base)",
    back: "Back",
    "left-sleeve": "Left Sleeve",
    "right-sleeve": "Right Sleeve",
    pocket: "Pocket",
  };

  return (
    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-1">
      {/* Color Hit Rate */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Color Hit Rate</p>
          <p className="text-xs text-muted-foreground">
            Per-color upcharge applied to every color hit
          </p>
        </div>
        <div className="relative w-40">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={matrix.colorPricing[0]?.ratePerHit ?? 1.5}
            onChange={(e) => {
              const rate = parseFloat(e.target.value) || 0;
              const newColorPricing = matrix.colorPricing.map((cp) => ({
                ...cp,
                ratePerHit: rate,
              }));
              onMatrixChange({ ...matrix, colorPricing: newColorPricing });
            }}
            className="h-8 text-xs pl-5"
          />
        </div>
      </div>

      <Separator />

      {/* Location Upcharges */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Location Upcharges</p>
          <p className="text-xs text-muted-foreground">
            Additional cost per piece by print location
          </p>
        </div>
        <div className="grid gap-2">
          {matrix.locationUpcharges.map((loc, idx) => (
            <div key={loc.location} className="flex items-center gap-3">
              <span className="text-xs w-28 text-muted-foreground">
                {locationLabels[loc.location] ?? loc.location}
              </span>
              <div className="relative w-28">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={loc.upcharge}
                  disabled={loc.location === "front"}
                  onChange={(e) => {
                    const newUpcharges = [...matrix.locationUpcharges];
                    newUpcharges[idx] = {
                      ...newUpcharges[idx],
                      upcharge: parseFloat(e.target.value) || 0,
                    };
                    onMatrixChange({
                      ...matrix,
                      locationUpcharges: newUpcharges,
                    });
                  }}
                  className="h-7 text-xs pl-5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Garment Type Markups */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Garment Type Markups</p>
          <p className="text-xs text-muted-foreground">
            Percentage markup over t-shirt base price
          </p>
        </div>
        <div className="grid gap-2">
          {matrix.garmentTypePricing.map((gtp, idx) => (
            <div key={gtp.garmentCategory} className="flex items-center gap-3">
              <span className="text-xs w-28 text-muted-foreground">
                {GARMENT_CATEGORY_LABELS[gtp.garmentCategory as GarmentCategory] ??
                  gtp.garmentCategory}
              </span>
              <div className="relative w-28">
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={gtp.baseMarkup}
                  disabled={gtp.garmentCategory === "t-shirts"}
                  onChange={(e) => {
                    const newGtp = [...matrix.garmentTypePricing];
                    newGtp[idx] = {
                      ...newGtp[idx],
                      baseMarkup: parseFloat(e.target.value) || 0,
                    };
                    onMatrixChange({ ...matrix, garmentTypePricing: newGtp });
                  }}
                  className="h-7 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Setup Fees */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Setup Fees</p>
          <p className="text-xs text-muted-foreground">
            Per-screen fees, waivers, and reorder discounts
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Per Screen Fee</Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                step={5}
                value={matrix.setupFeeConfig.perScreenFee}
                onChange={(e) =>
                  onMatrixChange({
                    ...matrix,
                    setupFeeConfig: {
                      ...matrix.setupFeeConfig,
                      perScreenFee: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-7 text-xs pl-5"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bulk Waiver Threshold</Label>
            <Input
              type="number"
              min={0}
              value={matrix.setupFeeConfig.bulkWaiverThreshold}
              onChange={(e) =>
                onMatrixChange({
                  ...matrix,
                  setupFeeConfig: {
                    ...matrix.setupFeeConfig,
                    bulkWaiverThreshold: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reorder Window (months)</Label>
            <Input
              type="number"
              min={0}
              value={matrix.setupFeeConfig.reorderDiscountWindow}
              onChange={(e) =>
                onMatrixChange({
                  ...matrix,
                  setupFeeConfig: {
                    ...matrix.setupFeeConfig,
                    reorderDiscountWindow: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reorder Discount</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                value={matrix.setupFeeConfig.reorderDiscountPercent}
                onChange={(e) =>
                  onMatrixChange({
                    ...matrix,
                    setupFeeConfig: {
                      ...matrix.setupFeeConfig,
                      reorderDiscountPercent: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-7 text-xs"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: DTF Settings
// ---------------------------------------------------------------------------

function DTFSettingsStep({
  customerDiscounts,
  onCustomerDiscountsChange,
  rushFees,
  onRushFeesChange,
  filmTypes,
  onFilmTypesChange,
}: {
  customerDiscounts: DTFCustomerTierDiscount[];
  onCustomerDiscountsChange: (d: DTFCustomerTierDiscount[]) => void;
  rushFees: DTFRushFee[];
  onRushFeesChange: (f: DTFRushFee[]) => void;
  filmTypes: DTFFilmTypeConfig[];
  onFilmTypesChange: (f: DTFFilmTypeConfig[]) => void;
}) {
  const rushLabels: Record<string, string> = {
    standard: "Standard",
    "2-day": "2-Day",
    "next-day": "Next Day",
    "same-day": "Same Day",
  };

  const filmLabels: Record<string, string> = {
    standard: "Standard",
    glossy: "Glossy",
    metallic: "Metallic",
    glow: "Glow-in-dark",
  };

  return (
    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-1">
      {/* Customer Tier Discounts */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Customer Tier Discounts</p>
          <p className="text-xs text-muted-foreground">
            Percentage discount off retail price by customer tier
          </p>
        </div>
        <div className="grid gap-2">
          {customerDiscounts.map((d, idx) => (
            <div key={d.tier} className="flex items-center gap-3">
              <span className="text-xs w-24 text-muted-foreground">
                {PRICING_TIER_LABELS[d.tier]}
              </span>
              <div className="relative w-24">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={d.discountPercent}
                  onChange={(e) => {
                    const newD = [...customerDiscounts];
                    newD[idx] = {
                      ...newD[idx],
                      discountPercent: parseFloat(e.target.value) || 0,
                    };
                    onCustomerDiscountsChange(newD);
                  }}
                  className="h-7 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rush Fees */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Rush Fees</p>
          <p className="text-xs text-muted-foreground">
            Percentage upcharge and optional flat fee by turnaround
          </p>
        </div>
        <div className="grid gap-2">
          {rushFees.map((rf, idx) => (
            <div key={rf.turnaround} className="flex items-center gap-3">
              <span className="text-xs w-24 text-muted-foreground">
                {rushLabels[rf.turnaround]}
              </span>
              <div className="relative w-24">
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={rf.percentageUpcharge}
                  onChange={(e) => {
                    const newRf = [...rushFees];
                    newRf[idx] = {
                      ...newRf[idx],
                      percentageUpcharge: parseFloat(e.target.value) || 0,
                    };
                    onRushFeesChange(newRf);
                  }}
                  className="h-7 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={rf.flatFee ?? 0}
                  onChange={(e) => {
                    const newRf = [...rushFees];
                    const val = parseFloat(e.target.value) || 0;
                    newRf[idx] = {
                      ...newRf[idx],
                      flatFee: val > 0 ? val : undefined,
                    };
                    onRushFeesChange(newRf);
                  }}
                  className="h-7 text-xs pl-5"
                  placeholder="Flat fee"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Film Type Multipliers */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Film Type Multipliers</p>
          <p className="text-xs text-muted-foreground">
            Price multiplier by film type (1.0 = no change)
          </p>
        </div>
        <div className="grid gap-2">
          {filmTypes.map((ft, idx) => (
            <div key={ft.type} className="flex items-center gap-3">
              <span className="text-xs w-24 text-muted-foreground">
                {filmLabels[ft.type]}
              </span>
              <div className="relative w-24">
                <Input
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={ft.multiplier}
                  onChange={(e) => {
                    const newFt = [...filmTypes];
                    newFt[idx] = {
                      ...newFt[idx],
                      multiplier: parseFloat(e.target.value) || 1,
                    };
                    onFilmTypesChange(newFt);
                  }}
                  className="h-7 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: SP Preview
// ---------------------------------------------------------------------------

const DEFAULT_GARMENT_COST = 3.5;

function SPPreviewStep({
  template,
}: {
  template: PricingTemplate;
}) {
  const [sampleQty, setSampleQty] = useState(48);
  const [sampleColors, setSampleColors] = useState(3);

  const matrixData = useMemo(
    () => buildFullMatrixData(template, DEFAULT_GARMENT_COST),
    [template]
  );

  const sampleCalc = useMemo(() => {
    return calculateScreenPrintPrice(
      sampleQty,
      sampleColors,
      ["front"],
      "t-shirts",
      template
    );
  }, [sampleQty, sampleColors, template]);

  return (
    <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
      {/* Matrix Preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Price Matrix Preview</p>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-card text-muted-foreground">
                <th className="px-2 py-1.5 text-left font-medium">Qty</th>
                {Array.from({ length: 8 }, (_, i) => (
                  <th key={i} className="px-2 py-1.5 text-right font-medium">
                    {i + 1}c
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => (
                <tr key={row.tierLabel} className="border-t border-border">
                  <td className="px-2 py-1.5 font-medium text-muted-foreground">
                    {row.tierLabel}
                  </td>
                  {row.cells.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>{formatCurrency(cell.price)}</span>
                        <MarginIndicator
                          percentage={cell.margin.percentage}
                          indicator={cell.margin.indicator}
                          size="sm"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Separator />

      {/* Sample Calculator */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Sample Calculator</p>
        <div className="flex items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Quantity</Label>
            <Input
              type="number"
              min={1}
              value={sampleQty}
              onChange={(e) => setSampleQty(parseInt(e.target.value) || 1)}
              className="h-8 w-24 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Colors</Label>
            <Input
              type="number"
              min={1}
              max={8}
              value={sampleColors}
              onChange={(e) => setSampleColors(parseInt(e.target.value) || 1)}
              className="h-8 w-24 text-xs"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-card px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Per Piece</p>
              <p className="text-sm font-semibold">
                {formatCurrency(sampleCalc.pricePerPiece)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">
                {formatCurrency(toNumber(money(sampleCalc.pricePerPiece).times(sampleQty)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margin</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold">
                  {formatPercent(sampleCalc.margin.percentage)}
                </p>
                <MarginIndicator
                  percentage={sampleCalc.margin.percentage}
                  indicator={sampleCalc.margin.indicator}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: DTF Preview
// ---------------------------------------------------------------------------

function DTFPreviewStep({
  template,
}: {
  template: DTFPricingTemplate;
}) {
  const [sampleLength, setSampleLength] = useState(
    template.sheetTiers[0]?.length ?? 24
  );

  const tierMargins = useMemo(
    () =>
      template.sheetTiers.map((tier) => ({
        tier,
        margin: calculateDTFTierMargin(tier, template.costConfig),
      })),
    [template]
  );

  const sampleCalc = useMemo(() => {
    return calculateDTFPrice(
      sampleLength,
      "standard",
      "standard",
      "standard",
      template
    );
  }, [sampleLength, template]);

  return (
    <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
      {/* Sheet Tier Preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Sheet Tier Preview</p>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-card text-muted-foreground">
                <th className="px-3 py-1.5 text-left font-medium">Size</th>
                <th className="px-3 py-1.5 text-right font-medium">Price</th>
                <th className="px-3 py-1.5 text-right font-medium">Cost</th>
                <th className="px-3 py-1.5 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {tierMargins.map(({ tier, margin }) => (
                <tr
                  key={tier.length}
                  className="border-t border-border"
                >
                  <td className="px-3 py-1.5 font-medium text-muted-foreground">
                    22&quot; x {tier.length}&quot;
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {formatCurrency(tier.retailPrice)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-muted-foreground">
                    {formatCurrency(margin.totalCost)}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>{formatPercent(margin.percentage)}</span>
                      <MarginIndicator
                        percentage={margin.percentage}
                        indicator={margin.indicator}
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Separator />

      {/* Sample Calculator */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Sample Calculator</p>
        <div className="flex items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Sheet Length (in)</Label>
            <Select
              value={String(sampleLength)}
              onValueChange={(v) => setSampleLength(parseInt(v))}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {template.sheetTiers.map((t) => (
                  <SelectItem key={t.length} value={String(t.length)}>
                    22&quot; x {t.length}&quot;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-card px-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-sm font-semibold">
                {formatCurrency(sampleCalc.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margin</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold">
                  {formatPercent(sampleCalc.margin.percentage)}
                </p>
                <MarginIndicator
                  percentage={sampleCalc.margin.percentage}
                  indicator={sampleCalc.margin.indicator}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard Component
// ---------------------------------------------------------------------------

export function SetupWizard({ open, onOpenChange, onSave }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [pricingTier, setPricingTier] = useState<PricingTier>("standard");
  const [useIndustryTemplate, setUseIndustryTemplate] = useState(false);

  // SP state
  const [spMatrix, setSpMatrix] = useState<ScreenPrintMatrix>(defaultSPMatrix());
  const [spCostConfig, setSpCostConfig] = useState<CostConfig>(defaultCostConfig());

  // DTF state
  const [dtfSheetTiers, setDtfSheetTiers] = useState<DTFSheetTier[]>(defaultDTFSheetTiers());
  const [dtfRushFees, setDtfRushFees] = useState<DTFRushFee[]>(defaultDTFRushFees());
  const [dtfFilmTypes, setDtfFilmTypes] = useState<DTFFilmTypeConfig[]>(defaultDTFFilmTypes());
  const [dtfCustomerDiscounts, setDtfCustomerDiscounts] = useState<DTFCustomerTierDiscount[]>(
    defaultDTFCustomerDiscounts()
  );
  const [dtfCostConfig, setDtfCostConfig] = useState<DTFCostConfig>(defaultDTFCostConfig());

  // Reset all state when dialog closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep(1);
        setServiceType(null);
        setTemplateName("");
        setPricingTier("standard");
        setUseIndustryTemplate(false);
        setSpMatrix(defaultSPMatrix());
        setSpCostConfig(defaultCostConfig());
        setDtfSheetTiers(defaultDTFSheetTiers());
        setDtfRushFees(defaultDTFRushFees());
        setDtfFilmTypes(defaultDTFFilmTypes());
        setDtfCustomerDiscounts(defaultDTFCustomerDiscounts());
        setDtfCostConfig(defaultDTFCostConfig());
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  // Apply industry template when toggled
  const handleUseIndustryChange = useCallback(
    (checked: boolean) => {
      setUseIndustryTemplate(checked);
      if (checked) {
        if (serviceType === "screen-print") {
          setSpMatrix({ ...spStandardTemplate.matrix });
          setSpCostConfig({ ...spStandardTemplate.costConfig });
        } else if (serviceType === "dtf") {
          setDtfSheetTiers([...dtfRetailTemplate.sheetTiers]);
          setDtfRushFees([...dtfRetailTemplate.rushFees]);
          setDtfFilmTypes([...dtfRetailTemplate.filmTypes]);
          setDtfCustomerDiscounts([...dtfRetailTemplate.customerTierDiscounts]);
          setDtfCostConfig({ ...dtfRetailTemplate.costConfig });
        }
      }
    },
    [serviceType]
  );

  // Build preview template objects
  const previewSPTemplate = useMemo(
    (): PricingTemplate => ({
      id: "preview",
      name: templateName || "New Template",
      serviceType: "screen-print",
      pricingTier,
      matrix: spMatrix,
      costConfig: spCostConfig,
      isDefault: false,
      isIndustryDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [templateName, pricingTier, spMatrix, spCostConfig]
  );

  const previewDTFTemplate = useMemo(
    (): DTFPricingTemplate => ({
      id: "preview",
      name: templateName || "New Template",
      serviceType: "dtf",
      sheetTiers: dtfSheetTiers,
      rushFees: dtfRushFees,
      filmTypes: dtfFilmTypes,
      customerTierDiscounts: dtfCustomerDiscounts,
      costConfig: dtfCostConfig,
      isDefault: false,
      isIndustryDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [templateName, dtfSheetTiers, dtfRushFees, dtfFilmTypes, dtfCustomerDiscounts, dtfCostConfig]
  );

  // Navigation
  const canGoNext = useMemo(() => {
    switch (step) {
      case 1:
        return serviceType !== null;
      case 2:
        return templateName.trim().length > 0;
      case 3:
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, serviceType, templateName]);

  const handleNext = () => {
    if (step < 5 && canGoNext) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    if (serviceType === "screen-print") {
      const template: PricingTemplate = {
        id,
        name: templateName,
        serviceType: "screen-print",
        pricingTier,
        matrix: spMatrix,
        costConfig: spCostConfig,
        isDefault: false,
        isIndustryDefault: false,
        createdAt: now,
        updatedAt: now,
      };
      onSave(template);
    } else if (serviceType === "dtf") {
      const template: DTFPricingTemplate = {
        id,
        name: templateName,
        serviceType: "dtf",
        sheetTiers: dtfSheetTiers,
        rushFees: dtfRushFees,
        filmTypes: dtfFilmTypes,
        customerTierDiscounts: dtfCustomerDiscounts,
        costConfig: dtfCostConfig,
        isDefault: false,
        isIndustryDefault: false,
        createdAt: now,
        updatedAt: now,
      };
      onSave(template);
    }
    handleOpenChange(false);
  };

  // Step title/description
  const stepInfo: Record<number, { title: string; description: string }> = {
    1: {
      title: "Choose Service Type",
      description: "Select the pricing service this template will cover.",
    },
    2: {
      title: "Template Basics",
      description: "Name your template and configure initial settings.",
    },
    3: {
      title:
        serviceType === "screen-print"
          ? "Quantity Tiers & Pricing"
          : "Sheet Size Pricing",
      description:
        serviceType === "screen-print"
          ? "Set quantity breakpoints and base prices per tier."
          : "Configure sheet size tiers and retail pricing.",
    },
    4: {
      title: "Additional Settings",
      description:
        serviceType === "screen-print"
          ? "Color rates, location upcharges, garment markups, and setup fees."
          : "Customer discounts, rush fees, and film type multipliers.",
    },
    5: {
      title: "Preview & Save",
      description: "Review your pricing matrix and save the template.",
    },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{stepInfo[step].title}</DialogTitle>
              <DialogDescription>{stepInfo[step].description}</DialogDescription>
            </div>
          </div>
          <StepIndicator current={step} />
        </DialogHeader>

        <div className="flex-1 py-2">
          {/* Step 1 */}
          {step === 1 && (
            <ServiceTypeStep value={serviceType} onChange={setServiceType} />
          )}

          {/* Step 2 */}
          {step === 2 && serviceType && (
            <BasicsStep
              name={templateName}
              onNameChange={setTemplateName}
              pricingTier={pricingTier}
              onPricingTierChange={setPricingTier}
              useIndustryTemplate={useIndustryTemplate}
              onUseIndustryTemplateChange={handleUseIndustryChange}
              serviceType={serviceType}
            />
          )}

          {/* Step 3 */}
          {step === 3 && serviceType === "screen-print" && (
            <SPPricingStep
              quantityTiers={spMatrix.quantityTiers}
              basePriceByTier={spMatrix.basePriceByTier}
              onTiersChange={(tiers) =>
                setSpMatrix((m) => ({ ...m, quantityTiers: tiers }))
              }
              onBasePricesChange={(prices) =>
                setSpMatrix((m) => ({ ...m, basePriceByTier: prices }))
              }
            />
          )}
          {step === 3 && serviceType === "dtf" && (
            <DTFPricingStep
              sheetTiers={dtfSheetTiers}
              onSheetTiersChange={setDtfSheetTiers}
            />
          )}

          {/* Step 4 */}
          {step === 4 && serviceType === "screen-print" && (
            <SPSettingsStep
              matrix={spMatrix}
              onMatrixChange={setSpMatrix}
            />
          )}
          {step === 4 && serviceType === "dtf" && (
            <DTFSettingsStep
              customerDiscounts={dtfCustomerDiscounts}
              onCustomerDiscountsChange={setDtfCustomerDiscounts}
              rushFees={dtfRushFees}
              onRushFeesChange={setDtfRushFees}
              filmTypes={dtfFilmTypes}
              onFilmTypesChange={setDtfFilmTypes}
            />
          )}

          {/* Step 5 */}
          {step === 5 && serviceType === "screen-print" && (
            <SPPreviewStep template={previewSPTemplate} />
          )}
          {step === 5 && serviceType === "dtf" && (
            <DTFPreviewStep template={previewDTFTemplate} />
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ChevronLeft className="size-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            {step < 5 ? (
              <Button size="sm" disabled={!canGoNext} onClick={handleNext}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave}>
                <Check className="size-4" />
                Save Template
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
