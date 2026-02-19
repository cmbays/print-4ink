import 'server-only'
import { syncCatalogFromSupplier } from '@infra/services/catalog-sync.service'
import { logger } from '@shared/lib/logger'

const syncLogger = logger.child({ domain: 'catalog-sync-endpoint' })

/**
 * POST /api/catalog/sync
 *
 * Admin-only endpoint to sync the S&S Activewear catalog to Supabase PostgreSQL.
 * Validates the x-admin-secret header against process.env.ADMIN_SECRET.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Validate admin secret
    const secret = request.headers.get('x-admin-secret')
    if (secret !== process.env.ADMIN_SECRET) {
      syncLogger.warn('Catalog sync request denied: invalid or missing admin secret')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sync the catalog
    const synced = await syncCatalogFromSupplier()

    return Response.json({ synced, timestamp: new Date().toISOString() }, { status: 200 })
  } catch (error) {
    syncLogger.error('Catalog sync failed', { error })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
