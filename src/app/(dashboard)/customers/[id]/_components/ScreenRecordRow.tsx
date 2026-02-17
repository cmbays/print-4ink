'use client'

import Link from 'next/link'
import { Monitor } from 'lucide-react'
import { Badge } from '@shared/ui/primitives/badge'
import { Button } from '@shared/ui/primitives/button'
import { ColorSwatchPicker } from '@shared/ui/organisms/ColorSwatchPicker'
import { getColorById } from '@domain/rules/garment.rules'
import { getColorsMutable } from '@infra/repositories/colors'
import type { CustomerScreen } from '@domain/entities/customer-screen'
import type { Color } from '@domain/entities/color'

type ScreenRecordRowProps = {
  screen: CustomerScreen
  onReclaim: (screenId: string) => void
}

export function ScreenRecordRow({ screen, onReclaim }: ScreenRecordRowProps) {
  // Resolve color objects
  const allColors = getColorsMutable()
  const screenColors = screen.colorIds
    .map((id) => getColorById(id, allColors))
    .filter((c): c is Color => c != null)

  const dateStr = new Date(screen.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-elevated p-3 md:flex-row md:items-center md:justify-between md:gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <Monitor className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground truncate">{screen.artworkName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ColorSwatchPicker
              colors={screenColors}
              onSelect={() => {}}
              compact
              maxCompactSwatches={6}
            />
            <Badge variant="outline" className="text-xs">
              {screen.meshCount} mesh
            </Badge>
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          </div>
          <Link
            href={`/jobs/${screen.jobId}`}
            className="text-xs text-action hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View linked job
          </Link>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="self-end text-xs text-destructive hover:text-destructive md:self-auto shrink-0"
        onClick={() => onReclaim(screen.id)}
      >
        Reclaim
      </Button>
    </div>
  )
}
