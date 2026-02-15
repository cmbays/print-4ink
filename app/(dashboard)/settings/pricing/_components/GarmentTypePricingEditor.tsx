"use client";

import { Input } from "@/components/ui/input";
import type { GarmentTypePricing } from "@/lib/schemas/price-matrix";

const CATEGORY_LABELS: Record<string, string> = {
  "t-shirts": "T-Shirts",
  fleece: "Fleece",
  outerwear: "Outerwear",
  headwear: "Headwear",
  pants: "Pants",
};

interface GarmentTypePricingEditorProps {
  garmentTypes: GarmentTypePricing[];
  onGarmentTypesChange: (garmentTypes: GarmentTypePricing[]) => void;
}

// ---------------------------------------------------------------------------
// Headless editor — no Card wrapper. Parent wraps in Popover/Dialog/Card.
// ---------------------------------------------------------------------------

export function GarmentTypePricingEditor({
  garmentTypes,
  onGarmentTypesChange,
}: GarmentTypePricingEditorProps) {
  const updateMarkup = (index: number, value: number) => {
    const updated = garmentTypes.map((g, i) =>
      i === index ? { ...g, baseMarkup: value } : g
    );
    onGarmentTypesChange(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Percentage markup over base t-shirt price for specialty garments.
      </p>
      {garmentTypes.map((gt, index) => (
        <div
          key={gt.garmentCategory}
          className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              {CATEGORY_LABELS[gt.garmentCategory] ?? gt.garmentCategory}
            </span>
            {gt.baseMarkup === 0 && (
              <span className="text-[10px] text-muted-foreground">(base)</span>
            )}
          </div>
          <div className="relative w-20">
            <Input
              type="number"
              step={5}
              min={0}
              max={200}
              value={gt.baseMarkup}
              onChange={(e) =>
                updateMarkup(index, parseFloat(e.target.value) || 0)
              }
              onFocus={(e) => e.target.select()}
              className="h-7 pr-6 text-xs text-right"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              %
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
