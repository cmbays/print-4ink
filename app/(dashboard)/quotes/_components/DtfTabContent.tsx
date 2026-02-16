"use client";

import { useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DtfLineItemRow } from "./DtfLineItemRow";
import { DTF_SIZE_PRESETS } from "@/lib/dtf/dtf-constants";
import { dtfSheetTiers } from "@/lib/mock-data";
import { SheetCalculationPanel } from "./SheetCalculationPanel";
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
  splitMode,
  setSplitMode,
  // Wave 4 props — accepted but not yet wired
  canvasLayout: _canvasLayout,
  activeSheetIndex: _activeSheetIndex,
  setActiveSheetIndex,
  setSheetCalculation,
  setCanvasLayout,
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

      {/* U82-U87 — Sheet Calculation Panel (Wave 3) — includes subtotal in summary row */}
      <SheetCalculationPanel
        lineItems={lineItems}
        sheetCalculation={sheetCalculation}
        setSheetCalculation={setSheetCalculation}
        splitMode={splitMode}
        setSplitMode={setSplitMode}
        setCanvasLayout={setCanvasLayout}
        setActiveSheetIndex={setActiveSheetIndex}
        tiers={dtfSheetTiers}
      />

      {/* Placeholder: Visual Canvas (Wave 4) — dev-only */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-dashed border-border bg-surface/50 p-6 text-center">
          <p className="text-sm text-muted-foreground/60">
            Visual canvas — coming in Wave 4
          </p>
        </div>
      )}
    </div>
  );
}
