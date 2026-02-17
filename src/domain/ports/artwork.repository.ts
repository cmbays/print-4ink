import type { Artwork } from '@domain/entities/artwork'

export type IArtworkRepository = {
  getAll(): Promise<Artwork[]>
  getById(id: string): Promise<Artwork | null>
}
