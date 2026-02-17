import { invoices, payments, creditMemos } from '@/lib/mock-data';
import { validateUUID } from '@/lib/dal/_shared/validation';
import type { Invoice, Payment } from '@/lib/schemas/invoice';
import type { CreditMemo } from '@/lib/schemas/credit-memo';

export async function getInvoices(): Promise<Invoice[]> {
  return invoices.map((inv) => ({ ...inv }));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!validateUUID(id)) return null;
  const invoice = invoices.find((inv) => inv.id === id);
  return invoice ? { ...invoice } : null;
}

export async function getInvoicePayments(invoiceId: string): Promise<Payment[]> {
  if (!validateUUID(invoiceId)) return [];
  return payments.filter((p) => p.invoiceId === invoiceId).map((p) => ({ ...p }));
}

export async function getInvoiceCreditMemos(invoiceId: string): Promise<CreditMemo[]> {
  if (!validateUUID(invoiceId)) return [];
  return creditMemos.filter((cm) => cm.invoiceId === invoiceId).map((cm) => ({ ...cm }));
}

export async function getQuoteInvoice(quoteId: string): Promise<Invoice | null> {
  if (!validateUUID(quoteId)) return null;
  const invoice = invoices.find((inv) => inv.quoteId === quoteId);
  return invoice ? { ...invoice } : null;
}
