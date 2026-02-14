"use client";

import { cn } from "@/lib/utils";
import { FavoriteStar } from "@/components/features/FavoriteStar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/helpers/money";
import type { GarmentCatalog } from "@/lib/schemas/garment";

interface GarmentTableRowProps {
  garment: GarmentCatalog;
  showPrice: boolean;
  onToggleEnabled: (garmentId: string) => void;
  onToggleFavorite: (garmentId: string) => void;
  onClick: (garmentId: string) => void;
}

export function GarmentTableRow({
  garment,
  showPrice,
  onToggleEnabled,
  onToggleFavorite,
  onClick,
}: GarmentTableRowProps) {
  return (
    <tr
      onClick={() => onClick(garment.id)}
      className={cn(
        "cursor-pointer border-b border-border transition-colors hover:bg-surface",
        "motion-reduce:transition-none",
        !garment.isEnabled && "opacity-50",
      )}
    >
      <td className="px-3 py-2.5 text-sm font-medium text-foreground">
        {garment.brand}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {garment.sku}
      </td>
      <td className="px-3 py-2.5 text-sm text-foreground">
        {garment.name}
      </td>
      <td className="px-3 py-2.5">
        <Badge variant="outline" className="text-[10px]">
          {garment.baseCategory}
        </Badge>
      </td>
      {showPrice && (
        <td className="px-3 py-2.5 text-sm text-foreground tabular-nums">
          {formatCurrency(garment.basePrice)}
        </td>
      )}
      <td className="px-3 py-2.5">
        <Switch
          checked={garment.isEnabled}
          onCheckedChange={() => onToggleEnabled(garment.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${garment.isEnabled ? "Disable" : "Enable"} ${garment.name}`}
        />
      </td>
      <td className="px-3 py-2.5">
        <FavoriteStar
          isFavorite={garment.isFavorite}
          onToggle={() => onToggleFavorite(garment.id)}
        />
      </td>
    </tr>
  );
}
