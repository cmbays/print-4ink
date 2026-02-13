"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
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
      className={cn(
        "relative group/drag",
        isDragging && "opacity-30",
      )}
    >
      {/* Drag handle — visible on hover */}
      <button
        {...listeners}
        {...attributes}
        className={cn(
          "absolute -left-1 top-1/2 -translate-y-1/2 z-10",
          "flex items-center justify-center rounded-sm p-0.5",
          "text-muted-foreground/0 group-hover/drag:text-muted-foreground",
          "hover:text-foreground hover:bg-surface",
          "cursor-grab active:cursor-grabbing",
          "transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label="Drag to move"
      >
        <GripVertical className="size-3.5" />
      </button>

      {children}
    </div>
  );
}
