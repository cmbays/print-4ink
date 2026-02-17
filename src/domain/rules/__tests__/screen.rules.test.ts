import { describe, it, expect } from "vitest";
import { deriveScreensFromJobs, getScreensByJobId, getActiveCustomerScreens } from "../screen.rules";
import { jobs, screens } from "@/lib/mock-data";

describe("deriveScreensFromJobs", () => {
  it("returns screen records for a customer with completed jobs", () => {
    const doneJob = jobs.find((j) => j.lane === "done");
    if (!doneJob) {
      throw new Error("Expected at least one done job in mock data.");
    }

    const result = deriveScreensFromJobs(doneJob.customerId, jobs);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("artworkName");
    expect(result[0]).toHaveProperty("colorIds");
    expect(result[0]).toHaveProperty("meshCount");
    expect(result[0]).toHaveProperty("jobId");
  });

  it("returns empty array for customer with no jobs", () => {
    const result = deriveScreensFromJobs("nonexistent-id", jobs);
    expect(result).toEqual([]);
  });

  it("only includes done lane jobs", () => {
    const inProgressJob = jobs.find((j) => j.lane === "in_progress");
    if (!inProgressJob) {
      throw new Error("Expected at least one in_progress job in mock data.");
    }

    const result = deriveScreensFromJobs(inProgressJob.customerId, jobs);
    // Should not include screens from in_progress jobs
    result.forEach((s) => {
      const job = jobs.find((j) => j.id === s.jobId);
      expect(job?.lane).toBe("done");
    });
  });
});

describe("getScreensByJobId", () => {
  it("returns screens for a known job with 2 screens", () => {
    // Job J-1024 (River City Staff Tees) has 2 screens
    const result = getScreensByJobId("f1a00001-e5f6-4a01-8b01-0d1e2f3a4b01", screens);
    expect(result).toHaveLength(2);
    expect(result[0].burnStatus).toBe("burned");
    expect(result[1].burnStatus).toBe("burned");
  });

  it("returns screens for a job with pending screens", () => {
    // Job J-1026 (Lonestar Lacrosse) has 2 pending screens
    const result = getScreensByJobId("f1a00003-e5f6-4a03-8b03-0d1e2f3a4b03", screens);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.burnStatus === "pending")).toBe(true);
  });

  it("returns empty array for unknown job ID", () => {
    const result = getScreensByJobId("nonexistent-id", screens);
    expect(result).toHaveLength(0);
  });

  it("returns single reclaimed screen for a job", () => {
    // Job J-1028 (River City Pint Night) has 1 reclaimed screen
    const result = getScreensByJobId("f1a00005-e5f6-4a05-8b05-0d1e2f3a4b05", screens);
    expect(result).toHaveLength(1);
    expect(result[0].burnStatus).toBe("reclaimed");
  });
});

describe("getActiveCustomerScreens", () => {
  it("returns derived screens for a customer with completed jobs", () => {
    const doneJob = jobs.find((j) => j.lane === "done");
    if (!doneJob) {
      throw new Error("Expected at least one done job in mock data.");
    }
    const result = getActiveCustomerScreens(doneJob.customerId, jobs);
    const derived = deriveScreensFromJobs(doneJob.customerId, jobs);
    expect(result).toEqual(derived);
  });

  it("returns empty array for customer with no completed jobs", () => {
    const result = getActiveCustomerScreens("nonexistent-customer", jobs);
    expect(result).toHaveLength(0);
  });
});
