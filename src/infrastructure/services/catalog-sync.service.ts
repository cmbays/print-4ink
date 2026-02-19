import 'server-only'
import { db } from '@shared/lib/supabase/db'
import { catalog } from '@db/schema/catalog'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { canonicalStyleToGarmentCatalog } from '@infra/repositories/_providers/supplier/garments'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'catalog-sync' })

/**
 * Sync the supplier catalog to Supabase PostgreSQL.
 * Fetches all styles from the supplier adapter and upserts them to the catalog table.
 * Returns the number of garments synced.
 */
export async function syncCatalogFromSupplier(): Promise<number> {
  try {
    syncLogger.info('Starting catalog sync from supplier')

    // Get the supplier adapter and fetch all styles
    const adapter = getSupplierAdapter()
    const styles = await adapter.searchCatalog({ limit: 100, offset: 0 })

    // Map CanonicalStyle to GarmentCatalog insert format
    const garments = styles.styles
      .map((style) => canonicalStyleToGarmentCatalog(style))
      .filter((garment) => garment !== null)

    if (garments.length === 0) {
      syncLogger.warn('No valid garments to sync from supplier')
      return 0
    }

    // Upsert all garments to the catalog table
    // On conflict (by id), update all fields except id
    await db
      .insert(catalog)
      .values(garments)
      .onConflictDoUpdate({
        target: catalog.id,
        set: {
          brand: catalog.brand,
          sku: catalog.sku,
          name: catalog.name,
          baseCategory: catalog.baseCategory,
          basePrice: catalog.basePrice,
          availableColors: catalog.availableColors,
          availableSizes: catalog.availableSizes,
          isEnabled: catalog.isEnabled,
          isFavorite: catalog.isFavorite,
          updatedAt: new Date(),
        },
      })

    syncLogger.info('Catalog sync completed', { synced: garments.length })
    return garments.length
  } catch (error) {
    syncLogger.error('Catalog sync failed', { error })
    throw error
  }
}
