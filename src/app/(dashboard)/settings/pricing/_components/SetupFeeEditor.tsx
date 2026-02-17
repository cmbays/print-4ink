'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/card'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'
import { Separator } from '@shared/ui/primitives/separator'
import type { SetupFeeConfig } from '@domain/entities/price-matrix'
import { Settings } from 'lucide-react'

type SetupFeeEditorProps = {
  config: SetupFeeConfig
  onConfigChange: (config: SetupFeeConfig) => void
}

export function SetupFeeEditor({ config, onConfigChange }: SetupFeeEditorProps) {
  const update = (field: keyof SetupFeeConfig, value: number) => {
    onConfigChange({ ...config, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Setup Fees</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          One-time fees per screen, bulk waiver, and reorder discounts.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Per screen fee */}
          <div className="space-y-1.5">
            <Label htmlFor="per-screen-fee" className="text-xs">
              Per-screen setup fee
            </Label>
            <div className="relative w-32">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                id="per-screen-fee"
                type="number"
                step={1}
                min={0}
                value={config.perScreenFee}
                onChange={(e) => update('perScreenFee', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="h-8 pl-5 text-xs"
              />
            </div>
          </div>

          {/* Bulk waiver */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-waiver" className="text-xs">
              Bulk waiver threshold
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Orders at or above this quantity have setup fees waived.
            </p>
            <Input
              id="bulk-waiver"
              type="number"
              step={1}
              min={0}
              value={config.bulkWaiverThreshold}
              onChange={(e) => update('bulkWaiverThreshold', parseInt(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              className="h-8 w-32 text-xs"
            />
          </div>

          <Separator />

          {/* Reorder discount */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-foreground">Reorder Discount</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reorder-window" className="text-xs">
                  Window (months)
                </Label>
                <Input
                  id="reorder-window"
                  type="number"
                  step={1}
                  min={0}
                  value={config.reorderDiscountWindow}
                  onChange={(e) => update('reorderDiscountWindow', parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reorder-discount" className="text-xs">
                  Discount
                </Label>
                <div className="relative">
                  <Input
                    id="reorder-discount"
                    type="number"
                    step={5}
                    min={0}
                    max={100}
                    value={config.reorderDiscountPercent}
                    onChange={(e) =>
                      update('reorderDiscountPercent', parseFloat(e.target.value) || 0)
                    }
                    onFocus={(e) => e.target.select()}
                    className="h-8 pr-6 text-xs"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Reorders within {config.reorderDiscountWindow} months get{' '}
              {config.reorderDiscountPercent}% off setup fees.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
