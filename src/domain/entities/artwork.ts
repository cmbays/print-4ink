import { z } from 'zod'

export const artworkTagEnum = z.enum([
  'corporate',
  'event',
  'seasonal',
  'promotional',
  'sports',
  'custom',
])

export const artworkSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().uuid(),
  name: z.string().min(1),
  fileName: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  colorCount: z.number().int().positive(),
  tags: z.array(artworkTagEnum),
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})

export type ArtworkTag = z.infer<typeof artworkTagEnum>
export type Artwork = z.infer<typeof artworkSchema>
