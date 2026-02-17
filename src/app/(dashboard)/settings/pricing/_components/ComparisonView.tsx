"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shared/ui/primitives/dialog";
import { Button } from "@shared/ui/primitives/button";
import { Badge } from "@shared/ui/primitives/badge";
import { ScrollArea } from "@shared/ui/primitives/scroll-area";
import { Separator } from "@shared/ui/primitives/separator";
import {
  buildFullMatrixData,
  calculateDiff,
  formatCurrency,
  formatPercent,
} from "@domain/services/pricing.service";
import { cn } from "@/lib/utils";
import type { PricingTemplate } from "@domain/entities/price-matrix";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Pencil,
  Trash2,
  GitCompareArrows,
} from "lucide-react";

const DEFAULT_GARMENT_COST = 3.5;
const COLOR_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

interface ComparisonViewProps {
  original: PricingTemplate;
  proposed: PricingTemplate;
  onApply: () => void;
  onKeepEditing: () => void;
  onDiscardAll: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComparisonView({
  original,
  proposed,
  onApply,
  onKeepEditing,
  onDiscardAll,
  open,
  onOpenChange,
}: ComparisonViewProps) {
  const originalData = useMemo(
    () => buildFullMatrixData(original, DEFAULT_GARMENT_COST),
    [original]
  );

  const proposedData = useMemo(
    () => buildFullMatrixData(proposed, DEFAULT_GARMENT_COST),
    [proposed]
  );

  const diff = useMemo(
    () => calculateDiff(original, proposed),
    [original, proposed]
  );

  const hasChanges = diff.changedCells > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <GitCompareArrows className="size-5 text-action" />
            <DialogTitle>Compare Pricing Changes</DialogTitle>
          </div>
          <DialogDescription>
            Review your pricing changes side by side before applying.
          </DialogDescription>
        </DialogHeader>

        {/* Diff summary */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              hasChanges
                ? "border-action/30 text-action"
                : "border-border text-muted-foreground"
            )}
          >
            {diff.changedCells} of {diff.totalCells} cells changed
          </Badge>

          {hasChanges && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-xs",
                diff.avgMarginChange >= 0
                  ? "border-success/30 text-success"
                  : "border-error/30 text-error"
              )}
            >
              {diff.avgMarginChange >= 0 ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              Avg margin change: {diff.avgMarginChange >= 0 ? "+" : ""}
              {formatPercent(diff.avgMarginChange)}
            </Badge>
          )}

          {!hasChanges && (
            <span className="text-xs text-muted-foreground">
              No pricing changes detected
            </span>
          )}
        </div>

        <Separator />

        {/* Side-by-side grids */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Original pricing */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Current Pricing
              </h3>
              <ComparisonGrid
                data={originalData}
                compareData={proposedData}
                side="original"
              />
            </div>

            {/* Proposed pricing */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-action">
                Proposed Pricing
              </h3>
              <ComparisonGrid
                data={proposedData}
                compareData={originalData}
                side="proposed"
              />
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-error hover:text-error"
            onClick={onDiscardAll}
          >
            <Trash2 className="size-3.5" />
            Discard All
          </Button>
          <Button variant="outline" size="sm" onClick={onKeepEditing}>
            <Pencil className="size-3.5" />
            Keep Editing
          </Button>
          <Button size="sm" onClick={onApply} disabled={!hasChanges}>
            <Check className="size-3.5" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Internal: Comparison grid table
// ---------------------------------------------------------------------------

function ComparisonGrid({
  data,
  compareData,
  side,
}: {
  data: ReturnType<typeof buildFullMatrixData>;
  compareData: ReturnType<typeof buildFullMatrixData>;
  side: "original" | "proposed";
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border-b border-border bg-surface px-2 py-1.5 text-left font-medium text-muted-foreground">
              Tier
            </th>
            {COLOR_COLUMNS.map((col) => (
              <th
                key={col}
                className="border-b border-l border-border bg-surface px-2 py-1.5 text-center font-medium text-muted-foreground"
              >
                {col}C
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => {
            const compareRow = compareData[rowIdx];
            return (
              <tr key={row.tierLabel}>
                <td className="border-b border-border bg-surface px-2 py-1.5 font-medium text-foreground whitespace-nowrap">
                  {row.tierLabel}
                </td>
                {row.cells.map((cell, colIdx) => {
                  const compareCell = compareRow?.cells[colIdx];
                  const isChanged =
                    compareCell !== undefined &&
                    cell.price !== compareCell.price;

                  // For proposed: green if price went down, red if went up
                  // For original: just mark that this cell was changed (dim)
                  let cellBg = "";
                  if (isChanged && side === "proposed") {
                    cellBg =
                      cell.price < compareCell.price
                        ? "bg-success/10"
                        : "bg-error/10";
                  } else if (isChanged && side === "original") {
                    cellBg = "bg-muted/30";
                  }

                  return (
                    <td
                      key={colIdx}
                      className={cn(
                        "border-b border-l border-border px-2 py-1.5 text-center tabular-nums",
                        cellBg
                      )}
                    >
                      <span
                        className={cn(
                          isChanged && side === "proposed"
                            ? "font-medium text-foreground"
                            : "text-foreground"
                        )}
                      >
                        {formatCurrency(cell.price)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
