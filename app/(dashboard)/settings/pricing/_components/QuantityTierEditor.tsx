"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/pricing-engine";
import { money } from "@/lib/helpers/money";
import type { QuantityTier } from "@/lib/schemas/price-matrix";
import { Layers, Plus, Trash2 } from "lucide-react";

interface QuantityTierEditorProps {
  tiers: QuantityTier[];
  basePrices: number[];
  onTiersChange: (tiers: QuantityTier[], basePrices: number[]) => void;
}

export function QuantityTierEditor({
  tiers,
  basePrices,
  onTiersChange,
}: QuantityTierEditorProps) {
  const updateTier = (index: number, field: keyof QuantityTier, value: string | number | null) => {
    const newTiers = tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t));
    onTiersChange(newTiers, basePrices);
  };

  const updateBasePrice = (index: number, value: number) => {
    const newPrices = basePrices.map((p, i) => (i === index ? value : p));
    onTiersChange(tiers, newPrices);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier?.maxQty ? lastTier.maxQty + 1 : (lastTier?.minQty ?? 0) + 100;
    const newTier: QuantityTier = {
      minQty: newMin,
      maxQty: null,
      label: `${newMin}+`,
    };

    // If previous last tier had null maxQty, cap it
    const updatedTiers = tiers.map((t, i) => {
      if (i === tiers.length - 1 && t.maxQty === null) {
        return { ...t, maxQty: newMin - 1, label: `${t.minQty}–${newMin - 1}` };
      }
      return t;
    });

    const lastPrice = basePrices[basePrices.length - 1] ?? 5;
    onTiersChange([...updatedTiers, newTier], [...basePrices, Math.max(money(lastPrice - 1), 1)]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    const newTiers = tiers.filter((_, i) => i !== index);
    const newPrices = basePrices.filter((_, i) => i !== index);

    // If removing last tier, make the new last tier open-ended
    if (index === tiers.length - 1 && newTiers.length > 0) {
      const last = newTiers[newTiers.length - 1];
      newTiers[newTiers.length - 1] = {
        ...last,
        maxQty: null,
        label: `${last.minQty}+`,
      };
    }

    onTiersChange(newTiers, newPrices);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Quantity Tiers</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={addTier}>
            <Plus className="size-3.5" />
            Add Tier
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Define quantity breakpoints and base price per piece for each tier.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 text-xs text-muted-foreground">
            <Label className="text-xs">Min Qty</Label>
            <Label className="text-xs">Max Qty</Label>
            <Label className="text-xs">Label</Label>
            <Label className="text-xs">Base Price</Label>
            <div className="w-8" />
          </div>

          {tiers.map((tier, index) => (
            <div
              key={index}
              className={cn(
                "grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-3"
              )}
            >
              <Input
                type="number"
                min={1}
                value={tier.minQty}
                onChange={(e) =>
                  updateTier(index, "minQty", parseInt(e.target.value) || 1)
                }
                className="h-8 text-xs"
              />
              <Input
                type="number"
                min={tier.minQty}
                placeholder="Unlimited"
                value={tier.maxQty ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    updateTier(index, "maxQty", null);
                  } else {
                    const parsed = parseInt(val) || tier.minQty;
                    updateTier(index, "maxQty", Math.max(parsed, tier.minQty));
                  }
                }}
                className="h-8 text-xs"
              />
              <Input
                type="text"
                value={tier.label}
                onChange={(e) => updateTier(index, "label", e.target.value)}
                className="h-8 text-xs"
              />
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step={0.25}
                  min={0}
                  value={basePrices[index] ?? 0}
                  onChange={(e) =>
                    updateBasePrice(index, parseFloat(e.target.value) || 0)
                  }
                  className="h-8 pl-5 text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-error"
                onClick={() => removeTier(index)}
                disabled={tiers.length <= 1}
                aria-label={`Remove tier ${tier.label}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}

          {/* Price summary */}
          {basePrices.length > 0 && (
            <div className="mt-2 flex items-center gap-4 rounded-md bg-surface px-3 py-2 text-xs text-muted-foreground">
              <span>Price range:</span>
              <span className="text-foreground font-medium">
                {formatCurrency(Math.min(...basePrices))} &ndash;{" "}
                {formatCurrency(Math.max(...basePrices))}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
