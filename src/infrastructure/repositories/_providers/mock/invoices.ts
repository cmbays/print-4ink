import { invoices, payments, creditMemos } from './data'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { Invoice, Payment } from '@domain/entities/invoice'
import type { CreditMemo } from '@domain/entities/credit-memo'

export async function getInvoices(): Promise<Invoice[]> {
  return invoices.map((inv) => structuredClone(inv))
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!validateUUID(id)) return null
  const invoice = invoices.find((inv) => inv.id === id)
  return invoice ? structuredClone(invoice) : null
}

export async function getInvoicePayments(invoiceId: string): Promise<Payment[]> {
  if (!validateUUID(invoiceId)) return []
  return payments.filter((p) => p.invoiceId === invoiceId).map((p) => structuredClone(p))
}

export async function getInvoiceCreditMemos(invoiceId: string): Promise<CreditMemo[]> {
  if (!validateUUID(invoiceId)) return []
  return creditMemos.filter((cm) => cm.invoiceId === invoiceId).map((cm) => structuredClone(cm))
}

export async function getQuoteInvoice(quoteId: string): Promise<Invoice | null> {
  if (!validateUUID(quoteId)) return null
  const invoice = invoices.find((inv) => inv.quoteId === quoteId)
  return invoice ? structuredClone(invoice) : null
}

/** Phase 1 only: returns raw mutable invoices array for in-place mock data mutations. */
export function getInvoicesMutable(): Invoice[] {
  return invoices
}
