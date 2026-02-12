import { describe, it, expect } from "vitest";
import {
  invoiceStatusEnum,
  itemizationModeEnum,
  paymentMethodEnum,
  invoiceLineItemTypeEnum,
  auditLogActionEnum,
  paymentSchema,
  reminderSchema,
  auditLogEntrySchema,
  invoiceLineItemSchema,
  pricingSnapshotSchema,
  invoiceSchema,
} from "../invoice";

describe("invoice enums", () => {
  it("invoiceStatusEnum accepts valid values", () => {
    expect(invoiceStatusEnum.parse("draft")).toBe("draft");
    expect(invoiceStatusEnum.parse("sent")).toBe("sent");
    expect(invoiceStatusEnum.parse("partial")).toBe("partial");
    expect(invoiceStatusEnum.parse("paid")).toBe("paid");
    expect(invoiceStatusEnum.parse("void")).toBe("void");
  });

  it("invoiceStatusEnum rejects invalid values", () => {
    expect(() => invoiceStatusEnum.parse("pending")).toThrow();
    expect(() => invoiceStatusEnum.parse("")).toThrow();
  });

  it("itemizationModeEnum accepts valid values", () => {
    expect(itemizationModeEnum.parse("itemized")).toBe("itemized");
    expect(itemizationModeEnum.parse("bundled")).toBe("bundled");
  });

  it("paymentMethodEnum accepts all methods", () => {
    const methods = ["check", "cash", "square", "venmo", "zelle", "credit_card", "ach", "other"];
    for (const method of methods) {
      expect(paymentMethodEnum.parse(method)).toBe(method);
    }
  });

  it("invoiceLineItemTypeEnum accepts all types", () => {
    const types = ["garment", "setup", "artwork", "rush", "other"];
    for (const type of types) {
      expect(invoiceLineItemTypeEnum.parse(type)).toBe(type);
    }
  });

  it("auditLogActionEnum accepts all actions", () => {
    const actions = ["created", "sent", "payment_recorded", "voided", "edited", "credit_memo_issued"];
    for (const action of actions) {
      expect(auditLogActionEnum.parse(action)).toBe(action);
    }
  });
});

describe("invoice sub-schemas", () => {
  it("paymentSchema validates a valid payment", () => {
    const valid = {
      id: "c2b20001-e5f6-4a01-9b01-0d1e2f3a4c01",
      invoiceId: "b1a10001-e5f6-4a01-8b01-0d1e2f3a4b01",
      amount: 400,
      method: "check",
      reference: "Check #1042",
      date: "2026-01-15T10:00:00Z",
      createdAt: "2026-01-15T10:00:00Z",
    };
    expect(() => paymentSchema.parse(valid)).not.toThrow();
  });

  it("paymentSchema rejects zero amount", () => {
    const invalid = {
      id: "c2b20001-e5f6-4a01-9b01-0d1e2f3a4c01",
      invoiceId: "b1a10001-e5f6-4a01-8b01-0d1e2f3a4b01",
      amount: 0,
      method: "cash",
      date: "2026-01-15T10:00:00Z",
      createdAt: "2026-01-15T10:00:00Z",
    };
    expect(() => paymentSchema.parse(invalid)).toThrow();
  });

  it("reminderSchema validates correctly", () => {
    const valid = {
      id: "e4d40001-e5f6-4a01-ab01-0d1e2f3a4e01",
      sentAt: "2026-01-20T09:00:00Z",
      sentTo: "sarah@lonestarlax.org",
    };
    expect(() => reminderSchema.parse(valid)).not.toThrow();
  });

  it("auditLogEntrySchema validates correctly", () => {
    const valid = {
      action: "created",
      performedBy: "Gary",
      timestamp: "2026-01-10T10:00:00Z",
      details: "Invoice created from Q-1024",
    };
    expect(() => auditLogEntrySchema.parse(valid)).not.toThrow();
  });

  it("invoiceLineItemSchema validates correctly", () => {
    const valid = {
      id: "d3c30101-e5f6-4a01-8b01-0d1e2f3a4d01",
      type: "garment",
      description: "Gildan 5000 — Black (50 pcs)",
      quantity: 50,
      unitPrice: 14.50,
      lineTotal: 725,
    };
    expect(() => invoiceLineItemSchema.parse(valid)).not.toThrow();
  });

  it("invoiceLineItemSchema rejects zero quantity", () => {
    const invalid = {
      id: "d3c30101-e5f6-4a01-8b01-0d1e2f3a4d01",
      type: "garment",
      description: "Test",
      quantity: 0,
      unitPrice: 10,
      lineTotal: 0,
    };
    expect(() => invoiceLineItemSchema.parse(invalid)).toThrow();
  });

  it("pricingSnapshotSchema validates correctly", () => {
    const valid = {
      subtotal: 765,
      discountTotal: 0,
      shipping: 0,
      taxRate: 0,
      taxAmount: 0,
      total: 765,
      snapshotDate: "2026-01-10T10:00:00Z",
    };
    expect(() => pricingSnapshotSchema.parse(valid)).not.toThrow();
  });
});

