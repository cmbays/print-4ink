"use client";

import { TooltipProvider } from "@shared/ui/primitives/tooltip";

export function TooltipProviderWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider skipDelayDuration={300}>{children}</TooltipProvider>;
}
