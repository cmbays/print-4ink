import {
  colors,
  customers,
  brandPreferences,
  autoPropagationConfig,
} from "@/lib/mock-data";
import type { BrandPreference } from "@/lib/schemas/color-preferences";

// ---------------------------------------------------------------------------
// N19: resolveEffectiveFavorites
// Walk global → brand → customer hierarchy, return colorIds[]
// ---------------------------------------------------------------------------

export function resolveEffectiveFavorites(
  entityType: "global" | "brand" | "customer",
  entityId?: string
): string[] {
  // Global level: colors with isFavorite = true
  const globalFavorites = colors
    .filter((c) => c.isFavorite === true)
    .map((c) => c.id);

  if (entityType === "global") {
    return globalFavorites;
  }

  if (entityType === "brand") {
    const brand = brandPreferences.find((b) => b.brandName === entityId);
    if (!brand || brand.inheritMode === "inherit") {
      return globalFavorites;
    }
    // Customize mode: return the brand's own favorites
    return brand.favoriteColorIds;
  }

  if (entityType === "customer") {
    const customer = customers.find((c) => c.id === entityId);
    if (!customer || customer.favoriteColors.length === 0) {
      // No customer customization — fall through to brand or global
      // For Phase 1: customer inherits from global (brand resolution added in V4)
      return globalFavorites;
    }
    return customer.favoriteColors;
  }

  return [];
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
  entityType: "global" | "brand" | "customer",
  entityId?: string
): InheritanceChain {
  const globalDefaults = colors
    .filter((c) => c.isFavorite === true)
    .map((c) => c.id);

  if (entityType === "global") {
    return { globalDefaults, addedAtLevel: [], removedAtLevel: [] };
  }

  if (entityType === "brand") {
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

  if (entityType === "customer") {
    const customer = customers.find((c) => c.id === entityId);
    if (!customer || customer.favoriteColors.length === 0) {
      return { globalDefaults, addedAtLevel: [], removedAtLevel: [] };
    }
    // For customer: added = colors not in global, removed = global colors not in customer
    const addedAtLevel = customer.favoriteColors.filter(
      (id) => !globalDefaults.includes(id)
    );
    const removedAtLevel = globalDefaults.filter(
      (id) => !customer.favoriteColors.includes(id)
    );
    return { globalDefaults, addedAtLevel, removedAtLevel };
  }

  return { globalDefaults, addedAtLevel: [], removedAtLevel: [] };
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
    // Brand-level propagation: propagate to inheriting customers
    // For Phase 1, customers inherit from global, not brand directly.
    // This will be expanded in V4/V5 when brand→customer hierarchy is wired.
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
  }

  if (level === "brand") {
    // Brand-level removal: check customers inheriting from this brand
    // Phase 1: customer→brand link isn't wired yet, so return empty
  }

  return {
    supplierCount: affectedSuppliers.length,
    customerCount: affectedCustomers.length,
    suppliers: affectedSuppliers,
    customers: affectedCustomers,
  };
}

// ---------------------------------------------------------------------------
// Utility: get brand preference by name
// ---------------------------------------------------------------------------

export function getBrandPreference(
  brandName: string
): BrandPreference | undefined {
  return brandPreferences.find((b) => b.brandName === brandName);
}
