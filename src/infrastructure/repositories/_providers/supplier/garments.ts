/**
 * Supplier garments provider — bridges SupplierAdapter ↔ IGarmentRepository.
 *
 * Maps CanonicalStyle (adapter layer) → GarmentCatalog (domain layer).
 * Active when SUPPLIER_ADAPTER is set; selected by the repository router in
 * src/infrastructure/repositories/garments.ts.
 *
 * ID semantics: S&S styleIds are numeric strings, not UUIDs. UUID validation
 * is intentionally skipped here — that constraint belongs to the mock provider.
 */
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { garmentCategoryEnum } from '@domain/entities/garment'
import type { GarmentCatalog, GarmentCategory } from '@domain/entities/garment'
import type { CanonicalStyle } from '@lib/suppliers/types'

/**
 * Normalize a S&S category string to a domain GarmentCategory.
 *
 * S&S uses free-text values like "T-Shirts", "Fleece", "Outerwear", etc.
 * We lowercase and hyphenate to match the domain enum. Unknown categories
 * default to 't-shirts' so new S&S categories never crash the catalog.
 */
export function canonicalCategoryToGarmentCategory(categories: string[]): GarmentCategory {
  const raw = (categories[0] ?? '').toLowerCase().replace(/\s+/g, '-')
  const result = garmentCategoryEnum.safeParse(raw)
  return result.success ? result.data : 't-shirts'
}

/**
 * Map a CanonicalStyle from the supplier adapter to a domain GarmentCatalog.
 *
 * basePrice: uses piecePrice (individual piece cost) or 0 when not yet loaded.
 * searchCatalog() returns style-level rows with empty colors/sizes — callers
 * needing full detail should use getStyle() via getGarmentById().
 */
export function canonicalStyleToGarmentCatalog(style: CanonicalStyle): GarmentCatalog {
  return {
    id: style.supplierId,
    brand: style.brand,
    sku: style.styleNumber,
    name: style.styleName,
    baseCategory: canonicalCategoryToGarmentCategory(style.categories),
    basePrice: style.pricing.piecePrice ?? 0,
    availableColors: style.colors.map((c) => c.name),
    availableSizes: style.sizes.map((s) => ({
      name: s.name,
      order: s.sortOrder,
      priceAdjustment: s.priceAdjustment,
    })),
    isEnabled: true,
    isFavorite: false,
  }
}

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  const adapter = getSupplierAdapter()
  const result = await adapter.searchCatalog({ limit: 100, offset: 0 })
  return result.styles.map(canonicalStyleToGarmentCatalog)
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  if (!id) return null
  const adapter = getSupplierAdapter()
  const style = await adapter.getStyle(id)
  return style ? canonicalStyleToGarmentCatalog(style) : null
}

export async function getAvailableBrands(): Promise<string[]> {
  const adapter = getSupplierAdapter()
  return adapter.getBrands()
}
