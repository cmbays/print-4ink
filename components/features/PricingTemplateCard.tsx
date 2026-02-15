"use client";

import { cn } from "@/lib/utils";
import type { MarginIndicator as MarginIndicatorType } from "@/lib/schemas/price-matrix";
import { MarginIndicator } from "./MarginIndicator";
import { ServiceTypeBadge } from "./ServiceTypeBadge";
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
import { formatRelativeTime } from "@/lib/helpers/format";

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
  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:border-border/80 hover:bg-card/80",
        "group relative",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
    >
      <CardHeader className="gap-1.5">
        <div className="flex flex-col gap-1">
          {/* Title row: health dot + title */}
          <div className="flex min-w-0 items-center gap-2">
            <MarginIndicator
              percentage={healthPercentage}
              indicator={healthIndicator}
              size="md"
            />
            <CardTitle className="truncate text-sm">{template.name}</CardTitle>
          </div>

          {/* Badges row — wraps below title on narrow screens */}
          {(template.isDefault || template.isIndustryDefault) && (
            <div className="flex flex-wrap items-center gap-1.5 pl-5">
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
          )}
        </div>

        {/* Action menu — always visible on mobile (no hover), hover-to-show on desktop */}
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center justify-center rounded-md p-1",
                "text-muted-foreground hover:text-foreground hover:bg-surface",
                "md:opacity-0 transition-opacity md:group-hover:opacity-100",
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
          <ServiceTypeBadge
            serviceType={template.serviceType}
            variant="badge"
            className="text-[10px] px-1.5 py-0"
          />
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
