// Auth classification: PUBLIC — product catalog; no PII or financial data.
// Phase 2: May be exposed to unauthenticated customer-facing quote requests.
//
// Router: SUPPLIER_ADAPTER env var selects the data source.
//   - 'ss-activewear' → supplier provider via SSActivewearAdapter (real S&S API)
//   - 'mock'          → supplier provider via MockAdapter (no HTTP; for dev/CI)
//   - unset           → legacy mock provider (direct in-process data, no SupplierAdapter)
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
