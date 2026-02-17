import { z } from 'zod'

export const scratchNoteSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  isArchived: z.boolean().default(false),
})

export type ScratchNote = z.infer<typeof scratchNoteSchema>
