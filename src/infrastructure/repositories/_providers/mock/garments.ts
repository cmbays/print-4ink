import { garmentCatalog } from '@/lib/mock-data';
import { validateUUID } from '@infra/repositories/_shared/validation';
import type { GarmentCatalog } from '@domain/entities/garment';

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  return garmentCatalog.map((g) => structuredClone(g));
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  if (!validateUUID(id)) return null;
  const garment = garmentCatalog.find((g) => g.id === id);
  return garment ? structuredClone(garment) : null;
}

export async function getAvailableBrands(): Promise<string[]> {
  const brands = new Set(garmentCatalog.map((g) => g.brand));
  return Array.from(brands).sort();
}

/** Phase 1 only: returns the raw mutable garment catalog array. */
export function getGarmentCatalogMutable(): GarmentCatalog[] {
  return garmentCatalog;
}
