"use client";

import { ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DTF_SIZE_PRESETS } from "@/lib/dtf/dtf-constants";
import { dtfSizePresetEnum, type DtfLineItem, type DtfSizePreset } from "@domain/entities/dtf-line-item";

interface DtfLineItemRowProps {
  item: DtfLineItem;
  onUpdate: (id: string, field: keyof DtfLineItem, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

/** Map preset key to DTF_SIZE_PRESETS index */
const PRESET_MAP: Record<Exclude<DtfSizePreset, "custom">, (typeof DTF_SIZE_PRESETS)[number]> = {
  small: DTF_SIZE_PRESETS[0],
  medium: DTF_SIZE_PRESETS[1],
  large: DTF_SIZE_PRESETS[2],
};

export function DtfLineItemRow({ item, onUpdate, onRemove, canRemove }: DtfLineItemRowProps) {
  // N46 — resolveDimensions: when preset changes (not custom), auto-set width/height
  function handlePresetChange(value: string) {
    const parsed = dtfSizePresetEnum.safeParse(value);
    if (!parsed.success) return;
    const preset = parsed.data;
    onUpdate(item.id, "sizePreset", preset);
    if (preset !== "custom") {
      const config = PRESET_MAP[preset];
      onUpdate(item.id, "width", config.width);
      onUpdate(item.id, "height", config.height);
    }
  }

  return (
    <div className={cn(
      "rounded-lg border border-border bg-elevated p-3 space-y-3"
    )}>
      {/* Row 1: Artwork name + thumbnail placeholder + remove */}
      <div className="flex items-start gap-3">
        {/* U74 — Artwork thumbnail placeholder */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
          <ImageIcon size={16} className="text-muted-foreground/40" />
        </div>

        {/* U73 — Artwork name text input */}
        <div className="flex-1 min-w-0">
          <Input
            type="text"
            placeholder="Design name..."
            value={item.artworkName}
            onChange={(e) => onUpdate(item.id, "artworkName", e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* U80 — Remove button */}
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="size-8 shrink-0 text-muted-foreground hover:text-error"
            aria-label="Remove design"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {/* Row 2: Size preset, dimensions, quantity */}
      <div className="flex flex-wrap items-end gap-3">
        {/* U75 — Size preset dropdown */}
        <div className="space-y-1">
          <label htmlFor={`preset-${item.id}`} className="text-xs text-muted-foreground">Size Preset</label>
          <Select value={item.sizePreset} onValueChange={handlePresetChange}>
            <SelectTrigger id={`preset-${item.id}`} className="h-8 w-36 text-sm">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {DTF_SIZE_PRESETS.map((preset) => (
                <SelectItem
                  key={preset.shortLabel.toLowerCase()}
                  value={preset.shortLabel.toLowerCase()}
                >
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* U76, U77 — Custom width/height inputs (shown when sizePreset = "custom") */}
        {item.sizePreset === "custom" && (
          <>
            <div className="space-y-1">
              <label htmlFor={`width-${item.id}`} className="text-xs text-muted-foreground">Width (in)</label>
              <Input
                id={`width-${item.id}`}
                type="number"
                min={0.5}
                step={0.5}
                value={item.width}
                onChange={(e) => onUpdate(item.id, "width", parseFloat(e.target.value) || 0)}
                className="h-8 w-20 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`height-${item.id}`} className="text-xs text-muted-foreground">Height (in)</label>
              <Input
                id={`height-${item.id}`}
                type="number"
                min={0.5}
                step={0.5}
                value={item.height}
                onChange={(e) => onUpdate(item.id, "height", parseFloat(e.target.value) || 0)}
                className="h-8 w-20 text-sm"
              />
            </div>
          </>
        )}

        {/* U78 — Dimensions display (shown for custom preset only) */}
        {item.sizePreset === "custom" && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Dimensions</span>
            <p className="flex h-8 items-center text-sm text-foreground">
              {item.width}&quot; &times; {item.height}&quot;
            </p>
          </div>
        )}

        {/* U79 — Quantity input */}
        <div className="space-y-1">
          <label htmlFor={`qty-${item.id}`} className="text-xs text-muted-foreground">Qty</label>
          <Input
            id={`qty-${item.id}`}
            type="number"
            min={1}
            step={1}
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, "quantity", Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="h-8 w-16 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
