'use client'

import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/ui/primitives/dialog'
import { Button } from '@shared/ui/primitives/button'
import { Textarea } from '@shared/ui/primitives/textarea'

type BlockReasonDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardLabel: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export function BlockReasonDialog({
  open,
  onOpenChange,
  cardLabel,
  onConfirm,
  onCancel,
}: BlockReasonDialogProps) {
  const [reason, setReason] = useState('')

  function handleConfirm() {
    if (!reason.trim()) return
    onConfirm(reason.trim())
    setReason('')
  }

  function handleCancel() {
    setReason('')
    onCancel()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleCancel()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-error" />
            Block Card
          </DialogTitle>
          <DialogDescription>
            Why is <span className="font-medium text-foreground">{cardLabel}</span> blocked?
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="e.g. Waiting on art approval from customer…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-20"
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
