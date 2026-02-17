// Auth classification: AUTHENTICATED — financial records (invoices, payments).
// Phase 2: All functions must call verifySession() before returning data.
export {
  getInvoices,
  getInvoiceById,
  getInvoicePayments,
  getInvoiceCreditMemos,
  getQuoteInvoice,
} from './_providers/mock/invoices';
