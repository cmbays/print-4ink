import { z } from 'zod';

const uuidSchema = z.string().uuid();

export function validateUUID(id: string): string | null {
  const result = uuidSchema.safeParse(id);
  return result.success ? result.data : null;
}
