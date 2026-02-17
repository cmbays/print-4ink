import type { Quote } from "@domain/entities/quote";

export type IQuoteRepository = {
  getAll(): Promise<Quote[]>;
  getById(id: string): Promise<Quote | null>;
};
