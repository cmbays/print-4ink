import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const creditMemoReasonEnum = z.enum([
  "shortage",
  "misprint",
  "defect",
  "overcharge",
  "return",
  "other",
]);

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const creditMemoLineItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCredit: z.number().positive(),
  lineTotal: z.number().positive(),
});

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

export const creditMemoSchema = z.object({
  id: z.string().uuid(),
  creditMemoNumber: z.string().regex(/^CM-\d{4}$/, "Must match CM-XXXX format"),
  invoiceId: z.string().uuid(),
  customerId: z.string().uuid(),
  reason: creditMemoReasonEnum,
  lineItems: z.array(creditMemoLineItemSchema).min(1),
  totalCredit: z.number().positive(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type CreditMemoReason = z.infer<typeof creditMemoReasonEnum>;
export type CreditMemoLineItem = z.infer<typeof creditMemoLineItemSchema>;
export type CreditMemo = z.infer<typeof creditMemoSchema>;
