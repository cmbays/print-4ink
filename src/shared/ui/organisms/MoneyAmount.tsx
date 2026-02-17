import { cn } from '@shared/lib/cn'
import { formatCurrency, formatCurrencyCompact } from '@domain/lib/money'

type MoneyAmountProps = {
  /** Numeric amount (or pre-formatted string — dollar sign is split off automatically) */
  value: number | string
  /** "standard" = 2 decimals, "compact" = 0 decimals */
  format?: 'standard' | 'compact'
  className?: string
}

/**
 * Renders a currency amount with a green dollar sign and white number.
 * Design standard: dollar sign uses `text-success`, amount uses inherited text color.
 */
export function MoneyAmount({ value, format = 'standard', className }: MoneyAmountProps) {
  const formatted =
    typeof value === 'string'
      ? value
      : format === 'compact'
        ? formatCurrencyCompact(value)
        : formatCurrency(value)

  // Split "$1,234.56" into ["$", "1,234.56"]
  const match = formatted.match(/^(\$)(.*)/)
  if (!match) return <span className={cn('tabular-nums', className)}>{formatted}</span>

  return (
    <span className={cn('tabular-nums', className)}>
      <span className="text-success">$</span>
      {match[2]}
    </span>
  )
}
