/**
 * Supplier garments provider — bridges SupplierAdapter ↔ IGarmentRepository.
 *
 * Maps CanonicalStyle (adapter layer) → GarmentCatalog (domain layer).
 * Active when SUPPLIER_ADAPTER is set; selected by the repository router in
 * src/infrastructure/repositories/garments.ts.
 *
 * ID semantics: S&S styleIds are numeric strings, not UUIDs. UUID validation
 * is intentionally skipped here — that constraint belongs to the mock provider.
 * Supplier IDs are validated as non-empty strings ≤ 50 chars (CLAUDE.md §9).
 *
 * Catalog pagination: S&S limits individual requests to 100 styles (max).
 * getGarmentCatalog() fetches all pages in sequence until hasMore is false.
 * This trades multiple round-trips for a complete result set, which the
 * SupplierAdapter caches at 24h TTL to amortize the cost.
 */
import { z } from 'zod'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { garmentCategoryEnum, garmentCatalogSchema } from '@domain/entities/garment'
import { logger } from '@shared/lib/logger'
import type { GarmentCatalog, GarmentCategory } from '@domain/entities/garment'
import type { CanonicalStyle } from '@lib/suppliers/types'

const supplierLogger = logger.child({ domain: 'supplier-garments' })

const CATALOG_PAGE_SIZE = 100
/** Safety ceiling: prevents unbounded pagination if the supplier misbehaves. */
const MAX_CATALOG_PAGES = 500
const FALLBACK_GARMENT_CATEGORY: GarmentCategory = 't-shirts'

/** Zod validator for supplier style IDs (non-UUID, numeric strings like "3001"). */
const supplierIdSchema = z.string().min(1).max(50)

/**
 * Normalize a S&S category string to a domain GarmentCategory.
 *
 * S&S uses free-text values like "T-Shirts", "Fleece", "Outerwear", etc.
 * We lowercase and hyphenate to match the domain enum. Unknown categories
 * fall back to 't-shirts' and a warning is logged so miscategorization is
 * visible rather than silent.
 */
export function canonicalCategoryToGarmentCategory(categories: string[]): GarmentCategory {
  const raw = (categories[0] ?? '').toLowerCase().replace(/\s+/g, '-')
  const result = garmentCategoryEnum.safeParse(raw)
  if (!result.success) {
    supplierLogger.warn('Unknown garment category, falling back to default', { raw, categories })
  }
  return result.success ? result.data : FALLBACK_GARMENT_CATEGORY
}

/**
 * Map a CanonicalStyle to a domain GarmentCatalog.
 *
 * Returns null in two cases:
 *   - piecePrice is null (no pricing data — not shown in catalog)
 *   - garmentCatalogSchema validation fails (malformed supplier data logged, item skipped)
 *
 * Returning null rather than throwing allows the catalog pagination loop to
 * skip individual bad records without aborting the full fetch.
 */
export function canonicalStyleToGarmentCatalog(style: CanonicalStyle): GarmentCatalog | null {
  if (style.pricing.piecePrice === null) {
    supplierLogger.warn('Skipping garment with no piecePrice', {
      styleId: style.supplierId,
      styleNumber: style.styleNumber,
    })
    return null
  }

  const raw = {
    id: style.supplierId,
    brand: style.brand,
    sku: style.styleNumber,
    name: style.styleName,
    baseCategory: canonicalCategoryToGarmentCategory(style.categories),
    basePrice: style.pricing.piecePrice,
    availableColors: style.colors.map((c) => c.name),
    availableSizes: style.sizes.map((s) => ({
      name: s.name,
      order: s.sortOrder,
      priceAdjustment: s.priceAdjustment,
    })),
    isEnabled: true,
    isFavorite: false,
    updatedAt: new Date(),
  }

  const parsed = garmentCatalogSchema.safeParse(raw)
  if (!parsed.success) {
    supplierLogger.warn('Skipping garment with invalid schema from supplier', {
      styleId: style.supplierId,
      errors: parsed.error.issues,
    })
    return null
  }
  return parsed.data
}

/**
 * Fetch the full supplier catalog, paginating until hasMore is false.
 * Garments with no piecePrice or invalid schema are silently filtered out.
 */
export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  const adapter = getSupplierAdapter()
  const all: GarmentCatalog[] = []
  let offset = 0
  let page = 0

  while (true) {
    const result = await adapter.searchCatalog({ limit: CATALOG_PAGE_SIZE, offset })

    for (const style of result.styles) {
      const garment = canonicalStyleToGarmentCatalog(style)
      if (garment) all.push(garment)
    }

    // Zero-progress guard: a supplier returning hasMore:true with an empty
    // page would loop forever without this check.
    if (result.styles.length === 0 || !result.hasMore) break

    offset += result.styles.length
    page++

    if (page >= MAX_CATALOG_PAGES) {
      supplierLogger.error('Exceeded MAX_CATALOG_PAGES — possible supplier pagination bug', {
        page,
        offset,
        totalSoFar: all.length,
      })
      break
    }
  }

  return all
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  if (!supplierIdSchema.safeParse(id).success) {
    supplierLogger.warn('getGarmentById called with invalid id', { id })
    return null
  }
  const adapter = getSupplierAdapter()
  const style = await adapter.getStyle(id)
  return style ? canonicalStyleToGarmentCatalog(style) : null
}

export async function getAvailableBrands(): Promise<string[]> {
  const adapter = getSupplierAdapter()
  return (await adapter.getBrands()).sort()
}
