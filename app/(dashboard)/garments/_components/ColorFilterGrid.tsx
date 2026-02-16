"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { colors as catalogColors } from "@/lib/mock-data";
import { resolveEffectiveFavorites } from "@/lib/helpers/color-preferences";
import type { Color } from "@/lib/schemas/color";

interface ColorFilterGridProps {
  selectedColorIds: string[];
  onToggleColor: (colorId: string) => void;
}

function FilterSwatch({
  color,
  isSelected,
  onToggle,
}: {
  color: Color;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Filter by ${color.name}`}
          onClick={onToggle}
          className={cn(
            "relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm transition-transform",
            "cursor-pointer hover:scale-110 hover:ring-1 hover:ring-foreground/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "motion-reduce:transition-none",
            isSelected && "ring-2 ring-action scale-110"
          )}
          style={{ backgroundColor: color.hex }}
        >
          {isSelected && (
            <Check
              size={12}
              style={{ color: color.swatchTextColor }}
              aria-hidden="true"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {color.name}
      </TooltipContent>
    </Tooltip>
  );
}

export function ColorFilterGrid({
  selectedColorIds,
  onToggleColor,
}: ColorFilterGridProps) {
  const selectedSet = useMemo(
    () => new Set(selectedColorIds),
    [selectedColorIds]
  );

  // Favorites first, then remaining by family
  const sortedColors = useMemo(() => {
    const favoriteIds = new Set(resolveEffectiveFavorites("global"));
    const favorites: Color[] = [];
    const rest: Color[] = [];

    for (const color of catalogColors) {
      if (favoriteIds.has(color.id)) {
        favorites.push(color);
      } else {
        rest.push(color);
      }
    }

    return [...favorites, ...rest];
  }, []);

  return (
    <TooltipProvider skipDelayDuration={300}>
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Filter by color"
      >
        {sortedColors.map((color) => (
          <FilterSwatch
            key={color.id}
            color={color}
            isSelected={selectedSet.has(color.id)}
            onToggle={() => onToggleColor(color.id)}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
