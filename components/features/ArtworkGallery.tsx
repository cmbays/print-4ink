'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Palette, ArrowUpDown, ArrowRight, Trophy, Sun } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Badge } from '@shared/ui/primitives/badge'
import { Button } from '@shared/ui/primitives/button'
import type { Artwork } from '@domain/entities/artwork'
import { ARTWORK_TAG_LABELS } from '@domain/constants'

type SortMode = 'smart' | 'a-z' | 'newest'

type ArtworkGalleryProps = {
  artworks: Artwork[]
  customerId: string
}

const SORT_LABELS: Record<SortMode, string> = {
  smart: 'Smart',
  'a-z': 'A-Z',
  newest: 'Newest',
}

// Gradient palette for placeholder thumbnails
const GRADIENTS = [
  'from-action/40 to-action/10',
  'from-success/40 to-success/10',
  'from-warning/40 to-warning/10',
  'from-error/40 to-error/10',
  'from-action/30 to-success/20',
  'from-warning/30 to-error/20',
]

function getGradient(index: number): string {
  return GRADIENTS[index % GRADIENTS.length]
}

function sortArtworks(artworks: Artwork[], mode: SortMode): Artwork[] {
  const sorted = [...artworks]
  switch (mode) {
    case 'smart':
      return sorted.sort((a, b) => {
        // Most recently used first, then by createdAt
        const aDate = a.lastUsedAt ?? a.createdAt
        const bDate = b.lastUsedAt ?? b.createdAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
    case 'a-z':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }
}

export function ArtworkGallery({ artworks, customerId }: ArtworkGalleryProps) {
  const [sortMode, setSortMode] = useState<SortMode>('smart')

  const sortedArtworks = useMemo(() => sortArtworks(artworks, sortMode), [artworks, sortMode])

  // First artwork is marked "Top seller" for mock purposes
  const topSellerId = artworks.length > 0 ? artworks[0].id : null

  if (artworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-surface p-4 mb-4">
          <Palette className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No artwork on file</p>
        <p className="text-xs text-muted-foreground">
          Artwork will appear here once uploaded for this customer.
        </p>
      </div>
    )
  }

  const cycleSortMode = () => {
    const modes: SortMode[] = ['smart', 'a-z', 'newest']
    const currentIndex = modes.indexOf(sortMode)
    setSortMode(modes[(currentIndex + 1) % modes.length])
  }

  return (
    <div className="space-y-4">
      {/* Sort toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {artworks.length} artwork{artworks.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleSortMode}
          className="text-xs gap-1.5"
          aria-label={`Sort by ${SORT_LABELS[sortMode]}`}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {SORT_LABELS[sortMode]}
        </Button>
      </div>

      {/* Artwork grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedArtworks.map((artwork, index) => {
          const isTopSeller = artwork.id === topSellerId
          const isInSeason = artwork.tags.includes('seasonal')

          return (
            <div
              key={artwork.id}
              className={cn(
                'group relative rounded-lg border border-border bg-elevated overflow-hidden',
                'transition-all duration-200',
                'hover:scale-[1.02] hover:border-action/40 hover:shadow-md hover:shadow-action/5'
              )}
            >
              {/* Placeholder thumbnail */}
              <div className={cn('relative aspect-square bg-gradient-to-br', getGradient(index))}>
                <div className="absolute inset-0 flex items-center justify-center p-3">
                  <p className="text-xs font-medium text-foreground/70 text-center line-clamp-2">
                    {artwork.name}
                  </p>
                </div>

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {isTopSeller && (
                    <Badge
                      variant="ghost"
                      className="bg-warning/20 text-warning text-[10px] px-1.5 py-0"
                    >
                      <Trophy className="h-2.5 w-2.5" />
                      Top seller
                    </Badge>
                  )}
                  {isInSeason && (
                    <Badge
                      variant="ghost"
                      className="bg-success/20 text-success text-[10px] px-1.5 py-0"
                    >
                      <Sun className="h-2.5 w-2.5" />
                      In season
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card content */}
              <div className="p-3 space-y-2">
                <div>
                  <p className="text-sm font-medium text-foreground truncate">{artwork.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {artwork.colorCount} color{artwork.colorCount !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Tags */}
                {artwork.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {artwork.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="ghost"
                        className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0"
                      >
                        {ARTWORK_TAG_LABELS[tag]}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Use in New Quote */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs gap-1 text-action hover:text-action"
                  asChild
                >
                  <Link
                    href={`/quotes/new?customer=${customerId}&artwork=${artwork.id}`}
                    aria-label={`Use ${artwork.name} in a new quote`}
                  >
                    Use in New Quote
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
