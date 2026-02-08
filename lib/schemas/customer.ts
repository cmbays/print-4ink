import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;
