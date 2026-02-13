import { computeTaskProgress } from "./job-utils";
import { customers, invoices } from "@/lib/mock-data";
import type { JobCard, ScratchNoteCard } from "@/lib/schemas/board-card";
import type { Job } from "@/lib/schemas/job";

// ---------------------------------------------------------------------------
// Projection: Job → JobCard view model
// ---------------------------------------------------------------------------

export function projectJobToCard(job: Job): JobCard {
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

export function projectScratchNoteToCard(
  note: { id: string; content: string; createdAt: string; isArchived: boolean },
): ScratchNoteCard {
  return {
    type: "scratch_note",
    id: note.id,
    content: note.content,
    createdAt: note.createdAt,
    isArchived: note.isArchived,
    lane: "ready",
  };
}
