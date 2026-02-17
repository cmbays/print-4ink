import { z } from "zod";

export const burnStatusEnum = z.enum(["pending", "burned", "reclaimed"]);

export const screenSchema = z.object({
  id: z.string().uuid(),
  meshCount: z.number().int().positive(),
  emulsionType: z.string().min(1),
  burnStatus: burnStatusEnum,
  jobId: z.string().uuid(),
});

export type BurnStatus = z.infer<typeof burnStatusEnum>;
export type Screen = z.infer<typeof screenSchema>;
