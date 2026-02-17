import { z } from 'zod'
import { configEntryBase } from './base'

const tagEntry = configEntryBase.extend({
  color: z.enum(['green', 'blue', 'amber', 'purple']),
})

export const tagsConfigSchema = z.array(tagEntry).nonempty()
export type TagEntry = z.infer<typeof tagEntry>
