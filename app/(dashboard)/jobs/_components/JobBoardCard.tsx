"use client";

import Link from "next/link";
import { Package, Palette, MapPin, Calendar, Zap, Circle, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceTypeBadge } from "@/components/features/ServiceTypeBadge";
import { GarmentMockupThumbnail } from "@/components/features/mockup";
import { RISK_COLORS } from "@/lib/constants";
import { TaskProgressBar } from "@/components/features/TaskProgressBar";
import { formatShortDate } from "@/lib/helpers/format";
import { MoneyAmount } from "@/components/features/MoneyAmount";
import {
  CARD_TYPE_BORDER_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_BADGE_COLORS,
} from "@/lib/constants";
import type { JobCard } from "@/lib/schemas/board-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip leading customer name from title to avoid duplication on card */
function deduplicateTitle(title: string, customerName: string): string {
  // Match patterns like "Customer Name — Title" or "Customer Name - Title"
  const separators = [" — ", " – ", " - "];
  for (const sep of separators) {
    if (title.startsWith(customerName + sep)) {
      return title.slice(customerName.length + sep.length);
    }
  }
  return title;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface JobBoardCardProps {
  card: JobCard;
}

export function JobBoardCard({ card }: JobBoardCardProps) {
  const isBlocked = !!card.blockReason;
  const isRush = card.priority === "rush";
  const isDone = card.lane === "done";

  const cardEl = (
    <div
      role="article"
      aria-label={`Job ${card.jobNumber}: ${card.customerName} — ${card.title}`}
      className={cn(
        "group relative rounded-lg bg-elevated border border-border px-3 py-2",
        "border-l-2",
        CARD_TYPE_BORDER_COLORS.job,
        "cursor-pointer select-none",
        "hover:-translate-y-0.5 hover:shadow-lg hover:bg-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-all duration-150",
        isBlocked && "opacity-60",
      )}
    >
      {/* Header: mockup + customer name + assignee initials + service icon */}
      <div className="flex items-start justify-between gap-2">
        {card.garmentCategory && card.garmentColorHex && (
          <GarmentMockupThumbnail
            garmentCategory={card.garmentCategory}
            colorHex={card.garmentColorHex}
            artworkPlacements={card.primaryArtworkUrl ? [{
              artworkUrl: card.primaryArtworkUrl,
              position: "front-chest",
            }] : []}
            className="shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {card.customerName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {deduplicateTitle(card.title, card.customerName)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {card.assigneeInitials && (
            <div
              className="flex size-6 items-center justify-center rounded-full bg-surface text-xs font-medium text-foreground"
              aria-label={`Assigned to ${card.assigneeInitials}`}
            >
              {card.assigneeInitials}
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            <ServiceTypeBadge
              serviceType={card.serviceType}
              variant="icon-only"
            />
            {isRush && (
              <Zap className="size-3.5 text-error" aria-label="Rush order" />
            )}
          </div>
        </div>
      </div>

      {/* Metadata row: qty/colors/locations + progress left, date + revenue right */}
      <div className="mt-1 flex items-start justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5">
              <Package className="size-3" />
              {card.quantity.toLocaleString()}
            </span>
            {card.colorCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Palette className="size-3" />
                {card.colorCount}
              </span>
            )}
            {card.locationCount > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" />
                {card.locationCount}
              </span>
            )}
          </span>
          <TaskProgressBar
            completed={card.taskProgress.completed}
            total={card.taskProgress.total}
          />
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className={cn("inline-flex items-center gap-1", RISK_COLORS[card.riskLevel])}>
            <Calendar className="size-3" />
            {formatShortDate(card.dueDate)}
          </span>
          <MoneyAmount value={card.orderTotal} format="compact" className="font-medium text-foreground" />
        </div>
      </div>

      {/* Payment status badge (Done lane only) */}
      {isDone && card.invoiceStatus && (
        <div className="mt-1">
          <Badge
            variant="ghost"
            className={cn(
              "text-xs",
              INVOICE_STATUS_BADGE_COLORS[card.invoiceStatus],
            )}
          >
            {INVOICE_STATUS_LABELS[card.invoiceStatus]}
          </Badge>
        </div>
      )}
    </div>
  );

  const linked = (
    <Link href={`/jobs/${card.id}`} className="block">
      {cardEl}
    </Link>
  );

  const hasTooltip = card.tasks.length > 0 || isBlocked;

  if (!hasTooltip) return linked;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{linked}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-60 p-3">
        <div className="flex flex-col gap-2">
          {isBlocked && (
            <p className="text-xs font-medium text-error">
              Blocked: {card.blockReason}
            </p>
          )}
          {card.tasks.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Progress
              </p>
              {card.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  {task.isCompleted ? (
                    <CircleCheck className="size-3.5 shrink-0 mt-px text-success" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 mt-px text-muted-foreground" />
                  )}
                  <span className={task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
