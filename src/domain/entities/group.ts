import { z } from "zod";

export const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  customerId: z.string().uuid(),
});

export type Group = z.infer<typeof groupSchema>;
