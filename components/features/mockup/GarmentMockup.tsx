"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getZoneForPosition } from "@/lib/constants/print-zones";
import type { GarmentCategory } from "@/lib/schemas/garment";
import type { MockupView } from "@/lib/schemas/mockup-template";

export interface ArtworkPlacement {
  artworkUrl: string;
  position: string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

const EMPTY_PLACEMENTS: ArtworkPlacement[] = [];

// Size presets (classes applied to the root wrapper)
const SIZE_CLASSES = {
  xs: "w-10 h-12",     // 40x48 — Kanban cards, table rows
  sm: "w-16 h-20",     // 64x80 — Quote line items
  md: "w-72 h-80",     // 288x320 — Job detail
  lg: "w-[400px] h-[480px]", // 400x480 — Editor, approval
} as const;

interface GarmentMockupProps {
  garmentCategory: GarmentCategory;
  colorHex: string;
  artworkPlacements?: ArtworkPlacement[];
  view?: MockupView;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  /** Path to SVG template. Falls back to /mockup-templates/{category}-{view}.svg */
  templatePath?: string;
  /** ViewBox width of the SVG template. Defaults to 400. */
  viewBoxWidth?: number;
  /** ViewBox height of the SVG template. Defaults to 480. */
  viewBoxHeight?: number;
}

/**
 * Core SVG composition engine for garment mockups.
 * Renders a garment template with color tinting and artwork overlays.
 *
 * Uses feColorMatrix filters (from MockupFilterProvider) for color tinting,
 * and mix-blend-mode: multiply for realistic fabric texture.
 */
export function GarmentMockup({
  garmentCategory,
  colorHex,
  artworkPlacements = EMPTY_PLACEMENTS,
  view = "front",
  size = "md",
  className,
  templatePath,
  viewBoxWidth = 400,
  viewBoxHeight = 480,
}: GarmentMockupProps) {
  const instanceId = useId();
  const svgPath =
    templatePath ?? `/mockup-templates/${garmentCategory}-${view}.svg`;
  const filterId = `garment-tint-${colorHex.replace("#", "").toLowerCase()}`;

  // Resolve print zones for artwork placements
  const resolvedPlacements = useMemo(
    () =>
      artworkPlacements
        .map((placement) => {
          const zone = getZoneForPosition(
            garmentCategory,
            view,
            placement.position
          );
          if (!zone) return null;
          return { ...placement, zone };
        })
        .filter(Boolean) as (ArtworkPlacement & {
        zone: { x: number; y: number; width: number; height: number };
      })[],
    [artworkPlacements, garmentCategory, view]
  );

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        "relative rounded-md overflow-hidden bg-surface",
        className
      )}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        role="img"
        aria-label={`${garmentCategory} mockup - ${view} view`}
      >
        {/* Garment template with color tint filter */}
        <image
          href={svgPath}
          width={viewBoxWidth}
          height={viewBoxHeight}
          filter={`url(#${filterId})`}
        />

        {/* Artwork overlays */}
        {resolvedPlacements.map((placement, i) => {
          const { zone, artworkUrl, scale = 1, offsetX = 0, offsetY = 0 } =
            placement;

          // Convert percentage coordinates to viewBox units
          const zx = (zone.x / 100) * viewBoxWidth;
          const zy = (zone.y / 100) * viewBoxHeight;
          const zw = (zone.width / 100) * viewBoxWidth;
          const zh = (zone.height / 100) * viewBoxHeight;

          // Apply scale and offset
          const scaledW = zw * scale;
          const scaledH = zh * scale;
          const cx = zx + zw / 2 + (offsetX / 100) * zw;
          const cy = zy + zh / 2 + (offsetY / 100) * zh;
          const ax = cx - scaledW / 2;
          const ay = cy - scaledH / 2;

          const clipId = `clip-${instanceId}-${view}-${placement.position}-${i}`;

          return (
            <g key={`${placement.position}-${i}`}>
              <defs>
                <clipPath id={clipId}>
                  <rect x={zx} y={zy} width={zw} height={zh} />
                </clipPath>
              </defs>
              <image
                href={artworkUrl}
                x={ax}
                y={ay}
                width={scaledW}
                height={scaledH}
                clipPath={`url(#${clipId})`}
                preserveAspectRatio="xMidYMid meet"
                style={{ mixBlendMode: "multiply" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
