"use client";

import { useState, useMemo, useSyncExternalStore, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { GarmentCatalogToolbar } from "./_components/GarmentCatalogToolbar";
import { GarmentCard } from "./_components/GarmentCard";
import { GarmentTableRow } from "./_components/GarmentTableRow";
import { GarmentDetailDrawer } from "./_components/GarmentDetailDrawer";
import {
  garmentCatalog as initialCatalog,
  jobs,
  customers,
} from "@/lib/mock-data";
import { resolveEffectiveFavorites } from "@/lib/helpers/color-preferences";
import type { GarmentCatalog } from "@/lib/schemas/garment";

// ---------------------------------------------------------------------------
// Inner component (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function GarmentCatalogInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL state
  const category = searchParams.get("category") ?? "all";
  const searchQuery = searchParams.get("q") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const colorsParam = searchParams.get("colors") ?? "";
  const view = searchParams.get("view") ?? "grid";

  // Parse color IDs from URL
  const selectedColorIds = useMemo(
    () => (colorsParam ? colorsParam.split(",").filter(Boolean) : []),
    [colorsParam]
  );

  // Resolved global favorites for card display
  const globalFavoriteColorIds = useMemo(
    () => resolveEffectiveFavorites("global"),
    []
  );

  // Local state for mock data mutations
  const [catalog, setCatalog] = useState<GarmentCatalog[]>(initialCatalog);

  // Price visibility from localStorage (useSyncExternalStore avoids setState-in-effect)
  const subscribeToPriceStore = useCallback((onStoreChange: () => void) => {
    // Cross-tab changes
    window.addEventListener("storage", onStoreChange);
    // Same-page changes (storage event doesn't fire on the originating tab)
    const interval = setInterval(onStoreChange, 500);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      clearInterval(interval);
    };
  }, []);

  const showPrice = useSyncExternalStore(
    subscribeToPriceStore,
    () => localStorage.getItem("garment-show-prices") !== "false",
    () => true, // server snapshot
  );

  // Selected garment for drawer
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(
    null,
  );
  const selectedGarment =
    catalog.find((g) => g.id === selectedGarmentId) ?? null;

  // --- Color filter URL helpers ---
  const updateColorsParam = useCallback(
    (colorIds: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (colorIds.length === 0) {
        params.delete("colors");
      } else {
        params.set("colors", colorIds.join(","));
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleToggleColor = useCallback(
    (colorId: string) => {
      const next = selectedColorIds.includes(colorId)
        ? selectedColorIds.filter((id) => id !== colorId)
        : [...selectedColorIds, colorId];
      updateColorsParam(next);
    },
    [selectedColorIds, updateColorsParam]
  );

  const handleClearColors = useCallback(() => {
    updateColorsParam([]);
  }, [updateColorsParam]);

  // Filter garments (N23: getFilteredGarmentsByColors)
  const filteredGarments = useMemo(() => {
    const colorFilterSet =
      selectedColorIds.length > 0 ? new Set(selectedColorIds) : null;

    return catalog.filter((g) => {
      // Category filter
      if (category !== "all" && g.baseCategory !== category) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          g.name.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.sku.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Brand filter
      if (brand && g.brand !== brand) return false;

      // Color filter — garment has ANY matching colorId in its palette
      if (colorFilterSet) {
        const hasMatchingColor = g.availableColors.some((colorId) =>
          colorFilterSet.has(colorId)
        );
        if (!hasMatchingColor) return false;
      }

      return true;
    });
  }, [catalog, category, searchQuery, brand, selectedColorIds]);

  // Extract unique brands for filter dropdown
  const brands = useMemo(
    () => [...new Set(catalog.map((g) => g.brand))].sort(),
    [catalog],
  );

  // Linked jobs for drawer
  const linkedJobs = useMemo(() => {
    if (!selectedGarmentId) return [];
    return jobs
      .filter((j) =>
        j.garmentDetails.some((gd) => gd.garmentId === selectedGarmentId),
      )
      .map((j) => {
        const customer = customers.find((c) => c.id === j.customerId);
        return {
          id: j.id,
          jobNumber: j.jobNumber,
          customerName: customer?.company ?? "Unknown",
        };
      });
  }, [selectedGarmentId]);

  // Handlers
  function handleToggleEnabled(garmentId: string) {
    setCatalog((prev) =>
      prev.map((g) =>
        g.id === garmentId ? { ...g, isEnabled: !g.isEnabled } : g,
      ),
    );
  }

  function handleToggleFavorite(garmentId: string) {
    setCatalog((prev) =>
      prev.map((g) =>
        g.id === garmentId ? { ...g, isFavorite: !g.isFavorite } : g,
      ),
    );
  }

  return (
    <>
      <GarmentCatalogToolbar
        brands={brands}
        selectedColorIds={selectedColorIds}
        onToggleColor={handleToggleColor}
        onClearColors={handleClearColors}
        garmentCount={filteredGarments.length}
      />

      {/* Grid View */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {filteredGarments.map((garment) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              showPrice={showPrice}
              favoriteColorIds={globalFavoriteColorIds}
              onToggleFavorite={handleToggleFavorite}
              onClick={setSelectedGarmentId}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-elevated">
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Brand
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  SKU
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Name
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Category
                </th>
                {showPrice && (
                  <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Price
                  </th>
                )}
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Enabled
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fav
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGarments.map((garment) => (
                <GarmentTableRow
                  key={garment.id}
                  garment={garment}
                  showPrice={showPrice}
                  onToggleEnabled={handleToggleEnabled}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={setSelectedGarmentId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {filteredGarments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No garments match your filters
          </p>
        </div>
      )}

      {/* Detail Drawer — conditional rendering for state reset */}
      {selectedGarment && (
        <GarmentDetailDrawer
          garment={selectedGarment}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedGarmentId(null);
          }}
          showPrice={showPrice}
          linkedJobs={linkedJobs}
          onToggleEnabled={handleToggleEnabled}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GarmentCatalogPage() {
  return (
    <>
      <Topbar breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Garment Catalog" }]} />
      <div className="flex flex-col gap-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading garments...
            </div>
          }
        >
          <GarmentCatalogInner />
        </Suspense>
      </div>
    </>
  );
}
