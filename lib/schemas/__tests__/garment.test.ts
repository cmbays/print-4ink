import { describe, it, expect } from "vitest";
import { garmentSchema } from "../garment";

describe("garmentSchema", () => {
  const validGarment = {
    sku: "G500-BLK",
    style: "Gildan 5000",
    brand: "Gildan",
    color: "Black",
    sizes: { S: 5, M: 15, L: 20, XL: 10 },
  };

  it("accepts a valid garment", () => {
    expect(garmentSchema.parse(validGarment)).toEqual(validGarment);
  });

  it("accepts empty sizes record", () => {
    const result = garmentSchema.parse({ ...validGarment, sizes: {} });
    expect(result.sizes).toEqual({});
  });

  it("rejects empty sku", () => {
    expect(() =>
      garmentSchema.parse({ ...validGarment, sku: "" })
    ).toThrow();
  });

  it("rejects empty style", () => {
    expect(() =>
      garmentSchema.parse({ ...validGarment, style: "" })
    ).toThrow();
  });

  it("rejects empty brand", () => {
    expect(() =>
      garmentSchema.parse({ ...validGarment, brand: "" })
    ).toThrow();
  });

  it("rejects empty color", () => {
    expect(() =>
      garmentSchema.parse({ ...validGarment, color: "" })
    ).toThrow();
  });

  it("rejects negative size quantities", () => {
    expect(() =>
      garmentSchema.parse({ ...validGarment, sizes: { M: -1 } })
    ).toThrow();
  });

  it("rejects fractional size quantities", () => {
    expect(() =>
      garmentSchema.parse({ ...validGarment, sizes: { M: 2.5 } })
    ).toThrow();
  });
});
