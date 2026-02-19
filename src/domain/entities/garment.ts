import { z } from 'zod'
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { catalog } from '@db/schema/catalog'

// Garment category — mirrors S&S Activewear API "baseCategory" field on /v2/styles/
export const garmentCategoryEnum = z.enum(['t-shirts', 'fleece', 'outerwear', 'pants', 'headwear'])

export type GarmentCategory = z.infer<typeof garmentCategoryEnum>

// Existing schema (for job garment instances)
export const garmentSchema = z.object({
  sku: z.string().min(1),
  style: z.string().min(1),
  brand: z.string().min(1),
  color: z.string().min(1),
  sizes: z.record(z.string(), z.number().int().nonnegative()),
})

export type Garment = z.infer<typeof garmentSchema>

// Catalog schemas derived from Drizzle table (single source of truth)
// These replace the hand-written schemas above
export const garmentSizeSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().nonnegative(),
  priceAdjustment: z.number(),
})

// Note: .extend() already overrides basePrice with z.number().nonnegative() which rejects null,
// so the previous .refine() check was redundant and has been removed.
export const garmentCatalogSchema = createSelectSchema(catalog).extend({
  brand: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  baseCategory: garmentCategoryEnum,
  basePrice: z.number().nonnegative(),
})

export const newGarmentCatalogSchema = createInsertSchema(catalog).extend({
  brand: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  baseCategory: garmentCategoryEnum,
  basePrice: z.number().nonnegative(),
})

export type GarmentSize = z.infer<typeof garmentSizeSchema>
export type GarmentCatalog = z.infer<typeof garmentCatalogSchema>
