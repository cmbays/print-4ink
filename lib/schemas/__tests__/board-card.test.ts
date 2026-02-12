import { describe, it, expect } from "vitest";
import {
  scratchNoteCardSchema,
  quoteCardSchema,
  jobCardSchema,
  boardCardSchema,
} from "../board-card";

describe("scratchNoteCardSchema", () => {
  const validCard = {
    type: "scratch_note" as const,
    id: "5a100001-0000-4000-8000-000000000001",
    content: "Walk-in asked about DTF pricing for 50 custom transfers",
    createdAt: "2026-02-12T10:00:00Z",
    isArchived: false,
    lane: "ready" as const,
  };

  it("validates a valid scratch note card", () => {
    expect(() => scratchNoteCardSchema.parse(validCard)).not.toThrow();
  });

  it("enforces lane is always 'ready'", () => {
    expect(() =>
      scratchNoteCardSchema.parse({ ...validCard, lane: "in_progress" })
    ).toThrow();
  });

  it("rejects empty content", () => {
    expect(() =>
      scratchNoteCardSchema.parse({ ...validCard, content: "" })
    ).toThrow();
  });
});

describe("quoteCardSchema", () => {
  const validCard = {
    type: "quote" as const,
    quoteId: "02b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    customerName: "Lonestar Lacrosse",
    description: "Tournament jerseys — accepted, ready for job creation",
    serviceType: "screen-print" as const,
    quantity: 300,
    total: 2614,
    dueDate: "2026-02-22",
    lane: "done" as const,
    quoteStatus: "accepted" as const,
    isNew: true,
  };

  it("validates a valid quote card", () => {
    expect(() => quoteCardSchema.parse(validCard)).not.toThrow();
  });

  it("accepts optional fields omitted", () => {
    const minimal = {
      type: "quote" as const,
      quoteId: "02b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
      customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
      customerName: "Test",
      description: "Test description",
      lane: "ready" as const,
      quoteStatus: "draft" as const,
      isNew: false,
    };
    expect(() => quoteCardSchema.parse(minimal)).not.toThrow();
  });

  it("rejects invalid quoteStatus", () => {
    expect(() =>
      quoteCardSchema.parse({ ...validCard, quoteStatus: "approved" })
    ).toThrow();
  });

  it("rejects invalid lane", () => {
    expect(() =>
      quoteCardSchema.parse({ ...validCard, lane: "pending" })
    ).toThrow();
  });

  it("rejects empty customerName", () => {
    expect(() =>
      quoteCardSchema.parse({ ...validCard, customerName: "" })
    ).toThrow();
  });
});

describe("jobCardSchema", () => {
  const validCard = {
    type: "job" as const,
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    jobNumber: "J-1024",
    title: "River City Staff Tees",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    customerName: "River City Brewing Co.",
    lane: "in_progress" as const,
    serviceType: "screen-print" as const,
    quantity: 200,
    locationCount: 2,
    startDate: "2026-02-10",
    dueDate: "2026-02-14",
    riskLevel: "on_track" as const,
    priority: "high" as const,
    taskProgress: { completed: 5, total: 8 },
  };

  it("validates a valid job card", () => {
    expect(() => jobCardSchema.parse(validCard)).not.toThrow();
  });

  it("accepts optional fields (assigneeInitials, blockReason, invoiceId)", () => {
    const withOptionals = {
      ...validCard,
      assigneeInitials: "GK",
      blockReason: "Waiting on blanks",
      sourceQuoteId: "01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      invoiceId: "b1a10001-e5f6-4a01-8b01-0d1e2f3a4b01",
      invoiceStatus: "paid" as const,
    };
    expect(() => jobCardSchema.parse(withOptionals)).not.toThrow();
  });

  it("rejects invalid invoiceStatus", () => {
    expect(() =>
      jobCardSchema.parse({ ...validCard, invoiceStatus: "overdue" })
    ).toThrow();
  });

  it("rejects zero quantity", () => {
    expect(() =>
      jobCardSchema.parse({ ...validCard, quantity: 0 })
    ).toThrow();
  });

  it("rejects invalid risk level", () => {
    expect(() =>
      jobCardSchema.parse({ ...validCard, riskLevel: "critical" })
    ).toThrow();
  });

  it("rejects assigneeInitials over 3 chars", () => {
    expect(() =>
      jobCardSchema.parse({ ...validCard, assigneeInitials: "ABCD" })
    ).toThrow();
  });
});

describe("boardCardSchema (discriminated union)", () => {
  it("accepts a scratch_note card", () => {
    const card = {
      type: "scratch_note",
      id: "5a100001-0000-4000-8000-000000000001",
      content: "Test note",
      createdAt: "2026-02-12T10:00:00Z",
      isArchived: false,
      lane: "ready",
    };
    const result = boardCardSchema.parse(card);
    expect(result.type).toBe("scratch_note");
  });

  it("accepts a quote card", () => {
    const card = {
      type: "quote",
      quoteId: "02b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
      customerId: "d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
      customerName: "Test",
      description: "Test",
      lane: "ready",
      quoteStatus: "draft",
      isNew: false,
    };
    const result = boardCardSchema.parse(card);
    expect(result.type).toBe("quote");
  });

  it("accepts a job card", () => {
    const card = {
      type: "job",
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      jobNumber: "J-1024",
      title: "Test Job",
      customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
      customerName: "Test Customer",
      lane: "ready",
      serviceType: "screen-print",
      quantity: 100,
      locationCount: 1,
      startDate: "2026-02-10",
      dueDate: "2026-02-14",
      riskLevel: "on_track",
      priority: "medium",
      taskProgress: { completed: 0, total: 8 },
    };
    const result = boardCardSchema.parse(card);
    expect(result.type).toBe("job");
  });

  it("rejects invalid type discriminator", () => {
    expect(() =>
      boardCardSchema.parse({ type: "invoice", id: "test" })
    ).toThrow();
  });
});
