import { Zap, Package, AlertTriangle } from "lucide-react";
import { cn } from "@shared/lib/cn";
import type { CapacitySummary as CapacitySummaryType } from "@domain/rules/job.rules";

interface CapacitySummaryProps {
  summary: CapacitySummaryType;
  variant?: "compact" | "full";
  className?: string;
}

export function CapacitySummary({
  summary,
  variant = "compact",
  className,
}: CapacitySummaryProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">
          {summary.totalQuantity.toLocaleString()}
        </span>
      </div>
      {summary.rushQuantity > 0 && (
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-error" />
          <span className="text-error">
            {summary.rushQuantity.toLocaleString()} rush
          </span>
        </div>
      )}
      {variant === "full" && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {summary.cardsByLane.blocked ?? 0} blocked
          </span>
        </div>
      )}
    </div>
  );
}
