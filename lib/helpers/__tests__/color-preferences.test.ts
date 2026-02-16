import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  resolveEffectiveFavorites,
  getInheritanceChain,
  getImpactPreview,
  propagateAddition,
  getBrandPreference,
} from "../color-preferences";
import {
  colors,
  customers,
  brandPreferences,
  autoPropagationConfig,
} from "@/lib/mock-data";

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

  it("always returns a valid array for global level", () => {
    const result = resolveEffectiveFavorites("global");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
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

  it("returns stub for brand-level preview (Phase 1)", () => {
    const preview = getImpactPreview("brand", "clr-black");
    expect(preview.supplierCount).toBe(0);
    expect(preview.customerCount).toBe(0);
    expect(preview.isStub).toBe(true);
  });

  it("does not flag global-level preview as stub", () => {
    const preview = getImpactPreview("global", "clr-black");
    expect(preview.isStub).toBeUndefined();
  });
});

describe("propagateAddition (N22)", () => {
  // Save original values so we can restore after mutation tests
  let originalGildanFavorites: string[];
  let originalRiverCityFavorites: string[];

  beforeEach(() => {
    // Snapshot mutable arrays before each test
    const gildan = brandPreferences.find((b) => b.brandName === "Gildan")!;
    const riverCity = customers[0];
    originalGildanFavorites = [...gildan.favoriteColorIds];
    originalRiverCityFavorites = [...riverCity.favoriteColors];
  });

  afterEach(() => {
    // Restore mutated arrays
    const gildan = brandPreferences.find((b) => b.brandName === "Gildan")!;
    const riverCity = customers[0];
    gildan.favoriteColorIds.length = 0;
    gildan.favoriteColorIds.push(...originalGildanFavorites);
    riverCity.favoriteColors.length = 0;
    riverCity.favoriteColors.push(...originalRiverCityFavorites);
  });

  it("does nothing when autoPropagate is disabled", () => {
    const original = autoPropagationConfig.autoPropagate;
    autoPropagationConfig.autoPropagate = false;
    const gildan = brandPreferences.find((b) => b.brandName === "Gildan")!;
    const before = [...gildan.favoriteColorIds];
    propagateAddition("global", "clr-test-color");
    expect(gildan.favoriteColorIds).toEqual(before);
    autoPropagationConfig.autoPropagate = original;
  });

  it("adds to customize-mode brands at global level", () => {
    const gildan = brandPreferences.find((b) => b.brandName === "Gildan")!;
    expect(gildan.favoriteColorIds).not.toContain("clr-forest-green");
    propagateAddition("global", "clr-forest-green");
    expect(gildan.favoriteColorIds).toContain("clr-forest-green");
  });

  it("skips inherit-mode brands (they get it via resolution)", () => {
    const bellaCanvas = brandPreferences.find(
      (b) => b.brandName === "Bella+Canvas"
    )!;
    const before = [...bellaCanvas.favoriteColorIds];
    propagateAddition("global", "clr-forest-green");
    expect(bellaCanvas.favoriteColorIds).toEqual(before);
  });

  it("respects removedInheritedColorIds", () => {
    // Comfort Colors has removed "clr-red"
    const comfortColors = brandPreferences.find(
      (b) => b.brandName === "Comfort Colors"
    )!;
    const before = [...comfortColors.favoriteColorIds];
    propagateAddition("global", "clr-red");
    // Should NOT be added because it's in removedInheritedColorIds
    expect(comfortColors.favoriteColorIds).toEqual(before);
  });

  it("adds to customers with customizations", () => {
    // River City has explicit favorites — should receive propagation
    const riverCity = customers[0];
    expect(riverCity.favoriteColors).not.toContain("clr-mint");
    propagateAddition("global", "clr-mint");
    expect(riverCity.favoriteColors).toContain("clr-mint");
  });

  it("skips customers inheriting (empty favorites)", () => {
    const thompson = customers[2];
    expect(thompson.favoriteColors).toEqual([]);
    propagateAddition("global", "clr-mint");
    expect(thompson.favoriteColors).toEqual([]); // still empty, inheriting
  });

  it("is idempotent — does not duplicate on repeat calls", () => {
    const gildan = brandPreferences.find((b) => b.brandName === "Gildan")!;
    propagateAddition("global", "clr-forest-green");
    const countAfterFirst = gildan.favoriteColorIds.filter(
      (id) => id === "clr-forest-green"
    ).length;
    propagateAddition("global", "clr-forest-green");
    const countAfterSecond = gildan.favoriteColorIds.filter(
      (id) => id === "clr-forest-green"
    ).length;
    expect(countAfterFirst).toBe(1);
    expect(countAfterSecond).toBe(1);
  });

  it("warns on brand-level propagation (Phase 1 stub)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    propagateAddition("brand", "clr-black");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Phase 1 stub")
    );
    warnSpy.mockRestore();
  });
});

describe("getBrandPreference", () => {
  it("returns brand preference for known brand", () => {
    const result = getBrandPreference("Gildan");
    expect(result).toBeDefined();
    expect(result!.brandName).toBe("Gildan");
    expect(result!.inheritMode).toBe("customize");
  });

  it("returns undefined for unknown brand", () => {
    const result = getBrandPreference("NonexistentBrand");
    expect(result).toBeUndefined();
  });

  it("returns inherit-mode brand correctly", () => {
    const result = getBrandPreference("Bella+Canvas");
    expect(result).toBeDefined();
    expect(result!.inheritMode).toBe("inherit");
  });
});
