import type { GarmentCatalog } from "@domain/entities/garment";
import type { Color } from "@domain/entities/color";

export function getGarmentById(id: string, catalog: GarmentCatalog[]): GarmentCatalog | null {
  return catalog.find((g) => g.id === id) ?? null;
}

export function getColorById(id: string, colorList: Color[]): Color | null {
  return colorList.find((c) => c.id === id) ?? null;
}

/** Unique brand names from the garment catalog, sorted alphabetically. */
export function getAvailableBrands(catalog: GarmentCatalog[]): string[] {
  const brands = new Set(catalog.map((g) => g.brand));
  return Array.from(brands).sort();
}
