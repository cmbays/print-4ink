import { screens } from '@/lib/mock-data';
import { validateUUID } from '@/lib/dal/_shared/validation';
import type { Screen } from '@/lib/schemas/screen';

export async function getScreens(): Promise<Screen[]> {
  return screens.map((s) => structuredClone(s));
}

export async function getScreensByJobId(jobId: string): Promise<Screen[]> {
  if (!validateUUID(jobId)) return [];
  return screens.filter((s) => s.jobId === jobId).map((s) => structuredClone(s));
}
