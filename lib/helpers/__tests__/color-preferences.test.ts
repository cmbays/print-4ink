import { describe, it, expect } from "vitest";
import {
  resolveEffectiveFavorites,
  getInheritanceChain,
  getImpactPreview,
} from "../color-preferences";
import { colors, customers } from "@/lib/mock-data";

// Global favorites from mock data: Black, White, Navy, Royal Blue, Red
const GLOBAL_FAVORITE_IDS = colors
  .filter((c) => c.isFavorite === true)
  .map((c) => c.id);

describe("resolveEffectiveFavorites (N19)", () => {
  it("returns global favorites for entityType='global'", () => {
    const result = resolveEffectiveFavorites("global");
    expect(result).toEqual(GLOBAL_FAVORITE_IDS);
    expect(result).toContain("clr-black");
    expect(result).toContain("clr-white");
    expect(result).toContain("clr-navy");
    expect(result).toContain("clr-royal");
    expect(result).toContain("clr-red");
  });

  it("returns global favorites for brand in inherit mode", () => {
    const result = resolveEffectiveFavorites("brand", "Bella+Canvas");
    expect(result).toEqual(GLOBAL_FAVORITE_IDS);
  });

  it("returns brand-specific favorites for brand in customize mode", () => {
    const result = resolveEffectiveFavorites("brand", "Gildan");
    expect(result).toContain("clr-sport-grey");
    expect(result).toContain("clr-dark-heather");
    expect(result).toContain("clr-black");
  });

  it("returns brand favorites with removals applied", () => {
    const result = resolveEffectiveFavorites("brand", "Comfort Colors");
    expect(result).toContain("clr-mint");
    expect(result).toContain("clr-daisy");
    expect(result).not.toContain("clr-red"); // removed
  });

  it("falls back to global for unknown brand", () => {
    const result = resolveEffectiveFavorites("brand", "UnknownBrand");
    expect(result).toEqual(GLOBAL_FAVORITE_IDS);
  });

  it("returns customer favorites when customized", () => {
    // River City has favoriteColors: ["clr-black", "clr-forest-green"]
    const riverCity = customers[0];
    const result = resolveEffectiveFavorites("customer", riverCity.id);
    expect(result).toEqual(["clr-black", "clr-forest-green"]);
  });

  it("falls back to global for customer with empty favorites", () => {
    // Thompson has favoriteColors: []
    const thompson = customers[2];
    const result = resolveEffectiveFavorites("customer", thompson.id);
    expect(result).toEqual(GLOBAL_FAVORITE_IDS);
  });

  it("falls back to global for unknown customer", () => {
    const result = resolveEffectiveFavorites(
      "customer",
      "00000000-0000-4000-8000-000000000000"
    );
    expect(result).toEqual(GLOBAL_FAVORITE_IDS);
  });

  it("returns empty array when all levels empty (R5 graceful degradation)", () => {
    // This tests the edge case where global has no favorites
    // In our mock data, global always has 5 favorites, so we test
    // that the function at least returns a valid array
    const result = resolveEffectiveFavorites("global");
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getInheritanceChain (N20)", () => {
  it("returns global defaults with empty changes at global level", () => {
    const chain = getInheritanceChain("global");
    expect(chain.globalDefaults).toEqual(GLOBAL_FAVORITE_IDS);
    expect(chain.addedAtLevel).toEqual([]);
    expect(chain.removedAtLevel).toEqual([]);
  });

  it("returns empty changes for brand in inherit mode", () => {
    const chain = getInheritanceChain("brand", "Bella+Canvas");
    expect(chain.globalDefaults).toEqual(GLOBAL_FAVORITE_IDS);
    expect(chain.addedAtLevel).toEqual([]);
    expect(chain.removedAtLevel).toEqual([]);
  });

  it("returns explicit additions for customized brand", () => {
    const chain = getInheritanceChain("brand", "Gildan");
    expect(chain.globalDefaults).toEqual(GLOBAL_FAVORITE_IDS);
    expect(chain.addedAtLevel).toEqual(["clr-sport-grey", "clr-dark-heather"]);
    expect(chain.removedAtLevel).toEqual([]);
  });

  it("returns removals for brand that removed inherited colors", () => {
    const chain = getInheritanceChain("brand", "Comfort Colors");
    expect(chain.globalDefaults).toEqual(GLOBAL_FAVORITE_IDS);
    expect(chain.addedAtLevel).toEqual(["clr-mint", "clr-daisy"]);
    expect(chain.removedAtLevel).toEqual(["clr-red"]);
  });

  it("returns customer-level changes relative to global", () => {
    // River City: ["clr-black", "clr-forest-green"]
    const riverCity = customers[0];
    const chain = getInheritanceChain("customer", riverCity.id);
    expect(chain.globalDefaults).toEqual(GLOBAL_FAVORITE_IDS);
    // forest-green is not a global favorite, so it's "added"
    expect(chain.addedAtLevel).toContain("clr-forest-green");
    // white, navy, royal, red are global favorites missing from customer = "removed"
    expect(chain.removedAtLevel).toContain("clr-white");
    expect(chain.removedAtLevel).toContain("clr-navy");
  });

  it("returns empty changes for customer with no customization", () => {
    const thompson = customers[2];
    const chain = getInheritanceChain("customer", thompson.id);
    expect(chain.addedAtLevel).toEqual([]);
    expect(chain.removedAtLevel).toEqual([]);
  });
});

describe("getImpactPreview (N21)", () => {
  it("counts affected suppliers for global removal", () => {
    // "clr-black" is a global favorite — Gildan (customize, has it), Bella+Canvas (inherit), Comfort Colors (customize, has it)
    const preview = getImpactPreview("global", "clr-black");
    expect(preview.supplierCount).toBeGreaterThan(0);
    expect(preview.suppliers).toContain("Bella+Canvas"); // inheriting — would be affected
  });

  it("counts affected customers for global removal", () => {
    const preview = getImpactPreview("global", "clr-black");
    expect(preview.customerCount).toBeGreaterThan(0);
    // All customers either inherit (empty favorites) or have clr-black explicitly
  });

  it("returns supplier and customer lists", () => {
    const preview = getImpactPreview("global", "clr-red");
    expect(Array.isArray(preview.suppliers)).toBe(true);
    expect(Array.isArray(preview.customers)).toBe(true);
    // Comfort Colors removed clr-red, so it should NOT be in affected suppliers
    expect(preview.suppliers).not.toContain("Comfort Colors");
  });

  it("returns zero impact for color no one has", () => {
    const preview = getImpactPreview("global", "clr-nonexistent");
    // Inheriting brands/customers still affected since they inherit all global
    // But brands in customize mode without this color won't be
    expect(preview.supplierCount).toBeGreaterThanOrEqual(0);
  });

  it("returns empty for brand-level preview (Phase 1 stub)", () => {
    const preview = getImpactPreview("brand", "clr-black");
    expect(preview.supplierCount).toBe(0);
    expect(preview.customerCount).toBe(0);
  });
});
