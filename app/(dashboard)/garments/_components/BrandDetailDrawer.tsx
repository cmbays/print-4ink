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
import { GarmentImage } from "@/components/features/GarmentImage";
import { RemovalConfirmationDialog } from "@/components/features/RemovalConfirmationDialog";
import { cn } from "@/lib/utils";
import {
  resolveEffectiveFavorites,
  getInheritanceChain,
  getBrandPreference,
  propagateAddition,
  getImpactPreview,
  removeFromAll,
  removeFromLevelOnly,
  removeFromSelected,
} from "@/lib/helpers/color-preferences";
import type { ImpactPreview } from "@/lib/helpers/color-preferences";
import {
  colors as catalogColors,
  garmentCatalog,
  brandPreferences,
} from "@/lib/mock-data";
import type { Color } from "@/lib/schemas/color";
import { brandPreferenceSchema } from "@/lib/schemas/color-preferences";
import type { InheritanceMode } from "@/lib/schemas/color-preferences";
import type { GarmentCatalog } from "@/lib/schemas/garment";

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
  const [pendingRemoval, setPendingRemoval] = useState<{
    colorId: string;
    color: Color;
    impact: ImpactPreview;
  } | null>(null);

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

  // Shared: apply brand-level removal (extracted so dialog handlers can reuse)
  const applyBrandRemoval = useCallback(
    (colorId: string) => {
      const pref = brandPreferences.find((b) => b.brandName === brandName);
      if (!pref || pref.inheritMode === "inherit") return;

      const globalFavoriteIds = resolveEffectiveFavorites("global");
      const isGlobalFavorite = globalFavoriteIds.includes(colorId);

      pref.favoriteColorIds = pref.favoriteColorIds.filter((id) => id !== colorId);
      pref.explicitColorIds = pref.explicitColorIds.filter((id) => id !== colorId);

      if (isGlobalFavorite && !pref.removedInheritedColorIds.includes(colorId)) {
        pref.removedInheritedColorIds.push(colorId);
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

      const isFavorite = pref.favoriteColorIds.includes(colorId);

      if (isFavorite) {
        // N8→P4: check impact before removing
        const impact = getImpactPreview("brand", colorId);
        if (!impact.isStub && (impact.supplierCount > 0 || impact.customerCount > 0)) {
          // Open RemovalConfirmationDialog — don't remove yet
          const color = catalogColors.find((c) => c.id === colorId);
          if (!color) {
            // Catalog color missing — remove directly rather than showing broken dialog
            applyBrandRemoval(colorId);
            return;
          }
          setPendingRemoval({ colorId, color, impact });
          return;
        }
        // No children affected (or stub data) — remove directly
        applyBrandRemoval(colorId);
      } else {
        // Adding
        const globalFavoriteIds = resolveEffectiveFavorites("global");
        const isGlobalFavorite = globalFavoriteIds.includes(colorId);

        pref.favoriteColorIds.push(colorId);

        if (!isGlobalFavorite && !pref.explicitColorIds.includes(colorId)) {
          pref.explicitColorIds.push(colorId);
        }

        pref.removedInheritedColorIds = pref.removedInheritedColorIds.filter(
          (id) => id !== colorId,
        );

        // N22: propagateAddition for brand level
        propagateAddition("brand", colorId);

        setVersion((v) => v + 1);
      }
    },
    [brandName, applyBrandRemoval],
  );

  // P4 action handlers — called from RemovalConfirmationDialog
  const handleRemoveAll = useCallback(() => {
    if (!pendingRemoval) return;
    applyBrandRemoval(pendingRemoval.colorId);
    removeFromAll("brand", pendingRemoval.colorId);
    setPendingRemoval(null);
  }, [pendingRemoval, applyBrandRemoval]);

  const handleRemoveLevelOnly = useCallback(() => {
    if (!pendingRemoval) return;
    applyBrandRemoval(pendingRemoval.colorId);
    removeFromLevelOnly("brand", pendingRemoval.colorId);
    setPendingRemoval(null);
  }, [pendingRemoval, applyBrandRemoval]);

  const handleRemoveSelected = useCallback(
    (brandNames: string[], customerCompanies: string[]) => {
      if (!pendingRemoval) return;
      applyBrandRemoval(pendingRemoval.colorId);
      removeFromSelected("brand", pendingRemoval.colorId, brandNames, customerCompanies);
      setPendingRemoval(null);
    },
    [pendingRemoval, applyBrandRemoval],
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
                    <BrandGarmentMiniCard
                      key={garment.id}
                      garment={garment}
                      onClick={onGarmentClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>

      {/* P4: Removal Confirmation Dialog */}
      {pendingRemoval && (
        <RemovalConfirmationDialog
          open={!!pendingRemoval}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingRemoval(null);
          }}
          color={pendingRemoval.color}
          level="brand"
          levelLabel={brandName}
          impact={pendingRemoval.impact}
          onRemoveAll={handleRemoveAll}
          onRemoveLevelOnly={handleRemoveLevelOnly}
          onRemoveSelected={handleRemoveSelected}
        />
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Brand Garment Mini-Card (U29)
// ---------------------------------------------------------------------------

function BrandGarmentMiniCard({
  garment,
  onClick,
}: {
  garment: GarmentCatalog;
  onClick?: (garmentId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(garment.id) : undefined}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-left transition-colors",
        "min-h-(--mobile-touch-target) md:min-h-0",
        onClick && "cursor-pointer hover:bg-elevated",
        !onClick && "cursor-default",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-reduce:transition-none",
      )}
    >
      <GarmentImage
        brand={garment.brand}
        sku={garment.sku}
        name={garment.name}
        size="sm"
      />
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate text-sm font-medium text-foreground">
          {garment.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {garment.sku} · {garment.availableColors.length} colors
        </span>
      </div>
    </button>
  );
}
