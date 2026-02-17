import { garmentCatalog } from '@/lib/mock-data';
import type { GarmentCatalog } from '@/lib/schemas/garment';

export async function getGarmentCatalog(): Promise<GarmentCatalog[]> {
  return garmentCatalog.map((g) => ({ ...g }));
}

export async function getGarmentById(id: string): Promise<GarmentCatalog | null> {
  const garment = garmentCatalog.find((g) => g.id === id);
  return garment ? { ...garment } : null;
}

export async function getAvailableBrands(): Promise<string[]> {
  const brands = new Set(garmentCatalog.map((g) => g.brand));
  return Array.from(brands).sort();
}
