"use client";

import { memo } from "react";
import { GarmentMockup } from "./GarmentMockup";
import type { ArtworkPlacement } from "./GarmentMockup";
import type { GarmentCategory } from "@/lib/schemas/garment";
import type { MockupView } from "@/lib/schemas/mockup-template";

interface GarmentMockupThumbnailProps {
  garmentCategory: GarmentCategory;
  colorHex: string;
  artworkPlacements?: ArtworkPlacement[];
  view?: MockupView;
  className?: string;
}

/**
 * Memoized small mockup for Kanban cards, table rows, and list items.
 * Renders at xs size (40x48px) by default.
 */
export const GarmentMockupThumbnail = memo(function GarmentMockupThumbnail({
  garmentCategory,
  colorHex,
  artworkPlacements,
  view = "front",
  className,
}: GarmentMockupThumbnailProps) {
  return (
    <GarmentMockup
      garmentCategory={garmentCategory}
      colorHex={colorHex}
      artworkPlacements={artworkPlacements}
      view={view}
      size="xs"
      className={className}
    />
  );
});
