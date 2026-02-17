"use client";

import Link from "next/link";
import { User, ExternalLink } from "lucide-react";
import { ENTITY_STYLES } from "@domain/constants/entities";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_BADGE_COLORS } from "@domain/constants";
import type { Job } from "@domain/entities/job";
import type { InvoiceStatus } from "@domain/entities/invoice";

interface LinkedEntitiesSectionProps {
  job: Job;
  customerName: string;
  quoteTotal?: number;
  invoiceStatus?: InvoiceStatus;
}

export function LinkedEntitiesSection({
  job,
  customerName,
  quoteTotal,
  invoiceStatus,
}: LinkedEntitiesSectionProps) {
  const hasLinks = job.sourceQuoteId || job.invoiceId || job.customerId;
  if (!hasLinks) return null;

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Linked Entities
        </h2>
      </div>

      <div className="divide-y divide-border/30">
        {/* Customer */}
        <EntityRow
          icon={User}
          label="Customer"
          href={`/customers/${job.customerId}`}
          value={customerName}
        />

        {/* Source Quote */}
        {job.sourceQuoteId && (
          <EntityRow
            icon={ENTITY_STYLES.quote.icon}
            label="Quote"
            href={`/quotes/${job.sourceQuoteId}`}
            value="Source Quote"
            badge={
              quoteTotal != null ? (
                <span className="text-xs font-medium text-foreground tabular-nums">
                  ${quoteTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              ) : undefined
            }
          />
        )}

        {/* Invoice */}
        {job.invoiceId && (
          <EntityRow
            icon={ENTITY_STYLES.invoice.icon}
            label="Invoice"
            href={`/invoices/${job.invoiceId}`}
            value="Invoice"
            badge={
              invoiceStatus ? (
                <Badge
                  variant="ghost"
                  className={cn(
                    "text-xs",
                    INVOICE_STATUS_BADGE_COLORS[invoiceStatus]
                  )}
                >
                  {INVOICE_STATUS_LABELS[invoiceStatus]}
                </Badge>
              ) : undefined
            }
          />
        )}
      </div>
    </section>
  );
}

function EntityRow({
  icon: Icon,
  label,
  href,
  value,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:ring-inset"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
