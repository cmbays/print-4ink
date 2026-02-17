"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVOICE_LINE_ITEM_TYPE_LABELS } from "@/lib/constants";
import { money, round2, toNumber, formatCurrency } from "@/lib/helpers/money";
import type { InvoiceLineItemType } from "@/lib/schemas/invoice";

const LINE_ITEM_TYPES: InvoiceLineItemType[] = [
  "garment",
  "setup",
  "artwork",
  "rush",
  "other",
];

export interface InvoiceLineItemData {
  id: string;
  type: InvoiceLineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceLineItemRowProps {
  index: number;
  item: InvoiceLineItemData;
  onChange: (index: number, item: InvoiceLineItemData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  errors?: Record<string, string>;
}

export function InvoiceLineItemRow({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
  errors,
}: InvoiceLineItemRowProps) {
  const lineTotal = toNumber(round2(money(item.quantity).times(item.unitPrice)));

  function updateField(partial: Partial<InvoiceLineItemData>) {
    onChange(index, { ...item, ...partial });
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      <div className="flex items-start gap-3">
        {/* Type */}
        <div className="w-32 shrink-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={item.type}
            onValueChange={(value: InvoiceLineItemType) =>
              updateField({ type: value })
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINE_ITEM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {INVOICE_LINE_ITEM_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Input
            value={item.description}
            onChange={(e) => updateField({ description: e.target.value })}
            placeholder="Item description..."
            className={errors?.description ? "border-error" : ""}
            aria-label={`Line item ${index + 1} description`}
          />
          {errors?.description && (
            <p className="text-xs text-error" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        {/* Qty */}
        <div className="w-20 shrink-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <Input
            type="number"
            min={1}
            value={item.quantity || ""}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              updateField({ quantity: isNaN(val) ? 1 : Math.max(1, val) });
            }}
            className="text-right"
            placeholder="0"
            aria-label={`Line item ${index + 1} quantity`}
          />
        </div>

        {/* Unit Price */}
        <div className="w-28 shrink-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Unit Price</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={item.unitPrice || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              updateField({ unitPrice: isNaN(val) ? 0 : Math.max(0, val) });
            }}
            className="text-right"
            placeholder="$0.00"
            aria-label={`Line item ${index + 1} unit price`}
          />
        </div>

        {/* Line Total (computed, read-only) */}
        <div className="w-28 shrink-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Total</Label>
          <div className="flex h-9 items-center justify-end rounded-md bg-surface px-3 text-sm font-medium font-mono text-foreground">
            {formatCurrency(lineTotal)}
          </div>
        </div>

        {/* Remove */}
        <div className="shrink-0 pt-6">
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="h-9 w-9 p-0 text-muted-foreground hover:text-error"
              aria-label={`Remove line item ${index + 1}`}
            >
              <Trash2 size={16} />
            </Button>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>
      </div>
    </div>
  );
}
