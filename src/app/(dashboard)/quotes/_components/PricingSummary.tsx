'use client'

import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Badge } from '@shared/ui/primitives/badge'
import { Separator } from '@shared/ui/primitives/separator'
import { DiscountRow } from './DiscountRow'
import { money, round2, toNumber, formatCurrency } from '@domain/lib/money'
import { TAX_RATE, CONTRACT_DISCOUNT_RATE } from '@domain/constants'
import type { Discount } from '@domain/entities/quote'
import type { CustomerTag } from '@domain/entities/customer'

type PricingSummaryProps = {
  garmentSubtotal: number
  decorationSubtotal: number
  dtfSubtotal?: number
  setupFees: number
  discounts: Discount[]
  onDiscountsChange: (discounts: Discount[]) => void
  shipping: number
  onShippingChange: (shipping: number) => void
  customerTag?: CustomerTag
  screenReuse?: boolean
  screenReuseDiscount?: number
}

export function PricingSummary({
  garmentSubtotal,
  decorationSubtotal,
  dtfSubtotal = 0,
  setupFees,
  discounts,
  onDiscountsChange,
  shipping,
  onShippingChange,
  customerTag,
  screenReuse,
  screenReuseDiscount,
}: PricingSummaryProps) {
  const subtotal = toNumber(
    round2(money(garmentSubtotal).plus(decorationSubtotal).plus(dtfSubtotal))
  )

  // Contract discount is auto-calculated, not editable
  const contractDiscount = useMemo(() => {
    if (customerTag !== 'contract') return 0
    return toNumber(round2(money(subtotal).times(CONTRACT_DISCOUNT_RATE)))
  }, [customerTag, subtotal])

  // Manual discounts only (user-added)
  const manualDiscounts = useMemo(
    () => discounts.filter((d) => d.type === 'manual' || d.type === 'volume'),
    [discounts]
  )

  const totalManualDiscounts = useMemo(
    () => toNumber(manualDiscounts.reduce((sum, d) => money(sum).plus(d.amount), money(0))),
    [manualDiscounts]
  )

  const screenDiscount = screenReuse && screenReuseDiscount ? screenReuseDiscount : 0
  const totalDiscounts = toNumber(
    money(contractDiscount).plus(totalManualDiscounts).plus(screenDiscount)
  )

  // Tax is 10% of (subtotal + setupFees - discounts + shipping)
  const preTaxTotal = toNumber(money(subtotal).plus(setupFees).minus(totalDiscounts).plus(shipping))
  const tax = toNumber(round2(money(preTaxTotal).times(TAX_RATE)))
  const grandTotal = toNumber(money(preTaxTotal).plus(tax))
  const originalPreTax = toNumber(money(subtotal).plus(setupFees).plus(shipping))
  const originalTax = toNumber(round2(money(originalPreTax).times(TAX_RATE)))
  const originalTotal = toNumber(money(originalPreTax).plus(originalTax))

  function handleAddDiscount() {
    onDiscountsChange([...manualDiscounts, { label: '', amount: 0, type: 'manual' }])
  }

  function handleDiscountChange(index: number, partial: Partial<Discount>) {
    const next = manualDiscounts.map((d, i) => (i === index ? { ...d, ...partial } : d))
    onDiscountsChange(next)
  }

  function handleRemoveDiscount(index: number) {
    onDiscountsChange(manualDiscounts.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">Pricing Summary</h3>
      <div className="space-y-3">
        {/* Garment Cost */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Garments</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(garmentSubtotal)}
          </span>
        </div>

        {/* Decoration Cost */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Decoration</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(decorationSubtotal)}
          </span>
        </div>

        {/* DTF Gang Sheets */}
        {dtfSubtotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">DTF Gang Sheets</span>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(dtfSubtotal)}
            </span>
          </div>
        )}

        {/* Setup Fees (auto-calculated, read-only) */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Setup Fees</span>
          <span className="text-sm font-medium text-foreground">{formatCurrency(setupFees)}</span>
        </div>

        {/* Screen Reuse Discount */}
        {screenReuse && screenReuseDiscount != null && screenReuseDiscount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="ghost"
                className="text-xs bg-success/10 text-success border border-success/20"
              >
                screens
              </Badge>
              <span className="text-muted-foreground">Screen Reuse (setup waived)</span>
            </div>
            <span className="text-success">-{formatCurrency(screenReuseDiscount)}</span>
          </div>
        )}

        <Separator />

        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Subtotal</span>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(toNumber(money(subtotal).plus(setupFees)))}
          </span>
        </div>

        {/* Contract Discount (auto, non-removable) */}
        {customerTag === 'contract' && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="ghost"
                className="text-xs bg-warning/10 text-warning border border-warning/20"
              >
                contract
              </Badge>
              <span className="text-muted-foreground">Contract Pricing (7%)</span>
            </div>
            <span className="text-success">-{formatCurrency(contractDiscount)}</span>
          </div>
        )}

        {/* Manual Discounts */}
        {manualDiscounts.length > 0 && (
          <div className="space-y-2">
            {manualDiscounts.map((discount, i) => (
              <DiscountRow
                key={i}
                label={discount.label}
                amount={discount.amount}
                type={discount.type}
                editable
                onLabelChange={(label) => handleDiscountChange(i, { label })}
                onAmountChange={(amount) => handleDiscountChange(i, { amount })}
                onRemove={() => handleRemoveDiscount(i)}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddDiscount}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus size={16} className="mr-1" />
          Add Discount
        </Button>

        {/* Shipping */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Shipping</span>
          <div className="flex items-center gap-2">
            {customerTag === 'contract' && shipping === 0 && (
              <Badge variant="ghost" className="bg-success/10 text-success text-xs">
                FREE
              </Badge>
            )}
            <div className="w-28">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={shipping || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  onShippingChange(isNaN(val) ? 0 : Math.max(0, val))
                }}
                className="h-8 text-right text-sm"
                placeholder="$0.00"
                aria-label="Shipping cost"
              />
            </div>
          </div>
        </div>

        {/* Tax (auto-calculated, non-editable) */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tax (10%)</span>
          <span className="text-sm font-medium text-foreground">{formatCurrency(tax)}</span>
        </div>

        <Separator />

        {/* Grand Total */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">Grand Total</p>
            {totalDiscounts > 0 && (
              <p className="text-xs text-muted-foreground line-through">
                {formatCurrency(originalTotal)}
              </p>
            )}
          </div>
          <p className="text-lg font-semibold text-foreground">{formatCurrency(grandTotal)}</p>
        </div>

        {/* Savings banner */}
        {totalDiscounts > 0 && (
          <div className="rounded-md bg-success/10 px-3 py-2 text-center">
            <span className="text-sm font-medium text-success">
              You save {formatCurrency(totalDiscounts)}!
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
