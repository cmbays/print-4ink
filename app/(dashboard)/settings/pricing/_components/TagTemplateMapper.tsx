"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Save, X } from "lucide-react";
import { toast } from "sonner";
import { customerTypeTagEnum } from "@/lib/schemas/customer";
import type { TagTemplateMapping } from "@/lib/schemas/tag-template-mapping";
import type { PricingTemplate } from "@/lib/schemas/price-matrix";
import type { DTFPricingTemplate } from "@/lib/schemas/dtf-pricing";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_TAGS = customerTypeTagEnum.options;

const TAG_DISPLAY: Record<string, { label: string; color: string }> = {
  retail: { label: "Retail", color: "bg-action/15 text-action" },
  "sports-school": {
    label: "Sports / School",
    color: "bg-success/15 text-success",
  },
  corporate: { label: "Corporate", color: "bg-muted/50 text-foreground" },
  "storefront-merch": {
    label: "Storefront Merch",
    color: "bg-warning/15 text-warning",
  },
  wholesale: { label: "Wholesale", color: "bg-muted/80 text-foreground" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TagTemplateMapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spTemplates: PricingTemplate[];
  dtfTemplates: DTFPricingTemplate[];
  mappings: TagTemplateMapping[];
  onSave: (mappings: TagTemplateMapping[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TagTemplateMapper({
  open,
  onOpenChange,
  spTemplates,
  dtfTemplates,
  mappings,
  onSave,
}: TagTemplateMapperProps) {
  // Draft state — clone on open, only persist on Save
  const [draft, setDraft] = useState<TagTemplateMapping[]>([]);

  // Initialize draft when sheet opens.
  // Radix controlled mode does NOT fire onOpenChange when the `open` prop
  // transitions externally, so we must use useEffect to detect open → true.
  useEffect(() => {
    if (open) {
      const draftMappings = ALL_TAGS.map((tag) => {
        const existing = mappings.find((m) => m.customerTypeTag === tag);
        return (
          existing ?? {
            customerTypeTag: tag,
            screenPrintTemplateId: null,
            dtfTemplateId: null,
          }
        );
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Radix controlled mode workaround
      setDraft(draftMappings);
    } else {
      setDraft([]);
    }
  }, [open, mappings]);

  const initialized = open && draft.length > 0;

  const updateMapping = useCallback(
    (
      tag: string,
      field: "screenPrintTemplateId" | "dtfTemplateId",
      value: string | null
    ) => {
      setDraft((prev) =>
        prev.map((m) =>
          m.customerTypeTag === tag ? { ...m, [field]: value } : m
        )
      );
    },
    []
  );

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
    toast.success("Tag mappings saved");
  };

  const handleCancel = () => {
    onOpenChange(false);
    toast("Mapping changes discarded");
  };

  const unmappedCount = useMemo(
    () =>
      draft.filter(
        (m) => m.screenPrintTemplateId === null || m.dtfTemplateId === null
      ).length,
    [draft]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tag → Template Mappings</SheetTitle>
          <SheetDescription>
            Assign pricing templates per customer type. When quoting a customer,
            their tag determines which template is auto-applied.
          </SheetDescription>
        </SheetHeader>

        {initialized && (
          <div className="mt-6 space-y-4">
            {/* Unmapped warning */}
            {unmappedCount > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  {unmappedCount} tag{unmappedCount !== 1 ? "s" : ""} missing
                  template assignment
                </span>
              </div>
            )}

            {/* Mapping rows */}
            <div className="space-y-3">
              {draft.map((mapping) => {
                const display = TAG_DISPLAY[mapping.customerTypeTag] ?? {
                  label: mapping.customerTypeTag,
                  color: "bg-muted text-muted-foreground",
                };
                const isMissingSP = mapping.screenPrintTemplateId === null;
                const isMissingDTF = mapping.dtfTemplateId === null;

                return (
                  <div
                    key={mapping.customerTypeTag}
                    className="rounded-lg border border-border bg-surface p-3 space-y-2.5"
                  >
                    {/* Tag badge */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="ghost"
                        className={display.color}
                      >
                        {display.label}
                      </Badge>
                      {(isMissingSP || isMissingDTF) && (
                        <AlertTriangle className="size-3.5 text-warning" />
                      )}
                    </div>

                    {/* Template selects */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Screen Print */}
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Screen Print
                        </label>
                        <Select
                          value={mapping.screenPrintTemplateId ?? "__none"}
                          onValueChange={(v) =>
                            updateMapping(
                              mapping.customerTypeTag,
                              "screenPrintTemplateId",
                              v === "__none" ? null : v
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">
                              <span className="text-muted-foreground">
                                None (use default)
                              </span>
                            </SelectItem>
                            {spTemplates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* DTF */}
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          DTF
                        </label>
                        <Select
                          value={mapping.dtfTemplateId ?? "__none"}
                          onValueChange={(v) =>
                            updateMapping(
                              mapping.customerTypeTag,
                              "dtfTemplateId",
                              v === "__none" ? null : v
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">
                              <span className="text-muted-foreground">
                                None (use default)
                              </span>
                            </SelectItem>
                            {dtfTemplates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <SheetFooter className="mt-6 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="size-4" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="size-4" />
            Save Mappings
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
