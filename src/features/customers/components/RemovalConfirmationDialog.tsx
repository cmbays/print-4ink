'use client'

import type React from 'react'
import { useState, useMemo } from 'react'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@shared/ui/primitives/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/ui/primitives/collapsible'
import { Checkbox } from '@shared/ui/primitives/checkbox'
import { Button } from '@shared/ui/primitives/button'
import { cn } from '@shared/lib/cn'
import type { Color } from '@domain/entities/color'
import type { ImpactPreview } from '@domain/rules/customer.rules'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type RemovalConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  color: Color
  level: 'global' | 'brand'
  levelLabel?: string
  impact: ImpactPreview
  onRemoveAll: () => void
  onRemoveLevelOnly: () => void
  onRemoveSelected: (brandNames: string[], customerCompanies: string[]) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RemovalConfirmationDialog({
  open,
  onOpenChange,
  color,
  level,
  levelLabel,
  impact,
  onRemoveAll,
  onRemoveLevelOnly,
  onRemoveSelected,
}: RemovalConfirmationDialogProps) {
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())

  const totalImpact = impact.supplierCount + impact.customerCount
  const totalSelected = selectedBrands.size + selectedCustomers.size

  const displayLevel = levelLabel ?? level

  // Build impact message
  const impactMessage = useMemo(() => {
    const parts: string[] = []
    if (impact.supplierCount > 0) {
      parts.push(`${impact.supplierCount} ${impact.supplierCount === 1 ? 'brand' : 'brands'}`)
    }
    if (impact.customerCount > 0) {
      parts.push(`${impact.customerCount} ${impact.customerCount === 1 ? 'customer' : 'customers'}`)
    }
    return parts.join(' and ')
  }, [impact.supplierCount, impact.customerCount])

  // Shared className for checkbox labels
  const checkboxLabelCn = cn(
    'flex items-center gap-2 rounded px-1.5 py-1 text-sm',
    'min-h-(--mobile-touch-target) md:min-h-0',
    'cursor-pointer hover:bg-elevated transition-colors'
  )

  // -- Handlers ---------------------------------------------------------------

  function toggleSetItem<T>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
  }

  function handleApplySelected() {
    onRemoveSelected([...selectedBrands], [...selectedCustomers])
    onOpenChange(false)
  }

  function handleRemoveAll() {
    onRemoveAll()
    // AlertDialogAction auto-closes — no manual onOpenChange(false) needed
  }

  function handleRemoveLevelOnly() {
    onRemoveLevelOnly()
    // AlertDialogAction auto-closes — no manual onOpenChange(false) needed
  }

  // -- Render -----------------------------------------------------------------

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {/* U65: Color swatch + name */}
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 shrink-0 rounded-sm"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
            <AlertDialogTitle className="text-base">Remove {color.name}?</AlertDialogTitle>
          </div>

          {/* U66: Impact count message */}
          <AlertDialogDescription className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <span>
              {impactMessage} {totalImpact === 1 ? 'has' : 'have'} this color. Choose how to handle
              removal.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* U70: Customize selections — progressive disclosure */}
        <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
            >
              <ChevronDown
                size={14}
                className={cn('transition-transform', customizeOpen && 'rotate-180')}
                aria-hidden="true"
              />
              Customize selections
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div
              className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-surface p-3"
              role="group"
              aria-label="Select entities to remove color from"
            >
              {/* Suppliers (brands) */}
              {impact.suppliers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Brands ({impact.suppliers.length})
                  </p>
                  {impact.suppliers.map((name) => (
                    <label key={name} className={checkboxLabelCn}>
                      <Checkbox
                        checked={selectedBrands.has(name)}
                        onCheckedChange={() => toggleSetItem(setSelectedBrands, name)}
                      />
                      {name}
                    </label>
                  ))}
                </div>
              )}

              {/* Customers */}
              {impact.customers.length > 0 && (
                <div className="space-y-1.5">
                  {impact.suppliers.length > 0 && <div className="my-1.5 border-t border-border" />}
                  <p className="text-xs font-medium text-muted-foreground">
                    Customers ({impact.customers.length})
                  </p>
                  {impact.customers.map((company) => (
                    <label key={company} className={checkboxLabelCn}>
                      <Checkbox
                        checked={selectedCustomers.has(company)}
                        onCheckedChange={() => toggleSetItem(setSelectedCustomers, company)}
                      />
                      {company}
                    </label>
                  ))}
                </div>
              )}

              {/* U72: Apply to selected button */}
              {totalSelected > 0 && (
                <div className="pt-2">
                  <Button size="sm" className="w-full" onClick={handleApplySelected}>
                    Apply to selected ({totalSelected})
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action buttons */}
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {/* U67: Remove everywhere */}
          <AlertDialogAction variant="destructive" onClick={handleRemoveAll}>
            Remove everywhere
          </AlertDialogAction>

          {/* U68: Remove from level only */}
          <AlertDialogAction variant="outline" onClick={handleRemoveLevelOnly}>
            Remove from {displayLevel} only
          </AlertDialogAction>

          {/* U69: Cancel */}
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
