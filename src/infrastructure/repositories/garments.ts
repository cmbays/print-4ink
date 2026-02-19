import 'server-only'

// Auth classification: PUBLIC — product catalog; no PII or financial data.
// Phase 2: May be exposed to unauthenticated customer-facing quote requests.
//
// Router: SUPPLIER_ADAPTER env var selects the data source.
//   - 'supabase-catalog' → Supabase PostgreSQL catalog table (Phase 1B+)
//   - 'ss-activewear'    → supplier provider via SSActivewearAdapter (real S&S API)
//   - 'mock'             → supplier provider via MockAdapter (no HTTP; for dev/CI)
//   - unset              → legacy mock provider (direct in-process data, no SupplierAdapter)
//
// Note: SUPPLIER_ADAPTER='mock' still routes through the supplier provider code path
// (SupplierAdapter registry, pagination, schema mapping). The MockAdapter returns
// fixture data with no HTTP calls — useful for exercising the full pipeline without
// S&S credentials. See lib/suppliers/registry.ts for adapter selection logic.
//
// getGarmentCatalogMutable() is Phase 1 only and always returns mock data.
import type { GarmentCatalog } from '@domain/entities/garment'

import {
  getGarmentCatalog as getMockCatalog,
  getGarmentById as getMockById,
  getAvailableBrands as getMockBrands,
  getGarmentCatalogMutable,
} from '@infra/repositories/_providers/mock/garments'

import {
  getGarmentCatalog as getSupplierCatalog,
  getGarmentById as getSupplierById,
  getAvailableBrands as getSupplierBrands,
} from '@infra/repositories/_providers/supplier/garments'

function isSupabaseCatalogMode(): boolean {
  return process.env.SUPPLIER_ADAPTER === 'supabase-catalog'
}

function isSupplierMode(): boolean {
  return Boolean(process.env.SUPPLIER_ADAPTER)
}

// Dynamic import: supabase provider is server-only and only loaded when SUPPLIER_ADAPTER=supabase-catalog
let supabaseGarmentsModule:
  | typeof import('@infra/repositories/_providers/supabase/garments')
  | null = null

async function loadSupabaseGarmentsModule() {
  if (!supabaseGarmentsModule) {
    supabaseGarmentsModule = await import('@infra/repositories/_providers/supabase/garments')
  }
  return supabaseGarmentsModule
}

async function getSupabaseCatalog(): Promise<GarmentCatalog[]> {
  const mod = await loadSupabaseGarmentsModule()
  return mod.getGarmentCatalog()
}

async function getSupabaseById(id: string): Promise<GarmentCatalog | null> {
  const mod = await loadSupabaseGarmentsModule()
  return mod.getGarmentById(id)
}

async function getSupabaseBrands(): Promise<string[]> {
  const mod = await loadSupabaseGarmentsModule()
  return mod.getAvailableBrands()
}

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  if (isSupabaseCatalogMode()) return getSupabaseCatalog()
  return isSupplierMode() ? getSupplierCatalog() : getMockCatalog()
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  if (isSupabaseCatalogMode()) return getSupabaseById(id)
  return isSupplierMode() ? getSupplierById(id) : getMockById(id)
}

export async function getAvailableBrands(): Promise<string[]> {
  if (isSupabaseCatalogMode()) return getSupabaseBrands()
  return isSupplierMode() ? getSupplierBrands() : getMockBrands()
}

// Phase 1 mutable export - for development only, always returns mock data
// Client components should import from garments-phase1.ts instead
export { getGarmentCatalogMutable }
