// Auth classification: AUTHENTICATED — contains financial data (pricing, discounts).
// Phase 2: All functions must call verifySession() before returning data.
export {
  getQuotes,
  getQuoteById,
} from '@infra/repositories/_providers/mock/quotes';
