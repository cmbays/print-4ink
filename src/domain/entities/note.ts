import { z } from 'zod'

export const noteChannelEnum = z.enum(['phone', 'email', 'text', 'social', 'in-person'])

export const noteEntityTypeEnum = z.enum([
  'customer',
  'quote',
  'artwork',
  'job',
  'invoice',
  'credit_memo',
])

export const noteSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
  isPinned: z.boolean().default(false),
  channel: noteChannelEnum.nullable().default(null),
  entityType: noteEntityTypeEnum,
  entityId: z.string().uuid(),
})

export type NoteChannel = z.infer<typeof noteChannelEnum>
export type NoteEntityType = z.infer<typeof noteEntityTypeEnum>
export type Note = z.infer<typeof noteSchema>
