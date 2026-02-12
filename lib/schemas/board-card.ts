import { z } from "zod";
import { laneEnum, riskLevelEnum, priorityEnum } from "./job";
import { serviceTypeEnum, quoteStatusEnum } from "./quote";
import { invoiceStatusEnum } from "./invoice";

// Board card is a VIEW MODEL — projected from underlying entities, not stored.

// ---------------------------------------------------------------------------
// Card variants
// ---------------------------------------------------------------------------

export const scratchNoteCardSchema = z.object({
  type: z.literal("scratch_note"),
  id: z.string().uuid(),
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  isArchived: z.boolean(),
  lane: z.literal("ready"), // scratch notes always in Ready
});

export const quoteCardSchema = z.object({
  type: z.literal("quote"),
  quoteId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string().min(1),
  description: z.string().min(1),
  serviceType: serviceTypeEnum.optional(),
  quantity: z.number().int().nonnegative().optional(),
  dueDate: z.string().date().optional(),
  total: z.number().nonnegative().optional(),
  quoteStatus: quoteStatusEnum,
  lane: laneEnum,
  isNew: z.boolean().default(false), // "New" badge for recently accepted
});

export const jobCardSchema = z.object({
  type: z.literal("job"),
  id: z.string().uuid(),
  jobNumber: z.string().regex(/^J-\d{4,}$/, "Must match J-XXXX format"),
  title: z.string().min(1),
  customerId: z.string().uuid(),
  customerName: z.string().min(1),
  lane: laneEnum,
  serviceType: serviceTypeEnum,
  quantity: z.number().int().positive(),
  startDate: z.string().date(),
  dueDate: z.string().date(),
  riskLevel: riskLevelEnum,
  priority: priorityEnum,
  taskProgress: z.object({
    completed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  assigneeInitials: z.string().max(3).optional(),
  sourceQuoteId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  invoiceStatus: invoiceStatusEnum.optional(),
  blockReason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export const boardCardSchema = z.discriminatedUnion("type", [
  scratchNoteCardSchema,
  quoteCardSchema,
  jobCardSchema,
]);

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type ScratchNoteCard = z.infer<typeof scratchNoteCardSchema>;
export type QuoteCard = z.infer<typeof quoteCardSchema>;
export type JobCard = z.infer<typeof jobCardSchema>;
export type BoardCard = z.infer<typeof boardCardSchema>;
