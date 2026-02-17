"use client";

import { Separator } from "@shared/ui/primitives/separator";
import { formatCurrency } from "@/lib/helpers/money";

interface InvoicePricingSummaryProps {
  subtotal: number;
  discountTotal: number;
  shipping: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export function InvoicePricingSummary({
  subtotal,
  discountTotal,
  shipping,
  taxRate,
  taxAmount,
  total,
}: InvoicePricingSummaryProps) {
  return (
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-sm font-medium font-mono text-foreground">
          {formatCurrency(subtotal)}
        </span>
      </div>

      {/* Discounts */}
      {discountTotal > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Discounts</span>
          <span className="text-sm font-medium font-mono text-success">
            -{formatCurrency(discountTotal)}
          </span>
        </div>
      )}

      {/* Shipping */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Shipping</span>
        <span className="text-sm font-medium font-mono text-foreground">
          {formatCurrency(shipping)}
        </span>
      </div>

      {/* Tax */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Tax ({taxRate}%)
        </span>
        <span className="text-sm font-medium font-mono text-foreground">
          {formatCurrency(taxAmount)}
        </span>
      </div>

      <Separator />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">Total</span>
        <span className="text-lg font-semibold font-mono text-foreground">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
