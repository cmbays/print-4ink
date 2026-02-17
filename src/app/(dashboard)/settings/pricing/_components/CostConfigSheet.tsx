"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@shared/ui/primitives/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/primitives/select";
import { Button } from "@shared/ui/primitives/button";
import { Input } from "@shared/ui/primitives/input";
import { Label } from "@shared/ui/primitives/label";
import { Save, X } from "lucide-react";
import { cn } from "@shared/lib/cn";
import {
  calculateCellMargin,
  formatCurrency,
  formatPercent,
  getMarginIndicator,
} from "@domain/services/pricing.service";
import { money, round2, toNumber } from "@domain/lib/money";
import type { CostConfig, PricingTemplate, MarginIndicator } from "@domain/entities/price-matrix";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costConfig: CostConfig;
  template: PricingTemplate;
  onSave: (config: CostConfig) => void;
}

// ---------------------------------------------------------------------------
// Margin indicator styling
// ---------------------------------------------------------------------------

const indicatorColors: Record<MarginIndicator, string> = {
  healthy: "text-success",
  caution: "text-warning",
  unprofitable: "text-error",
};

const indicatorBadgeColors: Record<MarginIndicator, string> = {
  healthy: "bg-success/15 text-success border border-success/30",
  caution: "bg-warning/15 text-warning border border-warning/30",
  unprofitable: "bg-error/15 text-error border border-error/30",
};

const indicatorLabels: Record<MarginIndicator, string> = {
  healthy: "Healthy",
  caution: "Caution",
  unprofitable: "Unprofitable",
};

// ---------------------------------------------------------------------------
// Sample order for cost preview (48 pcs, 3 colors, front only, t-shirt)
// ---------------------------------------------------------------------------

