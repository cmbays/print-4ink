'use client'

import { Check, ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@shared/ui/primitives/collapsible'
type CollapsibleSectionProps = {
  title: string
  icon?: React.ReactNode
  summary?: React.ReactNode
  isComplete?: boolean
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  icon,
  summary,
  isComplete,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-lg border border-border bg-elevated"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-surface/50 transition-colors rounded-t-lg">
        <span className="flex items-center gap-2">
          {icon}
          {title}
          {isComplete && (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-success/20 text-success">
              <Check size={12} />
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {summary && (
            <span className="text-xs text-muted-foreground font-normal truncate max-w-[400px]">
              {summary}
            </span>
          )}
          <ChevronDown
            size={16}
            className="shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180"
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
