'use client'

import { useMemo } from 'react'
import { hexToColorMatrix } from '@domain/rules/color.rules'

type MockupFilterProviderProps = {
  /** Set of hex colors currently visible on screen. */
  colors: string[]
}

/**
 * Renders shared SVG filter definitions for garment color tinting.
 * Place once per page — all GarmentMockup instances reference
 * these filters by ID (garment-tint-{hex}).
 */
export function MockupFilterProvider({ colors }: MockupFilterProviderProps) {
  const uniqueColors = useMemo(() => [...new Set(colors.map((c) => c.toLowerCase()))], [colors])

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <defs>
        {uniqueColors.map((hex) => (
          <filter key={hex} id={`garment-tint-${hex.replace('#', '')}`}>
            <feColorMatrix type="matrix" values={hexToColorMatrix(hex)} />
          </filter>
        ))}
      </defs>
    </svg>
  )
}
