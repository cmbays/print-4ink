'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, AlertTriangle, Plus } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { MobileLaneTabBar } from './MobileLaneTabBar'
import { BlockReasonSheet } from '@features/quotes/components/BlockReasonSheet'
import { JobCardBody, jobCardContainerClass } from './JobCardBody'
import { QuoteCardBody, quoteCardContainerClass } from './QuoteCardBody'
import { Button } from '@shared/ui/primitives/button'
import type { JobCard, QuoteCard, ScratchNoteCard, BoardCard } from '@domain/entities/board-card'
import type { Lane } from '@domain/entities/job'

const LANES: Lane[] = ['ready', 'in_progress', 'review', 'blocked', 'done']

const NEXT_LANE_LABEL: Record<string, string> = {
  ready: 'In Progress',
  in_progress: 'Review',
  review: 'Done',
  blocked: 'Ready',
}

// ---------------------------------------------------------------------------
// Section filter type
// ---------------------------------------------------------------------------

type SectionFilter = 'all' | 'jobs' | 'quotes'

// ---------------------------------------------------------------------------
// MobileJobCard — shared body + mobile-only touch actions
// ---------------------------------------------------------------------------

function MobileJobCard({
  job,
  activeLane,
  onMoveToNext,
  onBlock,
}: {
  job: JobCard
  activeLane: Lane
  onMoveToNext: () => void
  onBlock: () => void
}) {
  return (
    <div className={jobCardContainerClass(job, 'p-4')}>
      <Link href={`/jobs/${job.id}`} className="block">
        <JobCardBody card={job} />
      </Link>

      {/* Quick actions — two-speed workflow (mobile-only) */}
      {activeLane !== 'done' && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          {NEXT_LANE_LABEL[activeLane] && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-(--mobile-touch-target) flex-1"
              onClick={(e) => {
                e.preventDefault()
                onMoveToNext()
              }}
            >
              Move to {NEXT_LANE_LABEL[activeLane]}
              <ArrowRight className="ml-1 size-4" />
            </Button>
          )}
          {activeLane !== 'blocked' && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-(--mobile-touch-target) text-warning"
              onClick={(e) => {
                e.preventDefault()
                onBlock()
              }}
            >
              <AlertTriangle className="size-4" />
            </Button>
          )}
        </div>
      )}

      {/* Block reason display */}
      {job.lane === 'blocked' && job.blockReason && (
        <div className="mt-2 rounded bg-warning/10 px-3 py-2 text-xs text-warning">
          {job.blockReason}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MobileQuoteCard — shared body + mobile touch target padding
// ---------------------------------------------------------------------------

function MobileQuoteCard({ quote }: { quote: QuoteCard }) {
  return (
    <Link href={`/quotes/${quote.quoteId}`} className="block">
      <div className={quoteCardContainerClass('p-4')}>
        <QuoteCardBody card={quote} />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// MobileKanbanBoard
// ---------------------------------------------------------------------------

type MobileKanbanBoardProps = {
  jobCards: JobCard[]
  quoteCards: QuoteCard[]
  scratchNotes: ScratchNoteCard[]
  onMoveCard: (card: BoardCard, targetLane: Lane, blockReason?: string) => void
  onAddScratchNote: () => void
}

export function MobileKanbanBoard({
  jobCards,
  quoteCards,
  scratchNotes,
  onMoveCard,
  onAddScratchNote,
}: MobileKanbanBoardProps) {
  const [activeLane, setActiveLane] = useState<Lane>('in_progress')
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all')
  const [blockingJob, setBlockingJob] = useState<JobCard | null>(null)

  // Compute card counts for all lanes
  const cardCounts = LANES.reduce(
    (acc, lane) => ({
      ...acc,
      [lane]:
        jobCards.filter((j) => j.lane === lane).length +
        quoteCards.filter((q) => q.lane === lane).length +
        (lane === 'ready' ? scratchNotes.filter((n) => !n.isArchived).length : 0),
    }),
    {} as Record<string, number>
  )

  // Cards in active lane
  const jobsInLane = jobCards.filter((j) => j.lane === activeLane)
  const quotesInLane = quoteCards.filter((q) => q.lane === activeLane)
  const notesInLane = activeLane === 'ready' ? scratchNotes.filter((n) => !n.isArchived) : []

  // Apply section filter
  const showJobs = sectionFilter === 'all' || sectionFilter === 'jobs'
  const showQuotes = sectionFilter === 'all' || sectionFilter === 'quotes'
  const hasCards =
    (showJobs && jobsInLane.length > 0) ||
    (showQuotes && (quotesInLane.length > 0 || notesInLane.length > 0))

  return (
    <div className="flex flex-col gap-0 md:hidden">
      {/* Section toggle: All / Jobs / Quotes */}
      <div
        className="flex items-center gap-1 border-b border-border px-4 py-2"
        role="tablist"
        aria-label="Card type filter"
      >
        {(['all', 'jobs', 'quotes'] as const).map((filter) => (
          <button
            key={filter}
            role="tab"
            aria-selected={sectionFilter === filter}
            onClick={() => setSectionFilter(filter)}
            className={cn(
              'min-h-(--mobile-touch-target) rounded-full px-3 py-1 text-xs font-medium transition-colors',
              sectionFilter === filter
                ? 'bg-action/10 text-action'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {filter === 'all' ? 'All' : filter === 'jobs' ? 'Jobs' : 'Quotes'}
          </button>
        ))}
      </div>

      <MobileLaneTabBar
        lanes={LANES}
        activeLane={activeLane}
        onLaneChange={setActiveLane}
        cardCounts={cardCounts}
      />

      <div className="relative flex flex-col gap-(--mobile-card-gap) p-4">
        {!hasCards ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No cards in this lane</p>
        ) : (
          <>
            {/* Scratch notes in Ready lane */}
            {showQuotes &&
              notesInLane.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-dashed border-border bg-surface p-3 text-sm text-muted-foreground"
                >
                  {note.content}
                </div>
              ))}

            {/* Quote cards */}
            {showQuotes &&
              quotesInLane.map((quote) => <MobileQuoteCard key={quote.quoteId} quote={quote} />)}

            {/* Job cards */}
            {showJobs &&
              jobsInLane.map((job) => (
                <MobileJobCard
                  key={job.id}
                  job={job}
                  activeLane={activeLane}
                  onMoveToNext={() => {
                    const currentIndex = LANES.indexOf(activeLane)
                    const nextLane = LANES[currentIndex + 1]
                    if (nextLane && nextLane !== 'blocked') {
                      onMoveCard(job, nextLane)
                    }
                  }}
                  onBlock={() => {
                    setBlockingJob(job)
                  }}
                />
              ))}
          </>
        )}

        {/* FAB "+" button for adding scratch notes */}
        <button
          onClick={onAddScratchNote}
          className="fixed bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-40 flex h-(--mobile-fab-size) w-(--mobile-fab-size) items-center justify-center rounded-full bg-action text-primary-foreground shadow-lg md:hidden"
          aria-label="Add scratch note"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {/* Block Reason Sheet — conditional rendering for state reset */}
      {blockingJob && (
        <BlockReasonSheet
          open={!!blockingJob}
          onOpenChange={(open) => {
            if (!open) setBlockingJob(null)
          }}
          jobTitle={`${blockingJob.jobNumber} — ${blockingJob.customerName}`}
          onConfirm={(reason) => {
            onMoveCard(blockingJob, 'blocked', reason)
            setBlockingJob(null)
          }}
        />
      )}
    </div>
  )
}
