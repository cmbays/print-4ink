import { z } from 'zod'

// ---------------------------------------------------------------------------
// DTF Line Item — individual design in a DTF gang sheet quote
// ---------------------------------------------------------------------------

export const dtfSizePresetEnum = z.enum(['small', 'medium', 'large', 'custom'])

export const dtfShapeEnum = z.enum(['box', 'round'])

export const dtfLineItemSchema = z.object({
  id: z.string().uuid(),
  artworkName: z.string().min(1),
  shape: dtfShapeEnum.default('box'),
  sizePreset: dtfSizePresetEnum,
  width: z.number().positive(),
  height: z.number().positive(),
  quantity: z.number().int().positive(),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DtfSizePreset = z.infer<typeof dtfSizePresetEnum>
export type DtfShape = z.infer<typeof dtfShapeEnum>
export type DtfLineItem = z.infer<typeof dtfLineItemSchema>
