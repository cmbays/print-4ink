import { z } from "zod";

export const garmentSchema = z.object({
  sku: z.string().min(1),
  style: z.string().min(1),
  brand: z.string().min(1),
  color: z.string().min(1),
  sizes: z.record(z.string(), z.number().int().nonnegative()),
});

export type Garment = z.infer<typeof garmentSchema>;
