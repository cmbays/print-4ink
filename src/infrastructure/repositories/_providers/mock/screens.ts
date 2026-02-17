import { screens } from '@/lib/mock-data'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { Screen } from '@domain/entities/screen'

export async function getScreens(): Promise<Screen[]> {
  return screens.map((s) => structuredClone(s))
}

export async function getScreensByJobId(jobId: string): Promise<Screen[]> {
  if (!validateUUID(jobId)) return []
  return screens.filter((s) => s.jobId === jobId).map((s) => structuredClone(s))
}

/** Phase 1 only: returns raw mutable screens array for in-place mock data mutations. */
export function getScreensMutable(): Screen[] {
  return screens
}
