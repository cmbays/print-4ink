import { describe, it, expect, vi } from "vitest";
import {
  PRINT_ZONES,
  PRINT_POSITION_LABELS,
  PRINT_POSITION_ALIASES,
  getZonesForCategory,
  getZoneForPosition,
  normalizePosition,
} from "@/lib/constants/print-zones";
import { printZoneSchema } from "@domain/entities/mockup-template";

describe("PRINT_ZONES", () => {
  it("has entries for all 5 garment categories", () => {
    expect(Object.keys(PRINT_ZONES)).toEqual(
      expect.arrayContaining(["t-shirts", "fleece", "outerwear", "pants", "headwear"])
    );
  });

  it("every zone validates against printZoneSchema", () => {
    for (const [, views] of Object.entries(PRINT_ZONES)) {
      for (const [, zones] of Object.entries(views)) {
        for (const zone of zones ?? []) {
          expect(() => printZoneSchema.parse(zone)).not.toThrow();
        }
      }
    }
  });

  it("every position in PRINT_ZONES has a label in PRINT_POSITION_LABELS", () => {
    for (const [category, views] of Object.entries(PRINT_ZONES)) {
      for (const [view, zones] of Object.entries(views)) {
        for (const zone of zones ?? []) {
          expect(
            PRINT_POSITION_LABELS,
            `Missing label for position "${zone.position}" in ${category}/${view}`
          ).toHaveProperty(zone.position);
        }
      }
    }
  });
});

describe("PRINT_POSITION_LABELS", () => {
  it("has a label for front-chest", () => {
    expect(PRINT_POSITION_LABELS["front-chest"]).toBe("Front Chest");
  });

  it("has a label for full-back", () => {
    expect(PRINT_POSITION_LABELS["full-back"]).toBe("Full Back");
  });
});

describe("getZonesForCategory", () => {
  it("returns front zones for t-shirts", () => {
    const zones = getZonesForCategory("t-shirts", "front");
    expect(zones.length).toBeGreaterThan(0);
    expect(zones.every((z) => z.x >= 0 && z.x <= 100)).toBe(true);
  });

  it("returns empty array for invalid category", () => {
    const zones = getZonesForCategory("socks" as never, "front");
    expect(zones).toEqual([]);
  });

  it("returns empty array for valid category with invalid view", () => {
    const zones = getZonesForCategory("t-shirts", "bottom" as never);
    expect(zones).toEqual([]);
  });

  it("returns empty array for category with empty view (pants/back)", () => {
    const zones = getZonesForCategory("pants", "back");
    expect(zones).toEqual([]);
  });
});

describe("getZoneForPosition", () => {
  it("returns zone geometry for front-chest on t-shirts", () => {
    const zone = getZoneForPosition("t-shirts", "front", "front-chest");
    expect(zone).toBeDefined();
    expect(zone?.position).toBe("front-chest");
  });

  it("returns undefined for non-existent position", () => {
    const zone = getZoneForPosition("t-shirts", "front", "back-pocket");
    expect(zone).toBeUndefined();
  });
});

describe("PRINT_POSITION_ALIASES", () => {
  it("maps quote-style 'Front' to 'front-chest'", () => {
    expect(PRINT_POSITION_ALIASES["Front"]).toBe("front-chest");
  });

  it("maps job-style 'Back Full' to 'full-back'", () => {
    expect(PRINT_POSITION_ALIASES["Back Full"]).toBe("full-back");
  });

  it("maps 'Left Chest' to 'left-chest'", () => {
    expect(PRINT_POSITION_ALIASES["Left Chest"]).toBe("left-chest");
  });
});

describe("normalizePosition", () => {
  it("normalizes known alias", () => {
    expect(normalizePosition("Front Center")).toBe("front-chest");
  });

  it("handles already-canonical input", () => {
    expect(normalizePosition("front-chest")).toBe("front-chest");
  });

  it("handles case-insensitive alias match", () => {
    expect(normalizePosition("front center")).toBe("front-chest");
    expect(normalizePosition("FRONT CENTER")).toBe("front-chest");
    expect(normalizePosition("left chest")).toBe("left-chest");
  });

  it("returns 'unknown' for empty input with warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizePosition("")).toBe("unknown");
    expect(normalizePosition("  ")).toBe("unknown");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("empty input")
    );
    warnSpy.mockRestore();
  });

  it("logs a warning for unknown input and returns kebab-case", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = normalizePosition("Hip Pocket");
    expect(result).toBe("hip-pocket");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Hip Pocket")
    );
    warnSpy.mockRestore();
  });

  // Round-trip test — all aliases resolve to known positions
  it("every alias resolves to a position that exists in PRINT_POSITION_LABELS", () => {
    for (const [alias, canonical] of Object.entries(PRINT_POSITION_ALIASES)) {
      expect(PRINT_POSITION_LABELS).toHaveProperty(
        canonical,
        expect.any(String)
      );
      expect(normalizePosition(alias)).toBe(canonical);
    }
  });
});