const SAMPLE_ORDER = {
  quantity: 48,
  colors: 3,
  locations: 1,
  garmentLabel: "T-shirt",
  garmentBaseCost: 3.5,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CostConfigSheet({
  open,
  onOpenChange,
  costConfig,
  template,
  onSave,
}: CostConfigSheetProps) {
  // Local draft state — only saved when user clicks "Save Costs"
  const [draft, setDraft] = useState<CostConfig>(costConfig);

  // Reset draft when sheet opens with fresh costConfig
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(costConfig);
    }
    onOpenChange(nextOpen);
  };

  const updateField = <K extends keyof CostConfig>(key: K, value: CostConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // Build a "draft template" with the draft costConfig so we can preview margins
  const draftTemplate = useMemo(
    (): PricingTemplate => ({ ...template, costConfig: draft }),
    [template, draft]
  );

  // Cost preview: calculate costs for the sample order
  const preview = useMemo(() => {
    const garmentCost =
      draft.garmentCostSource === "catalog"
        ? SAMPLE_ORDER.garmentBaseCost
        : (draft.manualGarmentCost ?? 0);
    const inkCost = toNumber(round2(
      money(draft.inkCostPerHit).times(SAMPLE_ORDER.colors).times(SAMPLE_ORDER.locations)
    ));
    // Use tier index 1 (24-47 range) for 48 pcs as sample — find the right tier
    const tierIndex = draftTemplate.matrix.quantityTiers.findIndex(
      (t) =>
        SAMPLE_ORDER.quantity >= t.minQty &&
        (t.maxQty === null || SAMPLE_ORDER.quantity <= t.maxQty)
    );
    const margin = tierIndex >= 0
      ? calculateCellMargin(tierIndex, SAMPLE_ORDER.colors, draftTemplate, garmentCost)
      : null;

    const revenue = margin?.revenue ?? 0;
    const overheadCost = toNumber(round2(money(revenue).times(money(draft.shopOverheadRate).div(100))));
    const laborCost = draft.laborRate
      ? toNumber(round2(money(draft.laborRate).times(30).div(3600)))
      : 0;
    const totalCost = toNumber(round2(
      money(garmentCost).plus(inkCost).plus(overheadCost).plus(laborCost)
    ));

    return {
      garmentCost,
      inkCost,
      overheadCost,
      laborCost,
      totalCost,
      revenue,
      margin,
    };
  }, [draft, draftTemplate]);

  // Overall margin indicator for the template
  const overallIndicator = useMemo((): MarginIndicator => {
    if (!preview.margin) return "caution";
    return getMarginIndicator(preview.margin.percentage);
  }, [preview.margin]);

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cost Configuration</SheetTitle>
          <SheetDescription>
            Set your cost inputs to calculate accurate margins across the pricing matrix.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          {/* Garment Cost Source */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="garment-cost-source" className="text-sm">
                Garment Cost Source
              </Label>
              <Select
                value={draft.garmentCostSource}
                onValueChange={(value: "catalog" | "manual") =>
                  updateField("garmentCostSource", value)
                }
              >
                <SelectTrigger id="garment-cost-source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="catalog">From Catalog</SelectItem>
                  <SelectItem value="manual">Manual Override</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {draft.garmentCostSource === "catalog"
                  ? "Garment cost will be pulled from the product catalog at quote time."
                  : "Enter a flat garment cost to use for all margin calculations."}
              </p>
            </div>

            {/* Manual garment cost — only visible when source is "manual" */}
            {draft.garmentCostSource === "manual" && (
              <div className="space-y-1.5">
                <Label htmlFor="manual-garment-cost" className="text-sm">
                  Manual Garment Cost
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="manual-garment-cost"
                    type="number"
                    value={draft.manualGarmentCost ?? ""}
                    onChange={(e) =>
                      updateField(
                        "manualGarmentCost",
                        e.target.value === "" ? 0 : Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    className="h-8 text-sm"
                    min={0}
                    step={0.25}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ink Cost Per Hit */}
          <div className="space-y-1.5">
            <Label htmlFor="ink-cost" className="text-sm">
              Ink Cost per Hit
            </Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="ink-cost"
                type="number"
                value={draft.inkCostPerHit}
                onChange={(e) =>
                  updateField(
                    "inkCostPerHit",
                    Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                onFocus={(e) => e.target.select()}
                className="h-8 text-sm"
                min={0}
                step={0.05}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Cost of ink per color per print location.
            </p>
          </div>

          {/* Shop Overhead Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="overhead-rate" className="text-sm">
              Shop Overhead Rate
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="overhead-rate"
                type="number"
                value={draft.shopOverheadRate}
                onChange={(e) =>
                  updateField(
                    "shopOverheadRate",
                    Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                onFocus={(e) => e.target.select()}
                className="h-8 text-sm"
                min={0}
                max={100}
                step={1}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of revenue allocated to overhead (rent, utilities, etc).
            </p>
          </div>

          {/* Labor Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="labor-rate" className="text-sm">
              Labor Rate per Hour
              <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="labor-rate"
                type="number"
                value={draft.laborRate ?? ""}
                onChange={(e) =>
                  updateField(
                    "laborRate",
                    e.target.value === "" ? undefined : Math.max(0, parseFloat(e.target.value) || 0)
                  )
                }
                onFocus={(e) => e.target.select()}
                className="h-8 text-sm"
                min={0}
                step={1}
                placeholder="—"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Hourly labor rate, amortized to ~30 sec per piece for screen print.
              Leave blank to exclude from margin calculations.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Cost Preview Table */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Cost Preview</h3>
              <p className="text-xs text-muted-foreground">
                Sample order: {SAMPLE_ORDER.quantity} pcs, {SAMPLE_ORDER.colors} colors, front only, {SAMPLE_ORDER.garmentLabel}
              </p>
            </div>

            <div className="rounded-md border border-border bg-card">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">Garment Cost</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(preview.garmentCost)}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">Ink Cost</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(preview.inkCost)}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2 text-muted-foreground">Overhead</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(preview.overheadCost)}
                    </td>
                  </tr>
                  {preview.laborCost > 0 && (
                    <tr className="border-b border-border">
                      <td className="px-3 py-2 text-muted-foreground">Labor</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatCurrency(preview.laborCost)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-border font-medium">
                    <td className="px-3 py-2">Total Cost / Piece</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(preview.totalCost)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-muted-foreground">Revenue / Piece</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(preview.revenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Margin Preview */}
          {preview.margin && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Margin Preview</h3>
              <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-lg font-semibold font-mono",
                      indicatorColors[overallIndicator]
                    )}
                  >
                    {formatPercent(preview.margin.percentage)}
                  </span>
                  <span className="text-sm text-muted-foreground">margin</span>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    indicatorBadgeColors[overallIndicator]
                  )}
                >
                  {indicatorLabels[overallIndicator]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Profit per piece: {formatCurrency(preview.margin.profit)}
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="size-3.5" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="size-3.5" />
            Save Costs
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
