'use client'

import { useId, useMemo } from 'react'
import { cn } from '@shared/lib/cn'
import { getZoneForPosition } from '@domain/constants/print-zones'
import { hexToColorMatrix } from '@domain/rules/color.rules'
import type { GarmentCategory } from '@domain/entities/garment'
import type { MockupView } from '@domain/entities/mockup-template'

export type ArtworkPlacement = {
  artworkUrl: string
  position: string
  scale?: number
  offsetX?: number
  offsetY?: number
}

type ResolvedPlacement = ArtworkPlacement & {
  zone: { x: number; y: number; width: number; height: number }
}

function isResolved<T extends Record<string, unknown>>(p: T | null): p is T & ResolvedPlacement {
  return p !== null
}

const EMPTY_PLACEMENTS: ArtworkPlacement[] = []

// Size presets (classes applied to the root wrapper)
const SIZE_CLASSES = {
  xs: 'w-10 h-12', // 40x48 — Kanban cards, table rows
  sm: 'w-16 h-20', // 64x80 — Quote line items
  md: 'w-72 h-80', // 288x320 — Job detail
  lg: 'w-[400px] h-[480px]', // 400x480 — Editor, approval
} as const

type GarmentMockupProps = {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  view?: MockupView
  size?: keyof typeof SIZE_CLASSES
  className?: string
  /** Path to SVG template. Falls back to /mockup-templates/{category}-{view}.svg */
  templatePath?: string
  /** ViewBox width of the SVG template. Defaults to 400. */
  viewBoxWidth?: number
  /** ViewBox height of the SVG template. Defaults to 480. */
  viewBoxHeight?: number
}

/**
 * Core SVG composition engine for garment mockups.
 * Renders a garment template with color tinting and artwork overlays.
 *
 * Self-contained: renders its own inline feColorMatrix filter for color
 * tinting. MockupFilterProvider is optional — when present, it provides
 * shared filter definitions that the browser deduplicates for performance.
 * Uses mix-blend-mode: multiply for realistic fabric texture.
 */
export function GarmentMockup({
  garmentCategory,
  colorHex,
  artworkPlacements = EMPTY_PLACEMENTS,
  view = 'front',
  size = 'md',
  className,
  templatePath,
  viewBoxWidth = 400,
  viewBoxHeight = 480,
}: GarmentMockupProps) {
  const instanceId = useId()
  const svgPath = templatePath ?? `/mockup-templates/${garmentCategory}-${view}.svg`
  const filterId = `garment-tint-${colorHex.replace('#', '').toLowerCase()}`

  // Resolve print zones for artwork placements
  const resolvedPlacements = useMemo(
    () =>
      artworkPlacements
        .map((placement) => {
          const zone = getZoneForPosition(garmentCategory, view, placement.position)
          if (!zone) return null
          return { ...placement, zone }
        })
        .filter(isResolved),
    [artworkPlacements, garmentCategory, view]
  )

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        'relative rounded-md overflow-hidden bg-surface',
        className
      )}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        role="img"
        aria-label={`${garmentCategory} mockup - ${view} view`}
      >
        {/* Inline color tint filter — self-contained fallback.
            MockupFilterProvider may also define this filter ID at page level
            for deduplication, but this ensures the component works standalone. */}
        <defs>
          <filter id={filterId}>
            <feColorMatrix type="matrix" values={hexToColorMatrix(colorHex)} />
          </filter>
        </defs>

        {/* Garment template with color tint filter */}
        <image href={svgPath} width={viewBoxWidth} height={viewBoxHeight} />

        {/* Artwork overlays */}
        {resolvedPlacements.map((placement, i) => {
          const { zone, artworkUrl, scale = 1, offsetX = 0, offsetY = 0 } = placement

          // Convert percentage coordinates to viewBox units
          const zx = (zone.x / 100) * viewBoxWidth
          const zy = (zone.y / 100) * viewBoxHeight
          const zw = (zone.width / 100) * viewBoxWidth
          const zh = (zone.height / 100) * viewBoxHeight

          // Apply scale and offset
          const scaledW = zw * scale
          const scaledH = zh * scale
          const cx = zx + zw / 2 + (offsetX / 100) * zw
          const cy = zy + zh / 2 + (offsetY / 100) * zh
          const ax = cx - scaledW / 2
          const ay = cy - scaledH / 2

          const clipId = `clip-${instanceId}-${view}-${placement.position}-${i}`

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
                className="mix-blend-multiply"
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
