import { describe, it, expect } from "vitest";
import { deriveScreensFromJobs } from "../screen-helpers";
import { jobs } from "@/lib/mock-data";

describe("deriveScreensFromJobs", () => {
  it("returns screen records for a customer with completed jobs", () => {
    const doneJob = jobs.find((j) => j.lane === "done");
    if (!doneJob) return;

    const screens = deriveScreensFromJobs(doneJob.customerId);
    expect(screens.length).toBeGreaterThan(0);
    expect(screens[0]).toHaveProperty("artworkName");
    expect(screens[0]).toHaveProperty("colorIds");
    expect(screens[0]).toHaveProperty("meshCount");
    expect(screens[0]).toHaveProperty("jobId");
  });

  it("returns empty array for customer with no jobs", () => {
    const screens = deriveScreensFromJobs("nonexistent-id");
    expect(screens).toEqual([]);
  });

  it("only includes done lane jobs", () => {
    const inProgressJob = jobs.find((j) => j.lane === "in_progress");
    if (!inProgressJob) return;

    const screens = deriveScreensFromJobs(inProgressJob.customerId);
    // Should not include screens from in_progress jobs
    screens.forEach((s) => {
      const job = jobs.find((j) => j.id === s.jobId);
      expect(job?.lane).toBe("done");
    });
  });
});
