import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteStatus } from "@/lib/schemas/quote";
import type { InvoiceStatus } from "@/lib/schemas/invoice";
import { INVOICE_STATUS_BADGE_COLORS, INVOICE_STATUS_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Quote status maps (original)
// ---------------------------------------------------------------------------

const quoteStatusStyles: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-action/10 text-action border border-action/20",
  accepted: "bg-success/10 text-success border border-success/20",
  declined: "bg-error/10 text-error border border-error/20",
  revised: "bg-warning/10 text-warning border border-warning/20",
};

const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  revised: "Revised",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: QuoteStatus | InvoiceStatus;
  variant?: "quote" | "invoice";
  className?: string;
}

export function StatusBadge({ status, variant = "quote", className }: StatusBadgeProps) {
  const styles =
    variant === "invoice"
      ? INVOICE_STATUS_BADGE_COLORS[status as InvoiceStatus]
      : quoteStatusStyles[status as QuoteStatus];

  const label =
    variant === "invoice"
      ? INVOICE_STATUS_LABELS[status as InvoiceStatus]
      : quoteStatusLabels[status as QuoteStatus];

  return (
    <Badge
      variant="ghost"
      className={cn(styles, className)}
    >
      {label}
    </Badge>
  );
}
