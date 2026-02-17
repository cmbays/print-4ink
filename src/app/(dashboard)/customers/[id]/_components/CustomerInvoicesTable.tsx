"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { Badge } from "@shared/ui/primitives/badge";

import {
  INVOICE_STATUS_BADGE_COLORS,
  INVOICE_STATUS_LABELS,
} from "@domain/constants";
import { formatDate } from "@shared/lib/format";
import { formatCurrency } from "@domain/lib/money";
import type { Invoice } from "@domain/entities/invoice";

interface CustomerInvoicesTableProps {
  invoices: Invoice[];
}

export function CustomerInvoicesTable({ invoices }: CustomerInvoicesTableProps) {
  const sorted = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Receipt className="size-12 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">No invoices yet</p>
        <p className="text-xs mt-1">Invoices will appear here once created</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm" aria-label="Customer invoices">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium text-muted-foreground">Invoice #</th>
              <th className="pb-3 font-medium text-muted-foreground">Date</th>
              <th className="pb-3 font-medium text-muted-foreground">Status</th>
              <th className="pb-3 font-medium text-muted-foreground text-right">Amount</th>
              <th className="pb-3 font-medium text-muted-foreground text-right">Balance Due</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-3">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="font-medium text-foreground hover:text-action transition-colors"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="py-3 text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                </td>
                <td className="py-3">
                  <Badge variant="ghost" className={INVOICE_STATUS_BADGE_COLORS[invoice.status]}>
                    {INVOICE_STATUS_LABELS[invoice.status]}
                  </Badge>
                </td>
                <td className="py-3 text-right font-mono text-foreground">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="py-3 text-right font-mono text-foreground">
                  {invoice.balanceDue > 0
                    ? formatCurrency(invoice.balanceDue)
                    : <span className="text-muted-foreground">&mdash;</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3" role="list" aria-label="Customer invoices">
        {sorted.map((invoice) => (
          <Link
            key={invoice.id}
            href={`/invoices/${invoice.id}`}
            className="block rounded-lg border border-border bg-elevated p-4 hover:border-action/30 transition-colors"
            role="listitem"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>
              <Badge variant="ghost" className={INVOICE_STATUS_BADGE_COLORS[invoice.status]}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-foreground">
                {formatCurrency(invoice.total)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(invoice.createdAt)}
              </span>
            </div>
            {invoice.balanceDue > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Balance: <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
              </p>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
