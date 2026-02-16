import { describe, it, expect } from "vitest";
import {
  dtfLineItemSchema,
  dtfSizePresetEnum,
} from "../dtf-line-item";
import {
  sheetCalculationSchema,
  canvasLayoutSchema,
} from "../dtf-sheet-calculation";

describe("dtfLineItemSchema", () => {
  const validItem = {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    artworkName: "Tiger Logo",
    sizePreset: "large" as const,
    width: 10,
    height: 12,
    quantity: 50,
  };

  it("parses a valid DTF line item", () => {
    const result = dtfLineItemSchema.parse(validItem);
    expect(result).toEqual(validItem);
  });

  it("rejects zero width", () => {
    expect(() =>
      dtfLineItemSchema.parse({ ...validItem, width: 0 })
    ).toThrow();
  });

  it("rejects negative height", () => {
    expect(() =>
      dtfLineItemSchema.parse({ ...validItem, height: -1 })
    ).toThrow();
  });

  it("rejects zero quantity", () => {
    expect(() =>
      dtfLineItemSchema.parse({ ...validItem, quantity: 0 })
    ).toThrow();
  });

  it("rejects non-integer quantity", () => {
    expect(() =>
      dtfLineItemSchema.parse({ ...validItem, quantity: 1.5 })
    ).toThrow();
  });

  it("rejects empty artworkName", () => {
    expect(() =>
      dtfLineItemSchema.parse({ ...validItem, artworkName: "" })
    ).toThrow();
  });
});

describe("dtfSizePresetEnum", () => {
  it("accepts valid presets", () => {
    expect(dtfSizePresetEnum.parse("small")).toBe("small");
    expect(dtfSizePresetEnum.parse("medium")).toBe("medium");
    expect(dtfSizePresetEnum.parse("large")).toBe("large");
    expect(dtfSizePresetEnum.parse("custom")).toBe("custom");
  });

  it("rejects invalid preset", () => {
    expect(() => dtfSizePresetEnum.parse("xl")).toThrow();
  });
});

describe("sheetCalculationSchema", () => {
  it("parses a valid sheet calculation", () => {
    const result = sheetCalculationSchema.parse({
      sheets: [
        {
          tier: { width: 22, length: 48, retailPrice: 24.99 },
          designs: [
            { id: "d1", x: 1, y: 1, width: 10, height: 12, label: "Tiger" },
          ],
          utilization: 78,
          cost: 24.99,
        },
      ],
      totalCost: 24.99,
      totalSheets: 1,
    });
    expect(result.sheets).toHaveLength(1);
    expect(result.totalSheets).toBe(1);
  });
});

describe("canvasLayoutSchema", () => {
  it("parses a valid canvas layout", () => {
    const result = canvasLayoutSchema.parse({
      sheetWidth: 22,
      sheetHeight: 48,
      designs: [
        { id: "d1", x: 1, y: 1, width: 10, height: 12, label: "Tiger" },
      ],
      margins: 1,
    });
    expect(result.sheetWidth).toBe(22);
    expect(result.designs).toHaveLength(1);
  });
});
