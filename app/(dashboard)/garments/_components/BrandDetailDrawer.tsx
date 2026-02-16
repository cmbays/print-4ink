"use client";

import { useState, useMemo, useCallback } from "react";
import { Palette, Package } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FavoritesColorSection } from "@/components/features/FavoritesColorSection";
import { InheritanceToggle } from "@/components/features/InheritanceToggle";
import { InheritanceDetail } from "@/components/features/InheritanceDetail";
import { GarmentMiniCard } from "@/components/features/GarmentMiniCard";
import { cn } from "@/lib/utils";
import {
  resolveEffectiveFavorites,
  getInheritanceChain,
  getBrandPreference,
  propagateAddition,
} from "@/lib/helpers/color-preferences";
import {
  colors as catalogColors,
  garmentCatalog,
  brandPreferences,
} from "@/lib/mock-data";
import type { Color } from "@/lib/schemas/color";
import { brandPreferenceSchema } from "@/lib/schemas/color-preferences";
import type { InheritanceMode } from "@/lib/schemas/color-preferences";


// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BrandDetailDrawerProps {
  brandName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGarmentClick?: (garmentId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BrandDetailDrawer({
  brandName,
  open,
  onOpenChange,
  onGarmentClick,
}: BrandDetailDrawerProps) {
  // Version counter to force re-render after mock data mutations
  const [version, setVersion] = useState(0);

  // N24: getBrandGarments — filter catalog by brand name
  // version forces recomputation after in-place mock data mutations (Phase 1 only)
  const brandGarments = useMemo(
    () => garmentCatalog.filter((g) => g.brand === brandName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version],
  );

  // Get or initialize brand preference
  const brandPref = useMemo(
    () => {
      const existing = getBrandPreference(brandName);
      if (existing) return existing;
      // Brand has no explicit preference — construct validated fallback
      return brandPreferenceSchema.parse({
        brandName,
        inheritMode: "inherit",
        favoriteColorIds: [],
        explicitColorIds: [],
        removedInheritedColorIds: [],
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version],
  );

  // Resolve effective favorites for this brand
  const effectiveFavoriteIds = useMemo(
    () => resolveEffectiveFavorites("brand", brandName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version],
  );

  // Resolve Color objects for favorites
  const favoriteColors = useMemo(
    () =>
      effectiveFavoriteIds
        .map((id) => catalogColors.find((c) => c.id === id))
        .filter((c): c is Color => c != null),
    [effectiveFavoriteIds],
  );

  // N20: getInheritanceChain for the disclosure section
  const inheritanceChain = useMemo(
    () => getInheritanceChain("brand", brandName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brandName, version],
  );

  // Badge data for FavoritesColorSection (U25)
  const badgeData = useMemo(() => {
    if (brandPref.inheritMode === "inherit") return undefined;
    const map = new Map<string, "inherited" | "added">();
    const explicitSet = new Set(brandPref.explicitColorIds);
    for (const colorId of effectiveFavoriteIds) {
      map.set(colorId, explicitSet.has(colorId) ? "added" : "inherited");
    }
    return map;
  }, [brandPref, effectiveFavoriteIds]);

  // -- Handlers ---------------------------------------------------------------

  // N7: setBrandInheritMode — toggle between 'inherit' and 'customize'
  const handleInheritModeChange = useCallback(
    (mode: InheritanceMode) => {
      const existing = brandPreferences.find((b) => b.brandName === brandName);

      if (mode === "customize" && (!existing || existing.inheritMode === "inherit")) {
        // Switching to customize: copy current effective favorites as starting set
        const currentEffective = resolveEffectiveFavorites("brand", brandName);

        if (existing) {
          existing.inheritMode = "customize";
          existing.favoriteColorIds = [...currentEffective];
          existing.explicitColorIds = [];
          existing.removedInheritedColorIds = [];
        } else {
          // Create new brand preference entry (Zod-validated)
          brandPreferences.push(
            brandPreferenceSchema.parse({
              brandName,
              inheritMode: "customize",
              favoriteColorIds: [...currentEffective],
              explicitColorIds: [],
              removedInheritedColorIds: [],
            }),
          );
        }
      } else if (mode === "inherit" && existing) {
        existing.inheritMode = "inherit";
        existing.favoriteColorIds = [];
        existing.explicitColorIds = [];
        existing.removedInheritedColorIds = [];
      }

      setVersion((v) => v + 1);
    },
    [brandName],
  );

  // N8: toggleBrandFavorite — add/remove color from brand favorites
  const handleToggleFavorite = useCallback(
    (colorId: string) => {
      const pref = brandPreferences.find((b) => b.brandName === brandName);
      if (!pref || pref.inheritMode === "inherit") return;

      const globalFavoriteIds = resolveEffectiveFavorites("global");
      const isGlobalFavorite = globalFavoriteIds.includes(colorId);
      const isFavorite = pref.favoriteColorIds.includes(colorId);

      if (isFavorite) {
        // Removing
        pref.favoriteColorIds = pref.favoriteColorIds.filter((id) => id !== colorId);
        pref.explicitColorIds = pref.explicitColorIds.filter((id) => id !== colorId);

        // If it was a global favorite, track as removed
        if (isGlobalFavorite) {
          if (!pref.removedInheritedColorIds.includes(colorId)) {
            pref.removedInheritedColorIds.push(colorId);
          }
        }

        // Removal + children → stub P4 (→ V6)
        // PHASE 1 STUB: RemovalConfirmationDialog wired in V6
      } else {
        // Adding
        pref.favoriteColorIds.push(colorId);

        // If it's not a global favorite, track as explicitly added
        if (!isGlobalFavorite) {
          if (!pref.explicitColorIds.includes(colorId)) {
            pref.explicitColorIds.push(colorId);
          }
        }

        // If it was previously removed from inherited, un-remove it
        pref.removedInheritedColorIds = pref.removedInheritedColorIds.filter(
          (id) => id !== colorId,
        );

        // Addition + S8=true → stub N22 (→ V6)
        // PHASE 1 STUB: brand-level propagation is a no-op
        propagateAddition("brand", colorId);
      }

      setVersion((v) => v + 1);
    },
    [brandName],
  );

  // N9: restoreInheritedColor — remove from removedInheritedColorIds
  const handleRestoreColor = useCallback(
    (colorId: string) => {
      const pref = brandPreferences.find((b) => b.brandName === brandName);
      if (!pref) return;

      pref.removedInheritedColorIds = pref.removedInheritedColorIds.filter(
        (id) => id !== colorId,
      );

      // Re-add to favoriteColorIds if not already present
      if (!pref.favoriteColorIds.includes(colorId)) {
        pref.favoriteColorIds.push(colorId);
      }

      setVersion((v) => v + 1);
    },
    [brandName],
  );

  // -- Render -----------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full md:max-w-md p-0 flex flex-col"
      >
        {/* U21: Brand name + garment count header */}
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-base">
            {brandName}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {brandGarments.length}{" "}
              {brandGarments.length === 1 ? "garment" : "garments"}
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Color preferences for {brandName}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 p-4">
            {/* U22: InheritanceToggle */}
            <InheritanceToggle
              parentLabel="global"
              mode={brandPref.inheritMode}
              onChange={handleInheritModeChange}
            />

            {/* Color favorites section */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Palette size={14} aria-hidden="true" />
                Colors
                <span className="text-muted-foreground/60">
                  ({effectiveFavoriteIds.length} favorites)
                </span>
              </h3>

              {brandPref.inheritMode === "inherit" ? (
                // Inheriting: read-only view of global defaults
                <FavoritesColorSection
                  favorites={favoriteColors}
                  allColors={catalogColors}
                  onToggle={() => {}}
                  readOnly
                />
              ) : (
                // Customizing: editable with per-color badges (U25)
                <FavoritesColorSection
                  favorites={favoriteColors}
                  allColors={catalogColors}
                  onToggle={handleToggleFavorite}
                  showBadges
                  badgeData={badgeData}
                />
              )}
            </div>

            {/* U26-U28: InheritanceDetail — progressive disclosure */}
            <InheritanceDetail
              chain={inheritanceChain}
              onRestore={
                brandPref.inheritMode === "customize"
                  ? handleRestoreColor
                  : undefined
              }
            />

            {/* U29: Brand garment list — mini-cards */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Package size={14} aria-hidden="true" />
                Garments
                <span className="text-muted-foreground/60">
                  ({brandGarments.length})
                </span>
              </h3>

              {brandGarments.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No garments from this brand in catalog
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {brandGarments.map((garment) => (
                    <GarmentMiniCard
                      key={garment.id}
                      garment={garment}
                      variant="detail"
                      onClick={onGarmentClick ? () => onGarmentClick(garment.id) : () => {}}
                      disabled={!onGarmentClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

