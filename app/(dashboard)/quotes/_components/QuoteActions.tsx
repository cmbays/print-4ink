"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Copy, Send, Receipt, Hammer } from "lucide-react";
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
  const isAccepted = quote.status === "accepted";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAccepted && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs/board">
              <Hammer className="size-4" />
              Create Job
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/invoices/new?quoteId=${quote.id}`}>
              <Receipt className="size-4" />
              Create Invoice
            </Link>
          </Button>
        </>
      )}
      {isDraft && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/quotes/${quote.id}/edit`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </Button>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/quotes/new?duplicate=${quote.id}`}>
          <Copy className="size-4" />
          Copy as New
        </Link>
      </Button>
      {isDraft && customer && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEmailOpen(true)}
        >
          <Send className="size-4" />
          Send
        </Button>
      )}
      {customer && (
        <EmailPreviewModal
          open={emailOpen}
          onOpenChange={setEmailOpen}
          quote={{
            quoteNumber: quote.quoteNumber,
            total: quote.total,
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
