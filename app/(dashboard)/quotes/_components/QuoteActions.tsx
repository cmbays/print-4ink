"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Copy, Send, Receipt, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmailPreviewModal } from "./EmailPreviewModal";
import type { Quote } from "@/lib/schemas/quote";
import type { Customer } from "@/lib/schemas/customer";

interface QuoteActionsProps {
  quote: Quote;
  customer: Customer | null;
}

export function QuoteActions({ quote, customer }: QuoteActionsProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const isDraft = quote.status === "draft";

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Actions</h2>
      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <Link href={`/quotes/${quote.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="size-4" />
              Edit Quote
            </Button>
          </Link>
        )}
        <Link href={`/quotes/new?duplicate=${quote.id}`}>
          <Button variant="outline" size="sm">
            <Copy className="size-4" />
            Duplicate
          </Button>
        </Link>
        {isDraft && customer && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailOpen(true)}
          >
            <Send className="size-4" />
            Send to Customer
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled
          onClick={() =>
            toast.info("Invoice conversion coming in Phase 2")
          }
          className="opacity-50"
        >
          <Receipt className="size-4" />
          Convert to Invoice
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          onClick={() =>
            toast.info("PDF generation coming in Phase 2")
          }
          className="opacity-50"
        >
          <FileText className="size-4" />
          Download PDF
        </Button>
      </div>

      {customer && (
        <EmailPreviewModal
          open={emailOpen}
          onOpenChange={setEmailOpen}
          quote={{
            quoteNumber: quote.quoteNumber,
            total: quote.priceOverride ?? quote.total,
            lineItems: quote.lineItems,
          }}
          customer={{
            name: customer.name,
            email: customer.email,
            company: customer.company,
          }}
        />
      )}
    </div>
  );
}
