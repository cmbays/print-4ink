"use client";

import Link from "next/link";
import { FileText, Package, Palette, MapPin, Calendar, Plus, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/features/StatusBadge";
import { ServiceTypeBadge } from "@/components/features/ServiceTypeBadge";
import { formatShortDate } from "@/lib/helpers/format";
import { MoneyAmount } from "@/components/features/MoneyAmount";
import { CARD_TYPE_BORDER_COLORS } from "@/lib/constants";
import type { QuoteCard } from "@/lib/schemas/board-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trimEnd() + "\u2026" : text;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuoteBoardCardProps {
  card: QuoteCard;
  onCreateJob?: () => void;
}

export function QuoteBoardCard({ card, onCreateJob }: QuoteBoardCardProps) {
  const isDone = card.lane === "done";
  const showCreateJob =
    isDone && card.quoteStatus === "accepted" && onCreateJob;

  const cardEl = (
    <div
      role="article"
      aria-label={`Quote for ${card.customerName}: ${truncate(card.description, 60)}`}
      className={cn(
        "group relative rounded-lg bg-elevated border border-border px-3 py-2",
        "border-l-2",
        CARD_TYPE_BORDER_COLORS.quote,
        "cursor-pointer select-none",
        "hover:-translate-y-0.5 hover:shadow-lg hover:bg-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-all duration-150",
      )}
    >
      {/* Header: customer name + status badge + service icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground truncate">
              {card.customerName}
            </p>
            {card.isNew && (
              <Badge
                variant="ghost"
                className="bg-success/10 text-success border border-success/20 text-xs px-1.5 py-0"
              >
                New
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {truncate(card.description, 60)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={card.quoteStatus} variant="quote" />
          {card.serviceType ? (
            <ServiceTypeBadge
              serviceType={card.serviceType}
              variant="icon-only"
            />
          ) : (
            <FileText className="size-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Metadata row: quantity left, due date + total right */}
      {(card.quantity != null || card.dueDate || card.total != null) && (
        <div className="mt-1 flex items-start justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            {card.quantity != null && (
              <span className="inline-flex items-center gap-0.5">
                <Package className="size-3" />
                {card.quantity.toLocaleString()}
              </span>
            )}
            {card.colorCount != null && card.colorCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Palette className="size-3" />
                {card.colorCount}
              </span>
            )}
            {card.locationCount != null && card.locationCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" />
                {card.locationCount}
              </span>
            )}
          </span>
          <div className="flex flex-col items-end gap-0.5">
            {card.dueDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                {formatShortDate(card.dueDate)}
              </span>
            )}
            {card.total != null && (
              <MoneyAmount value={card.total} format="compact" className="font-medium text-foreground" />
            )}
          </div>
        </div>
      )}

    </div>
  );

  const linked = (
    <div>
      <Link href={`/quotes/${card.quoteId}`} className="block">
        {cardEl}
      </Link>
      {showCreateJob && (
        <div className="mt-1">
          <Button
            variant="ghost"
            size="xs"
            className="text-action hover:text-action-hover"
            onClick={onCreateJob}
          >
            <Plus className="size-3" />
            Create Job
          </Button>
        </div>
      )}
    </div>
  );

  if (card.notes.length === 0) return linked;

  const internalNotes = card.notes.filter((n) => n.type === "internal");
  const customerNotes = card.notes.filter((n) => n.type === "customer");

  return (
    <Tooltip>
      <TooltipTrigger asChild>{linked}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-60 p-3">
        <div className="flex flex-col gap-2">
          {internalNotes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Internal
              </p>
              {internalNotes.map((note, i) => (
                <div key={`internal-${i}`} className="flex items-start gap-1.5 text-xs">
                  <MessageSquare className="size-3.5 shrink-0 mt-px text-muted-foreground" />
                  <span className="text-foreground">{note.content}</span>
                </div>
              ))}
            </div>
          )}
          {customerNotes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </p>
              {customerNotes.map((note, i) => (
                <div key={`customer-${i}`} className="flex items-start gap-1.5 text-xs">
                  <User className="size-3.5 shrink-0 mt-px text-action" />
                  <span className="text-foreground">{note.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
