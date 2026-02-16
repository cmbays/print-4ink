"use client";

import { useState, useMemo, useCallback } from "react";
import { Heart, Package, Shirt, Palette } from "lucide-react";
import { FavoritesColorSection } from "@/components/features/FavoritesColorSection";
import { InheritanceToggle } from "@/components/features/InheritanceToggle";
import { InheritanceDetail } from "@/components/features/InheritanceDetail";
import { cn } from "@/lib/utils";
import {
  resolveEffectiveFavorites,
  getInheritanceChain,
} from "@/lib/helpers/color-preferences";
import {
  colors as catalogColors,
  garmentCatalog,
  customers,
} from "@/lib/mock-data";
import type { Color } from "@/lib/schemas/color";
import type { InheritanceMode } from "@/lib/schemas/color-preferences";
import type { Customer } from "@/lib/schemas/customer";
import type { GarmentCatalog } from "@/lib/schemas/garment";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CustomerPreferencesTabProps {
  customer: Customer;
}

// ---------------------------------------------------------------------------
// Helper: get unique brand names from garment catalog
// ---------------------------------------------------------------------------

function getAvailableBrands(): string[] {
  const brands = new Set(garmentCatalog.map((g) => g.brand));
  return Array.from(brands).sort();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerPreferencesTab({
  customer,
}: CustomerPreferencesTabProps) {
  // Version counter to force re-render after mock data mutations (Phase 1)
  const [version, setVersion] = useState(0);

  // Resolve the customer's current inherit mode from their favorites
  const hasCustomColors = customer.favoriteColors.length > 0;
  const [inheritMode, setInheritMode] = useState<InheritanceMode>(
    hasCustomColors ? "customize" : "inherit"
  );

  // Resolve parent label for InheritanceToggle
  // If customer has favorite brands, use the primary brand name; otherwise "global"
  const parentLabel = useMemo(() => {
    if (customer.favoriteBrandNames.length > 0) {
      return customer.favoriteBrandNames[0];
    }
    return "global";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.favoriteBrandNames.length, version]);

  // Resolve effective favorites for this customer
  const favorites = useMemo(() => {
    const favoriteIds = resolveEffectiveFavorites("customer", customer.id);
    return favoriteIds
      .map((id) => catalogColors.find((c) => c.id === id))
      .filter((c): c is Color => c != null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id, version]);

  // Get inheritance chain for the detail disclosure
  const chain = useMemo(() => {
    return getInheritanceChain("customer", customer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id, version]);

  // Available brands from the garment catalog
  const availableBrands = useMemo(() => getAvailableBrands(), []);

  // Garments for the favorites section
  const favoriteGarments = useMemo(() => {
    return garmentCatalog.filter((g) =>
      customer.favoriteGarments.includes(g.id)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.favoriteGarments, version]);

  // All garments (for the "add garment" section)
  const nonFavoriteGarments = useMemo(() => {
    const favSet = new Set(customer.favoriteGarments);
    return garmentCatalog.filter((g) => !favSet.has(g.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.favoriteGarments, version]);

  // -------------------------------------------------------------------------
  // N12: setCustomerInheritMode
  // -------------------------------------------------------------------------

  const handleInheritModeChange = useCallback(
    (mode: InheritanceMode) => {
      setInheritMode(mode);

      const cust = customers.find((c) => c.id === customer.id);
      if (!cust) return;

      if (mode === "inherit") {
        // Clear customer overrides — fall back to inherited colors
        cust.favoriteColors = [];
      } else {
        // Switch to customize — copy current effective favorites as starting set
        const effective = resolveEffectiveFavorites("customer", customer.id);
        cust.favoriteColors = [...effective];
      }
      setVersion((v) => v + 1);
    },
    [customer.id]
  );

  // -------------------------------------------------------------------------
  // N13: toggleCustomerColorFavorite
  // -------------------------------------------------------------------------

  const handleToggleColor = useCallback(
    (colorId: string) => {
      const cust = customers.find((c) => c.id === customer.id);
      if (!cust) return;

      const idx = cust.favoriteColors.indexOf(colorId);
      if (idx >= 0) {
        cust.favoriteColors.splice(idx, 1);
      } else {
        cust.favoriteColors.push(colorId);
      }
      setVersion((v) => v + 1);
    },
    [customer.id]
  );

  // -------------------------------------------------------------------------
  // N14: toggleCustomerBrandFavorite
  // -------------------------------------------------------------------------

  const handleToggleBrand = useCallback(
    (brandName: string) => {
      const cust = customers.find((c) => c.id === customer.id);
      if (!cust) return;

      const idx = cust.favoriteBrandNames.indexOf(brandName);
      if (idx >= 0) {
        cust.favoriteBrandNames.splice(idx, 1);
      } else {
        cust.favoriteBrandNames.push(brandName);
      }
      setVersion((v) => v + 1);
    },
    [customer.id]
  );

  // -------------------------------------------------------------------------
  // N15: toggleCustomerGarmentFavorite
  // -------------------------------------------------------------------------

  const handleToggleGarment = useCallback(
    (garmentId: string) => {
      const cust = customers.find((c) => c.id === customer.id);
      if (!cust) return;

      const idx = cust.favoriteGarments.indexOf(garmentId);
      if (idx >= 0) {
        cust.favoriteGarments.splice(idx, 1);
      } else {
        cust.favoriteGarments.push(garmentId);
      }
      setVersion((v) => v + 1);
    },
    [customer.id]
  );

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* Color Preferences (U51-U55) */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Palette size={16} className="text-action" aria-hidden="true" />
          Color Preferences
        </h3>

        {/* U52: InheritanceToggle */}
        <div className="mb-4">
          <InheritanceToggle
            parentLabel={parentLabel}
            mode={inheritMode}
            onChange={handleInheritModeChange}
          />
        </div>

        {/* U53/U54: FavoritesColorSection */}
        <FavoritesColorSection
          favorites={favorites}
          allColors={catalogColors}
          onToggle={handleToggleColor}
          readOnly={inheritMode === "inherit"}
        />

        {/* U55: InheritanceDetail */}
        <div className="mt-3">
          <InheritanceDetail chain={chain} />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Favorite Brands (U56-U57) */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package size={16} className="text-action" aria-hidden="true" />
          Favorite Brands
        </h3>

        {availableBrands.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No brands available in catalog.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Brand favorites">
            {availableBrands.map((brand) => {
              const isFav = customer.favoriteBrandNames.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleToggleBrand(brand)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                    "min-h-(--mobile-touch-target) md:min-h-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "motion-reduce:transition-none",
                    isFav
                      ? "border-action bg-action/10 text-action"
                      : "border-border bg-elevated text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                  aria-pressed={isFav}
                >
                  {isFav && <Heart size={12} className="fill-current" aria-hidden="true" />}
                  {brand}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Favorite Garments (U58-U59) */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Shirt size={16} className="text-action" aria-hidden="true" />
          Favorite Garments
          {favoriteGarments.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({favoriteGarments.length})
            </span>
          )}
        </h3>

        {/* Favorite garment mini-cards */}
        {favoriteGarments.length === 0 && nonFavoriteGarments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No garments in catalog.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Current favorites */}
            {favoriteGarments.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                No favorite garments set. Tap a garment below to add.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {favoriteGarments.map((garment) => (
                  <GarmentMiniCard
                    key={garment.id}
                    garment={garment}
                    isFavorite={true}
                    onToggle={() => handleToggleGarment(garment.id)}
                  />
                ))}
              </div>
            )}

            {/* All garments (non-favorites) */}
            {nonFavoriteGarments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  All Garments ({nonFavoriteGarments.length})
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {nonFavoriteGarments.map((garment) => (
                    <GarmentMiniCard
                      key={garment.id}
                      garment={garment}
                      isFavorite={false}
                      onToggle={() => handleToggleGarment(garment.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Garment Mini Card — compact card for favorite garments
// ---------------------------------------------------------------------------

function GarmentMiniCard({
  garment,
  isFavorite,
  onToggle,
}: {
  garment: GarmentCatalog;
  isFavorite: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 rounded-md border p-3 text-left transition-colors",
        "min-h-(--mobile-touch-target) md:min-h-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-reduce:transition-none",
        isFavorite
          ? "border-action/30 bg-action/5"
          : "border-border bg-elevated hover:border-foreground/20"
      )}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Remove ${garment.name} from favorites`
          : `Add ${garment.name} to favorites`
      }
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-surface">
        <Shirt size={20} className="text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate text-sm font-medium",
          isFavorite ? "text-foreground" : "text-muted-foreground"
        )}>
          {garment.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {garment.brand} &middot; {garment.sku}
        </p>
      </div>
      {isFavorite && (
        <Heart size={14} className="flex-shrink-0 fill-action text-action" aria-hidden="true" />
      )}
    </button>
  );
}
