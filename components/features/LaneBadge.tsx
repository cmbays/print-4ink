import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LANE_BADGE_COLORS, LANE_LABELS } from "@/lib/constants";
import type { Lane } from "@/lib/schemas/job";

export interface LaneBadgeProps {
  lane: Lane;
  className?: string;
}

export function LaneBadge({ lane, className }: LaneBadgeProps) {
  return (
    <Badge
      variant="ghost"
      className={cn(LANE_BADGE_COLORS[lane], "transition-colors", className)}
      aria-label={`Lane: ${LANE_LABELS[lane]}`}
    >
      {LANE_LABELS[lane]}
    </Badge>
  );
}
