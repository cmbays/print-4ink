import { describe, it, expect } from "vitest";
import { getGarmentById, getColorById } from "../garment-helpers";

describe("getGarmentById", () => {
  it("finds garment by ID", () => {
    const result = getGarmentById("gc-001");
    expect(result).not.toBeNull();
    expect(result?.brand).toBe("Bella+Canvas");
  });

  it("returns null for unknown ID", () => {
    expect(getGarmentById("gc-999")).toBeNull();
  });
});

describe("getColorById", () => {
  it("finds color by ID", () => {
    const result = getColorById("clr-black");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Black");
  });

  it("returns null for unknown ID", () => {
    expect(getColorById("clr-999")).toBeNull();
  });
});
