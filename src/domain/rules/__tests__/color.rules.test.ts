import { describe, it, expect } from "vitest";
import { hexToColorMatrix, hexToRgb } from "../color.rules";

describe("hexToRgb", () => {
  it("converts black", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("converts white", () => {
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("converts Niji blue (#2ab9ff)", () => {
    expect(hexToRgb("#2ab9ff")).toEqual({ r: 42, g: 185, b: 255 });
  });

  it("handles lowercase hex", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  // Review fix #1: malformed hex input
  it("returns {0,0,0} for empty string", () => {
    expect(hexToRgb("")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("returns {0,0,0} for malformed hex (too short)", () => {
    expect(hexToRgb("#FFF")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("returns {0,0,0} for non-hex characters", () => {
    expect(hexToRgb("#GGGGGG")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("returns {0,0,0} for missing hash", () => {
    expect(hexToRgb("FF0000")).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("hexToColorMatrix", () => {
  it("returns a string with 20 space-separated numbers", () => {
    const matrix = hexToColorMatrix("#1a1a1a");
    const values = matrix.trim().split(/\s+/);
    expect(values).toHaveLength(20);
    values.forEach((v) => expect(Number.isFinite(Number(v))).toBe(true));
  });

  it("produces identity-like matrix for white", () => {
    const matrix = hexToColorMatrix("#FFFFFF");
    const values = matrix.trim().split(/\s+/).map(Number);
    // Each color row should sum to exactly 1.0 (luminance weights sum to 1)
    expect(values[0] + values[1] + values[2]).toBeCloseTo(1, 4);
    expect(values[5] + values[6] + values[7]).toBeCloseTo(1, 4);
    expect(values[10] + values[11] + values[12]).toBeCloseTo(1, 4);
  });

  it("produces a dark matrix for black", () => {
    const matrix = hexToColorMatrix("#000000");
    const values = matrix.trim().split(/\s+/).map(Number);
    // All color channel multipliers should be 0 for pure black
    expect(values[0]).toBeCloseTo(0, 1);
    expect(values[6]).toBeCloseTo(0, 1);
    expect(values[12]).toBeCloseTo(0, 1);
  });

  it("different colors produce different matrices", () => {
    const red = hexToColorMatrix("#FF0000");
    const blue = hexToColorMatrix("#0000FF");
    expect(red).not.toBe(blue);
  });

  // Review fix #3: known-value verification for pure red
  it("produces correct known values for pure red (#FF0000)", () => {
    const matrix = hexToColorMatrix("#FF0000");
    const values = matrix.trim().split(/\s+/).map(Number);
    // R row: rn=1.0, so coefficients are lr, lg, lb = 0.2126, 0.7152, 0.0722
    expect(values[0]).toBeCloseTo(0.2126, 3);
    expect(values[1]).toBeCloseTo(0.7152, 3);
    expect(values[2]).toBeCloseTo(0.0722, 3);
    // G row: gn=0.0, so all zeros
    expect(values[5]).toBeCloseTo(0, 3);
    expect(values[6]).toBeCloseTo(0, 3);
    expect(values[7]).toBeCloseTo(0, 3);
    // B row: bn=0.0, so all zeros
    expect(values[10]).toBeCloseTo(0, 3);
    expect(values[11]).toBeCloseTo(0, 3);
    expect(values[12]).toBeCloseTo(0, 3);
    // Alpha row: pass-through
    expect(values[15]).toBeCloseTo(0, 3);
    expect(values[16]).toBeCloseTo(0, 3);
    expect(values[17]).toBeCloseTo(0, 3);
    expect(values[18]).toBeCloseTo(1, 3);
    expect(values[19]).toBeCloseTo(0, 3);
  });

  // Review fix #1: malformed hex produces black matrix (safe fallback)
  it("produces black matrix for malformed hex input", () => {
    const matrix = hexToColorMatrix("invalid");
    const values = matrix.trim().split(/\s+/).map(Number);
    expect(values).toHaveLength(20);
    // All color multipliers should be 0 (black)
    expect(values[0]).toBeCloseTo(0, 1);
    expect(values[6]).toBeCloseTo(0, 1);
    expect(values[12]).toBeCloseTo(0, 1);
    // Alpha still passes through
    expect(values[18]).toBeCloseTo(1, 1);
  });
});
