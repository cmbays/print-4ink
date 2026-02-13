"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BoardLane } from "./BoardLane";
import type { Lane } from "@/lib/schemas/job";
import type { BoardCard } from "@/lib/schemas/board-card";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANE_ORDER: Lane[] = ["ready", "in_progress", "review", "blocked", "done"];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BoardSectionProps {
  label: string;
  section: "quotes" | "jobs" | "combined";
  cards: BoardCard[];
  renderCard: (card: BoardCard) => React.ReactNode;
  onAddScratchNote?: () => void;
  /** Footer rendered inside the Ready lane (e.g. ScratchNoteCapture) */
  readyLaneFooter?: React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardSection({
  label,
  section,
  cards,
  renderCard,
  onAddScratchNote,
  readyLaneFooter,
  className,
}: BoardSectionProps) {
  // Bucket cards by lane
  const cardsByLane = useMemo(() => {
    const buckets: Record<Lane, BoardCard[]> = {
      ready: [],
      in_progress: [],
      review: [],
      blocked: [],
      done: [],
    };
    for (const card of cards) {
      buckets[card.lane].push(card);
    }
    return buckets;
  }, [cards]);

  return (
    <section className={cn("space-y-2", className)}>
      {/* Section label */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {label}
      </h2>

      {/* Lane columns */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {LANE_ORDER.map((lane) => (
          <BoardLane
            key={lane}
            lane={lane}
            section={section}
            cards={cardsByLane[lane]}
            renderCard={renderCard}
            onAddScratchNote={lane === "ready" ? onAddScratchNote : undefined}
            footer={lane === "ready" ? readyLaneFooter : undefined}
          />
        ))}
      </div>
    </section>
  );
}
