"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DiscountRow } from "./DiscountRow";
import type { Discount } from "@/lib/schemas/quote";
import type { CustomerTag } from "@/lib/schemas/customer";

const TAX_RATE = 0.1;
const CONTRACT_DISCOUNT_RATE = 0.07;

interface PricingSummaryProps {
  garmentSubtotal: number;
  decorationSubtotal: number;
  setupFees: number;
  discounts: Discount[];
  onDiscountsChange: (discounts: Discount[]) => void;
  shipping: number;
  onShippingChange: (shipping: number) => void;
  customerTag?: CustomerTag;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function PricingSummary({
  garmentSubtotal,
  decorationSubtotal,
  setupFees,
  discounts,
  onDiscountsChange,
  shipping,
  onShippingChange,
  customerTag,
}: PricingSummaryProps) {
  const subtotal = garmentSubtotal + decorationSubtotal;

  // Contract discount is auto-calculated, not editable
  const contractDiscount = useMemo(() => {
    if (customerTag !== "contract") return 0;
    return Math.round(subtotal * CONTRACT_DISCOUNT_RATE * 100) / 100;
  }, [customerTag, subtotal]);

  // Manual discounts only (user-added)
  const manualDiscounts = useMemo(
    () => discounts.filter((d) => d.type === "manual" || d.type === "volume"),
    [discounts]
  );

  const totalManualDiscounts = useMemo(
    () => manualDiscounts.reduce((sum, d) => sum + d.amount, 0),
    [manualDiscounts]
  );

  const totalDiscounts = contractDiscount + totalManualDiscounts;

  // Tax is 10% of (subtotal + setupFees - discounts + shipping)
  const preTaxTotal = subtotal + setupFees - totalDiscounts + shipping;
  const tax = Math.round(preTaxTotal * TAX_RATE * 100) / 100;
  const grandTotal = preTaxTotal + tax;
  const originalPreTax = subtotal + setupFees + shipping;
  const originalTax = Math.round(originalPreTax * TAX_RATE * 100) / 100;
  const originalTotal = originalPreTax + originalTax;

  function handleAddDiscount() {
    onDiscountsChange([
      ...manualDiscounts,
      { label: "", amount: 0, type: "manual" },
    ]);
  }

  function handleDiscountChange(index: number, partial: Partial<Discount>) {
    const next = manualDiscounts.map((d, i) =>
      i === index ? { ...d, ...partial } : d
    );
    onDiscountsChange(next);
  }

  function handleRemoveDiscount(index: number) {
    onDiscountsChange(manualDiscounts.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">
        Pricing Summary
      </h3>
      <div className="space-y-3">
        {/* Garment Cost */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Garments</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(garmentSubtotal)}
          </span>
        </div>

        {/* Decoration Cost */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Decoration</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(decorationSubtotal)}
          </span>
        </div>

        {/* Setup Fees (auto-calculated, read-only) */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Setup Fees</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(setupFees)}
          </span>
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Subtotal</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(subtotal + setupFees)}
          </span>
        </div>

        {/* Contract Discount (auto, non-removable) */}
        {customerTag === "contract" && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="ghost"
                className="text-xs bg-warning/10 text-warning border border-warning/20"
              >
                contract
              </Badge>
              <span className="text-muted-foreground">
                Contract Pricing (7%)
              </span>
            </div>
            <span className="text-success">
              -{formatCurrency(contractDiscount)}
            </span>
          </div>
        )}

        {/* Manual Discounts */}
        {manualDiscounts.length > 0 && (
          <div className="space-y-2">
            {manualDiscounts.map((discount, i) => (
              <DiscountRow
                key={i}
                label={discount.label}
                amount={discount.amount}
                type={discount.type}
                editable
                onLabelChange={(label) =>
                  handleDiscountChange(i, { label })
                }
                onAmountChange={(amount) =>
                  handleDiscountChange(i, { amount })
                }
                onRemove={() => handleRemoveDiscount(i)}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddDiscount}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus size={16} className="mr-1" />
          Add Discount
        </Button>

        {/* Shipping */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Shipping</span>
          <div className="flex items-center gap-2">
            {customerTag === "contract" && shipping === 0 && (
              <Badge
                variant="ghost"
                className="bg-success/10 text-success text-xs"
              >
                FREE
              </Badge>
            )}
            <div className="w-28">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={shipping || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onShippingChange(isNaN(val) ? 0 : Math.max(0, val));
                }}
                className="h-8 text-right text-sm"
                placeholder="$0.00"
                aria-label="Shipping cost"
              />
            </div>
          </div>
        </div>

        {/* Tax (auto-calculated, non-editable) */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tax (10%)</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(tax)}
          </span>
        </div>

        <Separator />

        {/* Grand Total */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">
              Grand Total
            </p>
            {totalDiscounts > 0 && (
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(originalTotal)}
              </p>
            )}
          </div>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(grandTotal)}
          </p>
        </div>

        {/* Savings banner */}
        {totalDiscounts > 0 && (
          <div className="rounded-md bg-success/10 px-3 py-2 text-center">
            <span className="text-sm font-medium text-success">
              You save {formatCurrency(totalDiscounts)}!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
