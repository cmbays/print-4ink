"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { GarmentTypePricing } from "@/lib/schemas/price-matrix";
import { Shirt } from "lucide-react";

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shirt className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Garment Type Markup</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Percentage markup over base t-shirt price for specialty garment categories.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {garmentTypes.map((gt, index) => (
            <div
              key={gt.garmentCategory}
              className="flex items-center justify-between gap-4 rounded-md bg-surface px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">
                  {CATEGORY_LABELS[gt.garmentCategory] ?? gt.garmentCategory}
                </span>
                {gt.baseMarkup === 0 && (
                  <span className="text-[10px] text-muted-foreground">(base)</span>
                )}
              </div>
              <div className="relative w-24">
                <Input
                  type="number"
                  step={5}
                  min={0}
                  max={200}
                  value={gt.baseMarkup}
                  onChange={(e) =>
                    updateMarkup(index, parseFloat(e.target.value) || 0)
                  }
                  className="h-8 pr-6 text-xs text-right"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
