'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@shared/ui/primitives/sheet'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'
import { Separator } from '@shared/ui/primitives/separator'
import {
  Layers,
  Shirt,
  MapPin,
  Receipt,
  Settings2,
  FlaskConical,
  Copy,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@shared/lib/cn'
import type {
  PricingTemplate,
  QuantityTier,
  LocationUpcharge,
  GarmentTypePricing,
  SetupFeeConfig,
} from '@domain/entities/price-matrix'
import { QuantityTierEditor } from './QuantityTierEditor'
import { GarmentTypePricingEditor } from './GarmentTypePricingEditor'
import { LocationUpchargeEditor } from './LocationUpchargeEditor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActiveTool = 'qty-tiers' | 'garments' | 'locations' | 'setup-fees' | null

type MobileToolsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: PricingTemplate
  fees: SetupFeeConfig
  tierValidation: { hasErrors: boolean }
  onUpdateTiers: (tiers: QuantityTier[], basePrices: number[]) => void
  onUpdateGarmentTypes: (garmentTypes: GarmentTypePricing[]) => void
  onUpdateLocations: (locations: LocationUpcharge[]) => void
  onUpdateSetupFees: (field: keyof SetupFeeConfig, value: number) => void
  onEnterSandbox: () => void
  onDuplicate: () => void
  onShowDeleteDialog: () => void
  onShowCostSheet: () => void
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const toolItems: Array<{
  id: ActiveTool
  icon: typeof Layers
  label: string
  description: string
  drillDown: boolean
}> = [
  {
    id: 'qty-tiers',
    icon: Layers,
    label: 'Qty Tiers',
    description: 'Quantity breakpoints & base pricing',
    drillDown: true,
  },
  {
    id: 'garments',
    icon: Shirt,
    label: 'Garments',
    description: 'Markup by garment category',
    drillDown: true,
  },
  {
    id: 'locations',
    icon: MapPin,
    label: 'Locations',
    description: 'Per-piece location upcharges',
    drillDown: true,
  },
  {
    id: 'setup-fees',
    icon: Receipt,
    label: 'Setup Fees',
    description: 'Screen fees & reorder discounts',
    drillDown: true,
  },
]

const actionItems: Array<{
  icon: typeof Settings2
  label: string
  description: string
  variant?: 'destructive'
  action: 'costs' | 'sandbox' | 'duplicate' | 'delete'
}> = [
  { icon: Settings2, label: 'Edit Costs', description: 'Ink, labor & overhead', action: 'costs' },
  { icon: FlaskConical, label: 'Sandbox', description: 'Test changes safely', action: 'sandbox' },
  {
    icon: Copy,
    label: 'Duplicate',
    description: 'Create a copy of this template',
    action: 'duplicate',
  },
  {
    icon: Trash2,
    label: 'Delete',
    description: 'Remove this template',
    variant: 'destructive',
    action: 'delete',
  },
]

const toolTitles: Record<Exclude<ActiveTool, null>, string> = {
  'qty-tiers': 'Quantity Tiers',
  garments: 'Garment Markup',
  locations: 'Location Upcharges',
  'setup-fees': 'Setup Fees',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MobileToolsSheet({
  open,
  onOpenChange,
  template,
  fees,
  tierValidation,
  onUpdateTiers,
  onUpdateGarmentTypes,
  onUpdateLocations,
  onUpdateSetupFees,
  onEnterSandbox,
  onDuplicate,
  onShowDeleteDialog,
  onShowCostSheet,
}: MobileToolsSheetProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)

  const handleAction = (action: string) => {
    onOpenChange(false)
    // Small delay so sheet close animation finishes before opening next modal
    setTimeout(() => {
      switch (action) {
        case 'costs':
          onShowCostSheet()
          break
        case 'sandbox':
          onEnterSandbox()
          break
        case 'duplicate':
          onDuplicate()
          break
        case 'delete':
          onShowDeleteDialog()
          break
      }
    }, 150)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={activeTool === null}
        className="max-h-[85vh] overflow-y-auto rounded-t-xl"
      >
        {activeTool === null ? (
          /* ── Level 1: Tool List ───────────────────────────────── */
          <>
            <SheetHeader>
              <SheetTitle>Tools</SheetTitle>
              <SheetDescription>Configure pricing template settings</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-1 px-4 pb-4">
              {/* Drill-down tools */}
              {toolItems.map((tool) => {
                const Icon = tool.icon
                const hasError = tool.id === 'qty-tiers' && tierValidation.hasErrors
                return (
                  <button
                    key={tool.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                      'hover:bg-surface active:bg-surface',
                      hasError && 'ring-1 ring-error/30'
                    )}
                    onClick={() => setActiveTool(tool.id)}
                  >
                    <Icon
                      className={cn(
                        'size-5 shrink-0',
                        hasError ? 'text-error' : 'text-muted-foreground'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', hasError && 'text-error')}>
                        {tool.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                )
              })}

              <Separator className="my-2" />

              {/* Quick actions (no drill-down) */}
              {actionItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.action}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                      'hover:bg-surface active:bg-surface',
                      item.variant === 'destructive' && 'text-error'
                    )}
                    onClick={() => handleAction(item.action)}
                  >
                    <Icon
                      className={cn(
                        'size-5 shrink-0',
                        item.variant === 'destructive' ? 'text-error' : 'text-muted-foreground',
                        item.action === 'sandbox' && 'text-warning'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          item.variant === 'destructive' && 'text-error',
                          item.action === 'sandbox' && 'text-warning'
                        )}
                      >
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          item.variant === 'destructive' ? 'text-error/70' : 'text-muted-foreground'
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          /* ── Level 2: Detail View ────────────────────────────── */
          <>
            <SheetHeader className="flex-row items-center gap-2 space-y-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 shrink-0"
                onClick={() => setActiveTool(null)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <SheetTitle>{toolTitles[activeTool]}</SheetTitle>
            </SheetHeader>

            <div className="px-4 pb-4">
              {activeTool === 'qty-tiers' && (
                <QuantityTierEditor
                  tiers={template.matrix.quantityTiers}
                  basePrices={template.matrix.basePriceByTier}
                  onTiersChange={onUpdateTiers}
                />
              )}

              {activeTool === 'garments' && (
                <GarmentTypePricingEditor
                  garmentTypes={template.matrix.garmentTypePricing}
                  onGarmentTypesChange={onUpdateGarmentTypes}
                />
              )}

              {activeTool === 'locations' && (
                <LocationUpchargeEditor
                  locations={template.matrix.locationUpcharges}
                  onLocationsChange={onUpdateLocations}
                />
              )}

              {activeTool === 'setup-fees' && (
                <SetupFeeForm fees={fees} onUpdate={onUpdateSetupFees} />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Setup Fee inline form (extracted from editor.tsx popover content)
// ---------------------------------------------------------------------------

function SetupFeeForm({
  fees,
  onUpdate,
}: {
  fees: SetupFeeConfig
  onUpdate: (field: keyof SetupFeeConfig, value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="mobile-sf-per-screen" className="text-xs">
          Per-screen fee
        </Label>
        <div className="relative w-full">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            $
          </span>
          <Input
            id="mobile-sf-per-screen"
            type="number"
            step={1}
            min={0}
            value={fees.perScreenFee}
            onChange={(e) => onUpdate('perScreenFee', parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="h-8 pl-5 text-xs"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="mobile-sf-bulk-waiver" className="text-xs">
          Bulk waiver (qty)
        </Label>
        <Input
          id="mobile-sf-bulk-waiver"
          type="number"
          step={1}
          min={0}
          value={fees.bulkWaiverThreshold}
          onChange={(e) => onUpdate('bulkWaiverThreshold', parseInt(e.target.value) || 0)}
          onFocus={(e) => e.target.select()}
          className="h-8 text-xs"
        />
        <p className="text-[10px] text-muted-foreground">
          Orders at or above this qty waive setup fees
        </p>
      </div>
      <Separator />
      <p className="text-xs font-medium text-foreground">Reorder Discount</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="mobile-sf-reorder-window" className="text-xs">
            Window (mo)
          </Label>
          <Input
            id="mobile-sf-reorder-window"
            type="number"
            step={1}
            min={0}
            value={fees.reorderDiscountWindow}
            onChange={(e) => onUpdate('reorderDiscountWindow', parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mobile-sf-reorder-pct" className="text-xs">
            Discount
          </Label>
          <div className="relative">
            <Input
              id="mobile-sf-reorder-pct"
              type="number"
              step={5}
              min={0}
              max={100}
              value={fees.reorderDiscountPercent}
              onChange={(e) => onUpdate('reorderDiscountPercent', parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              className="h-8 pr-6 text-xs"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              %
            </span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Reorders within {fees.reorderDiscountWindow}mo get {fees.reorderDiscountPercent}% off setup
      </p>
    </div>
  )
}
