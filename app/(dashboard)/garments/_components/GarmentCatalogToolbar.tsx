"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, LayoutGrid, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "t-shirts", label: "T-Shirts" },
  { value: "fleece", label: "Fleece" },
  { value: "outerwear", label: "Outerwear" },
  { value: "pants", label: "Pants" },
  { value: "headwear", label: "Headwear" },
] as const;

const PRICE_STORAGE_KEY = "garment-show-prices";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GarmentCatalogToolbarProps {
  brands: string[];
  colorFamilies: string[];
  garmentCount: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GarmentCatalogToolbar({
  brands,
  colorFamilies,
  garmentCount,
}: GarmentCatalogToolbarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // --- Read URL state ---
  const category = searchParams.get("category") ?? "all";
  const query = searchParams.get("q") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const colorFamily = searchParams.get("colorFamily") ?? "";
  const view = searchParams.get("view") ?? "grid";

  // --- Price toggle (localStorage) ---
  const [showPrices, setShowPrices] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(PRICE_STORAGE_KEY);
    if (stored !== null) {
      setShowPrices(stored === "true");
    }
  }, []);

  const handlePriceToggle = useCallback((checked: boolean) => {
    setShowPrices(checked);
    localStorage.setItem(PRICE_STORAGE_KEY, String(checked));
  }, []);

  // --- URL update helper ---
  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        value === null ||
        value === "" ||
        (key === "category" && value === "all") ||
        (key === "view" && value === "grid")
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // --- Active filters (for pills) ---
  const activeFilters: { key: string; label: string; value: string }[] = [];

  if (category !== "all") {
    const cat = CATEGORIES.find((c) => c.value === category);
    activeFilters.push({
      key: "category",
      label: cat?.label ?? category,
      value: category,
    });
  }
  if (query) {
    activeFilters.push({ key: "q", label: `"${query}"`, value: query });
  }
  if (brand) {
    activeFilters.push({ key: "brand", label: brand, value: brand });
  }
  if (colorFamily) {
    activeFilters.push({
      key: "colorFamily",
      label: colorFamily,
      value: colorFamily,
    });
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Category Tabs */}
      <div className="-mx-1 overflow-x-auto px-1">
        <Tabs
          value={category}
          onValueChange={(v) => updateParam("category", v)}
        >
          <TabsList variant="line" className="w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="min-h-(--mobile-touch-target) md:min-h-0"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Row 2: Search + Filters + View Toggle + Price Switch */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, brand, or SKU..."
            value={query}
            onChange={(e) => updateParam("q", e.target.value || null)}
            className="h-9 pl-8"
            aria-label="Search garments"
          />
          {query && (
            <button
              type="button"
              onClick={() => updateParam("q", null)}
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Brand Select */}
        <Select
          value={brand || "all"}
          onValueChange={(v) => updateParam("brand", v === "all" ? null : v)}
        >
          <SelectTrigger
            className={cn(
              "h-9 w-full gap-1 rounded-md border-border/50 bg-transparent px-3 text-sm md:w-40",
              "min-h-(--mobile-touch-target) md:min-h-0",
              brand && "border-action/40 text-action",
            )}
            aria-label="Filter by brand"
          >
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Color Family Select */}
        <Select
          value={colorFamily || "all"}
          onValueChange={(v) =>
            updateParam("colorFamily", v === "all" ? null : v)
          }
        >
          <SelectTrigger
            className={cn(
              "h-9 w-full gap-1 rounded-md border-border/50 bg-transparent px-3 text-sm md:w-40",
              "min-h-(--mobile-touch-target) md:min-h-0",
              colorFamily && "border-action/40 text-action",
            )}
            aria-label="Filter by color family"
          >
            <SelectValue placeholder="Color Family" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {colorFamilies.map((cf) => (
              <SelectItem key={cf} value={cf}>
                {cf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Spacer (desktop only) */}
        <div className="hidden flex-1 md:block" />

        {/* View Toggle + Price Switch */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center rounded-md border border-border/50 p-0.5"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                "rounded-sm",
                view === "grid"
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground",
              )}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => updateParam("view", "grid")}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn(
                "rounded-sm",
                view === "table"
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground",
              )}
              aria-label="Table view"
              aria-pressed={view === "table"}
              onClick={() => updateParam("view", "table")}
            >
              <List className="size-3.5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border/50" />

          {/* Price Toggle */}
          <div className="flex items-center gap-1.5">
            <Switch
              id="price-toggle"
              size="sm"
              checked={showPrices}
              onCheckedChange={handlePriceToggle}
            />
            <Label
              htmlFor="price-toggle"
              className="cursor-pointer text-xs text-muted-foreground"
            >
              Prices
            </Label>
          </div>
        </div>
      </div>

      {/* Row 3: Active filter pills + result count */}
      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.length > 0 && (
          <>
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="outline"
                className="gap-1 pl-2 pr-1 text-xs"
              >
                {filter.label}
                <button
                  type="button"
                  onClick={() => updateParam(filter.key, null)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-foreground"
              onClick={clearAll}
            >
              Clear all
            </Button>
          </>
        )}

        {/* Result count */}
        <span
          className={cn(
            "text-xs text-muted-foreground",
            activeFilters.length > 0 && "ml-auto",
          )}
        >
          {garmentCount} {garmentCount === 1 ? "garment" : "garments"}
        </span>
      </div>
    </div>
  );
}
