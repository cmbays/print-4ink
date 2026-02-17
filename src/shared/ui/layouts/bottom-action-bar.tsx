"use client";

import { cn } from "@shared/lib/cn";

interface BottomActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40",
        "flex items-center gap-2 border-t border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "md:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
