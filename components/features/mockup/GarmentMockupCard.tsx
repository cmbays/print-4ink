"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GarmentMockup } from "./GarmentMockup";
import type { ArtworkPlacement } from "./GarmentMockup";
import type { GarmentCategory } from "@/lib/schemas/garment";
import type { MockupView } from "@/lib/schemas/mockup-template";

interface GarmentMockupCardProps {
  garmentCategory: GarmentCategory;
  colorHex: string;
  artworkPlacements?: ArtworkPlacement[];
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Which views have artwork (for tab indicators). */
  availableViews?: MockupView[];
}

// Static mapping of views to their associated print positions.
// Zones within a view can overlap — they represent ALTERNATIVE placement
// positions, not simultaneous regions. The UI presents them as mutually exclusive.
const VIEW_POSITION_MAP: Record<string, string[]> = {
  front: ["front-chest", "left-chest", "right-chest", "full-front", "front-panel"],
  back: ["full-back", "upper-back", "nape", "back-panel"],
  "left-sleeve": ["left-sleeve"],
  "right-sleeve": ["right-sleeve"],
};

/**
 * Interactive mockup card with front/back toggle and artwork indicators.
 * Used in quote detail, job detail, and editor contexts.
 */
export function GarmentMockupCard({
  garmentCategory,
  colorHex,
  artworkPlacements = [],
  size = "md",
  className,
  availableViews = ["front", "back"],
}: GarmentMockupCardProps) {
  const [activeView, setActiveView] = useState<MockupView>("front");

  const viewHasArtwork = (view: MockupView): boolean => {
    const positions = VIEW_POSITION_MAP[view] ?? [];
    return artworkPlacements.some((p) => positions.includes(p.position));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* View toggle tabs */}
      <div className="flex gap-1" role="tablist" aria-label="Mockup views">
        {availableViews.map((view) => {
          const hasArt = viewHasArtwork(view);
          const isActive = activeView === view;
          const label =
            view === "front"
              ? "Front"
              : view === "back"
                ? "Back"
                : view === "left-sleeve"
                  ? "L. Sleeve"
                  : "R. Sleeve";

          return (
            <button
              key={view}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveView(view)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                isActive
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              )}
            >
              {label}
              {hasArt && (
                <span
                  className="ml-1 inline-block size-1.5 rounded-full bg-action"
                  aria-label="has artwork"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Mockup render */}
      <GarmentMockup
        garmentCategory={garmentCategory}
        colorHex={colorHex}
        artworkPlacements={artworkPlacements}
        view={activeView}
        size={size}
      />
    </div>
  );
}
