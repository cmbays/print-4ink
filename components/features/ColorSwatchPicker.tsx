"use client";

import { useState, useRef, useMemo } from "react";
import { Search, Check, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { swatchTextStyle } from "@domain/constants/swatch";
import type { Color } from "@domain/entities/color";
import { getColorsMutable } from "@infra/repositories/colors";
import { useGridKeyboardNav } from "@/lib/hooks/useGridKeyboardNav";

type ColorSwatchPickerProps = {
  colors: Color[];
  selectedColorId?: string;
  onSelect: (colorId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (colorId: string) => void;
  compact?: boolean;
  maxCompactSwatches?: number;
  multiSelect?: boolean;
  selectedColorIds?: string[];
  onToggleColor?: (colorId: string) => void;
};

const DEFAULT_COLORS = getColorsMutable();
const DEFAULT_FAVORITES = DEFAULT_COLORS
  .filter((c) => c.isFavorite === true)
  .map((c) => c.id);

function Swatch({
  color,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  tabIndex,
}: {
  color: Color;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite?: () => void;
  tabIndex: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="option"
          aria-selected={isSelected}
          aria-label={`${color.name}${isSelected ? " (selected)" : ""}`}
          tabIndex={tabIndex}
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }}
          className={cn(
            "group relative flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-transform",
            "hover:scale-105 hover:ring-1 hover:ring-foreground/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "motion-reduce:transition-none",
            isSelected && "ring-2 ring-action"
          )}
          style={{ backgroundColor: color.hex }}
        >
          {/* Color name overlay */}
          <span
            className="pointer-events-none select-none text-center leading-tight"
            style={swatchTextStyle(color.swatchTextColor)}
          >
            {isSelected ? "" : color.name}
          </span>

          {/* Selected checkmark */}
          {isSelected && (
            <Check
              size={16}
              className="absolute"
              style={{ color: color.swatchTextColor }}
              aria-hidden="true"
            />
          )}

          {/* Favorite star */}
          {onToggleFavorite && (
            <button
              type="button"
              aria-label={isFavorite ? `Remove ${color.name} from favorites` : `Add ${color.name} to favorites`}
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
              style={{
                opacity: isFavorite ? 1 : undefined,
              }}
            >
              <Star
                size={16}
                className={cn(isFavorite && "fill-current")}
                style={{ color: color.swatchTextColor }}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {color.name}
      </TooltipContent>
    </Tooltip>
  );
}

export function ColorSwatchPicker({
  colors = DEFAULT_COLORS,
  selectedColorId,
  onSelect,
  favorites = DEFAULT_FAVORITES,
  onToggleFavorite,
  compact,
  maxCompactSwatches,
  multiSelect,
  selectedColorIds = [],
  onToggleColor,
}: ColorSwatchPickerProps) {
  const [search, setSearch] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return colors;
    const q = search.toLowerCase();
    return colors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.family.toLowerCase().includes(q)
    );
  }, [colors, search]);

  const favoriteColors = useMemo(
    () => filtered.filter((c) => favorites.includes(c.id)),
    [filtered, favorites]
  );

  const handleKeyDown = useGridKeyboardNav(gridRef, '[role="option"]', 42);

  // Compact mode: simple row of small swatches
  if (compact) {
    const displayColors = colors.slice(0, maxCompactSwatches ?? 8);
    const remaining = colors.length - displayColors.length;
    return (
      <div className="flex items-center gap-0.5">
        {displayColors.map((color) => (
          <Tooltip key={color.id}>
            <TooltipTrigger asChild>
              <div
                className="h-4 w-4 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {color.name}
            </TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            +{remaining}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-elevated p-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          placeholder="Search colors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-sm"
          aria-label="Search colors"
        />
      </div>

      <ScrollArea className="max-h-72">
        {/* Favorites section */}
        {favoriteColors.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star size={16} className="fill-current" aria-hidden="true" />
              Favorites
            </p>
            <div
              className="flex flex-wrap gap-0.5"
              role="listbox"
              aria-label="Favorite colors"
            >
              {favoriteColors.map((color) => (
                <Swatch
                  key={`fav-${color.id}`}
                  color={color}
                  isSelected={
                    multiSelect
                      ? selectedColorIds.includes(color.id)
                      : selectedColorId === color.id
                  }
                  isFavorite={true}
                  onSelect={() =>
                    multiSelect && onToggleColor
                      ? onToggleColor(color.id)
                      : onSelect(color.id)
                  }
                  onToggleFavorite={
                    onToggleFavorite
                      ? () => onToggleFavorite(color.id)
                      : undefined
                  }
                  tabIndex={0}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Colors grid */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            All Colors
            {search.trim() && (
              <span className="ml-1 text-muted-foreground/60">
                ({filtered.length})
              </span>
            )}
          </p>
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No colors match &ldquo;{search}&rdquo;
            </p>
          ) : (
            <div
              ref={gridRef}
              className="flex flex-wrap gap-0.5"
              role="listbox"
              aria-label="All colors"
              onKeyDown={handleKeyDown}
            >
              {filtered.map((color, i) => (
                <Swatch
                  key={color.id}
                  color={color}
                  isSelected={
                    multiSelect
                      ? selectedColorIds.includes(color.id)
                      : selectedColorId === color.id
                  }
                  isFavorite={favorites.includes(color.id)}
                  onSelect={() =>
                    multiSelect && onToggleColor
                      ? onToggleColor(color.id)
                      : onSelect(color.id)
                  }
                  onToggleFavorite={
                    onToggleFavorite
                      ? () => onToggleFavorite(color.id)
                      : undefined
                  }
                  tabIndex={i === 0 ? 0 : -1}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
