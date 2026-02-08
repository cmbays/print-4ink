"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Search, Check, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  hex2?: string;
  swatchTextColor: string;
  family: string;
}

interface ColorSwatchPickerProps {
  colors: ColorOption[];
  selectedColorId?: string;
  onSelect: (colorId: string) => void;
  favorites?: string[];
  onToggleFavorite?: (colorId: string) => void;
}

const MOCK_COLORS: ColorOption[] = [
  { id: "c-black", name: "Black", hex: "#000000", swatchTextColor: "#FFFFFF", family: "Black" },
  { id: "c-white", name: "White", hex: "#FFFFFF", swatchTextColor: "#000000", family: "White" },
  { id: "c-navy", name: "Navy", hex: "#1B2A4A", swatchTextColor: "#FFFFFF", family: "Blue" },
  { id: "c-red", name: "Red", hex: "#CC0000", swatchTextColor: "#FFFFFF", family: "Red" },
  { id: "c-royal", name: "Royal Blue", hex: "#1E3A8A", swatchTextColor: "#FFFFFF", family: "Blue" },
  { id: "c-kelly", name: "Kelly Green", hex: "#006B3F", swatchTextColor: "#FFFFFF", family: "Green" },
  { id: "c-gold", name: "Gold", hex: "#FFD700", swatchTextColor: "#000000", family: "Yellow" },
  { id: "c-orange", name: "Orange", hex: "#FF6600", swatchTextColor: "#FFFFFF", family: "Orange" },
  { id: "c-charcoal", name: "Charcoal", hex: "#36454F", swatchTextColor: "#FFFFFF", family: "Gray" },
  { id: "c-hthr-grey", name: "Heather Grey", hex: "#9CA3AF", hex2: "#B0B0B0", swatchTextColor: "#000000", family: "Gray" },
  { id: "c-maroon", name: "Maroon", hex: "#800000", swatchTextColor: "#FFFFFF", family: "Red" },
  { id: "c-purple", name: "Purple", hex: "#6B21A8", swatchTextColor: "#FFFFFF", family: "Purple" },
];

const MOCK_FAVORITES = ["c-black", "c-white", "c-navy", "c-red", "c-royal"];

function Swatch({
  color,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  tabIndex,
}: {
  color: ColorOption;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite?: () => void;
  tabIndex: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="option"
          aria-selected={isSelected}
          aria-label={`${color.name}${isSelected ? " (selected)" : ""}`}
          tabIndex={tabIndex}
          onClick={onSelect}
          className={cn(
            "relative flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-transform",
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
            style={{
              color: color.swatchTextColor,
              fontSize: "8px",
              lineHeight: "1.1",
              padding: "1px",
              wordBreak: "break-word",
            }}
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
                size={10}
                className={cn(isFavorite && "fill-current")}
                style={{ color: color.swatchTextColor }}
                aria-hidden="true"
              />
            </button>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {color.name}
      </TooltipContent>
    </Tooltip>
  );
}

export function ColorSwatchPicker({
  colors = MOCK_COLORS,
  selectedColorId,
  onSelect,
  favorites = MOCK_FAVORITES,
  onToggleFavorite,
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="option"]'
      );
      if (!buttons || buttons.length === 0) return;

      const active = document.activeElement as HTMLButtonElement;
      const currentIndex = Array.from(buttons).indexOf(active);
      if (currentIndex === -1) return;

      // Approximate columns from grid layout
      const gridWidth = gridRef.current?.offsetWidth ?? 0;
      const cols = Math.max(1, Math.floor(gridWidth / 42)); // 40px swatch + 2px gap

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
    []
  );

  return (
    <TooltipProvider>
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

        <ScrollArea className="max-h-[300px]">
          {/* Favorites section */}
          {favoriteColors.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Star size={12} className="fill-current" aria-hidden="true" />
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
                    isSelected={selectedColorId === color.id}
                    isFavorite={true}
                    onSelect={() => onSelect(color.id)}
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
                    isSelected={selectedColorId === color.id}
                    isFavorite={favorites.includes(color.id)}
                    onSelect={() => onSelect(color.id)}
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
    </TooltipProvider>
  );
}

export { MOCK_COLORS, MOCK_FAVORITES };
