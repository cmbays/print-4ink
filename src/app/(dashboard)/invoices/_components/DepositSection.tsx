"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEPOSIT_DEFAULTS_BY_TIER } from "@/lib/constants";
import { calculateSmartDeposit } from "@/lib/helpers/invoice-utils";
import { money, toNumber } from "@/lib/helpers/money";
import type { PricingTier } from "@domain/entities/customer";

interface DepositSectionProps {
  depositAmount: number;
  onDepositChange: (amount: number) => void;
  total: number;
  customerTier: PricingTier;
}

export function DepositSection({
  depositAmount,
  onDepositChange,
  total,
  customerTier,
}: DepositSectionProps) {
  const isEnabled = depositAmount > 0;
  const percentage = total > 0
    ? toNumber(money(depositAmount).div(money(total)).times(100).round(0))
    : 0;
  const defaultPercent = DEPOSIT_DEFAULTS_BY_TIER[customerTier];

  function handleToggle(checked: boolean) {
    if (checked) {
      const smartAmount = calculateSmartDeposit(customerTier, total);
      onDepositChange(smartAmount);
    } else {
      onDepositChange(0);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="deposit-toggle" className="text-sm text-foreground">
            Request Deposit
          </Label>
          <p className="text-xs text-muted-foreground">
            Default: {defaultPercent}% for {customerTier} tier
          </p>
        </div>
        <Switch
          id="deposit-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {isEnabled && (
        <div className="flex items-center gap-3 rounded-md bg-surface px-3 py-2">
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="deposit-amount"
              className="text-xs text-muted-foreground"
            >
              Deposit Amount
            </Label>
            <Input
              id="deposit-amount"
              type="number"
              min={0}
              step={0.01}
              value={depositAmount || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onDepositChange(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="h-8 text-right text-sm font-mono"
              aria-label="Deposit amount"
            />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">of total</p>
            <p className="text-sm font-medium font-mono text-foreground">
              {percentage}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
