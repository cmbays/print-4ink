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
  FlaskConical,
  GitCompareArrows,
  Undo2,
  X,
  Zap,
  LayoutGrid,
  Settings2,
} from "lucide-react";
import { allScreenPrintTemplates } from "@/lib/mock-data-pricing";
import { calculateTemplateHealth, getColorUpcharge } from "@/lib/pricing-engine";
import { cn } from "@/lib/utils";
import type {
  PricingTemplate,
  CostConfig,
  EditorMode,
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
import { ComparisonView } from "../../_components/ComparisonView";
import { PowerModeGrid } from "../../_components/PowerModeGrid";
import { CostConfigSheet } from "../../_components/CostConfigSheet";

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

  // Sandbox mode state
  const [sandboxSnapshot, setSandboxSnapshot] = useState<PricingTemplate | null>(null);
  const isSandboxMode = sandboxSnapshot !== null;
  const [showComparison, setShowComparison] = useState(false);

  // Editor mode state (Simple vs Power)
  const [editorMode, setEditorMode] = useState<EditorMode>("simple");

  // Cost config sheet state
  const [showCostSheet, setShowCostSheet] = useState(false);

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

  const updateCostConfig = (config: CostConfig) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, costConfig: config };
    });
    setIsEditing(true);
    toast.success("Cost configuration updated", {
      description: "Margin indicators have been recalculated.",
    });
  };

  // Power mode cell edit: reverse-calculate base price from new price
  const handlePowerCellEdit = (tierIndex: number, colorCount: number, newPrice: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const colorUpcharge = getColorUpcharge(prev.matrix, colorCount);
      const newBasePrice = Math.max(0, Math.round((newPrice - colorUpcharge) * 100) / 100);
      const basePriceByTier = [...prev.matrix.basePriceByTier];
      basePriceByTier[tierIndex] = newBasePrice;
      return {
        ...prev,
        matrix: { ...prev.matrix, basePriceByTier },
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

  // Sandbox actions
  const enterSandbox = () => {
    setSandboxSnapshot(deepCopy(template));
    toast.info("Sandbox mode enabled", {
      description: "Changes won't affect live pricing until you save.",
    });
  };

  const exitSandbox = () => {
    setSandboxSnapshot(null);
    setShowComparison(false);
  };

  const discardSandboxChanges = () => {
    if (sandboxSnapshot) {
      setTemplate(deepCopy(sandboxSnapshot));
      setIsEditing(false);
    }
    exitSandbox();
    toast.info("Changes discarded", {
      description: "Template restored to original state.",
    });
  };

  const saveSandboxChanges = () => {
    exitSandbox();
    setIsEditing(false);
    setTemplate((prev) =>
      prev ? { ...prev, updatedAt: new Date().toISOString() } : prev
    );
    toast.success("Sandbox changes applied", {
      description: `"${template.name}" has been updated with your changes.`,
    });
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
          {!isSandboxMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={enterSandbox}
              className="text-warning hover:text-warning"
            >
              <FlaskConical className="size-3.5" />
              Sandbox
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(true)}
              >
                <GitCompareArrows className="size-3.5" />
                Compare
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={discardSandboxChanges}
                className="text-error hover:text-error"
              >
                <Undo2 className="size-3.5" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={saveSandboxChanges}
              >
                <Save className="size-3.5" />
                Save Changes
              </Button>
            </>
          )}

          {!isSandboxMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCostSheet(true)}
              >
                <Settings2 className="size-3.5" />
                Edit Costs
              </Button>
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
            </>
          )}
        </div>
      </div>

      {/* Sandbox mode banner */}
      {isSandboxMode && (
        <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 p-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-warning" />
            <span className="text-sm font-medium text-warning">
              Sandbox Mode
            </span>
            <span className="text-sm text-warning/80">
              &mdash; Changes won&apos;t affect live pricing until saved
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={discardSandboxChanges}
            className="h-7 text-warning/70 hover:text-warning hover:bg-warning/10"
          >
            <X className="size-3.5" />
            Exit
          </Button>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 self-start">
        <Button
          variant={editorMode === "simple" ? "default" : "ghost"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setEditorMode("simple")}
        >
          <LayoutGrid className="size-3.5" />
          Simple
        </Button>
        <Button
          variant={editorMode === "power" ? "default" : "ghost"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setEditorMode("power")}
        >
          <Zap className="size-3.5" />
          Power
        </Button>
      </div>

      {/* Pricing Matrix Grid — mode-dependent */}
      {editorMode === "simple" ? (
        <ColorPricingGrid
          template={template}
          colorHitRate={colorHitRate}
          onColorHitRateChange={updateColorHitRate}
        />
      ) : (
        <PowerModeGrid
          template={template}
          garmentBaseCost={DEFAULT_GARMENT_COST}
          onCellEdit={handlePowerCellEdit}
        />
      )}

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

      {/* Comparison view modal (sandbox mode) */}
      {sandboxSnapshot && (
        <ComparisonView
          original={sandboxSnapshot}
          proposed={template}
          onApply={saveSandboxChanges}
          onKeepEditing={() => setShowComparison(false)}
          onDiscardAll={discardSandboxChanges}
          open={showComparison}
          onOpenChange={setShowComparison}
        />
      )}

      {/* Cost configuration sheet */}
      <CostConfigSheet
        open={showCostSheet}
        onOpenChange={setShowCostSheet}
        costConfig={template.costConfig}
        template={template}
        onSave={updateCostConfig}
      />
    </div>
  );
}
