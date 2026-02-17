import { cn } from '@shared/lib/cn'

export type TaskProgressBarProps = {
  completed: number
  total: number
  showLabel?: boolean
  className?: string
}

export function TaskProgressBar({
  completed,
  total,
  showLabel = true,
  className,
}: TaskProgressBarProps) {
  if (total === 0) {
    return (
      <span
        className={cn('inline-flex items-center gap-2 text-xs text-muted-foreground', className)}
      >
        <span className="h-1.5 w-16 rounded-full bg-muted" />
        {showLabel && <span>&mdash;</span>}
      </span>
    )
  }

  const percentage = Math.round((completed / total) * 100)
  const allComplete = completed >= total

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${completed} of ${total} tasks complete`}
      >
        <span
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all',
            allComplete ? 'bg-success' : 'bg-action'
          )}
          style={{ width: `${percentage}%` }}
        />
      </span>
      {showLabel && (
        <span
          className={cn(
            'text-xs tabular-nums',
            allComplete ? 'text-success' : 'text-secondary-foreground'
          )}
        >
          {completed}/{total}
        </span>
      )}
    </span>
  )
}
