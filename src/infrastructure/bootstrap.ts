// src/infrastructure/bootstrap.ts
//
// Composition Root — wires domain ports to infrastructure implementations.
// Phase 1: All ports resolve to mock providers.
// Phase 2: env-based switch (process.env.DATA_PROVIDER === 'supabase' ? ... : mock).

// NOTE: Port interfaces (ICustomerRepository, etc.) will be defined in Phase 2
// when domain/ports/ is created. For now, this file documents the wiring pattern.
//
// PHASE 2 DECISION REQUIRED: Currently no app-layer consumer imports from @infra/bootstrap.
// All consumers import directly from @infra/repositories/{domain}. Before Phase 4 ESLint
// boundary rules are added, Phase 2 must decide:
//   A) Make bootstrap.ts the enforced single entry point (ESLint: no direct repo imports)
//   B) Deprecate bootstrap.ts in favour of named repository imports (remove this file)
// Also: settings.ts has 3 mutable functions not re-exported here (getBrandPreferencesMutable,
// getAutoPropagationConfigMutable, getDtfSheetTiersSync) — add them before choosing option A.

export {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
} from './repositories/customers';

export { getQuotes, getQuoteById } from './repositories/quotes';

export {
  getJobs,
  getJobById,
  getJobsByLane,
  getJobsByServiceType,
  getJobTasks,
} from './repositories/jobs';

export {
  getInvoices,
  getInvoiceById,
  getInvoicePayments,
  getInvoiceCreditMemos,
  getQuoteInvoice,
} from './repositories/invoices';

export {
  getGarmentCatalog,
  getGarmentById,
  getAvailableBrands,
  getGarmentCatalogMutable,
} from './repositories/garments';

export { getScreens, getScreensByJobId } from './repositories/screens';

export { getArtworks, getArtworkById } from './repositories/artworks';

export { getColors, getColorById, getColorsMutable } from './repositories/colors';

export {
  getMockupTemplates,
  getBrandPreferences,
  getDisplayPreference,
  getAutoPropagationConfig,
  getDtfSheetTiers,
} from './repositories/settings';
