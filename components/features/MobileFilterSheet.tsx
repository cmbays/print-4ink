"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  sortOptions: FilterOption[];
  currentSort: string;
  onSortChange: (value: string) => void;
  filterGroups?: FilterGroup[];
  onApply: () => void;
  onReset: () => void;
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  title = "Sort & Filter",
  sortOptions,
  currentSort,
  onSortChange,
  filterGroups = [],
  onApply,
  onReset,
}: MobileFilterSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="flex flex-col gap-6 p-4">
        {/* Sort */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Sort by
          </h3>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSortChange(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  "min-h-(--mobile-touch-target)",
                  currentSort === opt.value
                    ? "border-action bg-action/10 text-action"
                    : "border-border text-muted-foreground hover:bg-surface"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter groups */}
        {filterGroups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {group.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isSelected = group.selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => group.onToggle(opt.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      "min-h-(--mobile-touch-target)",
                      isSelected
                        ? "border-action bg-action/10 text-action"
                        : "border-border text-muted-foreground hover:bg-surface"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={onReset}
            className="flex-1 min-h-(--mobile-touch-target)"
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
            className="flex-1 min-h-(--mobile-touch-target)"
          >
            Apply
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
