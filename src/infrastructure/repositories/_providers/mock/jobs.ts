import { jobs, quoteCards, scratchNotes } from '@/lib/mock-data'
import { validateUUID } from '@infra/repositories/_shared/validation'
import type { Job, JobTask, JobNote } from '@domain/entities/job'
import type { QuoteCard } from '@domain/entities/board-card'
import type { ScratchNote } from '@domain/entities/scratch-note'

export async function getJobs(): Promise<Job[]> {
  return jobs.map((j) => structuredClone(j))
}

export async function getJobById(id: string): Promise<Job | null> {
  if (!validateUUID(id)) return null
  const job = jobs.find((j) => j.id === id)
  return job ? structuredClone(job) : null
}

export async function getJobsByLane(lane: Job['lane']): Promise<Job[]> {
  return jobs.filter((j) => j.lane === lane).map((j) => structuredClone(j))
}

export async function getJobsByServiceType(type: Job['serviceType']): Promise<Job[]> {
  return jobs.filter((j) => j.serviceType === type).map((j) => structuredClone(j))
}

export async function getJobTasks(jobId: string): Promise<JobTask[]> {
  if (!validateUUID(jobId)) return []
  const job = jobs.find((j) => j.id === jobId)
  return (job?.tasks ?? []).map((t) => structuredClone(t))
}

export async function getJobNotes(jobId: string): Promise<JobNote[]> {
  if (!validateUUID(jobId)) return []
  const job = jobs.find((j) => j.id === jobId)
  return (job?.notes ?? []).map((n) => structuredClone(n))
}

export async function getQuoteCards(): Promise<QuoteCard[]> {
  return quoteCards.map((qc) => structuredClone(qc))
}

export async function getScratchNotes(): Promise<ScratchNote[]> {
  return scratchNotes.map((sn) => structuredClone(sn))
}

/** Phase 1 only: returns raw mutable jobs/quoteCards/scratchNotes arrays for in-place mock data mutations. */
export function getJobsMutable(): Job[] {
  return jobs
}
export function getQuoteCardsMutable(): QuoteCard[] {
  return quoteCards
}
