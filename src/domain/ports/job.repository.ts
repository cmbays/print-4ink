import type { Job, JobTask, JobNote } from '@domain/entities/job'
import type { QuoteCard } from '@domain/entities/board-card'
import type { ScratchNote } from '@domain/entities/scratch-note'

export type IJobRepository = {
  getAll(): Promise<Job[]>
  getById(id: string): Promise<Job | null>
  getByLane(lane: Job['lane']): Promise<Job[]>
  getByServiceType(type: Job['serviceType']): Promise<Job[]>
  getTasks(jobId: string): Promise<JobTask[]>
  getNotes(jobId: string): Promise<JobNote[]>
  getQuoteCards(): Promise<QuoteCard[]>
  getScratchNotes(): Promise<ScratchNote[]>
}
