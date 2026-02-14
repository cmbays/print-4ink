"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ExternalLink, Palette, Ruler } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GarmentImage } from "@/components/features/GarmentImage";
import { FavoriteStar } from "@/components/features/FavoriteStar";
import { ColorSwatchPicker } from "@/components/features/ColorSwatchPicker";
import { cn } from "@/lib/utils";
import { money, toNumber, formatCurrency } from "@/lib/helpers/money";
import { getColorById } from "@/lib/helpers/garment-helpers";
import { colors as catalogColors } from "@/lib/mock-data";
import type { GarmentCatalog } from "@/lib/schemas/garment";
import type { Color } from "@/lib/schemas/color";

interface GarmentDetailDrawerProps {
  garment: GarmentCatalog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPrice: boolean;
  linkedJobs: Array<{ id: string; jobNumber: string; customerName: string }>;
  onToggleEnabled: (garmentId: string) => void;
  onToggleFavorite: (garmentId: string) => void;
}

export function GarmentDetailDrawer({
  garment,
  open,
  onOpenChange,
  showPrice,
  linkedJobs,
  onToggleEnabled,
  onToggleFavorite,
}: GarmentDetailDrawerProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    garment.availableColors[0] ?? null,
  );

  // Resolve Color objects from garment's available color IDs
  const garmentColors = useMemo(
    () =>
      garment.availableColors
        .map((id) => catalogColors.find((c) => c.id === id))
        .filter((c): c is Color => c != null),
    [garment.availableColors],
  );

  // Resolve selected color object
  const selectedColor = selectedColorId
    ? getColorById(selectedColorId)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full md:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-base">
            {garment.brand} {garment.sku}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Detail view for {garment.name}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 p-4">
            {/* Garment image */}
            <div className="flex justify-center py-2">
              <GarmentImage
                brand={garment.brand}
                sku={garment.sku}
                name={garment.name}
                size="lg"
              />
            </div>

            {/* Name + Category + Enabled toggle */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  {garment.name}
                </p>
                <Badge
                  variant="outline"
                  className="text-xs capitalize w-fit"
                >
                  {garment.baseCategory}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="garment-enabled-toggle"
                  className="text-xs text-muted-foreground"
                >
                  {garment.isEnabled ? "Enabled" : "Disabled"}
                </label>
                <Switch
                  id="garment-enabled-toggle"
                  size="sm"
                  checked={garment.isEnabled}
                  onCheckedChange={() => onToggleEnabled(garment.id)}
                />
              </div>
            </div>

            {/* Base price + Favorite */}
            <div className="flex items-center justify-between">
              {showPrice ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">
                    Base Price
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(garment.basePrice)}
                  </span>
                </div>
              ) : (
                <div />
              )}
              <FavoriteStar
                isFavorite={garment.isFavorite}
                onToggle={() => onToggleFavorite(garment.id)}
                size={20}
              />
            </div>

            {/* Colors section */}
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Palette size={14} aria-hidden="true" />
                Colors
                <span className="text-muted-foreground/60">
                  ({garmentColors.length})
                </span>
              </h3>
              <ColorSwatchPicker
                colors={garmentColors}
                selectedColorId={selectedColorId ?? undefined}
                onSelect={setSelectedColorId}
              />
              {/* Selected color display */}
              {selectedColor && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <div
                    className="h-5 w-5 flex-shrink-0 rounded-sm border border-border"
                    style={{ backgroundColor: selectedColor.hex }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-foreground">
                    {selectedColor.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedColor.hex}
                  </span>
                </div>
              )}
            </div>

            {/* Size & Pricing table */}
            {showPrice && garment.availableSizes.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Ruler size={14} aria-hidden="true" />
                  Size &amp; Pricing
                </h3>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          Size
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          Adjustment
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          Final Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...garment.availableSizes]
                        .sort((a, b) => a.order - b.order)
                        .map((size) => {
                          const finalPrice = money(garment.basePrice).plus(
                            size.priceAdjustment,
                          );
                          return (
                            <tr
                              key={size.name}
                              className="border-b border-border last:border-b-0"
                            >
                              <td className="px-3 py-2 font-medium text-foreground">
                                {size.name}
                              </td>
                              <td className="px-3 py-2 text-right text-muted-foreground">
                                {size.priceAdjustment !== 0
                                  ? `+${formatCurrency(size.priceAdjustment)}`
                                  : "\u2014"}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">
                                {formatCurrency(toNumber(finalPrice))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Linked Jobs */}
            {linkedJobs.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <ExternalLink size={14} aria-hidden="true" />
                  Linked Jobs
                  <span className="text-muted-foreground/60">
                    ({linkedJobs.length})
                  </span>
                </h3>
                <div className="flex flex-col gap-1">
                  {linkedJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className={cn(
                        "flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2",
                        "text-sm text-foreground transition-colors hover:bg-elevated",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "motion-reduce:transition-none",
                      )}
                    >
                      <span className="font-medium text-action">
                        {job.jobNumber}
                      </span>
                      <span className="text-muted-foreground">
                        {job.customerName}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
