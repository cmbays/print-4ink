"use client";

import { useMemo, useState } from "react";
import { Trash2, ChevronDown, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ColorSwatchPicker } from "@/components/features/ColorSwatchPicker";
import type { GarmentCatalog } from "@/lib/schemas/garment";
import type { Color } from "@/lib/schemas/color";

export interface LineItemData {
  garmentId: string;
  colorId: string;
  sizes: Record<string, number>;
  printLocations: string[];
  colorsPerLocation: number;
}

interface LineItemRowProps {
  index: number;
  data: LineItemData;
  onChange: (index: number, data: LineItemData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  garmentCatalog: GarmentCatalog[];
  colors: Color[];
  errors?: Record<string, string>;
}

const PRINT_LOCATIONS = [
  "Front",
  "Back",
  "Left Sleeve",
  "Right Sleeve",
  "Neck Label",
];

function calculateUnitPrice(
  garment: GarmentCatalog | undefined,
  colorsPerLocation: number,
  locationCount: number
): number {
  if (!garment) return 0;
  return garment.basePrice + colorsPerLocation * 0.5 + locationCount * 0.25;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function LineItemRow({
  index,
  data,
  onChange,
  onRemove,
  canRemove,
  garmentCatalog,
  colors,
  errors,
}: LineItemRowProps) {
  const [garmentOpen, setGarmentOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  const selectedGarment = garmentCatalog.find((g) => g.id === data.garmentId);
  const selectedColor = colors.find((c) => c.id === data.colorId);

  // Available sizes from selected garment, sorted by order
  const availableSizes = useMemo(() => {
    if (!selectedGarment) return [];
    return [...selectedGarment.availableSizes].sort(
      (a, b) => a.order - b.order
    );
  }, [selectedGarment]);

  // Filter colors to those available for this garment
  const availableColors = useMemo(() => {
    if (!selectedGarment) return colors;
    return colors.filter((c) =>
      selectedGarment.availableColors.includes(c.id)
    );
  }, [selectedGarment, colors]);

  const totalQty = useMemo(
    () => Object.values(data.sizes).reduce((sum, qty) => sum + qty, 0),
    [data.sizes]
  );

  const unitPrice = useMemo(
    () =>
      calculateUnitPrice(
        selectedGarment,
        data.colorsPerLocation,
        data.printLocations.length
      ),
    [selectedGarment, data.colorsPerLocation, data.printLocations.length]
  );

  const lineTotal = unitPrice * totalQty;

  function updateField(partial: Partial<LineItemData>) {
    onChange(index, { ...data, ...partial });
  }

  function handleGarmentSelect(garmentId: string) {
    const garment = garmentCatalog.find((g) => g.id === garmentId);
    // Reset sizes and color when garment changes
    const resetSizes: Record<string, number> = {};
    if (garment) {
      garment.availableSizes.forEach((s) => {
        resetSizes[s.name] = 0;
      });
    }
    // Clear color if not available for new garment
    const colorStillAvailable =
      garment && data.colorId
        ? garment.availableColors.includes(data.colorId)
        : false;
    updateField({
      garmentId,
      sizes: resetSizes,
      colorId: colorStillAvailable ? data.colorId : "",
    });
    setGarmentOpen(false);
  }

  function handleSizeChange(sizeName: string, value: string) {
    const qty = parseInt(value, 10);
    updateField({
      sizes: {
        ...data.sizes,
        [sizeName]: isNaN(qty) ? 0 : Math.max(0, qty),
      },
    });
  }

  function handleLocationToggle(location: string) {
    const next = data.printLocations.includes(location)
      ? data.printLocations.filter((l) => l !== location)
      : [...data.printLocations, location];
    updateField({ printLocations: next });
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Line Item {index + 1}
        </h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-8 px-2 text-muted-foreground hover:text-error"
            aria-label={`Remove line item ${index + 1}`}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Garment Selector */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Garment</Label>
          <Popover open={garmentOpen} onOpenChange={setGarmentOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={garmentOpen}
                aria-label="Select garment"
                className={cn(
                  "w-full justify-between",
                  errors?.garmentId && "border-error"
                )}
              >
                <span className="truncate">
                  {selectedGarment
                    ? `${selectedGarment.brand} ${selectedGarment.sku} — ${selectedGarment.name}`
                    : "Search garments..."}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command
                filter={(value, search) => {
                  const garment = garmentCatalog.find((g) => g.id === value);
                  if (!garment) return 0;
                  const haystack =
                    `${garment.brand} ${garment.sku} ${garment.name}`.toLowerCase();
                  return haystack.includes(search.toLowerCase()) ? 1 : 0;
                }}
              >
                <CommandInput placeholder="Search garments..." />
                <CommandList>
                  <CommandEmpty>No garments found.</CommandEmpty>
                  <CommandGroup>
                    {garmentCatalog.map((garment) => (
                      <CommandItem
                        key={garment.id}
                        value={garment.id}
                        onSelect={handleGarmentSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            data.garmentId === garment.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="truncate">
                          {garment.brand} {garment.sku}
                          <span className="text-muted-foreground">
                            {" "}
                            — {garment.name}
                          </span>
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatCurrency(garment.basePrice)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors?.garmentId && (
            <p className="text-xs text-error">{errors.garmentId}</p>
          )}
        </div>

        {/* Color Selector */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Color</Label>
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={colorOpen}
                aria-label="Select color"
                className={cn(
                  "w-full justify-start gap-2",
                  errors?.colorId && "border-error"
                )}
              >
                {selectedColor ? (
                  <>
                    <span
                      className="inline-block h-4 w-4 shrink-0 rounded-sm border border-border"
                      style={{ backgroundColor: selectedColor.hex }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{selectedColor.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select color...</span>
                )}
                <ChevronDown className="ml-auto size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <ColorSwatchPicker
                colors={availableColors}
                selectedColorId={data.colorId || undefined}
                onSelect={(colorId) => {
                  updateField({ colorId });
                  setColorOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          {errors?.colorId && (
            <p className="text-xs text-error">{errors.colorId}</p>
          )}
        </div>

        {/* Size Grid */}
        {availableSizes.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Sizes</Label>
              <span className="text-xs text-muted-foreground">
                Total Qty: <span className="font-medium text-foreground">{totalQty}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <div key={size.name} className="flex flex-col items-center gap-1">
                  <Label className="text-xs text-muted-foreground">
                    {size.name}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={data.sizes[size.name] || ""}
                    onChange={(e) => handleSizeChange(size.name, e.target.value)}
                    className="h-8 w-14 text-center text-sm"
                    placeholder="0"
                    aria-label={`${size.name} quantity`}
                  />
                </div>
              ))}
            </div>
            {errors?.sizes && (
              <p className="text-xs text-error">{errors.sizes}</p>
            )}
          </div>
        )}

        {/* Print Locations */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            Print Locations
          </Label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {PRINT_LOCATIONS.map((location) => (
              <label
                key={location}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <Checkbox
                  checked={data.printLocations.includes(location)}
                  onCheckedChange={() => handleLocationToggle(location)}
                  aria-label={location}
                />
                {location}
              </label>
            ))}
          </div>
        </div>

        {/* Colors per Location */}
        <div className="space-y-1.5">
          <Label
            htmlFor={`colors-per-loc-${index}`}
            className="text-sm text-muted-foreground"
          >
            Colors per Location
          </Label>
          <Input
            id={`colors-per-loc-${index}`}
            type="number"
            min={1}
            max={12}
            value={data.colorsPerLocation}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              updateField({
                colorsPerLocation: isNaN(val) ? 1 : Math.max(1, Math.min(12, val)),
              });
            }}
            className="h-8 w-20 text-center text-sm"
          />
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between rounded-md bg-surface px-3 py-2">
          <span className="text-sm text-muted-foreground">
            Unit Price:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(unitPrice)}
            </span>
          </span>
          <span className="text-sm font-semibold text-foreground">
            Line Total: {formatCurrency(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
