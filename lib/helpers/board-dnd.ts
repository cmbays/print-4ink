import { laneEnum } from "@/lib/schemas/job";
import type { Lane } from "@/lib/schemas/job";
import type { BoardCard } from "@/lib/schemas/board-card";

/** Drag IDs are "job:{uuid}", "quote:{quoteId}", "scratch:{uuid}" */
export function parseDragId(dragId: string): { cardType: string; cardId: string } | null {
  const idx = dragId.indexOf(":");
  if (idx === -1) return null;
  return { cardType: dragId.slice(0, idx), cardId: dragId.slice(idx + 1) };
}

/** Droppable IDs are "{section}:{lane}" */
export function parseDroppableId(droppableId: string): { section: string; lane: Lane } | null {
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
export function cardTypeToSection(cardType: string): string {
  if (cardType === "job") return "jobs";
  return "quotes"; // quote and scratch are in quotes section
}

/** Get display label for a card (used in dialogs) */
export function getCardLabel(card: BoardCard): string {
  switch (card.type) {
    case "job":
      return `${card.jobNumber}: ${card.customerName}`;
    case "quote":
      return `Quote: ${card.customerName}`;
    case "scratch_note":
      return `Note: ${card.content.slice(0, 40)}`;
  }
}

/** Get due date for sorting (scratch notes have no due date → sort to top) */
export function getCardSortDate(card: BoardCard): string {
  if (card.type === "scratch_note") return "0000-00-00"; // sort to top
  if (card.type === "job") return card.dueDate;
  return card.dueDate ?? "9999-99-99"; // quotes without due date sort to bottom
}
