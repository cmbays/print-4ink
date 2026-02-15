"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// WithTooltip — DRY wrapper that eliminates 5-line tooltip boilerplate.
//
// Self-contained: includes its own TooltipProvider so it works anywhere.
//
// Usage:
//   <WithTooltip tooltip="Save all changes">
//     <Button><Save /></Button>
//   </WithTooltip>
//
// For groups of adjacent WithTooltip elements, wrap in a shared
// <TooltipProvider skipDelayDuration={300}> for instant hover transitions.
// ---------------------------------------------------------------------------

interface WithTooltipProps {
  /** Tooltip text shown on hover */
  tooltip: string;
  /** Which side the tooltip appears on */
  side?: "top" | "bottom" | "left" | "right";
  /** The element to wrap — must accept a ref (native element or forwardRef) */
  children: React.ReactNode;
}

export function WithTooltip({ tooltip, side = "bottom", children }: WithTooltipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
