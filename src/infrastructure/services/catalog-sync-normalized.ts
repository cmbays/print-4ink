import 'server-only'
import type { CanonicalStyle } from '@lib/suppliers/types'
import { canonicalCategoryToGarmentCategory } from '@infra/repositories/_providers/supplier/garments'

/** Extract the raw subcategory string after " - " delimiter. Returns null if absent. */
export function extractSubcategory(category: string): string | null {
  const parts = category.split(' - ')
  return parts.length > 1 ? (parts[1]?.trim() ?? null) : null
}

/** Extract the base category string before " - " delimiter. */
export function extractBaseCategory(category: string): string {
  return category.split(' - ')[0] ?? category
}

/** Build the value object for a brand upsert. */
export function buildBrandUpsertValue(canonicalName: string) {
  return {
    canonicalName,
    isActive: true,
    updatedAt: new Date(),
  }
}

/** Build the value object for a style upsert. */
export function buildStyleUpsertValue(style: CanonicalStyle, brandId: string, source: string) {
  const primaryCategory = style.categories[0] ?? ''
  const subcategory = extractSubcategory(primaryCategory)
  // Strip subcategory suffix before normalizing to enum — "T-Shirts - Premium" → "T-Shirts"
  const baseCategory = extractBaseCategory(primaryCategory)

  return {
    source,
    externalId: style.supplierId,
    brandId,
    styleNumber: style.styleNumber,
    name: style.styleName,
    description: style.description || null,
    category: canonicalCategoryToGarmentCategory([baseCategory]),
    subcategory,
    gtin: style.gtin,
    piecePrice: style.pricing.piecePrice ?? null,
    dozenPrice: style.pricing.dozenPrice ?? null,
    casePrice: style.pricing.casePrice ?? null,
    lastSyncedAt: new Date(),
    updatedAt: new Date(),
  }
}

/** Build color upsert value for catalog_colors. */
export function buildColorUpsertValue(styleId: string, color: CanonicalStyle['colors'][number]) {
  return {
    styleId,
    name: color.name,
    hex1: color.hex1,
    hex2: color.hex2,
    updatedAt: new Date(),
  }
}

/** Build image upsert value for catalog_images. */
export function buildImageUpsertValue(
  colorId: string,
  image: CanonicalStyle['colors'][number]['images'][number]
) {
  return {
    colorId,
    imageType: image.type,
    url: image.url,
    updatedAt: new Date(),
  }
}

/** Build size upsert value for catalog_sizes. */
export function buildSizeUpsertValue(styleId: string, size: CanonicalStyle['sizes'][number]) {
  return {
    styleId,
    name: size.name,
    sortOrder: size.sortOrder,
    priceAdjustment: size.priceAdjustment,
    updatedAt: new Date(),
  }
}
