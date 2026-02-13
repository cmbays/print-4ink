"use client";

import { StickyNote, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ScratchNoteCard as ScratchNoteCardType } from "@/lib/schemas/board-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ScratchNoteCardProps {
  card: ScratchNoteCardType;
  onCreateQuote?: () => void;
  onDismiss?: () => void;
}

export function ScratchNoteCard({
  card,
  onCreateQuote,
  onDismiss,
}: ScratchNoteCardProps) {
  return (
    <div
      role="article"
      aria-label={`Scratch note: ${card.content.slice(0, 50)}`}
      className={cn(
        "group relative rounded-lg bg-elevated/60 border border-dashed border-border p-3",
        "select-none",
        "transition-all duration-150",
      )}
    >
      {/* Header: icon + dismiss */}
      <div className="flex items-start justify-between gap-2">
        <StickyNote className="size-4 shrink-0 text-warning/60" />
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-error"
            onClick={onDismiss}
            aria-label="Dismiss note"
          >
            <X className="size-3" />
          </Button>
        )}
      </div>

      {/* Content */}
      <p className="mt-1.5 text-sm text-foreground leading-relaxed line-clamp-3">
        {card.content}
      </p>

      {/* Footer: relative time + create quote action */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(card.createdAt)}
        </span>
        {onCreateQuote && (
          <Button
            variant="ghost"
            size="xs"
            className="text-action hover:text-action-hover"
            onClick={onCreateQuote}
          >
            <Plus className="size-3" />
            Create Quote
          </Button>
        )}
      </div>
    </div>
  );
}
