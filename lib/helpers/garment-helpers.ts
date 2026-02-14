import { garmentCatalog, colors } from "@/lib/mock-data";
import type { GarmentCatalog } from "@/lib/schemas/garment";
import type { Color } from "@/lib/schemas/color";

export function getGarmentById(id: string): GarmentCatalog | null {
  return garmentCatalog.find((g) => g.id === id) ?? null;
}

export function getColorById(id: string): Color | null {
  return colors.find((c) => c.id === id) ?? null;
}
