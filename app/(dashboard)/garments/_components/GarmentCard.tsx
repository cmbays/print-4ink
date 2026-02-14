"use client";

import { cn } from "@/lib/utils";
import { GarmentImage } from "@/components/features/GarmentImage";
import { FavoriteStar } from "@/components/features/FavoriteStar";
import { ColorSwatchPicker } from "@/components/features/ColorSwatchPicker";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/helpers/money";
import { colors as catalogColors } from "@/lib/mock-data";
import type { GarmentCatalog } from "@/lib/schemas/garment";
import type { Color } from "@/lib/schemas/color";

interface GarmentCardProps {
  garment: GarmentCatalog;
  showPrice: boolean;
  onToggleFavorite: (garmentId: string) => void;
  onClick: (garmentId: string) => void;
}

export function GarmentCard({
  garment,
  showPrice,
  onToggleFavorite,
  onClick,
}: GarmentCardProps) {
  // Get Color objects for garment's available colors
  const garmentColors = garment.availableColors
    .map((id) => catalogColors.find((c) => c.id === id))
    .filter((c): c is Color => c != null);

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
        {garment.brand} · {garment.sku}
      </p>

      {/* Name */}
      <p className="text-sm font-medium text-foreground line-clamp-2">
        {garment.name}
      </p>

      {/* Compact color swatches */}
      <ColorSwatchPicker
        colors={garmentColors}
        onSelect={() => {}}
        compact
        maxCompactSwatches={8}
      />

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
