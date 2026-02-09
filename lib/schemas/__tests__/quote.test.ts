import { describe, it, expect } from "vitest";
import {
  quoteSchema,
  quoteStatusEnum,
  quoteLineItemSchema,
  serviceTypeEnum,
  printLocationDetailSchema,
  discountSchema,
} from "../quote";

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

describe("serviceTypeEnum", () => {
  it.each(["screen-print", "dtf", "embroidery"])(
    "accepts '%s'",
    (type) => {
      expect(serviceTypeEnum.parse(type)).toBe(type);
    }
  );

  it("rejects invalid service type", () => {
    expect(() => serviceTypeEnum.parse("sublimation")).toThrow();
  });
});

describe("printLocationDetailSchema", () => {
  const validDetail = {
    location: "Front",
    colorCount: 3,
    setupFee: 75,
  };

  it("accepts a valid print location detail", () => {
    const result = printLocationDetailSchema.parse(validDetail);
    expect(result.location).toBe("Front");
    expect(result.colorCount).toBe(3);
  });

  it("accepts optional artworkId", () => {
    const result = printLocationDetailSchema.parse({
      ...validDetail,
      artworkId: "art-001",
    });
    expect(result.artworkId).toBe("art-001");
  });

  it("rejects empty location", () => {
    expect(() =>
      printLocationDetailSchema.parse({ ...validDetail, location: "" })
    ).toThrow();
  });

  it("rejects zero colorCount", () => {
    expect(() =>
      printLocationDetailSchema.parse({ ...validDetail, colorCount: 0 })
    ).toThrow();
  });

  it("rejects negative setupFee", () => {
    expect(() =>
      printLocationDetailSchema.parse({ ...validDetail, setupFee: -1 })
    ).toThrow();
  });

  it("accepts zero setupFee", () => {
    const result = printLocationDetailSchema.parse({ ...validDetail, setupFee: 0 });
    expect(result.setupFee).toBe(0);
  });
});

describe("discountSchema", () => {
  const validDiscount = {
    label: "Contract Pricing",
    amount: 100,
    type: "contract" as const,
  };

  it("accepts a valid discount", () => {
    const result = discountSchema.parse(validDiscount);
    expect(result.label).toBe("Contract Pricing");
    expect(result.type).toBe("contract");
  });

  it.each(["manual", "contract", "volume"] as const)(
    "accepts type '%s'",
    (type) => {
      expect(discountSchema.parse({ ...validDiscount, type }).type).toBe(type);
    }
  );

  it("rejects empty label", () => {
    expect(() =>
      discountSchema.parse({ ...validDiscount, label: "" })
    ).toThrow();
  });

  it("rejects zero amount", () => {
    expect(() =>
      discountSchema.parse({ ...validDiscount, amount: 0 })
    ).toThrow();
  });

  it("rejects negative amount", () => {
    expect(() =>
      discountSchema.parse({ ...validDiscount, amount: -50 })
    ).toThrow();
  });

  it("rejects invalid type", () => {
    expect(() =>
      discountSchema.parse({ ...validDiscount, type: "loyalty" })
    ).toThrow();
  });
});

describe("quoteLineItemSchema", () => {
  const validItem = {
    garmentId: "gc-001",
    colorId: "clr-black",
    sizes: { S: 5, M: 15, L: 20, XL: 10 },
    serviceType: "screen-print",
    printLocationDetails: [
      { location: "Front", colorCount: 3, setupFee: 75 },
      { location: "Back", colorCount: 2, setupFee: 50 },
    ],
    unitPrice: 14.5,
    lineTotal: 725,
  };

  it("accepts a valid line item", () => {
    const result = quoteLineItemSchema.parse(validItem);
    expect(result.garmentId).toBe("gc-001");
    expect(result.colorId).toBe("clr-black");
    expect(result.printLocationDetails).toHaveLength(2);
  });

  it("defaults serviceType to screen-print when omitted", () => {
    const { serviceType: _serviceType, ...withoutType } = validItem;
    const result = quoteLineItemSchema.parse(withoutType);
    expect(result.serviceType).toBe("screen-print");
  });

  it("accepts artworkId in printLocationDetails", () => {
    const result = quoteLineItemSchema.parse({
      ...validItem,
      printLocationDetails: [
        { location: "Front", colorCount: 3, artworkId: "art-001", setupFee: 75 },
      ],
    });
    expect(result.printLocationDetails[0].artworkId).toBe("art-001");
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

  it("accepts empty printLocationDetails array", () => {
    const result = quoteLineItemSchema.parse({
      ...validItem,
      printLocationDetails: [],
    });
    expect(result.printLocationDetails).toEqual([]);
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
        serviceType: "screen-print",
        printLocationDetails: [
          { location: "Front", colorCount: 3, setupFee: 75 },
        ],
        unitPrice: 14.5,
        lineTotal: 725,
      },
    ],
    setupFees: 75,
    subtotal: 725,
    total: 800,
    status: "draft",
    createdAt: "2026-02-01T10:00:00Z",
  };

  it("accepts a valid quote", () => {
    const result = quoteSchema.parse(validQuote);
    expect(result.quoteNumber).toBe("Q-1024");
  });

  it("defaults discounts to empty array", () => {
    const result = quoteSchema.parse(validQuote);
    expect(result.discounts).toEqual([]);
  });

  it("defaults shipping to 0", () => {
    const result = quoteSchema.parse(validQuote);
    expect(result.shipping).toBe(0);
  });

  it("defaults tax to 0", () => {
    const result = quoteSchema.parse(validQuote);
    expect(result.tax).toBe(0);
  });

  it("defaults artworkIds to empty array", () => {
    const result = quoteSchema.parse(validQuote);
    expect(result.artworkIds).toEqual([]);
  });

  it("accepts discounts, shipping, tax, artworkIds", () => {
    const result = quoteSchema.parse({
      ...validQuote,
      discounts: [{ label: "Volume", amount: 50, type: "volume" }],
      shipping: 25,
      tax: 10,
      artworkIds: ["art-001"],
    });
    expect(result.discounts).toHaveLength(1);
    expect(result.shipping).toBe(25);
    expect(result.tax).toBe(10);
    expect(result.artworkIds).toEqual(["art-001"]);
  });

  it("accepts optional fields", () => {
    const result = quoteSchema.parse({
      ...validQuote,
      internalNotes: "Test note",
      customerNotes: "Customer note",
      updatedAt: "2026-02-03T14:20:00Z",
      sentAt: "2026-02-02T09:00:00Z",
    });
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

  it("rejects negative shipping", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, shipping: -10 })
    ).toThrow();
  });

  it("rejects negative tax", () => {
    expect(() =>
      quoteSchema.parse({ ...validQuote, tax: -5 })
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
