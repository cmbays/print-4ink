'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@shared/ui/primitives/dialog'
import { Button } from '@shared/ui/primitives/button'
import { GarmentMockup, type ArtworkPlacement } from './GarmentMockup'
import type { GarmentCategory } from '@domain/entities/garment'
import type { MockupView } from '@domain/entities/mockup-template'

type GarmentMockupModalProps = {
  garmentCategory: GarmentCategory
  colorHex: string
  artworkPlacements?: ArtworkPlacement[]
  children: React.ReactNode
  defaultView?: MockupView
}

const VIEWS: MockupView[] = ['front', 'back']
const VIEW_LABELS: Record<MockupView, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'L. Sleeve',
  'right-sleeve': 'R. Sleeve',
}

/**
 * Wraps any trigger element. On click, opens a full-size Dialog showing the
 * garment mockup with a front/back view toggle.
 */
export function GarmentMockupModal({
  garmentCategory,
  colorHex,
  artworkPlacements = [],
  children,
  defaultView = 'front',
}: GarmentMockupModalProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<MockupView>(defaultView)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="View full-size mockup"
        className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        {children}
      </div>

      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl flex flex-col items-center gap-4 p-6">
            <DialogTitle className="sr-only">Garment Mockup</DialogTitle>

            {/* Front/Back view toggle */}
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
              {VIEWS.map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setView(v)}
                  className={
                    v === view
                      ? 'bg-elevated text-foreground h-7 px-3 text-xs'
                      : 'text-muted-foreground hover:text-foreground h-7 px-3 text-xs'
                  }
                >
                  {VIEW_LABELS[v]}
                </Button>
              ))}
            </div>

            <GarmentMockup
              garmentCategory={garmentCategory}
              colorHex={colorHex}
              artworkPlacements={artworkPlacements}
              view={view}
              size="lg"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
