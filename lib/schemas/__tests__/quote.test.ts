import { describe, it, expect } from "vitest";
import { quoteSchema, quoteStatusEnum, quoteLineItemSchema } from "../quote";

describe("quoteStatusEnum", () => {
  it.each(["draft", "sent", "approved", "rejected"])(
    "accepts '%s'",
    (status) => {
      expect(quoteStatusEnum.parse(status)).toBe(status);
    }
  );

  it("rejects invalid status", () => {
    expect(() => quoteStatusEnum.parse("pending")).toThrow();
  });
});

describe("quoteLineItemSchema", () => {
  const validItem = {
    description: "Gildan 5000 Black",
    quantity: 50,
    colorCount: 3,
    locations: 2,
    unitPrice: 14.5,
    total: 725,
  };

  it("accepts a valid line item", () => {
    expect(quoteLineItemSchema.parse(validItem)).toEqual(validItem);
  });

  it("rejects zero quantity", () => {
    expect(() =>
      quoteLineItemSchema.parse({ ...validItem, quantity: 0 })
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
});

describe("quoteSchema", () => {
  const validQuote = {
    id: "01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    quoteNumber: "Q-2048",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    lineItems: [
      {
        description: "Gildan 5000 Black",
        quantity: 50,
        colorCount: 3,
        locations: 2,
        unitPrice: 14.5,
        total: 725,
      },
    ],
    setupFees: 150,
    total: 875,
    status: "approved",
    createdAt: "2026-01-28T10:00:00Z",
  };

  it("accepts a valid quote", () => {
    const result = quoteSchema.parse(validQuote);
    expect(result.quoteNumber).toBe("Q-2048");
  });

  it("rejects negative setup fees", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, setupFees: -50 })
    ).toThrow();
  });

  it("rejects negative total", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, total: -1 })
    ).toThrow();
  });

  it("rejects invalid datetime", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, createdAt: "not-a-date" })
    ).toThrow();
  });

  it("accepts empty line items", () => {
    const result = quoteSchema.parse({ ...validQuote, lineItems: [] });
    expect(result.lineItems).toEqual([]);
  });
});
