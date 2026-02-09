"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Copy, Send, Receipt, FileText } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-2">
      {isDraft && (
        <Link href={`/quotes/${quote.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            Edit
          </Button>
        </Link>
      )}
      <Link href={`/quotes/new?duplicate=${quote.id}`}>
        <Button variant="outline" size="sm">
          <Copy className="size-4" />
          Copy as New
        </Button>
      </Link>
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
      <Button
        variant="outline"
        size="sm"
        disabled
        className="opacity-50"
      >
        <Receipt className="size-4" />
        Invoice
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled
        className="opacity-50"
      >
        <FileText className="size-4" />
        PDF
      </Button>

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
