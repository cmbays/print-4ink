"use client";

import { Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shared/ui/primitives/dialog";
import type { Quote } from "@domain/entities/quote";
import type { Customer } from "@domain/entities/customer";
import { formatCurrency } from "@domain/lib/money";

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Pick<Quote, "quoteNumber" | "total" | "lineItems">;
  customer: Pick<Customer, "name" | "email" | "company">;
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  quote,
  customer,
}: EmailPreviewModalProps) {
  const firstName = customer.name.trim().split(" ")[0] || "there";

  function handleSend() {
    toast.success(`Email sent to ${customer.email}`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Email Preview
          </DialogTitle>
          <DialogDescription>
            Preview the email before sending to the customer.
          </DialogDescription>
        </DialogHeader>

        {/* Email metadata */}
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">To: </span>
            <span className="text-foreground">{customer.email}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Subject: </span>
            <span className="text-foreground">
              Your quote from 4Ink &mdash; {quote.quoteNumber}
            </span>
          </p>
        </div>

        {/* Email body preview */}
        <div className="rounded-md border border-border bg-card p-4 space-y-4 text-sm text-foreground">
          <p>Hi {firstName},</p>
          <p>
            Here&apos;s your quote for your recent order. Please review the
            details below.
          </p>
          <div className="space-y-2">
            <p>
              <span className="text-muted-foreground">Quote: </span>
              {quote.quoteNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Items: </span>
              {quote.lineItems.length} line item
              {quote.lineItems.length !== 1 ? "s" : ""}
            </p>
            <p>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">
                {formatCurrency(quote.total)}
              </span>
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface px-4 py-2">
            <p className="font-medium text-action">
              View Quote →
            </p>
            <p className="text-xs text-muted-foreground">
              https://app.4ink.com/quotes/{quote.quoteNumber.toLowerCase()}/view
            </p>
          </div>
          <p className="text-muted-foreground">
            Questions? Reply to this email or call us at (512) 555-4INK.
          </p>
          <p>&mdash; The 4Ink Team</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend}>
            <Mail className="size-4" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
