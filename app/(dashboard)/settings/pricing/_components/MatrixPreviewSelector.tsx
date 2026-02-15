"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GarmentCategory } from "@/lib/schemas/garment";
import type { LocationUpcharge, GarmentTypePricing } from "@/lib/schemas/price-matrix";
import { Shirt, MapPin } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatrixPreviewSelectorProps {
  garmentTypes: GarmentTypePricing[];
  locations: LocationUpcharge[];
  selectedGarment: GarmentCategory | undefined;
  selectedLocations: string[];
  onGarmentChange: (category: GarmentCategory | undefined) => void;
  onLocationsChange: (locations: string[]) => void;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const garmentLabels: Record<GarmentCategory, string> = {
  "t-shirts": "T-Shirts",
  "fleece": "Fleece",
  "outerwear": "Outerwear",
  "pants": "Pants",
  "headwear": "Headwear",
};

const locationLabels: Record<string, string> = {
  "front": "Front",
  "back": "Back",
  "left-sleeve": "L. Sleeve",
  "right-sleeve": "R. Sleeve",
  "pocket": "Pocket",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MatrixPreviewSelector({
  garmentTypes,
  locations,
  selectedGarment,
  selectedLocations,
  onGarmentChange,
  onLocationsChange,
}: MatrixPreviewSelectorProps) {
  const toggleLocation = (loc: string) => {
    if (selectedLocations.includes(loc)) {
      onLocationsChange(selectedLocations.filter((l) => l !== loc));
    } else {
      onLocationsChange([...selectedLocations, loc]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface/50 px-3 py-2">
      {/* Garment type selector */}
      <div className="flex items-center gap-2">
        <Shirt className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Garment:</span>
        <Select
          value={selectedGarment ?? "__none__"}
          onValueChange={(v) => onGarmentChange(v === "__none__" ? undefined : v as GarmentCategory)}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue placeholder="Base (none)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Base (none)</SelectItem>
            {garmentTypes.map((gt) => (
              <SelectItem key={gt.garmentCategory} value={gt.garmentCategory}>
                {garmentLabels[gt.garmentCategory] ?? gt.garmentCategory}
                {gt.baseMarkup > 0 && (
                  <span className="ml-1 text-muted-foreground">+{gt.baseMarkup}%</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Location toggles */}
      <div className="flex items-center gap-2">
        <MapPin className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Locations:</span>
        <div className="flex items-center gap-1">
          {locations.map((loc) => {
            const isActive = selectedLocations.includes(loc.location);
            return (
              <Button
                key={loc.location}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-6 px-2 text-[11px]",
                  isActive && "shadow-sm"
                )}
                onClick={() => toggleLocation(loc.location)}
              >
                {locationLabels[loc.location] ?? loc.location}
                {loc.upcharge > 0 && !isActive && (
                  <span className="ml-0.5 text-muted-foreground">+${loc.upcharge}</span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
