"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Copy,
  Trash2,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { allScreenPrintTemplates } from "@/lib/mock-data-pricing";
import { calculateTemplateHealth } from "@/lib/pricing-engine";
import { cn } from "@/lib/utils";
import type {
  PricingTemplate,
  QuantityTier,
  LocationUpcharge,
  GarmentTypePricing,
  SetupFeeConfig,
  ColorPricing,
  MarginIndicator,
} from "@/lib/schemas/price-matrix";

import { ColorPricingGrid } from "../../_components/ColorPricingGrid";
import { QuantityTierEditor } from "../../_components/QuantityTierEditor";
import { LocationUpchargeEditor } from "../../_components/LocationUpchargeEditor";
import { GarmentTypePricingEditor } from "../../_components/GarmentTypePricingEditor";
import { SetupFeeEditor } from "../../_components/SetupFeeEditor";

const DEFAULT_GARMENT_COST = 3.5;

const healthLabels: Record<MarginIndicator, string> = {
  healthy: "Healthy",
  caution: "Caution",
  unprofitable: "Unprofitable",
};

const healthColors: Record<MarginIndicator, string> = {
  healthy: "bg-success/15 text-success border-success/30",
  caution: "bg-warning/15 text-warning border-warning/30",
  unprofitable: "bg-error/15 text-error border-error/30",
};

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

interface ScreenPrintEditorProps {
  templateId: string;
}

export function ScreenPrintEditor({ templateId }: ScreenPrintEditorProps) {
  const router = useRouter();

  // Find source template
  const sourceTemplate = allScreenPrintTemplates.find(
    (t) => t.id === templateId
  );

  // Editor state
  const [template, setTemplate] = useState<PricingTemplate | null>(() =>
    sourceTemplate ? deepCopy(sourceTemplate) : null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Template not found
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <AlertTriangle className="size-8 text-warning" />
        <p className="text-lg font-semibold">Template Not Found</p>
        <p className="text-sm text-muted-foreground">
          No template with ID &ldquo;{templateId}&rdquo; exists.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/pricing">
            <ArrowLeft className="size-4" />
            Back to Pricing
          </Link>
        </Button>
      </div>
    );
  }

  // Derive color hit rate from the template (rate of color 2+)
  const colorHitRate =
    template.matrix.colorPricing.find((c) => c.colors === 2)?.ratePerHit ?? 1.5;

  // Template health
  const health = calculateTemplateHealth(template, DEFAULT_GARMENT_COST);

  // Update helpers
  const updateName = (name: string) => {
    setTemplate((prev) => (prev ? { ...prev, name } : prev));
    setIsEditing(true);
  };

  const updateColorHitRate = (rate: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const colorPricing: ColorPricing[] = prev.matrix.colorPricing.map((c) => ({
        ...c,
        ratePerHit: c.colors === 1 ? 0 : rate,
      }));
      return {
        ...prev,
        matrix: { ...prev.matrix, colorPricing },
      };
    });
    setIsEditing(true);
  };

  const updateTiers = (tiers: QuantityTier[], basePrices: number[]) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matrix: {
          ...prev.matrix,
          quantityTiers: tiers,
          basePriceByTier: basePrices,
        },
      };
    });
    setIsEditing(true);
  };

  const updateLocations = (locations: LocationUpcharge[]) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matrix: { ...prev.matrix, locationUpcharges: locations },
      };
    });
    setIsEditing(true);
  };

  const updateGarmentTypes = (garmentTypes: GarmentTypePricing[]) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matrix: { ...prev.matrix, garmentTypePricing: garmentTypes },
      };
    });
    setIsEditing(true);
  };

  const updateSetupFees = (config: SetupFeeConfig) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matrix: { ...prev.matrix, setupFeeConfig: config },
      };
    });
    setIsEditing(true);
  };

  // Actions
  const handleSave = () => {
    setTemplate((prev) =>
      prev ? { ...prev, updatedAt: new Date().toISOString() } : prev
    );
    setIsEditing(false);
    toast.success("Template saved", {
      description: `"${template.name}" has been updated.`,
    });
  };

  const handleDuplicate = () => {
    toast.success("Template duplicated", {
      description: `"${template.name} (Copy)" created. Redirecting...`,
    });
    // In Phase 1, just show a toast — the hub page manages the list
    setTimeout(() => router.push("/settings/pricing"), 1000);
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    toast.success("Template deleted", {
      description: `"${template.name}" has been removed.`,
    });
    setTimeout(() => router.push("/settings/pricing"), 500);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          {/* Template name — inline editable */}
          <div className="flex items-center gap-3">
            <Input
              value={template.name}
              onChange={(e) => updateName(e.target.value)}
              className="h-auto border-none bg-transparent p-0 text-lg font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Template name"
            />
            {isEditing && (
              <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                Unsaved
              </Badge>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Printer className="size-3" />
              Screen Print
            </Badge>
            <Badge variant="secondary" className="text-[10px] capitalize">
              {template.pricingTier}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-[10px]", healthColors[health])}
            >
              {healthLabels[health]}
            </Badge>
            {template.isDefault && (
              <Badge variant="secondary" className="text-[10px]">
                Default
              </Badge>
            )}
            {template.isIndustryDefault && (
              <Badge variant="secondary" className="text-[10px]">
                Industry Default
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
          >
            <Copy className="size-3.5" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-error hover:text-error"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isEditing}
          >
            <Save className="size-3.5" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Pricing Matrix Grid */}
      <ColorPricingGrid
        template={template}
        colorHitRate={colorHitRate}
        onColorHitRateChange={updateColorHitRate}
      />

      {/* Two-column layout for smaller editors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quantity Tiers */}
        <QuantityTierEditor
          tiers={template.matrix.quantityTiers}
          basePrices={template.matrix.basePriceByTier}
          onTiersChange={updateTiers}
        />

        {/* Location Upcharges */}
        <LocationUpchargeEditor
          locations={template.matrix.locationUpcharges}
          onLocationsChange={updateLocations}
        />

        {/* Garment Type Markup */}
        <GarmentTypePricingEditor
          garmentTypes={template.matrix.garmentTypePricing}
          onGarmentTypesChange={updateGarmentTypes}
        />

        {/* Setup Fees */}
        <SetupFeeEditor
          config={template.matrix.setupFeeConfig}
          onConfigChange={updateSetupFees}
        />
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{template.name}&rdquo;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
