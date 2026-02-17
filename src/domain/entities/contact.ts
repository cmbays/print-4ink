import { z } from 'zod'

export const contactRoleEnum = z.enum(['ordering', 'art-approver', 'billing', 'owner', 'other'])

export const contactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: contactRoleEnum,
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
  groupId: z.string().uuid().optional(),
})

export type ContactRole = z.infer<typeof contactRoleEnum>
export type Contact = z.infer<typeof contactSchema>
