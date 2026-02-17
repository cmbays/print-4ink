// Auth classification: AUTHENTICATED — production operations; links customers to orders.
// Phase 2: All functions must call verifySession() before returning data.
export {
  getJobs,
  getJobById,
  getJobsByLane,
  getJobsByServiceType,
  getJobTasks,
  getJobNotes,
  getQuoteCards,
  getScratchNotes,
} from '@infra/repositories/_providers/mock/jobs';
