'use client'

import type { MarginBreakdown } from '@domain/entities/price-matrix'
import { formatCurrency, formatPercent } from '@domain/services/pricing.service'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'

type CostBreakdownTooltipProps = {
  breakdown: MarginBreakdown
  children: React.ReactNode
}

export function CostBreakdownTooltip({ breakdown, children }: CostBreakdownTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="p-0">
        <div className="flex flex-col gap-0 px-3 py-2 font-mono text-xs">
          {/* Revenue */}
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Revenue:</span>
            <span className="text-foreground">{formatCurrency(breakdown.revenue)}</span>
          </div>

          {/* Separator */}
          <div className="border-border my-1 border-t" />

          {/* Costs */}
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Garment:</span>
            <span className="text-foreground">-{formatCurrency(breakdown.garmentCost)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Ink:</span>
            <span className="text-foreground">-{formatCurrency(breakdown.inkCost)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Overhead:</span>
            <span className="text-foreground">-{formatCurrency(breakdown.overheadCost)}</span>
          </div>
          {breakdown.laborCost !== undefined && breakdown.laborCost > 0 && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-muted-foreground">Labor:</span>
              <span className="text-foreground">-{formatCurrency(breakdown.laborCost)}</span>
            </div>
          )}

          {/* Separator */}
          <div className="border-border my-1 border-t" />

          {/* Totals */}
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Profit:</span>
            <span className="text-foreground font-semibold">
              {formatCurrency(breakdown.profit)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Margin:</span>
            <span className="text-foreground font-semibold">
              {formatPercent(breakdown.percentage)}
            </span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
