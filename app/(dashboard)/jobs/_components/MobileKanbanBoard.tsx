"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileLaneTabBar } from "./MobileLaneTabBar";
import { BlockReasonSheet } from "@/components/features/BlockReasonSheet";
import { ServiceTypeBadge } from "@/components/features/ServiceTypeBadge";
import { RiskIndicator } from "@/components/features/RiskIndicator";
import { TaskProgressBar } from "@/components/features/TaskProgressBar";
import { Button } from "@/components/ui/button";
import type {
  JobCard,
  QuoteCard,
  ScratchNoteCard,
  BoardCard,
} from "@/lib/schemas/board-card";
import type { Lane } from "@/lib/schemas/job";

const LANES: Lane[] = ["ready", "in_progress", "review", "blocked", "done"];

const NEXT_LANE_LABEL: Record<string, string> = {
  ready: "In Progress",
  in_progress: "Review",
  review: "Done",
  blocked: "Ready",
};

// ---------------------------------------------------------------------------
// Section filter type
// ---------------------------------------------------------------------------

type SectionFilter = "all" | "jobs" | "quotes";

// ---------------------------------------------------------------------------
// MobileJobCard
// ---------------------------------------------------------------------------

function MobileJobCard({
  job,
  activeLane,
  onMoveToNext,
  onBlock,
}: {
  job: JobCard;
  activeLane: Lane;
  onMoveToNext: () => void;
  onBlock: () => void;
}) {
  const { taskProgress } = job;

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{job.jobNumber}</p>
            <p className="truncate text-sm font-medium text-foreground">
              {job.customerName} — {job.title}
            </p>
          </div>
          <RiskIndicator riskLevel={job.riskLevel} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <ServiceTypeBadge serviceType={job.serviceType} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="size-3" />
            {job.quantity}
          </span>
          {job.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {new Date(job.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="mt-2">
          <TaskProgressBar
            completed={taskProgress.completed}
            total={taskProgress.total}
          />
        </div>
      </Link>

      {/* Quick actions — two-speed workflow */}
      {activeLane !== "done" && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          {NEXT_LANE_LABEL[activeLane] && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-(--mobile-touch-target) flex-1"
              onClick={(e) => {
                e.preventDefault();
                onMoveToNext();
              }}
            >
              Move to {NEXT_LANE_LABEL[activeLane]}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {activeLane !== "blocked" && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-(--mobile-touch-target) text-warning"
              onClick={(e) => {
                e.preventDefault();
                onBlock();
              }}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Block reason display */}
      {job.lane === "blocked" && job.blockReason && (
        <div className="mt-2 rounded bg-warning/10 px-3 py-2 text-xs text-warning">
          {job.blockReason}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MobileQuoteCard
// ---------------------------------------------------------------------------

function MobileQuoteCard({ quote }: { quote: QuoteCard }) {
  return (
    <div className="rounded-lg border border-purple/30 bg-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-purple">Quote</p>
          <p className="truncate text-sm font-medium text-foreground">
            {quote.customerName} — {quote.description}
          </p>
        </div>
        {quote.isNew && (
          <span className="rounded-full bg-action/20 px-2 py-0.5 text-xs text-action">
            New
          </span>
        )}
      </div>
      {quote.total != null && (
        <p className="mt-1 text-xs text-muted-foreground">
          ${quote.total.toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MobileKanbanBoard
// ---------------------------------------------------------------------------

interface MobileKanbanBoardProps {
  jobCards: JobCard[];
  quoteCards: QuoteCard[];
  scratchNotes: ScratchNoteCard[];
  onMoveCard: (card: BoardCard, targetLane: Lane, blockReason?: string) => void;
  onAddScratchNote: () => void;
}

export function MobileKanbanBoard({
  jobCards,
  quoteCards,
  scratchNotes,
  onMoveCard,
  onAddScratchNote,
}: MobileKanbanBoardProps) {
  const [activeLane, setActiveLane] = useState<Lane>("in_progress");
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all");
  const [blockingJob, setBlockingJob] = useState<JobCard | null>(null);

  // Compute card counts for all lanes
  const cardCounts = LANES.reduce(
    (acc, lane) => ({
      ...acc,
      [lane]: jobCards.filter((j) => j.lane === lane).length +
        quoteCards.filter((q) => q.lane === lane).length +
        (lane === "ready" ? scratchNotes.filter((n) => !n.isArchived).length : 0),
    }),
    {} as Record<string, number>
  );

  // Cards in active lane
  const jobsInLane = jobCards.filter((j) => j.lane === activeLane);
  const quotesInLane = quoteCards.filter((q) => q.lane === activeLane);
  const notesInLane =
    activeLane === "ready"
      ? scratchNotes.filter((n) => !n.isArchived)
      : [];

  // Apply section filter
  const showJobs = sectionFilter === "all" || sectionFilter === "jobs";
  const showQuotes = sectionFilter === "all" || sectionFilter === "quotes";
  const hasCards =
    (showJobs && jobsInLane.length > 0) ||
    (showQuotes && (quotesInLane.length > 0 || notesInLane.length > 0));

  return (
    <div className="flex flex-col gap-0 md:hidden">
      {/* Section toggle: All / Jobs / Quotes */}
      <div className="flex items-center gap-1 border-b border-border px-4 py-2" role="tablist" aria-label="Card type filter">
        {(["all", "jobs", "quotes"] as const).map((filter) => (
          <button
            key={filter}
            role="tab"
            aria-selected={sectionFilter === filter}
            onClick={() => setSectionFilter(filter)}
            className={cn(
              "min-h-(--mobile-touch-target) rounded-full px-3 py-1 text-xs font-medium transition-colors",
              sectionFilter === filter
                ? "bg-action/10 text-action"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {filter === "all" ? "All" : filter === "jobs" ? "Jobs" : "Quotes"}
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
          <p className="py-12 text-center text-sm text-muted-foreground">
            No cards in this lane
          </p>
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
              quotesInLane.map((quote) => (
                <MobileQuoteCard key={quote.quoteId} quote={quote} />
              ))}

            {/* Job cards */}
            {showJobs &&
              jobsInLane.map((job) => (
                <MobileJobCard
                  key={job.id}
                  job={job}
                  activeLane={activeLane}
                  onMoveToNext={() => {
                    const currentIndex = LANES.indexOf(activeLane);
                    const nextLane = LANES[currentIndex + 1];
                    if (nextLane && nextLane !== "blocked") {
                      onMoveCard(job, nextLane);
                    }
                  }}
                  onBlock={() => { setBlockingJob(job); }}
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
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Block Reason Sheet — conditional rendering for state reset */}
      {blockingJob && (
        <BlockReasonSheet
          open={!!blockingJob}
          onOpenChange={(open) => {
            if (!open) setBlockingJob(null);
          }}
          jobTitle={`${blockingJob.jobNumber} — ${blockingJob.customerName}`}
          onConfirm={(reason) => {
            onMoveCard(blockingJob, "blocked", reason);
            setBlockingJob(null);
          }}
        />
      )}
    </div>
  );
}
