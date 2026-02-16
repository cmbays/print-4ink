import {
  colors,
  customers,
  brandPreferences,
  autoPropagationConfig,
} from "@/lib/mock-data";
import type { BrandPreference } from "@/lib/schemas/color-preferences";

// ---------------------------------------------------------------------------
// Shared: global favorites derived from catalog
// ---------------------------------------------------------------------------

function getGlobalFavoriteIds(): string[] {
  return colors.filter((c) => c.isFavorite === true).map((c) => c.id);
}

// ---------------------------------------------------------------------------
// N19: resolveEffectiveFavorites
// Walk global → brand → customer hierarchy, return colorIds[]
// ---------------------------------------------------------------------------

type EntityType = "global" | "brand" | "customer";

export function resolveEffectiveFavorites(
  entityType: EntityType,
  entityId?: string
): string[] {
  const globalFavorites = getGlobalFavoriteIds();

  switch (entityType) {
    case "global":
      return globalFavorites;

    case "brand": {
      const brand = brandPreferences.find((b) => b.brandName === entityId);
      if (!brand || brand.inheritMode === "inherit") {
        return globalFavorites;
      }
      return brand.favoriteColorIds;
    }

    case "customer": {
      const customer = customers.find((c) => c.id === entityId);
      if (!customer || customer.favoriteColors.length === 0) {
        // No customer customization — fall through to global
        // For Phase 1: customer inherits from global (brand resolution added in V4)
        return globalFavorites;
      }
      return customer.favoriteColors;
    }

    default: {
      const _exhaustive: never = entityType;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// N20: getInheritanceChain
// Return the inheritance chain showing global defaults, added, removed
// ---------------------------------------------------------------------------

export interface InheritanceChain {
  globalDefaults: string[];
  addedAtLevel: string[];
  removedAtLevel: string[];
}

export function getInheritanceChain(
  entityType: EntityType,
  entityId?: string
): InheritanceChain {
  const globalDefaults = getGlobalFavoriteIds();

  switch (entityType) {
    case "global":
      return { globalDefaults, addedAtLevel: [], removedAtLevel: [] };

    case "brand": {
      const brand = brandPreferences.find((b) => b.brandName === entityId);
      if (!brand || brand.inheritMode === "inherit") {
        return { globalDefaults, addedAtLevel: [], removedAtLevel: [] };
      }
      return {
        globalDefaults,
        addedAtLevel: brand.explicitColorIds,
        removedAtLevel: brand.removedInheritedColorIds,
      };
    }

    case "customer": {
      const customer = customers.find((c) => c.id === entityId);
      if (!customer || customer.favoriteColors.length === 0) {
        return { globalDefaults, addedAtLevel: [], removedAtLevel: [] };
      }
      const addedAtLevel = customer.favoriteColors.filter(
        (id) => !globalDefaults.includes(id)
      );
      const removedAtLevel = globalDefaults.filter(
        (id) => !customer.favoriteColors.includes(id)
      );
      return { globalDefaults, addedAtLevel, removedAtLevel };
    }

    default: {
      const _exhaustive: never = entityType;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// N22: propagateAddition
// If autoPropagate is enabled, find inheriting children and append colorId
// PHASE 1: Mutates mock-data arrays in-place. In Phase 3 this becomes an API
// call that writes to the database — no shared-reference mutation.
// ---------------------------------------------------------------------------

export function propagateAddition(
  level: "global" | "brand",
  colorId: string
): void {
  if (!autoPropagationConfig.autoPropagate) return;

  if (level === "global") {
    // Propagate to all brands in inherit mode
    for (const brand of brandPreferences) {
      if (brand.inheritMode === "inherit") {
        // Inherit mode brands get it automatically via resolution — no explicit write needed
        continue;
      }
      // Customize mode brands: add if not explicitly removed
      if (!brand.removedInheritedColorIds.includes(colorId)) {
        if (!brand.favoriteColorIds.includes(colorId)) {
          brand.favoriteColorIds.push(colorId);
        }
      }
    }
    // Propagate to all customers without explicit customizations
    for (const customer of customers) {
      if (customer.favoriteColors.length === 0) {
        // Inheriting — gets it automatically via resolution
        continue;
      }
      // Has customizations: add if not already present
      if (!customer.favoriteColors.includes(colorId)) {
        customer.favoriteColors.push(colorId);
      }
    }
  }

  if (level === "brand") {
    // PHASE 1 STUB: Brand→customer propagation not wired until V4/V5.
    // Callers should check the brand-level propagation is a no-op in Phase 1.
    // This will be expanded when brand→customer hierarchy is wired.
    console.warn(
      "[color-preferences] propagateAddition: brand-level propagation is a Phase 1 stub (no-op)"
    );
  }
}

// ---------------------------------------------------------------------------
// N21: getImpactPreview
// Return counts and lists of entities that have this color as favorite
// ---------------------------------------------------------------------------

export interface ImpactPreview {
  supplierCount: number;
  customerCount: number;
  suppliers: string[];
  customers: string[];
  /** True when the result is incomplete due to Phase 1 limitations */
  isStub?: boolean;
}

export function getImpactPreview(
  level: "global" | "brand",
  colorId: string
): ImpactPreview {
  const affectedSuppliers: string[] = [];
  const affectedCustomers: string[] = [];

  if (level === "global") {
    // Check which brands have this color (explicitly or inherited)
    for (const brand of brandPreferences) {
      if (brand.inheritMode === "inherit") {
        // Would lose it if removed from global
        affectedSuppliers.push(brand.brandName);
      } else if (brand.favoriteColorIds.includes(colorId)) {
        affectedSuppliers.push(brand.brandName);
      }
    }

    // Check which customers have this color
    for (const customer of customers) {
      if (customer.favoriteColors.length === 0) {
        // Inheriting — would lose it if removed from global
        affectedCustomers.push(customer.company);
      } else if (customer.favoriteColors.includes(colorId)) {
        affectedCustomers.push(customer.company);
      }
    }

    return {
      supplierCount: affectedSuppliers.length,
      customerCount: affectedCustomers.length,
      suppliers: affectedSuppliers,
      customers: affectedCustomers,
    };
  }

  // PHASE 1 STUB: Brand-level impact preview requires customer→brand link (V4/V5)
  return {
    supplierCount: 0,
    customerCount: 0,
    suppliers: [],
    customers: [],
    isStub: true,
  };
}

// ---------------------------------------------------------------------------
// N16: removeFromAll
// Remove color from all entities at and below the specified level.
// PHASE 1: Mutates mock-data in-place.
// ---------------------------------------------------------------------------

export function removeFromAll(
  level: "global" | "brand",
  colorId: string
): void {
  if (level === "global") {
    // Remove from all brands that explicitly have this color
    for (const brand of brandPreferences) {
      if (brand.inheritMode === "customize") {
        brand.favoriteColorIds = brand.favoriteColorIds.filter(
          (id) => id !== colorId
        );
        brand.explicitColorIds = brand.explicitColorIds.filter(
          (id) => id !== colorId
        );
        // No need to track in removedInheritedColorIds — it's gone from global too
        brand.removedInheritedColorIds = brand.removedInheritedColorIds.filter(
          (id) => id !== colorId
        );
      }
      // Inherit-mode brands lose it automatically via resolution
    }

    // Remove from all customers with explicit favorites
    for (const customer of customers) {
      if (customer.favoriteColors.length > 0) {
        customer.favoriteColors = customer.favoriteColors.filter(
          (id) => id !== colorId
        );
      }
      // Inheriting customers lose it automatically via resolution
    }
  }

  if (level === "brand") {
    // PHASE 1 STUB: Brand→customer cascade requires customer-brand link (V5)
    // When customer-brand hierarchy is wired, iterate linked customers here
  }
}

// ---------------------------------------------------------------------------
// N17: removeFromLevelOnly
// Remove from specified level only — children retain their customizations.
// Inherit-mode children lose it naturally; customize-mode children keep it.
// PHASE 1: No downstream mutation needed — inheritance resolution handles it.
// ---------------------------------------------------------------------------

export function removeFromLevelOnly(
  _level: "global" | "brand",
  _colorId: string
): void {
  // No downstream changes needed — let inheritance resolution handle it:
  // - Inherit-mode children: lose it automatically (no longer in parent)
  // - Customize-mode children: keep it (in their own favoriteColorIds)
  // The caller handles the removal at its own level.
}

// ---------------------------------------------------------------------------
// N18: removeFromSelected
// Remove from selected entities only. Caller also removes from its own level.
// PHASE 1: Mutates mock-data in-place.
// ---------------------------------------------------------------------------

export function removeFromSelected(
  level: "global" | "brand",
  colorId: string,
  brandNames: string[],
  customerCompanies: string[]
): void {
  if (level === "global") {
    // Remove from selected brands
    for (const brand of brandPreferences) {
      if (brandNames.includes(brand.brandName) && brand.inheritMode === "customize") {
        brand.favoriteColorIds = brand.favoriteColorIds.filter(
          (id) => id !== colorId
        );
        brand.explicitColorIds = brand.explicitColorIds.filter(
          (id) => id !== colorId
        );
        brand.removedInheritedColorIds = brand.removedInheritedColorIds.filter(
          (id) => id !== colorId
        );
      }
    }

    // Remove from selected customers
    for (const customer of customers) {
      if (
        customerCompanies.includes(customer.company) &&
        customer.favoriteColors.length > 0
      ) {
        customer.favoriteColors = customer.favoriteColors.filter(
          (id) => id !== colorId
        );
      }
    }
  }

  if (level === "brand") {
    // PHASE 1 STUB: Brand→customer cascade requires customer-brand link (V5)
  }
}

// ---------------------------------------------------------------------------
// Utility: get brand preference by name
// ---------------------------------------------------------------------------

export function getBrandPreference(
  brandName: string
): BrandPreference | undefined {
  return brandPreferences.find((b) => b.brandName === brandName);
}
