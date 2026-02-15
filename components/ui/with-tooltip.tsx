"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// WithTooltip — DRY wrapper that eliminates 5-line tooltip boilerplate.
//
// Usage:
//   <WithTooltip tooltip="Save all changes">
//     <Button><Save /></Button>
//   </WithTooltip>
//
// IMPORTANT: Wrap groups of adjacent WithTooltip elements in a single
// <TooltipProvider skipDelayDuration={300}> so hovering between buttons
// shows tooltips instantly (shared delay).
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
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
