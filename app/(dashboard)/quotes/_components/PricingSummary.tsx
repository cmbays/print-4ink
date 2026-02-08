"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingSummaryProps {
  lineItems: { lineTotal: number }[];
  setupFees: number;
  onSetupFeesChange: (fees: number) => void;
  priceOverride: number | null;
  onPriceOverrideChange: (override: number | null) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function PricingSummary({
  lineItems,
  setupFees,
  onSetupFeesChange,
  priceOverride,
  onPriceOverrideChange,
}: PricingSummaryProps) {
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  );

  const calculatedTotal = subtotal + setupFees;
  const displayTotal = priceOverride ?? calculatedTotal;
  const hasOverride =
    priceOverride !== null && priceOverride !== calculatedTotal;

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">
        Pricing Summary
      </h3>
      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Setup Fees */}
        <div className="flex items-center justify-between gap-4">
          <Label
            htmlFor="setup-fees"
            className="text-sm text-muted-foreground"
          >
            Setup Fees
          </Label>
          <div className="w-28">
            <Input
              id="setup-fees"
              type="number"
              min={0}
              step={0.01}
              value={setupFees || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onSetupFeesChange(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="h-8 text-right text-sm"
              placeholder="$0.00"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Grand Total */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label
              htmlFor="grand-total"
              className="text-base font-semibold text-foreground"
            >
              Grand Total
            </Label>
            {hasOverride && (
              <p className="text-xs text-warning">
                Price adjusted from {formatCurrency(calculatedTotal)}
              </p>
            )}
          </div>
          <div className="w-32">
            <Input
              id="grand-total"
              type="number"
              min={0}
              step={0.01}
              value={displayTotal || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val) || val === calculatedTotal) {
                  onPriceOverrideChange(null);
                } else {
                  onPriceOverrideChange(Math.max(0, val));
                }
              }}
              className="h-9 text-right text-base font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
