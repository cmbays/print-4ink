import type { Customer } from '@domain/entities/customer'
import type { Contact } from '@domain/entities/contact'
import type { Note } from '@domain/entities/note'
import type { Quote } from '@domain/entities/quote'
import type { Job } from '@domain/entities/job'
import type { Invoice } from '@domain/entities/invoice'
import type { Artwork } from '@domain/entities/artwork'

export type ICustomerRepository = {
  getAll(): Promise<Customer[]>
  getById(id: string): Promise<Customer | null>
  getQuotes(customerId: string): Promise<Quote[]>
  getJobs(customerId: string): Promise<Job[]>
  getContacts(customerId: string): Promise<Contact[]>
  getNotes(customerId: string): Promise<Note[]>
  getArtworks(customerId: string): Promise<Artwork[]>
  getInvoices(customerId: string): Promise<Invoice[]>
}
