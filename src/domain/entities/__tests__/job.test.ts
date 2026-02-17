import { describe, it, expect } from "vitest";
import {
  jobSchema,
  productionStateEnum,
  priorityEnum,
  laneEnum,
  riskLevelEnum,
  jobNoteTypeEnum,
  jobTaskSchema,
  jobNoteSchema,
  jobHistoryEntrySchema,
  garmentDetailSchema,
  jobPrintLocationSchema,
  jobComplexitySchema,
} from "../job";

// ---------------------------------------------------------------------------
// Backward-compat enums (kept for dashboard references)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// New lane-model enums
// ---------------------------------------------------------------------------

describe("laneEnum", () => {
  it.each(["ready", "in_progress", "review", "blocked", "done"])(
    "accepts '%s'",
    (lane) => {
      expect(laneEnum.parse(lane)).toBe(lane);
    }
  );

  it("rejects invalid lane", () => {
    expect(() => laneEnum.parse("pending")).toThrow();
    expect(() => laneEnum.parse("")).toThrow();
  });
});

describe("riskLevelEnum", () => {
  it.each(["on_track", "getting_tight", "at_risk"])(
    "accepts '%s'",
    (risk) => {
      expect(riskLevelEnum.parse(risk)).toBe(risk);
    }
  );

  it("rejects invalid risk level", () => {
    expect(() => riskLevelEnum.parse("overdue")).toThrow();
  });
});

