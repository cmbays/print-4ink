// src/infrastructure/bootstrap.ts
//
// Composition Root — wires domain ports to infrastructure implementations.
// Phase 1: All ports resolve to mock providers.
// Phase 2: env-based switch (process.env.DATA_PROVIDER === 'supabase' ? ... : mock).

// NOTE: Port interfaces (ICustomerRepository, etc.) will be defined in Phase 2
// when domain/ports/ is created. For now, this file documents the wiring pattern.

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
