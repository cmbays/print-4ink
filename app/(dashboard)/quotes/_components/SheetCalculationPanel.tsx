"use client";

import { useCallback, useEffect, useRef } from "react";
import { Calculator, Layers, Combine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shelfPack } from "@/lib/dtf/shelf-pack";
import { optimizeCost } from "@/lib/dtf/cost-optimize";
import { DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN } from "@/lib/dtf/dtf-constants";
import { formatCurrency } from "@/lib/helpers/money";
import type { DtfLineItem } from "@/lib/schemas/dtf-line-item";
import type {
  SheetCalculation,
  CanvasLayout,
} from "@/lib/schemas/dtf-sheet-calculation";
import type { DTFSheetTier } from "@/lib/schemas/dtf-pricing";
import type { OptimizedSheetResult } from "@/lib/dtf/cost-optimize";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SheetCalculationPanelProps {
  lineItems: DtfLineItem[];
  sheetCalculation: SheetCalculation | null;
  setSheetCalculation: React.Dispatch<
    React.SetStateAction<SheetCalculation | null>
  >;
  splitMode: "combine" | "split";
  setSplitMode: React.Dispatch<React.SetStateAction<"combine" | "split">>;
  setCanvasLayout: React.Dispatch<React.SetStateAction<CanvasLayout[] | null>>;
  tiers: DTFSheetTier[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasValidLineItems(lineItems: DtfLineItem[]): boolean {
  return lineItems.some(
    (item) =>
      item.artworkName.trim().length > 0 &&
      item.width > 0 &&
      item.height > 0 &&
      item.quantity >= 1
  );
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 70) return "text-success";
  if (utilization >= 40) return "text-warning";
  return "text-error";
}

function getUtilizationBg(utilization: number): string {
  if (utilization > 70) return "bg-success/10 border-success/20";
  if (utilization >= 40) return "bg-warning/10 border-warning/20";
  return "bg-error/10 border-error/20";
}

function formatSheetDimensions(tier: DTFSheetTier): string {
  return `${tier.width}" x ${tier.length}"`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SheetCalculationPanel({
  lineItems,
  sheetCalculation,
  setSheetCalculation,
  splitMode,
  setSplitMode,
  setCanvasLayout,
  tiers,
}: SheetCalculationPanelProps) {
  const prevSplitModeRef = useRef(splitMode);
  const canCalculate = hasValidLineItems(lineItems);

  // N47 — calculateSheetLayout
  const calculateSheetLayout = useCallback(() => {
    // Map line items to shelfPack input format (only valid items)
    const designs = lineItems
      .filter(
        (item) =>
          item.artworkName.trim().length > 0 &&
          item.width > 0 &&
          item.height > 0 &&
          item.quantity >= 1
      )
      .map((item) => ({
        id: item.id,
        width: item.width,
        height: item.height,
        quantity: item.quantity,
        label: item.artworkName || "Untitled",
      }));

    if (designs.length === 0) return;

    // Run shelf-pack algorithm
    const packedSheets = shelfPack(designs, DTF_SHEET_WIDTH, DTF_DEFAULT_MARGIN);

    // Run cost optimizer
    const result = optimizeCost(packedSheets, tiers, splitMode);

    // Update sheet calculation state (S22)
    setSheetCalculation(result);

    // Build canvas layouts (S24) from packed positions
    const layouts: CanvasLayout[] = result.sheets.map((sheet) => ({
      sheetWidth: DTF_SHEET_WIDTH,
      sheetHeight: sheet.tier.length,
      designs: sheet.designs,
      margins: DTF_DEFAULT_MARGIN,
    }));
    setCanvasLayout(layouts);
  }, [lineItems, splitMode, tiers, setSheetCalculation, setCanvasLayout]);

  // N50 — recalculateOnChange: when splitMode toggles AND calculation exists, re-run
  useEffect(() => {
    if (prevSplitModeRef.current !== splitMode && sheetCalculation !== null) {
      calculateSheetLayout();
    }
    prevSplitModeRef.current = splitMode;
  }, [splitMode, sheetCalculation, calculateSheetLayout]);

  return (
    <div className="space-y-3">
      {/* Header + controls */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">
          Sheet Calculation
        </h3>

        {/* U83 — Split/Combine toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setSplitMode("combine")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              splitMode === "combine"
                ? "bg-elevated text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Combine size={14} />
            Combine
          </button>
          <button
            type="button"
            onClick={() => setSplitMode("split")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              splitMode === "split"
                ? "bg-elevated text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers size={14} />
            Split
          </button>
        </div>
      </div>

      {/* U82 — Calculate Layout button */}
      <Button
        type="button"
        onClick={calculateSheetLayout}
        disabled={!canCalculate}
        className="w-full"
      >
        <Calculator size={16} className="mr-2" />
        {sheetCalculation ? "Recalculate Layout" : "Calculate Layout"}
      </Button>

      {/* Results section */}
      {sheetCalculation && (
        <div className="space-y-3">
          {/* U85 + U86 — Summary row */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Sheets</span>
                <p className="text-sm font-medium text-foreground">
                  {sheetCalculation.totalSheets}
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-xs text-muted-foreground">
                  Total Cost
                </span>
                <p className="text-sm font-medium text-action">
                  {formatCurrency(sheetCalculation.totalCost)}
                </p>
              </div>
            </div>
          </div>

          {/* U84 — Sheet result cards */}
          <div className="space-y-2">
            {sheetCalculation.sheets.map(
              (sheet: OptimizedSheetResult, index: number) => (
                <SheetResultCard
                  key={`sheet-${index}`}
                  sheet={sheet}
                  index={index}
                />
              )
            )}
          </div>
        </div>
      )}

      {/* Empty state when no calculation yet */}
      {!sheetCalculation && (
        <div className="rounded-lg border border-dashed border-border bg-surface/50 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Add designs and click Calculate to see sheet layout
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sheet Result Card (U84 + U87)
// ---------------------------------------------------------------------------

function SheetResultCard({
  sheet,
  index,
}: {
  sheet: OptimizedSheetResult;
  index: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Sheet {index + 1}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatSheetDimensions(sheet.tier)}
          </span>
          <span className="text-xs text-muted-foreground">
            {sheet.designs.length} design{sheet.designs.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* U87 — Utilization badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-xs border",
              getUtilizationBg(sheet.utilization),
              getUtilizationColor(sheet.utilization)
            )}
          >
            {sheet.utilization.toFixed(0)}%
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(sheet.cost)}
          </span>
        </div>
      </div>
    </div>
  );
}
