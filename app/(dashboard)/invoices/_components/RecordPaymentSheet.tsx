"use client";

import { useState } from "react";
import { DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { money } from "@/lib/helpers/money";
import { paymentMethodEnum } from "@/lib/schemas/invoice";
import type { Invoice, PaymentMethod } from "@/lib/schemas/invoice";

interface RecordPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function RecordPaymentSheet({
  open,
  onOpenChange,
  invoice,
}: RecordPaymentSheetProps) {
  const [amount, setAmount] = useState(invoice.balanceDue.toString());
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [reference, setReference] = useState("");

  // State resets naturally: parent must conditionally render
  // this component ({showPayment && <RecordPaymentSheet />})
  // so it unmounts on close and remounts fresh on open.

  const isTerminal = invoice.status === "void" || invoice.status === "paid";
  const parsedAmount = parseFloat(amount) || 0;
  const isOverpayment = money(parsedAmount).gt(money(invoice.balanceDue));
  const isValid = parsedAmount > 0 && money(parsedAmount).lte(money(invoice.balanceDue)) && method !== "" && date !== "";

  const nextStatus =
    money(parsedAmount).gte(money(invoice.balanceDue)) ? "Paid" : "Partial";

  function handleSubmit() {
    toast.success(
      `Payment of ${formatCurrency(parsedAmount)} recorded on ${invoice.invoiceNumber}`
    );
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-action" />
            Record Payment
          </SheetTitle>
          <SheetDescription>
            {invoice.invoiceNumber} &mdash; Balance due:{" "}
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(invoice.balanceDue)}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4">
          {isTerminal && (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
              <AlertTriangle className="size-4 mt-0.5 text-warning shrink-0" />
              <p className="text-sm text-warning">
                This invoice is{" "}
                <span className="font-medium">{invoice.status}</span> and cannot
                accept payments.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                max={invoice.balanceDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 font-mono"
                disabled={isTerminal}
              />
            </div>
            {isOverpayment && (
              <p className="text-xs text-error">
                Amount exceeds balance due of{" "}
                {formatCurrency(invoice.balanceDue)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Date</Label>
            <Input
              id="payment-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isTerminal}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
              disabled={isTerminal}
            >
              <SelectTrigger className="w-full" id="payment-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodEnum.options.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-reference">
              Reference{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="payment-reference"
              placeholder="Check #, transaction ID, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={isTerminal}
            />
          </div>

          {!isTerminal && parsedAmount > 0 && !isOverpayment && (
            <p className="text-xs text-muted-foreground">
              Recording this payment will change status to{" "}
              <span className="font-medium text-foreground">{nextStatus}</span>
            </p>
          )}
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isTerminal}
          >
            <DollarSign className="size-4" />
            Record Payment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
