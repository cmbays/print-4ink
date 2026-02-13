import { z } from "zod";
import { serviceTypeEnum } from "./quote";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

// KEEP these for backward compatibility (dashboard still references them)
export const productionStateEnum = z.enum([
  "design",
  "approval",
  "burning",
  "press",
  "finishing",
  "shipped",
]);

export const priorityEnum = z.enum(["low", "medium", "high", "rush"]);

// NEW lane-based enums
export const laneEnum = z.enum([
  "ready",
  "in_progress",
  "review",
  "blocked",
  "done",
]);

export const riskLevelEnum = z.enum([
  "on_track",
  "getting_tight",
  "at_risk",
]);

export const jobNoteTypeEnum = z.enum(["internal", "customer", "system"]);

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const jobTaskSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  detail: z.string().optional(),
  isCompleted: z.boolean(),
  completedAt: z.string().datetime().optional(),
  isCanonical: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
});

export const jobNoteSchema = z.object({
  id: z.string().uuid(),
  type: jobNoteTypeEnum,
  content: z.string().min(1),
  author: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const jobHistoryEntrySchema = z.object({
  fromLane: laneEnum,
  toLane: laneEnum,
  timestamp: z.string().datetime(),
  note: z.string().optional(),
});

export const garmentDetailSchema = z.object({
  garmentId: z.string().min(1),
  colorId: z.string().min(1),
  sizes: z.record(z.string(), z.number().int().nonnegative()),
});

export const jobPrintLocationSchema = z.object({
  position: z.string().min(1),
  colorCount: z.number().int().positive(),
  artworkApproved: z.boolean(),
});

export const jobComplexitySchema = z.object({
  locationCount: z.number().int().nonnegative(),
  screenCount: z.number().int().nonnegative().optional(),
  garmentVariety: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

export const jobSchema = z.object({
  id: z.string().uuid(),
  jobNumber: z.string().regex(/^J-\d{4,}$/, "Must match J-XXXX format"),
  title: z.string().min(1),
  customerId: z.string().uuid(),

  // Board placement
  lane: laneEnum,
  serviceType: serviceTypeEnum,

  // Dates
  startDate: z.string().date(),
  dueDate: z.string().date(),
  customerDueDate: z.string().date().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),

  // Priority & Risk
  priority: priorityEnum,
  riskLevel: riskLevelEnum,

  // Production details
  quantity: z.number().int().positive(),
  garmentDetails: z.array(garmentDetailSchema),
  printLocations: z.array(jobPrintLocationSchema),
  complexity: jobComplexitySchema,

  // Tasks
  tasks: z.array(jobTaskSchema),

  // Blocking
  blockReason: z.string().optional(),
  blockedAt: z.string().datetime().optional(),
  blockedBy: z.string().optional(),

  // Assignee (Phase 2 — optional for now)
  assigneeId: z.string().uuid().optional(),
  assigneeName: z.string().optional(),
  assigneeInitials: z.string().max(3).optional(),

  // Financial
  orderTotal: z.number().positive(),

  // Linked entities
  sourceQuoteId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  artworkIds: z.array(z.string()).default([]),

  // History
  history: z.array(jobHistoryEntrySchema).default([]),

  // Notes
  notes: z.array(jobNoteSchema).default([]),

  // Flags
  isArchived: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type ProductionState = z.infer<typeof productionStateEnum>;
export type Priority = z.infer<typeof priorityEnum>;
export type Lane = z.infer<typeof laneEnum>;
export type RiskLevel = z.infer<typeof riskLevelEnum>;
export type JobNoteType = z.infer<typeof jobNoteTypeEnum>;
export type JobTask = z.infer<typeof jobTaskSchema>;
export type JobNote = z.infer<typeof jobNoteSchema>;
export type JobHistoryEntry = z.infer<typeof jobHistoryEntrySchema>;
export type GarmentDetail = z.infer<typeof garmentDetailSchema>;
export type JobPrintLocation = z.infer<typeof jobPrintLocationSchema>;
export type JobComplexity = z.infer<typeof jobComplexitySchema>;
export type Job = z.infer<typeof jobSchema>;
