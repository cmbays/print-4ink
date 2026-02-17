import type { Screen } from '@domain/entities/screen'

export type IScreenRepository = {
  getAll(): Promise<Screen[]>
  getByJobId(jobId: string): Promise<Screen[]>
}
