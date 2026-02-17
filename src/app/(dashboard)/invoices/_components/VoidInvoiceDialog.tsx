'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
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
import { Textarea } from '@shared/ui/primitives/textarea'
import { Label } from '@shared/ui/primitives/label'

type VoidInvoiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
}

export function VoidInvoiceDialog({ open, onOpenChange, invoiceNumber }: VoidInvoiceDialogProps) {
  const [reason, setReason] = useState('')
  const isValid = reason.trim().length > 0

  function handleVoid() {
    toast.success(`${invoiceNumber} has been voided`)
    setReason('')
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-error" />
            Void {invoiceNumber}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The invoice will be permanently voided and no further
            payments can be recorded against it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="void-reason">Reason for voiding</Label>
          <Textarea
            id="void-reason"
            placeholder="Enter a reason for voiding this invoice..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-20"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason('')}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVoid}
            disabled={!isValid}
            className="bg-error text-white hover:bg-error/90"
          >
            Void Invoice
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
