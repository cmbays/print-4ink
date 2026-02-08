import { describe, it, expect } from "vitest";
import { quoteSchema, quoteStatusEnum, quoteLineItemSchema } from "../quote";

describe("quoteStatusEnum", () => {
  it.each(["draft", "sent", "accepted", "declined", "revised"])(
    "accepts '%s'",
    (status) => {
      expect(quoteStatusEnum.parse(status)).toBe(status);
    }
  );

  it("rejects invalid status", () => {
    expect(() => quoteStatusEnum.parse("pending")).toThrow();
  });

  it("rejects old statuses", () => {
    expect(() => quoteStatusEnum.parse("approved")).toThrow();
    expect(() => quoteStatusEnum.parse("rejected")).toThrow();
  });
});

describe("quoteLineItemSchema", () => {
  const validItem = {
    garmentId: "gc-001",
    colorId: "clr-black",
    sizes: { S: 5, M: 15, L: 20, XL: 10 },
    printLocations: ["Front Center", "Back Full"],
    colorsPerLocation: 3,
    unitPrice: 14.5,
    lineTotal: 725,
  };

  it("accepts a valid line item", () => {
    const result = quoteLineItemSchema.parse(validItem);
    expect(result.garmentId).toBe("gc-001");
    expect(result.colorId).toBe("clr-black");
    expect(result.printLocations).toEqual(["Front Center", "Back Full"]);
  });

  it("defaults colorsPerLocation to 1 when omitted", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { colorsPerLocation, ...withoutColors } = validItem;
    const result = quoteLineItemSchema.parse(withoutColors);
    expect(result.colorsPerLocation).toBe(1);
  });

  it("rejects zero colorsPerLocation", () => {
    expect(() =>
      quoteLineItemSchema.parse({ ...validItem, colorsPerLocation: 0 })
    ).toThrow();
  });

  it("rejects negative unit price", () => {
    expect(() =>
      quoteLineItemSchema.parse({ ...validItem, unitPrice: -1 })
    ).toThrow();
  });

  it("accepts zero unit price", () => {
    const result = quoteLineItemSchema.parse({ ...validItem, unitPrice: 0 });
    expect(result.unitPrice).toBe(0);
  });

  it("rejects negative lineTotal", () => {
    expect(() =>
      quoteLineItemSchema.parse({ ...validItem, lineTotal: -1 })
    ).toThrow();
  });

  it("accepts empty sizes record", () => {
    const result = quoteLineItemSchema.parse({ ...validItem, sizes: {} });
    expect(result.sizes).toEqual({});
  });

  it("rejects negative size quantities", () => {
    expect(() =>
      quoteLineItemSchema.parse({ ...validItem, sizes: { M: -1 } })
    ).toThrow();
  });

  it("accepts empty printLocations array", () => {
    const result = quoteLineItemSchema.parse({
      ...validItem,
      printLocations: [],
    });
    expect(result.printLocations).toEqual([]);
  });
});

describe("quoteSchema", () => {
  const validQuote = {
    id: "01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    quoteNumber: "Q-1024",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    lineItems: [
      {
        garmentId: "gc-002",
        colorId: "clr-black",
        sizes: { S: 5, M: 15, L: 20, XL: 10 },
        printLocations: ["Front Center", "Back Full"],
        colorsPerLocation: 3,
        unitPrice: 14.5,
        lineTotal: 725,
      },
    ],
    setupFees: 150,
    subtotal: 725,
    total: 875,
    status: "draft",
    createdAt: "2026-02-01T10:00:00Z",
  };

  it("accepts a valid quote", () => {
    const result = quoteSchema.parse(validQuote);
    expect(result.quoteNumber).toBe("Q-1024");
  });

  it("accepts optional fields", () => {
    const result = quoteSchema.parse({
      ...validQuote,
      priceOverride: 800,
      internalNotes: "Test note",
      customerNotes: "Customer note",
      updatedAt: "2026-02-03T14:20:00Z",
      sentAt: "2026-02-02T09:00:00Z",
    });
    expect(result.priceOverride).toBe(800);
    expect(result.internalNotes).toBe("Test note");
    expect(result.customerNotes).toBe("Customer note");
    expect(result.updatedAt).toBe("2026-02-03T14:20:00Z");
    expect(result.sentAt).toBe("2026-02-02T09:00:00Z");
  });

  it("rejects negative setup fees", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, setupFees: -50 })
    ).toThrow();
  });

  it("rejects negative subtotal", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, subtotal: -1 })
    ).toThrow();
  });

  it("rejects negative total", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, total: -1 })
    ).toThrow();
  });

  it("rejects negative priceOverride", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, priceOverride: -100 })
    ).toThrow();
  });

  it("rejects invalid datetime", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, createdAt: "not-a-date" })
    ).toThrow();
  });

  it("rejects invalid updatedAt datetime", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, updatedAt: "not-a-date" })
    ).toThrow();
  });

  it("accepts empty line items", () => {
    const result = quoteSchema.parse({ ...validQuote, lineItems: [] });
    expect(result.lineItems).toEqual([]);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["draft", "sent", "accepted", "declined", "revised"]) {
      const result = quoteSchema.parse({ ...validQuote, status });
      expect(result.status).toBe(status);
    }
  });
});
