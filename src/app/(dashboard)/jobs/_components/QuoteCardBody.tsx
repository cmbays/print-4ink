import { Package, Palette, MapPin, Calendar } from "lucide-react";
import { ENTITY_ICONS } from "@/lib/constants/entity-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@shared/ui/primitives/badge";
import { StatusBadge } from "@/components/features/StatusBadge";
import { ServiceTypeBadge } from "@/components/features/ServiceTypeBadge";
import { formatShortDate } from "@/lib/helpers/format";
import { MoneyAmount } from "@/components/features/MoneyAmount";
import { CARD_TYPE_BORDER_COLORS } from "@domain/constants";
import type { QuoteCard } from "@domain/entities/board-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trimEnd() + "\u2026" : text;
}

/** Shared container classes for quote cards (desktop & mobile). */
export function quoteCardContainerClass(className?: string) {
  return cn(
    "group relative rounded-lg bg-elevated border border-border px-3 py-2",
    "border-l-2",
    CARD_TYPE_BORDER_COLORS.quote,
    "cursor-pointer select-none",
    "hover:-translate-y-0.5 hover:shadow-lg hover:bg-surface",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "transition-all duration-150",
    className,
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuoteCardBodyProps {
  card: QuoteCard;
}

/**
 * Shared visual content for quote board cards.
 * Used by both desktop QuoteBoardCard and mobile MobileQuoteCard.
 * Desktop is the source of truth — changes here update both views.
 */
export function QuoteCardBody({ card }: QuoteCardBodyProps) {
  return (
    <>
      {/* Header: customer name + "New" badge + status + service icon */}
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
            <ENTITY_ICONS.quote className="size-4 text-muted-foreground" />
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
    </>
  );
}
