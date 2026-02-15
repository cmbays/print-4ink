"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/pricing-engine";
import { money, round2, toNumber } from "@/lib/helpers/money";
import type { QuantityTier } from "@/lib/schemas/price-matrix";
import { Plus, Trash2 } from "lucide-react";

interface QuantityTierEditorProps {
  tiers: QuantityTier[];
  basePrices: number[];
  onTiersChange: (tiers: QuantityTier[], basePrices: number[]) => void;
}

// ---------------------------------------------------------------------------
// Headless editor — no Card wrapper. Parent wraps in Popover/Dialog/Card.
// ---------------------------------------------------------------------------

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

    const updatedTiers = tiers.map((t, i) => {
      if (i === tiers.length - 1 && t.maxQty === null) {
        return { ...t, maxQty: newMin - 1, label: `${t.minQty}–${newMin - 1}` };
      }
      return t;
    });

    const lastPrice = basePrices[basePrices.length - 1] ?? 5;
    onTiersChange([...updatedTiers, newTier], [...basePrices, Math.max(toNumber(round2(money(lastPrice).minus(1))), 1)]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    const newTiers = tiers.filter((_, i) => i !== index);
    const newPrices = basePrices.filter((_, i) => i !== index);

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Quantity breakpoints and base price per piece.
        </p>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addTier}>
          <Plus className="size-3" />
          Add Tier
        </Button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
        <Label className="text-xs">Min</Label>
        <Label className="text-xs">Max</Label>
        <Label className="text-xs">Label</Label>
        <Label className="text-xs">Base $</Label>
        <div className="w-7" />
      </div>

      {tiers.map((tier, index) => {
        const prevMax = index > 0 ? (tiers[index - 1].maxQty ?? tiers[index - 1].minQty) : 0;
        const minQtyInvalid = index > 0 && tier.minQty <= prevMax;
        const maxQtyInvalid = tier.maxQty !== null && tier.maxQty < tier.minQty;

        return (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2"
          >
            <Input
              type="number"
              min={1}
              value={tier.minQty}
              onChange={(e) => updateTier(index, "minQty", parseInt(e.target.value) || 0)}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) updateTier(index, "minQty", 1);
              }}
              onFocus={(e) => e.target.select()}
              className={cn("h-7 text-xs", minQtyInvalid && "border-error")}
            />
            <Input
              type="number"
              placeholder="∞"
              value={tier.maxQty ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  updateTier(index, "maxQty", null);
                } else {
                  updateTier(index, "maxQty", parseInt(val) || 0);
                }
              }}
              onFocus={(e) => e.target.select()}
              className={cn("h-7 text-xs", maxQtyInvalid && "border-error")}
            />
            <Input
              type="text"
              value={tier.label}
              onChange={(e) => updateTier(index, "label", e.target.value)}
              className="h-7 text-xs"
            />
            <div className="relative">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step={0.25}
                min={0}
                value={basePrices[index] ?? 0}
                onChange={(e) => updateBasePrice(index, parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="h-7 pl-4 text-xs"
              />
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-7 text-muted-foreground hover:text-error"
              onClick={() => removeTier(index)}
              disabled={tiers.length <= 1}
              aria-label={`Remove tier ${tier.label}`}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        );
      })}

      {/* Price summary */}
      {basePrices.length > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-surface px-2.5 py-1.5 text-xs text-muted-foreground">
          <span>Range:</span>
          <span className="text-foreground font-medium">
            {formatCurrency(Math.min(...basePrices))} &ndash;{" "}
            {formatCurrency(Math.max(...basePrices))}
          </span>
        </div>
      )}
    </div>
  );
}
