import { colors } from '@/lib/mock-data';
import { validateUUID } from '@/lib/dal/_shared/validation';
import type { Color } from '@/lib/schemas/color';

export async function getColors(): Promise<Color[]> {
  return colors.map((c) => ({ ...c }));
}

export async function getColorById(id: string): Promise<Color | null> {
  if (!validateUUID(id)) return null;
  const color = colors.find((c) => c.id === id);
  return color ? { ...color } : null;
}

/** Phase 1 only: returns the raw mutable colors array for in-place mock data mutations. */
export function getColorsMutable(): Color[] {
  return colors;
}
