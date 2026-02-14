"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { MarginLegend } from "@/components/features/MarginLegend";
import {
  buildFullMatrixData,
  formatCurrency,
  findQuantityTierIndex,
} from "@/lib/pricing-engine";
import {
  allScreenPrintTemplates,
  tagTemplateMappings,
} from "@/lib/mock-data-pricing";
import type { Customer } from "@/lib/schemas/customer";
import type { QuoteLineItem } from "@/lib/schemas/quote";
import type { PricingTemplate, MarginIndicator } from "@/lib/schemas/price-matrix";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_GARMENT_COST = 3.5;

const MARGIN_COLORS: Record<MarginIndicator, string> = {
  healthy: "bg-success",
  caution: "bg-warning",
  unprofitable: "bg-error",
};

/** Resolve which SP template applies to a customer based on their typeTags. */
function resolveTemplate(customer: Customer): PricingTemplate | null {
  // Check each customer tag against mappings
  for (const tag of customer.typeTags) {
    const mapping = tagTemplateMappings.find(
      (m) => m.customerTypeTag === tag
    );
    if (mapping?.screenPrintTemplateId) {
      const template = allScreenPrintTemplates.find(
        (t) => t.id === mapping.screenPrintTemplateId
      );
      if (template) return template;
    }
  }
  // Fallback: default template
  return allScreenPrintTemplates.find((t) => t.isDefault) ?? null;
}

/** Get total qty from sizes record. */
function getTotalQty(sizes: Record<string, number>): number {
  return Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
}

/** Get total color count from print location details. */
function getMaxColorCount(
  lineItem: QuoteLineItem
): number {
  if (lineItem.printLocationDetails.length === 0) return 1;
  return Math.max(...lineItem.printLocationDetails.map((d) => d.colorCount));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MatrixPeekSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  lineItem: QuoteLineItem;
  onOverride: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MatrixPeekSheet({
  open,
  onOpenChange,
  customer,
  lineItem,
  onOverride,
}: MatrixPeekSheetProps) {
  const template = useMemo(() => resolveTemplate(customer), [customer]);
  const matrixData = useMemo(
    () => (template ? buildFullMatrixData(template, DEFAULT_GARMENT_COST) : null),
    [template]
  );

  // Find the highlighted cell
  const totalQty = getTotalQty(lineItem.sizes);
  const colorCount = getMaxColorCount(lineItem);
  const highlightTierIdx = template
    ? findQuantityTierIndex(template.matrix.quantityTiers, totalQty)
    : -1;
  const maxColors = template?.matrix?.maxColors ?? 8;
  const highlightColorIdx = Math.min(colorCount, maxColors) - 1; // 0-indexed

  if (!template || !matrixData) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Pricing Matrix</SheetTitle>
            <SheetDescription>
              No pricing template found for this customer.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const handleOverride = () => {
    onOverride();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Pricing Matrix
            <Badge variant="ghost" className="bg-action/15 text-action text-xs">
              {template.name}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Read-only view of the pricing template applied to this customer.
          </SheetDescription>
        </SheetHeader>

        {/* Customer context */}
        <div className="mt-4 rounded-lg border border-border bg-surface p-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium text-foreground">
              {customer.name} — {customer.company}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pricing Tier</span>
            <Badge variant="ghost" className="text-xs capitalize">
              {customer.pricingTier}
            </Badge>
          </div>
          {customer.discountPercentage != null &&
            customer.discountPercentage > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-success">
                  {customer.discountPercentage}%
                </span>
              </div>
            )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tags</span>
            <div className="flex gap-1">
              {customer.typeTags.length > 0 ? (
                customer.typeTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="ghost"
                    className="text-xs bg-muted/50"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          </div>
        </div>

        {/* Current line item context */}
        <div className="mt-3 rounded-lg border border-action/30 bg-action/5 p-3">
          <p className="text-xs text-muted-foreground mb-1">
            Current line item
          </p>
          <p className="text-sm font-medium text-foreground">
            {totalQty} pcs × {colorCount} color{colorCount !== 1 ? "s" : ""}
            {" → "}
            <span className="text-action">
              {highlightTierIdx >= 0
                ? template.matrix.quantityTiers[highlightTierIdx].label
                : "N/A"}{" "}
              tier
            </span>
          </p>
        </div>

        <Separator className="my-4" />

        {/* Matrix grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card px-2 py-1.5 text-left text-muted-foreground font-medium">
                  Qty Tier
                </th>
                {Array.from({ length: maxColors }, (_, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-2 py-1.5 text-center font-medium",
                      i === highlightColorIdx
                        ? "text-action"
                        : "text-muted-foreground"
                    )}
                  >
                    {i + 1}C
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, tierIdx) => (
                <tr key={tierIdx}>
                  <td
                    className={cn(
                      "sticky left-0 bg-card px-2 py-1.5 font-medium whitespace-nowrap",
                      tierIdx === highlightTierIdx
                        ? "text-action"
                        : "text-foreground"
                    )}
                  >
                    {row.tierLabel}
                  </td>
                  {row.cells.map((cell, colIdx) => {
                    const isHighlighted =
                      tierIdx === highlightTierIdx &&
                      colIdx === highlightColorIdx;

                    return (
                      <td
                        key={colIdx}
                        className={cn(
                          "px-2 py-1.5 text-center tabular-nums",
                          isHighlighted &&
                            "ring-2 ring-action rounded bg-action/10 font-semibold text-action"
                        )}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>
                            {formatCurrency(cell.price)}
                          </span>
                          <span
                            className={cn(
                              "inline-block size-1.5 rounded-full shrink-0",
                              MARGIN_COLORS[cell.margin.indicator]
                            )}
                            title={`${Math.round(cell.margin.percentage)}% margin`}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Margin legend */}
        <MarginLegend className="mt-3" />

        <Separator className="my-4" />

        <SheetFooter className="flex gap-2">
          <Link href={`/settings/pricing/screen-print/${template.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="size-4" />
              Edit Template in Settings
            </Button>
          </Link>
          <Button size="sm" onClick={handleOverride}>
            <Pencil className="size-4" />
            Override This Quote Only
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
