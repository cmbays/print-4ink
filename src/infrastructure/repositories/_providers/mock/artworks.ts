import { artworks } from './data'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { Artwork } from '@domain/entities/artwork'

export async function getArtworks(): Promise<Artwork[]> {
  return artworks.map((a) => ({ ...a }))
}

export async function getArtworkById(id: string): Promise<Artwork | null> {
  if (!validateUUID(id)) return null
  const artwork = artworks.find((a) => a.id === id)
  return artwork ? { ...artwork } : null
}

/** Phase 1 only: returns raw mutable artworks array for in-place mock data mutations. */
export function getArtworksMutable(): Artwork[] {
  return artworks
}
