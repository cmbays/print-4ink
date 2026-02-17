'use client'

import Link from 'next/link'
import { Plus, MessageSquare, User } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { QuoteCardBody, quoteCardContainerClass } from './QuoteCardBody'
import type { QuoteCard } from '@domain/entities/board-card'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type QuoteBoardCardProps = {
  card: QuoteCard
  onCreateJob?: () => void
}

export function QuoteBoardCard({ card, onCreateJob }: QuoteBoardCardProps) {
  const isDone = card.lane === 'done'
  const showCreateJob = isDone && card.quoteStatus === 'accepted' && onCreateJob

  const cardEl = (
    <div
      role="article"
      aria-label={`Quote for ${card.customerName}: ${card.description}`}
      className={quoteCardContainerClass()}
    >
      <QuoteCardBody card={card} />
    </div>
  )

  const linked = (
    <div>
      <Link href={`/quotes/${card.quoteId}`} className="block">
        {cardEl}
      </Link>
      {showCreateJob && (
        <div className="mt-1">
          <Button
            variant="ghost"
            size="xs"
            className="text-action hover:text-action-hover"
            onClick={onCreateJob}
          >
            <Plus className="size-3" />
            Create Job
          </Button>
        </div>
      )}
    </div>
  )

  if (card.notes.length === 0) return linked

  const internalNotes = card.notes.filter((n) => n.type === 'internal')
  const customerNotes = card.notes.filter((n) => n.type === 'customer')

  return (
    <Tooltip>
      <TooltipTrigger asChild>{linked}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-60 p-3">
        <div className="flex flex-col gap-2">
          {internalNotes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Internal
              </p>
              {internalNotes.map((note, i) => (
                <div key={`internal-${i}`} className="flex items-start gap-1.5 text-xs">
                  <MessageSquare className="size-3.5 shrink-0 mt-px text-muted-foreground" />
                  <span className="text-foreground">{note.content}</span>
                </div>
              ))}
            </div>
          )}
          {customerNotes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </p>
              {customerNotes.map((note, i) => (
                <div key={`customer-${i}`} className="flex items-start gap-1.5 text-xs">
                  <User className="size-3.5 shrink-0 mt-px text-action" />
                  <span className="text-foreground">{note.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
