import { z } from "zod";

export const customerScreenSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  jobId: z.string(),
  artworkName: z.string().min(1),
  colorIds: z.array(z.string()),
  meshCount: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

export type CustomerScreen = z.infer<typeof customerScreenSchema>;
