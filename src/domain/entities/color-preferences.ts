import { z } from 'zod'

// ---------------------------------------------------------------------------
// Inheritance mode — shared across brand and customer levels
// ---------------------------------------------------------------------------

export const inheritanceModeSchema = z.enum(['inherit', 'customize'])

// ---------------------------------------------------------------------------
// Display preference — flat grid vs grouped by family (Settings > Colors)
// ---------------------------------------------------------------------------

export const displayPreferenceSchema = z.enum(['flat', 'grouped'])

// ---------------------------------------------------------------------------
// Propagation config — controls auto-add behavior for new favorites
// ---------------------------------------------------------------------------

export const propagationConfigSchema = z.object({
  autoPropagate: z.boolean(),
})

// ---------------------------------------------------------------------------
// Brand preference — per-brand color favorites with inheritance tracking
// ---------------------------------------------------------------------------

export const brandPreferenceSchema = z.object({
  brandName: z.string().min(1),
  inheritMode: inheritanceModeSchema,
  favoriteColorIds: z.array(z.string()),
  explicitColorIds: z.array(z.string()),
  removedInheritedColorIds: z.array(z.string()),
})

// ---------------------------------------------------------------------------
// Customer preference — customer-level favorites across 3 independent axes
// ---------------------------------------------------------------------------

export const customerPreferenceSchema = z.object({
  inheritMode: inheritanceModeSchema,
  favoriteColorIds: z.array(z.string()),
  favoriteBrandNames: z.array(z.string()),
  favoriteGarmentIds: z.array(z.string()),
})

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type InheritanceMode = z.infer<typeof inheritanceModeSchema>
export type DisplayPreference = z.infer<typeof displayPreferenceSchema>
export type PropagationConfig = z.infer<typeof propagationConfigSchema>
export type BrandPreference = z.infer<typeof brandPreferenceSchema>
export type CustomerPreference = z.infer<typeof customerPreferenceSchema>
