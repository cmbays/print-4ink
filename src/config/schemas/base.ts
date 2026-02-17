import { z } from 'zod'

/** Base schema for config entries: slug (kebab-case) + label + description */
export const configEntryBase = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1),
  description: z.string().min(1),
})

export type ConfigEntry = z.infer<typeof configEntryBase>
