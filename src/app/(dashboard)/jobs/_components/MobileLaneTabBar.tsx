"use client";

import { cn } from "@shared/lib/cn";
import { LANE_LABELS } from "@domain/constants";
import type { Lane } from "@domain/entities/job";

interface MobileLaneTabBarProps {
  lanes: Lane[];
  activeLane: Lane;
  onLaneChange: (lane: Lane) => void;
  cardCounts: Record<string, number>;
}

export function MobileLaneTabBar({
  lanes,
  activeLane,
  onLaneChange,
  cardCounts,
}: MobileLaneTabBarProps) {
  return (
    <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-border bg-background px-1 pb-px scrollbar-none" role="tablist" aria-label="Board lanes">
      {lanes.map((lane) => (
        <button
          key={lane}
          role="tab"
          aria-selected={activeLane === lane}
          onClick={() => onLaneChange(lane)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
            "border-b-2 min-h-(--mobile-touch-target)",
            activeLane === lane
              ? "border-action text-action"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {LANE_LABELS[lane] ?? lane}
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs",
              activeLane === lane
                ? "bg-action/20 text-action"
                : "bg-surface text-muted-foreground"
            )}
          >
            {cardCounts[lane] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
