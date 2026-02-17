'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/primitives/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/primitives/table'
import { MarginIndicator } from '@/components/features/MarginIndicator'
import { CostBreakdownTooltip } from '@/components/features/CostBreakdownTooltip'
import { calculateDTFTierMargin, formatCurrency } from '@domain/services/pricing.service'
import type { DTFSheetTier, DTFCostConfig } from '@domain/entities/dtf-pricing'

type DTFSheetTierEditorProps = {
  tiers: DTFSheetTier[]
  costConfig: DTFCostConfig
  onUpdateTier: (index: number, field: keyof DTFSheetTier, value: number) => void
  onAddTier: () => void
  onRemoveTier: (index: number) => void
}

export function DTFSheetTierEditor({
  tiers,
  costConfig,
  onUpdateTier,
  onAddTier,
  onRemoveTier,
}: DTFSheetTierEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sheet Size Tiers</CardTitle>
        <CardDescription>
          Fixed 22&quot; width. Set length and pricing for each tier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Sheet Size</TableHead>
              <TableHead className="w-[140px]">Retail Price</TableHead>
              <TableHead className="w-[140px]">Contract Price</TableHead>
              <TableHead className="w-[80px]">Margin</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier, index) => {
              const margin = calculateDTFTierMargin(tier, costConfig)

              return (
                <CostBreakdownTooltip key={index} breakdown={margin}>
                  <TableRow className="group">
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-sm">22&quot; ×</span>
                        <Input
                          type="number"
                          value={tier.length}
                          onChange={(e) =>
                            onUpdateTier(index, 'length', parseFloat(e.target.value) || 0)
                          }
                          onFocus={(e) => e.target.select()}
                          className="h-8 w-16 text-sm"
                          min={1}
                        />
                        <span className="text-muted-foreground text-sm">&quot;</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          value={tier.retailPrice}
                          onChange={(e) =>
                            onUpdateTier(index, 'retailPrice', parseFloat(e.target.value) || 0)
                          }
                          onFocus={(e) => e.target.select()}
                          className="h-8 w-20 text-sm"
                          min={0}
                          step={0.01}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          value={tier.contractPrice ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            onUpdateTier(
                              index,
                              'contractPrice',
                              val === '' ? 0 : parseFloat(val) || 0
                            )
                          }}
                          onFocus={(e) => e.target.select()}
                          className="h-8 w-20 text-sm"
                          min={0}
                          step={0.01}
                          placeholder="—"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MarginIndicator
                          percentage={margin.percentage}
                          indicator={margin.indicator}
                        />
                        <span className="text-muted-foreground text-xs font-mono">
                          {formatCurrency(margin.profit)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemoveTier(index)}
                        aria-label={`Remove ${tier.width}" × ${tier.length}" tier`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </CostBreakdownTooltip>
              )
            })}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onAddTier}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Tier
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
