"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CostBreakdownTooltip } from "@/components/features/CostBreakdownTooltip";
import { cn } from "@/lib/utils";
import { buildFullMatrixData, formatCurrency } from "@/lib/pricing-engine";
import type { PricingTemplate, MarginIndicator } from "@/lib/schemas/price-matrix";
import { Grid3x3 } from "lucide-react";

const DEFAULT_GARMENT_COST = 3.5;

const COLOR_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const dotColors: Record<MarginIndicator, string> = {
  healthy: "bg-success",
  caution: "bg-warning",
  unprofitable: "bg-error",
};

interface ColorPricingGridProps {
  template: PricingTemplate;
  colorHitRate: number;
  onColorHitRateChange: (rate: number) => void;
}

export function ColorPricingGrid({
  template,
  colorHitRate,
  onColorHitRateChange,
}: ColorPricingGridProps) {
  const matrixData = useMemo(
    () => buildFullMatrixData(template, DEFAULT_GARMENT_COST),
    [template]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Pricing Matrix</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="color-hit-rate" className="text-xs text-muted-foreground whitespace-nowrap">
              Color hit rate
            </Label>
            <div className="relative w-24">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                id="color-hit-rate"
                type="number"
                step={0.05}
                min={0}
                value={colorHitRate}
                onChange={(e) => onColorHitRateChange(parseFloat(e.target.value) || 0)}
                className="h-8 pl-5 text-xs"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Per-piece price by quantity tier and color count. Hover cells for margin breakdown.
        </p>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-success" />
            Healthy (&ge;30%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-warning" />
            Caution (15&ndash;30%)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-error" />
            Unprofitable (&lt;15%)
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-border bg-surface px-3 py-2 text-left font-medium text-muted-foreground">
                  Qty Tier
                </th>
                {COLOR_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="border border-border bg-surface px-3 py-2 text-center font-medium text-muted-foreground"
                  >
                    {col} {col === 1 ? "Color" : "Colors"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => (
                <tr key={row.tierLabel}>
                  <td className="border border-border bg-surface px-3 py-2 font-medium text-foreground whitespace-nowrap">
                    {row.tierLabel}
                  </td>
                  {row.cells.map((cell, colIdx) => (
                    <CostBreakdownTooltip
                      key={colIdx}
                      breakdown={cell.margin}
                    >
                      <td
                        className={cn(
                          "border border-border px-3 py-2 text-center tabular-nums cursor-default transition-colors",
                          "hover:bg-surface"
                        )}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={cn(
                              "inline-block size-2 shrink-0 rounded-full",
                              dotColors[cell.margin.indicator]
                            )}
                            role="img"
                            aria-label={`Margin: ${Math.round(cell.margin.percentage * 10) / 10}%`}
                          />
                          <span className="text-foreground">
                            {formatCurrency(cell.price)}
                          </span>
                        </div>
                      </td>
                    </CostBreakdownTooltip>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
