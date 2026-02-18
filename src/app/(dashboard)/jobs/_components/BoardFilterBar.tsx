'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Filter, X, LayoutGrid } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { Badge } from '@shared/ui/primitives/badge'
import { Button } from '@shared/ui/primitives/button'
import { Switch } from '@shared/ui/primitives/switch'
import { Label } from '@shared/ui/primitives/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/primitives/select'
import { RISK_LABELS, SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS } from '@domain/constants'
import { ENTITY_STYLES } from '@domain/constants/entities'
import { ENTITY_ICONS } from '@shared/constants/entity-icons'
import { SERVICE_TYPE_ICONS } from '@shared/ui/organisms/ServiceTypeBadge'
import { z } from 'zod'
import { riskLevelEnum } from '@domain/entities/job'
import { serviceTypeEnum } from '@domain/entities/quote'
import type { RiskLevel } from '@domain/entities/job'
import type { ServiceType } from '@domain/entities/quote'
import type { CardFilters } from '@domain/rules/job.rules'

const horizonEnum = z.enum(['past_due', 'this_week', 'next_week'])
const cardTypeEnum = z.enum(['all', 'jobs', 'quotes'])

export type CardTypeFilter = z.infer<typeof cardTypeEnum>

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'screen-print', label: SERVICE_TYPE_LABELS['screen-print'] },
  { value: 'dtf', label: SERVICE_TYPE_LABELS['dtf'] },
  { value: 'embroidery', label: SERVICE_TYPE_LABELS['embroidery'] },
]

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: 'on_track', label: RISK_LABELS['on_track'] },
  { value: 'getting_tight', label: RISK_LABELS['getting_tight'] },
  { value: 'at_risk', label: RISK_LABELS['at_risk'] },
]

const HORIZON_OPTIONS: {
  value: 'past_due' | 'this_week' | 'next_week'
  label: string
}[] = [
  { value: 'past_due', label: 'Past Due' },
  { value: 'this_week', label: 'Due This Week' },
  { value: 'next_week', label: 'Due Next Week' },
]

// ---------------------------------------------------------------------------
// Hook: read filters from URL
// ---------------------------------------------------------------------------

export function useFiltersFromURL(): CardFilters {
  const searchParams = useSearchParams()

  const today = searchParams.get('today') === 'true'
  const serviceType = serviceTypeEnum.safeParse(searchParams.get('serviceType')).data
  const risk = riskLevelEnum.safeParse(searchParams.get('risk')).data
  const horizon = horizonEnum.safeParse(searchParams.get('horizon')).data

  return { today: today || undefined, serviceType, risk, horizon }
}

export function useCardTypeFromURL(): CardTypeFilter {
  const searchParams = useSearchParams()
  return cardTypeEnum.safeParse(searchParams.get('cardType')).data ?? 'all'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoardFilterBar() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const filters = useFiltersFromURL()

  const activeCount = [filters.today, filters.serviceType, filters.risk, filters.horizon].filter(
    Boolean
  ).length

  // --- URL update helper ---
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams()
    const currentCardType = searchParams.get('cardType')
    if (currentCardType) params.set('cardType', currentCardType)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const cardType = useCardTypeFromURL()

  return (
    <div role="group" aria-label="Board filters" className="flex flex-wrap items-center gap-3">
      {/* Card type filter: All / Jobs / Quotes */}
      <div
        role="group"
        aria-label="Card type filter"
        className="flex items-center rounded-md border border-border/50 p-0.5"
      >
        <Button
          variant="ghost"
          size="xs"
          className={cn(
            'gap-1 rounded-sm px-2 py-1 text-xs',
            cardType === 'all' ? 'bg-surface text-foreground' : 'text-muted-foreground'
          )}
          aria-pressed={cardType === 'all'}
          onClick={() => setParam('cardType', null)}
        >
          <LayoutGrid className="size-3" />
          All
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className={cn(
            'gap-1 rounded-sm px-2 py-1 text-xs',
            cardType === 'jobs' ? 'bg-surface text-foreground' : 'text-muted-foreground'
          )}
          aria-pressed={cardType === 'jobs'}
          onClick={() => setParam('cardType', 'jobs')}
        >
          <ENTITY_ICONS.job
            className={cn('size-3', cardType === 'jobs' && ENTITY_STYLES.job.color)}
          />
          Jobs
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className={cn(
            'gap-1 rounded-sm px-2 py-1 text-xs',
            cardType === 'quotes' ? 'bg-surface text-foreground' : 'text-muted-foreground'
          )}
          aria-pressed={cardType === 'quotes'}
          onClick={() => setParam('cardType', 'quotes')}
        >
          <ENTITY_ICONS.quote
            className={cn('size-3', cardType === 'quotes' && ENTITY_STYLES.quote.color)}
          />
          Quotes
        </Button>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border/50" />

      {/* Filter icon + count */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Filter className="size-4" />
        {activeCount > 0 && (
          <Badge
            variant="ghost"
            className="bg-action/10 text-action border border-action/20 text-[10px]"
          >
            {activeCount}
          </Badge>
        )}
      </div>

      {/* Service Type */}
      <Select
        value={filters.serviceType ?? 'all'}
        onValueChange={(v) => setParam('serviceType', v === 'all' ? null : v)}
      >
        <SelectTrigger
          className={cn(
            'h-7 w-auto gap-1 rounded-md border-border/50 bg-transparent px-2 text-xs',
            filters.serviceType && 'border-action/40 text-action'
          )}
        >
          <SelectValue placeholder="Service Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Service Types</SelectItem>
          {SERVICE_TYPE_OPTIONS.map((opt) => {
            const Icon = SERVICE_TYPE_ICONS[opt.value]
            return (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="inline-flex items-center gap-1.5">
                  <Icon className={cn('size-3.5', SERVICE_TYPE_COLORS[opt.value])} />
                  {opt.label}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {/* Risk filter */}
      <Select
        value={filters.risk ?? 'all'}
        onValueChange={(v) => setParam('risk', v === 'all' ? null : v)}
      >
        <SelectTrigger
          className={cn(
            'h-7 w-auto gap-1 rounded-md border-border/50 bg-transparent px-2 text-xs',
            filters.risk && 'border-action/40 text-action'
          )}
        >
          <SelectValue placeholder="Risk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk</SelectItem>
          {RISK_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Horizon filter */}
      <Select
        value={filters.horizon ?? 'all'}
        onValueChange={(v) => setParam('horizon', v === 'all' ? null : v)}
      >
        <SelectTrigger
          className={cn(
            'h-7 w-auto gap-1 rounded-md border-border/50 bg-transparent px-2 text-xs',
            filters.horizon && 'border-action/40 text-action'
          )}
        >
          <SelectValue placeholder="Horizon" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Due Dates</SelectItem>
          {HORIZON_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Today toggle */}
      <div className="flex items-center gap-1.5">
        <Switch
          id="today-filter"
          size="sm"
          checked={!!filters.today}
          onCheckedChange={(checked) => setParam('today', checked ? 'true' : null)}
        />
        <Label htmlFor="today-filter" className="text-xs text-muted-foreground cursor-pointer">
          Today
        </Label>
      </div>

      {/* Clear all */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={clearAll}
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
