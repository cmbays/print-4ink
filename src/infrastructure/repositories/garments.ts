// Auth classification: PUBLIC — product catalog; no PII or financial data.
// Phase 2: May be exposed to unauthenticated customer-facing quote requests.
export {
  getGarmentCatalog,
  getGarmentById,
  getAvailableBrands,
  getGarmentCatalogMutable,
} from '@infra/repositories/_providers/mock/garments'
