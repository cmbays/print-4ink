import { Badge } from "@shared/ui/primitives/badge";
import { cn } from "@/lib/utils";
import { LIFECYCLE_STAGE_LABELS, LIFECYCLE_STAGE_COLORS } from "@domain/constants";
import type { LifecycleStage } from "@domain/entities/customer";

interface LifecycleBadgeProps {
  stage: LifecycleStage;
  className?: string;
}

export function LifecycleBadge({ stage, className }: LifecycleBadgeProps) {
  return (
    <Badge
      variant="ghost"
      className={cn(
        LIFECYCLE_STAGE_COLORS[stage],
        "transition-colors",
        className
      )}
      aria-label={`Lifecycle stage: ${LIFECYCLE_STAGE_LABELS[stage]}`}
    >
      {LIFECYCLE_STAGE_LABELS[stage]}
    </Badge>
  );
}
