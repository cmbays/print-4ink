import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuoteStatus } from "@/lib/schemas/quote";

interface StatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

const statusStyles: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-action/10 text-action border border-action/20",
  accepted: "bg-success/10 text-success border border-success/20",
  declined: "bg-error/10 text-error border border-error/20",
  revised: "bg-warning/10 text-warning border border-warning/20",
};

const statusLabels: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  revised: "Revised",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="ghost"
      className={cn(statusStyles[status], className)}
    >
      {statusLabels[status]}
    </Badge>
  );
}
