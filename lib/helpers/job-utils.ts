import type { BoardCard } from "@/lib/schemas/board-card";
import type { JobTask, Lane, RiskLevel } from "@/lib/schemas/job";
import type { ServiceType } from "@/lib/schemas/quote";

// ---------------------------------------------------------------------------
// Capacity summary
// ---------------------------------------------------------------------------

export interface CapacitySummary {
  rushCount: number;
  totalQuantity: number;
  cardsByLane: Record<Lane, number>;
}

export function computeCapacitySummary(cards: BoardCard[]): CapacitySummary {
  const cardsByLane: Record<Lane, number> = {
    ready: 0,
    in_progress: 0,
    review: 0,
    blocked: 0,
    done: 0,
  };

  let rushCount = 0;
  let totalQuantity = 0;

  for (const card of cards) {
    // All card types have a lane
    cardsByLane[card.lane]++;

    if (card.type === "job") {
      if (card.priority === "rush") {
        rushCount++;
      }
      totalQuantity += card.quantity;
    } else if (card.type === "quote" && card.quantity != null) {
      totalQuantity += card.quantity;
    }
  }

  return { rushCount, totalQuantity, cardsByLane };
}

// ---------------------------------------------------------------------------
// Risk level computation
// ---------------------------------------------------------------------------

export function computeRiskLevel(job: {
  dueDate: string;
  tasks: { isCompleted: boolean }[];
}): RiskLevel {
  const { dueDate, tasks } = job;

  if (tasks.length === 0) {
    return "on_track";
  }

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const completionRatio = completedCount / tasks.length;

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const daysUntilDue = diffMs / (1000 * 60 * 60 * 24);

  // >50% tasks done AND >3 days to due = on_track
  if (completionRatio > 0.5 && daysUntilDue > 3) {
    return "on_track";
  }

  // <50% tasks done AND <5 days = at_risk
  if (completionRatio < 0.5 && daysUntilDue < 5) {
    return "at_risk";
  }

  return "getting_tight";
}

// ---------------------------------------------------------------------------
// Task progress
// ---------------------------------------------------------------------------

export interface TaskProgress {
  completed: number;
  total: number;
  percentage: number;
  allComplete: boolean;
}

export function computeTaskProgress(tasks: JobTask[]): TaskProgress {
  const total = tasks.length;

  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0, allComplete: false };
  }

  const completed = tasks.filter((t) => t.isCompleted).length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage, allComplete: completed === total };
}

// ---------------------------------------------------------------------------
// Filtered cards
// ---------------------------------------------------------------------------

export interface CardFilters {
  today?: boolean;
  serviceType?: ServiceType;
  section?: Lane;
  risk?: RiskLevel;
  horizon?: "past_due" | "this_week" | "next_week";
}

export function computeFilteredCards(
  cards: BoardCard[],
  filters: CardFilters
): BoardCard[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  return cards.filter((card) => {
    // "today" filter: startDate <= today AND lane !== done
    if (filters.today) {
      if (card.type === "job") {
        if (card.startDate > todayStr || card.lane === "done") return false;
      } else if (card.type === "quote") {
        if (card.lane === "done") return false;
      }
      // scratch_notes always pass the "today" filter (they're always in ready)
    }

    // Service type filter
    if (filters.serviceType) {
      if (card.type === "job") {
        if (card.serviceType !== filters.serviceType) return false;
      } else if (card.type === "quote") {
        if (card.serviceType !== filters.serviceType) return false;
      } else {
        // scratch_notes have no service type — exclude them from service type filter
        return false;
      }
    }

    // Section (lane) filter
    if (filters.section) {
      if (card.lane !== filters.section) return false;
    }

    // Risk filter (only applies to job cards)
    if (filters.risk) {
      if (card.type !== "job") return false;
      if (card.riskLevel !== filters.risk) return false;
    }

    // Horizon filter (date range, only applies to cards with dueDate)
    if (filters.horizon) {
      if (card.type === "scratch_note") return false;

      const dueDate = card.type === "job" ? card.dueDate : card.dueDate;
      if (!dueDate) return false;

      const due = new Date(dueDate);
      const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      switch (filters.horizon) {
        case "past_due":
          if (diffDays >= 0) return false;
          break;
        case "this_week":
          if (diffDays < 0 || diffDays > 7) return false;
          break;
        case "next_week":
          if (diffDays < 7 || diffDays > 14) return false;
          break;
      }
    }

    return true;
  });
}
