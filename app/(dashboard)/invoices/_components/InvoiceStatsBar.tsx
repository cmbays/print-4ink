import { invoices } from "@/lib/mock-data";
import { computeIsOverdue } from "@/lib/helpers/invoice-utils";
import { DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { money, toNumber, formatCurrencyCompact } from "@/lib/helpers/money";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeStats() {
  // 1. Total Outstanding — sum of balanceDue for sent + partial invoices
  const outstandingInvoices = invoices.filter(
    (inv) => inv.status === "sent" || inv.status === "partial",
  );
  const totalOutstanding = toNumber(
    outstandingInvoices.reduce(
      (sum, inv) => sum.plus(money(inv.balanceDue)),
      money(0),
    ),
  );

  // 2. Overdue — count and total of overdue invoices
  const overdueInvoices = invoices.filter((inv) => computeIsOverdue(inv));
  const overdueCount = overdueInvoices.length;
  const overdueTotal = toNumber(
    overdueInvoices.reduce(
      (sum, inv) => sum.plus(money(inv.balanceDue)),
      money(0),
    ),
  );

  // 3. Paid This Month — invoices with paidAt in current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = invoices.filter(
    (inv) => inv.paidAt && new Date(inv.paidAt) >= startOfMonth,
  );

  // 4. Avg Days to Pay — average days from sentAt to paidAt for paid invoices
  const paidInvoicesWithDates = invoices.filter(
    (inv) => inv.status === "paid" && inv.sentAt && inv.paidAt,
  );
  let avgDays = 0;
  if (paidInvoicesWithDates.length > 0) {
    const totalDays = paidInvoicesWithDates.reduce((sum, inv) => {
      const sent = new Date(inv.sentAt!).getTime();
      const paid = new Date(inv.paidAt!).getTime();
      return sum + Math.floor((paid - sent) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDays = Math.round(totalDays / paidInvoicesWithDates.length);
  }

  return { totalOutstanding, overdueCount, overdueTotal, paidThisMonth: paidThisMonth.length, avgDays };
}

// ---------------------------------------------------------------------------
// Stats config
// ---------------------------------------------------------------------------

const stats = [
  { key: "outstanding", label: "Total Outstanding", icon: DollarSign },
  { key: "overdue", label: "Overdue", icon: AlertCircle },
  { key: "paidThisMonth", label: "Paid This Month", icon: CheckCircle },
  { key: "avgDays", label: "Avg Days to Pay", icon: Clock },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceStatsBar() {
  const { totalOutstanding, overdueCount, overdueTotal, paidThisMonth, avgDays } = computeStats();

  const values: Record<(typeof stats)[number]["key"], string> = {
    outstanding: formatCurrencyCompact(totalOutstanding),
    overdue: `${overdueCount} (${formatCurrencyCompact(overdueTotal)})`,
    paidThisMonth: String(paidThisMonth),
    avgDays: `${avgDays}d`,
  };

  return (
    <section
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Invoice statistics overview"
    >
      {stats.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="rounded-lg border border-border bg-elevated p-4"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {values[key]}
          </p>
        </div>
      ))}
    </section>
  );
}
