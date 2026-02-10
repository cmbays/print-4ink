import { z } from "zod";

export const addressTypeEnum = z.enum(["billing", "shipping"]);

export const addressSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  street: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().default("US"),
  isDefault: z.boolean().default(false),
  type: addressTypeEnum,
});

export type AddressType = z.infer<typeof addressTypeEnum>;
export type Address = z.infer<typeof addressSchema>;
