import { garmentCatalog, colors } from "@/lib/mock-data";
import type { GarmentCatalog } from "@/lib/schemas/garment";
import type { Color } from "@/lib/schemas/color";

export function getGarmentById(id: string): GarmentCatalog | null {
  return garmentCatalog.find((g) => g.id === id) ?? null;
}

export function getColorById(id: string): Color | null {
  return colors.find((c) => c.id === id) ?? null;
}

/** Unique brand names from the garment catalog, sorted alphabetically. */
export function getAvailableBrands(): string[] {
  const brands = new Set(garmentCatalog.map((g) => g.brand));
  return Array.from(brands).sort();
}
