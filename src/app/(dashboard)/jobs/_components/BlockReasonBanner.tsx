'use client'

import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { formatDate } from '@shared/lib/format'

type BlockReasonBannerProps = {
  blockReason: string | undefined
  blockedAt?: string
  blockedBy?: string
  onUnblock: () => void
}

export function BlockReasonBanner({
  blockReason,
  blockedAt,
  blockedBy,
  onUnblock,
}: BlockReasonBannerProps) {
  if (!blockReason) return null

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-error">Blocked</p>
        <p className="mt-0.5 text-sm text-foreground">{blockReason}</p>
        {(blockedAt || blockedBy) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {blockedAt && <>Blocked on {formatDate(blockedAt)}</>}
            {blockedAt && blockedBy && <> &middot; </>}
            {blockedBy && <>by {blockedBy}</>}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 border-success/30 text-success hover:bg-success/10 hover:text-success"
        onClick={onUnblock}
      >
        <ShieldCheck className="size-3.5" />
        Unblock
      </Button>
    </div>
  )
}
