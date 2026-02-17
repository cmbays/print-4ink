"use client";

import { Send, X } from "lucide-react";
import { Button } from "@shared/ui/primitives/button";
import { Separator } from "@shared/ui/primitives/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@shared/ui/primitives/sheet";
import { InvoicePricingSummary } from "./InvoicePricingSummary";
import { INVOICE_LINE_ITEM_TYPE_LABELS } from "@domain/constants";
import { formatCurrency } from "@/lib/helpers/money";
import type { InvoiceLineItemData } from "./InvoiceLineItemRow";

interface ReviewSendSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  lineItems: InvoiceLineItemData[];
  subtotal: number;
  discountTotal: number;
  shipping: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  dueDate: string;
  paymentTerms: string;
  onSend: () => void;
}

export function ReviewSendSheet({
  open,
  onOpenChange,
  invoiceNumber,
  customerName,
  customerCompany,
  customerEmail,
  lineItems,
  subtotal,
  discountTotal,
  shipping,
  taxRate,
  taxAmount,
  total,
  depositAmount,
  dueDate,
  paymentTerms,
  onSend,
}: ReviewSendSheetProps) {
  function handleSend() {
    onOpenChange(false);
    onSend();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Review & Send Invoice</SheetTitle>
          <SheetDescription>
            Review the invoice details before sending to the customer.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Info */}
          <div className="rounded-lg border border-border bg-elevated p-4 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {customerCompany}
            </p>
            <p className="text-sm text-muted-foreground">{customerName}</p>
            <p className="text-sm text-muted-foreground">{customerEmail}</p>
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Line Items
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2">
                        <span className="text-foreground">
                          {item.description || INVOICE_LINE_ITEM_TYPE_LABELS[item.type]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="rounded-lg border border-border bg-elevated p-4">
            <InvoicePricingSummary
              subtotal={subtotal}
              discountTotal={discountTotal}
              shipping={shipping}
              taxRate={taxRate}
              taxAmount={taxAmount}
              total={total}
            />
          </div>

          {/* Deposit & Terms */}
          {(depositAmount > 0 || paymentTerms) && (
            <div className="rounded-lg border border-border bg-elevated p-4 space-y-2">
              {depositAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deposit Required</span>
                  <span className="font-medium font-mono text-foreground">
                    {formatCurrency(depositAmount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium text-foreground">{dueDate}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Email Preview */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Email Preview
            </h3>
            <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <p className="text-xs text-muted-foreground">To: {customerEmail}</p>
              <p className="text-sm font-medium text-foreground">
                Invoice {invoiceNumber} for {formatCurrency(total)}
              </p>
              <p className="text-sm text-muted-foreground">
                Hi {(customerName || "").split(" ")[0] || "there"}, please find attached invoice{" "}
                {invoiceNumber} for {formatCurrency(total)}.
                {depositAmount > 0 &&
                  ` A deposit of ${formatCurrency(depositAmount)} is requested.`}{" "}
                Payment is due by {dueDate}.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              className="bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-brutal"
            >
              <Send size={16} className="mr-2" />
              Send Invoice
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
