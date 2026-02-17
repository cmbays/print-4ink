import { colors } from '@/lib/mock-data';
import type { Color } from '@/lib/schemas/color';

export async function getColors(): Promise<Color[]> {
  return colors.map((c) => ({ ...c }));
}

export async function getColorById(id: string): Promise<Color | null> {
  const color = colors.find((c) => c.id === id);
  return color ? { ...color } : null;
}
