"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useReducedMotion } from "framer-motion";
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
import { LANE_LABELS } from "@/lib/constants";
import {
  computeCapacitySummary,
  computeFilteredCards,
} from "@/lib/helpers/job-utils";
import {
  projectJobToCard,
  projectScratchNoteToCard,
} from "@/lib/helpers/board-projections";
import {
  parseDragId,
  parseDroppableId,
  cardTypeToSection,
  getCardLabel,
  getCardSortDate,
} from "@/lib/helpers/board-dnd";
import {
  jobs as initialJobs,
  quoteCards as initialQuoteCards,
  scratchNotes as initialScratchNotes,
} from "@/lib/mock-data";
import type { BoardCard, JobCard, QuoteCard, ScratchNoteCard as ScratchNoteCardType } from "@/lib/schemas/board-card";
import type { Lane } from "@/lib/schemas/job";

// ---------------------------------------------------------------------------
// Inner board (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

const SPRING_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

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
        easing: SPRING_EASING,
      },
    );
    return () => {
      active.node.style.opacity = "";
    };
  },
  duration: 250,
  easing: SPRING_EASING,
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
  const prefersReducedMotion = useReducedMotion();

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
  const [dropAnnouncement, setDropAnnouncement] = useState("");

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
      const parsed = parseDragId(dragId);
      if (!parsed) return undefined;
      const { cardType, cardId } = parsed;
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

    const dragParsed = parseDragId(active.id as string);
    if (!dragParsed) return;
    const { cardType } = dragParsed;
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
    setDropAnnouncement(
      `${getCardLabel(card)} moved to ${LANE_LABELS[targetLane]}`,
    );
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

  function DragOverlayWrapper({ children }: { children: React.ReactNode }) {
    return (
      <div
        className="w-50 scale-[1.03] rotate-2 opacity-90 shadow-xl transition-transform duration-200"
        style={prefersReducedMotion ? undefined : { transitionTimingFunction: "var(--transition-timing-spring)" }}
      >
        {children}
      </div>
    );
  }

  function renderDragOverlay() {
    if (!activeCard) return null;
    switch (activeCard.type) {
      case "job":
        return <DragOverlayWrapper><JobBoardCard card={activeCard} /></DragOverlayWrapper>;
      case "quote":
        return <DragOverlayWrapper><QuoteBoardCard card={activeCard} /></DragOverlayWrapper>;
      case "scratch_note":
        return <DragOverlayWrapper><ScratchNoteCard card={activeCard} /></DragOverlayWrapper>;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Accessibility: DnD instructions (visually hidden) */}
      <div id="dnd-instructions" className="sr-only">
        Press space bar to start dragging a card. While dragging, use arrow keys
        to move. Press space bar again to drop the card in the current lane, or
        press escape to cancel.
      </div>
      {/* Accessibility: drop announcements */}
      <div aria-live="polite" className="sr-only">
        {dropAnnouncement}
      </div>

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

            <DragOverlay dropAnimation={prefersReducedMotion ? undefined : springDropAnimation}>
              {renderDragOverlay()}
            </DragOverlay>
          </TooltipProvider>
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