describe("invoiceSchema", () => {
  const validInvoice = {
    id: "b1a10001-e5f6-4a01-8b01-0d1e2f3a4b01",
    invoiceNumber: "INV-0001",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    lineItems: [
      { id: "d3c30101-e5f6-4a01-8b01-0d1e2f3a4d01", type: "garment", description: "Test item", quantity: 10, unitPrice: 10, lineTotal: 100 },
    ],
    subtotal: 100,
    discountTotal: 0,
    shipping: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 100,
    amountPaid: 100,
    balanceDue: 0,
    status: "paid",
    paymentTerms: "upfront",
    dueDate: "2026-01-01",
    createdAt: "2026-01-01T00:00:00Z",
    auditLog: [{ action: "created", performedBy: "Gary", timestamp: "2026-01-01T00:00:00Z" }],
  };

  it("validates a valid invoice", () => {
    expect(() => invoiceSchema.parse(validInvoice)).not.toThrow();
  });

  it("rejects invoice number with wrong format", () => {
    expect(() => invoiceSchema.parse({ ...validInvoice, invoiceNumber: "INV0001" })).toThrow();
    expect(() => invoiceSchema.parse({ ...validInvoice, invoiceNumber: "Q-0001" })).toThrow();
  });

  it("rejects empty line items", () => {
    expect(() => invoiceSchema.parse({ ...validInvoice, lineItems: [] })).toThrow();
  });

  it("rejects negative total", () => {
    expect(() =>
      invoiceSchema.parse({ ...validInvoice, total: -100, amountPaid: 0, balanceDue: -100 }),
    ).toThrow();
  });

  it("rejects tax rate over 100", () => {
    expect(() => invoiceSchema.parse({ ...validInvoice, taxRate: 150 })).toThrow();
  });

  it("enforces amountPaid + balanceDue === total invariant", () => {
    // amountPaid(50) + balanceDue(0) !== total(100) → should fail
    expect(() =>
      invoiceSchema.parse({ ...validInvoice, amountPaid: 50, balanceDue: 0 }),
    ).toThrow();
  });

  it("validates amountPaid + balanceDue === total via big.js precision", () => {
    // 33.33 + 66.67 = 100.00 — exact with arbitrary-precision arithmetic
    expect(() =>
      invoiceSchema.parse({ ...validInvoice, total: 100, amountPaid: 33.33, balanceDue: 66.67 }),
    ).not.toThrow();
  });

  it("rejects when amounts do not sum to total (off by 1 cent)", () => {
    // 33.33 + 66.66 = 99.99, total = 100 — off by $0.01
    expect(() =>
      invoiceSchema.parse({ ...validInvoice, total: 100, amountPaid: 33.33, balanceDue: 66.66 }),
    ).toThrow();
  });

  it("handles values that would fail with floating-point arithmetic", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754, but big.js handles it correctly
    expect(() =>
      invoiceSchema.parse({ ...validInvoice, total: 0.3, amountPaid: 0.1, balanceDue: 0.2 }),
    ).not.toThrow();
  });
});
