"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DropAnimation,
} from "@dnd-kit/core";
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
  useLayoutFromURL,
} from "../_components/BoardFilterBar";
import { BoardSection } from "../_components/BoardSection";
import { JobBoardCard } from "../_components/JobBoardCard";
import { QuoteBoardCard } from "../_components/QuoteBoardCard";
import { ScratchNoteCard } from "../_components/ScratchNoteCard";
import { DraggableCard } from "../_components/DraggableCard";
import { BlockReasonDialog } from "../_components/BlockReasonDialog";
import { ScratchNoteCapture } from "../_components/ScratchNoteCapture";
import {
  computeCapacitySummary,
  computeFilteredCards,
  computeTaskProgress,
} from "@/lib/helpers/job-utils";
import {
  jobs as initialJobs,
  quoteCards as initialQuoteCards,
  scratchNotes as initialScratchNotes,
  customers,
  invoices,
} from "@/lib/mock-data";
import type { BoardCard, JobCard, QuoteCard, ScratchNoteCard as ScratchNoteCardType } from "@/lib/schemas/board-card";
import { laneEnum } from "@/lib/schemas/job";
import type { Job, Lane } from "@/lib/schemas/job";

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
    colorCount: job.printLocations.reduce((sum, loc) => sum + loc.colorCount, 0),
    startDate: job.startDate,
    dueDate: job.dueDate,
    riskLevel: job.riskLevel,
    priority: job.priority,
    taskProgress: { completed: progress.completed, total: progress.total },
    tasks: [...job.tasks]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => ({ label: t.label, isCompleted: t.isCompleted })),
    assigneeInitials: job.assigneeInitials,
    sourceQuoteId: job.sourceQuoteId,
    invoiceId: job.invoiceId,
    invoiceStatus: invoice?.status,
    blockReason: job.blockReason,
    orderTotal: job.orderTotal,
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
// Helpers: parse drag IDs
// ---------------------------------------------------------------------------

/** Drag IDs are "job:{uuid}", "quote:{quoteId}", "scratch:{uuid}" */
function parseDragId(dragId: string): { cardType: string; cardId: string } {
  const idx = dragId.indexOf(":");
  return { cardType: dragId.slice(0, idx), cardId: dragId.slice(idx + 1) };
}

/** Droppable IDs are "{section}:{lane}" */
function parseDroppableId(droppableId: string): { section: string; lane: Lane } | null {
  const idx = droppableId.indexOf(":");
  if (idx === -1) return null;
  const parsed = laneEnum.safeParse(droppableId.slice(idx + 1));
  if (!parsed.success) return null;
  return {
    section: droppableId.slice(0, idx),
    lane: parsed.data,
  };
}

/** Map card type to section for same-row constraint */
function cardTypeToSection(cardType: string): string {
  if (cardType === "job") return "jobs";
  return "quotes"; // quote and scratch are in quotes section
}

// ---------------------------------------------------------------------------
// Card label for dialogs
// ---------------------------------------------------------------------------

function getCardLabel(card: BoardCard): string {
  switch (card.type) {
    case "job":
      return `${card.jobNumber}: ${card.customerName}`;
    case "quote":
      return `Quote: ${card.customerName}`;
    case "scratch_note":
      return `Note: ${card.content.slice(0, 40)}`;
  }
}

// ---------------------------------------------------------------------------
// Inner board (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

/** Get due date for sorting (scratch notes have no due date → sort to top) */
function getCardSortDate(card: BoardCard): string {
  if (card.type === "scratch_note") return "0000-00-00"; // sort to top
  if (card.type === "job") return card.dueDate;
  return card.dueDate ?? "9999-99-99"; // quotes without due date sort to bottom
}

