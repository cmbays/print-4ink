import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { catalog } from '@db/schema/catalog'
import { logger } from '@shared/lib/logger'
import type { GarmentCatalog } from '@domain/entities/garment'

const supabaseLogger = logger.child({ domain: 'supabase-garments' })

/**
 * Fetch the full catalog from Supabase PostgreSQL.
 * Returns only enabled garments.
 */
export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  try {
    const rows = await db.select().from(catalog).where(eq(catalog.isEnabled, true))
    return rows as GarmentCatalog[]
  } catch (error) {
    supabaseLogger.error('Failed to fetch garment catalog from Supabase', { error })
    throw error
  }
}

/**
 * Fetch a single garment by ID from Supabase PostgreSQL.
 * Returns null if not found.
 */
export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  try {
    const rows = await db.select().from(catalog).where(eq(catalog.id, id)).limit(1)
    return (rows[0] as GarmentCatalog) ?? null
  } catch (error) {
    supabaseLogger.error('Failed to fetch garment by ID from Supabase', { id, error })
    throw error
  }
}

/**
 * Fetch distinct brands from Supabase PostgreSQL catalog.
 * Returns sorted list of unique brand names.
 */
export async function getAvailableBrands(): Promise<string[]> {
  try {
    const rows = await db.selectDistinct({ brand: catalog.brand }).from(catalog)
    return rows.map((r) => r.brand).sort()
  } catch (error) {
    supabaseLogger.error('Failed to fetch available brands from Supabase', { error })
    throw error
  }
}
