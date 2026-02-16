"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

export function TooltipProviderWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider skipDelayDuration={300}>{children}</TooltipProvider>;
}
