import { Zap, Package, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANE_LABELS, LANE_COLORS } from "@/lib/constants";
import type { CapacitySummary } from "@/lib/helpers/job-utils";
import type { Lane } from "@/lib/schemas/job";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CapacitySummaryBarProps {
  summary: CapacitySummary;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const ACTIVE_LANES: Lane[] = ["ready", "in_progress", "review", "blocked"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CapacitySummaryBar({ summary }: CapacitySummaryBarProps) {
  const { rushQuantity, totalQuantity, cardsByLane } = summary;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg bg-elevated border border-border/50 px-4 py-2.5">
      {/* Rush orders */}
      {rushQuantity > 0 && (
        <div className="flex items-center gap-1.5">
          <Zap className="size-3.5 text-error" />
          <span className="text-xs font-medium text-error">
            {rushQuantity.toLocaleString()} rush
          </span>
        </div>
      )}

      {/* Total quantity */}
      <div className="flex items-center gap-1.5">
        <Package className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {totalQuantity.toLocaleString()}
        </span>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-border/50" />

      {/* Cards by lane (active lanes only — Done excluded from summary) */}
      <div className="flex items-center gap-3">
        <Layers className="size-3.5 text-muted-foreground" />
        {ACTIVE_LANES.map((lane) => (
          <div key={lane} className="flex items-center gap-1">
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                LANE_COLORS[lane],
              )}
            >
              {LANE_LABELS[lane]}
            </span>
            <span className="text-xs font-medium text-foreground">
              {cardsByLane[lane]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
