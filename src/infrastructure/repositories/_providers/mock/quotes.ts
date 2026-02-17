import { quotes } from './data'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { Quote } from '@domain/entities/quote'

export async function getQuotes(): Promise<Quote[]> {
  return quotes.map((q) => structuredClone(q))
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  if (!validateUUID(id)) return null
  const quote = quotes.find((q) => q.id === id)
  return quote ? structuredClone(quote) : null
}
