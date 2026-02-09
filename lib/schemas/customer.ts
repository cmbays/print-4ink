import { z } from "zod";

export const customerTagEnum = z.enum(["new", "repeat", "contract"]);

export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  tag: customerTagEnum.default("new"),
});

export type CustomerTag = z.infer<typeof customerTagEnum>;
export type Customer = z.infer<typeof customerSchema>;
