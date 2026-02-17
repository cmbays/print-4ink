'use client'

import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/ui/primitives/collapsible'
import { cn } from '@shared/lib/cn'
import { money, toNumber, formatCurrency } from '@domain/lib/money'
import type { PricingSnapshot } from '@domain/entities/invoice'

type ChangeDiffPanelProps = {
  pricingSnapshot: PricingSnapshot | undefined
  currentPricing: {
    subtotal: number
    discountTotal: number
    shipping: number
    taxAmount: number
    total: number
  }
}

function DiffRow({
  label,
  snapshotValue,
  currentValue,
}: {
  label: string
  snapshotValue: number
  currentValue: number
}) {
  const diff = toNumber(money(currentValue).minus(money(snapshotValue)))
  if (money(diff).abs().lt(money('0.01'))) return null

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground line-through">{formatCurrency(snapshotValue)}</span>
        <span className="text-foreground">{formatCurrency(currentValue)}</span>
        <span className={cn('font-mono text-xs', diff > 0 ? 'text-error' : 'text-success')}>
          {diff > 0 ? '+' : ''}
          {formatCurrency(diff)}
        </span>
      </div>
    </div>
  )
}

export function ChangeDiffPanel({ pricingSnapshot, currentPricing }: ChangeDiffPanelProps) {
  if (!pricingSnapshot) return null

  // Check if anything actually changed
  const hasDiff = (a: number, b: number) => !money(a).eq(money(b))
  const hasChanges =
    hasDiff(pricingSnapshot.subtotal, currentPricing.subtotal) ||
    hasDiff(pricingSnapshot.discountTotal, currentPricing.discountTotal) ||
    hasDiff(pricingSnapshot.shipping, currentPricing.shipping) ||
    hasDiff(pricingSnapshot.taxAmount, currentPricing.taxAmount) ||
    hasDiff(pricingSnapshot.total, currentPricing.total)

  if (!hasChanges) return null

  return (
    <div className="rounded-lg border border-border bg-card">
      <Collapsible>
        <CollapsibleTrigger className="group flex w-full items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-surface transition-colors rounded-lg">
          <span>View Quote Changes</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
            <DiffRow
              label="Subtotal"
              snapshotValue={pricingSnapshot.subtotal}
              currentValue={currentPricing.subtotal}
            />
            <DiffRow
              label="Discounts"
              snapshotValue={pricingSnapshot.discountTotal}
              currentValue={currentPricing.discountTotal}
            />
            <DiffRow
              label="Shipping"
              snapshotValue={pricingSnapshot.shipping}
              currentValue={currentPricing.shipping}
            />
            <DiffRow
              label="Tax"
              snapshotValue={pricingSnapshot.taxAmount}
              currentValue={currentPricing.taxAmount}
            />
            <DiffRow
              label="Total"
              snapshotValue={pricingSnapshot.total}
              currentValue={currentPricing.total}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
