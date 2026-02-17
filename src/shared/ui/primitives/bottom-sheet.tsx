'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@shared/ui/primitives/sheet'
import { cn } from '@shared/lib/cn'

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('max-h-(--mobile-sheet-max-height) rounded-t-xl', className)}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="overflow-y-auto pb-safe">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
