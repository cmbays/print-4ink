import type { Invoice, Payment } from '@domain/entities/invoice'
import type { CreditMemo } from '@domain/entities/credit-memo'

export type IInvoiceRepository = {
  getAll(): Promise<Invoice[]>
  getById(id: string): Promise<Invoice | null>
  getPayments(invoiceId: string): Promise<Payment[]>
  getCreditMemos(invoiceId: string): Promise<CreditMemo[]>
  getByQuoteId(quoteId: string): Promise<Invoice | null>
}
