"use client";

import { useState } from "react";
import { ChevronRight, Globe, Plus, Minus, RotateCcw } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/primitives/collapsible";
import { cn } from "@shared/lib/cn";
import { getColorsMutable } from "@infra/repositories/colors";
import type { InheritanceChain } from "@domain/rules/customer.rules";

const catalogColors = getColorsMutable();

type InheritanceDetailProps = {
  chain: InheritanceChain;
  onRestore?: (colorId: string) => void;
};

function getColorName(colorId: string): string {
  return catalogColors.find((c) => c.id === colorId)?.name ?? colorId;
}

function ColorChip({ colorId }: { colorId: string }) {
  const color = catalogColors.find((c) => c.id === colorId);
  if (!color) return <span className="text-xs text-muted-foreground">{colorId}</span>;

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{ backgroundColor: color.hex }}
        aria-hidden="true"
      />
      <span className="text-xs text-foreground">{color.name}</span>
    </span>
  );
}

export function InheritanceDetail({
  chain,
  onRestore,
}: InheritanceDetailProps) {
  const [open, setOpen] = useState(false);

  const hasChanges =
    chain.addedAtLevel.length > 0 || chain.removedAtLevel.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-muted-foreground transition-colors",
          "min-h-(--mobile-touch-target) md:min-h-0",
          "hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <ChevronRight
          size={14}
          className={cn(
            "transition-transform motion-reduce:transition-none",
            open && "rotate-90"
          )}
          aria-hidden="true"
        />
        View color settings details
        {hasChanges && (
          <span className="ml-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium">
            {chain.addedAtLevel.length + chain.removedAtLevel.length} changes
          </span>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-3 rounded-md border border-border bg-elevated p-3">
          {/* Global defaults */}
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Globe size={12} aria-hidden="true" />
              Global Defaults ({chain.globalDefaults.length})
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {chain.globalDefaults.map((id) => (
                <ColorChip key={id} colorId={id} />
              ))}
            </div>
          </div>

          {/* Added at this level */}
          {chain.addedAtLevel.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-success">
                <Plus size={12} aria-hidden="true" />
                Added at this level ({chain.addedAtLevel.length})
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {chain.addedAtLevel.map((id) => (
                  <ColorChip key={id} colorId={id} />
                ))}
              </div>
            </div>
          )}

          {/* Removed at this level */}
          {chain.removedAtLevel.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-error">
                <Minus size={12} aria-hidden="true" />
                Removed at this level ({chain.removedAtLevel.length})
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {chain.removedAtLevel.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1">
                    <ColorChip colorId={id} />
                    {onRestore && (
                      <button
                        type="button"
                        onClick={() => onRestore(id)}
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-[10px] text-action transition-colors",
                          "min-h-(--mobile-touch-target) md:min-h-0",
                          "hover:bg-surface",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        aria-label={`Restore ${getColorName(id)}`}
                      >
                        <RotateCcw size={10} aria-hidden="true" />
                        Restore
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!hasChanges && (
            <p className="text-xs text-muted-foreground">
              Using global defaults — no changes at this level.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
