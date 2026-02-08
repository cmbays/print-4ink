import { describe, it, expect } from "vitest";
import {
  jobSchema,
  productionStateEnum,
  priorityEnum,
  printLocationSchema,
} from "../job";

describe("productionStateEnum", () => {
  it.each(["design", "approval", "burning", "press", "finishing", "shipped"])(
    "accepts '%s'",
    (state) => {
      expect(productionStateEnum.parse(state)).toBe(state);
    }
  );

  it("rejects invalid state", () => {
    expect(() => productionStateEnum.parse("invalid")).toThrow();
  });
});

describe("priorityEnum", () => {
  it.each(["low", "medium", "high", "rush"])("accepts '%s'", (priority) => {
    expect(priorityEnum.parse(priority)).toBe(priority);
  });

  it("rejects invalid priority", () => {
    expect(() => priorityEnum.parse("critical")).toThrow();
  });
});

describe("printLocationSchema", () => {
  it("accepts a valid print location", () => {
    const loc = { position: "Front Center", colorCount: 3, artworkApproved: true };
    expect(printLocationSchema.parse(loc)).toEqual(loc);
  });

  it("rejects zero color count", () => {
    expect(() =>
      printLocationSchema.parse({ position: "Front", colorCount: 0, artworkApproved: true })
    ).toThrow();
  });

  it("rejects empty position", () => {
    expect(() =>
      printLocationSchema.parse({ position: "", colorCount: 1, artworkApproved: true })
    ).toThrow();
  });
});

describe("jobSchema", () => {
  const validJob = {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    jobNumber: "J-1024",
    title: "Staff Tees",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    status: "press",
    priority: "high",
    dueDate: "2026-02-14",
    garments: [
      {
        sku: "G500-BLK",
        style: "Gildan 5000",
        brand: "Gildan",
        color: "Black",
        sizes: { S: 5, M: 15 },
      },
    ],
    printLocations: [
      { position: "Front Center", colorCount: 3, artworkApproved: true },
    ],
  };

  it("accepts a valid job", () => {
    const result = jobSchema.parse(validJob);
    expect(result.jobNumber).toBe("J-1024");
  });

  it("accepts empty garments and print locations", () => {
    const result = jobSchema.parse({
      ...validJob,
      garments: [],
      printLocations: [],
    });
    expect(result.garments).toEqual([]);
    expect(result.printLocations).toEqual([]);
  });

  it("rejects invalid UUID for id", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, id: "bad" })
    ).toThrow();
  });

  it("rejects invalid date format", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, dueDate: "Feb 14, 2026" })
    ).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, status: "cancelled" })
    ).toThrow();
  });

  it("rejects invalid priority", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, priority: "urgent" })
    ).toThrow();
  });
});
