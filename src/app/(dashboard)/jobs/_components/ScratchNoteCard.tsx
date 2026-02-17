"use client";

import { useState, useRef, useEffect } from "react";
import { StickyNote, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CARD_TYPE_BORDER_COLORS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/helpers/format";
import type { ScratchNoteCard as ScratchNoteCardType } from "@/lib/schemas/board-card";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ScratchNoteCardProps {
  card: ScratchNoteCardType;
  onCreateQuote?: () => void;
  onDismiss?: () => void;
  onEdit?: (id: string, newContent: string) => void;
}

export function ScratchNoteCard({
  card,
  onCreateQuote,
  onDismiss,
  onEdit,
}: ScratchNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  function startEditing() {
    if (!onEdit) return;
    setEditValue(card.content);
    setIsEditing(true);
  }

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== card.content && onEdit) {
      onEdit(card.id, trimmed);
    }
    setIsEditing(false);
  }

  function cancelEdit() {
    setEditValue(card.content);
    setIsEditing(false);
  }

  return (
    <div
      role="article"
      tabIndex={!isEditing && onEdit ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isEditing && onEdit && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          startEditing();
        }
      }}
      aria-label={`Scratch note: ${card.content.slice(0, 50)}`}
      className={cn(
        "group relative rounded-lg bg-elevated border border-border p-3",
        "border-l-2",
        CARD_TYPE_BORDER_COLORS.scratch_note,
        "transition-all duration-150",
        !isEditing && onEdit && "cursor-pointer hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      onClick={!isEditing ? startEditing : undefined}
    >
      {/* Header: icon + dismiss */}
      <div className="flex items-start justify-between gap-2">
        <StickyNote className="size-4 shrink-0 text-magenta" />
        <div className="flex items-center gap-1">
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-success hover:text-success-hover"
                onClick={(e) => {
                  e.stopPropagation();
                  commitEdit();
                }}
                aria-label="Save edit"
              >
                <Check className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-error"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEdit();
                }}
                aria-label="Cancel edit"
              >
                <X className="size-3" />
              </Button>
            </>
          )}
          {!isEditing && onDismiss && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-error"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              aria-label="Dismiss note"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Content: display or edit mode */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") {
              cancelEdit();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "mt-1.5 w-full resize-none rounded-md bg-surface border border-border p-2",
            "text-sm text-foreground leading-relaxed",
            "focus:outline-none focus:ring-1 focus:ring-action",
          )}
          rows={3}
        />
      ) : (
        <p className="mt-1.5 text-sm text-foreground leading-relaxed line-clamp-3">
          {card.content}
        </p>
      )}

      {/* Footer: relative time + create quote action */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(card.createdAt)}
        </span>
        {onCreateQuote && (
          <Button
            size="xs"
            className="gap-1 bg-action/10 text-action border border-action/20 hover:bg-action/20"
            onClick={(e) => {
              e.stopPropagation();
              onCreateQuote();
            }}
          >
            <Plus className="size-3" />
            Create Quote
          </Button>
        )}
      </div>
    </div>
  );
}
