// Auth classification: PUBLIC — product catalog; no PII or financial data.
// Phase 2: May be exposed to unauthenticated customer-facing quote requests.
//
// Router: SUPPLIER_ADAPTER env var selects the data source.
//   - Set to 'ss-activewear' or 'mock' → supplier provider (SupplierAdapter)
//   - Unset → mock provider (direct in-process mock data, for backward compat)
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

function isSupplierMode(): boolean {
  return Boolean(process.env.SUPPLIER_ADAPTER)
}

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  return isSupplierMode() ? getSupplierCatalog() : getMockCatalog()
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  return isSupplierMode() ? getSupplierById(id) : getMockById(id)
}

export async function getAvailableBrands(): Promise<string[]> {
  return isSupplierMode() ? getSupplierBrands() : getMockBrands()
}

export { getGarmentCatalogMutable }