describe("jobNoteTypeEnum", () => {
  it.each(["internal", "customer", "system"])("accepts '%s'", (type) => {
    expect(jobNoteTypeEnum.parse(type)).toBe(type);
  });

  it("rejects invalid note type", () => {
    expect(() => jobNoteTypeEnum.parse("private")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

describe("jobTaskSchema", () => {
  const validTask = {
    id: "1a240001-0001-4001-8001-000000001024",
    label: "Art files finalized",
    isCompleted: true,
    completedAt: "2026-02-02T10:00:00Z",
    isCanonical: true,
    sortOrder: 0,
  };

  it("validates a valid completed task", () => {
    expect(() => jobTaskSchema.parse(validTask)).not.toThrow();
  });

  it("validates a task with optional detail", () => {
    expect(() =>
      jobTaskSchema.parse({ ...validTask, detail: "Stitch file created" })
    ).not.toThrow();
  });

  it("validates an incomplete task (no completedAt)", () => {
    const incomplete = {
      id: "1a240002-0001-4001-8001-000000001024",
      label: "Screens burned",
      isCompleted: false,
      isCanonical: true,
      sortOrder: 2,
    };
    expect(() => jobTaskSchema.parse(incomplete)).not.toThrow();
  });

  it("rejects empty label", () => {
    expect(() => jobTaskSchema.parse({ ...validTask, label: "" })).toThrow();
  });

  it("rejects invalid UUID", () => {
    expect(() => jobTaskSchema.parse({ ...validTask, id: "bad" })).toThrow();
  });

  it("rejects negative sortOrder", () => {
    expect(() =>
      jobTaskSchema.parse({ ...validTask, sortOrder: -1 })
    ).toThrow();
  });
});

describe("jobNoteSchema", () => {
  const validNote = {
    id: "2a240001-0001-4001-8001-000000001024",
    type: "internal",
    content: "Using 230 mesh for detail work",
    author: "Gary",
    createdAt: "2026-02-04T11:30:00Z",
  };

  it("validates a valid note", () => {
    expect(() => jobNoteSchema.parse(validNote)).not.toThrow();
  });

  it("accepts all note types", () => {
    for (const type of ["internal", "customer", "system"]) {
      expect(() => jobNoteSchema.parse({ ...validNote, type })).not.toThrow();
    }
  });

  it("rejects empty content", () => {
    expect(() =>
      jobNoteSchema.parse({ ...validNote, content: "" })
    ).toThrow();
  });

  it("rejects empty author", () => {
    expect(() =>
      jobNoteSchema.parse({ ...validNote, author: "" })
    ).toThrow();
  });
});

describe("jobHistoryEntrySchema", () => {
  it("validates a valid lane transition", () => {
    const entry = {
      fromLane: "ready",
      toLane: "in_progress",
      timestamp: "2026-02-03T09:00:00Z",
    };
    expect(() => jobHistoryEntrySchema.parse(entry)).not.toThrow();
  });

  it("validates a transition with optional note", () => {
    const entry = {
      fromLane: "in_progress",
      toLane: "blocked",
      timestamp: "2026-02-06T09:00:00Z",
      note: "Vendor delayed digitized file",
    };
    expect(() => jobHistoryEntrySchema.parse(entry)).not.toThrow();
  });

  it("rejects invalid lane value in fromLane", () => {
    expect(() =>
      jobHistoryEntrySchema.parse({
        fromLane: "pending",
        toLane: "ready",
        timestamp: "2026-02-01T10:00:00Z",
      })
    ).toThrow();
  });
});

describe("garmentDetailSchema", () => {
  it("validates a valid garment detail", () => {
    const detail = {
      garmentId: "gc-002",
      colorId: "clr-black",
      sizes: { S: 20, M: 60, L: 70, XL: 50 },
    };
    expect(() => garmentDetailSchema.parse(detail)).not.toThrow();
  });

  it("rejects empty garmentId", () => {
    expect(() =>
      garmentDetailSchema.parse({
        garmentId: "",
        colorId: "clr-black",
        sizes: { M: 10 },
      })
    ).toThrow();
  });

  it("rejects negative size count", () => {
    expect(() =>
      garmentDetailSchema.parse({
        garmentId: "gc-001",
        colorId: "clr-white",
        sizes: { M: -5 },
      })
    ).toThrow();
  });
});

describe("jobPrintLocationSchema", () => {
  it("validates a valid print location", () => {
    const loc = { position: "Front Center", colorCount: 3, artworkApproved: true };
    expect(() => jobPrintLocationSchema.parse(loc)).not.toThrow();
  });

  it("rejects zero color count", () => {
    expect(() =>
      jobPrintLocationSchema.parse({ position: "Front", colorCount: 0, artworkApproved: true })
    ).toThrow();
  });

  it("rejects empty position", () => {
    expect(() =>
      jobPrintLocationSchema.parse({ position: "", colorCount: 1, artworkApproved: true })
    ).toThrow();
  });
});

describe("jobComplexitySchema", () => {
  it("validates a valid complexity object", () => {
    const complexity = { locationCount: 2, screenCount: 5, garmentVariety: 1 };
    expect(() => jobComplexitySchema.parse(complexity)).not.toThrow();
  });

  it("allows optional screenCount", () => {
    const complexity = { locationCount: 1, garmentVariety: 2 };
    expect(() => jobComplexitySchema.parse(complexity)).not.toThrow();
  });

  it("rejects zero garmentVariety", () => {
    expect(() =>
      jobComplexitySchema.parse({ locationCount: 1, garmentVariety: 0 })
    ).toThrow();
  });

  it("rejects negative locationCount", () => {
    expect(() =>
      jobComplexitySchema.parse({ locationCount: -1, garmentVariety: 1 })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Main job schema
// ---------------------------------------------------------------------------

describe("jobSchema", () => {
  const validJob = {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    jobNumber: "J-1024",
    title: "Staff Tees",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    lane: "in_progress",
    serviceType: "screen-print",
    startDate: "2026-02-03",
    dueDate: "2026-02-14",
    createdAt: "2026-02-01T10:00:00Z",
    priority: "high",
    riskLevel: "on_track",
    quantity: 200,
    garmentDetails: [
      { garmentId: "gc-002", colorId: "clr-black", sizes: { S: 20, M: 60, L: 70, XL: 50 } },
    ],
    printLocations: [
      { position: "Front Center", colorCount: 3, artworkApproved: true },
    ],
    complexity: { locationCount: 2, screenCount: 5, garmentVariety: 1 },
    tasks: [
      { id: "1a240001-0001-4001-8001-000000001024", label: "Art files finalized", isCompleted: true, completedAt: "2026-02-02T10:00:00Z", isCanonical: true, sortOrder: 0 },
      { id: "1a240002-0001-4001-8001-000000001025", label: "Film positives printed", isCompleted: false, isCanonical: true, sortOrder: 1 },
    ],
    orderTotal: 1850,
    artworkIds: ["art-001"],
    history: [
      { fromLane: "ready", toLane: "in_progress", timestamp: "2026-02-03T09:00:00Z" },
    ],
    notes: [
      { id: "2a240001-0001-4001-8001-000000001024", type: "internal", content: "Test note", author: "Gary", createdAt: "2026-02-01T10:00:00Z" },
    ],
    isArchived: false,
  };

  it("validates a full valid job", () => {
    const result = jobSchema.parse(validJob);
    expect(result.jobNumber).toBe("J-1024");
    expect(result.lane).toBe("in_progress");
    expect(result.tasks).toHaveLength(2);
  });

  it("accepts empty tasks, history, and notes arrays", () => {
    const result = jobSchema.parse({
      ...validJob,
      tasks: [],
      history: [],
      notes: [],
      artworkIds: [],
    });
    expect(result.tasks).toEqual([]);
    expect(result.history).toEqual([]);
    expect(result.notes).toEqual([]);
  });

  it("accepts optional fields (sourceQuoteId, invoiceId, completedAt)", () => {
    const result = jobSchema.parse({
      ...validJob,
      lane: "done",
      sourceQuoteId: "03c4d5e6-f7a8-4b9c-8d1e-2f3a4b5c6d7e",
      invoiceId: "b1a10003-e5f6-4a03-8b03-0d1e2f3a4b03",
      completedAt: "2026-02-08T16:00:00Z",
    });
    expect(result.sourceQuoteId).toBeDefined();
    expect(result.invoiceId).toBeDefined();
    expect(result.completedAt).toBeDefined();
  });

  it("accepts block fields for blocked jobs", () => {
    const result = jobSchema.parse({
      ...validJob,
      lane: "blocked",
      riskLevel: "at_risk",
      blockReason: "Waiting on digitized stitch file from vendor",
      blockedAt: "2026-02-06T09:00:00Z",
      blockedBy: "Gary",
    });
    expect(result.blockReason).toBe("Waiting on digitized stitch file from vendor");
  });

  it("rejects invalid UUID for id", () => {
    expect(() => jobSchema.parse({ ...validJob, id: "bad" })).toThrow();
  });

  it("rejects invalid job number format", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, jobNumber: "1024" })
    ).toThrow();
    expect(() =>
      jobSchema.parse({ ...validJob, jobNumber: "J-12" })
    ).toThrow();
  });

  it("rejects invalid lane value", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, lane: "cancelled" })
    ).toThrow();
  });

  it("rejects invalid service type", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, serviceType: "sublimation" })
    ).toThrow();
  });

  it("rejects invalid date format", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, dueDate: "Feb 14, 2026" })
    ).toThrow();
  });

  it("rejects zero quantity", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, quantity: 0 })
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    const { lane: _lane, ...noLane } = validJob;
    expect(() => jobSchema.parse(noLane)).toThrow();

    const { serviceType: _serviceType, ...noServiceType } = validJob;
    expect(() => jobSchema.parse(noServiceType)).toThrow();

    const { complexity: _complexity, ...noComplexity } = validJob;
    expect(() => jobSchema.parse(noComplexity)).toThrow();
  });

  it("defaults isArchived to false when omitted", () => {
    const { isArchived: _isArchived, ...noArchived } = validJob;
    const result = jobSchema.parse(noArchived);
    expect(result.isArchived).toBe(false);
  });
});
