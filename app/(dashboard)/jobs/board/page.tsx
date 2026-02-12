"use client";

import { useMemo, Suspense } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CapacitySummaryBar } from "../_components/CapacitySummaryBar";
import {
  BoardFilterBar,
  useFiltersFromURL,
} from "../_components/BoardFilterBar";
import { BoardSection } from "../_components/BoardSection";
import { JobBoardCard } from "../_components/JobBoardCard";
import { QuoteBoardCard } from "../_components/QuoteBoardCard";
import { ScratchNoteCard } from "../_components/ScratchNoteCard";
import {
  computeCapacitySummary,
  computeFilteredCards,
  computeTaskProgress,
} from "@/lib/helpers/job-utils";
import {
  jobs,
  quoteCards,
  scratchNotes,
  customers,
  invoices,
} from "@/lib/mock-data";
import type { BoardCard } from "@/lib/schemas/board-card";
import type { JobCard, ScratchNoteCard as ScratchNoteCardType } from "@/lib/schemas/board-card";
import type { Job } from "@/lib/schemas/job";

// ---------------------------------------------------------------------------
// Projection: Job → JobCard view model
// ---------------------------------------------------------------------------

function projectJobToCard(job: Job): JobCard {
  const customer = customers.find((c) => c.id === job.customerId);
  const progress = computeTaskProgress(job.tasks);
  const invoice = job.invoiceId
    ? invoices.find((inv) => inv.id === job.invoiceId)
    : undefined;

  return {
    type: "job",
    id: job.id,
    jobNumber: job.jobNumber,
    title: job.title,
    customerId: job.customerId,
    customerName: customer?.company ?? "Unknown",
    lane: job.lane,
    serviceType: job.serviceType,
    quantity: job.quantity,
    locationCount: job.complexity.locationCount,
    startDate: job.startDate,
    dueDate: job.dueDate,
    riskLevel: job.riskLevel,
    priority: job.priority,
    taskProgress: { completed: progress.completed, total: progress.total },
    assigneeInitials: job.assigneeInitials,
    sourceQuoteId: job.sourceQuoteId,
    invoiceId: job.invoiceId,
    invoiceStatus: invoice?.status,
    blockReason: job.blockReason,
  };
}

// ---------------------------------------------------------------------------
// Projection: ScratchNote → ScratchNoteCard view model
// ---------------------------------------------------------------------------

function projectScratchNoteToCard(
  note: { id: string; content: string; createdAt: string; isArchived: boolean },
): ScratchNoteCardType {
  return {
    type: "scratch_note",
    id: note.id,
    content: note.content,
    createdAt: note.createdAt,
    isArchived: note.isArchived,
    lane: "ready",
  };
}

// ---------------------------------------------------------------------------
// Card renderer (dispatches by type)
// ---------------------------------------------------------------------------

function renderCard(card: BoardCard): React.ReactNode {
  switch (card.type) {
    case "job":
      return <JobBoardCard card={card} />;
    case "quote":
      return <QuoteBoardCard card={card} />;
    case "scratch_note":
      return <ScratchNoteCard card={card} />;
  }
}

// ---------------------------------------------------------------------------
// Inner board (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function ProductionBoardInner() {
  const filters = useFiltersFromURL();

  // Build all board cards
  const allJobCards = useMemo(
    () => jobs.filter((j) => !j.isArchived).map(projectJobToCard),
    [],
  );
  const allQuoteCards = useMemo(() => quoteCards, []);
  const allScratchNoteCards = useMemo(
    () =>
      scratchNotes
        .filter((n) => !n.isArchived)
        .map(projectScratchNoteToCard),
    [],
  );

  // Combine quote-row cards: quoteCards + scratchNotes
  const quoteRowCards: BoardCard[] = useMemo(
    () => [...allQuoteCards, ...allScratchNoteCards],
    [allQuoteCards, allScratchNoteCards],
  );

  // Apply filters
  const filteredJobCards = useMemo(
    () => computeFilteredCards(allJobCards, filters),
    [allJobCards, filters],
  );
  const filteredQuoteCards = useMemo(
    () => computeFilteredCards(quoteRowCards, filters),
    [quoteRowCards, filters],
  );

  // Capacity summary (from all visible cards)
  const allFilteredCards: BoardCard[] = useMemo(
    () => [...filteredJobCards, ...filteredQuoteCards],
    [filteredJobCards, filteredQuoteCards],
  );
  const summary = useMemo(
    () => computeCapacitySummary(allFilteredCards),
    [allFilteredCards],
  );

  // Empty board state
  const isEmpty = allFilteredCards.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Capacity summary */}
      <CapacitySummaryBar summary={summary} />

      {/* Filter bar */}
      <BoardFilterBar />

      {/* Board content */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No cards match the current filters.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting or clearing your filters.
          </p>
        </div>
      ) : (
        <TooltipProvider skipDelayDuration={300}>
          <div className="flex flex-col gap-6">
            {/* Quotes section */}
            <BoardSection
              label="Quotes"
              cards={filteredQuoteCards}
              renderCard={renderCard}
            />

            {/* Jobs section */}
            <BoardSection
              label="Jobs"
              cards={filteredJobCards}
              renderCard={renderCard}
            />
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProductionBoardPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/jobs/board">Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Board</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-foreground">
          Production Board
        </h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div role="group" aria-label="View mode" className="flex items-center rounded-md border border-border/50 p-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              className="bg-surface text-foreground"
              aria-label="Board view"
              aria-pressed="true"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label="List view"
              aria-pressed="false"
              asChild
            >
              <Link href="/jobs">
                <List className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* New Quote */}
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/quotes/new">
              <Plus className="size-3.5" />
              New Quote
            </Link>
          </Button>
        </div>
      </div>

      {/* Board (wrapped in Suspense for useSearchParams) */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading board…
          </div>
        }
      >
        <ProductionBoardInner />
      </Suspense>
    </div>
  );
}
