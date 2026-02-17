import { Badge } from "@shared/ui/primitives/badge";
import { cn } from "@shared/lib/cn";
import { HEALTH_STATUS_LABELS, HEALTH_STATUS_COLORS } from "@domain/constants";
import type { HealthStatus } from "@domain/entities/customer";

interface HealthBadgeProps {
  status: HealthStatus;
  className?: string;
}

export function HealthBadge({ status, className }: HealthBadgeProps) {
  // Active = healthy, no indicator needed
  if (status === "active") return null;

  return (
    <Badge
      variant="ghost"
      className={cn(
        HEALTH_STATUS_COLORS[status],
        "transition-colors",
        className
      )}
      aria-label={`Health status: ${HEALTH_STATUS_LABELS[status]}`}
    >
      {HEALTH_STATUS_LABELS[status]}
    </Badge>
  );
}
