"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DraggableCardProps {
  /** Unique drag ID for dnd-kit (e.g. "job:uuid" or "quote:uuid") */
  dragId: string;
  /** Data attached to the draggable, accessible in drag events */
  data: Record<string, unknown>;
  children: React.ReactNode;
}

export function DraggableCard({ dragId, data, children }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "relative",
        "cursor-grab active:cursor-grabbing",
        "transition-[transform,opacity] duration-200",
        isDragging
          ? "opacity-30 scale-[1.03] rotate-1 shadow-xl"
          : "active:scale-[0.98]",
      )}
      style={{
        transitionTimingFunction: isDragging
          ? "cubic-bezier(0.34, 1.56, 0.64, 1)"
          : undefined,
      }}
    >
      {children}
    </div>
  );
}
