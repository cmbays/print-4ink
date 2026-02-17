import { Badge } from "@shared/ui/primitives/badge";
import { cn } from "@/lib/utils";
import type { QuoteStatus } from "@domain/entities/quote";
import type { InvoiceStatus } from "@domain/entities/invoice";
import {
  INVOICE_STATUS_BADGE_COLORS,
  INVOICE_STATUS_LABELS,
  QUOTE_STATUS_BADGE_COLORS,
  QUOTE_STATUS_LABELS,
} from "@domain/constants";

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
      : QUOTE_STATUS_BADGE_COLORS[status as QuoteStatus];

  const label =
    variant === "invoice"
      ? INVOICE_STATUS_LABELS[status as InvoiceStatus]
      : QUOTE_STATUS_LABELS[status as QuoteStatus];

  return (
    <Badge
      variant="ghost"
      className={cn(styles, className)}
    >
      {label}
    </Badge>
  );
}
