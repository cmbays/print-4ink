"use client";

import { cn } from "@/lib/utils";
import type { MarginIndicator as MarginIndicatorType } from "@/lib/schemas/price-matrix";
import { MarginIndicator } from "./MarginIndicator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  Trash2,
  Star,
  MoreHorizontal,
  Clock,
  Pencil,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PricingTemplateCardProps {
  template: {
    id: string;
    name: string;
    serviceType: "screen-print" | "dtf";
    pricingTier: string;
    isDefault: boolean;
    isIndustryDefault: boolean;
    updatedAt: string;
  };
  healthIndicator: MarginIndicatorType;
  healthPercentage?: number;
  customersUsing: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return "1 day ago";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek === 1) return "1 week ago";
  if (diffWeek < 5) return `${diffWeek} weeks ago`;
  if (diffMonth === 1) return "1 month ago";
  return `${diffMonth} months ago`;
}

const serviceTypeConfig = {
  "screen-print": { label: "Screen Print", colorClass: "text-action" },
  dtf: { label: "DTF", colorClass: "text-warning" },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingTemplateCard({
  template,
  healthIndicator,
  healthPercentage = 0,
  customersUsing,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: PricingTemplateCardProps) {
  const serviceConfig = serviceTypeConfig[template.serviceType];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-border/80 hover:bg-card/80",
        "group relative"
      )}
      onClick={onEdit}
    >
      <CardHeader className="gap-1.5">
        <div className="flex items-start gap-2">
          {/* Title + health dot */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <MarginIndicator
              percentage={healthPercentage}
              indicator={healthIndicator}
              size="md"
            />
            <CardTitle className="truncate text-sm">{template.name}</CardTitle>
          </div>

          {/* Badges row */}
          <div className="flex shrink-0 items-center gap-1.5">
            {template.isDefault && (
              <Badge
                variant="outline"
                className="border-success/30 bg-success/10 text-success text-[10px] px-1.5 py-0"
              >
                Default
              </Badge>
            )}
            {template.isIndustryDefault && (
              <Badge
                variant="outline"
                className="border-muted-foreground/30 bg-muted/50 text-muted-foreground text-[10px] px-1.5 py-0"
              >
                Industry Template
              </Badge>
            )}
          </div>
        </div>

        {/* Action menu */}
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center justify-center rounded-md p-1",
                "text-muted-foreground hover:text-foreground hover:bg-surface",
                "opacity-0 transition-opacity group-hover:opacity-100",
                "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              onClick={(e) => e.stopPropagation()}
              aria-label="Template actions"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              {!template.isDefault && (
                <DropdownMenuItem onClick={onSetDefault}>
                  <Star className="size-4" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pt-0">
        {/* Service type + pricing tier badges */}
        <div className="flex items-center gap-2">
          <Badge
            variant="ghost"
            className={cn(
              "text-[10px] px-1.5 py-0",
              serviceConfig.colorClass
            )}
          >
            {serviceConfig.label}
          </Badge>
          <Badge
            variant="ghost"
            className="text-muted-foreground text-[10px] px-1.5 py-0"
          >
            {template.pricingTier}
          </Badge>
        </div>

        {/* Meta row: customers + updated */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {customersUsing} customer{customersUsing !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatRelativeTime(template.updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
