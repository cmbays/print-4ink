"use client";

import { useMemo, useRef, useCallback } from "react";
import { Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { swatchTextStyle } from "@/lib/constants/swatch";
import { colors as catalogColors } from "@/lib/mock-data";
import type { Color } from "@/lib/schemas/color";

interface ColorFilterGridProps {
  selectedColorIds: string[];
  onToggleColor: (colorId: string) => void;
  favoriteColorIds: string[];
}

function FilterSwatch({
  color,
  isSelected,
  onToggle,
  tabIndex,
}: {
  color: Color;
  isSelected: boolean;
  onToggle: () => void;
  tabIndex: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Filter by ${color.name}`}
          tabIndex={tabIndex}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          className={cn(
            "relative flex h-8 w-8 min-h-(--mobile-touch-target) min-w-(--mobile-touch-target) md:min-h-0 md:min-w-0 flex-shrink-0 items-center justify-center rounded-sm transition-all",
            "cursor-pointer hover:scale-105 hover:ring-1 hover:ring-foreground/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "motion-reduce:transition-none",
            isSelected && "ring-2 ring-action scale-110",
          )}
          style={{ backgroundColor: color.hex }}
        >
          {isSelected ? (
            <Check
              size={14}
              style={{ color: color.swatchTextColor }}
              aria-hidden="true"
            />
          ) : (
            <span
              className="pointer-events-none select-none text-center leading-tight"
              style={swatchTextStyle(color.swatchTextColor)}
            >
              {color.name}
            </span>
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
  favoriteColorIds,
}: ColorFilterGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(
    () => new Set(selectedColorIds),
    [selectedColorIds],
  );

  // Favorites first, then remaining by catalog order
  const sortedColors = useMemo(() => {
    const favoriteSet = new Set(favoriteColorIds);
    const favorites: Color[] = [];
    const rest: Color[] = [];

    for (const color of catalogColors) {
      if (favoriteSet.has(color.id)) {
        favorites.push(color);
      } else {
        rest.push(color);
      }
    }

    return [...favorites, ...rest];
  }, [favoriteColorIds]);

  // Keyboard arrow navigation (ported from ColorSwatchPicker)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="checkbox"]',
      );
      if (!buttons || buttons.length === 0) return;

      const active = document.activeElement as HTMLButtonElement;
      const currentIndex = Array.from(buttons).indexOf(active);
      if (currentIndex === -1) return;

      // Approximate columns from grid layout
      const gridWidth = gridRef.current?.offsetWidth ?? 0;
      const cols = Math.max(1, Math.floor(gridWidth / 34)); // 32px swatch + 2px gap

      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = Math.min(currentIndex + 1, buttons.length - 1);
          break;
        case "ArrowLeft":
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case "ArrowDown":
          nextIndex = Math.min(currentIndex + cols, buttons.length - 1);
          break;
        case "ArrowUp":
          nextIndex = Math.max(currentIndex - cols, 0);
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = buttons.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      buttons[nextIndex]?.focus();
    },
    [],
  );

  return (
    <TooltipProvider skipDelayDuration={300}>
      <div
        ref={gridRef}
        className="flex flex-wrap gap-0.5"
        role="group"
        aria-label="Filter by color"
        onKeyDown={handleKeyDown}
      >
        {sortedColors.map((color, i) => (
          <FilterSwatch
            key={color.id}
            color={color}
            isSelected={selectedSet.has(color.id)}
            onToggle={() => onToggleColor(color.id)}
            tabIndex={i === 0 ? 0 : -1}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
