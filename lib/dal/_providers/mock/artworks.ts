import { artworks } from '@/lib/mock-data';
import type { Artwork } from '@/lib/schemas/artwork';

export async function getArtworks(): Promise<Artwork[]> {
  return artworks.map((a) => ({ ...a }));
}

export async function getArtworkById(id: string): Promise<Artwork | null> {
  const artwork = artworks.find((a) => a.id === id);
  return artwork ? { ...artwork } : null;
}
