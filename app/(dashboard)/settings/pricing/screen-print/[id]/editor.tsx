"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WithTooltip } from "@/components/ui/with-tooltip";
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
  Grid3x3,
  Minus,
  Plus,
  Receipt,
  Layers,
  Shirt,
  MapPin,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { allScreenPrintTemplates } from "@/lib/mock-data-pricing";
import { calculateTemplateHealth } from "@/lib/pricing-engine";
import { cn } from "@/lib/utils";
import { MarginLegend } from "@/components/features/MarginLegend";
import { BottomActionBar } from "@/components/layout/bottom-action-bar";
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

import type { GarmentCategory } from "@/lib/schemas/garment";

import { ColorPricingGrid } from "../../_components/ColorPricingGrid";
import { QuantityTierEditor, validateTiers } from "../../_components/QuantityTierEditor";
import { LocationUpchargeEditor } from "../../_components/LocationUpchargeEditor";
import { GarmentTypePricingEditor } from "../../_components/GarmentTypePricingEditor";
import { ComparisonView } from "../../_components/ComparisonView";
import { PowerModeGrid } from "../../_components/PowerModeGrid";
import { CostConfigSheet } from "../../_components/CostConfigSheet";
import { MatrixPreviewSelector } from "../../_components/MatrixPreviewSelector";
import { MobileToolsSheet } from "../../_components/MobileToolsSheet";

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

  const sourceTemplate = allScreenPrintTemplates.find(
    (t) => t.id === templateId
  );

  // ── State ─────────────────────────────────────────────────────────
  const [template, setTemplate] = useState<PricingTemplate | null>(() =>
    sourceTemplate ? deepCopy(sourceTemplate) : null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Sandbox
  const [sandboxSnapshot, setSandboxSnapshot] = useState<PricingTemplate | null>(null);
  const isSandboxMode = sandboxSnapshot !== null;
  const [showComparison, setShowComparison] = useState(false);

  // Editor mode (Simple vs Custom)
  const [editorMode, setEditorMode] = useState<EditorMode>("simple");

  // Manual edit (Custom mode) — owned here, passed to PowerModeGrid
  const [isManualEditOn, setIsManualEditOn] = useState(false);
  const toggleManualEdit = useCallback(() => setIsManualEditOn((p) => !p), []);

  // Cost config sheet
  const [showCostSheet, setShowCostSheet] = useState(false);

  // Mobile tools sheet
  const [showToolsSheet, setShowToolsSheet] = useState(false);

  // Matrix preview selectors (#134)
  const [previewGarment, setPreviewGarment] = useState<GarmentCategory | undefined>(undefined);
  const [previewLocations, setPreviewLocations] = useState<string[]>(["front"]);

  // Simple mode ignores price overrides — always shows formula-computed prices.
  // Custom mode shows the actual overrides the user set.
  // Must be above the early-return guard to satisfy Rules of Hooks.
  const simpleTemplate = useMemo<PricingTemplate | null>(
    () => template ? { ...template, matrix: { ...template.matrix, priceOverrides: {} } } : null,
    [template]
  );

  // ── Template not found ────────────────────────────────────────────
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center" role="alert">
        <AlertTriangle className="size-12 text-muted-foreground/50" />
        <p className="text-lg font-semibold tracking-tight">Template Not Found</p>
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

  // ── Derived values ────────────────────────────────────────────────
  const colorHitRate =
    template.matrix.colorPricing[0]?.ratePerHit ?? 1.5;
  const health = calculateTemplateHealth(template, DEFAULT_GARMENT_COST);
  const maxColors = template.matrix.maxColors ?? 8;
  const fees = template.matrix.setupFeeConfig;
  const tierValidation = validateTiers(template.matrix.quantityTiers);

  // ── Update helpers ────────────────────────────────────────────────

  const updateName = (name: string) => {
    setTemplate((prev) => (prev ? { ...prev, name } : prev));
    setIsEditing(true);
  };

  const updateColorHitRate = (rate: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      // Apply the same rate to ALL color counts (including 1-color).
      // Total color cost = ratePerHit × colorCount, so 1 color = rate × 1.
      const colorPricing: ColorPricing[] = prev.matrix.colorPricing.map((c) => ({
        ...c,
        ratePerHit: rate,
      }));
      return { ...prev, matrix: { ...prev.matrix, colorPricing } };
    });
    setIsEditing(true);
  };

  const updateTiers = (tiers: QuantityTier[], basePrices: number[]) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matrix: { ...prev.matrix, quantityTiers: tiers, basePriceByTier: basePrices },
      };
    });
    setIsEditing(true);
  };

  const updateLocations = (locations: LocationUpcharge[]) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, matrix: { ...prev.matrix, locationUpcharges: locations } };
    });
    setIsEditing(true);
  };

  const updateGarmentTypes = (garmentTypes: GarmentTypePricing[]) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, matrix: { ...prev.matrix, garmentTypePricing: garmentTypes } };
    });
    setIsEditing(true);
  };

  const updateSetupFees = (field: keyof SetupFeeConfig, value: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        matrix: {
          ...prev.matrix,
          setupFeeConfig: { ...prev.matrix.setupFeeConfig, [field]: value },
        },
      };
    });
    setIsEditing(true);
  };

  const updateMaxColors = (newMax: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, matrix: { ...prev.matrix, maxColors: newMax } };
    });
    setIsEditing(true);
  };

  const updateCostConfig = (config: CostConfig) => {
    setTemplate((prev) => (prev ? { ...prev, costConfig: config } : prev));
    setIsEditing(true);
    toast.success("Cost configuration updated", {
      description: "Margin indicators have been recalculated.",
    });
  };

  const handlePowerCellEdit = (tierIndex: number, colIndex: number, newPrice: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const overrides = { ...(prev.matrix.priceOverrides ?? {}) };
      overrides[`${tierIndex}-${colIndex}`] = newPrice;
      return { ...prev, matrix: { ...prev.matrix, priceOverrides: overrides } };
    });
    setIsEditing(true);
  };

  const handlePowerBulkEdit = (cells: Array<{ row: number; col: number }>, value: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const overrides = { ...(prev.matrix.priceOverrides ?? {}) };
      for (const { row, col } of cells) {
        overrides[`${row}-${col}`] = value;
      }
      return { ...prev, matrix: { ...prev.matrix, priceOverrides: overrides } };
    });
    setIsEditing(true);
  };

  // ── Actions ───────────────────────────────────────────────────────

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
    setTimeout(() => router.push("/settings/pricing"), 1000);
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    toast.success("Template deleted", {
      description: `"${template.name}" has been removed.`,
    });
    setTimeout(() => router.push("/settings/pricing"), 500);
  };

  // Sandbox
  const enterSandbox = () => {
    setSandboxSnapshot(deepCopy(template));
    toast.info("Sandbox mode enabled", {
      description: "Changes won't affect live pricing until you save.",
    });
  };
  const exitSandbox = () => { setSandboxSnapshot(null); setShowComparison(false); };
  const discardSandboxChanges = () => {
    if (sandboxSnapshot) { setTemplate(deepCopy(sandboxSnapshot)); setIsEditing(false); }
    exitSandbox();
    toast.info("Changes discarded", { description: "Template restored to original state." });
  };
  const saveSandboxChanges = () => {
    exitSandbox();
    setIsEditing(false);
    setTemplate((prev) => prev ? { ...prev, updatedAt: new Date().toISOString() } : prev);
    toast.success("Sandbox changes applied", {
      description: `"${template.name}" has been updated with your changes.`,
    });
  };

  // Turn off manual edit when switching to Simple mode
  const switchMode = (mode: EditorMode) => {
    if (mode === "simple" && isManualEditOn) setIsManualEditOn(false);
    setEditorMode(mode);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ══════════════════════════════════════════════════════════════
          STICKY HEADER — name, badges, action buttons
         ══════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 md:px-6">
        {/* Row: identity + buttons */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Printer icon (blue, no text) */}
          <Printer className="size-5 text-action shrink-0" />

          {/* Template name */}
          <Input
            value={template.name}
            onChange={(e) => updateName(e.target.value)}
            className="h-auto w-auto min-w-[180px] max-w-[320px] border-none bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Template name"
          />

          {/* Badges */}
          <Badge variant="secondary" className="text-[10px] capitalize">
            {template.pricingTier}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", healthColors[health])}>
            {healthLabels[health]}
          </Badge>
          {isEditing && (
            <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
              Unsaved
            </Badge>
          )}
          {template.isDefault && (
            <Badge variant="secondary" className="text-[10px]">Default</Badge>
          )}
          {template.isIndustryDefault && (
            <Badge variant="secondary" className="text-[10px]">Industry</Badge>
          )}

          <div className="flex-1" />

          {/* ── Action buttons ─────────────────────────────────────── */}
          <TooltipProvider skipDelayDuration={300}>
          {!isSandboxMode ? (
            <div className="hidden md:flex flex-wrap items-center gap-1.5">
              {/* Qty Tiers popover */}
              <Popover>
                <WithTooltip tooltip={tierValidation.hasErrors
                  ? "Quantity tiers have configuration issues"
                  : "Configure quantity breakpoints and base pricing"
                }>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 text-xs",
                        tierValidation.hasErrors && "border-error text-error hover:text-error",
                      )}
                    >
                      {tierValidation.hasErrors && <AlertTriangle className="size-3" />}
                      <Layers className="size-3.5" />
                      <span className="hidden md:inline">Qty Tiers</span>
                    </Button>
                  </PopoverTrigger>
                </WithTooltip>
                <PopoverContent className="w-[460px]" align="end">
                  <QuantityTierEditor
                    tiers={template.matrix.quantityTiers}
                    basePrices={template.matrix.basePriceByTier}
                    onTiersChange={updateTiers}
                  />
                </PopoverContent>
              </Popover>

              {/* Garment Markup popover */}
              <Popover>
                <WithTooltip tooltip="Set markup percentages by garment category">
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Shirt className="size-3.5" />
                      <span className="hidden md:inline">Garments</span>
                    </Button>
                  </PopoverTrigger>
                </WithTooltip>
                <PopoverContent className="w-72" align="end">
                  <GarmentTypePricingEditor
                    garmentTypes={template.matrix.garmentTypePricing}
                    onGarmentTypesChange={updateGarmentTypes}
                  />
                </PopoverContent>
              </Popover>

              {/* Location Upcharges popover */}
              <Popover>
                <WithTooltip tooltip="Adjust per-piece upcharges by print location">
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <MapPin className="size-3.5" />
                      <span className="hidden md:inline">Locations</span>
                    </Button>
                  </PopoverTrigger>
                </WithTooltip>
                <PopoverContent className="w-72" align="end">
                  <LocationUpchargeEditor
                    locations={template.matrix.locationUpcharges}
                    onLocationsChange={updateLocations}
                  />
                </PopoverContent>
              </Popover>

              {/* Setup Fees popover */}
              <Popover>
                <WithTooltip tooltip="Configure screen fees and reorder discounts">
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Receipt className="size-3.5" />
                      <span className="hidden md:inline">Setup Fees</span>
                    </Button>
                  </PopoverTrigger>
                </WithTooltip>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-foreground">Setup Fees</p>
                    <div className="space-y-1">
                      <Label htmlFor="sf-per-screen" className="text-xs">Per-screen fee</Label>
                      <div className="relative w-full">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <Input
                          id="sf-per-screen"
                          type="number"
                          step={1}
                          min={0}
                          value={fees.perScreenFee}
                          onChange={(e) => updateSetupFees("perScreenFee", parseFloat(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="h-7 pl-5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sf-bulk-waiver" className="text-xs">Bulk waiver (qty)</Label>
                      <Input
                        id="sf-bulk-waiver"
                        type="number"
                        step={1}
                        min={0}
                        value={fees.bulkWaiverThreshold}
                        onChange={(e) => updateSetupFees("bulkWaiverThreshold", parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        className="h-7 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Orders at or above this qty waive setup fees
                      </p>
                    </div>
                    <Separator />
                    <p className="text-xs font-medium text-foreground">Reorder Discount</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="sf-reorder-window" className="text-xs">Window (mo)</Label>
                        <Input
                          id="sf-reorder-window"
                          type="number"
                          step={1}
                          min={0}
                          value={fees.reorderDiscountWindow}
                          onChange={(e) => updateSetupFees("reorderDiscountWindow", parseInt(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="sf-reorder-pct" className="text-xs">Discount</Label>
                        <div className="relative">
                          <Input
                            id="sf-reorder-pct"
                            type="number"
                            step={5}
                            min={0}
                            max={100}
                            value={fees.reorderDiscountPercent}
                            onChange={(e) => updateSetupFees("reorderDiscountPercent", parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="h-7 pr-6 text-xs"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Reorders within {fees.reorderDiscountWindow}mo get {fees.reorderDiscountPercent}% off setup
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="h-5 w-px bg-border hidden md:block" />

              <WithTooltip tooltip="Edit ink, labor, and overhead cost assumptions">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowCostSheet(true)}>
                  <Settings2 className="size-3.5" />
                  <span className="hidden md:inline">Edit Costs</span>
                </Button>
              </WithTooltip>
              <WithTooltip tooltip="Test pricing changes without affecting live quotes">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-warning hover:text-warning"
                  onClick={enterSandbox}
                >
                  <FlaskConical className="size-3.5" />
                  <span className="hidden md:inline">Sandbox</span>
                </Button>
              </WithTooltip>
              <WithTooltip tooltip="Create a copy of this template">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDuplicate}>
                  <Copy className="size-3.5" />
                </Button>
              </WithTooltip>
              <WithTooltip tooltip="Delete this template">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-error hover:text-error"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </WithTooltip>
              <WithTooltip tooltip="Save all changes">
                <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!isEditing}>
                  <Save className="size-3.5" />
                  Save
                </Button>
              </WithTooltip>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5">
              <WithTooltip tooltip="Side-by-side comparison with original">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowComparison(true)}>
                  <GitCompareArrows className="size-3.5" />
                  Compare
                </Button>
              </WithTooltip>
              <WithTooltip tooltip="Discard all changes and restore original">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-error hover:text-error"
                  onClick={discardSandboxChanges}
                >
                  <Undo2 className="size-3.5" />
                  Discard
                </Button>
              </WithTooltip>
              <WithTooltip tooltip="Apply sandbox changes to live template">
                <Button size="sm" className="h-7 text-xs" onClick={saveSandboxChanges}>
                  <Save className="size-3.5" />
                  Save Changes
                </Button>
              </WithTooltip>
            </div>
          )}
          </TooltipProvider>
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-4 pb-20 md:pb-6 md:px-6">

        {/* Sandbox banner */}
        {isSandboxMode && (
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-lg border border-warning/30 bg-warning/10 p-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-warning shrink-0" />
              <span className="text-sm font-medium text-warning">Sandbox Mode</span>
              <span className="hidden md:inline text-sm text-warning/80">
                &mdash; Changes won&apos;t affect live pricing until saved
              </span>
            </div>
            <WithTooltip tooltip="Exit sandbox and discard changes">
              <Button
                variant="ghost"
                size="sm"
                onClick={discardSandboxChanges}
                className="h-7 w-full md:w-auto text-warning/70 hover:text-warning hover:bg-warning/10"
              >
                <X className="size-3.5" />
                Exit Sandbox
              </Button>
            </WithTooltip>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            UNIFIED PRICING MATRIX CARD
           ══════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="space-y-3 pb-3">
            {/* Row 1: title + legend + mode toggle + manual edit + settings */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-center gap-2">
                <Grid3x3 className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Pricing Matrix</CardTitle>
              </div>

              <MarginLegend variant="tooltip" className="hidden md:flex" />

              <div className="flex-1" />

              {/* Simple / Custom toggle */}
              <TooltipProvider skipDelayDuration={300}>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
                <WithTooltip tooltip="Formula-computed prices only">
                  <Button
                    variant={editorMode === "simple" ? "default" : "ghost"}
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => switchMode("simple")}
                  >
                    <LayoutGrid className="size-3" />
                    Simple
                  </Button>
                </WithTooltip>
                <WithTooltip tooltip="View and edit manual price overrides">
                  <Button
                    variant={editorMode === "power" ? "default" : "ghost"}
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => switchMode("power")}
                  >
                    <Zap className="size-3" />
                    Custom
                  </Button>
                </WithTooltip>
              </div>

              {/* Manual Edit toggle — only shown in Custom mode */}
              {editorMode === "power" && (
                <WithTooltip tooltip={isManualEditOn ? "Exit manual editing mode" : "Click cells to set custom prices"}>
                  <Button
                    variant={isManualEditOn ? "default" : "outline"}
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={toggleManualEdit}
                  >
                    {isManualEditOn ? (
                      <ToggleRight className="size-3.5" />
                    ) : (
                      <ToggleLeft className="size-3.5" />
                    )}
                    Manual Edit
                  </Button>
                </WithTooltip>
              )}

              {/* Settings popover: max colors + color hit rate */}
              <Popover>
                <WithTooltip tooltip="Adjust max colors and color hit rate">
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                      <Settings2 className="size-3.5" />
                      Settings
                    </Button>
                  </PopoverTrigger>
                </WithTooltip>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max Colors</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          className="size-6"
                          disabled={maxColors <= 1}
                          onClick={() => updateMaxColors(Math.max(1, maxColors - 1))}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                          {maxColors}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          className="size-6"
                          disabled={maxColors >= 12}
                          onClick={() => updateMaxColors(Math.min(12, maxColors + 1))}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-1.5">
                      <Label htmlFor="matrix-hit-rate" className="text-xs">Color Hit Rate</Label>
                      <div className="relative w-full">
                        <Input
                          id="matrix-hit-rate"
                          type="number"
                          step={0.1}
                          min={0}
                          value={colorHitRate}
                          onChange={(e) => updateColorHitRate(parseFloat(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="h-7 pr-6 text-xs"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">x</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Per-color upcharge applied to every color hit
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              </TooltipProvider>
            </div>

            {/* Row 2: preview selectors (garment + location) */}
            <MatrixPreviewSelector
              garmentTypes={template.matrix.garmentTypePricing}
              locations={template.matrix.locationUpcharges}
              selectedGarment={previewGarment}
              selectedLocations={previewLocations}
              onGarmentChange={setPreviewGarment}
              onLocationsChange={setPreviewLocations}
            />
          </CardHeader>

          <CardContent className="pt-0">
            {editorMode === "simple" ? (
              <ColorPricingGrid
                template={simpleTemplate!}
                previewGarment={previewGarment}
                previewLocations={previewLocations}
              />
            ) : (
              <PowerModeGrid
                template={template}
                garmentBaseCost={DEFAULT_GARMENT_COST}
                onCellEdit={handlePowerCellEdit}
                onBulkEdit={handlePowerBulkEdit}
                previewGarment={previewGarment}
                previewLocations={previewLocations}
                isManualEditOn={isManualEditOn}
                onToggleManualEdit={toggleManualEdit}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Delete confirmation dialog ────────────────────────────── */}
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Comparison view (sandbox) ────────────────────────────── */}
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

      {/* ── Cost configuration sheet ─────────────────────────────── */}
      <CostConfigSheet
        open={showCostSheet}
        onOpenChange={setShowCostSheet}
        costConfig={template.costConfig}
        template={template}
        onSave={updateCostConfig}
      />

      {/* ── Mobile BottomActionBar ─────────────────────────────── */}
      <BottomActionBar>
        {isSandboxMode ? (
          <>
            <Button variant="outline" size="sm" onClick={discardSandboxChanges}>
              <Undo2 className="size-4" />
              Discard
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowComparison(true)}>
              <GitCompareArrows className="size-4" />
              Compare
            </Button>
            <div className="flex-1" />
            <Button size="sm" onClick={saveSandboxChanges}>
              <Save className="size-4" />
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => setShowToolsSheet(true)}>
              <Settings2 className="size-4" />
              Tools
            </Button>
            <div className="flex-1" />
            <Button size="sm" onClick={handleSave} disabled={!isEditing}>
              <Save className="size-4" />
              Save
            </Button>
          </>
        )}
      </BottomActionBar>

      {/* ── Mobile Tools Sheet ─────────────────────────────────── */}
      {showToolsSheet && (
        <MobileToolsSheet
          open={showToolsSheet}
          onOpenChange={setShowToolsSheet}
          template={template}
          fees={fees}
          tierValidation={tierValidation}
          onUpdateTiers={updateTiers}
          onUpdateGarmentTypes={updateGarmentTypes}
          onUpdateLocations={updateLocations}
          onUpdateSetupFees={updateSetupFees}
          onEnterSandbox={enterSandbox}
          onDuplicate={handleDuplicate}
          onShowDeleteDialog={() => setShowDeleteDialog(true)}
          onShowCostSheet={() => setShowCostSheet(true)}
        />
      )}
    </div>
  );
}