const springDropAnimation: DropAnimation = {
  sideEffects({ active, dragOverlay }) {
    active.node.style.opacity = "0";
    // Spring settle: scale back to 1, remove rotation
    dragOverlay.node.animate(
      [
        { transform: "scale(1.03) rotate(2deg)", opacity: 0.9 },
        { transform: "scale(1) rotate(0deg)", opacity: 1 },
      ],
      {
        duration: 250,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    );
    return () => {
      active.node.style.opacity = "";
    };
  },
  duration: 250,
  easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  keyframes({ transform }) {
    return [
      { ...transform.initial },
      {
        ...transform.final,
        scale: "1",
        rotate: "0deg",
      },
    ];
  },
};

function ProductionBoardInner() {
  const filters = useFiltersFromURL();
  const layout = useLayoutFromURL();

  // ---- Mutable state (Phase 1 client-side only) ----
  const [jobCards, setJobCards] = useState<JobCard[]>(() =>
    initialJobs.filter((j) => !j.isArchived).map(projectJobToCard),
  );
  const [quoteCardState, setQuoteCardState] = useState<QuoteCard[]>(() => [...initialQuoteCards]);
  const [scratchNoteCards, setScratchNoteCards] = useState<ScratchNoteCardType[]>(() =>
    initialScratchNotes
      .filter((n) => !n.isArchived)
      .map(projectScratchNoteToCard),
  );

  // ---- DnD state ----
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);

  // ---- Block dialog state ----
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    card: BoardCard | null;
  }>({ open: false, card: null });

  // ---- Scratch note capture state ----
  const [showScratchCapture, setShowScratchCapture] = useState(false);

  // ---- Sensors ----
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 3 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  // ---- Combine quote-row cards ----
  const quoteRowCards: BoardCard[] = useMemo(
    () => [...quoteCardState, ...scratchNoteCards],
    [quoteCardState, scratchNoteCards],
  );

  // ---- Apply filters ----
  const filteredJobCards = useMemo(
    () => computeFilteredCards(jobCards, filters),
    [jobCards, filters],
  );
  const filteredQuoteCards = useMemo(
    () => computeFilteredCards(quoteRowCards, filters),
    [quoteRowCards, filters],
  );

  // ---- Combined mode: merge + sort by due date ----
  const combinedCards: BoardCard[] = useMemo(() => {
    if (layout !== "combined") return [];
    const merged = [...filteredJobCards, ...filteredQuoteCards];
    return merged.sort((a, b) =>
      getCardSortDate(a).localeCompare(getCardSortDate(b)),
    );
  }, [layout, filteredJobCards, filteredQuoteCards]);

  // ---- Capacity summary ----
  const allFilteredCards: BoardCard[] = useMemo(
    () => [...filteredJobCards, ...filteredQuoteCards],
    [filteredJobCards, filteredQuoteCards],
  );
  const summary = useMemo(
    () => computeCapacitySummary(allFilteredCards),
    [allFilteredCards],
  );

  const isEmpty = allFilteredCards.length === 0;

  // ---- Find a card by drag ID ----
  const findCard = useCallback(
    (dragId: string): BoardCard | undefined => {
      const { cardType, cardId } = parseDragId(dragId);
      if (cardType === "job") return jobCards.find((c) => c.id === cardId);
      if (cardType === "quote") return quoteCardState.find((c) => c.quoteId === cardId);
      if (cardType === "scratch") return scratchNoteCards.find((c) => c.id === cardId);
      return undefined;
    },
    [jobCards, quoteCardState, scratchNoteCards],
  );

  // ---- Move card to a new lane in state ----
  const moveCard = useCallback(
    (card: BoardCard, newLane: Lane, blockReason?: string) => {
      switch (card.type) {
        case "job":
          setJobCards((prev) =>
            prev.map((c) =>
              c.id === card.id
                ? {
                    ...c,
                    lane: newLane,
                    blockReason: newLane === "blocked" ? blockReason : undefined,
                  }
                : c,
            ),
          );
          break;
        case "quote":
          setQuoteCardState((prev) =>
            prev.map((c) =>
              c.quoteId === card.quoteId ? { ...c, lane: newLane } : c,
            ),
          );
          break;
        // scratch_note cards are always in "ready" — they can't be moved
      }
    },
    [],
  );

  // ===========================================================================
  // Drag handlers
  // ===========================================================================

  function handleDragStart(event: DragStartEvent) {
    const card = findCard(event.active.id as string);
    if (card) {
      setActiveCard(card);

    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || !active) {

      return;
    }

    const { cardType } = parseDragId(active.id as string);
    const dropTarget = parseDroppableId(over.id as string);
    if (!dropTarget) return;
    const { section: targetSection, lane: targetLane } = dropTarget;
    const sourceSection = cardTypeToSection(cardType);

    // Same-row constraint: in split mode, quotes stay in quotes, jobs stay in jobs
    if (layout === "split" && sourceSection !== targetSection) {
      return;
    }

    // In combined mode, only allow drops on the "combined" section
    if (layout === "combined" && targetSection !== "combined") {
      return;
    }

    // Scratch notes can't be moved
    if (cardType === "scratch") {

      return;
    }

    const card = findCard(active.id as string);
    if (!card || card.lane === targetLane) {

      return;
    }

    // If target is blocked → open block reason dialog
    if (targetLane === "blocked") {
      setBlockDialog({ open: true, card });
      return;
    }

    // Direct move
    moveCard(card, targetLane);

  }

  function handleDragCancel() {
    setActiveCard(null);

  }

  // ===========================================================================
  // Block dialog handlers
  // ===========================================================================

  function confirmBlock(reason: string) {
    if (blockDialog.card) {
      moveCard(blockDialog.card, "blocked", reason);
    }
    setBlockDialog({ open: false, card: null });

  }

  function cancelBlock() {
    // Card stays in original position (no state change needed)
    setBlockDialog({ open: false, card: null });

  }

  // ===========================================================================
  // Scratch note CRUD
  // ===========================================================================

  function createScratchNote(content: string) {
    const newNote: ScratchNoteCardType = {
      type: "scratch_note",
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      isArchived: false,
      lane: "ready",
    };
    setScratchNoteCards((prev) => [newNote, ...prev]);
    setShowScratchCapture(false);
  }

  const dismissScratchNote = useCallback((noteId: string) => {
    setScratchNoteCards((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  const editScratchNote = useCallback((noteId: string, newContent: string) => {
    setScratchNoteCards((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, content: newContent } : n)),
    );
  }, []);

  // ===========================================================================
  // Card renderer (dispatches by type, wraps in DraggableCard)
  // ===========================================================================

  const renderCard = useCallback(
    (card: BoardCard): React.ReactNode => {
      switch (card.type) {
        case "job": {
          const dragId = `job:${card.id}`;
          return (
            <DraggableCard
              dragId={dragId}
              data={{ cardType: "job", cardId: card.id, section: "jobs" }}
            >
              <JobBoardCard card={card} />
            </DraggableCard>
          );
        }
        case "quote": {
          const dragId = `quote:${card.quoteId}`;
          return (
            <DraggableCard
              dragId={dragId}
              data={{ cardType: "quote", cardId: card.quoteId, section: "quotes" }}
            >
              <QuoteBoardCard card={card} />
            </DraggableCard>
          );
        }
        case "scratch_note":
          return (
            <ScratchNoteCard
              card={card}
              onDismiss={() => dismissScratchNote(card.id)}
              onEdit={editScratchNote}
            />
          );
      }
    },
    [dismissScratchNote, editScratchNote],
  );

  // ===========================================================================
  // Drag overlay renderer
  // ===========================================================================

  function renderDragOverlay() {
    if (!activeCard) return null;
    switch (activeCard.type) {
      case "job":
        return (
          <div className="w-[200px] scale-[1.03] rotate-2 opacity-90 shadow-xl transition-transform duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <JobBoardCard card={activeCard} />
          </div>
        );
      case "quote":
        return (
          <div className="w-[200px] scale-[1.03] rotate-2 opacity-90 shadow-xl transition-transform duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <QuoteBoardCard card={activeCard} />
          </div>
        );
      case "scratch_note":
        return (
          <div className="w-[200px] scale-[1.03] rotate-2 opacity-90 shadow-xl transition-transform duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <ScratchNoteCard card={activeCard} />
          </div>
        );
    }
  }

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
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <TooltipProvider skipDelayDuration={300}>
            {layout === "combined" ? (
              <div className="flex flex-col gap-6">
                <BoardSection
                  label="All Cards"
                  section="combined"
                  cards={combinedCards}
                  renderCard={renderCard}
                  onAddScratchNote={() => setShowScratchCapture(true)}
                  readyLaneFooter={
                    showScratchCapture ? (
                      <ScratchNoteCapture
                        onSubmit={createScratchNote}
                        onCancel={() => setShowScratchCapture(false)}
                      />
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Quotes section */}
                <BoardSection
                  label="Quotes"
                  section="quotes"
                  cards={filteredQuoteCards}
                  renderCard={renderCard}
                  onAddScratchNote={() => setShowScratchCapture(true)}
                  readyLaneFooter={
                    showScratchCapture ? (
                      <ScratchNoteCapture
                        onSubmit={createScratchNote}
                        onCancel={() => setShowScratchCapture(false)}
                      />
                    ) : undefined
                  }
                />

                {/* Jobs section */}
                <BoardSection
                  label="Jobs"
                  section="jobs"
                  cards={filteredJobCards}
                  renderCard={renderCard}
                />
              </div>
            )}
          </TooltipProvider>

          <DragOverlay dropAnimation={springDropAnimation}>
            {renderDragOverlay()}
          </DragOverlay>
        </DndContext>
      )}

      {/* Block Reason Dialog */}
      {blockDialog.card && (
        <BlockReasonDialog
          open={blockDialog.open}
          onOpenChange={(open) => {
            if (!open) cancelBlock();
          }}
          cardLabel={getCardLabel(blockDialog.card)}
          onConfirm={confirmBlock}
          onCancel={cancelBlock}
        />
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
