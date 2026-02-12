"use client";

import Link from "next/link";
import { Package, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceTypeBadge } from "@/components/features/ServiceTypeBadge";
import { RiskIndicator } from "@/components/features/RiskIndicator";
import { TaskProgressBar } from "@/components/features/TaskProgressBar";
import { formatShortDate } from "@/lib/helpers/format";
import {
  SERVICE_TYPE_LEFT_BORDER_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_BADGE_COLORS,
} from "@/lib/constants";
import type { JobCard } from "@/lib/schemas/board-card";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface JobBoardCardProps {
  card: JobCard;
  onClick?: () => void;
}

export function JobBoardCard({ card, onClick }: JobBoardCardProps) {
  const isBlocked = !!card.blockReason;
  const isRush = card.priority === "rush";
  const isDone = card.lane === "done";
  const leftBorder = SERVICE_TYPE_LEFT_BORDER_COLORS[card.serviceType];

  const cardEl = (
    <div
      role="article"
      aria-label={`Job ${card.jobNumber}: ${card.customerName} — ${card.title}`}
      className={cn(
        "group relative rounded-lg bg-elevated border border-border p-3 border-l-4",
        leftBorder,
        "cursor-pointer select-none",
        "hover:-translate-y-0.5 hover:shadow-lg hover:bg-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-all duration-150",
        isRush && "border-t-2 border-t-error",
        isBlocked && "opacity-60",
      )}
    >
      {/* Header: customer name + assignee initials + service icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {card.customerName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{card.title}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {card.assigneeInitials && (
            <div
              className="flex size-6 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-foreground"
              aria-label={`Assigned to ${card.assigneeInitials}`}
            >
              {card.assigneeInitials}
            </div>
          )}
          <ServiceTypeBadge
            serviceType={card.serviceType}
            variant="icon-only"
            className="text-muted-foreground"
          />
        </div>
      </div>

      {/* Job number */}
      <p className="mt-1 text-xs font-mono text-muted-foreground">
        {card.jobNumber}
      </p>

      {/* Metadata row: quantity, complexity, due date, risk */}
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Package className="size-3" />
          {card.quantity.toLocaleString()}
          {card.locationCount > 0 && (
            <span className="text-muted-foreground">
              &middot; {card.locationCount} loc
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3" />
          {formatShortDate(card.dueDate)}
        </span>
        <RiskIndicator riskLevel={card.riskLevel} />
      </div>

      {/* Bottom: task progress */}
      <div className="mt-2">
        <TaskProgressBar
          completed={card.taskProgress.completed}
          total={card.taskProgress.total}
        />
      </div>

      {/* Payment status badge (Done lane only) */}
      {isDone && card.invoiceStatus && (
        <div className="mt-2">
          <Badge
            variant="ghost"
            className={cn(
              "text-[10px]",
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
    <Link href={`/jobs/${card.id}`} className="block" onClick={onClick}>
      {cardEl}
    </Link>
  );

  if (isBlocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linked}</TooltipTrigger>
        <TooltipContent>{card.blockReason}</TooltipContent>
      </Tooltip>
    );
  }

  return linked;
}
