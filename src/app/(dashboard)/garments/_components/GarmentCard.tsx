"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { GarmentImage } from "@/components/features/GarmentImage";
import { FavoriteStar } from "@/components/features/FavoriteStar";
import { ColorSwatchPicker } from "@/components/features/ColorSwatchPicker";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/helpers/money";
import { getColorById } from "@/lib/helpers/garment-helpers";
import type { GarmentCatalog } from "@domain/entities/garment";
import type { Color } from "@domain/entities/color";

interface GarmentCardProps {
  garment: GarmentCatalog;
  showPrice: boolean;
  favoriteColorIds: string[];
  onToggleFavorite: (garmentId: string) => void;
  onBrandClick?: (brandName: string) => void;
  onClick: (garmentId: string) => void;
}

export function GarmentCard({
  garment,
  showPrice,
  favoriteColorIds,
  onToggleFavorite,
  onBrandClick,
  onClick,
}: GarmentCardProps) {
  // All Color objects for this garment's palette
  const garmentColors = useMemo(
    () =>
      garment.availableColors
        .map((id) => getColorById(id))
        .filter((c): c is Color => c != null),
    [garment.availableColors]
  );

  // Only favorite colors that this garment actually has
  const favoriteSwatchColors = useMemo(() => {
    const favSet = new Set(favoriteColorIds);
    return garmentColors.filter((c) => favSet.has(c.id));
  }, [garmentColors, favoriteColorIds]);

  const totalColorCount = garmentColors.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(garment.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(garment.id);
        }
      }}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-elevated p-3",
        "cursor-pointer transition-colors hover:bg-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-reduce:transition-none",
        !garment.isEnabled && "opacity-50",
      )}
    >
      {/* Image */}
      <div className="flex justify-center py-2">
        <GarmentImage brand={garment.brand} sku={garment.sku} name={garment.name} size="md" />
      </div>

      {/* Brand + SKU */}
      <p className="text-xs text-muted-foreground">
        {onBrandClick ? (
          <button
            type="button"
            className="hover:text-action hover:underline focus-visible:outline-none focus-visible:text-action"
            onClick={(e) => {
              e.stopPropagation();
              onBrandClick(garment.brand);
            }}
          >
            {garment.brand}
          </button>
        ) : (
          garment.brand
        )}
        {" "}· {garment.sku}
      </p>

      {/* Name */}
      <p className="text-sm font-medium text-foreground line-clamp-2">
        {garment.name}
      </p>

      {/* Favorite color swatches + count badge */}
      <div className="flex items-center gap-2">
        {favoriteSwatchColors.length > 0 ? (
          <ColorSwatchPicker
            colors={favoriteSwatchColors}
            onSelect={() => {}}
            compact
            maxCompactSwatches={6}
          />
        ) : (
          <span className="text-xs text-muted-foreground">No favorites</span>
        )}
        <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
          {totalColorCount} {totalColorCount === 1 ? "color" : "colors"}
        </span>
      </div>

      {/* Bottom row: price + badges + favorite */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {showPrice && (
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(garment.basePrice)}
            </span>
          )}
          {!garment.isEnabled && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              Disabled
            </Badge>
          )}
        </div>
        <FavoriteStar
          isFavorite={garment.isFavorite}
          onToggle={() => onToggleFavorite(garment.id)}
        />
      </div>
    </div>
  );
}
