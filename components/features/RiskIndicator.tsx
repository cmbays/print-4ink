import { cn } from "@/lib/utils";
import { RISK_COLORS, RISK_LABELS } from "@domain/constants";
import type { RiskLevel } from "@domain/entities/job";

export interface RiskIndicatorProps {
  riskLevel: RiskLevel;
  showLabel?: boolean;
  className?: string;
}

export function RiskIndicator({
  riskLevel,
  showLabel = false,
  className,
}: RiskIndicatorProps) {
  // on_track = hidden (no indicator needed)
  if (riskLevel === "on_track") {
    return null;
  }

  const colorClass = RISK_COLORS[riskLevel];
  const label = RISK_LABELS[riskLevel];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={label}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          riskLevel === "at_risk" ? "bg-error" : "bg-warning"
        )}
      />
      {showLabel && (
        <span className={cn("text-xs font-medium", colorClass)}>
          {label}
        </span>
      )}
    </span>
  );
}
