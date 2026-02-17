import { customers, contacts, customerNotes, quotes, jobs, invoices, artworks } from '@/lib/mock-data';
import { validateUUID } from '@/lib/dal/_shared/validation';
import type { Customer } from '@/lib/schemas/customer';
import type { Contact } from '@/lib/schemas/contact';
import type { Note } from '@/lib/schemas/note';
import type { Quote } from '@/lib/schemas/quote';
import type { Job } from '@/lib/schemas/job';
import type { Invoice } from '@/lib/schemas/invoice';
import type { Artwork } from '@/lib/schemas/artwork';

export async function getCustomers(): Promise<Customer[]> {
  return customers.map((c) => structuredClone(c));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (!validateUUID(id)) return null;
  const customer = customers.find((c) => c.id === id);
  return customer ? structuredClone(customer) : null;
}

export async function getCustomerQuotes(customerId: string): Promise<Quote[]> {
  if (!validateUUID(customerId)) return [];
  return quotes.filter((q) => q.customerId === customerId).map((q) => structuredClone(q));
}

export async function getCustomerJobs(customerId: string): Promise<Job[]> {
  if (!validateUUID(customerId)) return [];
  return jobs.filter((j) => j.customerId === customerId).map((j) => structuredClone(j));
}

export async function getCustomerContacts(customerId: string): Promise<Contact[]> {
  if (!validateUUID(customerId)) return [];
  const customer = customers.find((cust) => cust.id === customerId);
  if (!customer) return [];
  return contacts
    .filter((c) => customer.contacts.some((ec) => ec.id === c.id))
    .map((c) => structuredClone(c));
}

export async function getCustomerNotes(customerId: string): Promise<Note[]> {
  if (!validateUUID(customerId)) return [];
  return customerNotes
    .filter((n) => n.entityType === 'customer' && n.entityId === customerId)
    .map((n) => structuredClone(n));
}

export async function getCustomerArtworks(customerId: string): Promise<Artwork[]> {
  if (!validateUUID(customerId)) return [];
  return artworks.filter((a) => a.customerId === customerId).map((a) => structuredClone(a));
}

export async function getCustomerInvoices(customerId: string): Promise<Invoice[]> {
  if (!validateUUID(customerId)) return [];
  return invoices.filter((inv) => inv.customerId === customerId).map((inv) => structuredClone(inv));
}
