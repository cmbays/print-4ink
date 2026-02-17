"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@shared/ui/primitives/button";
import { Input } from "@shared/ui/primitives/input";
import { Badge } from "@shared/ui/primitives/badge";
import { cn } from "@shared/lib/cn";
import { formatCurrency } from "@domain/lib/money";

interface DiscountRowProps {
  label: string;
  amount: number;
  type: "manual" | "contract" | "volume";
  editable?: boolean;
  onLabelChange?: (label: string) => void;
  onAmountChange?: (amount: number) => void;
  onRemove?: () => void;
}

const TYPE_STYLES: Record<string, string> = {
  manual: "bg-muted text-muted-foreground",
  contract: "bg-warning/10 text-warning border border-warning/20",
  volume: "bg-success/10 text-success border border-success/20",
};

export function DiscountRow({
  label,
  amount,
  type,
  editable = false,
  onLabelChange,
  onAmountChange,
  onRemove,
}: DiscountRowProps) {
  if (!editable) {
    return (
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="ghost" className={cn("text-xs", TYPE_STYLES[type])}>
            {type}
          </Badge>
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="text-success">-{formatCurrency(amount)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="ghost" className={cn("text-xs shrink-0", TYPE_STYLES[type])}>
        {type}
      </Badge>
      <Input
        value={label}
        onChange={(e) => onLabelChange?.(e.target.value)}
        className="h-7 text-sm flex-1"
        placeholder="Discount label..."
        aria-label="Discount label"
      />
      <div className="relative w-24 shrink-0">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">-$</span>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={amount || ""}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onAmountChange?.(isNaN(val) ? 0 : Math.max(0, val));
          }}
          className="h-7 pl-6 text-right text-sm"
          aria-label="Discount amount"
        />
      </div>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-error shrink-0"
          aria-label="Remove discount"
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}
