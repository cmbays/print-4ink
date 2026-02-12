"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANE_LABELS, LANE_COLORS } from "@/lib/constants";
import type { Lane } from "@/lib/schemas/job";
import type { BoardCard } from "@/lib/schemas/board-card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BoardLaneProps {
  lane: Lane;
  cards: BoardCard[];
  renderCard: (card: BoardCard) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardLane({ lane, cards, renderCard }: BoardLaneProps) {
  const isDone = lane === "done";
  const [collapsed, setCollapsed] = useState(isDone);
  const count = cards.length;

  return (
    <div
      className={cn(
        "flex min-w-[200px] flex-1 flex-col rounded-lg",
        "bg-background border border-border/50",
      )}
    >
      {/* Lane header */}
      <button
        type="button"
        onClick={isDone ? () => setCollapsed((prev) => !prev) : undefined}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2",
          "rounded-t-lg border-b border-border/50",
          isDone && "hover:bg-surface/50 cursor-pointer",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        )}
        aria-expanded={isDone ? !collapsed : undefined}
        aria-label={`${LANE_LABELS[lane]} lane, ${count} card${count !== 1 ? "s" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              LANE_COLORS[lane],
            )}
          >
            {LANE_LABELS[lane]}
          </span>
          <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        </div>
        {isDone &&
          (collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ))}
      </button>

      {/* Card list */}
      {!collapsed && (
        <div className="flex flex-col gap-2 p-2">
          {count === 0 ? (
            <div className="flex items-center justify-center rounded-md border border-dashed border-border/50 py-8 text-xs text-muted-foreground">
              No cards
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.type === "quote" ? card.quoteId : card.id}>
                {renderCard(card)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Collapsed Done lane summary */}
      {collapsed && count > 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {count} completed card{count !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
