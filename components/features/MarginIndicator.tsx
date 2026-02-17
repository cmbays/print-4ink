"use client";

import { cn } from "@/lib/utils";
import type { MarginIndicator as MarginIndicatorType } from "@domain/entities/price-matrix";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/primitives/tooltip";

interface MarginIndicatorProps {
  percentage: number;
  indicator: MarginIndicatorType;
  size?: "sm" | "md";
}

const dotColors: Record<MarginIndicatorType, string> = {
  healthy: "bg-success",
  caution: "bg-warning",
  unprofitable: "bg-error",
};

const indicatorLabels: Record<MarginIndicatorType, string> = {
  healthy: "Healthy",
  caution: "Caution",
  unprofitable: "Unprofitable",
};

export function MarginIndicator({
  percentage,
  indicator,
  size = "sm",
}: MarginIndicatorProps) {
  const formattedPercent = `${Math.round(percentage * 10) / 10}%`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-block shrink-0 rounded-full",
            dotColors[indicator],
            size === "sm" ? "size-2" : "size-2.5"
          )}
          role="img"
          aria-label={`Margin: ${formattedPercent} (${indicatorLabels[indicator]})`}
        />
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">
          Margin: {formattedPercent}
          <span className="text-muted-foreground ml-1">
            ({indicatorLabels[indicator]})
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
