import { describe, it, expect } from "vitest";
import {
  mockupViewEnum,
  printZoneSchema,
  mockupTemplateSchema,
} from "../mockup-template";

describe("mockupViewEnum", () => {
  it.each(["front", "back", "left-sleeve", "right-sleeve"])(
    "accepts '%s'",
    (view) => {
      expect(mockupViewEnum.parse(view)).toBe(view);
    }
  );

  it("rejects invalid view", () => {
    expect(() => mockupViewEnum.parse("top")).toThrow();
  });
});

describe("printZoneSchema", () => {
  const validZone = {
    position: "front-chest",
    x: 30,
    y: 20,
    width: 40,
    height: 30,
  };

  it("accepts a valid print zone", () => {
    const result = printZoneSchema.parse(validZone);
    expect(result.position).toBe("front-chest");
  });

  it("rejects x > 100", () => {
    expect(() =>
      printZoneSchema.parse({ ...validZone, x: 101 })
    ).toThrow();
  });

  it("rejects negative y", () => {
    expect(() =>
      printZoneSchema.parse({ ...validZone, y: -1 })
    ).toThrow();
  });

  it("rejects width > 100", () => {
    expect(() =>
      printZoneSchema.parse({ ...validZone, width: 101 })
    ).toThrow();
  });

  it("rejects zero width (degenerate zone)", () => {
    expect(() =>
      printZoneSchema.parse({ ...validZone, width: 0 })
    ).toThrow();
  });

  it("rejects zero height (degenerate zone)", () => {
    expect(() =>
      printZoneSchema.parse({ ...validZone, height: 0 })
    ).toThrow();
  });

  it("accepts zone at boundary (x=0, y=0, width=100, height=100)", () => {
    expect(() =>
      printZoneSchema.parse({ position: "full", x: 0, y: 0, width: 100, height: 100 })
    ).not.toThrow();
  });

  it("rejects zone that overflows horizontally (x + width > 100)", () => {
    expect(() =>
      printZoneSchema.parse({ ...validZone, x: 80, width: 30 })
    ).toThrow();
  });

  it("rejects zone that overflows vertically (y + height > 100)", () => {
    expect(() =>
      printZoneSchema.parse({ ...validZone, y: 85, height: 20 })
    ).toThrow();
  });
});

describe("mockupTemplateSchema", () => {
  const validTemplate = {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    garmentCategory: "t-shirts",
    view: "front",
    svgPath: "/mockup-templates/t-shirts-front.svg",
    printZones: [
      { position: "front-chest", x: 30, y: 20, width: 40, height: 30 },
      { position: "left-chest", x: 55, y: 18, width: 15, height: 15 },
    ],
    viewBoxWidth: 1000,
    viewBoxHeight: 1200,
  };

  it("accepts a valid template", () => {
    const result = mockupTemplateSchema.parse(validTemplate);
    expect(result.garmentCategory).toBe("t-shirts");
    expect(result.printZones).toHaveLength(2);
  });

  it("rejects invalid garment category", () => {
    expect(() =>
      mockupTemplateSchema.parse({ ...validTemplate, garmentCategory: "socks" })
    ).toThrow();
  });

  it("rejects invalid view", () => {
    expect(() =>
      mockupTemplateSchema.parse({ ...validTemplate, view: "top" })
    ).toThrow();
  });

  it("rejects zero viewBoxWidth", () => {
    expect(() =>
      mockupTemplateSchema.parse({ ...validTemplate, viewBoxWidth: 0 })
    ).toThrow();
  });

  it("rejects negative viewBoxHeight", () => {
    expect(() =>
      mockupTemplateSchema.parse({ ...validTemplate, viewBoxHeight: -10 })
    ).toThrow();
  });
});
