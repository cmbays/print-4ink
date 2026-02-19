import 'server-only'
import { sql } from 'drizzle-orm'
import { getSupplierAdapter } from '@lib/suppliers/registry'
import { canonicalStyleToGarmentCatalog } from '@infra/repositories/_providers/supplier/garments'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'catalog-sync' })

/**
 * Sync the supplier catalog to Supabase PostgreSQL.
 * Fetches all styles from the supplier adapter and upserts them to the catalog table.
 * Returns the number of garments synced.
 *
 * Database import is deferred until runtime to prevent requiring DATABASE_URL during build.
 */
export async function syncCatalogFromSupplier(): Promise<number> {
  try {
    syncLogger.info('Starting catalog sync from supplier')

    // Dynamic import of database (deferred to runtime to avoid DATABASE_URL requirement at build time)
    const { db } = await import('@shared/lib/supabase/db')
    const { catalog } = await import('@db/schema/catalog')

    // Get the supplier adapter and paginate through all styles (not just first page)
    const adapter = getSupplierAdapter()
    const allStyles: (ReturnType<typeof canonicalStyleToGarmentCatalog> | null)[] = []
    let offset = 0
    let page = 0
    const CATALOG_PAGE_SIZE = 100
    const MAX_CATALOG_PAGES = 500

    while (true) {
      const result = await adapter.searchCatalog({ limit: CATALOG_PAGE_SIZE, offset })

      for (const style of result.styles) {
        const garment = canonicalStyleToGarmentCatalog(style)
        allStyles.push(garment) // Keep nulls for filtering later
      }

      // Zero-progress guard: prevent infinite loop if supplier returns hasMore:true with empty page
      if (result.styles.length === 0 || !result.hasMore) break

      offset += result.styles.length
      page++

      if (page >= MAX_CATALOG_PAGES) {
        syncLogger.error('Exceeded MAX_CATALOG_PAGES — possible supplier pagination bug', {
          page,
          offset,
          totalSoFar: allStyles.filter((g) => g !== null).length,
        })
        break
      }
    }

    // Filter out nulls and cast to guarantee non-null array for Drizzle
    const garments = allStyles.filter((g) => g !== null) as Exclude<
      (typeof allStyles)[number],
      null
    >[]

    if (garments.length === 0) {
      syncLogger.warn('No valid garments to sync from supplier')
      return 0
    }

    // Batch upserts to prevent exceeding PostgreSQL parameter limits.
    // With 11 columns per row and PostgreSQL's 65535 parameter limit,
    // safe batch size is ~5000 rows. Using 1000 for extra safety.
    const BATCH_SIZE = 1000
    let syncedTotal = 0

    for (let i = 0; i < garments.length; i += BATCH_SIZE) {
      const batch = garments.slice(i, i + BATCH_SIZE)

      // Upsert batch to the catalog table
      // On conflict (by id), update supplier-sourced fields using EXCLUDED pseudo-table
      // Note: isEnabled and isFavorite are intentionally omitted from the update clause.
      // These are user-curated fields that should be preserved across supplier syncs.
      await db
        .insert(catalog)
        .values(batch)
        .onConflictDoUpdate({
          target: catalog.id,
          set: {
            brand: sql`excluded.brand`,
            sku: sql`excluded.sku`,
            name: sql`excluded.name`,
            baseCategory: sql`excluded.base_category`,
            basePrice: sql`excluded.base_price`,
            availableColors: sql`excluded.available_colors`,
            availableSizes: sql`excluded.available_sizes`,
            updatedAt: new Date(),
          },
        })

      syncedTotal += batch.length
      syncLogger.info('Catalog sync batch completed', {
        batchSize: batch.length,
        totalSynced: syncedTotal,
        totalRemaining: garments.length - syncedTotal,
      })
    }

    syncLogger.info('Catalog sync completed', { synced: syncedTotal })
    return syncedTotal
  } catch (error) {
    syncLogger.error('Catalog sync failed', { error })
    throw error
  }
}
