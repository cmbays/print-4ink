"use client";

import Link from "next/link";
import { FileText, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "@/lib/constants";
import type { Quote } from "@/lib/schemas/quote";

interface CustomerQuotesTableProps {
  quotes: Quote[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomerQuotesTable({ quotes }: CustomerQuotesTableProps) {
  const sorted = [...quotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="size-10 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">No quotes yet</p>
        <p className="text-xs mt-1">Create one to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm" aria-label="Customer quotes">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium text-muted-foreground">Quote #</th>
              <th className="pb-3 font-medium text-muted-foreground">Status</th>
              <th className="pb-3 font-medium text-muted-foreground text-right">Total</th>
              <th className="pb-3 font-medium text-muted-foreground">Date</th>
              <th className="pb-3 font-medium text-muted-foreground sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((quote) => (
              <tr
                key={quote.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-3">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="font-medium text-foreground hover:text-action transition-colors"
                  >
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className="py-3">
                  <Badge variant="ghost" className={QUOTE_STATUS_COLORS[quote.status]}>
                    {QUOTE_STATUS_LABELS[quote.status]}
                  </Badge>
                </td>
                <td className="py-3 text-right font-mono text-foreground">
                  {formatCurrency(quote.total)}
                </td>
                <td className="py-3 text-muted-foreground">
                  {formatDate(quote.createdAt)}
                </td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    asChild
                    aria-label={`Copy quote ${quote.quoteNumber} as new`}
                  >
                    <Link href={`/quotes/new?duplicate=${quote.id}`}>
                      <Copy className="size-3" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3" role="list" aria-label="Customer quotes">
        {sorted.map((quote) => (
          <Link
            key={quote.id}
            href={`/quotes/${quote.id}`}
            className="block rounded-lg border border-border bg-elevated p-4 hover:border-action/30 transition-colors"
            role="listitem"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{quote.quoteNumber}</span>
              <Badge variant="ghost" className={QUOTE_STATUS_COLORS[quote.status]}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-foreground">
                {formatCurrency(quote.total)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(quote.createdAt)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
