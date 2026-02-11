"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Save,
  Copy,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DTFSheetTierEditor } from "../../_components/DTFSheetTierEditor";
import { DTFPricingCalculator } from "../../_components/DTFPricingCalculator";
import { allDTFTemplates } from "@/lib/mock-data-pricing";
import type {
  DTFPricingTemplate,
  DTFSheetTier,
  DTFCostConfig,
} from "@/lib/schemas/dtf-pricing";

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const RUSH_LABELS: Record<string, string> = {
  standard: "Standard",
  "2-day": "2-Day Rush",
  "next-day": "Next Day",
  "same-day": "Same Day",
};

const FILM_LABELS: Record<string, string> = {
  standard: "Standard",
  glossy: "Glossy",
  metallic: "Metallic",
  glow: "Glow-in-Dark",
};

const TIER_LABELS: Record<string, string> = {
  standard: "Standard",
  preferred: "Preferred",
  contract: "Contract",
  wholesale: "Wholesale",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DTFEditorClientProps {
  templateId: string;
}

export function DTFEditorClient({ templateId }: DTFEditorClientProps) {
  const sourceTemplate = allDTFTemplates.find((t) => t.id === templateId);

  const [template, setTemplate] = useState<DTFPricingTemplate | null>(
    sourceTemplate ? deepCopy(sourceTemplate) : null
  );

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(sourceTemplate?.name ?? "");

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);

  // -------------------------------------------------------------------------
  // State updaters (declared before early return to satisfy hook rules)
  // -------------------------------------------------------------------------

  const updateTemplate = (partial: Partial<DTFPricingTemplate>) => {
    setTemplate((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const updateSheetTier = (
    index: number,
    field: keyof DTFSheetTier,
    value: number
  ) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const tiers = [...prev.sheetTiers];
      tiers[index] = { ...tiers[index], [field]: value };
      return { ...prev, sheetTiers: tiers };
    });
  };

  const addSheetTier = () => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const lastTier = prev.sheetTiers[prev.sheetTiers.length - 1];
      const newLength = lastTier ? lastTier.length + 24 : 24;
      const newTier: DTFSheetTier = {
        width: 22,
        length: newLength,
        retailPrice: 0,
      };
      return { ...prev, sheetTiers: [...prev.sheetTiers, newTier] };
    });
  };

  const removeSheetTier = (index: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sheetTiers: prev.sheetTiers.filter((_, i) => i !== index),
      };
    });
  };

  const updateCustomerDiscount = (index: number, discountPercent: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const discounts = [...prev.customerTierDiscounts];
      discounts[index] = { ...discounts[index], discountPercent };
      return { ...prev, customerTierDiscounts: discounts };
    });
  };

  const updateRushFee = (
    index: number,
    field: "percentageUpcharge" | "flatFee",
    value: number
  ) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const fees = [...prev.rushFees];
      fees[index] = { ...fees[index], [field]: field === "flatFee" && value === 0 ? undefined : value };
      return { ...prev, rushFees: fees };
    });
  };

  const updateFilmType = (index: number, multiplier: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const types = [...prev.filmTypes];
      types[index] = { ...types[index], multiplier };
      return { ...prev, filmTypes: types };
    });
  };

  const updateCostConfig = (field: keyof DTFCostConfig, value: number) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        costConfig: { ...prev.costConfig, [field]: value },
      };
    });
  };

  // -------------------------------------------------------------------------
  // Not found state
  // -------------------------------------------------------------------------

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center" role="alert">
        <AlertTriangle className="size-12 text-muted-foreground/50" />
        <p className="text-lg font-semibold tracking-tight">Template Not Found</p>
        <p className="text-sm text-muted-foreground">
          No DTF template with ID &quot;{templateId}&quot; exists.
        </p>
        <Button variant="outline" asChild>
          <Link href="/settings/pricing">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Pricing
          </Link>
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleSave = () => {
    updateTemplate({ updatedAt: new Date().toISOString() });
    toast.success("Template saved", {
      description: `"${template.name}" has been updated.`,
    });
  };

  const handleDuplicate = () => {
    toast.success("Template duplicated", {
      description: `A copy of "${template.name}" has been created.`,
    });
  };

  const handleDelete = () => {
    toast.success("Template deleted", {
      description: "The template has been removed.",
    });
    setDeleteOpen(false);
  };

  const handleNameSave = () => {
    if (editName.trim()) {
      updateTemplate({ name: editName.trim() });
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setEditName(template.name);
    setIsEditingName(false);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {/* Template name — inline editable */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-64 text-lg font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") handleNameCancel();
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleNameSave}
                  aria-label="Save name"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleNameCancel}
                  aria-label="Cancel editing"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{template.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditName(template.name);
                    setIsEditingName(true);
                  }}
                  aria-label="Edit template name"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Badge variant="secondary" className="text-xs">
                  DTF
                </Badge>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Last saved {formatTimestamp(template.updatedAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="mr-1.5 h-4 w-4" />
            Duplicate
          </Button>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Template</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{template.name}&quot;?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1.5 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column — editing sections */}
        <div className="space-y-6">
          {/* Sheet Tiers */}
          <DTFSheetTierEditor
            tiers={template.sheetTiers}
            costConfig={template.costConfig}
            onUpdateTier={updateSheetTier}
            onAddTier={addSheetTier}
            onRemoveTier={removeSheetTier}
          />

          {/* Customer Tier Discounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Customer Tier Discounts
              </CardTitle>
              <CardDescription>
                Discount percentages applied based on customer pricing tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead className="w-[140px]">Discount %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.customerTierDiscounts.map((discount, index) => (
                    <TableRow key={discount.tier}>
                      <TableCell className="font-medium">
                        {TIER_LABELS[discount.tier] ?? discount.tier}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={discount.discountPercent}
                            onChange={(e) =>
                              updateCustomerDiscount(
                                index,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 w-20 text-sm"
                            min={0}
                            max={100}
                            step={1}
                          />
                          <span className="text-muted-foreground text-sm">%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rush Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rush Fees</CardTitle>
              <CardDescription>
                Percentage upcharge and optional flat fee by turnaround time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turnaround</TableHead>
                    <TableHead className="w-[140px]">Upcharge %</TableHead>
                    <TableHead className="w-[140px]">Flat Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.rushFees.map((fee, index) => (
                    <TableRow key={fee.turnaround}>
                      <TableCell className="font-medium">
                        {RUSH_LABELS[fee.turnaround] ?? fee.turnaround}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={fee.percentageUpcharge}
                            onChange={(e) =>
                              updateRushFee(
                                index,
                                "percentageUpcharge",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 w-20 text-sm"
                            min={0}
                            max={200}
                            step={5}
                          />
                          <span className="text-muted-foreground text-sm">%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            value={fee.flatFee ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateRushFee(
                                index,
                                "flatFee",
                                val === "" ? 0 : parseFloat(val) || 0
                              );
                            }}
                            className="h-8 w-20 text-sm"
                            min={0}
                            step={1}
                            placeholder="—"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Film Type Multipliers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Film Type Multipliers</CardTitle>
              <CardDescription>
                Price multiplier applied for specialty film types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Film Type</TableHead>
                    <TableHead className="w-[140px]">Multiplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.filmTypes.map((film, index) => (
                    <TableRow key={film.type}>
                      <TableCell className="font-medium">
                        {FILM_LABELS[film.type] ?? film.type}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={film.multiplier}
                            onChange={(e) =>
                              updateFilmType(
                                index,
                                parseFloat(e.target.value) || 1
                              )
                            }
                            className="h-8 w-20 text-sm"
                            min={0.1}
                            max={5}
                            step={0.1}
                          />
                          <span className="text-muted-foreground text-sm">×</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Production Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Production Costs</CardTitle>
              <CardDescription>
                Cost inputs used for margin calculations across all tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Film Cost ($/sq.ft.)
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={template.costConfig.filmCostPerSqFt}
                      onChange={(e) =>
                        updateCostConfig(
                          "filmCostPerSqFt",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-sm"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Ink Cost ($/sq.in.)
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={template.costConfig.inkCostPerSqIn}
                      onChange={(e) =>
                        updateCostConfig(
                          "inkCostPerSqIn",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-sm"
                      min={0}
                      step={0.001}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Powder Cost ($/sq.ft.)
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={template.costConfig.powderCostPerSqFt}
                      onChange={(e) =>
                        updateCostConfig(
                          "powderCostPerSqFt",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-sm"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Labor Rate ($/hr)
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={template.costConfig.laborRatePerHour}
                      onChange={(e) =>
                        updateCostConfig(
                          "laborRatePerHour",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-sm"
                      min={0}
                      step={1}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Equipment Overhead ($/sq.ft.)
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={template.costConfig.equipmentOverheadPerSqFt}
                      onChange={(e) =>
                        updateCostConfig(
                          "equipmentOverheadPerSqFt",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-sm"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — calculator */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <DTFPricingCalculator template={template} />
        </div>
      </div>
    </div>
  );
}
