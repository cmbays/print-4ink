"use client";

import { useState, useMemo, useSyncExternalStore, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { getColorById } from "@/lib/helpers/garment-helpers";
import type { GarmentCatalog } from "@/lib/schemas/garment";

// ---------------------------------------------------------------------------
// Inner component (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function GarmentCatalogInner() {
  const searchParams = useSearchParams();

  // URL state
  const category = searchParams.get("category") ?? "all";
  const searchQuery = searchParams.get("q") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const colorFamily = searchParams.get("colorFamily") ?? "";
  const view = searchParams.get("view") ?? "grid";

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

  // Filter garments
  const filteredGarments = useMemo(() => {
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

      // Color family filter
      if (colorFamily) {
        const hasColorInFamily = g.availableColors.some((colorId) => {
          const color = getColorById(colorId);
          return color?.family === colorFamily;
        });
        if (!hasColorInFamily) return false;
      }

      return true;
    });
  }, [catalog, category, searchQuery, brand, colorFamily]);

  // Extract unique brands and color families for filter dropdowns
  const brands = useMemo(
    () => [...new Set(catalog.map((g) => g.brand))].sort(),
    [catalog],
  );

  const colorFamilies = useMemo(() => {
    const families = new Set<string>();
    catalog.forEach((g) => {
      g.availableColors.forEach((colorId) => {
        const color = getColorById(colorId);
        if (color) families.add(color.family);
      });
    });
    return [...families].sort();
  }, [catalog]);

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
        colorFamilies={colorFamilies}
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
