"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/pricing-engine";
import { money, round2, toNumber } from "@/lib/helpers/money";
import type { QuantityTier } from "@/lib/schemas/price-matrix";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

// ---------------------------------------------------------------------------
// Validation — exported so the parent can check for errors on the button
// ---------------------------------------------------------------------------

export interface TierGap {
  afterIndex: number;
  missingStart: number;
  missingEnd: number;
}

export interface TierIssue {
  index: number;
  field: "minQty" | "maxQty";
  message: string;
}

export interface TierValidationResult {
  gaps: TierGap[];
  issues: TierIssue[];
  hasErrors: boolean;
}

export function validateTiers(tiers: QuantityTier[]): TierValidationResult {
  const gaps: TierGap[] = [];
  const issues: TierIssue[] = [];

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const prev = i > 0 ? tiers[i - 1] : null;

    if (tier.minQty < 1) {
      issues.push({ index: i, field: "minQty", message: "Min must be at least 1" });
    }

    if (tier.maxQty !== null && tier.maxQty < tier.minQty) {
      issues.push({ index: i, field: "maxQty", message: "Max must be ≥ min" });
    }

    if (prev && prev.maxQty !== null) {
      if (tier.minQty > prev.maxQty + 1) {
        gaps.push({
          afterIndex: i - 1,
          missingStart: prev.maxQty + 1,
          missingEnd: tier.minQty - 1,
        });
      }
      if (tier.minQty <= prev.maxQty) {
        issues.push({
          index: i,
          field: "minQty",
          message: `Overlaps with previous tier (ends at ${prev.maxQty})`,
        });
      }
    }
  }

  return { gaps, issues, hasErrors: gaps.length > 0 || issues.length > 0 };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveLabel(minQty: number, maxQty: number | null): string {
  return maxQty !== null ? `${minQty}\u2013${maxQty}` : `${minQty}+`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  // Track which field is focused to suppress validation display mid-typing
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validation = validateTiers(tiers);

  // Map issues by index+field for quick lookup
  const issueMap = new Map<string, string>();
  for (const issue of validation.issues) {
    issueMap.set(`${issue.index}-${issue.field}`, issue.message);
  }

  // Map gaps by afterIndex for display between rows
  const gapMap = new Map<number, TierGap>();
  for (const gap of validation.gaps) {
    gapMap.set(gap.afterIndex, gap);
  }

  const updateTier = (index: number, field: "minQty" | "maxQty", value: number | null) => {
    const newTiers = tiers.map((t, i) => {
      if (i !== index) return t;
      const updated = { ...t, [field]: value };
      updated.label = deriveLabel(updated.minQty, updated.maxQty);
      return updated;
    });
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
      label: deriveLabel(newMin, null),
    };

    const updatedTiers = tiers.map((t, i) => {
      if (i === tiers.length - 1 && t.maxQty === null) {
        const newMax = newMin - 1;
        return { ...t, maxQty: newMax, label: deriveLabel(t.minQty, newMax) };
      }
      return t;
    });

    const lastPrice = basePrices[basePrices.length - 1] ?? 5;
    onTiersChange(
      [...updatedTiers, newTier],
      [...basePrices, Math.max(toNumber(round2(money(lastPrice).minus(1))), 1)],
    );
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
        label: deriveLabel(last.minQty, null),
      };
    }

    onTiersChange(newTiers, newPrices);
  };

  // Check if a field has an error AND is not currently focused
  const showError = (index: number, field: "minQty" | "maxQty") => {
    const key = `${index}-${field}`;
    return focusedField !== key && issueMap.has(key);
  };

  return (
    <div className="space-y-3">
      {/* Error banner */}
      {validation.hasErrors && (
        <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 px-2.5 py-2 text-xs text-error">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          <span>Tier configuration has issues — check highlighted fields below.</span>
        </div>
      )}

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
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
        <Label className="text-xs">Min</Label>
        <Label className="text-xs">Max</Label>
        <Label className="text-xs">Base $</Label>
        <div className="w-7" />
      </div>

      {tiers.map((tier, index) => {
        const gap = gapMap.get(index);
        const minError = showError(index, "minQty");
        const maxError = showError(index, "maxQty");
        const minMessage = issueMap.get(`${index}-minQty`);
        const maxMessage = issueMap.get(`${index}-maxQty`);

        return (
          <div key={index} className="space-y-1">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
              <Input
                type="number"
                min={1}
                value={tier.minQty}
                onChange={(e) => updateTier(index, "minQty", parseInt(e.target.value) || 0)}
                onBlur={(e) => {
                  setFocusedField(null);
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1) updateTier(index, "minQty", 1);
                }}
                onFocus={(e) => {
                  setFocusedField(`${index}-minQty`);
                  e.target.select();
                }}
                className={cn("h-7 text-xs", minError && "border-error")}
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
                onBlur={() => setFocusedField(null)}
                onFocus={(e) => {
                  setFocusedField(`${index}-maxQty`);
                  e.target.select();
                }}
                className={cn("h-7 text-xs", maxError && "border-error")}
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
                className="size-7 text-destructive hover:text-destructive/80"
                onClick={() => removeTier(index)}
                disabled={tiers.length <= 1}
                aria-label={`Remove tier ${tier.label}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>

            {/* Auto-derived label + field-level error messages */}
            <div className="flex items-center gap-3 pl-0.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {tier.label}
              </span>
              {minError && minMessage && (
                <span className="text-[10px] text-error">{minMessage}</span>
              )}
              {maxError && maxMessage && (
                <span className="text-[10px] text-error">{maxMessage}</span>
              )}
            </div>

            {/* Gap warning between this tier and the next */}
            {gap && (
              <div className="flex items-center gap-1.5 rounded bg-error/5 border border-error/20 px-2 py-1 text-[11px] text-error">
                <AlertTriangle className="size-3 shrink-0" />
                Gap: quantities {gap.missingStart}
                {gap.missingStart !== gap.missingEnd && `\u2013${gap.missingEnd}`}
                {" "}not covered
              </div>
            )}
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
