import { quotes } from '@/lib/mock-data';
import { validateUUID } from '@/lib/dal/_shared/validation';
import type { Quote } from '@/lib/schemas/quote';

export async function getQuotes(): Promise<Quote[]> {
  return quotes.map((q) => ({ ...q }));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  if (!validateUUID(id)) return null;
  const quote = quotes.find((q) => q.id === id);
  return quote ? { ...quote } : null;
}
