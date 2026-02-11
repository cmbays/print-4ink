"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { Payment } from "@/lib/schemas/invoice";
import { CreditCard } from "lucide-react";
import { money, toNumber, formatCurrency } from "@/lib/helpers/money";

interface PaymentLedgerProps {
  payments: Payment[];
  total: number;
}

function formatDate(dateString: string): string {
  const date = dateString.includes("T")
    ? new Date(dateString)
    : (() => {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
      })();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PaymentLedger({ payments, total }: PaymentLedgerProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-foreground">Payments</h3>
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
          <CreditCard className="size-12 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No payments recorded</p>
        </div>
      </div>
    );
  }

  // Sort by date ascending and precompute running totals
  const sorted = [...payments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const runningTotals: number[] = [];
  sorted.reduce((acc, payment) => {
    const next = acc.plus(money(payment.amount));
    runningTotals.push(toNumber(next));
    return next;
  }, money(0));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-base font-semibold text-foreground">Payments</h3>

      {/* Desktop table */}
      <div className="mt-4 hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Running Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((payment, index) => (
              <TableRow key={payment.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(payment.date)}
                </TableCell>
                <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.reference ?? "—"}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(runningTotals[index])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 space-y-3 sm:hidden">
        {sorted.map((payment) => (
          <div
            key={payment.id}
            className="rounded-md border border-border bg-surface p-3 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {formatDate(payment.date)}
              </span>
              <span className="text-sm font-mono font-medium text-foreground">
                {formatCurrency(payment.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{PAYMENT_METHOD_LABELS[payment.method]}</span>
              {payment.reference && <span>{payment.reference}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Total row */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-medium text-foreground">
          Total Paid
        </span>
        <span className="text-sm font-mono font-semibold text-foreground">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
