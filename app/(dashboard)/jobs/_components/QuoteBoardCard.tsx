"use client";

import Link from "next/link";
import { FileText, Package, Calendar, DollarSign, Plus, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/features/StatusBadge";
import { formatShortDate } from "@/lib/helpers/format";
import { formatCurrencyCompact } from "@/lib/helpers/money";
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_LEFT_BORDER_COLORS,
} from "@/lib/constants";
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
  onMoveLane?: () => void;
}

export function QuoteBoardCard({ card, onCreateJob, onMoveLane }: QuoteBoardCardProps) {
  const isDone = card.lane === "done";
  const showCreateJob =
    isDone && card.quoteStatus === "accepted" && onCreateJob;

  return (
    <Link href={`/quotes/${card.quoteId}`} className="block">
      <div
        role="article"
        aria-label={`Quote for ${card.customerName}: ${truncate(card.description, 60)}`}
        className={cn(
          "group relative rounded-lg bg-elevated border border-border p-3",
          card.serviceType && "border-l-4",
          card.serviceType &&
            SERVICE_TYPE_LEFT_BORDER_COLORS[card.serviceType],
          "cursor-pointer select-none",
          "hover:-translate-y-0.5 hover:shadow-lg hover:bg-surface",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "transition-all duration-150",
        )}
      >
        {/* Header: customer name + icon + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground truncate">
                {card.customerName}
              </p>
              {card.isNew && (
                <Badge
                  variant="ghost"
                  className="bg-success/10 text-success border border-success/20 text-[10px] px-1.5 py-0"
                >
                  New
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {truncate(card.description, 60)}
            </p>
          </div>
          <FileText className="size-4 shrink-0 text-muted-foreground" />
        </div>

        {/* Status badge */}
        <div className="mt-2">
          <StatusBadge status={card.quoteStatus} variant="quote" />
        </div>

        {/* Metadata row: service type, quantity, due date, total */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {card.serviceType && (
            <span>{SERVICE_TYPE_LABELS[card.serviceType]}</span>
          )}
          {card.quantity != null && (
            <span className="inline-flex items-center gap-1">
              <Package className="size-3" />
              {card.quantity.toLocaleString()}
            </span>
          )}
          {card.dueDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {formatShortDate(card.dueDate)}
            </span>
          )}
          {card.total != null && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <DollarSign className="size-3" />
              {formatCurrencyCompact(card.total)}
            </span>
          )}
        </div>

        {/* Quick action: Move Lane */}
        {onMoveLane && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-action"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveLane();
              }}
            >
              <ArrowRightLeft className="size-3" />
              Move Lane
            </Button>
          </div>
        )}

        {/* Create Job action (accepted quotes in Done lane) */}
        {showCreateJob && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="xs"
              className="text-action hover:text-action-hover"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCreateJob();
              }}
            >
              <Plus className="size-3" />
              Create Job
            </Button>
          </div>
        )}
      </div>
    </Link>
  );
}
