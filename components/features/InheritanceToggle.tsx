"use client";

import { Link2, Unlink2 } from "lucide-react";
import { cn } from "@shared/lib/cn";
import type { InheritanceMode } from "@domain/entities/color-preferences";

interface InheritanceToggleProps {
  parentLabel: string;
  mode: InheritanceMode;
  onChange: (mode: InheritanceMode) => void;
}

export function InheritanceToggle({
  parentLabel,
  mode,
  onChange,
}: InheritanceToggleProps) {
  return (
    <div
      className="flex rounded-md border border-border bg-elevated p-1"
      role="radiogroup"
      aria-label="Inheritance mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "inherit"}
        onClick={() => onChange("inherit")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-sm transition-colors",
          "min-h-(--mobile-touch-target) md:min-h-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "motion-reduce:transition-none",
          mode === "inherit"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Link2 size={14} aria-hidden="true" />
        <span>Use {parentLabel} colors</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "customize"}
        onClick={() => onChange("customize")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-sm transition-colors",
          "min-h-(--mobile-touch-target) md:min-h-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "motion-reduce:transition-none",
          mode === "customize"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Unlink2 size={14} aria-hidden="true" />
        <span>Customize colors</span>
      </button>
    </div>
  );
}
