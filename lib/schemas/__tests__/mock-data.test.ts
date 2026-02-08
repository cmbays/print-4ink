import { describe, it, expect } from "vitest";
import { customerSchema } from "../customer";
import { jobSchema } from "../job";
import { quoteSchema } from "../quote";
import { screenSchema } from "../screen";
import { customers, jobs, quotes, screens } from "@/lib/mock-data";

describe("mock data validates against schemas", () => {
  it("all customers are valid", () => {
    for (const customer of customers) {
      expect(() => customerSchema.parse(customer)).not.toThrow();
    }
  });

  it("all jobs are valid", () => {
    for (const job of jobs) {
      expect(() => jobSchema.parse(job)).not.toThrow();
    }
  });

  it("all quotes are valid", () => {
    for (const quote of quotes) {
      expect(() => quoteSchema.parse(quote)).not.toThrow();
    }
  });

  it("all screens are valid", () => {
    for (const screen of screens) {
      expect(() => screenSchema.parse(screen)).not.toThrow();
    }
  });

  it("all job customerIds reference existing customers", () => {
    const customerIds = new Set(customers.map((c) => c.id));
    for (const job of jobs) {
      expect(customerIds.has(job.customerId)).toBe(true);
    }
  });

  it("all quote customerIds reference existing customers", () => {
    const customerIds = new Set(customers.map((c) => c.id));
    for (const quote of quotes) {
      expect(customerIds.has(quote.customerId)).toBe(true);
    }
  });

  it("all screen jobIds reference existing jobs", () => {
    const jobIds = new Set(jobs.map((j) => j.id));
    for (const screen of screens) {
      expect(jobIds.has(screen.jobId)).toBe(true);
    }
  });
});
