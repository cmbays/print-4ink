'use client'

import { Star } from 'lucide-react'
import { cn } from '@shared/lib/cn'

type FavoriteStarProps = {
  isFavorite: boolean
  onToggle: () => void
  label?: string
  size?: number
  disabled?: boolean
  className?: string
}

export function FavoriteStar({
  isFavorite,
  onToggle,
  label = 'favorite',
  size = 16,
  disabled = false,
  className,
}: FavoriteStarProps) {
  return (
    <button
      type="button"
      aria-label={isFavorite ? `Remove from ${label}` : `Add to ${label}`}
      aria-pressed={isFavorite}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm p-2 transition-colors',
        'hover:bg-surface active:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'motion-reduce:transition-none',
        isFavorite ? 'text-warning' : 'text-muted-foreground/40 hover:text-muted-foreground',
        className
      )}
    >
      <Star size={size} className={cn(isFavorite && 'fill-current')} aria-hidden="true" />
    </button>
  )
}
