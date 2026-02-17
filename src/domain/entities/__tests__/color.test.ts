import { describe, it, expect } from "vitest";
import { colorSchema } from "../color";

describe("colorSchema", () => {
  const validColor = {
    id: "clr-black",
    name: "Black",
    hex: "#000000",
    swatchTextColor: "#FFFFFF",
    family: "Black",
  };

  it("accepts a valid color", () => {
    expect(colorSchema.parse(validColor)).toEqual(validColor);
  });

  it("accepts optional hex2", () => {
    const result = colorSchema.parse({ ...validColor, hex2: "#333333" });
    expect(result.hex2).toBe("#333333");
  });

  it("accepts optional isFavorite", () => {
    const result = colorSchema.parse({ ...validColor, isFavorite: true });
    expect(result.isFavorite).toBe(true);
  });

  it("rejects invalid hex format — missing hash", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, hex: "000000" })
    ).toThrow();
  });

  it("rejects invalid hex format — too short", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, hex: "#000" })
    ).toThrow();
  });

  it("rejects invalid hex format — too long", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, hex: "#0000000" })
    ).toThrow();
  });

  it("rejects invalid hex format — non-hex chars", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, hex: "#ZZZZZZ" })
    ).toThrow();
  });

  it("rejects invalid swatchTextColor format", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, swatchTextColor: "white" })
    ).toThrow();
  });

  it("rejects invalid hex2 format", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, hex2: "not-a-hex" })
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, name: "" })
    ).toThrow();
  });

  it("rejects empty family", () => {
    expect(() =>
      colorSchema.parse({ ...validColor, family: "" })
    ).toThrow();
  });

  it("accepts lowercase hex values", () => {
    const result = colorSchema.parse({ ...validColor, hex: "#abcdef" });
    expect(result.hex).toBe("#abcdef");
  });

  it("accepts mixed case hex values", () => {
    const result = colorSchema.parse({ ...validColor, hex: "#AbCdEf" });
    expect(result.hex).toBe("#AbCdEf");
  });
});
