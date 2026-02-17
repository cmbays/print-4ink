import { z } from 'zod'

export const colorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hex2: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  swatchTextColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  family: z.string().min(1),
  isFavorite: z.boolean().optional(),
})

export type Color = z.infer<typeof colorSchema>
