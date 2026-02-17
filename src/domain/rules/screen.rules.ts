import type { CustomerScreen } from "@domain/entities/customer-screen";
import type { Screen } from "@domain/entities/screen";
import type { Job } from "@domain/entities/job";

export function getScreensByJobId(jobId: string, screens: Screen[]): Screen[] {
  return screens.filter((s) => s.jobId === jobId);
}

export function getActiveCustomerScreens(customerId: string, jobs: Job[]): CustomerScreen[] {
  return deriveScreensFromJobs(customerId, jobs);
}

export function deriveScreensFromJobs(customerId: string, jobs: Job[]): CustomerScreen[] {
  const customerJobs = jobs.filter(
    (j) => j.customerId === customerId && j.lane === "done"
  );

  return customerJobs.flatMap((job) =>
    job.printLocations.map((loc, i) => ({
      id: `cs-${job.id}-${i}`,
      customerId,
      jobId: job.id,
      artworkName: `${job.title} — ${loc.position}`,
      colorIds: job.garmentDetails.map((gd) => gd.colorId),
      meshCount: Math.max(1, loc.colorCount * 110),
      createdAt: job.completedAt ?? job.createdAt,
    }))
  );
}
