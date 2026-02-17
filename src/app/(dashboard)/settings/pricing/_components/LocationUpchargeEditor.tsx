'use client'

import { Input } from '@shared/ui/primitives/input'
import { Badge } from '@shared/ui/primitives/badge'
import { formatCurrency } from '@domain/services/pricing.service'
import { money, round2, toNumber } from '@domain/lib/money'
import type { LocationUpcharge } from '@domain/entities/price-matrix'

const LOCATION_LABELS: Record<string, string> = {
  front: 'Front',
  back: 'Back',
  'left-sleeve': 'Left Sleeve',
  'right-sleeve': 'Right Sleeve',
  pocket: 'Pocket',
}

type LocationUpchargeEditorProps = {
  locations: LocationUpcharge[]
  onLocationsChange: (locations: LocationUpcharge[]) => void
}

// ---------------------------------------------------------------------------
// Headless editor — no Card wrapper. Parent wraps in Popover/Dialog/Card.
// ---------------------------------------------------------------------------

export function LocationUpchargeEditor({
  locations,
  onLocationsChange,
}: LocationUpchargeEditorProps) {
  const updateUpcharge = (index: number, value: number) => {
    const updated = locations.map((loc, i) => (i === index ? { ...loc, upcharge: value } : loc))
    onLocationsChange(updated)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Additional per-piece cost for each print location.
      </p>
      {locations.map((loc, index) => (
        <div
          key={loc.location}
          className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              {LOCATION_LABELS[loc.location] ?? loc.location}
            </span>
            {loc.upcharge === 0 && (
              <Badge variant="secondary" className="text-[10px]">
                Base
              </Badge>
            )}
          </div>
          <div className="relative w-20">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step={0.25}
              min={0}
              value={loc.upcharge}
              onChange={(e) => updateUpcharge(index, parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              className="h-7 pl-5 text-xs text-right"
            />
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="text-xs text-muted-foreground">
        Max surcharge (all locations):{' '}
        <span className="text-foreground font-medium">
          {formatCurrency(
            toNumber(round2(locations.reduce((sum, loc) => sum.plus(loc.upcharge), money(0))))
          )}
        </span>
      </div>
    </div>
  )
}
