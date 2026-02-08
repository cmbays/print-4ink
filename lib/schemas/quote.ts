import { z } from "zod";

export const quoteStatusEnum = z.enum([
  "draft",
  "sent",
  "accepted",
  "declined",
  "revised",
]);

export const quoteLineItemSchema = z.object({
  garmentId: z.string().min(1),
  colorId: z.string().min(1),
  sizes: z.record(z.string(), z.number().int().nonnegative()),
  printLocations: z.array(z.string()),
  colorsPerLocation: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});

export const quoteSchema = z.object({
  id: z.string().uuid(),
  quoteNumber: z.string().min(1),
  customerId: z.string().uuid(),
  lineItems: z.array(quoteLineItemSchema),
  setupFees: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
  priceOverride: z.number().nonnegative().optional(),
  status: quoteStatusEnum,
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
});

export type QuoteStatus = z.infer<typeof quoteStatusEnum>;
export type QuoteLineItem = z.infer<typeof quoteLineItemSchema>;
export type Quote = z.infer<typeof quoteSchema>;
