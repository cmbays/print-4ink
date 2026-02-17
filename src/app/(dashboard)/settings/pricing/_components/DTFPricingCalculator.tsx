"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MarginIndicator } from "@/components/features/MarginIndicator";
import { calculateDTFPrice, formatCurrency, formatPercent } from "@/lib/pricing-engine";
import type { DTFPricingTemplate, DTFRushTurnaround, DTFFilmType } from "@domain/entities/dtf-pricing";
import type { PricingTier } from "@domain/entities/customer";

interface DTFPricingCalculatorProps {
  template: DTFPricingTemplate;
}

const TIER_LABELS: Record<PricingTier, string> = {
  standard: "Standard",
  preferred: "Preferred",
  contract: "Contract",
  wholesale: "Wholesale",
};

const RUSH_LABELS: Record<DTFRushTurnaround, string> = {
  standard: "Standard",
  "2-day": "2-Day Rush",
  "next-day": "Next Day",
  "same-day": "Same Day",
};

const FILM_LABELS: Record<DTFFilmType, string> = {
  standard: "Standard",
  glossy: "Glossy",
  metallic: "Metallic",
  glow: "Glow-in-Dark",
};

export function DTFPricingCalculator({ template }: DTFPricingCalculatorProps) {
  const [sheetLength, setSheetLength] = useState<number>(
    template.sheetTiers[0]?.length ?? 24
  );
  const [customerTier, setCustomerTier] = useState<PricingTier>("standard");
  const [rushType, setRushType] = useState<DTFRushTurnaround>("standard");
  const [filmType, setFilmType] = useState<DTFFilmType>("standard");

  // Clamp sheetLength to a valid tier when tiers change (e.g. tier removed)
  const effectiveSheetLength = useMemo(() => {
    const validLengths = template.sheetTiers.map((t) => t.length);
    return validLengths.includes(sheetLength) ? sheetLength : (validLengths[0] ?? 24);
  }, [template.sheetTiers, sheetLength]);

  const result = useMemo(
    () => calculateDTFPrice(effectiveSheetLength, customerTier, rushType, filmType, template),
    [effectiveSheetLength, customerTier, rushType, filmType, template]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Pricing Calculator</CardTitle>
            <CardDescription>Preview pricing with different options</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Sheet Length */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sheet Length</Label>
            <Select
              value={String(effectiveSheetLength)}
              onValueChange={(v) => setSheetLength(Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {template.sheetTiers.map((tier) => (
                  <SelectItem key={tier.length} value={String(tier.length)}>
                    22&quot; × {tier.length}&quot;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Tier */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Customer Tier</Label>
            <Select
              value={customerTier}
              onValueChange={(v) => setCustomerTier(v as PricingTier)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TIER_LABELS) as PricingTier[]).map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {TIER_LABELS[tier]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rush Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rush Type</Label>
            <Select
              value={rushType}
              onValueChange={(v) => setRushType(v as DTFRushTurnaround)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RUSH_LABELS) as DTFRushTurnaround[]).map((rush) => (
                  <SelectItem key={rush} value={rush}>
                    {RUSH_LABELS[rush]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Film Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Film Type</Label>
            <Select
              value={filmType}
              onValueChange={(v) => setFilmType(v as DTFFilmType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FILM_LABELS) as DTFFilmType[]).map((film) => (
                  <SelectItem key={film} value={film}>
                    {FILM_LABELS[film]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Result */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Calculated Price</span>
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrency(result.price)}
            </span>
          </div>

          <div className="bg-surface rounded-md p-3 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Revenue</span>
              <span>{formatCurrency(result.margin.revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ink Cost</span>
              <span>-{formatCurrency(result.margin.inkCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overhead</span>
              <span>-{formatCurrency(result.margin.overheadCost)}</span>
            </div>
            {result.margin.laborCost !== undefined && result.margin.laborCost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Labor</span>
                <span>-{formatCurrency(result.margin.laborCost)}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between font-semibold">
              <span className="text-muted-foreground">Profit</span>
              <span>{formatCurrency(result.margin.profit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Margin</span>
              <span className="flex items-center gap-2">
                <MarginIndicator
                  percentage={result.margin.percentage}
                  indicator={result.margin.indicator}
                />
                {formatPercent(result.margin.percentage)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
