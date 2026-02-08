import { z } from "zod";

export const quoteStatusEnum = z.enum(["draft", "sent", "approved", "rejected"]);

export const quoteLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  colorCount: z.number().int().positive(),
  locations: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const quoteSchema = z.object({
  id: z.string().uuid(),
  quoteNumber: z.string().min(1),
  customerId: z.string().uuid(),
  lineItems: z.array(quoteLineItemSchema),
  setupFees: z.number().nonnegative(),
  total: z.number().nonnegative(),
  status: quoteStatusEnum,
  createdAt: z.string().datetime(),
});

export type QuoteStatus = z.infer<typeof quoteStatusEnum>;
export type QuoteLineItem = z.infer<typeof quoteLineItemSchema>;
export type Quote = z.infer<typeof quoteSchema>;
