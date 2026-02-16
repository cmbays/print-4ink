"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DtfLineItemRow } from "./DtfLineItemRow";
import { DTF_SIZE_PRESETS } from "@/lib/dtf/dtf-constants";
import { formatCurrency } from "@/lib/helpers/money";
import type { DtfLineItem } from "@/lib/schemas/dtf-line-item";
import type { SheetCalculation, CanvasLayout } from "@/lib/schemas/dtf-sheet-calculation";

interface DtfTabContentProps {
  lineItems: DtfLineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<DtfLineItem[]>>;
  sheetCalculation: SheetCalculation | null;
  splitMode: "combine" | "split";
  setSplitMode: React.Dispatch<React.SetStateAction<"combine" | "split">>;
  canvasLayout: CanvasLayout[] | null;
  activeSheetIndex: number;
  setActiveSheetIndex: React.Dispatch<React.SetStateAction<number>>;
  setSheetCalculation: React.Dispatch<React.SetStateAction<SheetCalculation | null>>;
  setCanvasLayout: React.Dispatch<React.SetStateAction<CanvasLayout[] | null>>;
}

// Default to Small preset resolved dimensions
const DEFAULT_PRESET = DTF_SIZE_PRESETS[0]; // Small: 4x4

export function DtfTabContent({
  lineItems,
  setLineItems,
  sheetCalculation,
  // Wave 3/4 props — accepted but not yet wired
  splitMode: _splitMode,
  setSplitMode: _setSplitMode,
  canvasLayout: _canvasLayout,
  activeSheetIndex: _activeSheetIndex,
  setActiveSheetIndex: _setActiveSheetIndex,
  setSheetCalculation: _setSheetCalculation,
  setCanvasLayout: _setCanvasLayout,
}: DtfTabContentProps) {
  // N43 — addDtfLineItem
  const handleAddLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        artworkName: "",
        width: DEFAULT_PRESET.width,
        height: DEFAULT_PRESET.height,
        quantity: 1,
        sizePreset: "small",
      },
    ]);
  }, [setLineItems]);

  // N44 — removeDtfLineItem
  const handleRemoveLineItem = useCallback(
    (id: string) => {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    },
    [setLineItems]
  );

  // N45 — updateDtfLineItem
  const handleUpdateLineItem = useCallback(
    (id: string, field: keyof DtfLineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    [setLineItems]
  );

  // Seed with one line item if empty
  const hasItems = lineItems.length > 0;

  return (
    <div className="space-y-4">
      {/* U71 — DTF line item list */}
      <div className="space-y-3">
        {lineItems.map((item) => (
          <DtfLineItemRow
            key={item.id}
            item={item}
            onUpdate={handleUpdateLineItem}
            onRemove={handleRemoveLineItem}
            canRemove={lineItems.length > 1}
          />
        ))}
      </div>

      {/* U72 — Add Design button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddLineItem}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Design
      </Button>

      {/* U81 — DTF subtotal display */}
      {hasItems && (
        <div className={cn(
          "flex items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3"
        )}>
          <span className="text-sm text-muted-foreground">DTF Subtotal</span>
          <span className="text-sm font-medium text-foreground">
            {sheetCalculation ? formatCurrency(sheetCalculation.totalCost) : "--"}
          </span>
        </div>
      )}

      {/* Placeholder: Sheet Calculation (Wave 3) */}
      <div className={cn(
        "rounded-lg border border-dashed border-border bg-surface/50 p-6 text-center"
      )}>
        <p className="text-sm text-muted-foreground/60">
          Sheet calculation — coming in Wave 3
        </p>
      </div>

      {/* Placeholder: Visual Canvas (Wave 4) */}
      <div className={cn(
        "rounded-lg border border-dashed border-border bg-surface/50 p-6 text-center"
      )}>
        <p className="text-sm text-muted-foreground/60">
          Visual canvas — coming in Wave 4
        </p>
      </div>
    </div>
  );
}
