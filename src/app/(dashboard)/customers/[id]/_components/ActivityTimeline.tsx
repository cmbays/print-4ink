'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { ENTITY_STYLES } from '@domain/constants/entities'
import { ENTITY_ICONS } from '@/lib/constants/entity-icons'
import { Badge } from '@shared/ui/primitives/badge'
import { cn } from '@shared/lib/cn'
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  LANE_LABELS,
  LANE_COLORS,
  NOTE_CHANNEL_LABELS,
} from '@domain/constants'
import type { Quote } from '@domain/entities/quote'
import type { Job } from '@domain/entities/job'
import type { Note } from '@domain/entities/note'

type ActivityTimelineProps = {
  quotes: Quote[]
  jobs: Job[]
  notes: Note[]
  onSwitchTab?: (tab: string) => void
}

type TimelineItem =
  | { type: 'quote'; date: string; data: Quote }
  | { type: 'job'; date: string; data: Job }
  | { type: 'note'; date: string; data: Note }

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    // Future date
    if (absDays === 0) return 'Today'
    if (absDays === 1) return 'In 1 day'
    if (absDays < 7) return `In ${absDays} days`
    if (absDays < 30) {
      const weeks = Math.floor(absDays / 7)
      return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    }
    return date.toLocaleDateString()
  }

  if (absDays === 0) return 'Today'
  if (absDays === 1) return 'Yesterday'
  if (absDays < 7) return `${absDays} days ago`
  if (absDays < 30) {
    const weeks = Math.floor(absDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (absDays < 365) {
    const months = Math.floor(absDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  return date.toLocaleDateString()
}

const ICON_CONFIG = {
  quote: { icon: ENTITY_ICONS.quote, color: ENTITY_STYLES.quote.color },
  job: { icon: ENTITY_ICONS.job, color: ENTITY_STYLES.job.color },
  note: { icon: ENTITY_ICONS.scratch_note, color: ENTITY_STYLES.scratch_note.color },
} as const

export function ActivityTimeline({ quotes, jobs, notes, onSwitchTab }: ActivityTimelineProps) {
  const items: TimelineItem[] = [
    ...quotes.map((q) => ({ type: 'quote' as const, date: q.createdAt, data: q })),
    ...jobs.map((j) => ({ type: 'job' as const, date: j.dueDate, data: j })),
    ...notes.map((n) => ({ type: 'note' as const, date: n.createdAt, data: n })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="size-10 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-0" role="list" aria-label="Activity timeline">
      {/* Vertical connector line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border" aria-hidden="true" />

      {items.map((item, _index) => {
        const config = ICON_CONFIG[item.type]
        const Icon = config.icon

        return (
          <div
            key={`${item.type}-${item.data.id}`}
            className="relative flex gap-4 py-3 first:pt-0 last:pb-0"
            role="listitem"
          >
            {/* Icon node */}
            {item.type === 'quote' ? (
              <Link
                href={`/quotes/${item.data.id}`}
                className={cn(
                  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated border border-border transition-all',
                  'hover:ring-2 hover:ring-action/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  config.color
                )}
                aria-label={`View quote ${item.data.quoteNumber}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </Link>
            ) : item.type === 'note' ? (
              <button
                type="button"
                onClick={() => onSwitchTab?.('notes')}
                className={cn(
                  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated border border-border transition-all',
                  'hover:ring-2 hover:ring-action/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  config.color
                )}
                aria-label="Go to notes tab"
              >
                <Icon className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <div
                className={cn(
                  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated border border-border',
                  config.color
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <TimelineContent item={item} onSwitchTab={onSwitchTab} />
              <p className="text-xs text-muted-foreground mt-1">{relativeDate(item.date)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TimelineContent({
  item,
  onSwitchTab,
}: {
  item: TimelineItem
  onSwitchTab?: (tab: string) => void
}) {
  switch (item.type) {
    case 'quote': {
      const quote = item.data
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/quotes/${quote.id}`}
            className="text-sm font-medium text-foreground hover:text-action transition-colors"
          >
            Quote {quote.quoteNumber} created
          </Link>
          <Badge variant="ghost" className={QUOTE_STATUS_COLORS[quote.status]}>
            {QUOTE_STATUS_LABELS[quote.status]}
          </Badge>
        </div>
      )
    }
    case 'job': {
      const job = item.data
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Job {job.jobNumber} — {job.title}
          </span>
          <Badge variant="ghost" className={LANE_COLORS[job.lane]}>
            {LANE_LABELS[job.lane]}
          </Badge>
        </div>
      )
    }
    case 'note': {
      const note = item.data
      const truncated = note.content.length > 80 ? note.content.slice(0, 80) + '...' : note.content
      return (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchTab?.('notes')}
            className="text-sm text-foreground hover:text-action transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {truncated}
          </button>
          {note.channel && (
            <Badge variant="ghost" className="text-muted-foreground">
              {NOTE_CHANNEL_LABELS[note.channel]}
            </Badge>
          )}
        </div>
      )
    }
  }
}
