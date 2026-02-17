'use client'

import { useState, useMemo } from 'react'
import { CreditCard, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui/primitives/dialog'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'
import { Checkbox } from '@shared/ui/primitives/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import { CREDIT_MEMO_REASON_LABELS } from '@domain/constants'
import { money, round2, toNumber, formatCurrency } from '@domain/lib/money'
import { creditMemoReasonEnum } from '@domain/entities/credit-memo'
import type { CreditMemoReason, CreditMemo } from '@domain/entities/credit-memo'
import type { Invoice } from '@domain/entities/invoice'

type CreateCreditMemoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice
  existingCreditMemos: CreditMemo[]
}

type LineItemCredit = {
  id: string
  description: string
  maxCredit: number
  creditAmount: string
  selected: boolean
}

export function CreateCreditMemoModal({
  open,
  onOpenChange,
  invoice,
  existingCreditMemos,
}: CreateCreditMemoModalProps) {
  const [reason, setReason] = useState<CreditMemoReason | ''>('')
  const [lineItems, setLineItems] = useState<LineItemCredit[]>(() =>
    invoice.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      maxCredit: item.lineTotal,
      creditAmount: item.lineTotal.toFixed(2),
      selected: false,
    }))
  )

  // State resets naturally: parent must conditionally render
  // this component ({showCM && <CreateCreditMemoModal />})
  // so it unmounts on close and remounts fresh on open.

  const existingCreditTotal = useMemo(
    () =>
      toNumber(existingCreditMemos.reduce((sum, cm) => sum.plus(money(cm.totalCredit)), money(0))),
    [existingCreditMemos]
  )

  const maxAllowedCredit = toNumber(money(invoice.total).minus(money(existingCreditTotal)))

  const totalCredit = useMemo(
    () =>
      toNumber(
        round2(
          lineItems
            .filter((item) => item.selected)
            .reduce((sum, item) => sum.plus(money(parseFloat(item.creditAmount) || 0)), money(0))
        )
      ),
    [lineItems]
  )

  const isOverLimit = money(totalCredit).gt(money(maxAllowedCredit))
  const hasSelectedItems = lineItems.some((item) => item.selected)
  const isValid = reason !== '' && hasSelectedItems && totalCredit > 0 && !isOverLimit

  function toggleItem(id: string) {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    )
  }

  function updateCreditAmount(id: string, value: string) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const parsed = parseFloat(value)
        const clamped = isNaN(parsed) ? value : String(Math.min(parsed, item.maxCredit))
        return { ...item, creditAmount: clamped }
      })
    )
  }

  function handleSubmit() {
    toast.success(
      `Credit memo for ${formatCurrency(totalCredit)} created on ${invoice.invoiceNumber}`
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-action" />
            Create Credit Memo
          </DialogTitle>
          <DialogDescription>Issue a credit against {invoice.invoiceNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credit-reason">Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as CreditMemoReason)}>
              <SelectTrigger className="w-full" id="credit-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {creditMemoReasonEnum.options.map((r) => (
                  <SelectItem key={r} value={r}>
                    {CREDIT_MEMO_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Line Items</Label>
            <div className="rounded-md border border-border divide-y divide-border">
              {lineItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 px-4 py-2">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleItem(item.id)}
                    aria-label={`Select ${item.description}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Max: {formatCurrency(item.maxCredit)}
                    </p>
                  </div>
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.maxCredit}
                      value={item.creditAmount}
                      onChange={(e) => updateCreditAmount(item.id, e.target.value)}
                      aria-label={`Credit amount for ${item.description}`}
                      className="pl-5 h-8 text-sm font-mono"
                      disabled={!item.selected}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-elevated px-4 py-2">
            <span className="text-sm font-medium text-muted-foreground">Total Credit</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {formatCurrency(totalCredit)}
            </span>
          </div>

          {existingCreditTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              Existing credits: {formatCurrency(existingCreditTotal)} &mdash; Maximum remaining:{' '}
              {formatCurrency(maxAllowedCredit)}
            </p>
          )}

          {isOverLimit && (
            <div
              className="flex items-start gap-2 rounded-md border border-error/30 bg-error/10 p-3"
              role="alert"
            >
              <AlertTriangle className="size-4 mt-0.5 text-error shrink-0" />
              <p className="text-sm text-error">
                Total credit ({formatCurrency(totalCredit)}) exceeds the maximum allowed (
                {formatCurrency(maxAllowedCredit)})
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            <CreditCard className="size-4" />
            Issue Credit Memo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
