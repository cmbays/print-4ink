// Auth classification: AUTHENTICATED — contains PII (name, email, address).
// Phase 2: All functions must call verifySession() before returning data.
export {
  getCustomers,
  getCustomerById,
  getCustomerQuotes,
  getCustomerJobs,
  getCustomerContacts,
  getCustomerNotes,
  getCustomerArtworks,
  getCustomerInvoices,
} from '@infra/repositories/_providers/mock/customers';
