"use client";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PricingSnapshot } from "@/lib/schemas/invoice";

interface ChangeDiffPanelProps {
  pricingSnapshot: PricingSnapshot | undefined;
  currentPricing: {
    subtotal: number;
    discountTotal: number;
    shipping: number;
    taxAmount: number;
    total: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function DiffRow({
  label,
  snapshotValue,
  currentValue,
}: {
  label: string;
  snapshotValue: number;
  currentValue: number;
}) {
  const diff = currentValue - snapshotValue;
  if (Math.abs(diff) < 0.01) return null;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground line-through">
          {formatCurrency(snapshotValue)}
        </span>
        <span className="text-foreground">{formatCurrency(currentValue)}</span>
        <span
          className={cn(
            "font-mono text-xs",
            diff > 0 ? "text-error" : "text-success",
          )}
        >
          {diff > 0 ? "+" : ""}
          {formatCurrency(diff)}
        </span>
      </div>
    </div>
  );
}

export function ChangeDiffPanel({
  pricingSnapshot,
  currentPricing,
}: ChangeDiffPanelProps) {
  if (!pricingSnapshot) return null;

  // Check if anything actually changed
  const hasChanges =
    Math.abs(pricingSnapshot.subtotal - currentPricing.subtotal) >= 0.01 ||
    Math.abs(pricingSnapshot.discountTotal - currentPricing.discountTotal) >= 0.01 ||
    Math.abs(pricingSnapshot.shipping - currentPricing.shipping) >= 0.01 ||
    Math.abs(pricingSnapshot.taxAmount - currentPricing.taxAmount) >= 0.01 ||
    Math.abs(pricingSnapshot.total - currentPricing.total) >= 0.01;

  if (!hasChanges) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-surface transition-colors rounded-lg">
          <span>View Quote Changes</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
            <DiffRow
              label="Subtotal"
              snapshotValue={pricingSnapshot.subtotal}
              currentValue={currentPricing.subtotal}
            />
            <DiffRow
              label="Discounts"
              snapshotValue={pricingSnapshot.discountTotal}
              currentValue={currentPricing.discountTotal}
            />
            <DiffRow
              label="Shipping"
              snapshotValue={pricingSnapshot.shipping}
              currentValue={currentPricing.shipping}
            />
            <DiffRow
              label="Tax"
              snapshotValue={pricingSnapshot.taxAmount}
              currentValue={currentPricing.taxAmount}
            />
            <DiffRow
              label="Total"
              snapshotValue={pricingSnapshot.total}
              currentValue={currentPricing.total}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
